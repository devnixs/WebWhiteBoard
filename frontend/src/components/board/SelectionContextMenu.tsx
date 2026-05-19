import type { ContextMenuState } from '../../app/types'
import { modifierGlyph } from '../../app/utils'
import { IconBack, IconDuplicate, IconFront, IconPalette, IconTrash, IconType } from '../common/Icons'

type SelectionContextMenuProps = {
  contextMenu: ContextMenuState
  onBringToFront: () => void
  onSendToBack: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleColor: () => void
  onIncreaseFontSize: () => void
  onIncreaseDrawSize: () => void
  onToggleFontFamily: () => void
}

export function SelectionContextMenu({
  contextMenu,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onToggleColor,
  onIncreaseFontSize,
  onIncreaseDrawSize,
  onToggleFontFamily,
}: SelectionContextMenuProps) {
  return (
    <section className="selection-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
      <button className="selection-menu__item" onClick={onBringToFront} type="button">
        <span className="selection-menu__icon"><IconFront size={14} /></span>
        <span>Bring to front</span>
        <kbd>]</kbd>
      </button>
      <button className="selection-menu__item" onClick={onSendToBack} type="button">
        <span className="selection-menu__icon"><IconBack size={14} /></span>
        <span>Send to back</span>
        <kbd>[</kbd>
      </button>
      <button className="selection-menu__item" onClick={onDuplicate} type="button">
        <span className="selection-menu__icon"><IconDuplicate size={14} /></span>
        <span>Duplicate</span>
        <kbd>{modifierGlyph()} D</kbd>
      </button>
      <button className="selection-menu__item" onClick={onDelete} type="button">
        <span className="selection-menu__icon"><IconTrash size={14} /></span>
        <span>Delete</span>
        <kbd>Del</kbd>
      </button>
      {contextMenu.supportsColor ? (
        <button className="selection-menu__item" onClick={onToggleColor} type="button">
          <span className="selection-menu__icon"><IconPalette size={14} /></span>
          <span>Change color</span>
        </button>
      ) : null}
      {contextMenu.supportsFont ? (
        <>
          <button className="selection-menu__item" onClick={onIncreaseFontSize} type="button">
            <span className="selection-menu__icon menu-text-icon">A+</span>
            <span>Increase font size</span>
          </button>
          <button className="selection-menu__item" onClick={onToggleFontFamily} type="button">
            <span className="selection-menu__icon"><IconType size={14} /></span>
            <span>Font family</span>
          </button>
        </>
      ) : null}
      {contextMenu.supportsDrawSize ? (
        <button className="selection-menu__item" onClick={onIncreaseDrawSize} type="button">
          <span className="selection-menu__icon menu-text-icon">A+</span>
          <span>Increase draw size</span>
        </button>
      ) : null}
    </section>
  )
}
