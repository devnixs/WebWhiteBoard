using System.Text.Json;
using System.Text.Json.Serialization;
using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Api.Contracts;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(SessionJoinRealtimeMessage), typeDiscriminator: "session.join")]
[JsonDerivedType(typeof(BoardDocumentReplaceRealtimeMessage), typeDiscriminator: "board.document.replace")]
[JsonDerivedType(typeof(BoardShapeAddedRealtimeMessage), typeDiscriminator: "shape.added")]
[JsonDerivedType(typeof(BoardShapeUpdatedRealtimeMessage), typeDiscriminator: "shape.updated")]
[JsonDerivedType(typeof(BoardShapeDeletedRealtimeMessage), typeDiscriminator: "shape.deleted")]
[JsonDerivedType(typeof(BoardShapesReorderedRealtimeMessage), typeDiscriminator: "shape.reordered")]
[JsonDerivedType(typeof(CursorUpdateRealtimeMessage), typeDiscriminator: "cursor.update")]
[JsonDerivedType(typeof(PingRealtimeMessage), typeDiscriminator: "ping")]
public abstract record BoardRealtimeClientMessage;

public sealed record SessionJoinRealtimeMessage(
    ParticipantSession Participant)
    : BoardRealtimeClientMessage;

public sealed record BoardDocumentReplaceRealtimeMessage(
    Guid BoardId,
    string ActorId,
    JsonElement Document)
    : BoardRealtimeClientMessage;

public sealed record BoardShapeAddedRealtimeMessage(
    Guid BoardId,
    string ActorId,
    string ElementId,
    JsonElement Element)
    : BoardRealtimeClientMessage;

public sealed record BoardShapeUpdatedRealtimeMessage(
    Guid BoardId,
    string ActorId,
    string ElementId,
    JsonElement Element)
    : BoardRealtimeClientMessage;

public sealed record BoardShapeDeletedRealtimeMessage(
    Guid BoardId,
    string ActorId,
    string ElementId)
    : BoardRealtimeClientMessage;

public sealed record BoardShapesReorderedRealtimeMessage(
    Guid BoardId,
    string ActorId,
    IReadOnlyList<string> ElementIds)
    : BoardRealtimeClientMessage;

public sealed record CursorUpdateRealtimeMessage(
    Guid BoardId,
    string ActorId,
    double X,
    double Y)
    : BoardRealtimeClientMessage;

public sealed record PingRealtimeMessage(
    string Nonce,
    long ClientSentAtUnixMs)
    : BoardRealtimeClientMessage;
