using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using System.Net.WebSockets;
using WebWhiteBoard.Api.Contracts;
using WebWhiteBoard.Application.Assets;
using WebWhiteBoard.Api.Realtime;
using WebWhiteBoard.Application.Boards;
using WebWhiteBoard.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRouting();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowAnyOrigin();
    });
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<IBoardCommandService, BoardCommandService>();
builder.Services.AddSingleton<BoardRealtimeSessionCoordinator>();
builder.Services.AddWhiteBoardInfrastructure(builder.Configuration, builder.Environment.ContentRootPath);

var app = builder.Build();
var assetStorageOptions = app.Services.GetRequiredService<AssetStorageOptions>();

app.UseCors();
app.UseWebSockets();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(assetStorageOptions.UploadFolderPath),
    RequestPath = assetStorageOptions.PublicUrlPrefix,
    ContentTypeProvider = new FileExtensionContentTypeProvider()
});

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    utc = DateTimeOffset.UtcNow
}));

app.MapPost("/boards", async (
    CreateBoardHttpRequest request,
    IBoardCommandService commandService,
    CancellationToken cancellationToken) =>
{
    var boardId = await commandService.CreateBoardAsync(
        new CreateBoardRequest(request.BoardId),
        cancellationToken);

    return Results.Created($"/board/{boardId}", new { boardId });
});

app.MapGet("/boards/{boardId:guid}", async (
    Guid boardId,
    IBoardCommandService commandService,
    CancellationToken cancellationToken) =>
{
    var board = await commandService.GetBoardAsync(boardId, cancellationToken);
    return Results.Ok(board);
});

app.MapPost("/boards/{boardId:guid}/actions", async (
    Guid boardId,
    ApplyBoardActionHttpRequest request,
    IBoardCommandService commandService,
    CancellationToken cancellationToken) =>
{
    if (request.Action.BoardId != boardId)
    {
        return Results.BadRequest(new { error = "Board route id does not match the action payload." });
    }

    var result = await commandService.ApplyActionAsync(request.Action, cancellationToken);
    return Results.Accepted($"/boards/{boardId}", result);
});

app.MapPost("/assets", async (
    HttpRequest request,
    IAssetStorage assetStorage,
    AssetStorageOptions options,
    CancellationToken cancellationToken) =>
{
    if (!request.HasFormContentType)
    {
        return Results.Json(
            new { error = "Expected a multipart/form-data request." },
            statusCode: StatusCodes.Status400BadRequest);
    }

    var form = await request.ReadFormAsync(cancellationToken);
    if (form.Files.Count != 1)
    {
        return Results.Json(
            new { error = "Expected exactly one uploaded file." },
            statusCode: StatusCodes.Status400BadRequest);
    }

    var file = form.Files[0];
    if (file.Length <= 0)
    {
        return Results.Json(
            new { error = "Uploaded file must not be empty." },
            statusCode: StatusCodes.Status400BadRequest);
    }

    if (file.Length > options.MaxUploadSizeBytes)
    {
        return Results.Json(
            new { error = $"Uploaded file exceeds the {options.MaxUploadSizeBytes}-byte limit." },
            statusCode: StatusCodes.Status413PayloadTooLarge);
    }

    if (!AssetUploadContentTypes.TryGetExtension(file.ContentType, out _))
    {
        return Results.Json(
            new { error = $"Unsupported content type '{file.ContentType}'." },
            statusCode: StatusCodes.Status415UnsupportedMediaType);
    }

    await using var stream = file.OpenReadStream();
    var storedAsset = await assetStorage.SaveAsync(
        new StoreAssetRequest(stream, file.ContentType),
        cancellationToken);

    return Results.Ok(new AssetUploadHttpResponse(storedAsset.PublicUrl));
});

app.Map("/ws/boards/{boardId:guid}", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }

    if (!Guid.TryParse(context.Request.RouteValues["boardId"]?.ToString(), out var boardId))
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }

    var coordinator = context.RequestServices.GetRequiredService<BoardRealtimeSessionCoordinator>();
    using var socket = await context.WebSockets.AcceptWebSocketAsync();
    await coordinator.HandleConnectionAsync(boardId, socket, context.RequestAborted);
});

app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;
