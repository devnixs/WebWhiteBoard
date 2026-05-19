using Microsoft.Extensions.Hosting;

namespace WebWhiteBoard.Infrastructure.Boards;

public sealed class PostgresInitializationHostedService : IHostedService
{
    private readonly PostgresDatabaseMigrator _databaseMigrator;

    public PostgresInitializationHostedService(PostgresDatabaseMigrator databaseMigrator)
    {
        _databaseMigrator = databaseMigrator;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await _databaseMigrator.MigrateAsync(cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
