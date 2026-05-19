using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace WebWhiteBoard.Api.IntegrationTests;

public static class WebSocketJsonExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task SendJsonAsync(
        this WebSocket socket,
        object payload,
        CancellationToken cancellationToken = default)
    {
        var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload, JsonOptions));
        await socket.SendAsync(bytes, WebSocketMessageType.Text, true, cancellationToken);
    }

    public static async Task<JsonElement> ReceiveJsonAsync(
        this WebSocket socket,
        CancellationToken cancellationToken = default)
    {
        using var timeout = cancellationToken.CanBeCanceled
            ? null
            : new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var effectiveCancellationToken = timeout?.Token ?? cancellationToken;
        var buffer = new byte[16 * 1024];
        using var stream = new MemoryStream();

        while (true)
        {
            var result = await socket.ReceiveAsync(buffer, effectiveCancellationToken);
            if (result.MessageType == WebSocketMessageType.Close)
            {
                throw new InvalidOperationException("The websocket closed before the expected message was received.");
            }

            stream.Write(buffer, 0, result.Count);
            if (result.EndOfMessage)
            {
                break;
            }
        }

        using var document = JsonDocument.Parse(stream.ToArray());
        return document.RootElement.Clone();
    }
}
