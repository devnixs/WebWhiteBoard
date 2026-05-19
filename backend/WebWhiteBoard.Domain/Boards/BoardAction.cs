using System.Text.Json.Serialization;
using System.Text.Json;

namespace WebWhiteBoard.Domain.Boards;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(BoardDocumentReplacedAction), typeDiscriminator: "document.replaced")]
[JsonDerivedType(typeof(BoardShapeAddedAction), typeDiscriminator: "shape.added")]
[JsonDerivedType(typeof(BoardShapeUpdatedAction), typeDiscriminator: "shape.updated")]
[JsonDerivedType(typeof(BoardShapeDeletedAction), typeDiscriminator: "shape.deleted")]
[JsonDerivedType(typeof(BoardViewportChangedAction), typeDiscriminator: "viewport.changed")]
[JsonDerivedType(typeof(BoardCursorMovedAction), typeDiscriminator: "cursor.moved")]
public abstract record BoardAction(
    Guid ActionId,
    Guid BoardId,
    string ActorId,
    DateTimeOffset OccurredAtUtc);

public sealed record BoardDocumentReplacedAction(
    Guid ActionId,
    Guid BoardId,
    string ActorId,
    DateTimeOffset OccurredAtUtc,
    JsonElement Document)
    : BoardAction(ActionId, BoardId, ActorId, OccurredAtUtc);

public sealed record BoardShapeAddedAction(
    Guid ActionId,
    Guid BoardId,
    string ActorId,
    DateTimeOffset OccurredAtUtc,
    BoardShape Shape)
    : BoardAction(ActionId, BoardId, ActorId, OccurredAtUtc);

public sealed record BoardShapeUpdatedAction(
    Guid ActionId,
    Guid BoardId,
    string ActorId,
    DateTimeOffset OccurredAtUtc,
    BoardShape Shape)
    : BoardAction(ActionId, BoardId, ActorId, OccurredAtUtc);

public sealed record BoardShapeDeletedAction(
    Guid ActionId,
    Guid BoardId,
    string ActorId,
    DateTimeOffset OccurredAtUtc,
    Guid ShapeId)
    : BoardAction(ActionId, BoardId, ActorId, OccurredAtUtc);

public sealed record BoardViewportChangedAction(
    Guid ActionId,
    Guid BoardId,
    string ActorId,
    DateTimeOffset OccurredAtUtc,
    BoardViewport Viewport)
    : BoardAction(ActionId, BoardId, ActorId, OccurredAtUtc);

public sealed record BoardCursorMovedAction(
    Guid ActionId,
    Guid BoardId,
    string ActorId,
    DateTimeOffset OccurredAtUtc,
    CursorPresence Cursor)
    : BoardAction(ActionId, BoardId, ActorId, OccurredAtUtc);
