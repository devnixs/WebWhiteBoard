using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Application.Boards;

public interface IActiveBoardStore
{
    Task<BoardAggregate> GetOrCreateAsync(Guid boardId, CancellationToken cancellationToken);
}
