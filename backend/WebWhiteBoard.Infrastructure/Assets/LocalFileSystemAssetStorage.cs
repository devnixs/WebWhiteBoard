using WebWhiteBoard.Application.Assets;

namespace WebWhiteBoard.Infrastructure.Assets;

internal sealed class LocalFileSystemAssetStorage : IAssetStorage
{
    private readonly AssetStorageOptions _options;

    public LocalFileSystemAssetStorage(AssetStorageOptions options)
    {
        _options = options;
    }

    public async Task<StoredAsset> SaveAsync(StoreAssetRequest request, CancellationToken cancellationToken)
    {
        if (!AssetUploadContentTypes.TryGetExtension(request.ContentType, out var extension))
        {
            throw new InvalidOperationException($"Unsupported asset content type '{request.ContentType}'.");
        }

        Directory.CreateDirectory(_options.UploadFolderPath);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(_options.UploadFolderPath, fileName);

        await using (var target = new FileStream(
            physicalPath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 81920,
            options: FileOptions.Asynchronous))
        {
            await request.Content.CopyToAsync(target, cancellationToken);
        }

        return new StoredAsset(
            fileName,
            $"{_options.PublicUrlPrefix}/{fileName}",
            physicalPath);
    }
}
