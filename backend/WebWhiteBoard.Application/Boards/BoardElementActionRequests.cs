using System.Text.Json;
using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Application.Boards;

public sealed record AddBoardElementRequest(
    Guid BoardId,
    string ActorId,
    string ElementId,
    JsonElement Element);

public sealed record UpdateBoardElementRequest(
    Guid BoardId,
    string ActorId,
    string ElementId,
    JsonElement Element);

public sealed record DeleteBoardElementRequest(
    Guid BoardId,
    string ActorId,
    string ElementId);

public sealed record ReorderBoardElementsRequest(
    Guid BoardId,
    string ActorId,
    IReadOnlyList<string> ElementIds);

public sealed record BoardElementMutationResult(
    BoardSnapshot Snapshot,
    long Sequence,
    string ElementId,
    JsonElement? Element);
