import type { BoardUploadNotice } from '../../app/types'

type BoardUploadNoticeProps = {
  notice: BoardUploadNotice
  onDismiss: () => void
}

export function BoardUploadNotice({ notice, onDismiss }: BoardUploadNoticeProps) {
  return (
    <div className="board-upload-notice" role="status" aria-live="polite">
      <div className="board-upload-notice__card">
        <div className="board-upload-notice__copy">
          <span className="screen-eyebrow">Image Upload</span>
          <strong>Paste failed</strong>
          <p>{notice.message}</p>
        </div>
        <button
          aria-label="Dismiss upload notice"
          className="board-upload-notice__dismiss"
          onClick={onDismiss}
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  )
}
