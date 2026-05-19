using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WebWhiteBoard.Application.Assets;
using WebWhiteBoard.Application.Boards;
using WebWhiteBoard.Infrastructure.Assets;
using WebWhiteBoard.Infrastructure.Boards;

namespace WebWhiteBoard.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddWhiteBoardInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        string contentRootPath)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("ConnectionStrings:Postgres is required.");
        var assetStorageOptions = CreateAssetStorageOptions(configuration, contentRootPath);

        services.AddSingleton<IBoardRepository>(_ => new PostgresBoardRepository(connectionString));
        services.AddSingleton(_ => new PostgresDatabaseMigrator(connectionString));
        services.AddSingleton<IActiveBoardStore, InMemoryActiveBoardStore>();
        services.AddSingleton<BoardPersistenceChannel>();
        services.AddSingleton<IBoardPersistenceScheduler>(sp => sp.GetRequiredService<BoardPersistenceChannel>());
        services.AddHostedService(sp => sp.GetRequiredService<BoardPersistenceChannel>());
        services.AddHostedService<PostgresInitializationHostedService>();
        services.AddSingleton(assetStorageOptions);
        services.AddSingleton<IAssetStorage, LocalFileSystemAssetStorage>();

        return services;
    }

    private static AssetStorageOptions CreateAssetStorageOptions(IConfiguration configuration, string contentRootPath)
    {
        var configuredOptions = configuration
            .GetSection(AssetStorageOptions.SectionName)
            .Get<AssetStorageOptions>()
            ?? new AssetStorageOptions();

        if (configuredOptions.MaxUploadSizeBytes <= 0)
        {
            throw new InvalidOperationException("Assets:MaxUploadSizeBytes must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(configuredOptions.UploadFolderPath))
        {
            throw new InvalidOperationException("Assets:UploadFolderPath is required.");
        }

        var resolvedUploadFolder = Path.IsPathRooted(configuredOptions.UploadFolderPath)
            ? configuredOptions.UploadFolderPath
            : Path.GetFullPath(Path.Combine(contentRootPath, configuredOptions.UploadFolderPath));

        var normalizedPublicUrlPrefix = NormalizePublicUrlPrefix(configuredOptions.PublicUrlPrefix);

        Directory.CreateDirectory(resolvedUploadFolder);

        return new AssetStorageOptions
        {
            UploadFolderPath = resolvedUploadFolder,
            PublicUrlPrefix = normalizedPublicUrlPrefix,
            MaxUploadSizeBytes = configuredOptions.MaxUploadSizeBytes
        };
    }

    private static string NormalizePublicUrlPrefix(string? publicUrlPrefix)
    {
        if (string.IsNullOrWhiteSpace(publicUrlPrefix))
        {
            throw new InvalidOperationException("Assets:PublicUrlPrefix is required.");
        }

        var normalized = publicUrlPrefix.Trim();
        if (!normalized.StartsWith('/'))
        {
            normalized = $"/{normalized}";
        }

        normalized = normalized.TrimEnd('/');
        if (normalized.Length == 0)
        {
            throw new InvalidOperationException("Assets:PublicUrlPrefix must not resolve to the root path.");
        }

        return normalized;
    }
}
