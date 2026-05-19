import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { useEditor } from '@tldraw/editor'
import { useValue } from '@tldraw/state-react'
import {
  DefaultColorStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
  Editor,
  FONT_FAMILIES,
  FONT_SIZES,
  GeoShapeGeoStyle,
  STROKE_SIZES,
  Tldraw,
} from 'tldraw'
import type { TLContent, TLShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import './App.css'

type RouteState =
  | { kind: 'home' }
  | { kind: 'board'; boardId: string }
  | { kind: 'not-found' }

type LocalIdentity = {
  sessionId: string
  name: string
  color: string
}

type KnownBoard = {
  boardId: string
  lastVisitedAt: string
}

type BoardHistoryStore = Record<string, KnownBoard[]>
type BoardTool = 'select' | 'hand' | 'pencil' | 'text' | 'shapes' | 'eraser' | 'lasso'
type ColorChoice = 'blue' | 'green' | 'orange' | 'red' | 'violet' | 'black'
type SizeChoice = 's' | 'm' | 'l' | 'xl'
type FontChoice = 'draw' | 'sans' | 'serif' | 'mono'
type ShapeChoice = 'rectangle' | 'ellipse' | 'diamond' | 'star'
type ConnectionState = 'connecting' | 'online' | 'offline'
type BoardDocumentSnapshot = ReturnType<Editor['getSnapshot']>['document']
type ContextMenuState = {
  x: number
  y: number
  selectedShapeIds: TLShapeId[]
  supportsColor: boolean
  supportsDrawSize: boolean
  supportsFont: boolean
}
type RealtimeCursor = {
  actorId: string
  displayName: string
  color: string
  x: number
  y: number
  updatedAtUtc: string
}
type RealtimeParticipant = {
  sessionId: string
  displayName: string
  color: string
}
type SessionReadyMessage = {
  type: 'session.ready'
  boardId: string
  version: number
  document: BoardDocumentSnapshot | null
  cursors: RealtimeCursor[]
  participants: RealtimeParticipant[]
}
type ParticipantJoinedMessage = {
  type: 'participant.joined'
  boardId: string
  participant: RealtimeParticipant
  participants: RealtimeParticipant[]
}
type ParticipantLeftMessage = {
  type: 'participant.left'
  boardId: string
  actorId: string
  participants: RealtimeParticipant[]
}
type BoardDocumentUpdatedMessage = {
  type: 'board.document.updated'
  boardId: string
  actorId: string
  version: number
  document: BoardDocumentSnapshot | null
}
type CursorUpdatedMessage = {
  type: 'cursor.updated'
  boardId: string
  cursor: RealtimeCursor
}
type CursorClearedMessage = {
  type: 'cursor.cleared'
  boardId: string
  actorId: string
}
type SyncRejectedMessage = {
  type: 'board.sync.rejected'
  boardId: string
  message: string
  version: number
  document: BoardDocumentSnapshot | null
}
type PongMessage = {
  type: 'pong'
  nonce: string
  clientSentAtUnixMs: number
  serverSentAtUnixMs: number
}
type ErrorMessage = {
  type: 'error'
  boardId: string
  message: string
}
type SessionJoinClientMessage = {
  type: 'session.join'
  participant: RealtimeParticipant
}
type BoardDocumentReplaceClientMessage = {
  type: 'board.document.replace'
  boardId: string
  actorId: string
  document: BoardDocumentSnapshot
}
type CursorUpdateClientMessage = {
  type: 'cursor.update'
  boardId: string
  actorId: string
  x: number
  y: number
}
type PingClientMessage = {
  type: 'ping'
  nonce: string
  clientSentAtUnixMs: number
}
type BoardRealtimeServerMessage =
  | SessionReadyMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | BoardDocumentUpdatedMessage
  | CursorUpdatedMessage
  | CursorClearedMessage
  | SyncRejectedMessage
  | PongMessage
  | ErrorMessage
type BoardRealtimeClientMessage =
  | SessionJoinClientMessage
  | BoardDocumentReplaceClientMessage
  | CursorUpdateClientMessage
  | PingClientMessage

const identityStorageKey = 'wwb.identity'
const boardHistoryStorageKey = 'wwb.board-history'
const boardIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const colorPalette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16']
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
const colorChoices: ColorChoice[] = ['blue', 'green', 'orange', 'red', 'violet', 'black']
const sizeChoices: SizeChoice[] = ['s', 'm', 'l', 'xl']
const fontChoices: FontChoice[] = ['draw', 'sans', 'serif', 'mono']
const shapeChoices: Array<{ id: ShapeChoice; label: string }> = [
  { id: 'rectangle', label: 'Square' },
  { id: 'ellipse', label: 'Circle' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'star', label: 'Star' },
]
const isMacPlatform = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
const loginPalette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16']

function App() {
  const [route, setRoute] = useState<RouteState>(() => getRoute(window.location.pathname))
  const [identity, setIdentity] = useState<LocalIdentity | null>(() => loadIdentity())
  const [boardHistoryStore, setBoardHistoryStore] = useState<BoardHistoryStore>(() =>
    initializeBoardHistoryStore(),
  )

  const knownBoards = useMemo(() => {
    if (!identity) {
      return []
    }

    return boardHistoryStore[identity.sessionId] ?? []
  }, [boardHistoryStore, identity])

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRoute(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const rememberBoard = (sessionId: string, boardId: string) => {
    setBoardHistoryStore((current) => rememberBoardForIdentity(current, sessionId, boardId))
  }

  const navigate = (pathname: string, sessionIdOverride?: string) => {
    const nextRoute = getRoute(pathname)

    if (nextRoute.kind === 'board') {
      const sessionId = sessionIdOverride ?? identity?.sessionId
      if (sessionId) {
        rememberBoard(sessionId, nextRoute.boardId)
      }
    }

    window.history.pushState({}, '', pathname)
    setRoute(nextRoute)
  }

  const handleLogin = (name: string, color: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    const nextIdentity = createIdentity(trimmedName, color)
    persistIdentity(nextIdentity)
    setIdentity(nextIdentity)

    if (route.kind === 'board') {
      rememberBoard(nextIdentity.sessionId, route.boardId)
    }
  }

  const handleLogout = () => {
    clearIdentity()
    setIdentity(null)
    navigate('/')
  }

  const handleCreateBoard = async () => {
    const response = await fetch(`${apiBaseUrl}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      throw new Error('Unable to create a new board.')
    }

    const created = (await response.json()) as { boardId: string }
    navigate(`/board/${created.boardId}`)
  }

  const handleJoinBoard = (boardId: string) => {
    const normalizedBoardId = boardId.trim().toLowerCase()
    if (!boardIdPattern.test(normalizedBoardId)) {
      throw new Error('Board ids must be valid GUIDs.')
    }

    navigate(`/board/${normalizedBoardId}`)
  }

  if (route.kind === 'not-found') {
    return <NotFoundScreen onNavigate={navigate} />
  }

  if (!identity) {
    return (
      <LoginScreen
        route={route}
        onLogin={handleLogin}
      />
    )
  }

  if (route.kind === 'home') {
    return (
      <HomeScreen
        identity={identity}
        knownBoards={knownBoards}
        onCreateBoard={handleCreateBoard}
        onJoinBoard={handleJoinBoard}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    )
  }

  if (route.kind === 'board') {
    return (
      <BoardScreen
        boardId={route.boardId}
        identity={identity}
        onLogout={handleLogout}
      />
    )
  }
}

function LoginScreen({
  route,
  onLogin,
}: {
  route: RouteState
  onLogin: (name: string, color: string) => void
}) {
  const [name, setName] = useState('')
  const [previewColor] = useState(() => colorPalette[Math.floor(Math.random() * colorPalette.length)])

  const destinationLabel =
    route.kind === 'board' ? `You will join board ${shortBoardId(route.boardId)} right away.` : null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onLogin(name, previewColor)
  }

  return (
    <main className="auth-screen reference-surface">
      <BrandHeader />
      <section className="auth-card">
        <span className="screen-eyebrow">Welcome</span>
        <h1>What should we call you?</h1>
        <p>Your name is shown next to your cursor so others know who&apos;s drawing.</p>
        {destinationLabel ? <p className="auth-card__hint">{destinationLabel}</p> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            autoFocus
            maxLength={48}
            placeholder="Maya Chen"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="auth-palette">
            <span className="auth-palette__label">Your color</span>
            <div className="auth-palette__swatches" aria-hidden="true">
              {loginPalette.map((color) => (
                <span
                  className={`auth-palette__swatch ${color === previewColor ? 'auth-palette__swatch--selected' : ''}`}
                  key={color}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <button type="submit">Continue →</button>
        </form>
        <p className="auth-card__footer">Saved on this device. No account needed.</p>
      </section>
    </main>
  )
}

function HomeScreen({
  identity,
  knownBoards,
  onCreateBoard,
  onJoinBoard,
  onLogout,
  onNavigate,
}: {
  identity: LocalIdentity
  knownBoards: KnownBoard[]
  onCreateBoard: () => Promise<void>
  onJoinBoard: (boardId: string) => void
  onLogout: () => void
  onNavigate: (pathname: string) => void
}) {
  const [joinBoardId, setJoinBoardId] = useState('')
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateBoard = async () => {
    setError(null)
    setIsCreatingBoard(true)

    try {
      await onCreateBoard()
    } catch (err) {
      setError(toMessage(err))
      setIsCreatingBoard(false)
    }
  }

  const handleJoinBoard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      onJoinBoard(joinBoardId)
    } catch (err) {
      setError(toMessage(err))
    }
  }

  return (
    <main className="home-screen reference-surface">
      <BrandHeader />
      <TopRightIdentity identity={identity} onLogout={onLogout} />

      <section className="home-shell">
        <div className="home-hero">
          <h1>Welcome back, {identity.name}</h1>
          <p>{knownBoards.length} boards on this device · Pick up where you left off</p>
        </div>

        <section className="home-card home-card--create">
          <div className="home-card__create-left">
            <div className="home-card__icon">
              <IconPlus size={18} />
            </div>
            <div className="home-card__body">
              <h2>New board</h2>
              <p>A blank, infinite canvas. Share the link to invite others.</p>
            </div>
          </div>
          <div className="home-card__action">
            <button
              className="primary-button"
              disabled={isCreatingBoard}
              onClick={() => {
                void handleCreateBoard()
              }}
              type="button"
            >
              {isCreatingBoard ? 'Creating…' : 'Create'}
            </button>
          </div>
        </section>

        <section className="home-card home-card--boards">
          <div className="home-card__header home-card__header--boards">
            <span className="screen-eyebrow">Your boards</span>
            <form className="join-form join-form--inline" onSubmit={handleJoinBoard}>
              <input
                id="board-id"
                aria-label="Search or open board by GUID"
                placeholder="Search..."
                value={joinBoardId}
                onChange={(event) => setJoinBoardId(event.target.value)}
              />
              <button className="search-button" type="submit">
                <IconSearch size={14} />
              </button>
            </form>
          </div>

          {knownBoards.length === 0 ? (
            <p className="empty-state">
              No boards are stored yet for this identity. Create one or open a shared board by id.
            </p>
          ) : (
            <div className="board-list">
              {knownBoards.map((board) => (
                <button
                  className={`board-row ${board === knownBoards[0] ? 'board-row--active' : ''}`}
                  key={board.boardId}
                  onClick={() => onNavigate(`/board/${board.boardId}`)}
                  type="button"
                >
                  <div className="board-row__icon">
                    <IconBoard size={18} />
                  </div>
                  <div className="board-row__meta">
                    <strong>{shortBoardId(board.boardId)}</strong>
                    <p>/board/{board.boardId.slice(0, 8)}</p>
                  </div>
                  <div className="board-row__time">{formatRelative(board.lastVisitedAt)}</div>
                  <div className="board-row__avatars" aria-hidden="true">
                    {getBoardPreviewPalette(board.boardId).map((color, index) => (
                      <span
                        className="board-row__avatar"
                        key={`${board.boardId}-${color}-${index}`}
                        style={{ background: color, marginLeft: index === 0 ? 0 : -6 }}
                      />
                    ))}
                  </div>
                  <div className="board-row__more" aria-hidden="true">
                    <IconMore size={16} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {error ? <p className="home-error">{error}</p> : null}
        <p className="home-footer">Have a link? Just paste it in the address bar — boards work via /board/[id].</p>
      </section>
    </main>
  )
}

function BoardScreen({
  boardId,
  identity,
  onLogout,
}: {
  boardId: string
  identity: LocalIdentity
  onLogout: () => void
}) {
  const boardScreenRef = useRef<HTMLElement | null>(null)
  const editorInstanceRef = useRef<Editor | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const pendingSnapshotFlushRef = useRef<number | null>(null)
  const queuedDocumentRef = useRef<BoardDocumentSnapshot | null>(null)
  const pendingPingsRef = useRef(new Map<string, number>())
  const isApplyingRemoteSnapshotRef = useRef(false)
  const lastServerVersionRef = useRef(0)
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [activeTool, setActiveTool] = useState<BoardTool>('select')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [participantCount, setParticipantCount] = useState(1)
  const [participants, setParticipants] = useState<RealtimeParticipant[]>([])
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RealtimeCursor>>({})
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [drawColor, setDrawColor] = useState<ColorChoice>('blue')
  const [drawSize, setDrawSize] = useState<SizeChoice>('m')
  const [textSize, setTextSize] = useState<SizeChoice>('l')
  const [textFont, setTextFont] = useState<FontChoice>('sans')
  const [eraserSize, setEraserSize] = useState<SizeChoice>('l')
  const [shapeChoice, setShapeChoice] = useState<ShapeChoice>('rectangle')
  const [copiedContent, setCopiedContent] = useState<TLContent | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const tldrawOptions = useMemo(
    () => ({
      camera: {
        wheelBehavior: 'pan' as const,
        panSpeed: 1,
        zoomSpeed: 1,
      },
    }),
    [],
  )
  const tldrawComponents = useMemo(
    () => ({
      Background: BoardCanvasBackground,
    }),
    [],
  )

  const sendRealtimeMessage = useEffectEvent((message: BoardRealtimeClientMessage) => {
    if (!isSessionReady && message.type !== 'session.join') {
      return
    }

    const socket = websocketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return
    }

    socket.send(JSON.stringify(message))
  })

  // Re-applies the current style selections to the tldraw editor after a remote
  // document load resets TLInstance.stylesForNextShape to {}.
  const reapplyStyles = useEffectEvent(() => {
    if (!editor) {
      return
    }
    editor.setStyleForNextShapes(DefaultColorStyle, drawColor)
    editor.setStyleForNextShapes(DefaultSizeStyle, drawSize)
    editor.setStyleForNextShapes(DefaultFontStyle, textFont)
    editor.setStyleForNextShapes(GeoShapeGeoStyle, shapeChoice)
  })

  useEffect(() => {
    if (shareState !== 'copied') {
      return
    }

    const timeoutId = window.setTimeout(() => setShareState('idle'), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [shareState])

  useEffect(() => {
    if (!isShortcutsOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsShortcutsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isShortcutsOpen])

  useEffect(() => {
    if (!contextMenu) {
      return
    }

    const closeMenu = () => setContextMenu(null)
    window.addEventListener('pointerdown', closeMenu)
    window.addEventListener('scroll', closeMenu, true)
    return () => {
      window.removeEventListener('pointerdown', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [contextMenu])

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.setCurrentTool('select')
    editor.setStyleForNextShapes(DefaultColorStyle, drawColor)
    editor.setStyleForNextShapes(DefaultSizeStyle, drawSize)
    editor.setStyleForNextShapes(DefaultFontStyle, textFont)
    editor.setStyleForNextShapes(GeoShapeGeoStyle, shapeChoice)
  }, [editor, drawColor, drawSize, textFont, shapeChoice])

  useEffect(() => {
    if (!editor) {
      return
    }

    if (activeTool === 'select' || activeTool === 'lasso') {
      editor.setCurrentTool('select')
      return
    }

    if (activeTool === 'hand') {
      editor.setCurrentTool('hand')
      return
    }

    if (activeTool === 'pencil') {
      editor.setCurrentTool('draw')
      editor.setStyleForNextShapes(DefaultColorStyle, drawColor)
      editor.setStyleForNextShapes(DefaultSizeStyle, drawSize)
      return
    }

    if (activeTool === 'text') {
      editor.setCurrentTool('text')
      editor.setStyleForNextShapes(DefaultColorStyle, drawColor)
      editor.setStyleForNextShapes(DefaultFontStyle, textFont)
      editor.setStyleForNextShapes(DefaultSizeStyle, textSize)
      return
    }

    if (activeTool === 'shapes') {
      editor.setCurrentTool('geo')
      editor.setStyleForNextShapes(DefaultColorStyle, drawColor)
      editor.setStyleForNextShapes(DefaultSizeStyle, drawSize)
      editor.setStyleForNextShapes(GeoShapeGeoStyle, shapeChoice)
      return
    }

    if (activeTool === 'eraser') {
      editor.setCurrentTool('eraser')
      editor.setStyleForNextShapes(DefaultSizeStyle, eraserSize)
    }
  }, [activeTool, drawColor, drawSize, editor, eraserSize, shapeChoice, textFont, textSize])

  useEffect(() => {
    if (!editor) {
      return
    }

    const removeSessionListener = editor.store.listen(
      () => {
        setZoomLevel(Math.round(editor.getZoomLevel() * 100))
      },
      { source: 'all', scope: 'session' },
    )

    return () => removeSessionListener()
  }, [editor])

  useEffect(() => {
    if (!editor) {
      return
    }

    const removeDocumentListener = editor.store.listen(
      () => {
        if (isApplyingRemoteSnapshotRef.current) {
          return
        }

        queuedDocumentRef.current = editor.getSnapshot().document
        if (pendingSnapshotFlushRef.current !== null) {
          return
        }

        pendingSnapshotFlushRef.current = window.setTimeout(() => {
          pendingSnapshotFlushRef.current = null
          const nextDocument = queuedDocumentRef.current
          if (!nextDocument) {
            return
          }

          sendRealtimeMessage({
            type: 'board.document.replace',
            boardId,
            actorId: identity.sessionId,
            document: nextDocument,
          })
        }, 120)
      },
      { source: 'user', scope: 'document' },
    )

    return () => {
      removeDocumentListener()
      if (pendingSnapshotFlushRef.current !== null) {
        window.clearTimeout(pendingSnapshotFlushRef.current)
        pendingSnapshotFlushRef.current = null
      }
    }
  }, [boardId, editor, identity.sessionId, isSessionReady])

  useEffect(() => {
    if (!editor || !isSessionReady) {
      return
    }

    const container = boardScreenRef.current
    if (!container) {
      return
    }

    let lastSentAt = 0
    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now()
      if (now - lastSentAt < 40) {
        return
      }

      lastSentAt = now
      const point = editor.screenToPage({ x: event.clientX, y: event.clientY })

      sendRealtimeMessage({
        type: 'cursor.update',
        boardId,
        actorId: identity.sessionId,
        x: roundCoordinate(point.x),
        y: roundCoordinate(point.y),
      })
    }

    container.addEventListener('pointermove', handlePointerMove)
    return () => container.removeEventListener('pointermove', handlePointerMove)
  }, [boardId, editor, identity.sessionId, isSessionReady])

  useEffect(() => {
    if (!editor) {
      return
    }

    const resetFrame = window.requestAnimationFrame(() => {
      setConnectionState('connecting')
      setIsSessionReady(false)
      setLatencyMs(null)
      setParticipantCount(1)
      setParticipants([])
      setRemoteCursors({})
      lastServerVersionRef.current = 0
    })

    const pendingPings = pendingPingsRef.current
    const socket = new WebSocket(getBoardSocketUrl(boardId))
    websocketRef.current = socket

    socket.addEventListener('open', () => {
      socket.send(
        JSON.stringify({
          type: 'session.join',
          participant: {
            sessionId: identity.sessionId,
            displayName: identity.name,
            color: identity.color,
          },
        }),
      )
    })

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data) as BoardRealtimeServerMessage

      if (message.type === 'session.ready') {
        lastServerVersionRef.current = message.version
        setParticipantCount(message.participants.length)
        setParticipants(
          message.participants.filter((participant) => participant.sessionId !== identity.sessionId),
        )
        setConnectionState('online')
        setIsSessionReady(true)
        setRemoteCursors(indexRemoteCursors(message.cursors, identity.sessionId))

        if (message.document) {
          applyRemoteDocument(editor, message.document, isApplyingRemoteSnapshotRef)
          reapplyStyles()
        }

        return
      }

      if (message.type === 'participant.joined' || message.type === 'participant.left') {
        setParticipantCount(message.participants.length)
        setParticipants(
          message.participants.filter((participant) => participant.sessionId !== identity.sessionId),
        )

        if (message.type === 'participant.left') {
          setRemoteCursors((current) => {
            const next = { ...current }
            delete next[message.actorId]
            return next
          })
        }

        return
      }

      if (message.type === 'board.document.updated') {
        lastServerVersionRef.current = message.version

        if (message.actorId !== identity.sessionId && message.document) {
          applyRemoteDocument(editor, message.document, isApplyingRemoteSnapshotRef)
          reapplyStyles()
        }

        return
      }

      if (message.type === 'cursor.updated') {
        if (message.cursor.actorId === identity.sessionId) {
          return
        }

        setRemoteCursors((current) => ({
          ...current,
          [message.cursor.actorId]: message.cursor,
        }))
        return
      }

      if (message.type === 'cursor.cleared') {
        setRemoteCursors((current) => {
          const next = { ...current }
          delete next[message.actorId]
          return next
        })
        return
      }

      if (message.type === 'board.sync.rejected') {
        lastServerVersionRef.current = message.version
        if (message.document) {
          applyRemoteDocument(editor, message.document, isApplyingRemoteSnapshotRef)
          reapplyStyles()
        }
        return
      }

      if (message.type === 'pong') {
        const sentAt = pendingPingsRef.current.get(message.nonce)
        if (sentAt !== undefined) {
          pendingPingsRef.current.delete(message.nonce)
          setLatencyMs(Math.round(performance.now() - sentAt))
        }
        return
      }
    })

    socket.addEventListener('error', () => {
      setConnectionState('offline')
    })

    socket.addEventListener('close', () => {
      if (websocketRef.current === socket) {
        websocketRef.current = null
        setConnectionState('offline')
        setIsSessionReady(false)
      }
    })

    return () => {
      window.cancelAnimationFrame(resetFrame)

      if (websocketRef.current === socket) {
        websocketRef.current = null
      }

      socket.close()
      pendingPings.clear()
    }
  }, [boardId, editor, identity.color, identity.name, identity.sessionId])

  useEffect(() => {
    if (!isSessionReady) {
      return
    }

    const intervalId = window.setInterval(() => {
      const nonce = crypto.randomUUID()
      pendingPingsRef.current.set(nonce, performance.now())
      sendRealtimeMessage({
        type: 'ping',
        nonce,
        clientSentAtUnixMs: Date.now(),
      })
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [isSessionReady])

  useEffect(() => {
    return () => {
      if (pendingSnapshotFlushRef.current !== null) {
        window.clearTimeout(pendingSnapshotFlushRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!editor) {
      return
    }

    const handleSelectionKeyDown = async (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      const selectedShapeIds = editor.getSelectedShapeIds()
      if (selectedShapeIds.length === 0) {
        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        editor.deleteShapes(selectedShapeIds)
        setContextMenu(null)
        return
      }

      const isModifierPressed = event.metaKey || event.ctrlKey
      if (isModifierPressed && event.key.toLowerCase() === 'c') {
        event.preventDefault()
        const content = editor.getContentFromCurrentPage(selectedShapeIds)
        const resolved = await editor.resolveAssetsInContent(content)
        setCopiedContent(resolved ?? null)
        return
      }

      if (isModifierPressed && event.key.toLowerCase() === 'v' && copiedContent) {
        event.preventDefault()
        editor.putContentOntoCurrentPage(copiedContent, {
          preserveIds: false,
          preservePosition: false,
          select: true,
        })
      }
    }

    window.addEventListener('keydown', handleSelectionKeyDown)
    return () => window.removeEventListener('keydown', handleSelectionKeyDown)
  }, [copiedContent, editor])

  useEffect(() => {
    if (!editor) {
      return
    }

    const handleBoardShortcuts = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      const key = event.key.toLowerCase()
      const modifierPressed = event.metaKey || event.ctrlKey

      if (!modifierPressed) {
        if (key === 'v') {
          event.preventDefault()
          setActiveTool('select')
          return
        }

        if (key === 'h') {
          event.preventDefault()
          setActiveTool('hand')
          return
        }

        if (key === 'p') {
          event.preventDefault()
          setActiveTool('pencil')
          return
        }

        if (key === 't') {
          event.preventDefault()
          setActiveTool('text')
          return
        }

        if (key === 'r') {
          event.preventDefault()
          setActiveTool('shapes')
          return
        }

        if (key === 'e') {
          event.preventDefault()
          setActiveTool('eraser')
          return
        }

        if (key === 'l') {
          event.preventDefault()
          setActiveTool('lasso')
          return
        }

        if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
          event.preventDefault()
          setIsShortcutsOpen(true)
          return
        }

        if (event.key === 'Escape') {
          event.preventDefault()
          setContextMenu(null)
          setIsShortcutsOpen(false)
          setActiveTool('select')
          return
        }
      }

      if (modifierPressed && key === 'a') {
        event.preventDefault()
        editor.selectAll()
        return
      }

      if (modifierPressed && (key === '=' || key === '+')) {
        event.preventDefault()
        editor.zoomIn(editor.getViewportScreenCenter(), { animation: { duration: 120 } })
        setZoomLevel(Math.round(editor.getZoomLevel() * 100))
        return
      }

      if (modifierPressed && key === '-') {
        event.preventDefault()
        editor.zoomOut(editor.getViewportScreenCenter(), { animation: { duration: 120 } })
        setZoomLevel(Math.round(editor.getZoomLevel() * 100))
        return
      }

      if (modifierPressed && key === '0') {
        event.preventDefault()
        editor.resetZoom(editor.getViewportScreenCenter(), { animation: { duration: 120 } })
        setZoomLevel(Math.round(editor.getZoomLevel() * 100))
      }
    }

    window.addEventListener('keydown', handleBoardShortcuts)
    return () => window.removeEventListener('keydown', handleBoardShortcuts)
  }, [editor])

  useEffect(() => {
    const container = boardScreenRef.current
    if (!container || !editor) {
      return
    }
    const listenerOptions: AddEventListenerOptions = { passive: false, capture: true }

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > 0 && Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
        event.preventDefault()
      }

      if (event.ctrlKey) {
        event.preventDefault()
      }

      window.requestAnimationFrame(() => {
        setZoomLevel(Math.round(editor.getZoomLevel() * 100))
      })
    }

    container.addEventListener('wheel', handleWheel, listenerOptions)
    return () => container.removeEventListener('wheel', handleWheel, listenerOptions)
  }, [editor])

  const handleShare = async () => {
    await copyTextToClipboard(window.location.href)
    setShareState('copied')
  }

  const handleContextMenu = (event: ReactMouseEvent<HTMLElement>) => {
    if (!editor) {
      return
    }

    const pagePoint = editor.screenToPage({ x: event.clientX, y: event.clientY })
    const hitShape = editor.getShapeAtPoint(pagePoint, { hitInside: true, margin: 8 })

    if (!hitShape) {
      setContextMenu(null)
      return
    }

    event.preventDefault()

    const currentSelection = editor.getSelectedShapeIds()
    const nextSelectedIds = currentSelection.includes(hitShape.id) ? currentSelection : [hitShape.id]
    editor.setSelectedShapes(nextSelectedIds)

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      selectedShapeIds: nextSelectedIds,
      ...getSelectionCapabilities(editor, nextSelectedIds),
    })
  }

  const applyContextAction = (action: () => void) => {
    action()
    setContextMenu(null)
  }

  const handleMount = (mountedEditor: Editor) => {
    if (editorInstanceRef.current === mountedEditor) {
      return
    }

    editorInstanceRef.current = mountedEditor
    setEditor(mountedEditor)
    mountedEditor.setCurrentTool('select')
    setZoomLevel(Math.round(mountedEditor.getZoomLevel() * 100))
    ;(window as typeof window & { __wwbEditor?: Editor }).__wwbEditor = mountedEditor
  }

  return (
    <main
      className="board-screen"
      data-session-id={identity.sessionId}
      onContextMenu={handleContextMenu}
      ref={boardScreenRef}
    >
      <div className="board-screen__canvas">
        <Tldraw
          autoFocus
          components={tldrawComponents}
          hideUi
          onMount={handleMount}
          options={tldrawOptions}
        />
      </div>

      <SharePanel boardId={boardId} shareState={shareState} onShare={handleShare} />
      <BoardPresencePanel
        connectionState={connectionState}
        identity={identity}
        latencyMs={latencyMs}
        onLogout={onLogout}
        participantCount={participantCount}
        participants={participants}
      />
      <ToolRail activeTool={activeTool} onSelectTool={setActiveTool} />
      <ToolSettingsPanel
        activeTool={activeTool}
        drawColor={drawColor}
        drawSize={drawSize}
        eraserSize={eraserSize}
        shapeChoice={shapeChoice}
        textFont={textFont}
        textSize={textSize}
        onChangeDrawColor={setDrawColor}
        onChangeDrawSize={setDrawSize}
        onChangeEraserSize={setEraserSize}
        onChangeShapeChoice={setShapeChoice}
        onChangeTextFont={setTextFont}
        onChangeTextSize={setTextSize}
      />
      <ZoomPanel
        zoomLevel={zoomLevel}
        onZoomIn={() => {
          if (editor) {
            editor.zoomIn(editor.getViewportScreenCenter(), { animation: { duration: 150 } })
            setZoomLevel(Math.round(editor.getZoomLevel() * 100))
          }
        }}
        onZoomOut={() => {
          if (editor) {
            editor.zoomOut(editor.getViewportScreenCenter(), { animation: { duration: 150 } })
            setZoomLevel(Math.round(editor.getZoomLevel() * 100))
          }
        }}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />
      {editor ? <RemoteCursorLayer cursors={remoteCursors} editor={editor} /> : null}
      {contextMenu && editor ? (
        <SelectionContextMenu
          contextMenu={contextMenu}
          onBringToFront={() => applyContextAction(() => editor.bringToFront(contextMenu.selectedShapeIds))}
          onSendToBack={() => applyContextAction(() => editor.sendToBack(contextMenu.selectedShapeIds))}
          onDuplicate={() =>
            applyContextAction(() =>
              editor.duplicateShapes(contextMenu.selectedShapeIds, { x: 24, y: 24 }),
            )
          }
          onDelete={() => applyContextAction(() => editor.deleteShapes(contextMenu.selectedShapeIds))}
          onIncreaseDrawSize={() =>
            applyContextAction(() =>
              editor.setStyleForSelectedShapes(
                DefaultSizeStyle,
                getNextSizeChoice(drawSize),
              ),
            )
          }
          onIncreaseFontSize={() =>
            applyContextAction(() =>
              editor.setStyleForSelectedShapes(
                DefaultSizeStyle,
                getNextSizeChoice(textSize),
              ),
            )
          }
          onToggleColor={() =>
            applyContextAction(() =>
              editor.setStyleForSelectedShapes(
                DefaultColorStyle,
                getNextColorChoice(drawColor),
              ),
            )
          }
          onToggleFontFamily={() =>
            applyContextAction(() =>
              editor.setStyleForSelectedShapes(
                DefaultFontStyle,
                getNextFontChoice(textFont),
              ),
            )
          }
        />
      ) : null}
      {isShortcutsOpen ? <ShortcutModal onClose={() => setIsShortcutsOpen(false)} /> : null}
      {!isSessionReady ? <BoardStatusOverlay connectionState={connectionState} /> : null}
    </main>
  )
}

function BoardCanvasBackground() {
  const editor = useEditor()
  const gridSize = useValue('gridSize', () => editor.getDocumentSettings().gridSize, [editor])
  const camera = useValue('camera', () => editor.getCamera(), [editor])
  const minorGridSize = Math.max(gridSize * camera.z, 10)
  const majorGridSize = minorGridSize * 4
  const minorGridOpacity = getGridOpacity(minorGridSize, 10, 24, 0.04)
  const majorGridOpacity = getGridOpacity(majorGridSize, 24, 72, 0.12)
  const backgroundStyle = {
    '--board-grid-minor-size': `${minorGridSize}px`,
    '--board-grid-major-size': `${majorGridSize}px`,
    '--board-grid-minor-offset-x': `${getWrappedGridOffset(camera.x * camera.z, minorGridSize)}px`,
    '--board-grid-minor-offset-y': `${getWrappedGridOffset(camera.y * camera.z, minorGridSize)}px`,
    '--board-grid-major-offset-x': `${getWrappedGridOffset(camera.x * camera.z, majorGridSize)}px`,
    '--board-grid-major-offset-y': `${getWrappedGridOffset(camera.y * camera.z, majorGridSize)}px`,
    '--board-grid-minor-opacity': minorGridOpacity.toFixed(3),
    '--board-grid-major-opacity': majorGridOpacity.toFixed(3),
  } as CSSProperties

  return <div aria-hidden="true" className="board-canvas-background" style={backgroundStyle} />
}

function SharePanel({
  boardId,
  shareState,
  onShare,
}: {
  boardId: string
  shareState: 'idle' | 'copied'
  onShare: () => Promise<void>
}) {
  return (
    <section className="panel panel--share panel--pill panel--share-button">
      <button
        aria-label="Share board"
        className={`share-button ${shareState === 'copied' ? 'share-button--copied' : ''}`}
        onClick={() => {
          void onShare()
        }}
        type="button"
      >
        <span className="panel__badge">
          {shareState === 'copied' ? <IconCheck size={13} /> : <IconShare size={13} />}
        </span>
        <div className="share-button__meta">
          <strong>{shareState === 'copied' ? 'Link copied' : 'Share board'}</strong>
          <span>{boardId.slice(0, 8)}</span>
        </div>
      </button>
    </section>
  )
}

function BoardPresencePanel({
  connectionState,
  identity,
  latencyMs,
  onLogout,
  participantCount,
  participants,
}: {
  connectionState: ConnectionState
  identity: LocalIdentity
  latencyMs: number | null
  onLogout: () => void
  participantCount: number
  participants: Array<Pick<RealtimeParticipant, 'displayName' | 'color' | 'sessionId'>>
}) {
  const latencyLabel =
    connectionState === 'offline'
      ? 'Offline'
      : latencyMs === null
        ? 'Connecting'
        : `${latencyMs} ms`
  const visibleParticipants = participants.slice(0, 3)

  return (
    <section className="board-top-right">
      <div className={`panel panel--pill presence-chip presence-chip--status presence-chip--${connectionState}`}>
        <IconWifi size={13} />
        <span>{latencyLabel}</span>
        <span className="presence-chip__status" />
      </div>
      <div className="panel panel--pill presence-chip presence-chip--collaborators">
        <div className="presence-chip__stack">
          {visibleParticipants.map((participant) => (
            <span
              className="presence-chip__avatar"
              key={participant.sessionId}
              style={{ background: participant.color }}
              title={participant.displayName}
            >
              {getInitials(participant.displayName)}
            </span>
          ))}
        </div>
        <span>{participantCount} online</span>
      </div>
      <div className="panel panel--pill presence-chip presence-chip--user">
        <span className="presence-chip__avatar" style={{ background: identity.color }}>
          {getInitials(identity.name)}
        </span>
        <strong>{identity.name}</strong>
        <span className="presence-chip__divider" />
        <button className="logout-icon-button" onClick={onLogout} type="button">
          <IconLogout size={14} />
        </button>
      </div>
    </section>
  )
}

function RemoteCursorLayer({
  cursors,
  editor,
}: {
  cursors: Record<string, RealtimeCursor>
  editor: Editor
}) {
  const visibleCursors = useValue(
    'remoteCursorScreenPoints',
    () => {
      editor.getCamera()

      return Object.values(cursors).map((cursor) => ({
        cursor,
        screenPoint: editor.pageToScreen({ x: cursor.x, y: cursor.y }),
      }))
    },
    [editor, cursors],
  )

  return (
    <div className="remote-cursor-layer">
      {visibleCursors.map(({ cursor, screenPoint }) => {
        return (
          <div
            className="remote-cursor"
            key={cursor.actorId}
            style={{
              transform: `translate(${screenPoint.x}px, ${screenPoint.y}px)`,
            }}
          >
            <div className="remote-cursor__pointer" style={{ borderTopColor: cursor.color }} />
            <div className="remote-cursor__label" style={{ background: cursor.color }}>
              {cursor.displayName}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BoardStatusOverlay({ connectionState }: { connectionState: ConnectionState }) {
  const copy =
    connectionState === 'offline'
      ? 'Realtime connection closed. Rejoin the board to resume collaboration.'
      : 'Connecting to the live board session.'

  return (
    <div className="board-status-overlay">
      <div className="board-status-card">
        <span className="screen-eyebrow">Realtime</span>
        <strong>{connectionState === 'offline' ? 'Board offline' : 'Joining board'}</strong>
        <p>{copy}</p>
      </div>
    </div>
  )
}

function ToolRail({
  activeTool,
  onSelectTool,
}: {
  activeTool: BoardTool
  onSelectTool: (tool: BoardTool) => void
}) {
  const tools = [
    { id: 'select', name: 'Select', hint: 'V', icon: IconCursor },
    { id: 'hand', name: 'Pan', hint: 'H', icon: IconHand },
    { id: 'pencil', name: 'Pencil', hint: 'P', icon: IconPencil },
    { id: 'text', name: 'Text', hint: 'T', icon: IconText },
    { id: 'shapes', name: 'Shapes', hint: 'R', icon: IconShapes },
    { id: 'eraser', name: 'Eraser', hint: 'E', icon: IconEraser },
    { id: 'lasso', name: 'Lasso', hint: 'L', icon: IconLasso },
  ] as const

  return (
    <section className="panel panel--tools" aria-label="Board tools">
      {tools.map((tool, index) => (
        <div className="tool-rail__item" key={tool.name}>
          {index === 2 ? <div className="tool-rail__divider" /> : null}
          <button
            aria-label={tool.name}
            className={`tool-button ${activeTool === tool.id ? 'tool-button--active' : ''}`}
            onClick={() => onSelectTool(tool.id)}
            type="button"
          >
            <tool.icon size={18} />
            <span className="tool-button__hint">{tool.hint}</span>
          </button>
        </div>
      ))}
    </section>
  )
}

function ToolSettingsPanel({
  activeTool,
  drawColor,
  drawSize,
  textSize,
  textFont,
  shapeChoice,
  eraserSize,
  onChangeDrawColor,
  onChangeDrawSize,
  onChangeTextSize,
  onChangeTextFont,
  onChangeShapeChoice,
  onChangeEraserSize,
}: {
  activeTool: BoardTool
  drawColor: ColorChoice
  drawSize: SizeChoice
  textSize: SizeChoice
  textFont: FontChoice
  shapeChoice: ShapeChoice
  eraserSize: SizeChoice
  onChangeDrawColor: (value: ColorChoice) => void
  onChangeDrawSize: (value: SizeChoice) => void
  onChangeTextSize: (value: SizeChoice) => void
  onChangeTextFont: (value: FontChoice) => void
  onChangeShapeChoice: (value: ShapeChoice) => void
  onChangeEraserSize: (value: SizeChoice) => void
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    setIsCollapsed(false)
  }, [activeTool])

  if (activeTool === 'select' || activeTool === 'hand') {
    return null
  }

  if (isCollapsed) {
    return (
      <section aria-label="Tool settings (collapsed)" className="panel panel--tool-settings panel--tool-settings--collapsed">
        <button
          aria-label="Expand tool settings"
          className="tool-settings__collapse-toggle"
          onClick={() => setIsCollapsed(false)}
          type="button"
        >
          <IconChevronRight size={14} />
        </button>
      </section>
    )
  }

  const collapse = () => setIsCollapsed(true)

  return (
    <section aria-label="Tool settings" className="panel panel--tool-settings">
      {activeTool === 'pencil' ? (
        <>
          <PanelHeader title="Pencil" subtitle="Color and stroke size" onCollapse={collapse} />
          <ColorPicker mode="swatches" value={drawColor} onChange={onChangeDrawColor} />
          <SizePicker mode="dots" value={drawSize} onChange={onChangeDrawSize} />
        </>
      ) : null}

      {activeTool === 'text' ? (
        <>
          <PanelHeader title="Text" subtitle="Font and size" onCollapse={collapse} />
          <SizePicker
            label="Font size"
            renderValue={(size) => `${FONT_SIZES[size]} px`}
            value={textSize}
            onChange={onChangeTextSize}
          />
          <OptionPicker
            label="Font family"
            options={fontChoices.map((font) => ({
              id: font,
              label: FONT_FAMILIES[font],
            }))}
            value={textFont}
            onChange={(value) => onChangeTextFont(value as FontChoice)}
          />
        </>
      ) : null}

      {activeTool === 'shapes' ? (
        <>
          <PanelHeader title="Shapes" subtitle="Choose a geometry preset" onCollapse={collapse} />
          <OptionPicker
            label="Shape"
            options={shapeChoices.map((shape) => ({
              id: shape.id,
              label: shape.label,
            }))}
            value={shapeChoice}
            onChange={(value) => onChangeShapeChoice(value as ShapeChoice)}
          />
          <ColorPicker value={drawColor} onChange={onChangeDrawColor} />
          <SizePicker value={drawSize} onChange={onChangeDrawSize} />
        </>
      ) : null}

      {activeTool === 'eraser' ? (
        <>
          <PanelHeader title="Eraser" subtitle="Adjust eraser size" onCollapse={collapse} />
          <SizePicker
            label="Eraser size"
            renderValue={(size) => `${STROKE_SIZES[size]} px`}
            value={eraserSize}
            onChange={onChangeEraserSize}
          />
        </>
      ) : null}

      {activeTool === 'lasso' ? (
        <>
          <PanelHeader title="Lasso" subtitle="Selection mode" onCollapse={collapse} />
          <p className="tool-settings__helper">
            Drag on the canvas to select a region. This dedicated lasso entry currently uses the
            board selection engine.
          </p>
        </>
      ) : null}
    </section>
  )
}

function PanelHeader({ title, subtitle, onCollapse }: { title: string; subtitle: string; onCollapse?: () => void }) {
  return (
    <header className="tool-settings__header">
      <div className="tool-settings__header-text">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      {onCollapse ? (
        <button
          aria-label="Collapse tool settings"
          className="tool-settings__collapse-toggle"
          onClick={onCollapse}
          type="button"
        >
          <IconChevronLeft size={13} />
        </button>
      ) : null}
    </header>
  )
}

function ColorPicker({
  mode = 'chips',
  value,
  onChange,
}: {
  mode?: 'chips' | 'swatches'
  value: ColorChoice
  onChange: (value: ColorChoice) => void
}) {
  return (
    <OptionPicker
      label="Color"
      mode={mode}
      options={colorChoices.map((color) => ({
        id: color,
        label: color,
        swatch: colorToHex[color],
      }))}
      value={value}
      onChange={(nextValue) => onChange(nextValue as ColorChoice)}
    />
  )
}

function SizePicker({
  label = 'Size',
  mode = 'chips',
  value,
  onChange,
  renderValue = (size: SizeChoice) => `${STROKE_SIZES[size]} px`,
}: {
  label?: string
  mode?: 'chips' | 'dots'
  value: SizeChoice
  onChange: (value: SizeChoice) => void
  renderValue?: (value: SizeChoice) => string
}) {
  return (
    <OptionPicker
      label={label}
      mode={mode}
      options={sizeChoices.map((size) => ({
        id: size,
        label: renderValue(size),
        sizePx: STROKE_SIZES[size],
      }))}
      value={value}
      onChange={(nextValue) => onChange(nextValue as SizeChoice)}
    />
  )
}

function OptionPicker({
  label,
  mode = 'chips',
  options,
  value,
  onChange,
}: {
  label: string
  mode?: 'chips' | 'swatches' | 'dots'
  options: Array<{ id: string; label: string; swatch?: string; sizePx?: number }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="option-picker">
      <span className="option-picker__label">{label}</span>
      <div className={`option-picker__grid option-picker__grid--${mode}`}>
        {options.map((option) => (
          <button
            className={`option-chip option-chip--${mode} ${value === option.id ? 'option-chip--active' : ''}`}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            {option.swatch ? (
              <span
                aria-hidden="true"
                className="option-chip__swatch"
                style={{ background: option.swatch }}
              />
            ) : null}
            {option.sizePx ? <span aria-hidden="true" className="option-chip__dot" style={{ width: option.sizePx, height: option.sizePx }} /> : null}
            {mode === 'swatches' || mode === 'dots' ? null : <span>{option.label}</span>}
          </button>
        ))}
      </div>
      {(mode === 'swatches' || mode === 'dots') && options.some((option) => option.id === value) ? (
        <div className="option-picker__value">
          {options.find((option) => option.id === value)?.label}
        </div>
      ) : null}
    </div>
  )
}

function ZoomPanel({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onOpenShortcuts,
}: {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onOpenShortcuts: () => void
}) {
  return (
    <section className="panel panel--bottom-right panel--zoom">
      <div className="zoom-controls">
        <button aria-label="Zoom out" className="zoom-button" onClick={onZoomOut} type="button">
          <IconMinus size={14} />
        </button>
        <span className="zoom-level">{zoomLevel}%</span>
        <button aria-label="Zoom in" className="zoom-button" onClick={onZoomIn} type="button">
          <IconPlus size={14} />
        </button>
        <span className="zoom-divider" />
        <button aria-label="Zoom options" className="zoom-button" type="button">
          <IconChevronDown size={14} />
        </button>
      </div>
      <button aria-label="Open shortcuts" className="shortcut-button" onClick={onOpenShortcuts} type="button">
        <IconKeyboard size={16} />
      </button>
    </section>
  )
}

function ShortcutModal({ onClose }: { onClose: () => void }) {
  const modifierLabel = isMacPlatform ? 'Cmd' : 'Ctrl'
  const groups = [
    {
      title: 'Tools',
      items: [
        ['Select', 'V'],
        ['Pan', 'H'],
        ['Pencil', 'P'],
        ['Text', 'T'],
        ['Shapes', 'R'],
        ['Eraser', 'E'],
        ['Lasso', 'L'],
      ],
    },
    {
      title: 'Canvas',
      items: [
        ['Pan canvas', 'Two-finger drag'],
        ['Zoom in / out', `${modifierLabel} + scroll`],
        ['Zoom to 100%', `${modifierLabel}  0`],
      ],
    },
    {
      title: 'Editing',
      items: [
        ['Select all', `${modifierLabel}  A`],
        ['Copy', `${modifierLabel}  C`],
        ['Paste', `${modifierLabel}  V`],
        ['Duplicate', `${modifierLabel}  D`],
        ['Delete', isMacPlatform ? 'Delete' : 'Del'],
        ['Close popup', 'Esc'],
      ],
    },
  ]

  return (
    <div className="shortcut-overlay" onClick={onClose} role="presentation">
      <section
        aria-label="Shortcut reference"
        className="shortcut-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shortcut-modal__header">
          <div className="shortcut-modal__title">
            <IconKeyboard size={16} />
            <h2>Keyboard shortcuts</h2>
          </div>
          <button aria-label="Close shortcuts" className="shortcut-modal__close" onClick={onClose} type="button">
            <IconClose size={14} />
          </button>
        </div>
        <div className="shortcut-groups">
          {groups.map((group) => (
            <section className={`shortcut-group shortcut-group--${group.title.toLowerCase()}`} key={group.title}>
              <span className="screen-eyebrow">{group.title}</span>
              <div className="shortcut-list">
                {group.items.map(([action, keys]) => (
                  <div className="shortcut-row" key={action}>
                    <span>{action}</span>
                    <span className="shortcut-row__keys">
                      {keys.split('  ').map((part, index) => (
                        <kbd key={`${action}-${index}`}>{part}</kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}

function SelectionContextMenu({
  contextMenu,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onToggleColor,
  onIncreaseFontSize,
  onIncreaseDrawSize,
  onToggleFontFamily,
}: {
  contextMenu: ContextMenuState
  onBringToFront: () => void
  onSendToBack: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleColor: () => void
  onIncreaseFontSize: () => void
  onIncreaseDrawSize: () => void
  onToggleFontFamily: () => void
}) {
  return (
    <section
      className="selection-menu"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      <button className="selection-menu__item" onClick={onBringToFront} type="button">
        <span className="selection-menu__icon"><IconFront size={14} /></span>
        <span>Bring to front</span>
        <kbd>]</kbd>
      </button>
      <button className="selection-menu__item" onClick={onSendToBack} type="button">
        <span className="selection-menu__icon"><IconBack size={14} /></span>
        <span>Send to back</span>
        <kbd>[</kbd>
      </button>
      <button className="selection-menu__item" onClick={onDuplicate} type="button">
        <span className="selection-menu__icon"><IconDuplicate size={14} /></span>
        <span>Duplicate</span>
        <kbd>{modifierGlyph()} D</kbd>
      </button>
      <button className="selection-menu__item" onClick={onDelete} type="button">
        <span className="selection-menu__icon"><IconTrash size={14} /></span>
        <span>Delete</span>
        <kbd>Del</kbd>
      </button>
      {contextMenu.supportsColor ? (
        <button className="selection-menu__item" onClick={onToggleColor} type="button">
          <span className="selection-menu__icon"><IconPalette size={14} /></span>
          <span>Change color</span>
        </button>
      ) : null}
      {contextMenu.supportsFont ? (
        <>
          <button className="selection-menu__item" onClick={onIncreaseFontSize} type="button">
            <span className="selection-menu__icon menu-text-icon">A+</span>
            <span>Increase font size</span>
          </button>
          <button className="selection-menu__item" onClick={onToggleFontFamily} type="button">
            <span className="selection-menu__icon"><IconType size={14} /></span>
            <span>Font family</span>
          </button>
        </>
      ) : null}
      {contextMenu.supportsDrawSize ? (
        <button className="selection-menu__item" onClick={onIncreaseDrawSize} type="button">
          <span className="selection-menu__icon menu-text-icon">A+</span>
          <span>Increase draw size</span>
        </button>
      ) : null}
    </section>
  )
}

function NotFoundScreen({ onNavigate }: { onNavigate: (pathname: string) => void }) {
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <span className="screen-eyebrow">Invalid route</span>
        <h1>Only the homepage and board routes are valid.</h1>
        <p>
          The app supports <code>/</code> and <code>/board/{'{guid}'}</code>. Use the homepage to
          get back into a valid flow.
        </p>
        <button
          className="primary-button"
          onClick={() => onNavigate('/')}
          type="button"
        >
          Return home
        </button>
      </section>
    </main>
  )
}

function TopRightIdentity({
  identity,
  onLogout,
}: {
  identity: LocalIdentity
  onLogout: () => void
}) {
  return (
    <section className="floating-identity">
      <div className="panel panel--pill presence-chip presence-chip--user">
        <span className="presence-chip__avatar" style={{ background: identity.color }}>
          {getInitials(identity.name)}
        </span>
        <strong>{identity.name}</strong>
        <span className="presence-chip__divider" />
        <button className="logout-icon-button" onClick={onLogout} type="button">
          <IconLogout size={14} />
        </button>
      </div>
    </section>
  )
}

function getRoute(pathname: string): RouteState {
  if (pathname === '/') {
    return { kind: 'home' }
  }

  const boardMatch = /^\/board\/([0-9a-fA-F-]+)$/.exec(pathname)
  if (boardMatch) {
    return { kind: 'board', boardId: boardMatch[1].toLowerCase() }
  }

  return { kind: 'not-found' }
}

function createIdentity(name: string, color = colorPalette[Math.floor(Math.random() * colorPalette.length)]): LocalIdentity {
  return {
    sessionId: name,
    name,
    color,
  }
}

function indexRemoteCursors(cursors: RealtimeCursor[], ownActorId: string) {
  return cursors.reduce<Record<string, RealtimeCursor>>((accumulator, cursor) => {
    if (cursor.actorId !== ownActorId) {
      accumulator[cursor.actorId] = cursor
    }

    return accumulator
  }, {})
}

function applyRemoteDocument(
  editor: Editor,
  document: BoardDocumentSnapshot,
  isApplyingRemoteSnapshotRef: { current: boolean },
) {
  isApplyingRemoteSnapshotRef.current = true

  try {
    editor.loadSnapshot({ document })
  } finally {
    window.requestAnimationFrame(() => {
      isApplyingRemoteSnapshotRef.current = false
    })
  }
}

function getBoardSocketUrl(boardId: string) {
  if (apiBaseUrl) {
    const url = new URL(apiBaseUrl, window.location.origin)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = `${url.pathname.replace(/\/$/, '')}/ws/boards/${boardId}`
    return url.toString()
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/boards/${boardId}`
}

function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getGridOpacity(size: number, minVisibleSize: number, fullyVisibleSize: number, maxOpacity: number) {
  const visibility = clamp((size - minVisibleSize) / (fullyVisibleSize - minVisibleSize), 0, 1)
  return visibility * maxOpacity
}

function getWrappedGridOffset(offset: number, size: number) {
  const normalizedOffset = offset % size
  return normalizedOffset >= 0 ? normalizedOffset : size + normalizedOffset
}

function loadIdentity(): LocalIdentity | null {
  try {
    const rawValue = window.localStorage.getItem(identityStorageKey)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as LocalIdentity
    if (!parsed.name || !parsed.sessionId || !parsed.color) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function persistIdentity(identity: LocalIdentity) {
  window.localStorage.setItem(identityStorageKey, JSON.stringify(identity))
}

function clearIdentity() {
  window.localStorage.removeItem(identityStorageKey)
}

function loadBoardHistoryStore(): BoardHistoryStore {
  try {
    const rawValue = window.localStorage.getItem(boardHistoryStorageKey)
    if (!rawValue) {
      return {}
    }

    return JSON.parse(rawValue) as BoardHistoryStore
  } catch {
    return {}
  }
}

function initializeBoardHistoryStore() {
  const store = loadBoardHistoryStore()
  const identity = loadIdentity()
  const route = getRoute(window.location.pathname)

  if (!identity || route.kind !== 'board') {
    return store
  }

  return rememberBoardForIdentity(store, identity.sessionId, route.boardId)
}

function rememberBoardForIdentity(
  currentStore: BoardHistoryStore,
  sessionId: string,
  boardId: string,
): BoardHistoryStore {
  const nextBoard: KnownBoard = {
    boardId,
    lastVisitedAt: new Date().toISOString(),
  }

  const previousBoards = currentStore[sessionId] ?? []
  const nextBoards = [nextBoard, ...previousBoards.filter((board) => board.boardId !== boardId)]
  const trimmedBoards = nextBoards.slice(0, 20)
  const nextStore = {
    ...currentStore,
    [sessionId]: trimmedBoards,
  }

  window.localStorage.setItem(boardHistoryStorageKey, JSON.stringify(nextStore))
  return nextStore
}

function shortBoardId(boardId: string) {
  return `Board ${boardId.slice(0, 8)}`
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function getBoardPreviewPalette(boardId: string) {
  const palette = ['#3b82f6', '#f59e0b', '#22c55e', '#e5e7eb']
  const seed = Array.from(boardId).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return Array.from({ length: 4 }, (_, index) => palette[(seed + index) % palette.length]).slice(0, 4)
}

function modifierGlyph() {
  return isMacPlatform ? 'Cmd' : 'Ctrl'
}

function toMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

function formatRelative(isoString: string) {
  const deltaMs = Date.now() - new Date(isoString).getTime()
  const deltaMinutes = Math.max(1, Math.round(deltaMs / 60000))

  if (deltaMinutes < 60) {
    return `${deltaMinutes} min ago`
  }

  const deltaHours = Math.round(deltaMinutes / 60)
  if (deltaHours < 24) {
    return `${deltaHours} hr ago`
  }

  const deltaDays = Math.round(deltaHours / 24)
  return `${deltaDays} day${deltaDays === 1 ? '' : 's'} ago`
}

function getSelectionCapabilities(editor: Editor, selectedShapeIds: TLShapeId[]) {
  const selectedShapes = editor.getSelectedShapes().filter((shape) => selectedShapeIds.includes(shape.id))
  const shapeTypes = new Set(selectedShapes.map((shape) => shape.type))

  return {
    supportsColor: selectedShapes.some((shape) => ['draw', 'geo', 'text'].includes(shape.type)),
    supportsDrawSize: selectedShapes.some((shape) => ['draw', 'geo'].includes(shape.type)),
    supportsFont: selectedShapes.some((shape) => shapeTypes.has('text') && shape.type === 'text'),
  }
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function getNextSizeChoice(size: SizeChoice): SizeChoice {
  const currentIndex = sizeChoices.indexOf(size)
  return sizeChoices[Math.min(sizeChoices.length - 1, currentIndex + 1)]
}

function getNextColorChoice(color: ColorChoice): ColorChoice {
  const currentIndex = colorChoices.indexOf(color)
  return colorChoices[(currentIndex + 1) % colorChoices.length]
}

function getNextFontChoice(font: FontChoice): FontChoice {
  const currentIndex = fontChoices.indexOf(font)
  return fontChoices[(currentIndex + 1) % fontChoices.length]
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall back to a temporary textarea when async clipboard access is denied.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.setAttribute('readonly', 'true')
  textArea.style.position = 'absolute'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}

const colorToHex: Record<ColorChoice, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f59e0b',
  red: '#ef4444',
  violet: '#a855f7',
  black: '#1f2430',
}

function BrandHeader() {
  return (
    <header className="brand-header">
      <span className="brand-header__mark" />
      <span className="brand-header__name">WebWhiteBoard</span>
    </header>
  )
}

function IconBase({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  )
}

function IconCursor({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M5 3 L5 19 L9.5 15.5 L12 21 L15 20 L12.5 14 L19 14 Z" /></IconBase>
}

function IconHand({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M6 11 V6.5 a1.5 1.5 0 0 1 3 0 V11" /><path d="M9 11 V5 a1.5 1.5 0 0 1 3 0 V11" /><path d="M12 11 V5.5 a1.5 1.5 0 0 1 3 0 V11" /><path d="M15 11 V8 a1.5 1.5 0 0 1 3 0 V14 a6 6 0 0 1 -6 6 H10 a4 4 0 0 1 -4 -4 V11 a1.5 1.5 0 0 1 3 0" /></IconBase>
}

function IconPencil({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M16 3 L21 8 L8 21 L3 21 L3 16 Z" /><path d="M14 5 L19 10" /></IconBase>
}

function IconText({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M5 5 L19 5" /><path d="M12 5 L12 20" /></IconBase>
}

function IconShapes({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="9" rx="1.5" width="9" x="3" y="3" /><circle cx="16.5" cy="16.5" r="4.5" /></IconBase>
}

function IconEraser({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M16 4 L20 8 L10 18 L6 18 L4 16 Z" /><path d="M10 18 L15 13" /><path d="M9 21 L21 21" /></IconBase>
}

function IconLasso({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M4 6 C4 3.5 9 2.5 12 2.5 C17 2.5 20 5 20 8 C20 11 17 13 12 13 C9 13 6.5 12 5.5 11" /><path d="M5.5 11 C5 13 6 16 7 17.5" /><circle cx="7.5" cy="19" r="2" /></IconBase>
}

function IconShare({ size }: { size?: number }) {
  return <IconBase size={size}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8 11 L16 7" /><path d="M8 13 L16 17" /></IconBase>
}

function IconCheck({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M5 12 L10 17 L19 7" /></IconBase>
}

function IconWifi({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M3 9 a13 13 0 0 1 18 0" /><path d="M6 12.5 a8 8 0 0 1 12 0" /><path d="M9 16 a3.5 3.5 0 0 1 6 0" /><circle cx="12" cy="19" fill="currentColor" r=".8" stroke="none" /></IconBase>
}

function IconLogout({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M14 4 H5 a1 1 0 0 0 -1 1 V19 a1 1 0 0 0 1 1 H14" /><path d="M10 12 H20" /><path d="M17 9 L20 12 L17 15" /></IconBase>
}

function IconPlus({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M12 5 L12 19" /><path d="M5 12 L19 12" /></IconBase>
}

function IconMinus({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M5 12 L19 12" /></IconBase>
}

function IconChevronDown({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M6 10 L12 16 L18 10" /></IconBase>
}

function IconChevronLeft({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M14 6 L8 12 L14 18" /></IconBase>
}

function IconChevronRight({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M10 6 L16 12 L10 18" /></IconBase>
}

function IconKeyboard({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="13" rx="2" width="19" x="2.5" y="6" /><path d="M6 10 H6.01" /><path d="M10 10 H10.01" /><path d="M14 10 H14.01" /><path d="M18 10 H18.01" /><path d="M7 14.5 H17" /></IconBase>
}

function IconClose({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M6 6 L18 18" /><path d="M18 6 L6 18" /></IconBase>
}

function IconBoard({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="14" rx="1.5" width="18" x="3" y="4" /><path d="M3 9 H21" /><path d="M9 4 V9" /></IconBase>
}

function IconSearch({ size }: { size?: number }) {
  return <IconBase size={size}><circle cx="11" cy="11" r="6" /><path d="M16 16 L20 20" /></IconBase>
}

function IconMore({ size }: { size?: number }) {
  return <IconBase size={size}><circle cx="6" cy="12" fill="currentColor" r="1" stroke="none" /><circle cx="12" cy="12" fill="currentColor" r="1" stroke="none" /><circle cx="18" cy="12" fill="currentColor" r="1" stroke="none" /></IconBase>
}

function IconFront({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="11" rx="1.5" width="11" x="4" y="4" /><rect fill="white" height="11" rx="1.5" stroke="currentColor" width="11" x="9" y="9" /></IconBase>
}

function IconBack({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="11" rx="1.5" width="11" x="9" y="9" /><rect fill="white" height="11" rx="1.5" stroke="currentColor" width="11" x="4" y="4" /></IconBase>
}

function IconDuplicate({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="12" rx="1.5" width="12" x="8" y="8" /><path d="M5 16 H4 a1 1 0 0 1 -1 -1 V4 a1 1 0 0 1 1 -1 H15 a1 1 0 0 1 1 1 V5" /></IconBase>
}

function IconTrash({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M4 7 H20" /><path d="M9 7 V4 H15 V7" /><path d="M6 7 L7 20 H17 L18 7" /></IconBase>
}

function IconPalette({ size }: { size?: number }) {
  return <IconBase size={size}><circle cx="7.5" cy="11" fill="currentColor" r="1.2" stroke="none" /><circle cx="12" cy="8" fill="currentColor" r="1.2" stroke="none" /><circle cx="16.5" cy="11" fill="currentColor" r="1.2" stroke="none" /><path d="M12 3 a9 9 0 1 0 0 18 c1 0 1.5 -.7 1.5 -1.5 c0 -1.2 -1.5 -1.5 -1.5 -3 c0 -1 .8 -2 2 -2 H17 a4 4 0 0 0 4 -4 A9 9 0 0 0 12 3 z" /></IconBase>
}

function IconType({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M4 4 H11 V6" /><path d="M7.5 4 V14" /><path d="M5.5 14 H9.5" /><path d="M13 11 H20 V12.5" /><path d="M16.5 11 V20" /><path d="M14.5 20 H18.5" /></IconBase>
}

export default App
