namespace WebWhiteBoard.Infrastructure.Boards;

public sealed record DatabaseMigration(
    string Id,
    string Description,
    string Sql);
