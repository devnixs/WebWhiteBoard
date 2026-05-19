using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Application.Boards;

public sealed record BoardMutationResult(
    BoardSnapshot Snapshot,
    BoardAction AppliedAction);
