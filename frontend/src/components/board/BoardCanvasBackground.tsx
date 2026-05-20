import type { CSSProperties } from 'react'
import type { BoardCanvasSize, BoardViewport } from '../../app/types'
import { getGridOpacity, getWrappedGridOffset } from '../../app/utils'

type BoardCanvasBackgroundProps = {
  canvasSize: BoardCanvasSize
  viewport: BoardViewport
}

export function BoardCanvasBackground({ canvasSize, viewport }: BoardCanvasBackgroundProps) {
  const minorGridSize = Math.max(22 * viewport.zoom, 10)
  const majorGridSize = minorGridSize * 4
  const minorGridOpacity = getGridOpacity(minorGridSize, 10, 24, 0.04)
  const majorGridOpacity = getGridOpacity(majorGridSize, 24, 72, 0.12)
  const originX = canvasSize.width / 2 + viewport.x
  const originY = canvasSize.height / 2 + viewport.y
  const backgroundStyle = {
    '--board-grid-minor-size': `${minorGridSize}px`,
    '--board-grid-major-size': `${majorGridSize}px`,
    '--board-grid-minor-offset-x': `${getWrappedGridOffset(originX, minorGridSize)}px`,
    '--board-grid-minor-offset-y': `${getWrappedGridOffset(originY, minorGridSize)}px`,
    '--board-grid-major-offset-x': `${getWrappedGridOffset(originX, majorGridSize)}px`,
    '--board-grid-major-offset-y': `${getWrappedGridOffset(originY, majorGridSize)}px`,
    '--board-grid-minor-opacity': minorGridOpacity.toFixed(3),
    '--board-grid-major-opacity': majorGridOpacity.toFixed(3),
  } as CSSProperties

  return <div aria-hidden="true" className="board-canvas-background" style={backgroundStyle} />
}
