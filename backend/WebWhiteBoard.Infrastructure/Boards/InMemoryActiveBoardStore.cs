using System.Collections.Concurrent;
using WebWhiteBoard.Application.Boards;
using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Infrastructure.Boards;

public sealed class InMemoryActiveBoardStore : IActiveBoardStore
{
    private readonly ConcurrentDictionary<Guid, Lazy<Task<BoardAggregate>>> _boards = new();
    private readonly IBoardRepository _repository;

    public InMemoryActiveBoardStore(IBoardRepository repository)
    {
        _repository = repository;
    }

    public Task<BoardAggregate> GetOrCreateAsync(Guid boardId, CancellationToken cancellationToken)
    {
        var lazyBoard = _boards.GetOrAdd(
            boardId,
            id => new Lazy<Task<BoardAggregate>>(() => LoadBoardAsync(id, cancellationToken)));

        return lazyBoard.Value;
    }

    private async Task<BoardAggregate> LoadBoardAsync(Guid boardId, CancellationToken cancellationToken)
    {
        var snapshot = await _repository.LoadAsync(boardId, cancellationToken);
        return snapshot is null
            ? new BoardAggregate(boardId)
            : BoardAggregate.FromSnapshot(snapshot);
    }
}
