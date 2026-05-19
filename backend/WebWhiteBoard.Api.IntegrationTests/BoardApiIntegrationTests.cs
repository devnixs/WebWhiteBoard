using System.Net;
using System.Net.Http.Json;
using System.Net.WebSockets;
using System.Text.Json;
using Xunit.Abstractions;

namespace WebWhiteBoard.Api.IntegrationTests;

[Collection(BackendIntegrationCollection.Name)]
public sealed class BoardApiIntegrationTests
{
    private readonly PostgresFixture _postgres;
    private readonly ITestOutputHelper _output;

    public BoardApiIntegrationTests(PostgresFixture postgres, ITestOutputHelper output)
    {
        _postgres = postgres;
        _output = output;
    }

    [Fact]
    public async Task CreateBoardAndLoadBoard_WorkOverHttpAgainstRealPostgres()
    {
        var connectionString = _postgres.CreateDatabaseConnectionString();
        await using var api = await ApiProcessHost.StartAsync(connectionString);
        using var client = api.CreateClient();
        var boardId = Guid.NewGuid();

        _output.WriteLine("Creating board {0}.", boardId);

        using var createResponse = await client.PostAsJsonAsync("/boards", new
        {
            boardId
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createPayload = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(boardId, createPayload.GetProperty("boardId").GetGuid());

        _output.WriteLine("Loading board {0}.", boardId);

        using var boardResponse = await client.GetAsync($"/boards/{boardId}");
        boardResponse.EnsureSuccessStatusCode();

        var boardPayload = await boardResponse.Content.ReadFromJsonAsync<JsonElement>();
        var snapshot = boardPayload.GetProperty("snapshot");

        Assert.Equal(boardId, snapshot.GetProperty("boardId").GetGuid());
        Assert.Equal(0, snapshot.GetProperty("version").GetInt64());
        Assert.Equal(JsonValueKind.Null, snapshot.GetProperty("document").ValueKind);
        Assert.Empty(snapshot.GetProperty("cursors").EnumerateArray());

        await _postgres.WaitForBoardSnapshotAsync(connectionString, boardId, persisted =>
            persisted.GetProperty("boardId").GetGuid() == boardId
            && persisted.GetProperty("version").GetInt64() == 0
            && persisted.GetProperty("document").ValueKind == JsonValueKind.Null);
    }

    [Fact]
    public async Task WebSocketCollaborationAndPersistedReload_WorkAgainstRealPostgres()
    {
        var connectionString = _postgres.CreateDatabaseConnectionString();
        var boardId = Guid.NewGuid();

        await using (var firstApi = await ApiProcessHost.StartAsync(connectionString))
        using (var client = firstApi.CreateClient())
        {
            _output.WriteLine("Creating collaboration board {0}.", boardId);

            using var createResponse = await client.PostAsJsonAsync("/boards", new
            {
                boardId
            });

            createResponse.EnsureSuccessStatusCode();

            using var aliceSocket = await ConnectAndJoinAsync(
                firstApi,
                boardId,
                sessionId: "alice-session",
                displayName: "Alice",
                color: "#ff6600",
                _output);
            using var bobSocket = await ConnectAndJoinAsync(
                firstApi,
                boardId,
                sessionId: "bob-session",
                displayName: "Bob",
                color: "#0066ff",
                _output);

            var aliceJoinBroadcast = await aliceSocket.ReceiveJsonAsync();
            Assert.Equal("participant.joined", aliceJoinBroadcast.GetProperty("type").GetString());
            Assert.Equal("bob-session", aliceJoinBroadcast.GetProperty("participant").GetProperty("sessionId").GetString());

            _output.WriteLine("Broadcasting cursor update from Alice.");
            await aliceSocket.SendJsonAsync(new
            {
                type = "cursor.update",
                boardId,
                actorId = "alice-session",
                x = 12.5,
                y = -8.75
            });

            var cursorBroadcast = await bobSocket.ReceiveJsonAsync();
            Assert.Equal("cursor.updated", cursorBroadcast.GetProperty("type").GetString());
            var cursor = cursorBroadcast.GetProperty("cursor");
            Assert.Equal("alice-session", cursor.GetProperty("actorId").GetString());
            Assert.Equal("Alice", cursor.GetProperty("displayName").GetString());
            Assert.Equal("#ff6600", cursor.GetProperty("color").GetString());
            Assert.Equal(12.5, cursor.GetProperty("x").GetDouble());
            Assert.Equal(-8.75, cursor.GetProperty("y").GetDouble());

            using var document = JsonDocument.Parse("""
                {
                  "schema": {
                    "schemaVersion": 2
                  },
                  "store": {
                    "shape:seed": {
                      "id": "shape:seed",
                      "typeName": "shape",
                      "x": 120,
                      "y": 80
                    }
                  }
                }
                """);

            _output.WriteLine("Broadcasting document replace from Alice.");
            await aliceSocket.SendJsonAsync(new
            {
                type = "board.document.replace",
                boardId,
                actorId = "alice-session",
                document = document.RootElement.Clone()
            });

            var aliceDocumentBroadcast = await aliceSocket.ReceiveJsonAsync();
            var bobDocumentBroadcast = await bobSocket.ReceiveJsonAsync();

            Assert.Equal("board.document.updated", aliceDocumentBroadcast.GetProperty("type").GetString());
            Assert.Equal("board.document.updated", bobDocumentBroadcast.GetProperty("type").GetString());
            Assert.Equal(boardId, aliceDocumentBroadcast.GetProperty("boardId").GetGuid());
            Assert.Equal("alice-session", bobDocumentBroadcast.GetProperty("actorId").GetString());

            await _postgres.WaitForBoardSnapshotAsync(connectionString, boardId, persisted =>
            {
                var store = persisted.GetProperty("document").GetProperty("store");
                return persisted.GetProperty("version").GetInt64() == 2
                    && store.TryGetProperty("shape:seed", out _)
                    && persisted.GetProperty("cursors").GetArrayLength() == 0;
            });

            await CloseSocketAsync(aliceSocket);
            await CloseSocketAsync(bobSocket);
        }

        await using var secondApi = await ApiProcessHost.StartAsync(connectionString);
        using var secondClient = secondApi.CreateClient();
        _output.WriteLine("Reloading board {0} in a fresh host.", boardId);
        using var reloadedResponse = await secondClient.GetAsync($"/boards/{boardId}");
        reloadedResponse.EnsureSuccessStatusCode();

        var reloadedBoard = await reloadedResponse.Content.ReadFromJsonAsync<JsonElement>();
        var reloadedSnapshot = reloadedBoard.GetProperty("snapshot");
        var reloadedStore = reloadedSnapshot.GetProperty("document").GetProperty("store");

        Assert.Equal(boardId, reloadedSnapshot.GetProperty("boardId").GetGuid());
        Assert.Equal(2, reloadedSnapshot.GetProperty("version").GetInt64());
        Assert.True(reloadedStore.TryGetProperty("shape:seed", out _));
        Assert.Empty(reloadedSnapshot.GetProperty("cursors").EnumerateArray());
    }

    private static async Task<WebSocket> ConnectAndJoinAsync(
        ApiProcessHost api,
        Guid boardId,
        string sessionId,
        string displayName,
        string color,
        ITestOutputHelper output)
    {
        var socket = new ClientWebSocket();
        await socket.ConnectAsync(api.CreateWebSocketUri(boardId), CancellationToken.None);

        output.WriteLine("Joining board {0} as {1}.", boardId, sessionId);
        await socket.SendJsonAsync(new
        {
            type = "session.join",
            participant = new
            {
                sessionId,
                displayName,
                color
            }
        });

        var readyMessage = await socket.ReceiveJsonAsync();
        output.WriteLine("Received session.ready for {0}.", sessionId);
        Assert.Equal("session.ready", readyMessage.GetProperty("type").GetString());
        Assert.Equal(boardId, readyMessage.GetProperty("boardId").GetGuid());
        Assert.Equal(sessionId, readyMessage.GetProperty("participants")[0].GetProperty("sessionId").GetString());

        return socket;
    }

    private static async Task CloseSocketAsync(WebSocket socket)
    {
        if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
        {
            await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "test complete", CancellationToken.None);
        }
    }
}
