type NotFoundScreenProps = {
  onNavigate: (pathname: string) => void
}

export function NotFoundScreen({ onNavigate }: NotFoundScreenProps) {
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <span className="screen-eyebrow">Invalid route</span>
        <h1>Only the homepage and board routes are valid.</h1>
        <p>
          The app supports <code>/</code> and <code>/board/{'{guid}'}</code>. Use the homepage to
          get back into a valid flow.
        </p>
        <button className="primary-button" onClick={() => onNavigate('/')} type="button">
          Return home
        </button>
      </section>
    </main>
  )
}
