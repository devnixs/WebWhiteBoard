using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WebWhiteBoard.Application.Boards;
using WebWhiteBoard.Infrastructure.Boards;

namespace WebWhiteBoard.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddWhiteBoardInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("ConnectionStrings:Postgres is required.");

        services.AddSingleton<IBoardRepository>(_ => new PostgresBoardRepository(connectionString));
        services.AddSingleton(_ => new PostgresDatabaseMigrator(connectionString));
        services.AddSingleton<IActiveBoardStore, InMemoryActiveBoardStore>();
        services.AddSingleton<BoardPersistenceChannel>();
        services.AddSingleton<IBoardPersistenceScheduler>(sp => sp.GetRequiredService<BoardPersistenceChannel>());
        services.AddHostedService(sp => sp.GetRequiredService<BoardPersistenceChannel>());
        services.AddHostedService<PostgresInitializationHostedService>();

        return services;
    }
}
