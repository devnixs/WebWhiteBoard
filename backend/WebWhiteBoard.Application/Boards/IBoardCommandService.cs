using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Application.Boards;

public interface IBoardCommandService
{
    Task<BoardEnvelope> GetBoardAsync(Guid boardId, CancellationToken cancellationToken);

    Task<Guid> CreateBoardAsync(CreateBoardRequest request, CancellationToken cancellationToken);

    Task<BoardMutationResult> ApplyActionAsync(BoardAction action, CancellationToken cancellationToken);

    Task<BoardMutationResult> ReplaceDocumentAsync(
        ReplaceBoardDocumentRequest request,
        CancellationToken cancellationToken);

    Task<BoardElementMutationResult> AddElementAsync(
        AddBoardElementRequest request,
        CancellationToken cancellationToken);

    Task<BoardElementMutationResult?> UpdateElementAsync(
        UpdateBoardElementRequest request,
        CancellationToken cancellationToken);

    Task<BoardElementMutationResult?> DeleteElementAsync(
        DeleteBoardElementRequest request,
        CancellationToken cancellationToken);

    Task<BoardElementMutationResult> ReorderElementsAsync(
        ReorderBoardElementsRequest request,
        CancellationToken cancellationToken);

    Task<BoardSnapshot> UpdateCursorAsync(
        UpdateBoardCursorRequest request,
        CancellationToken cancellationToken);

    Task<BoardSnapshot> ClearCursorAsync(
        Guid boardId,
        string actorId,
        CancellationToken cancellationToken);
}
