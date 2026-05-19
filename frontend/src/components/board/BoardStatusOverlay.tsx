import type { ConnectionState } from '../../app/types'

type BoardStatusOverlayProps = {
  connectionState: ConnectionState
}

export function BoardStatusOverlay({ connectionState }: BoardStatusOverlayProps) {
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
