namespace WebWhiteBoard.Application.Assets;

public sealed class AssetStorageOptions
{
    public const string SectionName = "Assets";
    public const long DefaultMaxUploadSizeBytes = 10 * 1024 * 1024;
    public const string DefaultUploadFolderPath = "assets";
    public const string DefaultPublicUrlPrefix = "/assets";

    public string UploadFolderPath { get; init; } = DefaultUploadFolderPath;

    public string PublicUrlPrefix { get; init; } = DefaultPublicUrlPrefix;

    public long MaxUploadSizeBytes { get; init; } = DefaultMaxUploadSizeBytes;
}
