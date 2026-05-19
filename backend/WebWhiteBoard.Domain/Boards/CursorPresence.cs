namespace WebWhiteBoard.Domain.Boards;

public sealed record CursorPresence(
    string ActorId,
    string DisplayName,
    string Color,
    double X,
    double Y,
    DateTimeOffset UpdatedAtUtc);
