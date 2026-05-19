import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import 'tldraw/tldraw.css'
import {
  DefaultColorStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
  Editor,
  GeoShapeGeoStyle,
  Tldraw,
} from 'tldraw'
import type { TLContent } from 'tldraw'
import { createBoardAssetStore } from '../../app/assetStore'
import { copyTextToClipboard, applyRemoteDocument, getBoardSocketUrl, getNextColorChoice, getNextFontChoice, getNextSizeChoice, getSelectionCapabilities, indexRemoteCursors, isEditableTarget, roundCoordinate } from '../../app/utils'
import type {
  BoardUploadNotice,
  BoardDocumentSnapshot,
  BoardRealtimeClientMessage,
  BoardRealtimeServerMessage,
  BoardTool,
  ConnectionState,
  ContextMenuState,
  FontChoice,
  LocalIdentity,
  RealtimeCursor,
  RealtimeParticipant,
  ShapeChoice,
  SizeChoice,
} from '../../app/types'
import { BoardCanvasBackground } from './BoardCanvasBackground'
import { BoardPresencePanel, SharePanel, ZoomPanel } from './BoardPanels'
import { BoardStatusOverlay } from './BoardStatusOverlay'
import { BoardUploadNotice as BoardUploadNoticeToast } from './BoardUploadNotice'
import { RemoteCursorLayer } from './RemoteCursorLayer'
import { SelectionContextMenu } from './SelectionContextMenu'
import { ShortcutModal } from './ShortcutModal'
import { ToolRail } from './ToolRail'
import { ToolSettingsPanel } from './ToolSettingsPanel'

type BoardScreenProps = {
  boardId: string
  identity: LocalIdentity
  onLogout: () => void
}

export function BoardScreen({ boardId, identity, onLogout }: BoardScreenProps) {
  const boardScreenRef = useRef<HTMLElement | null>(null)
  const editorInstanceRef = useRef<Editor | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const pendingSnapshotFlushRef = useRef<number | null>(null)
  const queuedDocumentRef = useRef<BoardDocumentSnapshot | null>(null)
  const pendingPingsRef = useRef(new Map<string, number>())
  const uploadNoticeSequenceRef = useRef(0)
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
  const [drawColor, setDrawColor] = useState<'blue' | 'green' | 'orange' | 'red' | 'violet' | 'black'>('blue')
  const [drawSize, setDrawSize] = useState<SizeChoice>('m')
  const [textSize, setTextSize] = useState<SizeChoice>('l')
  const [textFont, setTextFont] = useState<FontChoice>('sans')
  const [eraserSize, setEraserSize] = useState<SizeChoice>('l')
  const [shapeChoice, setShapeChoice] = useState<ShapeChoice>('rectangle')
  const [copiedContent, setCopiedContent] = useState<TLContent | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [uploadNotice, setUploadNotice] = useState<BoardUploadNotice | null>(null)
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
  const assetStore = useMemo(
    () =>
      createBoardAssetStore({
        onUploadError: (message) => {
          uploadNoticeSequenceRef.current += 1
          setUploadNotice({
            id: uploadNoticeSequenceRef.current,
            message,
          })
        },
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
    if (!uploadNotice) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setUploadNotice((current) => (current?.id === uploadNotice.id ? null : current))
    }, 5000)

    return () => window.clearTimeout(timeoutId)
  }, [uploadNotice])

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.setCurrentTool('select')
  }, [editor])

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
          assets={assetStore}
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
        key={activeTool}
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
              editor.setStyleForSelectedShapes(DefaultSizeStyle, getNextSizeChoice(drawSize)),
            )
          }
          onIncreaseFontSize={() =>
            applyContextAction(() =>
              editor.setStyleForSelectedShapes(DefaultSizeStyle, getNextSizeChoice(textSize)),
            )
          }
          onToggleColor={() =>
            applyContextAction(() =>
              editor.setStyleForSelectedShapes(DefaultColorStyle, getNextColorChoice(drawColor)),
            )
          }
          onToggleFontFamily={() =>
            applyContextAction(() =>
              editor.setStyleForSelectedShapes(DefaultFontStyle, getNextFontChoice(textFont)),
            )
          }
        />
      ) : null}
      {isShortcutsOpen ? <ShortcutModal onClose={() => setIsShortcutsOpen(false)} /> : null}
      {uploadNotice ? (
        <BoardUploadNoticeToast
          notice={uploadNotice}
          onDismiss={() => setUploadNotice((current) => (current?.id === uploadNotice.id ? null : current))}
        />
      ) : null}
      {!isSessionReady ? <BoardStatusOverlay connectionState={connectionState} /> : null}
    </main>
  )
}
