using System.Text.Json;

namespace WebWhiteBoard.Domain.Boards;

public sealed class BoardAggregate
{
    private readonly Dictionary<Guid, BoardShape> _shapes = [];
    private readonly Dictionary<string, CursorPresence> _cursors = [];
    private JsonElement? _document;
    private long _actionSequence;

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

    public object SyncRoot { get; } = new();

    // Server-assigned monotonic action sequence per board. The counter is
    // process-local and resets to zero on cold start; reconnecting clients should
    // treat a smaller-than-known sequence as a server restart rather than a missed
    // update and re-hydrate from the session.ready snapshot.
    public long NextActionSequence() => Interlocked.Increment(ref _actionSequence);

    public long CurrentActionSequence => Interlocked.Read(ref _actionSequence);

    public bool TryApplyElementAdded(string elementId, JsonElement element, DateTimeOffset occurredAtUtc)
    {
        if (string.IsNullOrWhiteSpace(elementId) || element.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        var elements = LoadElementList();
        var index = FindElementIndex(elements, elementId);
        if (index >= 0)
        {
            elements[index] = element.Clone();
        }
        else
        {
            elements.Add(element.Clone());
        }

        SaveElementList(elements, occurredAtUtc);
        return true;
    }

    public bool TryApplyElementUpdated(string elementId, JsonElement element, DateTimeOffset occurredAtUtc)
    {
        if (string.IsNullOrWhiteSpace(elementId) || element.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        var elements = LoadElementList();
        var index = FindElementIndex(elements, elementId);
        if (index < 0)
        {
            return false;
        }

        elements[index] = element.Clone();
        SaveElementList(elements, occurredAtUtc);
        return true;
    }

    public bool TryApplyElementDeleted(string elementId, DateTimeOffset occurredAtUtc)
    {
        if (string.IsNullOrWhiteSpace(elementId))
        {
            return false;
        }

        var elements = LoadElementList();
        var index = FindElementIndex(elements, elementId);
        if (index < 0)
        {
            return false;
        }

        elements.RemoveAt(index);
        SaveElementList(elements, occurredAtUtc);
        return true;
    }

    public bool TryApplyElementsReordered(IReadOnlyList<string> orderedElementIds, DateTimeOffset occurredAtUtc)
    {
        if (orderedElementIds is null)
        {
            return false;
        }

        var elements = LoadElementList();
        if (elements.Count == 0 && orderedElementIds.Count == 0)
        {
            return false;
        }

        var byId = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
        foreach (var element in elements)
        {
            if (TryGetElementId(element, out var id))
            {
                byId[id] = element;
            }
        }

        var reordered = new List<JsonElement>(elements.Count);
        var consumed = new HashSet<string>(StringComparer.Ordinal);

        foreach (var id in orderedElementIds)
        {
            if (string.IsNullOrEmpty(id) || !byId.TryGetValue(id, out var element) || !consumed.Add(id))
            {
                continue;
            }

            reordered.Add(element);
        }

        foreach (var element in elements)
        {
            if (TryGetElementId(element, out var id) && !consumed.Contains(id))
            {
                reordered.Add(element);
            }
        }

        SaveElementList(reordered, occurredAtUtc);
        return true;
    }

    public bool TryGetElement(string elementId, out JsonElement element)
    {
        element = default;
        if (string.IsNullOrWhiteSpace(elementId))
        {
            return false;
        }

        var elements = LoadElementList();
        var index = FindElementIndex(elements, elementId);
        if (index < 0)
        {
            return false;
        }

        element = elements[index];
        return true;
    }

    private List<JsonElement> LoadElementList()
    {
        if (_document is { } document
            && document.ValueKind == JsonValueKind.Object
            && document.TryGetProperty("store", out var store)
            && store.ValueKind == JsonValueKind.Object
            && store.TryGetProperty("elements", out var elements)
            && elements.ValueKind == JsonValueKind.Array)
        {
            var list = new List<JsonElement>(elements.GetArrayLength());
            foreach (var item in elements.EnumerateArray())
            {
                list.Add(item.Clone());
            }
            return list;
        }

        return new List<JsonElement>();
    }

    private void SaveElementList(List<JsonElement> elements, DateTimeOffset occurredAtUtc)
    {
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            writer.WriteStartObject();

            if (_document is { ValueKind: JsonValueKind.Object } existing)
            {
                foreach (var property in existing.EnumerateObject())
                {
                    if (string.Equals(property.Name, "store", StringComparison.Ordinal))
                    {
                        continue;
                    }

                    writer.WritePropertyName(property.Name);
                    property.Value.WriteTo(writer);
                }
            }
            else
            {
                writer.WritePropertyName("schema");
                writer.WriteStartObject();
                writer.WriteString("kind", "wwb.native-board");
                writer.WriteNumber("version", 1);
                writer.WriteEndObject();
            }

            writer.WritePropertyName("store");
            writer.WriteStartObject();

            if (_document is { ValueKind: JsonValueKind.Object } existingStoreSource
                && existingStoreSource.TryGetProperty("store", out var existingStore)
                && existingStore.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in existingStore.EnumerateObject())
                {
                    if (string.Equals(property.Name, "elements", StringComparison.Ordinal))
                    {
                        continue;
                    }

                    writer.WritePropertyName(property.Name);
                    property.Value.WriteTo(writer);
                }
            }

            writer.WritePropertyName("elements");
            writer.WriteStartArray();
            foreach (var element in elements)
            {
                element.WriteTo(writer);
            }
            writer.WriteEndArray();

            writer.WriteEndObject();
            writer.WriteEndObject();
        }

        var parsed = JsonDocument.Parse(stream.ToArray());
        _document = parsed.RootElement.Clone();
        Version++;
        UpdatedAtUtc = occurredAtUtc;
    }

    private static int FindElementIndex(List<JsonElement> elements, string elementId)
    {
        for (var i = 0; i < elements.Count; i++)
        {
            if (TryGetElementId(elements[i], out var id) && string.Equals(id, elementId, StringComparison.Ordinal))
            {
                return i;
            }
        }

        return -1;
    }

    private static bool TryGetElementId(JsonElement element, out string id)
    {
        if (element.ValueKind == JsonValueKind.Object
            && element.TryGetProperty("id", out var idProperty)
            && idProperty.ValueKind == JsonValueKind.String)
        {
            var value = idProperty.GetString();
            if (!string.IsNullOrEmpty(value))
            {
                id = value;
                return true;
            }
        }

        id = string.Empty;
        return false;
    }

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
