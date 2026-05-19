namespace WebWhiteBoard.Domain.Boards;

public sealed record BoardShape(
    Guid ShapeId,
    string Kind,
    string StrokeColor,
    double StrokeWidth,
    double X,
    double Y,
    double Width,
    double Height,
    double Rotation,
    int ZIndex,
    string? Text,
    string? FontFamily,
    double? FontSize);
