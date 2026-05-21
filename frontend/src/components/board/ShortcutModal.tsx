import { isMacPlatform } from '../../app/constants'
import { IconClose, IconKeyboard } from '../common/Icons'

type ShortcutModalProps = {
  onClose: () => void
}

export function ShortcutModal({ onClose }: ShortcutModalProps) {
  const modifierLabel = isMacPlatform ? 'Cmd' : 'Ctrl'
  const groups = [
    {
      title: 'Tools',
      items: [
        ['Select', 'V'],
        ['Pan', 'H'],
        ['Pencil', 'P'],
        ['Text', 'T'],
        ['Shapes', 'R'],
        ['Arrow', 'A'],
        ['Eraser', 'E'],
        ['Lasso', 'L'],
      ],
    },
    {
      title: 'Canvas',
      items: [
        ['Pan canvas', 'Two-finger drag'],
        ['Zoom in / out', `${modifierLabel} + scroll`],
        ['Zoom to 100%', `${modifierLabel}  0`],
      ],
    },
    {
      title: 'Editing',
      items: [
        ['Select all', `${modifierLabel}  A`],
        ['Undo', `${modifierLabel}  Z`],
        ['Redo', isMacPlatform ? `${modifierLabel}  Shift  Z` : `${modifierLabel}  Y`],
        ['Copy', `${modifierLabel}  C`],
        ['Paste', `${modifierLabel}  V`],
        ['Duplicate', `${modifierLabel}  D`],
        ['Delete', isMacPlatform ? 'Delete' : 'Del'],
        ['Close popup', 'Esc'],
      ],
    },
  ]

  return (
    <div className="shortcut-overlay" onClick={onClose} role="presentation">
      <section
        aria-label="Shortcut reference"
        className="shortcut-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shortcut-modal__header">
          <div className="shortcut-modal__title">
            <IconKeyboard size={16} />
            <h2>Keyboard shortcuts</h2>
          </div>
          <button aria-label="Close shortcuts" className="shortcut-modal__close" onClick={onClose} type="button">
            <IconClose size={14} />
          </button>
        </div>
        <div className="shortcut-groups">
          {groups.map((group) => (
            <section className={`shortcut-group shortcut-group--${group.title.toLowerCase()}`} key={group.title}>
              <span className="screen-eyebrow">{group.title}</span>
              <div className="shortcut-list">
                {group.items.map(([action, keys]) => (
                  <div className="shortcut-row" key={action}>
                    <span>{action}</span>
                    <span className="shortcut-row__keys">
                      {keys.split('  ').map((part, index) => (
                        <kbd key={`${action}-${index}`}>{part}</kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
