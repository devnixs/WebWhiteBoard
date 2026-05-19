using System.Threading.Channels;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WebWhiteBoard.Application.Boards;
using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Infrastructure.Boards;

public sealed class BoardPersistenceChannel : BackgroundService, IBoardPersistenceScheduler
{
    private readonly Channel<BoardSnapshot> _channel = Channel.CreateUnbounded<BoardSnapshot>();
    private readonly IBoardRepository _repository;
    private readonly ILogger<BoardPersistenceChannel> _logger;

    public BoardPersistenceChannel(
        IBoardRepository repository,
        ILogger<BoardPersistenceChannel> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public ValueTask EnqueueAsync(BoardSnapshot snapshot, CancellationToken cancellationToken)
    {
        return _channel.Writer.WriteAsync(snapshot, cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var snapshot in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await _repository.SaveAsync(snapshot, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist board snapshot {BoardId}.", snapshot.BoardId);
            }
        }
    }
}
