using System.Text.Json;

namespace WebWhiteBoard.Domain.Boards;

public sealed record BoardSnapshot(
    Guid BoardId,
    long Version,
    DateTimeOffset UpdatedAtUtc,
    JsonElement? Document,
    IReadOnlyList<BoardShape> Shapes,
    IReadOnlyList<CursorPresence> Cursors,
    BoardViewport Viewport);
