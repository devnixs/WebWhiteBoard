using System.Net.Http.Json;
using System.Net.WebSockets;
using System.Text.Json;
using Xunit.Abstractions;

namespace WebWhiteBoard.Api.IntegrationTests;

[Collection(BackendIntegrationCollection.Name)]
public sealed class BoardActionCollaborationIntegrationTests
{
    private readonly PostgresFixture _postgres;
    private readonly ITestOutputHelper _output;

    public BoardActionCollaborationIntegrationTests(PostgresFixture postgres, ITestOutputHelper output)
    {
        _postgres = postgres;
        _output = output;
    }

    [Fact]
    public async Task ConcurrentShapeAdds_FromTwoParticipants_BothPersistAndBroadcast()
    {
        var connectionString = _postgres.CreateDatabaseConnectionString();
        var boardId = Guid.NewGuid();

        await using var api = await ApiProcessHost.StartAsync(connectionString);
        using var client = api.CreateClient();

        using (var createResponse = await client.PostAsJsonAsync("/boards", new { boardId }))
        {
            createResponse.EnsureSuccessStatusCode();
        }

        using var alice = await ConnectAndJoinAsync(api, boardId, "alice-session", "Alice", "#ff6600");
        using var bob = await ConnectAndJoinAsync(api, boardId, "bob-session", "Bob", "#0066ff");

        await DrainParticipantJoinedAsync(alice);

        var aliceElement = BuildShapeElement("element-alice", color: "blue", x: 50, y: 60);
        var bobElement = BuildShapeElement("element-bob", color: "red", x: 200, y: 220);

        var aliceSend = alice.SendJsonAsync(new
        {
            type = "shape.added",
            boardId,
            actorId = "alice-session",
            elementId = "element-alice",
            element = aliceElement
        });
        var bobSend = bob.SendJsonAsync(new
        {
            type = "shape.added",
            boardId,
            actorId = "bob-session",
            elementId = "element-bob",
            element = bobElement
        });

        await Task.WhenAll(aliceSend, bobSend);

        var aliceReceived = await CollectShapeBroadcastsAsync(alice, expected: 2);
        var bobReceived = await CollectShapeBroadcastsAsync(bob, expected: 2);

        AssertReceivedBoth(aliceReceived);
        AssertReceivedBoth(bobReceived);

        AssertMonotonicSequence(aliceReceived);
        AssertMonotonicSequence(bobReceived);

        using var boardResponse = await client.GetAsync($"/boards/{boardId}");
        boardResponse.EnsureSuccessStatusCode();
        var payload = await boardResponse.Content.ReadFromJsonAsync<JsonElement>();
        var elements = payload
            .GetProperty("snapshot")
            .GetProperty("document")
            .GetProperty("store")
            .GetProperty("elements")
            .EnumerateArray()
            .ToArray();

        Assert.Contains(elements, element => element.GetProperty("id").GetString() == "element-alice");
        Assert.Contains(elements, element => element.GetProperty("id").GetString() == "element-bob");

        await CloseSocketAsync(alice);
        await CloseSocketAsync(bob);
    }

    [Fact]
    public async Task UpdateAfterDelete_ForSameElement_DoesNotResurrectShape()
    {
        var connectionString = _postgres.CreateDatabaseConnectionString();
        var boardId = Guid.NewGuid();

        await using var api = await ApiProcessHost.StartAsync(connectionString);
        using var client = api.CreateClient();

        using (var createResponse = await client.PostAsJsonAsync("/boards", new { boardId }))
        {
            createResponse.EnsureSuccessStatusCode();
        }

        using var alice = await ConnectAndJoinAsync(api, boardId, "alice-session", "Alice", "#ff6600");
        using var bob = await ConnectAndJoinAsync(api, boardId, "bob-session", "Bob", "#0066ff");

        await DrainParticipantJoinedAsync(alice);

        const string sharedElementId = "shared-element";
        var initial = BuildShapeElement(sharedElementId, color: "blue", x: 10, y: 20);

        await alice.SendJsonAsync(new
        {
            type = "shape.added",
            boardId,
            actorId = "alice-session",
            elementId = sharedElementId,
            element = initial
        });

        // Both clients observe the add so they share a baseline before the conflict.
        await ReceiveByTypeAsync(alice, "shape.added");
        await ReceiveByTypeAsync(bob, "shape.added");

        // Bob deletes first, then Alice tries to update. Deterministic LWW
        // resolves this as: delete wins, subsequent update on a missing element
        // is dropped silently (COLLAB-023).
        await bob.SendJsonAsync(new
        {
            type = "shape.deleted",
            boardId,
            actorId = "bob-session",
            elementId = sharedElementId
        });

        await ReceiveByTypeAsync(alice, "shape.deleted");
        await ReceiveByTypeAsync(bob, "shape.deleted");

        var updated = BuildShapeElement(sharedElementId, color: "red", x: 99, y: 99);
        await alice.SendJsonAsync(new
        {
            type = "shape.updated",
            boardId,
            actorId = "alice-session",
            elementId = sharedElementId,
            element = updated
        });

        // The server must NOT broadcast a shape.updated after the delete; assert
        // by sending a follow-up ping and confirming we see only the pong.
        await alice.SendJsonAsync(new
        {
            type = "ping",
            nonce = "after-update",
            clientSentAtUnixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        });

        var nextForAlice = await alice.ReceiveJsonAsync();
        Assert.Equal("pong", nextForAlice.GetProperty("type").GetString());

        using var boardResponse = await client.GetAsync($"/boards/{boardId}");
        boardResponse.EnsureSuccessStatusCode();
        var payload = await boardResponse.Content.ReadFromJsonAsync<JsonElement>();
        var document = payload.GetProperty("snapshot").GetProperty("document");

        if (document.ValueKind == JsonValueKind.Object
            && document.TryGetProperty("store", out var store)
            && store.TryGetProperty("elements", out var elements)
            && elements.ValueKind == JsonValueKind.Array)
        {
            foreach (var element in elements.EnumerateArray())
            {
                Assert.NotEqual(sharedElementId, element.GetProperty("id").GetString());
            }
        }

        await CloseSocketAsync(alice);
        await CloseSocketAsync(bob);
    }

    private static object BuildShapeElement(string id, string color, double x, double y)
    {
        return new
        {
            id,
            type = "shape",
            shape = "rectangle",
            color,
            size = "m",
            position = new { x, y },
            width = 120,
            height = 80,
            rotation = 0
        };
    }

    private static void AssertReceivedBoth(IReadOnlyList<JsonElement> messages)
    {
        Assert.Equal(2, messages.Count);
        Assert.Contains(messages, message => message.GetProperty("elementId").GetString() == "element-alice");
        Assert.Contains(messages, message => message.GetProperty("elementId").GetString() == "element-bob");
    }

    private static void AssertMonotonicSequence(IReadOnlyList<JsonElement> messages)
    {
        var sequences = messages
            .Select(message => message.GetProperty("sequence").GetInt64())
            .ToArray();

        Assert.Equal(sequences.Length, sequences.Distinct().Count());
        Assert.All(sequences, sequence => Assert.True(sequence > 0, "Sequence numbers must be positive."));
    }

    private static async Task<List<JsonElement>> CollectShapeBroadcastsAsync(WebSocket socket, int expected)
    {
        var collected = new List<JsonElement>();
        while (collected.Count < expected)
        {
            var message = await socket.ReceiveJsonAsync();
            var type = message.GetProperty("type").GetString();
            if (type == "shape.added" || type == "shape.updated" || type == "shape.deleted" || type == "shape.reordered")
            {
                collected.Add(message);
            }
        }

        return collected;
    }

    private static async Task<JsonElement> ReceiveByTypeAsync(WebSocket socket, string type)
    {
        while (true)
        {
            var message = await socket.ReceiveJsonAsync();
            if (message.GetProperty("type").GetString() == type)
            {
                return message;
            }
        }
    }

    private static async Task DrainParticipantJoinedAsync(WebSocket socket)
    {
        var message = await socket.ReceiveJsonAsync();
        if (message.GetProperty("type").GetString() != "participant.joined")
        {
            throw new InvalidOperationException(
                $"Expected participant.joined broadcast, received '{message.GetProperty("type").GetString()}'.");
        }
    }

    private static async Task<WebSocket> ConnectAndJoinAsync(
        ApiProcessHost api,
        Guid boardId,
        string sessionId,
        string displayName,
        string color)
    {
        var socket = new ClientWebSocket();
        await socket.ConnectAsync(api.CreateWebSocketUri(boardId), CancellationToken.None);
        await socket.SendJsonAsync(new
        {
            type = "session.join",
            participant = new { sessionId, displayName, color }
        });

        var readyMessage = await socket.ReceiveJsonAsync();
        if (readyMessage.GetProperty("type").GetString() != "session.ready")
        {
            throw new InvalidOperationException("session.ready was not the first message after join.");
        }

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
