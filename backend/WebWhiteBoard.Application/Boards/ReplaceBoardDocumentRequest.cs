using System.Text.Json;

namespace WebWhiteBoard.Application.Boards;

public sealed record ReplaceBoardDocumentRequest(
    Guid BoardId,
    string ActorId,
    JsonElement Document);
