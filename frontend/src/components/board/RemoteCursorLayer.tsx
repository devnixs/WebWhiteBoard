import { pageToScreen } from '../../app/canvasRuntime'
import type { BoardCanvasSize, BoardViewport, RealtimeCursor } from '../../app/types'

type RemoteCursorLayerProps = {
  canvasSize: BoardCanvasSize
  cursors: Record<string, RealtimeCursor>
  viewport: BoardViewport
}

export function RemoteCursorLayer({ canvasSize, cursors, viewport }: RemoteCursorLayerProps) {
  return (
    <div className="remote-cursor-layer">
      {Object.values(cursors).map((cursor) => {
        const screenPoint = pageToScreen({ x: cursor.x, y: cursor.y }, viewport, canvasSize)

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
