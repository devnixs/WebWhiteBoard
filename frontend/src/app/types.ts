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
export type BoardTool = 'select' | 'hand' | 'pencil' | 'text' | 'shapes' | 'arrow' | 'eraser' | 'lasso'
export type ColorChoice = 'blue' | 'green' | 'orange' | 'red' | 'violet' | 'black'
export type SizeChoice = 's' | 'm' | 'l' | 'xl'
export type FontChoice = 'draw' | 'sans' | 'serif' | 'mono'
export type ShapeChoice = 'rectangle' | 'ellipse' | 'diamond' | 'star' | 'arrow'
export type ConnectionState = 'connecting' | 'online' | 'offline'
export type BoardPoint = {
  x: number
  y: number
}

export type BoardBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type BoardViewport = {
  x: number
  y: number
  zoom: number
}

export type BoardCanvasSize = {
  width: number
  height: number
}

export type BoardStrokeElement = {
  id: string
  type: 'stroke'
  color: ColorChoice
  size: SizeChoice
  points: BoardPoint[]
}

export type BoardTextElement = {
  id: string
  type: 'text'
  color: ColorChoice
  font: FontChoice
  size: SizeChoice
  position: BoardPoint
  scale: number
  rotation: number
  text: string
}

export type BoardShapeElement = {
  id: string
  type: 'shape'
  color: ColorChoice
  size: SizeChoice
  shape: ShapeChoice
  position: BoardPoint
  width: number
  height: number
  rotation: number
}

export type BoardImageElement = {
  id: string
  type: 'image'
  position: BoardPoint
  width: number
  height: number
  rotation: number
  src: string
}

export type BoardElement =
  | BoardStrokeElement
  | BoardTextElement
  | BoardShapeElement
  | BoardImageElement

export type BoardDocumentSnapshot = {
  schema: {
    kind: 'wwb.native-board'
    version: 1
  }
  store: {
    elements: BoardElement[]
  }
}

export type BoardRuntimeDebugState = {
  document: BoardDocumentSnapshot
  viewport: BoardViewport
  canvasSize: BoardCanvasSize
  activeTool: BoardTool
}

export type ContextMenuState = {
  x: number
  y: number
  selectedShapeIds: string[]
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
  document: unknown | null
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
  document: unknown | null
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
  document: unknown | null
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

export type BoardUploadNotice = {
  id: number
  message: string
}
