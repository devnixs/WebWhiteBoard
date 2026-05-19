using System.Text.Json;
using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Application.Boards;

public sealed class BoardCommandService : IBoardCommandService
{
    private readonly IActiveBoardStore _activeBoardStore;
    private readonly IBoardPersistenceScheduler _persistenceScheduler;

    public BoardCommandService(
        IActiveBoardStore activeBoardStore,
        IBoardPersistenceScheduler persistenceScheduler)
    {
        _activeBoardStore = activeBoardStore;
        _persistenceScheduler = persistenceScheduler;
    }

    public async Task<BoardEnvelope> GetBoardAsync(Guid boardId, CancellationToken cancellationToken)
    {
        var board = await _activeBoardStore.GetOrCreateAsync(boardId, cancellationToken);
        return new BoardEnvelope(board.ToSnapshot(), []);
    }

    public async Task<Guid> CreateBoardAsync(CreateBoardRequest request, CancellationToken cancellationToken)
    {
        var boardId = request.BoardId ?? Guid.NewGuid();
        var board = await _activeBoardStore.GetOrCreateAsync(boardId, cancellationToken);
        await PersistSnapshotAsync(board.ToSnapshot(), cancellationToken);
        return board.BoardId;
    }

    public async Task<BoardMutationResult> ApplyActionAsync(BoardAction action, CancellationToken cancellationToken)
    {
        var board = await _activeBoardStore.GetOrCreateAsync(action.BoardId, cancellationToken);
        board.Apply(action);

        var snapshot = board.ToSnapshot();
        await PersistSnapshotAsync(snapshot, cancellationToken);

        return new BoardMutationResult(snapshot, action);
    }

    public async Task<BoardMutationResult> ReplaceDocumentAsync(
        ReplaceBoardDocumentRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ActorId);
        ValidateDocument(request.Document);

        var board = await _activeBoardStore.GetOrCreateAsync(request.BoardId, cancellationToken);
        var action = new BoardDocumentReplacedAction(
            Guid.NewGuid(),
            request.BoardId,
            request.ActorId,
            DateTimeOffset.UtcNow,
            request.Document.Clone());

        board.Apply(action);

        var snapshot = board.ToSnapshot();
        await PersistSnapshotAsync(snapshot, cancellationToken);

        return new BoardMutationResult(snapshot, action);
    }

    public async Task<BoardSnapshot> UpdateCursorAsync(
        UpdateBoardCursorRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ActorId);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.DisplayName);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Color);

        if (!double.IsFinite(request.X) || !double.IsFinite(request.Y))
        {
            throw new ArgumentException("Cursor coordinates must be finite.");
        }

        var board = await _activeBoardStore.GetOrCreateAsync(request.BoardId, cancellationToken);
        var action = new BoardCursorMovedAction(
            Guid.NewGuid(),
            request.BoardId,
            request.ActorId,
            DateTimeOffset.UtcNow,
            new CursorPresence(
                request.ActorId,
                request.DisplayName,
                request.Color,
                request.X,
                request.Y,
                DateTimeOffset.UtcNow));

        board.Apply(action);
        return board.ToSnapshot();
    }

    public async Task<BoardSnapshot> ClearCursorAsync(
        Guid boardId,
        string actorId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);

        var board = await _activeBoardStore.GetOrCreateAsync(boardId, cancellationToken);
        board.RemoveCursor(actorId, DateTimeOffset.UtcNow);
        return board.ToSnapshot();
    }

    private async Task PersistSnapshotAsync(BoardSnapshot snapshot, CancellationToken cancellationToken)
    {
        await _persistenceScheduler.EnqueueAsync(snapshot with { Cursors = [] }, cancellationToken);
    }

    private static void ValidateDocument(JsonElement document)
    {
        if (document.ValueKind != JsonValueKind.Object)
        {
            throw new ArgumentException("Board document payload must be a JSON object.");
        }

        if (!document.TryGetProperty("schema", out var schema) || schema.ValueKind != JsonValueKind.Object)
        {
            throw new ArgumentException("Board document payload must include a schema object.");
        }

        if (!document.TryGetProperty("store", out var store) || store.ValueKind != JsonValueKind.Object)
        {
            throw new ArgumentException("Board document payload must include a store object.");
        }
    }
}
