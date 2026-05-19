using System.Text.Json;
using Npgsql;
using Testcontainers.PostgreSql;

namespace WebWhiteBoard.Api.IntegrationTests;

public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17")
        .WithDatabase("postgres")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public Task InitializeAsync()
    {
        return _container.StartAsync();
    }

    public Task DisposeAsync()
    {
        return _container.DisposeAsync().AsTask();
    }

    public string CreateDatabaseConnectionString()
    {
        return new NpgsqlConnectionStringBuilder(_container.GetConnectionString())
        {
            Database = $"wwb_integration_{Guid.NewGuid():N}"
        }.ConnectionString;
    }

    public async Task WaitForBoardSnapshotAsync(
        string connectionString,
        Guid boardId,
        Func<JsonElement, bool> predicate,
        CancellationToken cancellationToken = default)
    {
        var timeoutAt = DateTimeOffset.UtcNow.AddSeconds(10);
        Exception? lastFailure = null;

        while (DateTimeOffset.UtcNow < timeoutAt)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                var snapshot = await TryLoadBoardSnapshotAsync(connectionString, boardId, cancellationToken);
                if (snapshot is { } value && predicate(value))
                {
                    return;
                }
            }
            catch (Exception exception) when (exception is NpgsqlException or InvalidOperationException or JsonException)
            {
                lastFailure = exception;
            }

            await Task.Delay(100, cancellationToken);
        }

        throw new TimeoutException(
            $"Timed out waiting for persisted snapshot for board {boardId}.",
            lastFailure);
    }

    private static async Task<JsonElement?> TryLoadBoardSnapshotAsync(
        string connectionString,
        Guid boardId,
        CancellationToken cancellationToken)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = """
            select snapshot
            from board_snapshots
            where board_id = @boardId
            """;

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("boardId", boardId);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        if (result is not string json)
        {
            return null;
        }

        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}
