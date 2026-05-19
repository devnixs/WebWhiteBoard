import { useState } from 'react'
import type { FormEvent } from 'react'
import type { KnownBoard, LocalIdentity } from '../../app/types'
import { formatRelative, getBoardPreviewPalette, shortBoardId, toMessage } from '../../app/utils'
import { BrandHeader } from '../common/BrandHeader'
import { IconBoard, IconMore, IconPlus, IconSearch } from '../common/Icons'
import { TopRightIdentity } from './TopRightIdentity'

type HomeScreenProps = {
  identity: LocalIdentity
  knownBoards: KnownBoard[]
  onCreateBoard: () => Promise<void>
  onJoinBoard: (boardId: string) => void
  onLogout: () => void
  onNavigate: (pathname: string) => void
}

export function HomeScreen({
  identity,
  knownBoards,
  onCreateBoard,
  onJoinBoard,
  onLogout,
  onNavigate,
}: HomeScreenProps) {
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
    <main className="home-screen reference-surface">
      <BrandHeader />
      <TopRightIdentity identity={identity} onLogout={onLogout} />

      <section className="home-shell">
        <div className="home-hero">
          <h1>Welcome back, {identity.name}</h1>
          <p>{knownBoards.length} boards on this device · Pick up where you left off</p>
        </div>

        <section className="home-card home-card--create">
          <div className="home-card__create-left">
            <div className="home-card__icon">
              <IconPlus size={18} />
            </div>
            <div className="home-card__body">
              <h2>New board</h2>
              <p>A blank, infinite canvas. Share the link to invite others.</p>
            </div>
          </div>
          <div className="home-card__action">
            <button
              className="primary-button"
              disabled={isCreatingBoard}
              onClick={() => {
                void handleCreateBoard()
              }}
              type="button"
            >
              {isCreatingBoard ? 'Creating…' : 'Create'}
            </button>
          </div>
        </section>

        <section className="home-card home-card--boards">
          <div className="home-card__header home-card__header--boards">
            <span className="screen-eyebrow">Your boards</span>
            <form className="join-form join-form--inline" onSubmit={handleJoinBoard}>
              <input
                id="board-id"
                aria-label="Search or open board by GUID"
                placeholder="Search..."
                value={joinBoardId}
                onChange={(event) => setJoinBoardId(event.target.value)}
              />
              <button className="search-button" type="submit">
                <IconSearch size={14} />
              </button>
            </form>
          </div>

          {knownBoards.length === 0 ? (
            <p className="empty-state">
              No boards are stored yet for this identity. Create one or open a shared board by id.
            </p>
          ) : (
            <div className="board-list">
              {knownBoards.map((board) => (
                <button
                  className={`board-row ${board === knownBoards[0] ? 'board-row--active' : ''}`}
                  key={board.boardId}
                  onClick={() => onNavigate(`/board/${board.boardId}`)}
                  type="button"
                >
                  <div className="board-row__icon">
                    <IconBoard size={18} />
                  </div>
                  <div className="board-row__meta">
                    <strong>{shortBoardId(board.boardId)}</strong>
                    <p>/board/{board.boardId.slice(0, 8)}</p>
                  </div>
                  <div className="board-row__time">{formatRelative(board.lastVisitedAt)}</div>
                  <div className="board-row__avatars" aria-hidden="true">
                    {getBoardPreviewPalette(board.boardId).map((color, index) => (
                      <span
                        className="board-row__avatar"
                        key={`${board.boardId}-${color}-${index}`}
                        style={{ background: color, marginLeft: index === 0 ? 0 : -6 }}
                      />
                    ))}
                  </div>
                  <div className="board-row__more" aria-hidden="true">
                    <IconMore size={16} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {error ? <p className="home-error">{error}</p> : null}
        <p className="home-footer">Have a link? Just paste it in the address bar — boards work via /board/[id].</p>
      </section>
    </main>
  )
}
