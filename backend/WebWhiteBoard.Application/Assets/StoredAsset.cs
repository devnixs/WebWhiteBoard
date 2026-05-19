namespace WebWhiteBoard.Application.Assets;

public sealed record StoredAsset(
    string FileName,
    string PublicUrl,
    string PhysicalPath);
