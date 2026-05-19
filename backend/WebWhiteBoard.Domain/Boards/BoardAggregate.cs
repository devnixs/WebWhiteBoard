using System.Text.Json;

namespace WebWhiteBoard.Domain.Boards;

public sealed class BoardAggregate
{
    private readonly Dictionary<Guid, BoardShape> _shapes = [];
    private readonly Dictionary<string, CursorPresence> _cursors = [];
    private JsonElement? _document;

    public BoardAggregate(Guid boardId)
    {
        BoardId = boardId;
        Version = 0;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
        Viewport = new BoardViewport(0, 0, 1);
    }

    public Guid BoardId { get; }

    public long Version { get; private set; }

    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public BoardViewport Viewport { get; private set; }

    public JsonElement? Document => _document;

    public IReadOnlyDictionary<Guid, BoardShape> Shapes => _shapes;

    public IReadOnlyDictionary<string, CursorPresence> Cursors => _cursors;

    public void Apply(BoardAction action)
    {
        switch (action)
        {
            case BoardDocumentReplacedAction documentReplaced:
                _document = documentReplaced.Document.Clone();
                break;
            case BoardShapeAddedAction added:
                _shapes[added.Shape.ShapeId] = added.Shape;
                break;
            case BoardShapeUpdatedAction updated:
                _shapes[updated.Shape.ShapeId] = updated.Shape;
                break;
            case BoardShapeDeletedAction deleted:
                _shapes.Remove(deleted.ShapeId);
                break;
            case BoardViewportChangedAction viewportChanged:
                Viewport = viewportChanged.Viewport;
                break;
            case BoardCursorMovedAction cursorMoved:
                _cursors[cursorMoved.Cursor.ActorId] = cursorMoved.Cursor;
                break;
            default:
                throw new InvalidOperationException($"Unsupported board action type {action.GetType().Name}.");
        }

        Version++;
        UpdatedAtUtc = action.OccurredAtUtc;
    }

    public void RemoveCursor(string actorId, DateTimeOffset occurredAtUtc)
    {
        if (_cursors.Remove(actorId))
        {
            UpdatedAtUtc = occurredAtUtc;
        }
    }

    public BoardSnapshot ToSnapshot()
    {
        return new BoardSnapshot(
            BoardId,
            Version,
            UpdatedAtUtc,
            _document?.Clone(),
            _shapes.Values.OrderBy(shape => shape.ZIndex).ToArray(),
            _cursors.Values.ToArray(),
            Viewport);
    }

    public static BoardAggregate FromSnapshot(BoardSnapshot snapshot)
    {
        var aggregate = new BoardAggregate(snapshot.BoardId)
        {
            Version = snapshot.Version,
            UpdatedAtUtc = snapshot.UpdatedAtUtc,
            Viewport = snapshot.Viewport
        };

        if (snapshot.Document is { } document)
        {
            aggregate._document = document.Clone();
        }

        foreach (var shape in snapshot.Shapes)
        {
            aggregate._shapes[shape.ShapeId] = shape;
        }

        foreach (var cursor in snapshot.Cursors)
        {
            aggregate._cursors[cursor.ActorId] = cursor;
        }

        return aggregate;
    }
}
