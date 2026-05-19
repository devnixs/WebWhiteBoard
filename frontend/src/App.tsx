import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, MouseEvent as ReactMouseEvent } from 'react'
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
type BoardTool = 'select' | 'pencil' | 'text' | 'shapes' | 'eraser' | 'lasso'
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
const colorPalette = ['#2764ff', '#22a06b', '#eb5e41', '#8f46ff', '#efb100', '#d94f9d']
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

  const handleLogin = (name: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    const nextIdentity = createIdentity(trimmedName)
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
  onLogin: (name: string) => void
}) {
  const [name, setName] = useState('')

  const destinationLabel =
    route.kind === 'board' ? `You will join board ${shortBoardId(route.boardId)} right away.` : null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onLogin(name)
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <span className="screen-eyebrow">First visit</span>
        <h1>Choose the name other people will see.</h1>
        <p>
          This name is stored on this device and reused until you log out. A random color is
          assigned when you continue.
        </p>
        {destinationLabel ? <p className="auth-card__hint">{destinationLabel}</p> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            autoFocus
            maxLength={48}
            placeholder="Maya Chen"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button type="submit">Continue</button>
        </form>
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
    <main className="home-screen">
      <TopRightIdentity identity={identity} onLogout={onLogout} />

      <section className="home-shell">
        <div className="home-hero">
          <span className="screen-eyebrow">Homepage</span>
          <h1>Return to a known board or create a new one.</h1>
          <p>
            Only boards already associated with <strong>{identity.name}</strong> are listed here on
            this device.
          </p>
        </div>

        <div className="home-grid">
          <section className="home-card">
            <h2>New board</h2>
            <p>Create a new collaborative board and jump into it immediately.</p>
            <button
              className="primary-button"
              disabled={isCreatingBoard}
              onClick={() => {
                void handleCreateBoard()
              }}
              type="button"
            >
              {isCreatingBoard ? 'Creating board…' : 'Create board'}
            </button>
          </section>

          <section className="home-card">
            <h2>Load an existing board</h2>
            <p>Paste a board GUID to open an existing shared board directly.</p>
            <form className="join-form" onSubmit={handleJoinBoard}>
              <label htmlFor="board-id">Board id</label>
              <input
                id="board-id"
                placeholder="00000000-0000-0000-0000-000000000000"
                value={joinBoardId}
                onChange={(event) => setJoinBoardId(event.target.value)}
              />
              <button className="secondary-button" type="submit">
                Open board
              </button>
            </form>
          </section>
        </div>

        <section className="home-card home-card--boards">
          <div className="home-card__header">
            <div>
              <span className="screen-eyebrow">Known boards</span>
              <h2>Your recent boards</h2>
            </div>
            <span className="board-count">{knownBoards.length}</span>
          </div>

          {knownBoards.length === 0 ? (
            <p className="empty-state">
              No boards are stored yet for this identity. Create one or open a shared board by id.
            </p>
          ) : (
            <div className="board-list">
              {knownBoards.map((board) => (
                <button
                  className="board-row"
                  key={board.boardId}
                  onClick={() => onNavigate(`/board/${board.boardId}`)}
                  type="button"
                >
                  <div>
                    <strong>{shortBoardId(board.boardId)}</strong>
                    <p>/board/{board.boardId}</p>
                  </div>
                  <span>{formatRelative(board.lastVisitedAt)}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {error ? <p className="home-error">{error}</p> : null}
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
        setConnectionState('online')
        setIsSessionReady(true)
        setRemoteCursors(indexRemoteCursors(message.cursors, identity.sessionId))

        if (message.document) {
          applyRemoteDocument(editor, message.document, isApplyingRemoteSnapshotRef)
        }

        return
      }

      if (message.type === 'participant.joined' || message.type === 'participant.left') {
        setParticipantCount(message.participants.length)

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

    const handlePaste = async (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith('image/'),
      )

      if (files.length === 0) {
        return
      }

      event.preventDefault()
      await editor.putExternalContent({ type: 'files', files })
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [editor])

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
  const minorGridSize = Math.max(gridSize * camera.z, 1)
  const majorGridSize = Math.max(minorGridSize * 4, 1)
  const minorOpacity = getGridOpacity(minorGridSize, 14, 26, 0.16)
  const majorOpacity = getGridOpacity(majorGridSize, 22, 52, 0.24)
  const backgroundStyle = {
    '--board-grid-minor-size': `${minorGridSize}px`,
    '--board-grid-major-size': `${majorGridSize}px`,
    '--board-grid-minor-offset-x': `${getWrappedGridOffset(0.5 + camera.x * camera.z, minorGridSize)}px`,
    '--board-grid-minor-offset-y': `${getWrappedGridOffset(0.5 + camera.y * camera.z, minorGridSize)}px`,
    '--board-grid-major-offset-x': `${getWrappedGridOffset(0.5 + camera.x * camera.z, majorGridSize)}px`,
    '--board-grid-major-offset-y': `${getWrappedGridOffset(0.5 + camera.y * camera.z, majorGridSize)}px`,
    '--board-grid-minor-opacity': minorOpacity.toFixed(3),
    '--board-grid-major-opacity': majorOpacity.toFixed(3),
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
    <section className="panel panel--share panel--share-button">
      <button
        aria-label="Share board"
        className={`share-button ${shareState === 'copied' ? 'share-button--copied' : ''}`}
        onClick={() => {
          void onShare()
        }}
        type="button"
      >
        <span className="panel__badge">{shareState === 'copied' ? 'Copied' : 'Share'}</span>
        <div className="share-button__meta">
          <strong>{shortBoardId(boardId)}</strong>
          <span>{shareState === 'copied' ? 'Board URL copied to clipboard' : `/board/${boardId}`}</span>
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
}: {
  connectionState: ConnectionState
  identity: LocalIdentity
  latencyMs: number | null
  onLogout: () => void
  participantCount: number
}) {
  const latencyLabel =
    connectionState === 'offline'
      ? 'Offline'
      : latencyMs === null
        ? 'Connecting'
        : `${latencyMs} ms`

  return (
    <section className="panel panel--top-right panel--presence">
      <div className={`presence-chip presence-chip--status presence-chip--${connectionState}`}>
        <span className="presence-chip__status" />
        <span>{latencyLabel}</span>
      </div>
      <div className="presence-chip">
        <span>{participantCount} live</span>
      </div>
      <div className="presence-chip presence-chip--user">
        <span className="presence-chip__avatar" style={{ background: identity.color }}>
          {getInitials(identity.name)}
        </span>
        <div className="presence-chip__meta">
          <strong>{identity.name}</strong>
          <span>{identity.sessionId}</span>
        </div>
      </div>
      <button className="logout-button" onClick={onLogout} type="button">
        Logout
      </button>
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
  const visibleCursors = Object.values(cursors)

  return (
    <div className="remote-cursor-layer">
      {visibleCursors.map((cursor) => {
        const screenPoint = editor.pageToScreen({ x: cursor.x, y: cursor.y })

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
    { id: 'select', name: 'Select', hint: 'V' },
    { id: 'pencil', name: 'Pencil', hint: 'P' },
    { id: 'text', name: 'Text', hint: 'T' },
    { id: 'shapes', name: 'Shapes', hint: 'R' },
    { id: 'eraser', name: 'Eraser', hint: 'E' },
    { id: 'lasso', name: 'Lasso', hint: 'L' },
  ] as const

  return (
    <section className="panel panel--tools" aria-label="Board tools">
      {tools.map((tool) => (
        <button
          className={`tool-button ${activeTool === tool.id ? 'tool-button--active' : ''}`}
          key={tool.name}
          onClick={() => onSelectTool(tool.id)}
          type="button"
        >
          <span>{tool.name}</span>
          <span className="tool-button__hint">{tool.hint}</span>
        </button>
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
  if (activeTool === 'select') {
    return null
  }

  return (
    <section className="panel panel--tool-settings">
      {activeTool === 'pencil' ? (
        <>
          <PanelHeader title="Pencil" subtitle="Color and stroke size" />
          <ColorPicker value={drawColor} onChange={onChangeDrawColor} />
          <SizePicker value={drawSize} onChange={onChangeDrawSize} />
        </>
      ) : null}

      {activeTool === 'text' ? (
        <>
          <PanelHeader title="Text" subtitle="Font and size" />
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
          <PanelHeader title="Shapes" subtitle="Choose a geometry preset" />
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
          <PanelHeader title="Eraser" subtitle="Adjust eraser size" />
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
          <PanelHeader title="Lasso" subtitle="Selection mode" />
          <p className="tool-settings__helper">
            Drag on the canvas to select a region. This dedicated lasso entry currently uses the
            board selection engine.
          </p>
        </>
      ) : null}
    </section>
  )
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="tool-settings__header">
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </header>
  )
}

function ColorPicker({
  value,
  onChange,
}: {
  value: ColorChoice
  onChange: (value: ColorChoice) => void
}) {
  return (
    <OptionPicker
      label="Color"
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
  value,
  onChange,
  renderValue = (size: SizeChoice) => `${STROKE_SIZES[size]} px`,
}: {
  label?: string
  value: SizeChoice
  onChange: (value: SizeChoice) => void
  renderValue?: (value: SizeChoice) => string
}) {
  return (
    <OptionPicker
      label={label}
      options={sizeChoices.map((size) => ({
        id: size,
        label: renderValue(size),
      }))}
      value={value}
      onChange={(nextValue) => onChange(nextValue as SizeChoice)}
    />
  )
}

function OptionPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ id: string; label: string; swatch?: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="option-picker">
      <span className="option-picker__label">{label}</span>
      <div className="option-picker__grid">
        {options.map((option) => (
          <button
            className={`option-chip ${value === option.id ? 'option-chip--active' : ''}`}
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
            <span>{option.label}</span>
          </button>
        ))}
      </div>
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
          -
        </button>
        <span className="zoom-level">{zoomLevel}%</span>
        <button aria-label="Zoom in" className="zoom-button" onClick={onZoomIn} type="button">
          +
        </button>
      </div>
      <button className="shortcut-button" onClick={onOpenShortcuts} type="button">
        Shortcuts
      </button>
    </section>
  )
}

function ShortcutModal({ onClose }: { onClose: () => void }) {
  const modifierLabel = isMacPlatform ? 'Cmd' : 'Ctrl'
  const shortcuts = [
    { action: 'Select tool', keys: 'V' },
    { action: 'Pencil tool', keys: 'P' },
    { action: 'Text tool', keys: 'T' },
    { action: 'Shapes tool', keys: 'R' },
    { action: 'Eraser tool', keys: 'E' },
    { action: 'Lasso tool', keys: 'L' },
    { action: 'Select all', keys: `${modifierLabel}+A` },
    { action: 'Copy selection', keys: `${modifierLabel}+C` },
    { action: 'Paste selection', keys: `${modifierLabel}+V` },
    { action: 'Delete selection', keys: isMacPlatform ? 'Delete' : 'Delete / Backspace' },
    { action: 'Zoom in', keys: `${modifierLabel} +` },
    { action: 'Zoom out', keys: `${modifierLabel} -` },
    { action: 'Reset zoom', keys: `${modifierLabel}+0` },
    { action: 'Open shortcuts', keys: '?' },
    { action: 'Close this popup', keys: 'Esc' },
  ]

  return (
    <div className="shortcut-overlay" onClick={onClose} role="presentation">
      <section
        aria-label="Shortcut reference"
        className="shortcut-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shortcut-modal__header">
          <div>
            <span className="screen-eyebrow">Shortcuts</span>
            <h2>Board keyboard reference</h2>
          </div>
          <button className="shortcut-modal__close" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="shortcut-list">
          {shortcuts.map((shortcut) => (
            <div className="shortcut-row" key={shortcut.action}>
              <span>{shortcut.action}</span>
              <kbd>{shortcut.keys}</kbd>
            </div>
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
        Move to front
      </button>
      <button className="selection-menu__item" onClick={onSendToBack} type="button">
        Move to back
      </button>
      <button className="selection-menu__item" onClick={onDuplicate} type="button">
        Duplicate
      </button>
      <button className="selection-menu__item" onClick={onDelete} type="button">
        Delete
      </button>
      {contextMenu.supportsColor ? (
        <button className="selection-menu__item" onClick={onToggleColor} type="button">
          Change color
        </button>
      ) : null}
      {contextMenu.supportsFont ? (
        <>
          <button className="selection-menu__item" onClick={onIncreaseFontSize} type="button">
            Increase font size
          </button>
          <button className="selection-menu__item" onClick={onToggleFontFamily} type="button">
            Change font family
          </button>
        </>
      ) : null}
      {contextMenu.supportsDrawSize ? (
        <button className="selection-menu__item" onClick={onIncreaseDrawSize} type="button">
          Increase draw size
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
      <div className="presence-chip presence-chip--user">
        <span className="presence-chip__avatar" style={{ background: identity.color }}>
          {getInitials(identity.name)}
        </span>
        <div className="presence-chip__meta">
          <strong>{identity.name}</strong>
          <span>{identity.sessionId}</span>
        </div>
      </div>
      <button className="logout-button" onClick={onLogout} type="button">
        Logout
      </button>
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

function createIdentity(name: string): LocalIdentity {
  return {
    sessionId: name,
    name,
    color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
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
  blue: '#2764ff',
  green: '#22a06b',
  orange: '#ef8c00',
  red: '#df4337',
  violet: '#7f56d9',
  black: '#102033',
}

export default App
