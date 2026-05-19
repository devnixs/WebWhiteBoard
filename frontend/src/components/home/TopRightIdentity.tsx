import type { LocalIdentity } from '../../app/types'
import { getInitials } from '../../app/utils'
import { IconLogout } from '../common/Icons'

type TopRightIdentityProps = {
  identity: LocalIdentity
  onLogout: () => void
}

export function TopRightIdentity({ identity, onLogout }: TopRightIdentityProps) {
  return (
    <section className="floating-identity">
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
