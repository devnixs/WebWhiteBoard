import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  appendElement,
  bringSelectionToFront,
  createEmptyBoardDocument,
  createImageElement,
  createInitialViewport,
  createRuntimeDebugState,
  createShapeElement,
  createStrokeElement,
  createTextElement,
  duplicateElements,
  eraseAtPoint,
  formatZoomLevel,
  getBoundsCenter,
  getElementsByIds,
  getEraserRadius,
  getResizeHandleAtPoint,
  getRotateHandlePoint,
  getSelectionBounds,
  getViewportCenter,
  hitTestBoardElements,
  moveSelectedElements,
  pageToScreen,
  panViewport,
  parseClipboardElements,
  pasteElements,
  removeElementsByIds,
  resizeSelectedElements,
  rotateSelectedElements,
  screenToPage,
  selectElementsInLasso,
  sendSelectionToBack,
  serializeElementsForClipboard,
  updateSelectedDrawSize,
  updateSelectedElementColor,
  updateSelectedFontFamily,
  updateSelectedFontSize,
  updateTextElementText,
  zoomViewportAtPoint,
} from '../../app/canvasRuntime'
import type { BoardRenderPreview } from '../../app/canvasRuntime'
import { uploadBoardAsset } from '../../app/assetStore'
import { colorToHex } from '../../app/constants'
import {
  applyRemoteDocument,
  copyTextToClipboard,
  getBoardSocketUrl,
  getNextFontChoice,
  getNextSizeChoice,
  indexRemoteCursors,
  isEditableTarget,
  roundCoordinate,
} from '../../app/utils'
import type {
  BoardBounds,
  BoardCanvasSize,
  BoardDocumentSnapshot,
  BoardElement,
  BoardPoint,
  BoardRealtimeClientMessage,
  BoardRealtimeServerMessage,
  BoardTool,
  BoardUploadNotice,
  BoardViewport,
  ColorChoice,
  ConnectionState,
  FontChoice,
  LocalIdentity,
  RealtimeCursor,
  RealtimeParticipant,
  ShapeChoice,
  SizeChoice,
} from '../../app/types'
import { BoardPresencePanel, SharePanel, ZoomPanel } from './BoardPanels'
import { BoardStatusOverlay } from './BoardStatusOverlay'
import { BoardUploadNotice as UploadNotice } from './BoardUploadNotice'
import { NativeBoardCanvas } from './NativeBoardCanvas'
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

type PointerPanState = {
  kind: 'pan'
  pointerId: number
  contextMenuEligible: boolean
  lastX: number
  lastY: number
  originX: number
  originY: number
}

type PointerDrawState = {
  kind: 'draw'
  pointerId: number
  points: BoardPoint[]
}

type PointerShapeState = {
  kind: 'shape'
  pointerId: number
  origin: BoardPoint
  current: BoardPoint
}

type PointerMoveSelectionState = {
  kind: 'move-selection'
  pointerId: number
  start: BoardPoint
  baseDocument: BoardDocumentSnapshot
  selectedIds: string[]
}

type PointerResizeState = {
  kind: 'resize-selection'
  pointerId: number
  corner: 'nw' | 'ne' | 'se' | 'sw'
  startBounds: BoardBounds
  baseDocument: BoardDocumentSnapshot
  selectedIds: string[]
}

type PointerRotateState = {
  kind: 'rotate-selection'
  pointerId: number
  center: BoardPoint
  startAngle: number
  baseDocument: BoardDocumentSnapshot
  selectedIds: string[]
}

type PointerEraseState = {
  kind: 'erase'
  pointerId: number
}

type PointerLassoState = {
  kind: 'lasso'
  pointerId: number
  path: BoardPoint[]
}

type PointerMarqueeSelectionState = {
  kind: 'marquee-selection'
  pointerId: number
  origin: BoardPoint
  current: BoardPoint
}

type PointerInteractionState =
  | PointerPanState
  | PointerDrawState
  | PointerShapeState
  | PointerMoveSelectionState
  | PointerResizeState
  | PointerRotateState
  | PointerEraseState
  | PointerMarqueeSelectionState
  | PointerLassoState

type TextEditorState = {
  editingElementId: string | null
  position: BoardPoint
  text: string
  color: ColorChoice
  font: FontChoice
  size: SizeChoice
}

type ContextMenuState = {
  x: number
  y: number
  selectedIds: string[]
}

type RuntimeDebugHandle = {
  createEmptyDocument: () => BoardDocumentSnapshot
  getState: () => {
    activeTool: BoardTool
    canvasSize: BoardCanvasSize
    document: BoardDocumentSnapshot
    viewport: BoardViewport
    selectedIds: string[]
  }
  replaceDocument: (document: BoardDocumentSnapshot) => void
  setViewport: (viewport: BoardViewport) => void
}

declare global {
  interface Window {
    __wwbCanvasRuntime?: RuntimeDebugHandle
  }
}

const desktopZoomStepFactor = 1.1
const desktopWheelDeltaPerStep = 100
const contextMenuPanThresholdPx = 3

function createRectangleSelectionPath(origin: BoardPoint, current: BoardPoint): BoardPoint[] {
  return [
    origin,
    { x: current.x, y: origin.y },
    current,
    { x: origin.x, y: current.y },
  ]
}

export function BoardScreen({ boardId, identity, onLogout }: BoardScreenProps) {
  const boardScreenRef = useRef<HTMLElement | null>(null)
  const textEditorRef = useRef<HTMLTextAreaElement | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const isSessionReadyRef = useRef(false)
  const pendingPingsRef = useRef(new Map<string, number>())
  const pendingSnapshotFlushRef = useRef<number | null>(null)
  const interactionRef = useRef<PointerInteractionState | null>(null)
  const hasViewportInitializedRef = useRef(false)
  const documentRef = useRef<BoardDocumentSnapshot>(createEmptyBoardDocument())
  const selectionRef = useRef<string[]>([])
  const internalClipboardRef = useRef<string | null>(null)
  const lastPointerPagePointRef = useRef<BoardPoint>({ x: 0, y: 0 })
  const suppressContextMenuRef = useRef(false)
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [activeTool, setActiveTool] = useState<BoardTool>('select')
  const [viewport, setViewport] = useState<BoardViewport>({ x: 0, y: 0, zoom: 1 })
  const [canvasSize, setCanvasSize] = useState<BoardCanvasSize>({ width: 0, height: 0 })
  const [document, setDocument] = useState<BoardDocumentSnapshot>(() => createEmptyBoardDocument())
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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [draftStroke, setDraftStroke] = useState<BoardPoint[] | null>(null)
  const [draftShape, setDraftShape] = useState<BoardElement | null>(null)
  const [lassoPath, setLassoPath] = useState<BoardPoint[] | null>(null)
  const [eraserPreviewPoint, setEraserPreviewPoint] = useState<BoardPoint | null>(null)
  const [textEditor, setTextEditor] = useState<TextEditorState | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [uploadNotice, setUploadNotice] = useState<BoardUploadNotice | null>(null)

  const sendRealtimeMessage = useCallback((message: BoardRealtimeClientMessage) => {
    if (!isSessionReadyRef.current && message.type !== 'session.join') {
      return
    }

    const socket = websocketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return
    }

    socket.send(JSON.stringify(message))
  }, [])

  const queueDocumentBroadcast = useCallback(() => {
    if (!isSessionReadyRef.current) {
      return
    }

    if (pendingSnapshotFlushRef.current !== null) {
      window.clearTimeout(pendingSnapshotFlushRef.current)
    }

    pendingSnapshotFlushRef.current = window.setTimeout(() => {
      pendingSnapshotFlushRef.current = null
      sendRealtimeMessage({
        type: 'board.document.replace',
        boardId,
        actorId: identity.sessionId,
        document: documentRef.current,
      })
    }, 120)
  }, [boardId, identity.sessionId, sendRealtimeMessage])

  const replaceDocument = useCallback((nextDocument: BoardDocumentSnapshot, source: 'local' | 'remote') => {
    documentRef.current = nextDocument
    setDocument(nextDocument)

    if (source === 'local') {
      queueDocumentBroadcast()
    }
  }, [queueDocumentBroadcast])

  const updateSelection = useCallback((nextSelection: string[]) => {
    selectionRef.current = nextSelection
    setSelectedIds(nextSelection)
  }, [])

  const zoomByFactor = useCallback((factor: number, screenPoint?: { x: number; y: number }) => {
    if (canvasSize.width === 0 || canvasSize.height === 0) {
      return
    }

    const anchor = screenPoint ?? getViewportCenter(canvasSize)
    setViewport((current) => zoomViewportAtPoint(current, canvasSize, anchor, current.zoom * factor))
  }, [canvasSize])

  const getLocalScreenPoint = useCallback((clientX: number, clientY: number) => {
    const rect = boardScreenRef.current?.getBoundingClientRect()
    if (!rect) {
      return { x: clientX, y: clientY }
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const screenToBoardPoint = useCallback((clientX: number, clientY: number) => {
    const localPoint = getLocalScreenPoint(clientX, clientY)
    return screenToPage(localPoint, viewport, canvasSize)
  }, [canvasSize, getLocalScreenPoint, viewport])

  const selectedElements = useMemo(
    () => getElementsByIds(document, selectedIds),
    [document, selectedIds],
  )
  const selectionBounds = useMemo(
    () => getSelectionBounds(selectedElements),
    [selectedElements],
  )
  const rotateHandlePoint = selectionBounds ? getRotateHandlePoint(selectionBounds) : null
  const editingElementId = textEditor?.editingElementId ?? null
  const isEditingExistingElement = Boolean(editingElementId)
  const renderDocument = useMemo(() => {
    if (!editingElementId) {
      return document
    }

    return {
      ...document,
      store: {
        elements: document.store.elements.filter((el) => el.id !== editingElementId),
      },
    }
  }, [document, editingElementId])
  const renderPreview = useMemo<BoardRenderPreview>(() => ({
    draftStroke: draftStroke ? { color: drawColor, points: draftStroke, size: drawSize } : null,
    draftShape: draftShape?.type === 'shape' ? draftShape : null,
    eraserPreview: eraserPreviewPoint ? { point: eraserPreviewPoint, size: eraserSize } : null,
    lassoPath,
    rotateHandle: isEditingExistingElement ? null : rotateHandlePoint,
    selectionBounds: isEditingExistingElement ? null : selectionBounds,
    selectionElements: isEditingExistingElement ? [] : selectedElements,
  }), [
    draftShape,
    draftStroke,
    drawColor,
    drawSize,
    eraserPreviewPoint,
    eraserSize,
    isEditingExistingElement,
    lassoPath,
    rotateHandlePoint,
    selectedElements,
    selectionBounds,
  ])

  const contextMenuCapabilities = useMemo(() => {
    const selected = getElementsByIds(document, contextMenu?.selectedIds ?? [])
    return {
      supportsColor: selected.some((element) => element.type !== 'image'),
      supportsDrawSize: selected.some((element) => element.type === 'stroke' || element.type === 'shape'),
      supportsFont: selected.some((element) => element.type === 'text'),
    }
  }, [contextMenu?.selectedIds, document])

  useEffect(() => {
    const element = boardScreenRef.current
    if (!element) {
      return
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      setCanvasSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (canvasSize.width === 0 || canvasSize.height === 0 || hasViewportInitializedRef.current) {
      return
    }

    hasViewportInitializedRef.current = true
    setViewport(createInitialViewport())
  }, [canvasSize])

  useEffect(() => {
    if (!textEditor) {
      return
    }

    textEditorRef.current?.focus()
  }, [textEditor])

  useEffect(() => {
    const nextSelection = selectionRef.current.filter((id) =>
      document.store.elements.some((element) => element.id === id),
    )
    if (nextSelection.length !== selectionRef.current.length) {
      updateSelection(nextSelection)
    }
  }, [document, updateSelection])

  useEffect(() => {
    if (shareState !== 'copied') {
      return
    }

    const timeoutId = window.setTimeout(() => setShareState('idle'), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [shareState])

  useEffect(() => {
    isSessionReadyRef.current = isSessionReady
  }, [isSessionReady])

  useEffect(() => {
    isSessionReadyRef.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset must happen before the new socket can deliver session.ready, otherwise an rAF-deferred reset races and wipes the freshly synced state
    setConnectionState('connecting')
    setIsSessionReady(false)
    setLatencyMs(null)
    setParticipantCount(1)
    setParticipants([])
    setRemoteCursors({})
    updateSelection([])
    replaceDocument(createEmptyBoardDocument(), 'remote')

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
        isSessionReadyRef.current = true
        setParticipantCount(message.participants.length)
        setParticipants(
          message.participants.filter((participant) => participant.sessionId !== identity.sessionId),
        )
        setConnectionState('online')
        setIsSessionReady(true)
        setRemoteCursors(indexRemoteCursors(message.cursors, identity.sessionId))
        replaceDocument(applyRemoteDocument(message.document), 'remote')
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
        if (message.actorId !== identity.sessionId) {
          replaceDocument(applyRemoteDocument(message.document), 'remote')
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
        replaceDocument(applyRemoteDocument(message.document), 'remote')
        return
      }

      if (message.type === 'pong') {
        const sentAt = pendingPings.get(message.nonce)
        if (sentAt !== undefined) {
          pendingPings.delete(message.nonce)
          setLatencyMs(Math.round(performance.now() - sentAt))
        }
      }
    })

    socket.addEventListener('error', () => {
      isSessionReadyRef.current = false
      setConnectionState('offline')
    })

    socket.addEventListener('close', () => {
      if (websocketRef.current === socket) {
        websocketRef.current = null
        isSessionReadyRef.current = false
        setConnectionState('offline')
        setIsSessionReady(false)
      }
    })

    return () => {
      if (websocketRef.current === socket) {
        websocketRef.current = null
      }

      socket.close()
      isSessionReadyRef.current = false
      pendingPings.clear()
    }
  }, [boardId, identity.color, identity.name, identity.sessionId, replaceDocument, updateSelection])

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
  }, [isSessionReady, sendRealtimeMessage])

  useEffect(() => {
    return () => {
      if (pendingSnapshotFlushRef.current !== null) {
        window.clearTimeout(pendingSnapshotFlushRef.current)
      }
    }
  }, [])

  const commitTextEditor = useCallback(() => {
    if (!textEditor) {
      return
    }

    if (textEditor.editingElementId) {
      if (textEditor.text.trim().length > 0) {
        replaceDocument(
          updateTextElementText(documentRef.current, textEditor.editingElementId, textEditor.text),
          'local',
        )
      }
      setTextEditor(null)
      return
    }

    if (textEditor.text.trim().length === 0) {
      setTextEditor(null)
      return
    }

    const nextDocument = appendElement(
      documentRef.current,
      createTextElement(textEditor.position, textEditor.text, textEditor.color, textEditor.size, textEditor.font),
    )
    replaceDocument(nextDocument, 'local')
    setTextEditor(null)
  }, [replaceDocument, textEditor])

  const updateContextSelection = useCallback((ids: string[]) => {
    updateSelection(ids)
    setContextMenu((current) => (current ? { ...current, selectedIds: ids } : current))
  }, [updateSelection])

  useEffect(() => {
    const handleBoardShortcuts = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      const key = event.key.toLowerCase()
      const modifierPressed = event.metaKey || event.ctrlKey

      if (modifierPressed && key === 'a') {
        event.preventDefault()
        updateSelection(documentRef.current.store.elements.map((element) => element.id))
        return
      }

      if (modifierPressed && key === 'd' && selectionRef.current.length > 0) {
        event.preventDefault()
        const duplicated = duplicateElements(documentRef.current, selectionRef.current)
        replaceDocument(duplicated.document, 'local')
        updateSelection(duplicated.ids)
        return
      }

      if (modifierPressed && key === 'c' && selectionRef.current.length > 0) {
        event.preventDefault()
        const payload = serializeElementsForClipboard(documentRef.current, selectionRef.current)
        internalClipboardRef.current = payload
        void copyTextToClipboard(payload)
        return
      }

      if (selectionRef.current.length > 0 && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault()
        replaceDocument(removeElementsByIds(documentRef.current, selectionRef.current), 'local')
        updateSelection([])
        setContextMenu(null)
        return
      }

      if (selectionRef.current.length > 0 && key === ']') {
        event.preventDefault()
        replaceDocument(bringSelectionToFront(documentRef.current, selectionRef.current), 'local')
        return
      }

      if (selectionRef.current.length > 0 && key === '[') {
        event.preventDefault()
        replaceDocument(sendSelectionToBack(documentRef.current, selectionRef.current), 'local')
        return
      }

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
          setIsShortcutsOpen(false)
          setTextEditor(null)
          setContextMenu(null)
          setActiveTool('select')
          return
        }
      }

      if (modifierPressed && (key === '=' || key === '+')) {
        event.preventDefault()
        zoomByFactor(1.15)
        return
      }

      if (modifierPressed && key === '-') {
        event.preventDefault()
        zoomByFactor(1 / 1.15)
        return
      }

      if (modifierPressed && key === '0') {
        event.preventDefault()
        setViewport(createInitialViewport())
      }
    }

    window.addEventListener('keydown', handleBoardShortcuts)
    return () => window.removeEventListener('keydown', handleBoardShortcuts)
  }, [replaceDocument, updateSelection, zoomByFactor])

  useEffect(() => {
    const container = boardScreenRef.current
    if (!container) {
      return
    }

    const listenerOptions: AddEventListenerOptions = { passive: false, capture: true }

    const handleWheel = (event: WheelEvent) => {
      if (canvasSize.width === 0 || canvasSize.height === 0) {
        return
      }

      event.preventDefault()

      if (event.ctrlKey) {
        if (event.deltaY === 0) {
          return
        }

        const direction = Math.sign(event.deltaY)
        const stepCount = Math.max(1, Math.round(Math.abs(event.deltaY) / desktopWheelDeltaPerStep))
        const factor = direction < 0
          ? desktopZoomStepFactor ** stepCount
          : (1 / desktopZoomStepFactor) ** stepCount
        zoomByFactor(factor, getLocalScreenPoint(event.clientX, event.clientY))
        return
      }

      setViewport((current) => panViewport(current, -event.deltaX, -event.deltaY))
    }

    container.addEventListener('wheel', handleWheel, listenerOptions)
    return () => container.removeEventListener('wheel', handleWheel, listenerOptions)
  }, [canvasSize, getLocalScreenPoint, zoomByFactor])

  useEffect(() => {
    const handleCopy = (event: ClipboardEvent) => {
      if (selectionRef.current.length === 0 || isEditableTarget(event.target)) {
        return
      }

      const payload = serializeElementsForClipboard(documentRef.current, selectionRef.current)
      internalClipboardRef.current = payload
      event.clipboardData?.setData('application/x-webwhiteboard-elements', payload)
      event.clipboardData?.setData('text/plain', payload)
      event.preventDefault()
    }

    const handlePaste = async (event: ClipboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      const clipboardItems = Array.from(event.clipboardData?.items ?? [])
      const imageItem = clipboardItems.find((item) => item.type.startsWith('image/'))
      if (imageItem) {
        event.preventDefault()
        const file = imageItem.getAsFile()
        if (!file) {
          return
        }

        try {
          const src = await uploadBoardAsset(file, {
            onUploadError: (message) => {
              setUploadNotice({ id: Date.now(), message })
            },
          })

          const dimensions = await readImageDimensions(src)
          const point = lastPointerPagePointRef.current
          const position = {
            x: roundCoordinate(point.x - dimensions.width / 2),
            y: roundCoordinate(point.y - dimensions.height / 2),
          }
          const nextDocument = appendElement(
            documentRef.current,
            createImageElement(position, dimensions.width, dimensions.height, src),
          )
          replaceDocument(nextDocument, 'local')
          setActiveTool('select')
        } catch {
          // Visible notice is handled through onUploadError.
        }
        return
      }

      const rawPayload =
        event.clipboardData?.getData('application/x-webwhiteboard-elements') ||
        event.clipboardData?.getData('text/plain') ||
        internalClipboardRef.current
      if (!rawPayload) {
        return
      }

      const parsed = parseClipboardElements(rawPayload)
      if (!parsed?.length) {
        return
      }

      event.preventDefault()
      const pasted = pasteElements(documentRef.current, parsed)
      replaceDocument(pasted.document, 'local')
      updateSelection(pasted.ids)
      setActiveTool('select')
    }

    window.document.addEventListener('copy', handleCopy)
    window.document.addEventListener('paste', handlePaste)
    return () => {
      window.document.removeEventListener('copy', handleCopy)
      window.document.removeEventListener('paste', handlePaste)
    }
  }, [replaceDocument, updateSelection])

  useEffect(() => {
    window.__wwbCanvasRuntime = {
      createEmptyDocument: createEmptyBoardDocument,
      getState: () => ({
        ...createRuntimeDebugState(documentRef.current, viewport, canvasSize, activeTool),
        selectedIds: selectionRef.current,
      }),
      replaceDocument: (nextDocument) => replaceDocument(nextDocument, 'local'),
      setViewport: (nextViewport) => setViewport(nextViewport),
    }

    return () => {
      if (window.__wwbCanvasRuntime?.getState) {
        delete window.__wwbCanvasRuntime
      }
    }
  }, [activeTool, canvasSize, replaceDocument, viewport])

  const handleShare = async () => {
    await copyTextToClipboard(window.location.href)
    setShareState('copied')
  }

  const updateRemoteCursor = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (canvasSize.width === 0 || canvasSize.height === 0 || !isSessionReady) {
      return
    }

    const point = screenToBoardPoint(event.clientX, event.clientY)
    lastPointerPagePointRef.current = point
    sendRealtimeMessage({
      type: 'cursor.update',
      boardId,
      actorId: identity.sessionId,
      x: roundCoordinate(point.x),
      y: roundCoordinate(point.y),
    })
  }, [boardId, canvasSize.height, canvasSize.width, identity.sessionId, isSessionReady, screenToBoardPoint, sendRealtimeMessage])

  const beginSelectionInteraction = useCallback((
    event: ReactPointerEvent<HTMLElement>,
    boardPoint: BoardPoint,
    hitElement: BoardElement | null,
  ) => {
    const currentSelection = selectionRef.current
    const isModifierPressed = event.metaKey || event.ctrlKey

    if (selectionBounds && rotateHandlePoint) {
      const rotateDistance = Math.hypot(boardPoint.x - rotateHandlePoint.x, boardPoint.y - rotateHandlePoint.y)
      if (rotateDistance <= 14 / viewport.zoom && currentSelection.length > 0) {
        const center = getBoundsCenter(selectionBounds)
        interactionRef.current = {
          kind: 'rotate-selection',
          pointerId: event.pointerId,
          center,
          startAngle: Math.atan2(boardPoint.y - center.y, boardPoint.x - center.x),
          baseDocument: documentRef.current,
          selectedIds: currentSelection,
        }
        return true
      }

      const resizeHandle = getResizeHandleAtPoint(selectionBounds, boardPoint, 12 / viewport.zoom)
      if (resizeHandle && currentSelection.length > 0) {
        interactionRef.current = {
          kind: 'resize-selection',
          pointerId: event.pointerId,
          corner: resizeHandle,
          startBounds: selectionBounds,
          baseDocument: documentRef.current,
          selectedIds: currentSelection,
        }
        return true
      }
    }

    if (!hitElement) {
      updateSelection([])
      interactionRef.current = {
        kind: 'marquee-selection',
        pointerId: event.pointerId,
        origin: boardPoint,
        current: boardPoint,
      }
      setLassoPath(createRectangleSelectionPath(boardPoint, boardPoint))
      return true
    }

    if (isModifierPressed) {
      const nextSelection = currentSelection.includes(hitElement.id)
        ? currentSelection.filter((id) => id !== hitElement.id)
        : [...currentSelection, hitElement.id]
      updateSelection(nextSelection)
      return false
    }

    const nextSelection = currentSelection.includes(hitElement.id) ? currentSelection : [hitElement.id]
    updateSelection(nextSelection)
    interactionRef.current = {
      kind: 'move-selection',
      pointerId: event.pointerId,
      start: boardPoint,
      baseDocument: documentRef.current,
      selectedIds: nextSelection,
    }
    return true
  }, [rotateHandlePoint, selectionBounds, updateSelection, viewport.zoom])

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const boardPoint = screenToBoardPoint(event.clientX, event.clientY)
    lastPointerPagePointRef.current = boardPoint
    const hitElement = hitTestBoardElements(documentRef.current, boardPoint, viewport.zoom)[0] ?? null

    setContextMenu(null)

    if (activeTool === 'hand' || event.button === 1 || event.button === 2) {
      event.currentTarget.setPointerCapture(event.pointerId)
      interactionRef.current = {
        kind: 'pan',
        pointerId: event.pointerId,
        contextMenuEligible: event.button === 2,
        lastX: event.clientX,
        lastY: event.clientY,
        originX: event.clientX,
        originY: event.clientY,
      }
      event.preventDefault()
      return
    }

    if (activeTool === 'text') {
      event.preventDefault()
      if (textEditor) {
        commitTextEditor()
      }
      setTextEditor({
        editingElementId: null,
        position: boardPoint,
        text: '',
        color: drawColor,
        font: textFont,
        size: textSize,
      })
      return
    }

    if (activeTool === 'select') {
      event.currentTarget.setPointerCapture(event.pointerId)
      beginSelectionInteraction(event, boardPoint, hitElement)
      return
    }

    if (activeTool === 'pencil') {
      event.currentTarget.setPointerCapture(event.pointerId)
      interactionRef.current = {
        kind: 'draw',
        pointerId: event.pointerId,
        points: [boardPoint],
      }
      setDraftStroke([boardPoint])
      return
    }

    if (activeTool === 'shapes') {
      event.currentTarget.setPointerCapture(event.pointerId)
      interactionRef.current = {
        kind: 'shape',
        pointerId: event.pointerId,
        origin: boardPoint,
        current: boardPoint,
      }
      setDraftShape(createShapeElement(boardPoint, 1, 1, shapeChoice, drawColor, drawSize))
      return
    }

    if (activeTool === 'eraser') {
      event.currentTarget.setPointerCapture(event.pointerId)
      interactionRef.current = {
        kind: 'erase',
        pointerId: event.pointerId,
      }
      const radius = getEraserRadius(eraserSize)
      replaceDocument(eraseAtPoint(documentRef.current, boardPoint, radius), 'local')
      setEraserPreviewPoint(boardPoint)
      updateSelection([])
      return
    }

    if (activeTool === 'lasso') {
      event.currentTarget.setPointerCapture(event.pointerId)
      interactionRef.current = {
        kind: 'lasso',
        pointerId: event.pointerId,
        path: [boardPoint],
      }
      setLassoPath([boardPoint])
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    updateRemoteCursor(event)

    const boardPoint = screenToBoardPoint(event.clientX, event.clientY)
    lastPointerPagePointRef.current = boardPoint
    const interaction = interactionRef.current
    if (!interaction || interaction.pointerId !== event.pointerId) {
      if (activeTool === 'eraser') {
        setEraserPreviewPoint(boardPoint)
      }
      return
    }

    if (interaction.kind === 'pan') {
      const deltaX = event.clientX - interaction.lastX
      const deltaY = event.clientY - interaction.lastY
      const didCrossContextMenuThreshold = interaction.contextMenuEligible
        && Math.hypot(event.clientX - interaction.originX, event.clientY - interaction.originY) > contextMenuPanThresholdPx

      if (didCrossContextMenuThreshold) {
        suppressContextMenuRef.current = true
      }

      interactionRef.current = {
        ...interaction,
        contextMenuEligible: interaction.contextMenuEligible && !didCrossContextMenuThreshold,
        lastX: event.clientX,
        lastY: event.clientY,
      }
      setViewport((current) => panViewport(current, deltaX, deltaY))
      return
    }

    if (interaction.kind === 'draw') {
      const nextPoints = appendDragPoint(interaction.points, boardPoint, event.shiftKey)
      interactionRef.current = {
        ...interaction,
        points: nextPoints,
      }
      setDraftStroke(nextPoints)
      return
    }

    if (interaction.kind === 'shape') {
      interactionRef.current = {
        ...interaction,
        current: boardPoint,
      }
      setDraftShape(
        createShapeElement(
          interaction.origin,
          boardPoint.x - interaction.origin.x,
          boardPoint.y - interaction.origin.y,
          shapeChoice,
          drawColor,
          drawSize,
        ),
      )
      return
    }

    if (interaction.kind === 'move-selection') {
      const deltaX = boardPoint.x - interaction.start.x
      const deltaY = boardPoint.y - interaction.start.y
      replaceDocument(
        moveSelectedElements(interaction.baseDocument, interaction.selectedIds, deltaX, deltaY),
        'local',
      )
      return
    }

    if (interaction.kind === 'resize-selection') {
      const nextScales = getSelectionResizeScales(interaction.startBounds, interaction.corner, boardPoint)
      if (!nextScales) {
        return
      }
      replaceDocument(
        resizeSelectedElements(
          interaction.baseDocument,
          interaction.selectedIds,
          nextScales.origin,
          nextScales.scaleX,
          nextScales.scaleY,
        ),
        'local',
      )
      return
    }

    if (interaction.kind === 'rotate-selection') {
      const nextAngle = Math.atan2(boardPoint.y - interaction.center.y, boardPoint.x - interaction.center.x)
      replaceDocument(
        rotateSelectedElements(
          interaction.baseDocument,
          interaction.selectedIds,
          interaction.center,
          nextAngle - interaction.startAngle,
        ),
        'local',
      )
      return
    }

    if (interaction.kind === 'marquee-selection') {
      interactionRef.current = {
        ...interaction,
        current: boardPoint,
      }
      setLassoPath(createRectangleSelectionPath(interaction.origin, boardPoint))
      return
    }

    if (interaction.kind === 'erase') {
      const radius = getEraserRadius(eraserSize)
      replaceDocument(eraseAtPoint(documentRef.current, boardPoint, radius), 'local')
      setEraserPreviewPoint(boardPoint)
      return
    }

    const nextPath = appendLassoPoint(interaction.path, boardPoint)
    interactionRef.current = {
      ...interaction,
      path: nextPath,
    }
    setLassoPath(nextPath)
  }

  const clearInteractionPreview = useCallback(() => {
    setDraftStroke(null)
    setDraftShape(null)
    setLassoPath(null)
    setEraserPreviewPoint(null)
  }, [])

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const interaction = interactionRef.current
    if (interaction?.pointerId === event.pointerId) {
      if (interaction.kind === 'draw' && interaction.points.length > 0) {
        replaceDocument(
          appendElement(documentRef.current, createStrokeElement(interaction.points, drawColor, drawSize)),
          'local',
        )
      }

      if (interaction.kind === 'shape') {
        const width = interaction.current.x - interaction.origin.x
        const height = interaction.current.y - interaction.origin.y
        if (Math.abs(width) >= 6 || Math.abs(height) >= 6) {
          replaceDocument(
            appendElement(
              documentRef.current,
              createShapeElement(interaction.origin, width, height, shapeChoice, drawColor, drawSize),
            ),
            'local',
          )
        }
      }

      if (interaction.kind === 'lasso') {
        updateSelection(selectElementsInLasso(documentRef.current, interaction.path))
      }

      if (interaction.kind === 'marquee-selection') {
        updateSelection(
          selectElementsInLasso(
            documentRef.current,
            createRectangleSelectionPath(interaction.origin, interaction.current),
          ),
        )
      }

      interactionRef.current = null
      clearInteractionPreview()
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault()

    if (suppressContextMenuRef.current) {
      suppressContextMenuRef.current = false
      setContextMenu(null)
      return
    }

    const boardPoint = screenToBoardPoint(event.clientX, event.clientY)
    const hitElement = hitTestBoardElements(documentRef.current, boardPoint, viewport.zoom)[0]
    if (!hitElement) {
      setContextMenu(null)
      return
    }

    const nextSelection = selectionRef.current.includes(hitElement.id) ? selectionRef.current : [hitElement.id]
    updateSelection(nextSelection)
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      selectedIds: nextSelection,
    })
  }

  const handleCanvasClick = () => {
    if (contextMenu) {
      setContextMenu(null)
    }
  }

  const handleDoubleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (activeTool !== 'select') {
      return
    }

    const boardPoint = screenToBoardPoint(event.clientX, event.clientY)
    const hitElement = hitTestBoardElements(documentRef.current, boardPoint, viewport.zoom)[0]
    if (!hitElement || hitElement.type !== 'text') {
      return
    }

    event.preventDefault()
    setTextEditor({
      editingElementId: hitElement.id,
      position: hitElement.position,
      text: hitElement.text,
      color: hitElement.color,
      font: hitElement.font,
      size: hitElement.size,
    })
  }

  const applyContextAction = (updater: (document: BoardDocumentSnapshot, ids: string[]) => BoardDocumentSnapshot) => {
    if (!contextMenu?.selectedIds.length) {
      return
    }

    replaceDocument(updater(documentRef.current, contextMenu.selectedIds), 'local')
    updateContextSelection(contextMenu.selectedIds)
    setContextMenu(null)
  }

  const zoomLevel = formatZoomLevel(viewport)
  const textEditorStyle = textEditor
    ? getTextEditorStyle(textEditor.position, viewport, canvasSize, textEditor.size, textEditor.font, textEditor.color)
    : undefined

  return (
    <main
      className="board-screen"
      data-session-id={identity.sessionId}
      ref={boardScreenRef}
    >
      <div
        className="board-screen__canvas"
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <NativeBoardCanvas
          canvasSize={canvasSize}
          document={renderDocument}
          preview={renderPreview}
          viewport={viewport}
        />
        {textEditor ? (
          <textarea
            aria-label="Text editor"
            className="board-text-editor"
            onBlur={() => commitTextEditor()}
            onChange={(event) => setTextEditor((current) => (current ? { ...current, text: event.target.value } : current))}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                setTextEditor(null)
              }

              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                commitTextEditor()
              }
            }}
            ref={textEditorRef}
            style={textEditorStyle}
            value={textEditor.text}
          />
        ) : null}
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
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onZoomIn={() => zoomByFactor(1.15)}
        onZoomOut={() => zoomByFactor(1 / 1.15)}
      />
      <RemoteCursorLayer canvasSize={canvasSize} cursors={remoteCursors} viewport={viewport} />
      {uploadNotice ? <UploadNotice notice={uploadNotice} onDismiss={() => setUploadNotice(null)} /> : null}
      {contextMenu ? (
        <SelectionContextMenu
          contextMenu={{
            x: contextMenu.x,
            y: contextMenu.y,
            selectedIds: contextMenu.selectedIds,
            supportsColor: contextMenuCapabilities.supportsColor,
            supportsDrawSize: contextMenuCapabilities.supportsDrawSize,
            supportsFont: contextMenuCapabilities.supportsFont,
            currentColor: getSharedColorForSelection(documentRef.current, contextMenu.selectedIds),
            hasMixedColor: selectionHasMixedColors(documentRef.current, contextMenu.selectedIds),
          }}
          onBringToFront={() => applyContextAction(bringSelectionToFront)}
          onDelete={() => {
            applyContextAction(removeElementsByIds)
            updateSelection([])
          }}
          onDuplicate={() => {
            if (!contextMenu.selectedIds.length) {
              return
            }

            const duplicated = duplicateElements(documentRef.current, contextMenu.selectedIds)
            replaceDocument(duplicated.document, 'local')
            updateSelection(duplicated.ids)
            setContextMenu(null)
          }}
          onIncreaseDrawSize={() => {
            const nextSize = getNextSizeForSelection(documentRef.current, contextMenu.selectedIds, drawSize)
            setDrawSize(nextSize)
            applyContextAction((nextDocument, ids) => updateSelectedDrawSize(nextDocument, ids, nextSize))
          }}
          onIncreaseFontSize={() => {
            const nextSize = getNextTextSizeForSelection(documentRef.current, contextMenu.selectedIds, textSize)
            setTextSize(nextSize)
            applyContextAction((nextDocument, ids) => updateSelectedFontSize(nextDocument, ids, nextSize))
          }}
          onSendToBack={() => applyContextAction(sendSelectionToBack)}
          onSelectColor={(color) => {
            setDrawColor(color)
            applyContextAction((nextDocument, ids) => updateSelectedElementColor(nextDocument, ids, color))
          }}
          onToggleFontFamily={() => {
            const nextFont = getNextFontForSelection(documentRef.current, contextMenu.selectedIds, textFont)
            setTextFont(nextFont)
            applyContextAction((nextDocument, ids) => updateSelectedFontFamily(nextDocument, ids, nextFont))
          }}
        />
      ) : null}
      {isShortcutsOpen ? <ShortcutModal onClose={() => setIsShortcutsOpen(false)} /> : null}
      {!isSessionReady ? <BoardStatusOverlay connectionState={connectionState} /> : null}
    </main>
  )
}

function appendDragPoint(points: BoardPoint[], point: BoardPoint, constrainAxis: boolean) {
  if (!constrainAxis) {
    return [...points, point]
  }

  const origin = points[0]
  const deltaX = point.x - origin.x
  const deltaY = point.y - origin.y
  const constrained = Math.abs(deltaX) >= Math.abs(deltaY)
    ? { x: point.x, y: origin.y }
    : { x: origin.x, y: point.y }
  return points.length === 1
    ? [origin, constrained]
    : [...points.slice(0, -1), constrained]
}

function appendLassoPoint(points: BoardPoint[], point: BoardPoint) {
  const previous = points[points.length - 1]
  if (!previous) {
    return [point]
  }

  if (Math.hypot(previous.x - point.x, previous.y - point.y) < 4) {
    return points
  }

  return [...points, point]
}

function getSelectionResizeScales(
  bounds: BoardBounds,
  corner: 'nw' | 'ne' | 'se' | 'sw',
  point: BoardPoint,
) {
  const anchor = {
    nw: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    ne: { x: bounds.x, y: bounds.y + bounds.height },
    se: { x: bounds.x, y: bounds.y },
    sw: { x: bounds.x + bounds.width, y: bounds.y },
  }[corner]

  const width = Math.abs(anchor.x - point.x)
  const height = Math.abs(anchor.y - point.y)
  if (width < 12 || height < 12 || bounds.width === 0 || bounds.height === 0) {
    return null
  }

  return {
    origin: anchor,
    scaleX: width / bounds.width,
    scaleY: height / bounds.height,
  }
}

function getTextEditorStyle(
  position: BoardPoint,
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
  textSize: SizeChoice,
  textFont: FontChoice,
  drawColor: ColorChoice,
) {
  const fontFamily = {
    draw: '"Caveat", "Comic Sans MS", cursive',
    sans: '"Instrument Sans", "Inter", sans-serif',
    serif: '"Iowan Old Style", "Georgia", serif',
    mono: '"JetBrains Mono", "SFMono-Regular", monospace',
  }[textFont]
  const screen = pageToScreen(position, viewport, canvasSize)
  const inkColor = colorToHex[drawColor]
  return {
    left: `${screen.x}px`,
    top: `${screen.y}px`,
    fontSize: `${Math.max(14, Math.round({ s: 14, m: 18, l: 24, xl: 32 }[textSize] * viewport.zoom))}px`,
    fontFamily,
    color: inkColor,
    caretColor: inkColor,
  }
}

async function readImageDimensions(src: string) {
  return await new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image()
    image.addEventListener('load', () => {
      const maxDimension = 320
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
      resolve({
        width: Math.max(48, roundCoordinate(image.naturalWidth * scale)),
        height: Math.max(48, roundCoordinate(image.naturalHeight * scale)),
      })
    }, { once: true })
    image.addEventListener('error', () => {
      resolve({ width: 180, height: 120 })
    }, { once: true })
    image.src = src
  })
}

function getSharedColorForSelection(document: BoardDocumentSnapshot, ids: string[]) {
  const selectedColors = getElementsByIds(document, ids)
    .filter((element): element is Extract<BoardElement, { color: ColorChoice }> => element.type !== 'image')
    .map((element) => element.color)

  if (selectedColors.length === 0) {
    return null
  }

  return selectedColors.every((color) => color === selectedColors[0]) ? selectedColors[0] : null
}

function selectionHasMixedColors(document: BoardDocumentSnapshot, ids: string[]) {
  const selectedColors = getElementsByIds(document, ids)
    .filter((element): element is Extract<BoardElement, { color: ColorChoice }> => element.type !== 'image')
    .map((element) => element.color)

  if (selectedColors.length <= 1) {
    return false
  }

  return selectedColors.some((color) => color !== selectedColors[0])
}

function getNextSizeForSelection(document: BoardDocumentSnapshot, ids: string[], fallback: SizeChoice) {
  const selected = getElementsByIds(document, ids)
  const sized = selected.find((element) => element.type === 'stroke' || element.type === 'shape')
  return getNextSizeChoice(sized?.size ?? fallback)
}

function getNextTextSizeForSelection(document: BoardDocumentSnapshot, ids: string[], fallback: SizeChoice) {
  const selected = getElementsByIds(document, ids)
  const text = selected.find((element) => element.type === 'text')
  return getNextSizeChoice(text?.type === 'text' ? text.size : fallback)
}

function getNextFontForSelection(document: BoardDocumentSnapshot, ids: string[], fallback: FontChoice) {
  const selected = getElementsByIds(document, ids)
  const text = selected.find((element) => element.type === 'text')
  return getNextFontChoice(text?.type === 'text' ? text.font : fallback)
}
