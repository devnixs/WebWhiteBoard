import type { ConnectionState, LocalIdentity, RealtimeParticipant } from '../../app/types'
import { getInitials } from '../../app/utils'
import { IconCheck, IconChevronDown, IconKeyboard, IconLogout, IconMinus, IconPlus, IconShare, IconWifi } from '../common/Icons'

type SharePanelProps = {
  boardId: string
  shareState: 'idle' | 'copied'
  onShare: () => Promise<void>
}

export function SharePanel({ boardId, shareState, onShare }: SharePanelProps) {
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

type BoardPresencePanelProps = {
  connectionState: ConnectionState
  identity: LocalIdentity
  latencyMs: number | null
  onLogout: () => void
  participantCount: number
  participants: Array<Pick<RealtimeParticipant, 'displayName' | 'color' | 'sessionId'>>
}

export function BoardPresencePanel({
  connectionState,
  identity,
  latencyMs,
  onLogout,
  participantCount,
  participants,
}: BoardPresencePanelProps) {
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

type ZoomPanelProps = {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onOpenShortcuts: () => void
}

export function ZoomPanel({ zoomLevel, onZoomIn, onZoomOut, onOpenShortcuts }: ZoomPanelProps) {
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
