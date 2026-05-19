using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Application.Boards;

public interface IBoardPersistenceScheduler
{
    ValueTask EnqueueAsync(BoardSnapshot snapshot, CancellationToken cancellationToken);
}
