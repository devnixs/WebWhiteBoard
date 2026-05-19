namespace WebWhiteBoard.Domain.Boards;

public sealed record ParticipantSession(
    string SessionId,
    string DisplayName,
    string Color);
