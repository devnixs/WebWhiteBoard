using Npgsql;

namespace WebWhiteBoard.Infrastructure.Boards;

public sealed class PostgresDatabaseMigrator
{
    private static readonly IReadOnlyList<DatabaseMigration> Migrations =
    [
        new(
            "202605190001_initial_board_snapshots",
            "Create the board snapshots table.",
            """
            create table if not exists board_snapshots (
                board_id uuid primary key,
                version bigint not null,
                updated_at_utc timestamp with time zone not null,
                snapshot jsonb not null
            );
            """)
    ];

    private readonly string _connectionString;
    private readonly NpgsqlConnectionStringBuilder _connectionStringBuilder;

    public PostgresDatabaseMigrator(string connectionString)
    {
        _connectionString = connectionString;
        _connectionStringBuilder = new NpgsqlConnectionStringBuilder(connectionString);
    }

    public async Task MigrateAsync(CancellationToken cancellationToken)
    {
        await EnsureDatabaseExistsAsync(cancellationToken);

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await EnsureMigrationsTableAsync(connection, cancellationToken);

        foreach (var migration in Migrations)
        {
            if (await HasMigrationAsync(connection, migration.Id, cancellationToken))
            {
                continue;
            }

            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

            try
            {
                await ExecuteMigrationAsync(connection, transaction, migration, cancellationToken);
                await RecordMigrationAsync(connection, transaction, migration, cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
    }

    private async Task EnsureDatabaseExistsAsync(CancellationToken cancellationToken)
    {
        var targetDatabase = _connectionStringBuilder.Database;
        if (string.IsNullOrWhiteSpace(targetDatabase))
        {
            throw new InvalidOperationException("Connection string must include a target database name.");
        }

        var adminDatabase = string.Equals(targetDatabase, "postgres", StringComparison.OrdinalIgnoreCase)
            ? "template1"
            : "postgres";

        var adminConnectionString = new NpgsqlConnectionStringBuilder(_connectionString)
        {
            Database = adminDatabase
        }.ConnectionString;

        await using var adminConnection = new NpgsqlConnection(adminConnectionString);
        await adminConnection.OpenAsync(cancellationToken);

        const string existsSql = """
            select exists(
                select 1
                from pg_database
                where datname = @databaseName
            );
            """;

        await using var existsCommand = new NpgsqlCommand(existsSql, adminConnection);
        existsCommand.Parameters.AddWithValue("databaseName", targetDatabase);

        var exists = (bool)(await existsCommand.ExecuteScalarAsync(cancellationToken)
            ?? throw new InvalidOperationException("Unable to read database catalog state."));

        if (exists)
        {
            return;
        }

        var quotedDatabaseName = QuoteIdentifier(targetDatabase);
        var createSql = $"create database {quotedDatabaseName};";

        await using var createCommand = new NpgsqlCommand(createSql, adminConnection);
        await createCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task EnsureMigrationsTableAsync(
        NpgsqlConnection connection,
        CancellationToken cancellationToken)
    {
        const string sql = """
            create table if not exists schema_migrations (
                migration_id text primary key,
                description text not null,
                applied_at_utc timestamp with time zone not null
            );
            """;

        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<bool> HasMigrationAsync(
        NpgsqlConnection connection,
        string migrationId,
        CancellationToken cancellationToken)
    {
        const string sql = """
            select exists(
                select 1
                from schema_migrations
                where migration_id = @migrationId
            );
            """;

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("migrationId", migrationId);

        return (bool)(await command.ExecuteScalarAsync(cancellationToken)
            ?? throw new InvalidOperationException("Unable to read schema migration state."));
    }

    private static async Task ExecuteMigrationAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        DatabaseMigration migration,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(migration.Sql, connection, transaction);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task RecordMigrationAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        DatabaseMigration migration,
        CancellationToken cancellationToken)
    {
        const string sql = """
            insert into schema_migrations (migration_id, description, applied_at_utc)
            values (@migrationId, @description, @appliedAtUtc);
            """;

        await using var command = new NpgsqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("migrationId", migration.Id);
        command.Parameters.AddWithValue("description", migration.Description);
        command.Parameters.AddWithValue("appliedAtUtc", DateTimeOffset.UtcNow.UtcDateTime);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static string QuoteIdentifier(string identifier)
    {
        return "\"" + identifier.Replace("\"", "\"\"", StringComparison.Ordinal) + "\"";
    }
}
