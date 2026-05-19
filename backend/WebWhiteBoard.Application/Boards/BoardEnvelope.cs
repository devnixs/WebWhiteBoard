using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Application.Boards;

public sealed record BoardEnvelope(
    BoardSnapshot Snapshot,
    IReadOnlyList<BoardAction> RecentActions);
