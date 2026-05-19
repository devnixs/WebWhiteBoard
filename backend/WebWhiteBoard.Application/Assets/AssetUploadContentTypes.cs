namespace WebWhiteBoard.Application.Assets;

public static class AssetUploadContentTypes
{
    private static readonly IReadOnlyDictionary<string, string> ExtensionsByContentType =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["image/png"] = ".png",
            ["image/jpeg"] = ".jpg",
            ["image/gif"] = ".gif",
            ["image/webp"] = ".webp"
        };

    public static IReadOnlyCollection<string> AllowedContentTypes => ExtensionsByContentType.Keys.ToArray();

    public static bool TryGetExtension(string? contentType, out string extension)
    {
        var normalized = Normalize(contentType);
        if (normalized is not null && ExtensionsByContentType.TryGetValue(normalized, out var resolvedExtension))
        {
            extension = resolvedExtension;
            return true;
        }

        extension = string.Empty;
        return false;
    }

    private static string? Normalize(string? contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            return null;
        }

        var separatorIndex = contentType.IndexOf(';');
        return separatorIndex >= 0
            ? contentType[..separatorIndex].Trim()
            : contentType.Trim();
    }
}
