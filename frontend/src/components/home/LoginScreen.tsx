import { useState } from 'react'
import type { FormEvent } from 'react'
import { colorPalette, loginPalette } from '../../app/constants'
import type { RouteState } from '../../app/types'
import { shortBoardId } from '../../app/utils'
import { BrandHeader } from '../common/BrandHeader'

type LoginScreenProps = {
  route: RouteState
  onLogin: (name: string, color: string) => void
}

export function LoginScreen({ route, onLogin }: LoginScreenProps) {
  const [name, setName] = useState('')
  const [previewColor] = useState(() => colorPalette[Math.floor(Math.random() * colorPalette.length)])

  const destinationLabel =
    route.kind === 'board' ? `You will join board ${shortBoardId(route.boardId)} right away.` : null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onLogin(name, previewColor)
  }

  return (
    <main className="auth-screen reference-surface">
      <BrandHeader />
      <section className="auth-card">
        <span className="screen-eyebrow">Welcome</span>
        <h1>What should we call you?</h1>
        <p>Your name is shown next to your cursor so others know who&apos;s drawing.</p>
        {destinationLabel ? <p className="auth-card__hint">{destinationLabel}</p> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            autoFocus
            maxLength={48}
            placeholder="Maya Chen"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="auth-palette">
            <span className="auth-palette__label">Your color</span>
            <div className="auth-palette__swatches" aria-hidden="true">
              {loginPalette.map((color) => (
                <span
                  className={`auth-palette__swatch ${color === previewColor ? 'auth-palette__swatch--selected' : ''}`}
                  key={color}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <button type="submit">Continue →</button>
        </form>
        <p className="auth-card__footer">Saved on this device. No account needed.</p>
      </section>
    </main>
  )
}
