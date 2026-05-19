namespace WebWhiteBoard.Application.Assets;

public interface IAssetStorage
{
    Task<StoredAsset> SaveAsync(StoreAssetRequest request, CancellationToken cancellationToken);
}
