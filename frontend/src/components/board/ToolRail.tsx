import type { BoardTool } from '../../app/types'
import { IconCursor, IconEraser, IconHand, IconLasso, IconPencil, IconShapes, IconText } from '../common/Icons'

type ToolRailProps = {
  activeTool: BoardTool
  onSelectTool: (tool: BoardTool) => void
}

const tools = [
  { id: 'select', name: 'Select', hint: 'V', icon: IconCursor },
  { id: 'hand', name: 'Pan', hint: 'H', icon: IconHand },
  { id: 'pencil', name: 'Pencil', hint: 'P', icon: IconPencil },
  { id: 'text', name: 'Text', hint: 'T', icon: IconText },
  { id: 'shapes', name: 'Shapes', hint: 'R', icon: IconShapes },
  { id: 'eraser', name: 'Eraser', hint: 'E', icon: IconEraser },
  { id: 'lasso', name: 'Lasso', hint: 'L', icon: IconLasso },
] as const

export function ToolRail({ activeTool, onSelectTool }: ToolRailProps) {
  return (
    <section className="panel panel--tools" aria-label="Board tools">
      {tools.map((tool, index) => (
        <div className="tool-rail__item" key={tool.name}>
          {index === 2 ? <div className="tool-rail__divider" /> : null}
          <button
            aria-label={tool.name}
            className={`tool-button ${activeTool === tool.id ? 'tool-button--active' : ''}`}
            onClick={() => onSelectTool(tool.id)}
            type="button"
          >
            <tool.icon size={18} />
            <span className="tool-button__hint">{tool.hint}</span>
          </button>
        </div>
      ))}
    </section>
  )
}
