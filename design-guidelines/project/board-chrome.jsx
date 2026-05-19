// board-chrome.jsx — Floating panels for the board view.
// Themed entirely via CSS variables; both variations share these components.

const {
  IconCursor, IconPencil, IconText, IconShapes, IconEraser, IconLasso, IconHand,
  IconShare, IconLink, IconCheck, IconChevronDown, IconPlus, IconMinus, IconKeyboard,
  IconWifi, IconLogout, IconFront, IconBack, IconDuplicate, IconTrash, IconPalette, IconType, IconClose, IconRotate,
} = window;

// Panel — shared rounded-rectangle floating container
function Panel({ children, style = {}, padding = 6, radius = 12 }) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: radius,
      boxShadow: 'var(--panel-shadow)',
      padding,
      ...style,
    }}>{children}</div>
  );
}

// Tool icon button (square)
function ToolBtn({ Icon, active, label, sub }) {
  return (
    <div title={label} style={{
      width: 36, height: 36, borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: active ? 'var(--accent-on)' : 'var(--ink)',
      background: active ? 'var(--accent)' : 'transparent',
      position: 'relative',
    }}>
      <Icon size={18} />
      {sub && (
        <span style={{
          position: 'absolute', bottom: 3, right: 4,
          fontSize: 8, lineHeight: 1, fontFamily: '"JetBrains Mono", monospace',
          color: active ? 'var(--accent-on)' : 'var(--muted)', opacity: .7,
        }}>{sub}</span>
      )}
    </div>
  );
}

// Left tool strip — vertical icon column
function ToolStrip({ active = 'cursor' }) {
  const tools = [
    { id: 'cursor', Icon: IconCursor, label: 'Select', sub: 'V' },
    { id: 'hand', Icon: IconHand, label: 'Pan', sub: 'H' },
    { id: 'pencil', Icon: IconPencil, label: 'Pencil', sub: 'P' },
    { id: 'text', Icon: IconText, label: 'Text', sub: 'T' },
    { id: 'shapes', Icon: IconShapes, label: 'Shapes', sub: 'R' },
    { id: 'eraser', Icon: IconEraser, label: 'Eraser', sub: 'E' },
    { id: 'lasso', Icon: IconLasso, label: 'Lasso', sub: 'L' },
  ];
  return (
    <Panel padding={4} radius={12}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tools.map((t, i) => (
          <React.Fragment key={t.id}>
            {i === 2 && <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />}
            <ToolBtn Icon={t.Icon} label={t.label} sub={t.sub} active={active === t.id} />
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}

// Top-left "Share" pill — collapsed and "just-copied" variants
function SharePill({ state = 'idle' }) {
  // idle | copied
  const copied = state === 'copied';
  return (
    <Panel padding={0} radius={999} style={{ padding: '6px 12px 6px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
        <span style={{
          width: 22, height: 22, borderRadius: 999,
          background: copied ? 'var(--accent)' : 'var(--accent-tint)',
          color: copied ? 'var(--accent-on)' : 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {copied ? <IconCheck size={13} /> : <IconShare size={13} />}
        </span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          {copied ? 'Link copied' : 'Share board'}
        </span>
        {!copied && (
          <span style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            color: 'var(--muted)', borderLeft: '1px solid var(--border)',
            paddingLeft: 8, marginLeft: 2,
          }}>brainstorm-q3</span>
        )}
      </div>
    </Panel>
  );
}

// Top-right cluster: latency · avatar stack · user · logout
function TopRight({ latency = 38, you = { name: 'You', color: '#3b82f6' }, others = [] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Panel padding={0} radius={999} style={{ padding: '6px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
          <IconWifi size={13} />
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--muted)' }}>{latency} ms</span>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#22c55e', marginLeft: 2 }} />
        </div>
      </Panel>

      {/* Avatar stack */}
      <Panel padding={0} radius={999} style={{ padding: '4px 10px 4px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex' }}>
            {others.map((u, i) => (
              <div key={i} title={u.name} style={{
                width: 24, height: 24, borderRadius: 999, background: u.color,
                border: '2px solid var(--panel)',
                marginLeft: i === 0 ? 0 : -8,
                color: '#fff', fontWeight: 600, fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 - i,
              }}>{u.name[0]}</div>
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{others.length} online</span>
        </div>
      </Panel>

      <Panel padding={0} radius={999} style={{ padding: '4px 6px 4px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 999, background: you.color,
            color: '#fff', fontWeight: 600, fontSize: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{you.name[0]}</div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{you.name}</span>
          <span style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />
          <div title="Logout" style={{
            width: 24, height: 24, borderRadius: 999, color: 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><IconLogout size={14} /></div>
        </div>
      </Panel>
    </div>
  );
}

// Bottom-right: zoom level + shortcuts (?)
function ZoomPanel({ zoom = 100 }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Panel padding={0} radius={10} style={{ padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
          <IconMinus size={14} />
        </div>
        <div style={{ minWidth: 52, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{zoom}%</div>
        <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
          <IconPlus size={14} />
        </div>
        <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />
        <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
          <IconChevronDown size={14} />
        </div>
      </Panel>
      <Panel padding={0} radius={10} style={{ padding: 0 }}>
        <div title="Shortcuts" style={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink)',
        }}>
          <IconKeyboard size={16} />
        </div>
      </Panel>
    </div>
  );
}

// Pencil sub-panel (color + size)
function PencilPanel({ color = 'var(--accent)' }) {
  const swatches = ['#1f2430', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'];
  return (
    <Panel padding={12} radius={12} style={{ width: 196 }}>
      <div style={{ fontSize: 10, letterSpacing: 0.6, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
        Pencil
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginBottom: 12 }}>
        {swatches.map((c, i) => (
          <div key={c} style={{
            width: 18, height: 18, borderRadius: 999, background: c,
            border: i === 4 ? '2px solid var(--ink)' : '1px solid rgba(0,0,0,.08)',
            boxShadow: i === 4 ? '0 0 0 2px var(--panel)' : 'none',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 10, letterSpacing: 0.6, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
        Size
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[2, 4, 8, 14].map((s, i) => (
          <div key={s} style={{
            width: 28, height: 28, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i === 1 ? 'var(--accent-tint)' : 'transparent',
            border: i === 1 ? '1px solid var(--accent)' : '1px solid var(--border)',
          }}>
            <div style={{ width: s, height: s, borderRadius: 999, background: 'var(--ink)' }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--muted)', textAlign: 'right' }}>
        4 px · #3B82F6
      </div>
    </Panel>
  );
}

// Bounding box for selected items
function SelectionBox({ x, y, w, h, rotation = 0, label }) {
  const handleStyle = {
    position: 'absolute', width: 8, height: 8, background: 'var(--panel)',
    border: '1.5px solid var(--accent)', borderRadius: 1,
  };
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      transform: `rotate(${rotation}deg)`,
      border: '1.5px solid var(--accent)',
      pointerEvents: 'none',
      boxSizing: 'border-box',
    }}>
      <span style={{ ...handleStyle, left: -4, top: -4 }} />
      <span style={{ ...handleStyle, right: -4, top: -4 }} />
      <span style={{ ...handleStyle, left: -4, bottom: -4 }} />
      <span style={{ ...handleStyle, right: -4, bottom: -4 }} />
      <span style={{ ...handleStyle, left: '50%', top: -4, transform: 'translateX(-50%)' }} />
      <span style={{ ...handleStyle, left: '50%', bottom: -4, transform: 'translateX(-50%)' }} />
      <span style={{ ...handleStyle, left: -4, top: '50%', transform: 'translateY(-50%)' }} />
      <span style={{ ...handleStyle, right: -4, top: '50%', transform: 'translateY(-50%)' }} />
      {/* rotate handle */}
      <div style={{
        position: 'absolute', left: '50%', top: -28, transform: 'translateX(-50%)',
        width: 22, height: 22, borderRadius: 999,
        background: 'var(--panel)', border: '1.5px solid var(--accent)',
        color: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconRotate size={12} />
      </div>
      {/* connector to rotate handle */}
      <div style={{
        position: 'absolute', left: '50%', top: -8, width: 1, height: 8,
        background: 'var(--accent)', transform: 'translateX(-.5px)',
      }} />
      {label && (
        <div style={{
          position: 'absolute', left: 0, top: '100%', marginTop: 6,
          background: 'var(--accent)', color: 'var(--accent-on)',
          fontSize: 10, fontFamily: '"JetBrains Mono", monospace',
          padding: '2px 6px', borderRadius: 3, whiteSpace: 'nowrap',
        }}>{label}</div>
      )}
    </div>
  );
}

// OS-style vertical context menu
function ContextMenu({ x, y, items, hasFont = false }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      boxShadow: '0 10px 30px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.02)',
      padding: 4, minWidth: 200,
      fontSize: 13, color: 'var(--ink)',
    }}>
      {items.map((it, i) => it === '---' ? (
        <div key={i} style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />
      ) : (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 10px', borderRadius: 5,
          background: it.hover ? 'var(--accent-tint)' : 'transparent',
          color: it.danger ? '#dc2626' : (it.hover ? 'var(--accent)' : 'var(--ink)'),
        }}>
          <span style={{ width: 16, display: 'flex' }}>{it.icon}</span>
          <span style={{ flex: 1 }}>{it.label}</span>
          {it.shortcut && (
            <span style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
              color: it.hover ? 'var(--accent)' : 'var(--muted)',
            }}>{it.shortcut}</span>
          )}
          {it.submenu && <span style={{ color: 'var(--muted)' }}>›</span>}
        </div>
      ))}
    </div>
  );
}

// Shortcuts modal
function ShortcutsModal() {
  const groups = [
    {
      title: 'Tools', items: [
        ['Select', 'V'], ['Pan', 'H'], ['Pencil', 'P'], ['Text', 'T'],
        ['Shapes', 'R'], ['Eraser', 'E'], ['Lasso', 'L'],
      ],
    },
    {
      title: 'Canvas', items: [
        ['Pan canvas', 'Two-finger drag'], ['Zoom in / out', 'Ctrl + scroll'],
        ['Fit to view', 'Shift  1'], ['Zoom to 100%', 'Ctrl  0'],
      ],
    },
    {
      title: 'Editing', items: [
        ['Copy', 'Ctrl  C'], ['Paste', 'Ctrl  V'], ['Duplicate', 'Ctrl  D'],
        ['Delete', 'Del'], ['Multi-select', 'Ctrl  click'], ['Straight line', 'Hold  Shift'],
        ['Undo', 'Ctrl  Z'], ['Redo', 'Ctrl  Shift  Z'],
      ],
    },
  ];
  return (
    <div style={{
      width: 580,
      background: 'var(--panel)', border: '1px solid var(--border)',
      borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,.18)',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink)' }}>
          <IconKeyboard size={16} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Keyboard shortcuts</span>
        </div>
        <div style={{ color: 'var(--muted)' }}><IconClose size={14} /></div>
      </div>
      <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 32px' }}>
        {groups.map(g => (
          <div key={g.title} style={{ gridColumn: g.title === 'Editing' ? 'span 2' : 'auto', marginBottom: 6 }}>
            <div style={{ fontSize: 10, letterSpacing: 0.6, color: 'var(--muted)', textTransform: 'uppercase', margin: '8px 0 4px' }}>{g.title}</div>
            <div style={{ display: g.title === 'Editing' ? 'grid' : 'flex', gridTemplateColumns: g.title === 'Editing' ? '1fr 1fr' : undefined, flexDirection: g.title === 'Editing' ? undefined : 'column' }}>
              {g.items.map(([label, key]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                  <span style={{ color: 'var(--ink)' }}>{label}</span>
                  <span style={{ display: 'flex', gap: 3 }}>
                    {key.split('  ').map((k, i) => (
                      <kbd key={i} style={{
                        fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                        background: 'var(--bg-soft)', border: '1px solid var(--border)',
                        borderRadius: 4, padding: '1px 6px', minWidth: 16, textAlign: 'center',
                        color: 'var(--muted)',
                      }}>{k}</kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  Panel, ToolStrip, SharePill, TopRight, ZoomPanel, PencilPanel,
  SelectionBox, ContextMenu, ShortcutsModal,
});
