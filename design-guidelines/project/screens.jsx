// screens.jsx — composes artboard screens for both variations.

const {
  ToolStrip, SharePill, TopRight, ZoomPanel, PencilPanel,
  SelectionBox, ContextMenu, ShortcutsModal,
  BSScene, BSRemoteCursor, BSNote, BSHandText, BSStroke,
  IconBoard, IconPlus, IconSearch, IconMore, IconChevronDown,
  IconFront, IconBack, IconDuplicate, IconTrash, IconPalette, IconType, IconRotate, IconLogout,
} = window;

// — Canvas background variants —
function CanvasBg({ kind, color }) {
  // kind: 'dots' | 'grid' | 'paper' | 'blank'
  if (kind === 'dots') {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(${color} 1px, transparent 1px) 0 0 / 22px 22px`,
        backgroundColor: 'var(--canvas)',
      }} />
    );
  }
  if (kind === 'grid') {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'var(--canvas)',
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }} />
    );
  }
  return <div style={{ position: 'absolute', inset: 0, background: 'var(--canvas)' }} />;
}

// — Standard chrome overlay positioned around a board —
function BoardChrome({ activeTool = 'cursor', shareState = 'idle', zoom = 100, you, others, latency = 38, showPencil = false }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 30 }}>
        <SharePill state={shareState} />
      </div>
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 30 }}>
        <TopRight latency={latency} you={you} others={others} />
      </div>
      <div style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', zIndex: 30, display: 'flex', gap: 10 }}>
        <ToolStrip active={activeTool} />
        {showPencil && <div style={{ alignSelf: 'flex-start', marginTop: 86 }}><PencilPanel /></div>}
      </div>
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 30 }}>
        <ZoomPanel zoom={zoom} />
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// HOMEPAGE — first visit (name entry)
// ────────────────────────────────────────────────────────────
function HomepageNameEntry({ brand, palette }) {
  const colors = palette || ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16'];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', overflow: 'hidden', fontFamily: 'var(--ui-font)' }}>
      {/* faint backdrop pattern */}
      <CanvasBg kind={brand.canvasKind} color="var(--grid-faint)" />
      {/* corner brand */}
      <div style={{ position: 'absolute', top: 24, left: 28, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink)' }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent)' }} />
        <span style={{ fontWeight: 700, letterSpacing: -0.2, fontSize: 16 }}>{brand.name}</span>
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 420, background: 'var(--panel)',
          border: '1px solid var(--border)', borderRadius: 16,
          boxShadow: 'var(--panel-shadow-strong)',
          padding: '32px 32px 24px',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 0.8, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
            Welcome
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.4 }}>
            What should we call you?
          </h1>
          <p style={{ margin: '6px 0 22px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            Your name is shown next to your cursor so others know who's drawing.
          </p>

          <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.4, textTransform: 'uppercase' }}>Name</label>
          <div style={{
            marginTop: 6, padding: '10px 12px',
            background: 'var(--bg-soft)', border: '1px solid var(--accent)',
            borderRadius: 8, fontSize: 14, color: 'var(--ink)',
            boxShadow: '0 0 0 3px var(--accent-tint)',
          }}>
            Maya Chen<span style={{ display: 'inline-block', width: 1, height: 14, background: 'var(--accent)', marginLeft: 1, verticalAlign: '-2px' }} />
          </div>

          <div style={{ marginTop: 18, fontSize: 11, color: 'var(--muted)', letterSpacing: 0.4, textTransform: 'uppercase' }}>Your color</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {colors.map((c, i) => (
              <div key={c} style={{
                width: 26, height: 26, borderRadius: 999, background: c,
                border: i === 0 ? '2px solid var(--ink)' : '1px solid rgba(0,0,0,.06)',
                boxShadow: i === 0 ? '0 0 0 2px var(--panel)' : 'none',
              }} />
            ))}
          </div>

          <div style={{
            marginTop: 22, padding: '10px 14px',
            background: 'var(--accent)', color: 'var(--accent-on)',
            borderRadius: 8, fontWeight: 600, fontSize: 14, textAlign: 'center',
          }}>Continue →</div>

          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
            Saved on this device. No account needed.
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// HOMEPAGE — returning user with board list
// ────────────────────────────────────────────────────────────
function HomepageBoardList({ brand, you }) {
  const boards = [
    { name: 'Brainstorm · Q3 onboarding', id: 'brainstorm-q3', members: 4, last: '2 min ago', preview: 'live' },
    { name: 'Design crit · checkout flow', id: 'crit-checkout', members: 6, last: '1 hour ago' },
    { name: 'Retro · Sprint 24', id: 'retro-s24', members: 8, last: 'Yesterday' },
    { name: 'Weekly sync · doodles', id: 'sync-doodles', members: 3, last: '3 days ago' },
    { name: 'Mobile nav exploration', id: 'mobile-nav', members: 2, last: 'Last week' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', overflow: 'hidden', fontFamily: 'var(--ui-font)' }}>
      <CanvasBg kind={brand.canvasKind} color="var(--grid-faint)" />

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 24, left: 28, right: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink)' }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, letterSpacing: -0.2, fontSize: 16 }}>{brand.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 999,
            padding: '6px 10px 6px 6px', boxShadow: 'var(--panel-shadow)',
          }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: you.color, color: '#fff', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{you.name[0]}</div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{you.name}</span>
            <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
            <span style={{ color: 'var(--muted)', display: 'flex' }}><IconLogout size={14} /></span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)', width: 720 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.4 }}>
              Welcome back, Maya
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
              {boards.length} boards on this device · Pick up where you left off
            </p>
          </div>
        </div>

        {/* New board CTA */}
        <div style={{
          background: 'var(--panel)', border: '1.5px dashed var(--border-strong)',
          borderRadius: 12, padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconPlus size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>New board</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>A blank, infinite canvas. Share the link to invite others.</div>
            </div>
          </div>
          <div style={{ padding: '8px 14px', background: 'var(--accent)', color: 'var(--accent-on)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Create</div>
        </div>

        {/* Board list */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12,
          overflow: 'hidden', boxShadow: 'var(--panel-shadow)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 11, letterSpacing: 0.6, color: 'var(--muted)', textTransform: 'uppercase' }}>Your boards</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              border: '1px solid var(--border)', borderRadius: 6,
              fontSize: 12, color: 'var(--muted)',
            }}>
              <IconSearch size={12} /> Search…
            </div>
          </div>
          {boards.map((b, i) => (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px',
              borderBottom: i === boards.length - 1 ? 'none' : '1px solid var(--border)',
              background: i === 0 ? 'var(--accent-tint)' : 'transparent',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: 'var(--bg-soft)',
                border: '1px solid var(--border)', color: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconBoard size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{b.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: '"JetBrains Mono", monospace', marginTop: 2 }}>
                  /board/{b.id}
                </div>
              </div>
              {b.preview === 'live' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,.2)' }} />
                  3 live now
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--muted)', minWidth: 90, textAlign: 'right' }}>{b.last}</div>
              <div style={{ display: 'flex' }}>
                {Array.from({ length: Math.min(b.members, 3) }).map((_, k) => (
                  <div key={k} style={{
                    width: 20, height: 20, borderRadius: 999,
                    background: ['#3b82f6', '#f59e0b', '#22c55e'][k],
                    border: '2px solid var(--panel)', marginLeft: k === 0 ? 0 : -6,
                  }} />
                ))}
                {b.members > 3 && (
                  <div style={{
                    width: 20, height: 20, borderRadius: 999, background: 'var(--bg-soft)',
                    border: '2px solid var(--panel)', marginLeft: -6,
                    fontSize: 9, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+{b.members - 3}</div>
                )}
              </div>
              <div style={{ color: 'var(--muted)', display: 'flex' }}><IconMore size={16} /></div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
          Have a link? Just paste it in the address bar — boards work via /board/[id].
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// BOARD VIEW — default state
// ────────────────────────────────────────────────────────────
function BoardDefault({ brand, you }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: 'var(--ui-font)' }}>
      <CanvasBg kind={brand.canvasKind} color="var(--grid)" />
      {/* Brainstorm content positioned within the "infinite" canvas */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <BSScene offsetX={120} offsetY={120} />
        {/* remote cursors */}
        <BSRemoteCursor x={310} y={260} color="#f59e0b" name="Jon" />
        <BSRemoteCursor x={760} y={360} color="#22c55e" name="Ren" />
        <BSRemoteCursor x={210} y={520} color="#a855f7" name="Sam" flagAbove />
      </div>
      <BoardChrome activeTool="cursor" you={you} others={[
        { name: 'Jon', color: '#f59e0b' },
        { name: 'Ren', color: '#22c55e' },
        { name: 'Sam', color: '#a855f7' },
      ]} latency={32} zoom={100} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// BOARD VIEW — multi-selection + right-click context menu
// ────────────────────────────────────────────────────────────
function BoardSelection({ brand, you }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: 'var(--ui-font)' }}>
      <CanvasBg kind={brand.canvasKind} color="var(--grid)" />
      <div style={{ position: 'absolute', inset: 0 }}>
        <BSScene offsetX={120} offsetY={120} />

        {/* Individual selection boxes for two notes (Maya's notes), then a parent box around them */}
        <SelectionBox x={138} y={196} w={172} h={108} rotation={-2} />
        <SelectionBox x={238} y={328} w={172} h={108} rotation={-1} />
        {/* Group box */}
        <div style={{
          position: 'absolute', left: 130, top: 184, width: 296, height: 270,
          border: '1.5px dashed var(--accent)', borderRadius: 4,
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: -22, left: 0,
            background: 'var(--accent)', color: 'var(--accent-on)',
            fontSize: 10, fontFamily: '"JetBrains Mono", monospace',
            padding: '2px 6px', borderRadius: 3, fontWeight: 600,
          }}>2 selected</div>
        </div>

        {/* remote cursors */}
        <BSRemoteCursor x={780} y={360} color="#22c55e" name="Ren" />
        <BSRemoteCursor x={520} y={180} color="#f59e0b" name="Jon" flagAbove />

        {/* Right-click context menu near the selection */}
        <ContextMenu x={440} y={300} items={[
          { icon: <IconFront size={14} />, label: 'Bring to front', shortcut: '] ]' },
          { icon: <IconBack size={14} />, label: 'Send to back', shortcut: '[ [' },
          '---',
          { icon: <IconDuplicate size={14} />, label: 'Duplicate', shortcut: 'Ctrl  D', hover: true },
          { icon: <IconPalette size={14} />, label: 'Change color', submenu: true },
          { icon: <IconType size={14} />, label: 'Font family', submenu: true },
          { icon: <span style={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}>A+</span>, label: 'Increase font size', shortcut: 'Ctrl  +' },
          '---',
          { icon: <IconTrash size={14} />, label: 'Delete', shortcut: 'Del', danger: true },
        ]} />
      </div>

      <BoardChrome activeTool="cursor" you={you} others={[
        { name: 'Jon', color: '#f59e0b' },
        { name: 'Ren', color: '#22c55e' },
        { name: 'Sam', color: '#a855f7' },
      ]} latency={28} zoom={125} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// BOARD VIEW — pencil active + share-copied + shortcuts modal
// ────────────────────────────────────────────────────────────
function BoardPencilAndShortcuts({ brand, you }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: 'var(--ui-font)' }}>
      <CanvasBg kind={brand.canvasKind} color="var(--grid)" />
      <div style={{ position: 'absolute', inset: 0 }}>
        <BSScene offsetX={120} offsetY={120} />

        {/* a fresh ink stroke being drawn next to the hypothesis box */}
        <BSStroke x={720} y={130} width={260} height={80} d="M 0 60 C 30 20, 70 10, 110 40 S 200 60, 250 20" stroke="#3b82f6" strokeWidth={4} />
        <BSHandText x={770} y={100} size={18} color="#3b82f6" rot={-3}>↑ pri 1</BSHandText>

        {/* shift snapping indicator: dashed orthogonal guide */}
        <div style={{
          position: 'absolute', left: 720, top: 220, width: 240, height: 0,
          borderTop: '1.5px dashed #3b82f6', opacity: .55,
        }} />
        <div style={{
          position: 'absolute', left: 720, top: 218, padding: '2px 6px',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
          background: '#3b82f6', color: '#fff', borderRadius: 3,
        }}>SHIFT · 0°</div>

        {/* remote cursors */}
        <BSRemoteCursor x={400} y={260} color="#f59e0b" name="Jon" />
        <BSRemoteCursor x={150} y={520} color="#a855f7" name="Sam" flagAbove />
      </div>

      <BoardChrome activeTool="pencil" shareState="copied" you={you} others={[
        { name: 'Jon', color: '#f59e0b' },
        { name: 'Ren', color: '#22c55e' },
        { name: 'Sam', color: '#a855f7' },
      ]} latency={41} zoom={100} showPencil />

      {/* Shortcuts modal overlay */}
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.18)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
        padding: '0 16px 64px 0', zIndex: 50,
      }}>
        <ShortcutsModal />
      </div>
    </div>
  );
}

Object.assign(window, {
  HomepageNameEntry, HomepageBoardList,
  BoardDefault, BoardSelection, BoardPencilAndShortcuts,
});
