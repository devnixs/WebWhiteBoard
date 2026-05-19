using System.Diagnostics;
using System.Net.Sockets;
using System.Text;

namespace WebWhiteBoard.Api.IntegrationTests;

public sealed class ApiProcessHost : IAsyncDisposable
{
    private readonly Process _process;
    private readonly StringBuilder _output = new();

    private ApiProcessHost(Process process, Uri baseAddress)
    {
        _process = process;
        BaseAddress = baseAddress;
    }

    public Uri BaseAddress { get; }

    public static async Task<ApiProcessHost> StartAsync(
        string connectionString,
        CancellationToken cancellationToken = default)
    {
        var port = GetFreeTcpPort();
        var baseAddress = new Uri($"http://127.0.0.1:{port}");
        var apiAssemblyPath = ResolveApiAssemblyPath();

        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "dotnet",
                ArgumentList = { apiAssemblyPath },
                WorkingDirectory = Path.GetDirectoryName(apiAssemblyPath)!,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            }
        };

        process.StartInfo.Environment["ASPNETCORE_URLS"] = baseAddress.ToString();
        process.StartInfo.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
        process.StartInfo.Environment["ConnectionStrings__Postgres"] = connectionString;

        var host = new ApiProcessHost(process, baseAddress);
        process.OutputDataReceived += (_, args) => host.AppendOutput(args.Data);
        process.ErrorDataReceived += (_, args) => host.AppendOutput(args.Data);

        if (!process.Start())
        {
            throw new InvalidOperationException("Failed to start the backend API process.");
        }

        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        try
        {
            await host.WaitForHealthyAsync(cancellationToken);
            return host;
        }
        catch
        {
            await host.DisposeAsync();
            throw;
        }
    }

    public HttpClient CreateClient()
    {
        return new HttpClient
        {
            BaseAddress = BaseAddress,
            Timeout = TimeSpan.FromSeconds(10)
        };
    }

    public Uri CreateWebSocketUri(Guid boardId)
    {
        return new Uri($"ws://127.0.0.1:{BaseAddress.Port}/ws/boards/{boardId}");
    }

    public async ValueTask DisposeAsync()
    {
        if (!_process.HasExited)
        {
            _process.Kill(entireProcessTree: true);
            await _process.WaitForExitAsync();
        }

        _process.Dispose();
    }

    private async Task WaitForHealthyAsync(CancellationToken cancellationToken)
    {
        using var client = CreateClient();
        var timeoutAt = DateTimeOffset.UtcNow.AddSeconds(15);
        Exception? lastFailure = null;

        while (DateTimeOffset.UtcNow < timeoutAt)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (_process.HasExited)
            {
                throw new InvalidOperationException(
                    $"The backend API process exited before becoming healthy.{Environment.NewLine}{_output}");
            }

            try
            {
                using var response = await client.GetAsync("/health", cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    return;
                }

                lastFailure = new HttpRequestException($"Health probe returned {(int)response.StatusCode}.");
            }
            catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException or SocketException)
            {
                lastFailure = exception;
            }

            await Task.Delay(200, cancellationToken);
        }

        throw new TimeoutException(
            $"Timed out waiting for the backend API process to become healthy.{Environment.NewLine}{_output}",
            lastFailure);
    }

    private void AppendOutput(string? line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return;
        }

        lock (_output)
        {
            _output.AppendLine(line);
        }
    }

    private static int GetFreeTcpPort()
    {
        using var listener = new TcpListener(System.Net.IPAddress.Loopback, 0);
        listener.Start();
        return ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;
    }

    private static string ResolveApiAssemblyPath()
    {
        var path = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "../../../../WebWhiteBoard.Api/bin/Release/net10.0/WebWhiteBoard.Api.dll"));

        if (!File.Exists(path))
        {
            throw new FileNotFoundException("Unable to locate the backend API assembly for integration tests.", path);
        }

        return path;
    }
}
