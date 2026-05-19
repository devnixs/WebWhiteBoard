import type { Editor, TLContent, TLShapeId } from 'tldraw'

export type RouteState =
  | { kind: 'home' }
  | { kind: 'board'; boardId: string }
  | { kind: 'not-found' }

export type LocalIdentity = {
  sessionId: string
  name: string
  color: string
}

export type KnownBoard = {
  boardId: string
  lastVisitedAt: string
}

export type BoardHistoryStore = Record<string, KnownBoard[]>
export type BoardTool = 'select' | 'hand' | 'pencil' | 'text' | 'shapes' | 'eraser' | 'lasso'
export type ColorChoice = 'blue' | 'green' | 'orange' | 'red' | 'violet' | 'black'
export type SizeChoice = 's' | 'm' | 'l' | 'xl'
export type FontChoice = 'draw' | 'sans' | 'serif' | 'mono'
export type ShapeChoice = 'rectangle' | 'ellipse' | 'diamond' | 'star'
export type ConnectionState = 'connecting' | 'online' | 'offline'
export type BoardDocumentSnapshot = ReturnType<Editor['getSnapshot']>['document']

export type ContextMenuState = {
  x: number
  y: number
  selectedShapeIds: TLShapeId[]
  supportsColor: boolean
  supportsDrawSize: boolean
  supportsFont: boolean
}

export type RealtimeCursor = {
  actorId: string
  displayName: string
  color: string
  x: number
  y: number
  updatedAtUtc: string
}

export type RealtimeParticipant = {
  sessionId: string
  displayName: string
  color: string
}

export type SessionReadyMessage = {
  type: 'session.ready'
  boardId: string
  version: number
  document: BoardDocumentSnapshot | null
  cursors: RealtimeCursor[]
  participants: RealtimeParticipant[]
}

export type ParticipantJoinedMessage = {
  type: 'participant.joined'
  boardId: string
  participant: RealtimeParticipant
  participants: RealtimeParticipant[]
}

export type ParticipantLeftMessage = {
  type: 'participant.left'
  boardId: string
  actorId: string
  participants: RealtimeParticipant[]
}

export type BoardDocumentUpdatedMessage = {
  type: 'board.document.updated'
  boardId: string
  actorId: string
  version: number
  document: BoardDocumentSnapshot | null
}

export type CursorUpdatedMessage = {
  type: 'cursor.updated'
  boardId: string
  cursor: RealtimeCursor
}

export type CursorClearedMessage = {
  type: 'cursor.cleared'
  boardId: string
  actorId: string
}

export type SyncRejectedMessage = {
  type: 'board.sync.rejected'
  boardId: string
  message: string
  version: number
  document: BoardDocumentSnapshot | null
}

export type PongMessage = {
  type: 'pong'
  nonce: string
  clientSentAtUnixMs: number
  serverSentAtUnixMs: number
}

export type ErrorMessage = {
  type: 'error'
  boardId: string
  message: string
}

export type SessionJoinClientMessage = {
  type: 'session.join'
  participant: RealtimeParticipant
}

export type BoardDocumentReplaceClientMessage = {
  type: 'board.document.replace'
  boardId: string
  actorId: string
  document: BoardDocumentSnapshot
}

export type CursorUpdateClientMessage = {
  type: 'cursor.update'
  boardId: string
  actorId: string
  x: number
  y: number
}

export type PingClientMessage = {
  type: 'ping'
  nonce: string
  clientSentAtUnixMs: number
}

export type BoardRealtimeServerMessage =
  | SessionReadyMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | BoardDocumentUpdatedMessage
  | CursorUpdatedMessage
  | CursorClearedMessage
  | SyncRejectedMessage
  | PongMessage
  | ErrorMessage

export type BoardRealtimeClientMessage =
  | SessionJoinClientMessage
  | BoardDocumentReplaceClientMessage
  | CursorUpdateClientMessage
  | PingClientMessage

export type SelectionClipboardContent = TLContent | null

export type BoardUploadNotice = {
  id: number
  message: string
}
