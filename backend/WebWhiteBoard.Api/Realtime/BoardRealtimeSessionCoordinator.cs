using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using WebWhiteBoard.Api.Contracts;
using WebWhiteBoard.Application.Boards;
using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Api.Realtime;

public sealed class BoardRealtimeSessionCoordinator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IBoardCommandService _commandService;
    private readonly ConcurrentDictionary<Guid, BoardRealtimeRoom> _rooms = new();
    private readonly ILogger<BoardRealtimeSessionCoordinator> _logger;

    public BoardRealtimeSessionCoordinator(
        IBoardCommandService commandService,
        ILogger<BoardRealtimeSessionCoordinator> logger)
    {
        _commandService = commandService;
        _logger = logger;
    }

    public async Task HandleConnectionAsync(
        Guid boardId,
        WebSocket socket,
        CancellationToken cancellationToken)
    {
        BoardRealtimeConnection? connection = null;
        BoardRealtimeRoom? room = null;

        try
        {
            var joinMessage = await ReceiveJoinMessageAsync(socket, cancellationToken);
            if (joinMessage is null)
            {
                await CloseSocketAsync(socket, WebSocketCloseStatus.PolicyViolation, "session.join is required.", cancellationToken);
                return;
            }

            var participant = joinMessage.Participant;
            ValidateParticipant(participant);

            room = _rooms.GetOrAdd(boardId, static id => new BoardRealtimeRoom(id));
            connection = new BoardRealtimeConnection(Guid.NewGuid().ToString("n"), participant, socket);

            var currentBoard = await _commandService.GetBoardAsync(boardId, cancellationToken);
            var joinState = room.Join(connection, currentBoard.Snapshot.Cursors);

            await SendAsync(connection, new
            {
                type = "session.ready",
                boardId,
                version = currentBoard.Snapshot.Version,
                document = currentBoard.Snapshot.Document,
                cursors = currentBoard.Snapshot.Cursors,
                participants = joinState.Participants,
                connectedAtUtc = DateTimeOffset.UtcNow
            }, cancellationToken);

            await room.BroadcastAsync(
                exceptConnectionId: connection.ConnectionId,
                payload: new
                {
                    type = "participant.joined",
                    boardId,
                    participant = participant,
                    participants = joinState.Participants
                },
                cancellationToken);

            await ReceiveLoopAsync(boardId, room, connection, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (WebSocketException exception)
        {
            _logger.LogDebug(exception, "Realtime socket closed unexpectedly for board {BoardId}.", boardId);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Realtime connection failed for board {BoardId}.", boardId);

            if (connection is not null && socket.State == WebSocketState.Open)
            {
                await SendAsync(connection, new
                {
                    type = "error",
                    boardId,
                    message = exception.Message
                }, cancellationToken);
            }
        }
        finally
        {
            if (connection is not null && room is not null)
            {
                var leaveState = room.Leave(connection);
                await _commandService.ClearCursorAsync(boardId, connection.Participant.SessionId, CancellationToken.None);

                if (leaveState.ShouldBroadcastLeave)
                {
                    await room.BroadcastAsync(
                        exceptConnectionId: null,
                        payload: new
                        {
                            type = "participant.left",
                            boardId,
                            actorId = connection.Participant.SessionId,
                            participants = leaveState.Participants
                        },
                        CancellationToken.None);

                    await room.BroadcastAsync(
                        exceptConnectionId: null,
                        payload: new
                        {
                            type = "cursor.cleared",
                            boardId,
                            actorId = connection.Participant.SessionId
                        },
                        CancellationToken.None);
                }

                if (room.IsEmpty)
                {
                    _rooms.TryRemove(boardId, out _);
                }
            }

            if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
            {
                await CloseSocketAsync(socket, WebSocketCloseStatus.NormalClosure, "Session closed.", CancellationToken.None);
            }
        }
    }

    private async Task ReceiveLoopAsync(
        Guid boardId,
        BoardRealtimeRoom room,
        BoardRealtimeConnection connection,
        CancellationToken cancellationToken)
    {
        while (connection.Socket.State == WebSocketState.Open)
        {
            var rawMessage = await ReceiveTextMessageAsync(connection.Socket, cancellationToken);
            if (rawMessage is null)
            {
                break;
            }

            var message = JsonSerializer.Deserialize<BoardRealtimeClientMessage>(rawMessage, JsonOptions);
            if (message is null)
            {
                continue;
            }

            switch (message)
            {
                case BoardDocumentReplaceRealtimeMessage documentReplace:
                    await HandleDocumentReplaceAsync(boardId, room, connection, documentReplace, cancellationToken);
                    break;
                case CursorUpdateRealtimeMessage cursorUpdate:
                    await HandleCursorUpdateAsync(boardId, room, connection, cursorUpdate, cancellationToken);
                    break;
                case PingRealtimeMessage ping:
                    await SendAsync(connection, new
                    {
                        type = "pong",
                        nonce = ping.Nonce,
                        clientSentAtUnixMs = ping.ClientSentAtUnixMs,
                        serverSentAtUnixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    }, cancellationToken);
                    break;
                case SessionJoinRealtimeMessage:
                    break;
                default:
                    await SendAsync(connection, new
                    {
                        type = "error",
                        boardId,
                        message = "Unsupported realtime message."
                    }, cancellationToken);
                    break;
            }
        }
    }

    private async Task HandleDocumentReplaceAsync(
        Guid boardId,
        BoardRealtimeRoom room,
        BoardRealtimeConnection connection,
        BoardDocumentReplaceRealtimeMessage message,
        CancellationToken cancellationToken)
    {
        EnsureBoardRouteMatches(boardId, message.BoardId);
        EnsureActorMatches(connection, message.ActorId);

        try
        {
            var result = await _commandService.ReplaceDocumentAsync(
                new ReplaceBoardDocumentRequest(boardId, connection.Participant.SessionId, message.Document),
                cancellationToken);

            await room.BroadcastAsync(
                exceptConnectionId: null,
                payload: new
                {
                    type = "board.document.updated",
                    boardId,
                    actorId = connection.Participant.SessionId,
                    version = result.Snapshot.Version,
                    document = result.Snapshot.Document,
                    updatedAtUtc = result.Snapshot.UpdatedAtUtc
                },
                cancellationToken);
        }
        catch (ArgumentException exception)
        {
            var board = await _commandService.GetBoardAsync(boardId, cancellationToken);
            await SendAsync(connection, new
            {
                type = "board.sync.rejected",
                boardId,
                message = exception.Message,
                version = board.Snapshot.Version,
                document = board.Snapshot.Document
            }, cancellationToken);
        }
    }

    private async Task HandleCursorUpdateAsync(
        Guid boardId,
        BoardRealtimeRoom room,
        BoardRealtimeConnection connection,
        CursorUpdateRealtimeMessage message,
        CancellationToken cancellationToken)
    {
        EnsureBoardRouteMatches(boardId, message.BoardId);
        EnsureActorMatches(connection, message.ActorId);

        var snapshot = await _commandService.UpdateCursorAsync(
            new UpdateBoardCursorRequest(
                boardId,
                connection.Participant.SessionId,
                connection.Participant.DisplayName,
                connection.Participant.Color,
                message.X,
                message.Y),
            cancellationToken);

        var cursor = snapshot.Cursors.FirstOrDefault(item => item.ActorId == connection.Participant.SessionId);
        if (cursor is null)
        {
            return;
        }

        await room.BroadcastAsync(
            exceptConnectionId: connection.ConnectionId,
            payload: new
            {
                type = "cursor.updated",
                boardId,
                cursor
            },
            cancellationToken);
    }

    private static void EnsureBoardRouteMatches(Guid boardId, Guid payloadBoardId)
    {
        if (boardId != payloadBoardId)
        {
            throw new ArgumentException("Board route id does not match the realtime payload.");
        }
    }

    private static void EnsureActorMatches(BoardRealtimeConnection connection, string actorId)
    {
        if (!string.Equals(connection.Participant.SessionId, actorId, StringComparison.Ordinal))
        {
            throw new ArgumentException("Realtime actor id does not match the joined session.");
        }
    }

    private static void ValidateParticipant(ParticipantSession participant)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(participant.SessionId);
        ArgumentException.ThrowIfNullOrWhiteSpace(participant.DisplayName);
        ArgumentException.ThrowIfNullOrWhiteSpace(participant.Color);
    }

    private static async Task<SessionJoinRealtimeMessage?> ReceiveJoinMessageAsync(
        WebSocket socket,
        CancellationToken cancellationToken)
    {
        var rawMessage = await ReceiveTextMessageAsync(socket, cancellationToken);
        if (rawMessage is null)
        {
            return null;
        }

        return JsonSerializer.Deserialize<BoardRealtimeClientMessage>(rawMessage, JsonOptions) as SessionJoinRealtimeMessage;
    }

    private static async Task SendAsync(
        BoardRealtimeConnection connection,
        object payload,
        CancellationToken cancellationToken)
    {
        if (connection.Socket.State != WebSocketState.Open)
        {
            return;
        }

        var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload, JsonOptions));

        await connection.SendLock.WaitAsync(cancellationToken);
        try
        {
            if (connection.Socket.State == WebSocketState.Open)
            {
                await connection.Socket.SendAsync(bytes, WebSocketMessageType.Text, true, cancellationToken);
            }
        }
        finally
        {
            connection.SendLock.Release();
        }
    }

    private static async Task<string?> ReceiveTextMessageAsync(
        WebSocket socket,
        CancellationToken cancellationToken)
    {
        var buffer = new ArraySegment<byte>(new byte[16 * 1024]);
        using var stream = new MemoryStream();

        while (true)
        {
            var result = await socket.ReceiveAsync(buffer, cancellationToken);

            if (result.MessageType == WebSocketMessageType.Close)
            {
                return null;
            }

            stream.Write(buffer.Array!, buffer.Offset, result.Count);

            if (result.EndOfMessage)
            {
                break;
            }
        }

        return Encoding.UTF8.GetString(stream.ToArray());
    }

    private static async Task CloseSocketAsync(
        WebSocket socket,
        WebSocketCloseStatus status,
        string description,
        CancellationToken cancellationToken)
    {
        if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
        {
            await socket.CloseAsync(status, description, cancellationToken);
        }
    }

    private sealed class BoardRealtimeRoom
    {
        private readonly Lock _gate = new();
        private readonly Dictionary<string, BoardRealtimeConnection> _connections = [];

        public BoardRealtimeRoom(Guid boardId)
        {
            BoardId = boardId;
        }

        public Guid BoardId { get; }

        public bool IsEmpty
        {
            get
            {
                lock (_gate)
                {
                    return _connections.Count == 0;
                }
            }
        }

        public JoinState Join(BoardRealtimeConnection connection, IReadOnlyList<CursorPresence> persistedCursors)
        {
            lock (_gate)
            {
                _connections[connection.ConnectionId] = connection;

                foreach (var cursor in persistedCursors)
                {
                    connection.KnownCursors[cursor.ActorId] = cursor;
                }

                return new JoinState(GetParticipantsUnsafe());
            }
        }

        public LeaveState Leave(BoardRealtimeConnection connection)
        {
            lock (_gate)
            {
                _connections.Remove(connection.ConnectionId);
                var shouldBroadcastLeave = !_connections.Values.Any(item =>
                    item.Participant.SessionId == connection.Participant.SessionId);

                return new LeaveState(shouldBroadcastLeave, GetParticipantsUnsafe());
            }
        }

        public async Task BroadcastAsync(
            string? exceptConnectionId,
            object payload,
            CancellationToken cancellationToken)
        {
            BoardRealtimeConnection[] connections;
            lock (_gate)
            {
                connections = _connections.Values
                    .Where(connection => connection.ConnectionId != exceptConnectionId)
                    .ToArray();
            }

            foreach (var connection in connections)
            {
                await SendAsync(connection, payload, cancellationToken);
            }
        }

        private ParticipantSession[] GetParticipantsUnsafe()
        {
            return _connections.Values
                .Select(connection => connection.Participant)
                .GroupBy(participant => participant.SessionId, StringComparer.Ordinal)
                .Select(group => group.First())
                .OrderBy(participant => participant.DisplayName, StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }
    }

    private sealed record JoinState(IReadOnlyList<ParticipantSession> Participants);

    private sealed record LeaveState(bool ShouldBroadcastLeave, IReadOnlyList<ParticipantSession> Participants);

    private sealed class BoardRealtimeConnection
    {
        public BoardRealtimeConnection(string connectionId, ParticipantSession participant, WebSocket socket)
        {
            ConnectionId = connectionId;
            Participant = participant;
            Socket = socket;
        }

        public string ConnectionId { get; }

        public ParticipantSession Participant { get; }

        public WebSocket Socket { get; }

        public SemaphoreSlim SendLock { get; } = new(1, 1);

        public Dictionary<string, CursorPresence> KnownCursors { get; } = [];
    }
}
