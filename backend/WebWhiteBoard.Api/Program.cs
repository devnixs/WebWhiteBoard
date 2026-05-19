using System.Net.WebSockets;
using WebWhiteBoard.Api.Contracts;
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
builder.Services.AddWhiteBoardInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseCors();
app.UseWebSockets();
app.UseDefaultFiles();
app.UseStaticFiles();

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
