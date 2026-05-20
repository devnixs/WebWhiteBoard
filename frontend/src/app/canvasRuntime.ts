import { colorToHex, fontFamilyLabels, fontPixelSizes, sizeToPixels } from './constants'
import type {
  BoardBounds,
  BoardCanvasSize,
  BoardDocumentSnapshot,
  BoardElement,
  BoardImageElement,
  BoardPoint,
  BoardRuntimeDebugState,
  BoardShapeElement,
  BoardStrokeElement,
  BoardTextElement,
  BoardTool,
  BoardViewport,
  ColorChoice,
  FontChoice,
  ShapeChoice,
  SizeChoice,
} from './types'
import { clamp, roundCoordinate } from './utils'

export const defaultBoardZoom = 1
export const minBoardZoom = 0.25
export const maxBoardZoom = 4

const boardImageCache = new Map<string, HTMLImageElement | null>()
const boardImagePending = new Map<string, Promise<void>>()
const fontFamilies: Record<FontChoice, string> = {
  draw: '"Caveat", "Comic Sans MS", cursive',
  sans: '"Instrument Sans", "Inter", sans-serif',
  serif: '"Iowan Old Style", "Georgia", serif',
  mono: '"JetBrains Mono", "SFMono-Regular", monospace',
}

export type BoardRenderPreview = {
  draftStroke?: {
    color: ColorChoice
    points: BoardPoint[]
    size: SizeChoice
  } | null
  draftShape?: BoardShapeElement | null
  eraserPreview?: {
    point: BoardPoint
    size: SizeChoice
  } | null
  lassoPath?: BoardPoint[] | null
  selectionBounds?: BoardBounds | null
  selectionElements?: BoardElement[]
  resizeHandle?: {
    corner: 'nw' | 'ne' | 'se' | 'sw'
  } | null
  rotateHandle?: BoardPoint | null
}

export function createEmptyBoardDocument(): BoardDocumentSnapshot {
  return {
    schema: {
      kind: 'wwb.native-board',
      version: 1,
    },
    store: {
      elements: [],
    },
  }
}

export function isBoardDocumentSnapshot(value: unknown): value is BoardDocumentSnapshot {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as {
    schema?: { kind?: unknown; version?: unknown }
    store?: { elements?: unknown }
  }

  return (
    candidate.schema?.kind === 'wwb.native-board' &&
    candidate.schema.version === 1 &&
    Array.isArray(candidate.store?.elements)
  )
}

export function normalizeBoardDocumentSnapshot(value: unknown): BoardDocumentSnapshot {
  if (!isBoardDocumentSnapshot(value)) {
    return createEmptyBoardDocument()
  }

  return {
    schema: value.schema,
    store: {
      elements: value.store.elements.flatMap((element) => {
        const normalized = normalizeBoardElement(element)
        return normalized ? [normalized] : []
      }),
    },
  }
}

function normalizeBoardElement(value: unknown): BoardElement | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const element = value as Partial<BoardElement> & {
    points?: unknown
    width?: unknown
    height?: unknown
    position?: unknown
    color?: unknown
    size?: unknown
    font?: unknown
    shape?: unknown
    text?: unknown
    src?: unknown
    rotation?: unknown
    scale?: unknown
  }

  if (typeof element.id !== 'string' || typeof element.type !== 'string') {
    return null
  }

  if (element.type === 'stroke' && Array.isArray(element.points)) {
    return {
      id: element.id,
      type: 'stroke',
      color: isColorChoice(element.color) ? element.color : 'blue',
      size: isSizeChoice(element.size) ? element.size : 'm',
      points: element.points.flatMap((point) => {
        if (!point || typeof point !== 'object') {
          return []
        }

        const candidate = point as { x?: unknown; y?: unknown }
        if (typeof candidate.x !== 'number' || typeof candidate.y !== 'number') {
          return []
        }

        return [{ x: roundCoordinate(candidate.x), y: roundCoordinate(candidate.y) }]
      }),
    }
  }

  if (element.type === 'text' && isBoardPoint(element.position) && typeof element.text === 'string') {
    return {
      id: element.id,
      type: 'text',
      color: isColorChoice(element.color) ? element.color : 'black',
      font: isFontChoice(element.font) ? element.font : 'sans',
      size: isSizeChoice(element.size) ? element.size : 'l',
      position: normalizePoint(element.position),
      scale: typeof element.scale === 'number' && Number.isFinite(element.scale) ? clamp(element.scale, 0.25, 8) : 1,
      rotation: typeof element.rotation === 'number' && Number.isFinite(element.rotation) ? element.rotation : 0,
      text: element.text,
    }
  }

  if (
    element.type === 'shape' &&
    isBoardPoint(element.position) &&
    typeof element.width === 'number' &&
    typeof element.height === 'number' &&
    isShapeChoice(element.shape)
  ) {
    return {
      id: element.id,
      type: 'shape',
      color: isColorChoice(element.color) ? element.color : 'blue',
      size: isSizeChoice(element.size) ? element.size : 'm',
      shape: element.shape,
      position: normalizePoint(element.position),
      width: Math.max(1, roundCoordinate(Math.abs(element.width))),
      height: Math.max(1, roundCoordinate(Math.abs(element.height))),
      rotation: typeof element.rotation === 'number' && Number.isFinite(element.rotation) ? element.rotation : 0,
    }
  }

  if (
    element.type === 'image' &&
    isBoardPoint(element.position) &&
    typeof element.width === 'number' &&
    typeof element.height === 'number' &&
    typeof element.src === 'string'
  ) {
    return {
      id: element.id,
      type: 'image',
      position: normalizePoint(element.position),
      width: Math.max(1, roundCoordinate(Math.abs(element.width))),
      height: Math.max(1, roundCoordinate(Math.abs(element.height))),
      rotation: typeof element.rotation === 'number' && Number.isFinite(element.rotation) ? element.rotation : 0,
      src: element.src,
    }
  }

  return null
}

function normalizePoint(point: BoardPoint): BoardPoint {
  return {
    x: roundCoordinate(point.x),
    y: roundCoordinate(point.y),
  }
}

function isBoardPoint(value: unknown): value is BoardPoint {
  if (!value || typeof value !== 'object') {
    return false
  }

  const point = value as { x?: unknown; y?: unknown }
  return typeof point.x === 'number' && typeof point.y === 'number'
}

function isColorChoice(value: unknown): value is ColorChoice {
  return typeof value === 'string' && value in colorToHex
}

function isSizeChoice(value: unknown): value is SizeChoice {
  return value === 's' || value === 'm' || value === 'l' || value === 'xl'
}

function isFontChoice(value: unknown): value is FontChoice {
  return value === 'draw' || value === 'sans' || value === 'serif' || value === 'mono'
}

function isShapeChoice(value: unknown): value is ShapeChoice {
  return value === 'rectangle' || value === 'ellipse' || value === 'diamond' || value === 'star' || value === 'arrow'
}

export function createInitialViewport(): BoardViewport {
  return {
    x: 0,
    y: 0,
    zoom: defaultBoardZoom,
  }
}

export function pageToScreen(point: BoardPoint, viewport: BoardViewport, canvasSize: BoardCanvasSize) {
  return {
    x: canvasSize.width / 2 + viewport.x + point.x * viewport.zoom,
    y: canvasSize.height / 2 + viewport.y + point.y * viewport.zoom,
  }
}

export function screenToPage(point: BoardPoint, viewport: BoardViewport, canvasSize: BoardCanvasSize) {
  return {
    x: (point.x - canvasSize.width / 2 - viewport.x) / viewport.zoom,
    y: (point.y - canvasSize.height / 2 - viewport.y) / viewport.zoom,
  }
}

export function panViewport(viewport: BoardViewport, deltaX: number, deltaY: number): BoardViewport {
  return {
    ...viewport,
    x: roundCoordinate(viewport.x + deltaX),
    y: roundCoordinate(viewport.y + deltaY),
  }
}

export function zoomViewportAtPoint(
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
  screenPoint: BoardPoint,
  nextZoom: number,
): BoardViewport {
  const clampedZoom = clamp(nextZoom, minBoardZoom, maxBoardZoom)
  if (clampedZoom === viewport.zoom) {
    return viewport
  }

  const worldPoint = screenToPage(screenPoint, viewport, canvasSize)

  return {
    x: roundCoordinate(screenPoint.x - canvasSize.width / 2 - worldPoint.x * clampedZoom),
    y: roundCoordinate(screenPoint.y - canvasSize.height / 2 - worldPoint.y * clampedZoom),
    zoom: roundCoordinate(clampedZoom),
  }
}

export function getViewportCenter(canvasSize: BoardCanvasSize) {
  return {
    x: canvasSize.width / 2,
    y: canvasSize.height / 2,
  }
}

export function formatZoomLevel(viewport: BoardViewport) {
  return Math.round(viewport.zoom * 100)
}

export function createRuntimeDebugState(
  document: BoardDocumentSnapshot,
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
  activeTool: BoardTool,
): BoardRuntimeDebugState {
  return {
    document,
    viewport,
    canvasSize,
    activeTool,
  }
}

export function renderBoardDocument(
  canvas: HTMLCanvasElement,
  document: BoardDocumentSnapshot,
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
  preview?: BoardRenderPreview,
) {
  const context = canvas.getContext('2d')
  if (!context) {
    return
  }

  prepareCanvas(context, canvas, canvasSize)
  context.clearRect(0, 0, canvasSize.width, canvasSize.height)

  for (const element of document.store.elements) {
    drawElement(context, element, viewport, canvasSize)
  }

  if (preview?.draftShape) {
    drawElement(context, preview.draftShape, viewport, canvasSize, 0.55)
  }

  if (preview?.draftStroke) {
    drawStroke(context, preview.draftStroke.points, viewport, canvasSize, preview.draftStroke.color, sizeToPixels[preview.draftStroke.size], 0.9)
  }

  if (preview?.selectionElements?.length) {
    drawSelectionOutline(context, preview.selectionElements, viewport, canvasSize)
  }

  if (preview?.selectionBounds) {
    drawSelectionBounds(context, preview.selectionBounds, viewport, canvasSize)
  }

  if (preview?.rotateHandle) {
    drawRotateHandle(context, preview.rotateHandle, viewport, canvasSize)
  }

  if (preview?.lassoPath?.length) {
    drawLasso(context, preview.lassoPath, viewport, canvasSize)
  }

  if (preview?.eraserPreview) {
    drawEraserPreview(context, preview.eraserPreview.point, preview.eraserPreview.size, viewport, canvasSize)
  }
}

function prepareCanvas(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  canvasSize: BoardCanvasSize,
) {
  const devicePixelRatio = window.devicePixelRatio || 1
  const nextWidth = Math.max(1, Math.round(canvasSize.width * devicePixelRatio))
  const nextHeight = Math.max(1, Math.round(canvasSize.height * devicePixelRatio))
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth
    canvas.height = nextHeight
  }

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
}

function drawElement(
  context: CanvasRenderingContext2D,
  element: BoardElement,
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
  opacity = 1,
) {
  if (element.type === 'stroke') {
    drawStroke(context, element.points, viewport, canvasSize, element.color, sizeToPixels[element.size], opacity)
    return
  }

  if (element.type === 'text') {
    drawTextElement(context, element, viewport, canvasSize, opacity)
    return
  }

  if (element.type === 'shape') {
    drawShapeElement(context, element, viewport, canvasSize, opacity)
    return
  }

  if (element.type === 'image') {
    drawImageElement(context, element, viewport, canvasSize, opacity)
  }
}

function drawStroke(
  context: CanvasRenderingContext2D,
  points: BoardPoint[],
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
  color: ColorChoice,
  width: number,
  opacity = 1,
) {
  if (points.length === 0) {
    return
  }

  context.save()
  context.globalAlpha = opacity
  context.strokeStyle = colorToHex[color]
  context.lineWidth = Math.max(1, width * viewport.zoom)
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.beginPath()

  points.forEach((point, index) => {
    const screenPoint = pageToScreen(point, viewport, canvasSize)
    if (index === 0) {
      context.moveTo(screenPoint.x, screenPoint.y)
      return
    }

    context.lineTo(screenPoint.x, screenPoint.y)
  })

  if (points.length === 1) {
    const point = pageToScreen(points[0], viewport, canvasSize)
    const radius = Math.max(2, (width * viewport.zoom) / 2)
    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fillStyle = colorToHex[color]
    context.fill()
  } else {
    context.stroke()
  }

  context.restore()
}

function drawTextElement(
  context: CanvasRenderingContext2D,
  element: BoardTextElement,
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
  opacity: number,
) {
  const metrics = getTextMetrics(element)
  const screenPoint = pageToScreen(element.position, viewport, canvasSize)

  context.save()
  context.globalAlpha = opacity
  context.translate(screenPoint.x, screenPoint.y)
  context.rotate(element.rotation)
  const scale = element.scale * viewport.zoom
  context.scale(scale, scale)
  context.fillStyle = colorToHex[element.color]
  context.font = `${fontPixelSizes[element.size]}px ${fontFamilies[element.font]}`
  context.textBaseline = 'top'

  metrics.lines.forEach((line, index) => {
    context.fillText(line, 0, index * metrics.lineHeight)
  })

  context.restore()
}

function drawShapeElement(
  context: CanvasRenderingContext2D,
  element: BoardShapeElement,
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
  opacity: number,
) {
  const screenPoint = pageToScreen(element.position, viewport, canvasSize)
  const width = element.width * viewport.zoom
  const height = element.height * viewport.zoom

  context.save()
  context.globalAlpha = opacity
  context.translate(screenPoint.x + width / 2, screenPoint.y + height / 2)
  context.rotate(element.rotation)
  context.strokeStyle = colorToHex[element.color]
  context.fillStyle = `${colorToHex[element.color]}10`
  context.lineWidth = getShapeStrokeWidth(element, viewport.zoom)
  context.lineCap = 'round'
  context.lineJoin = 'round'

  drawShapePath(context, element.shape, width, height)
  if (element.shape !== 'arrow') {
    context.fill()
  }
  context.stroke()
  context.restore()
}

function drawImageElement(
  context: CanvasRenderingContext2D,
  element: BoardImageElement,
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
  opacity: number,
) {
  const screenPoint = pageToScreen(element.position, viewport, canvasSize)
  const width = element.width * viewport.zoom
  const height = element.height * viewport.zoom
  const centerX = screenPoint.x + width / 2
  const centerY = screenPoint.y + height / 2

  context.save()
  context.globalAlpha = opacity
  context.translate(centerX, centerY)
  context.rotate(element.rotation)

  const image = boardImageCache.get(element.src)
  if (image) {
    context.drawImage(image, -width / 2, -height / 2, width, height)
  } else {
    context.fillStyle = 'rgba(15, 23, 42, 0.06)'
    context.strokeStyle = 'rgba(15, 23, 42, 0.14)'
    context.lineWidth = 1
    context.fillRect(-width / 2, -height / 2, width, height)
    context.strokeRect(-width / 2, -height / 2, width, height)
    context.fillStyle = 'rgba(15, 23, 42, 0.4)'
    context.font = '12px "JetBrains Mono", monospace'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(image === null ? 'Missing asset' : 'Loading image', 0, 0)
  }

  context.restore()
}

function drawShapePath(context: CanvasRenderingContext2D, shape: ShapeChoice, width: number, height: number) {
  context.beginPath()

  if (shape === 'rectangle') {
    context.roundRect(-width / 2, -height / 2, width, height, Math.min(width, height) * 0.08)
    return
  }

  if (shape === 'ellipse') {
    context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2)
    return
  }

  if (shape === 'diamond') {
    context.moveTo(0, -height / 2)
    context.lineTo(width / 2, 0)
    context.lineTo(0, height / 2)
    context.lineTo(-width / 2, 0)
    context.closePath()
    return
  }

  if (shape === 'arrow') {
    const headLength = getArrowHeadLength(width, height)
    const tipX = width / 2
    const shaftEndX = tipX - headLength
    context.moveTo(-width / 2, 0)
    context.lineTo(shaftEndX, 0)
    context.moveTo(shaftEndX, -height / 2)
    context.lineTo(tipX, 0)
    context.lineTo(shaftEndX, height / 2)
    return
  }

  const spikes = 5
  const outerRadius = Math.min(width, height) / 2
  const innerRadius = outerRadius * 0.45
  for (let index = 0; index < spikes * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius
    const angle = (Math.PI / spikes) * index - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (index === 0) {
      context.moveTo(x, y)
    } else {
      context.lineTo(x, y)
    }
  }
  context.closePath()
}

function drawSelectionOutline(
  context: CanvasRenderingContext2D,
  elements: BoardElement[],
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
) {
  context.save()
  context.strokeStyle = 'rgba(45, 98, 255, 0.42)'
  context.setLineDash([6, 6])
  context.lineWidth = 1.2

  for (const element of elements) {
    const bounds = getElementBounds(element)
    const topLeft = pageToScreen({ x: bounds.x, y: bounds.y }, viewport, canvasSize)
    context.strokeRect(topLeft.x, topLeft.y, bounds.width * viewport.zoom, bounds.height * viewport.zoom)
  }

  context.restore()
}

function drawSelectionBounds(
  context: CanvasRenderingContext2D,
  bounds: BoardBounds,
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
) {
  const topLeft = pageToScreen({ x: bounds.x, y: bounds.y }, viewport, canvasSize)
  const width = bounds.width * viewport.zoom
  const height = bounds.height * viewport.zoom
  const corners = [
    { x: topLeft.x, y: topLeft.y },
    { x: topLeft.x + width, y: topLeft.y },
    { x: topLeft.x + width, y: topLeft.y + height },
    { x: topLeft.x, y: topLeft.y + height },
  ]

  context.save()
  context.strokeStyle = '#2d62ff'
  context.fillStyle = '#ffffff'
  context.lineWidth = 1.2
  context.strokeRect(topLeft.x, topLeft.y, width, height)

  for (const corner of corners) {
    context.fillRect(corner.x - 4, corner.y - 4, 8, 8)
    context.strokeRect(corner.x - 4, corner.y - 4, 8, 8)
  }

  context.restore()
}

function drawRotateHandle(
  context: CanvasRenderingContext2D,
  handlePoint: BoardPoint,
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
) {
  const screenPoint = pageToScreen(handlePoint, viewport, canvasSize)

  context.save()
  context.strokeStyle = '#2d62ff'
  context.fillStyle = '#ffffff'
  context.lineWidth = 1.2
  context.beginPath()
  context.arc(screenPoint.x, screenPoint.y, 7, 0, Math.PI * 2)
  context.fill()
  context.stroke()
  context.restore()
}

function drawLasso(
  context: CanvasRenderingContext2D,
  path: BoardPoint[],
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
) {
  if (path.length < 2) {
    return
  }

  context.save()
  context.strokeStyle = 'rgba(45, 98, 255, 0.9)'
  context.fillStyle = 'rgba(45, 98, 255, 0.08)'
  context.lineWidth = 1.2
  context.setLineDash([7, 5])
  context.beginPath()
  path.forEach((point, index) => {
    const screenPoint = pageToScreen(point, viewport, canvasSize)
    if (index === 0) {
      context.moveTo(screenPoint.x, screenPoint.y)
    } else {
      context.lineTo(screenPoint.x, screenPoint.y)
    }
  })
  context.closePath()
  context.fill()
  context.stroke()
  context.restore()
}

function drawEraserPreview(
  context: CanvasRenderingContext2D,
  point: BoardPoint,
  size: SizeChoice,
  viewport: BoardViewport,
  canvasSize: BoardCanvasSize,
) {
  const screenPoint = pageToScreen(point, viewport, canvasSize)
  const radius = getEraserRadius(size) * viewport.zoom

  context.save()
  context.fillStyle = 'rgba(255, 255, 255, 0.2)'
  context.strokeStyle = 'rgba(15, 23, 42, 0.35)'
  context.lineWidth = 1.2
  context.beginPath()
  context.arc(screenPoint.x, screenPoint.y, radius, 0, Math.PI * 2)
  context.fill()
  context.stroke()
  context.restore()
}

export function getEraserRadius(size: SizeChoice) {
  return Math.max(8, sizeToPixels[size] * 3.5)
}

export function getTextMetrics(element: Pick<BoardTextElement, 'font' | 'scale' | 'size' | 'text'>) {
  const lines = element.text.length > 0 ? element.text.split('\n') : ['']
  const baseFontSize = fontPixelSizes[element.size]
  const lineHeight = Math.max(baseFontSize * 1.25, baseFontSize + 6)
  const maxLineLength = lines.reduce((max, line) => Math.max(max, line.length), 1)
  const width = Math.max(baseFontSize * 0.8, maxLineLength * baseFontSize * 0.62) * element.scale
  const height = Math.max(lineHeight, lines.length * lineHeight) * element.scale

  return {
    fontLabel: fontFamilyLabels[element.font],
    lineHeight,
    lines,
    width,
    height,
  }
}

export function getElementBounds(element: BoardElement): BoardBounds {
  if (element.type === 'stroke') {
    const strokeWidth = sizeToPixels[element.size]
    return expandBounds(getBoundsForPoints(element.points), strokeWidth)
  }

  if (element.type === 'text') {
    const metrics = getTextMetrics(element)
    return getRotatedBounds(element.position, metrics.width, metrics.height, element.rotation)
  }

  if (element.type === 'shape') {
    return getRotatedBounds(element.position, element.width, element.height, element.rotation)
  }

  return getRotatedBounds(element.position, element.width, element.height, element.rotation)
}

function getBoundsForPoints(points: BoardPoint[]): BoardBounds {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = points[0].x
  let maxX = points[0].x
  let minY = points[0].y
  let maxY = points[0].y

  for (const point of points) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  }
}

function expandBounds(bounds: BoardBounds, inset: number): BoardBounds {
  return {
    x: bounds.x - inset / 2,
    y: bounds.y - inset / 2,
    width: bounds.width + inset,
    height: bounds.height + inset,
  }
}

function getRotatedBounds(position: BoardPoint, width: number, height: number, rotation: number): BoardBounds {
  const center = { x: position.x + width / 2, y: position.y + height / 2 }
  const corners = [
    position,
    { x: position.x + width, y: position.y },
    { x: position.x + width, y: position.y + height },
    { x: position.x, y: position.y + height },
  ].map((point) => rotatePoint(point, center, rotation))

  return getBoundsForPoints(corners)
}

export function getSelectionBounds(elements: BoardElement[]) {
  if (elements.length === 0) {
    return null
  }

  const bounds = elements.map(getElementBounds)
  return bounds.slice(1).reduce<BoardBounds>((accumulator, current) => {
    const minX = Math.min(accumulator.x, current.x)
    const minY = Math.min(accumulator.y, current.y)
    const maxX = Math.max(accumulator.x + accumulator.width, current.x + current.width)
    const maxY = Math.max(accumulator.y + accumulator.height, current.y + current.height)

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }, bounds[0])
}

export function getBoundsCenter(bounds: BoardBounds) {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

export function getRotateHandlePoint(bounds: BoardBounds): BoardPoint {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y - 28,
  }
}

export function getResizeHandleAtPoint(
  bounds: BoardBounds,
  point: BoardPoint,
  tolerance = 10,
): 'nw' | 'ne' | 'se' | 'sw' | null {
  const handles: Array<{ corner: 'nw' | 'ne' | 'se' | 'sw'; point: BoardPoint }> = [
    { corner: 'nw', point: { x: bounds.x, y: bounds.y } },
    { corner: 'ne', point: { x: bounds.x + bounds.width, y: bounds.y } },
    { corner: 'se', point: { x: bounds.x + bounds.width, y: bounds.y + bounds.height } },
    { corner: 'sw', point: { x: bounds.x, y: bounds.y + bounds.height } },
  ]

  for (const handle of handles) {
    if (distanceBetweenPoints(handle.point, point) <= tolerance) {
      return handle.corner
    }
  }

  return null
}

export function hitTestBoardElements(
  document: BoardDocumentSnapshot,
  point: BoardPoint,
  zoom: number,
) {
  const threshold = Math.max(6 / zoom, 4)
  const results: BoardElement[] = []

  for (let index = document.store.elements.length - 1; index >= 0; index -= 1) {
    const element = document.store.elements[index]
    if (isPointInsideElement(element, point, threshold)) {
      results.push(element)
    }
  }

  return results
}

function isPointInsideElement(element: BoardElement, point: BoardPoint, threshold: number) {
  if (element.type === 'stroke') {
    return isPointNearStroke(element, point, threshold)
  }

  if (element.type === 'text') {
    const metrics = getTextMetrics(element)
    return isPointInsideRotatedRect(point, element.position, metrics.width, metrics.height, element.rotation)
  }

  if (element.type === 'shape' && element.shape === 'arrow') {
    return isPointNearArrow(element, point, threshold)
  }

  return isPointInsideRotatedRect(point, element.position, element.width, element.height, element.rotation)
}

function isPointNearStroke(element: BoardStrokeElement, point: BoardPoint, threshold: number) {
  if (element.points.length === 1) {
    return distanceBetweenPoints(element.points[0], point) <= threshold + sizeToPixels[element.size]
  }

  for (let index = 0; index < element.points.length - 1; index += 1) {
    if (distancePointToSegment(point, element.points[index], element.points[index + 1]) <= threshold + sizeToPixels[element.size]) {
      return true
    }
  }

  return false
}

export function getElementsByIds(document: BoardDocumentSnapshot, ids: string[]) {
  const selectedIds = new Set(ids)
  return document.store.elements.filter((element) => selectedIds.has(element.id))
}

export function moveSelectedElements(
  document: BoardDocumentSnapshot,
  selectedIds: string[],
  deltaX: number,
  deltaY: number,
) {
  const selected = new Set(selectedIds)
  return {
    ...document,
    store: {
      elements: document.store.elements.map((element) => {
        if (!selected.has(element.id)) {
          return element
        }

        return translateElement(element, deltaX, deltaY)
      }),
    },
  }
}

function translateElement(element: BoardElement, deltaX: number, deltaY: number): BoardElement {
  if (element.type === 'stroke') {
    return {
      ...element,
      points: element.points.map((point) => ({
        x: roundCoordinate(point.x + deltaX),
        y: roundCoordinate(point.y + deltaY),
      })),
    }
  }

  return {
    ...element,
    position: {
      x: roundCoordinate(element.position.x + deltaX),
      y: roundCoordinate(element.position.y + deltaY),
    },
  }
}

export function resizeSelectedElements(
  document: BoardDocumentSnapshot,
  selectedIds: string[],
  origin: BoardPoint,
  scaleX: number,
  scaleY: number,
) {
  const selected = new Set(selectedIds)
  return {
    ...document,
    store: {
      elements: document.store.elements.map((element) => {
        if (!selected.has(element.id)) {
          return element
        }

        return scaleElement(element, origin, scaleX, scaleY)
      }),
    },
  }
}

function scaleElement(element: BoardElement, origin: BoardPoint, scaleX: number, scaleY: number): BoardElement {
  if (element.type === 'stroke') {
    return {
      ...element,
      points: element.points.map((point) => scalePoint(point, origin, scaleX, scaleY)),
    }
  }

  const anchor = scalePoint(element.position, origin, scaleX, scaleY)

  if (element.type === 'text') {
    return {
      ...element,
      position: anchor,
      scale: roundCoordinate(clamp(element.scale * Math.max(Math.abs(scaleX), Math.abs(scaleY)), 0.25, 8)),
    }
  }

  return {
    ...element,
    position: anchor,
    width: roundCoordinate(Math.max(12, element.width * Math.abs(scaleX))),
    height: roundCoordinate(Math.max(12, element.height * Math.abs(scaleY))),
  }
}

export function rotateSelectedElements(
  document: BoardDocumentSnapshot,
  selectedIds: string[],
  center: BoardPoint,
  angleDelta: number,
) {
  const selected = new Set(selectedIds)
  return {
    ...document,
    store: {
      elements: document.store.elements.map((element) => {
        if (!selected.has(element.id)) {
          return element
        }

        return rotateElement(element, center, angleDelta)
      }),
    },
  }
}

function rotateElement(element: BoardElement, center: BoardPoint, angleDelta: number): BoardElement {
  if (element.type === 'stroke') {
    return {
      ...element,
      points: element.points.map((point) => rotatePoint(point, center, angleDelta)),
    }
  }

  const bounds = getElementBounds(element)
  const elementCenter = getBoundsCenter(bounds)
  const rotatedCenter = rotatePoint(elementCenter, center, angleDelta)
  const position = {
    x: roundCoordinate(rotatedCenter.x - bounds.width / 2),
    y: roundCoordinate(rotatedCenter.y - bounds.height / 2),
  }

  if (element.type === 'text') {
    return {
      ...element,
      position,
      rotation: roundCoordinate(element.rotation + angleDelta),
    }
  }

  return {
    ...element,
    position,
    rotation: roundCoordinate(element.rotation + angleDelta),
  }
}

export function removeElementsByIds(document: BoardDocumentSnapshot, ids: string[]) {
  const selected = new Set(ids)
  return {
    ...document,
    store: {
      elements: document.store.elements.filter((element) => !selected.has(element.id)),
    },
  }
}

export function duplicateElements(document: BoardDocumentSnapshot, ids: string[]) {
  const selected = new Set(ids)
  const clones = document.store.elements
    .filter((element) => selected.has(element.id))
    .map((element) => cloneElement(element))

  return {
    document: {
      ...document,
      store: {
        elements: [...document.store.elements, ...clones],
      },
    },
    ids: clones.map((element) => element.id),
  }
}

function cloneElement(element: BoardElement): BoardElement {
  const offset = { x: 28, y: 28 }
  const nextId = crypto.randomUUID()

  if (element.type === 'stroke') {
    return {
      ...element,
      id: nextId,
      points: element.points.map((point) => ({
        x: roundCoordinate(point.x + offset.x),
        y: roundCoordinate(point.y + offset.y),
      })),
    }
  }

  return {
    ...element,
    id: nextId,
    position: {
      x: roundCoordinate(element.position.x + offset.x),
      y: roundCoordinate(element.position.y + offset.y),
    },
  }
}

export function bringSelectionToFront(document: BoardDocumentSnapshot, ids: string[]) {
  const selected = new Set(ids)
  return {
    ...document,
    store: {
      elements: [
        ...document.store.elements.filter((element) => !selected.has(element.id)),
        ...document.store.elements.filter((element) => selected.has(element.id)),
      ],
    },
  }
}

export function sendSelectionToBack(document: BoardDocumentSnapshot, ids: string[]) {
  const selected = new Set(ids)
  return {
    ...document,
    store: {
      elements: [
        ...document.store.elements.filter((element) => selected.has(element.id)),
        ...document.store.elements.filter((element) => !selected.has(element.id)),
      ],
    },
  }
}

export function updateSelectedElementColor(
  document: BoardDocumentSnapshot,
  ids: string[],
  color: ColorChoice,
) {
  const selected = new Set(ids)
  return {
    ...document,
    store: {
      elements: document.store.elements.map((element) => {
        if (!selected.has(element.id)) {
          return element
        }

        if (element.type === 'image') {
          return element
        }

        return {
          ...element,
          color,
        }
      }),
    },
  }
}

export function updateSelectedDrawSize(
  document: BoardDocumentSnapshot,
  ids: string[],
  size: SizeChoice,
) {
  const selected = new Set(ids)
  return {
    ...document,
    store: {
      elements: document.store.elements.map((element) => {
        if (!selected.has(element.id)) {
          return element
        }

        if (element.type === 'stroke' || element.type === 'shape') {
          return {
            ...element,
            size,
          }
        }

        return element
      }),
    },
  }
}

export function updateSelectedFontSize(
  document: BoardDocumentSnapshot,
  ids: string[],
  size: SizeChoice,
) {
  const selected = new Set(ids)
  return {
    ...document,
    store: {
      elements: document.store.elements.map((element) => {
        if (!selected.has(element.id) || element.type !== 'text') {
          return element
        }

        return {
          ...element,
          size,
        }
      }),
    },
  }
}

export function updateSelectedFontFamily(
  document: BoardDocumentSnapshot,
  ids: string[],
  font: FontChoice,
) {
  const selected = new Set(ids)
  return {
    ...document,
    store: {
      elements: document.store.elements.map((element) => {
        if (!selected.has(element.id) || element.type !== 'text') {
          return element
        }

        return {
          ...element,
          font,
        }
      }),
    },
  }
}

export function createStrokeElement(
  points: BoardPoint[],
  color: ColorChoice,
  size: SizeChoice,
): BoardStrokeElement {
  return {
    id: crypto.randomUUID(),
    type: 'stroke',
    color,
    size,
    points: points.map((point) => normalizePoint(point)),
  }
}

export function createTextElement(
  position: BoardPoint,
  text: string,
  color: ColorChoice,
  size: SizeChoice,
  font: FontChoice,
): BoardTextElement {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    color,
    font,
    size,
    position: normalizePoint(position),
    scale: 1,
    rotation: 0,
    text,
  }
}

export function createShapeElement(
  position: BoardPoint,
  width: number,
  height: number,
  shape: ShapeChoice,
  color: ColorChoice,
  size: SizeChoice,
): BoardShapeElement {
  return {
    id: crypto.randomUUID(),
    type: 'shape',
    color,
    size,
    shape,
    position: normalizePoint({
      x: Math.min(position.x, position.x + width),
      y: Math.min(position.y, position.y + height),
    }),
    width: Math.max(12, roundCoordinate(Math.abs(width))),
    height: Math.max(12, roundCoordinate(Math.abs(height))),
    rotation: 0,
  }
}

export function createArrowElement(
  origin: BoardPoint,
  target: BoardPoint,
  color: ColorChoice,
  size: SizeChoice,
): BoardShapeElement {
  const deltaX = target.x - origin.x
  const deltaY = target.y - origin.y
  const length = Math.max(24, roundCoordinate(Math.hypot(deltaX, deltaY)))
  const height = Math.max(18, roundCoordinate(length * 0.22))
  const center = {
    x: roundCoordinate((origin.x + target.x) / 2),
    y: roundCoordinate((origin.y + target.y) / 2),
  }

  return {
    id: crypto.randomUUID(),
    type: 'shape',
    color,
    size,
    shape: 'arrow',
    position: normalizePoint({
      x: center.x - length / 2,
      y: center.y - height / 2,
    }),
    width: length,
    height,
    rotation: roundCoordinate(Math.atan2(deltaY, deltaX)),
  }
}

export function createImageElement(position: BoardPoint, width: number, height: number, src: string): BoardImageElement {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    position: normalizePoint(position),
    width: Math.max(24, roundCoordinate(width)),
    height: Math.max(24, roundCoordinate(height)),
    rotation: 0,
    src,
  }
}

export function updateTextElementText(
  document: BoardDocumentSnapshot,
  id: string,
  text: string,
): BoardDocumentSnapshot {
  return {
    ...document,
    store: {
      elements: document.store.elements.map((element) => {
        if (element.id !== id || element.type !== 'text') {
          return element
        }

        return { ...element, text }
      }),
    },
  }
}

export function appendElement(document: BoardDocumentSnapshot, element: BoardElement) {
  return {
    ...document,
    store: {
      elements: [...document.store.elements, element],
    },
  }
}

export function selectElementsInLasso(document: BoardDocumentSnapshot, polygon: BoardPoint[]) {
  if (polygon.length < 3) {
    return []
  }

  return document.store.elements
    .filter((element) => {
      if (element.type === 'stroke') {
        return element.points.some((point) => isPointInPolygon(point, polygon))
      }

      const bounds = getElementBounds(element)
      const corners = [
        { x: bounds.x, y: bounds.y },
        { x: bounds.x + bounds.width, y: bounds.y },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        { x: bounds.x, y: bounds.y + bounds.height },
        getBoundsCenter(bounds),
      ]

      return corners.some((point) => isPointInPolygon(point, polygon))
    })
    .map((element) => element.id)
}

export function eraseAtPoint(document: BoardDocumentSnapshot, point: BoardPoint, radius: number) {
  return {
    ...document,
    store: {
      elements: document.store.elements.filter((element) => !doesElementIntersectCircle(element, point, radius)),
    },
  }
}

function doesElementIntersectCircle(element: BoardElement, point: BoardPoint, radius: number) {
  if (element.type === 'stroke') {
    return element.points.some((strokePoint) => distanceBetweenPoints(strokePoint, point) <= radius)
  }

  const bounds = getElementBounds(element)
  const nearestX = clamp(point.x, bounds.x, bounds.x + bounds.width)
  const nearestY = clamp(point.y, bounds.y, bounds.y + bounds.height)
  return distanceBetweenPoints(point, { x: nearestX, y: nearestY }) <= radius
}

export function ensureBoardImages(srcs: string[], onInvalidate: () => void) {
  for (const src of srcs) {
    if (boardImageCache.has(src) || boardImagePending.has(src)) {
      continue
    }

    const image = new Image()
    image.crossOrigin = src.startsWith('data:') ? null : 'anonymous'

    const promise = new Promise<void>((resolve) => {
      image.addEventListener('load', () => {
        boardImageCache.set(src, image)
        boardImagePending.delete(src)
        onInvalidate()
        resolve()
      }, { once: true })

      image.addEventListener('error', () => {
        boardImageCache.set(src, null)
        boardImagePending.delete(src)
        onInvalidate()
        resolve()
      }, { once: true })
    })

    boardImagePending.set(src, promise)
    image.src = src
  }
}

export function serializeElementsForClipboard(document: BoardDocumentSnapshot, ids: string[]) {
  const selected = new Set(ids)
  return JSON.stringify({
    kind: 'wwb.clipboard',
    elements: document.store.elements.filter((element) => selected.has(element.id)),
  })
}

export function parseClipboardElements(rawValue: string): BoardElement[] | null {
  try {
    const parsed = JSON.parse(rawValue) as { kind?: string; elements?: unknown[] }
    if (parsed.kind !== 'wwb.clipboard' || !Array.isArray(parsed.elements)) {
      return null
    }

    return parsed.elements.flatMap((element) => {
      const normalized = normalizeBoardElement(element)
      return normalized ? [normalized] : []
    })
  } catch {
    return null
  }
}

export function pasteElements(document: BoardDocumentSnapshot, elements: BoardElement[]) {
  const clones = elements.map((element) => cloneElement(element))
  return {
    document: {
      ...document,
      store: {
        elements: [...document.store.elements, ...clones],
      },
    },
    ids: clones.map((element) => element.id),
  }
}

function rotatePoint(point: BoardPoint, center: BoardPoint, angle: number): BoardPoint {
  const deltaX = point.x - center.x
  const deltaY = point.y - center.y
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    x: roundCoordinate(center.x + deltaX * cos - deltaY * sin),
    y: roundCoordinate(center.y + deltaX * sin + deltaY * cos),
  }
}

function scalePoint(point: BoardPoint, origin: BoardPoint, scaleX: number, scaleY: number): BoardPoint {
  return {
    x: roundCoordinate(origin.x + (point.x - origin.x) * scaleX),
    y: roundCoordinate(origin.y + (point.y - origin.y) * scaleY),
  }
}

function distanceBetweenPoints(first: BoardPoint, second: BoardPoint) {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

function distancePointToSegment(point: BoardPoint, start: BoardPoint, end: BoardPoint) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (dx === 0 && dy === 0) {
    return distanceBetweenPoints(point, start)
  }

  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy), 0, 1)
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  }

  return distanceBetweenPoints(point, projection)
}

function getShapeStrokeWidth(element: BoardShapeElement, zoom: number) {
  const multiplier = element.shape === 'arrow' ? 0.38 : 0.22
  return Math.max(1, sizeToPixels[element.size] * zoom * multiplier)
}

function getArrowHeadLength(width: number, height: number) {
  return Math.min(width * 0.28, Math.max(height * 1.15, 18))
}

function isPointNearArrow(element: BoardShapeElement, point: BoardPoint, threshold: number) {
  const localPoint = getLocalRotatedPoint(point, element.position, element.width, element.height, element.rotation)
  const headLength = getArrowHeadLength(element.width, element.height)
  const tipX = element.position.x + element.width
  const shaftEndX = tipX - headLength
  const centerY = element.position.y + element.height / 2
  const tolerance = threshold + Math.max(4, sizeToPixels[element.size] * 0.5)
  const segments = [
    {
      start: { x: element.position.x, y: centerY },
      end: { x: shaftEndX, y: centerY },
    },
    {
      start: { x: shaftEndX, y: element.position.y },
      end: { x: tipX, y: centerY },
    },
    {
      start: { x: shaftEndX, y: element.position.y + element.height },
      end: { x: tipX, y: centerY },
    },
  ]

  return segments.some((segment) => distancePointToSegment(localPoint, segment.start, segment.end) <= tolerance)
}

function isPointInsideRotatedRect(
  point: BoardPoint,
  position: BoardPoint,
  width: number,
  height: number,
  rotation: number,
) {
  const localPoint = getLocalRotatedPoint(point, position, width, height, rotation)

  return (
    localPoint.x >= position.x &&
    localPoint.x <= position.x + width &&
    localPoint.y >= position.y &&
    localPoint.y <= position.y + height
  )
}

function getLocalRotatedPoint(
  point: BoardPoint,
  position: BoardPoint,
  width: number,
  height: number,
  rotation: number,
) {
  const center = {
    x: position.x + width / 2,
    y: position.y + height / 2,
  }

  return rotatePoint(point, center, -rotation)
}

function isPointInPolygon(point: BoardPoint, polygon: BoardPoint[]) {
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const current = polygon[index]
    const before = polygon[previous]
    const intersects =
      ((current.y > point.y) !== (before.y > point.y)) &&
      point.x < ((before.x - current.x) * (point.y - current.y)) / (before.y - current.y + Number.EPSILON) + current.x
    if (intersects) {
      inside = !inside
    }
  }

  return inside
}
