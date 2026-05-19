import { useValue } from '@tldraw/state-react'
import type { Editor } from 'tldraw'
import type { RealtimeCursor } from '../../app/types'

type RemoteCursorLayerProps = {
  cursors: Record<string, RealtimeCursor>
  editor: Editor
}

export function RemoteCursorLayer({ cursors, editor }: RemoteCursorLayerProps) {
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
      {visibleCursors.map(({ cursor, screenPoint }) => (
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
      ))}
    </div>
  )
}
