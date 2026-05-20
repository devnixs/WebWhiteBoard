import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { colorChoices, colorToHex } from '../../app/constants'
import type { ColorChoice } from '../../app/types'
import { modifierGlyph } from '../../app/utils'
import { IconBack, IconDuplicate, IconFront, IconPalette, IconTrash, IconType } from '../common/Icons'

type SelectionContextMenuState = {
  x: number
  y: number
  selectedIds: string[]
  supportsColor: boolean
  supportsDrawSize: boolean
  supportsFont: boolean
  currentColor: ColorChoice | null
  hasMixedColor: boolean
}

type SelectionContextMenuProps = {
  contextMenu: SelectionContextMenuState
  onBringToFront: () => void
  onSendToBack: () => void
  onDuplicate: () => void
  onDelete: () => void
  onSelectColor: (color: ColorChoice) => void
  onIncreaseFontSize: () => void
  onIncreaseDrawSize: () => void
  onToggleFontFamily: () => void
}

const colorLabels: Record<ColorChoice, string> = {
  blue: 'Blue',
  green: 'Green',
  orange: 'Orange',
  red: 'Red',
  violet: 'Violet',
  black: 'Black',
}

export function SelectionContextMenu({
  contextMenu,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onSelectColor,
  onIncreaseFontSize,
  onIncreaseDrawSize,
  onToggleFontFamily,
}: SelectionContextMenuProps) {
  const menuRef = useRef<HTMLElement | null>(null)
  const [position, setPosition] = useState(() => ({ x: contextMenu.x, y: contextMenu.y }))

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) {
      setPosition({ x: contextMenu.x, y: contextMenu.y })
      return
    }

    const viewportPadding = 12
    const rect = menu.getBoundingClientRect()
    const maxX = Math.max(viewportPadding, window.innerWidth - rect.width - viewportPadding)
    const maxY = Math.max(viewportPadding, window.innerHeight - rect.height - viewportPadding)

    setPosition({
      x: Math.min(Math.max(contextMenu.x, viewportPadding), maxX),
      y: Math.min(Math.max(contextMenu.y, viewportPadding), maxY),
    })
  }, [contextMenu])

  return (
    <section
      className="selection-menu"
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onMouseUp={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      ref={menuRef}
      style={{ left: position.x, top: position.y }}
    >
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
        <div aria-label="Color palette" className="selection-menu__palette-section" role="group">
          <div className="selection-menu__palette-label">
            <span className="selection-menu__icon"><IconPalette size={14} /></span>
            <span>Change color</span>
            <span className="selection-menu__color-summary">
              {contextMenu.hasMixedColor ? 'Mixed' : colorLabels[contextMenu.currentColor ?? 'blue']}
            </span>
          </div>
          <div className="selection-menu__palette">
            {colorChoices.map((color) => (
              <button
                aria-label={`Choose ${colorLabels[color]}`}
                className="selection-menu__swatch"
                data-active={contextMenu.currentColor === color && !contextMenu.hasMixedColor}
                key={color}
                onClick={() => onSelectColor(color)}
                style={{ '--selection-swatch': colorToHex[color] } as CSSProperties}
                type="button"
              >
                <span className="selection-menu__swatch-chip" />
                <span>{colorLabels[color]}</span>
              </button>
            ))}
          </div>
        </div>
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
