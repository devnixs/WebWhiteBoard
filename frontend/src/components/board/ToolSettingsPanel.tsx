import { useState } from 'react'
import { colorChoices, colorToHex, fontChoices, fontFamilyLabels, fontPixelSizes, shapeChoices, sizeChoices, sizeToPixels } from '../../app/constants'
import type { BoardTool, ColorChoice, FontChoice, ShapeChoice, SizeChoice } from '../../app/types'
import { IconChevronLeft, IconChevronRight } from '../common/Icons'

type ToolSettingsPanelProps = {
  activeTool: BoardTool
  drawColor: ColorChoice
  drawSize: SizeChoice
  textSize: SizeChoice
  textFont: FontChoice
  shapeChoice: ShapeChoice
  eraserSize: SizeChoice
  onChangeDrawColor: (value: ColorChoice) => void
  onChangeDrawSize: (value: SizeChoice) => void
  onChangeTextSize: (value: SizeChoice) => void
  onChangeTextFont: (value: FontChoice) => void
  onChangeShapeChoice: (value: ShapeChoice) => void
  onChangeEraserSize: (value: SizeChoice) => void
}

export function ToolSettingsPanel({
  activeTool,
  drawColor,
  drawSize,
  textSize,
  textFont,
  shapeChoice,
  eraserSize,
  onChangeDrawColor,
  onChangeDrawSize,
  onChangeTextSize,
  onChangeTextFont,
  onChangeShapeChoice,
  onChangeEraserSize,
}: ToolSettingsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (activeTool === 'select' || activeTool === 'hand') {
    return null
  }

  if (isCollapsed) {
    return (
      <section
        aria-label="Tool settings (collapsed)"
        className="panel panel--tool-settings panel--tool-settings--collapsed"
      >
        <button
          aria-label="Expand tool settings"
          className="tool-settings__collapse-toggle"
          onClick={() => setIsCollapsed(false)}
          type="button"
        >
          <IconChevronRight size={14} />
        </button>
      </section>
    )
  }

  const collapse = () => setIsCollapsed(true)

  return (
    <section aria-label="Tool settings" className="panel panel--tool-settings">
      {activeTool === 'pencil' ? (
        <>
          <PanelHeader title="Pencil" subtitle="Color and stroke size" onCollapse={collapse} />
          <ColorPicker mode="swatches" value={drawColor} onChange={onChangeDrawColor} />
          <SizePicker mode="dots" value={drawSize} onChange={onChangeDrawSize} />
        </>
      ) : null}

      {activeTool === 'text' ? (
        <>
          <PanelHeader title="Text" subtitle="Font and size" onCollapse={collapse} />
          <SizePicker
            label="Font size"
            renderValue={(size) => `${fontPixelSizes[size]} px`}
            value={textSize}
            onChange={onChangeTextSize}
          />
          <OptionPicker
            label="Font family"
            options={fontChoices.map((font) => ({
              id: font,
              label: fontFamilyLabels[font],
            }))}
            value={textFont}
            onChange={(value) => onChangeTextFont(value as FontChoice)}
          />
        </>
      ) : null}

      {activeTool === 'shapes' ? (
        <>
          <PanelHeader title="Shapes" subtitle="Choose a geometry preset" onCollapse={collapse} />
          <OptionPicker
            label="Shape"
            options={shapeChoices.map((shape) => ({
              id: shape.id,
              label: shape.label,
            }))}
            value={shapeChoice}
            onChange={(value) => onChangeShapeChoice(value as ShapeChoice)}
          />
          <ColorPicker value={drawColor} onChange={onChangeDrawColor} />
          <SizePicker value={drawSize} onChange={onChangeDrawSize} />
        </>
      ) : null}

      {activeTool === 'eraser' ? (
        <>
          <PanelHeader title="Eraser" subtitle="Adjust eraser size" onCollapse={collapse} />
          <SizePicker
            label="Eraser size"
            renderValue={(size) => `${sizeToPixels[size]} px`}
            value={eraserSize}
            onChange={onChangeEraserSize}
          />
        </>
      ) : null}

      {activeTool === 'lasso' ? (
        <>
          <PanelHeader title="Lasso" subtitle="Selection mode" onCollapse={collapse} />
          <p className="tool-settings__helper">
            Drag on the canvas to select a region. This dedicated lasso entry currently uses the
            native board selection engine.
          </p>
        </>
      ) : null}
    </section>
  )
}

function PanelHeader({
  title,
  subtitle,
  onCollapse,
}: {
  title: string
  subtitle: string
  onCollapse?: () => void
}) {
  return (
    <header className="tool-settings__header">
      <div className="tool-settings__header-text">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      {onCollapse ? (
        <button
          aria-label="Collapse tool settings"
          className="tool-settings__collapse-toggle"
          onClick={onCollapse}
          type="button"
        >
          <IconChevronLeft size={13} />
        </button>
      ) : null}
    </header>
  )
}

function ColorPicker({
  mode = 'chips',
  value,
  onChange,
}: {
  mode?: 'chips' | 'swatches'
  value: ColorChoice
  onChange: (value: ColorChoice) => void
}) {
  return (
    <OptionPicker
      label="Color"
      mode={mode}
      options={colorChoices.map((color) => ({
        id: color,
        label: color,
        swatch: colorToHex[color],
      }))}
      value={value}
      onChange={(nextValue) => onChange(nextValue as ColorChoice)}
    />
  )
}

function SizePicker({
  label = 'Size',
  mode = 'chips',
  value,
  onChange,
  renderValue = (size: SizeChoice) => `${sizeToPixels[size]} px`,
}: {
  label?: string
  mode?: 'chips' | 'dots'
  value: SizeChoice
  onChange: (value: SizeChoice) => void
  renderValue?: (value: SizeChoice) => string
}) {
  return (
    <OptionPicker
      label={label}
      mode={mode}
      options={sizeChoices.map((size) => ({
        id: size,
        label: renderValue(size),
        sizePx: sizeToPixels[size],
      }))}
      value={value}
      onChange={(nextValue) => onChange(nextValue as SizeChoice)}
    />
  )
}

function OptionPicker({
  label,
  mode = 'chips',
  options,
  value,
  onChange,
}: {
  label: string
  mode?: 'chips' | 'swatches' | 'dots'
  options: Array<{ id: string; label: string; swatch?: string; sizePx?: number }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="option-picker">
      <span className="option-picker__label">{label}</span>
      <div className={`option-picker__grid option-picker__grid--${mode}`}>
        {options.map((option) => (
          <button
            className={`option-chip option-chip--${mode} ${value === option.id ? 'option-chip--active' : ''}`}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            {option.swatch ? (
              <span
                aria-hidden="true"
                className="option-chip__swatch"
                style={{ background: option.swatch }}
              />
            ) : null}
            {option.sizePx ? (
              <span
                aria-hidden="true"
                className="option-chip__dot"
                style={{ width: option.sizePx, height: option.sizePx }}
              />
            ) : null}
            {mode === 'swatches' || mode === 'dots' ? null : <span>{option.label}</span>}
          </button>
        ))}
      </div>
      {(mode === 'swatches' || mode === 'dots') && options.some((option) => option.id === value) ? (
        <div className="option-picker__value">{options.find((option) => option.id === value)?.label}</div>
      ) : null}
    </div>
  )
}
