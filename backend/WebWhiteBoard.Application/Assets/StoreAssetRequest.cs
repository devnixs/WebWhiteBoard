namespace WebWhiteBoard.Application.Assets;

public sealed record StoreAssetRequest(
    Stream Content,
    string ContentType);
