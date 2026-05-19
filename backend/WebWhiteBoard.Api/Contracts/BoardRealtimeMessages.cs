using System.Text.Json;
using System.Text.Json.Serialization;
using WebWhiteBoard.Domain.Boards;

namespace WebWhiteBoard.Api.Contracts;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(SessionJoinRealtimeMessage), typeDiscriminator: "session.join")]
[JsonDerivedType(typeof(BoardDocumentReplaceRealtimeMessage), typeDiscriminator: "board.document.replace")]
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
