namespace WebWhiteBoard.Application.Boards;

public sealed record UpdateBoardCursorRequest(
    Guid BoardId,
    string ActorId,
    string DisplayName,
    string Color,
    double X,
    double Y);
