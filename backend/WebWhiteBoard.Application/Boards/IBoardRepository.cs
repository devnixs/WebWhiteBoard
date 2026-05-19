using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Application.Boards;

public interface IBoardRepository
{
    Task<BoardSnapshot?> LoadAsync(Guid boardId, CancellationToken cancellationToken);

    Task SaveAsync(BoardSnapshot snapshot, CancellationToken cancellationToken);
}
