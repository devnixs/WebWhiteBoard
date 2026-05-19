using System.Data;
using System.Text.Json;
using Npgsql;
using WebWhiteBoard.Application.Boards;
using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Infrastructure.Boards;

public sealed class PostgresBoardRepository : IBoardRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string _connectionString;

    public PostgresBoardRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<BoardSnapshot?> LoadAsync(Guid boardId, CancellationToken cancellationToken)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = """
            select snapshot
            from board_snapshots
            where board_id = @boardId
            """;

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("boardId", boardId);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        if (result is null or DBNull)
        {
            return null;
        }

        return JsonSerializer.Deserialize<BoardSnapshot>((string)result, JsonOptions);
    }

    public async Task SaveAsync(BoardSnapshot snapshot, CancellationToken cancellationToken)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = """
            insert into board_snapshots (board_id, version, updated_at_utc, snapshot)
            values (@boardId, @version, @updatedAtUtc, @snapshot::jsonb)
            on conflict (board_id) do update
                set version = excluded.version,
                    updated_at_utc = excluded.updated_at_utc,
                    snapshot = excluded.snapshot
            """;

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("boardId", snapshot.BoardId);
        command.Parameters.AddWithValue("version", snapshot.Version);
        command.Parameters.AddWithValue("updatedAtUtc", snapshot.UpdatedAtUtc.UtcDateTime);
        command.Parameters.AddWithValue("snapshot", JsonSerializer.Serialize(snapshot, JsonOptions));

        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
