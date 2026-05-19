namespace WebWhiteBoard.Domain.Boards;

public sealed record BoardViewport(
    double CenterX,
    double CenterY,
    double Zoom);
