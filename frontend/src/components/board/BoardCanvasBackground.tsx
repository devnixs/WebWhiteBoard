import type { CSSProperties } from 'react'
import { useEditor } from '@tldraw/editor'
import { useValue } from '@tldraw/state-react'
import { getGridOpacity, getWrappedGridOffset } from '../../app/utils'

export function BoardCanvasBackground() {
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

  return (
    <div
      aria-hidden="true"
      className="tl-background board-canvas-background"
      style={backgroundStyle}
    />
  )
}
