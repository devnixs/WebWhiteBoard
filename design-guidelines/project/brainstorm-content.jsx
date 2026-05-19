// brainstorm-content.jsx — reusable brainstorm scene primitives.
// All positions are in *canvas* coordinates (parent should set position:relative).
// Themed via CSS variables on a wrapping element:
//   --ink, --muted, --accent, --paper, --grid, --note-1..--note-4

function Note({ x, y, w = 168, h = 132, rot = 0, color = 'var(--note-1)', children, author }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      transform: `rotate(${rot}deg)`,
      background: color,
      boxShadow: '0 1px 0 rgba(0,0,0,.04), 0 6px 14px rgba(20,20,30,.08)',
      padding: '12px 14px',
      fontSize: 13, lineHeight: 1.35,
      color: 'rgba(20,20,30,.82)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      borderRadius: 1,
    }}>
      <div style={{ fontFamily: '"Caveat", "Bradley Hand", cursive', fontSize: 18, lineHeight: 1.2 }}>{children}</div>
      {author && <div style={{ fontSize: 10, opacity: .55, letterSpacing: .3, textTransform: 'uppercase' }}>{author}</div>}
    </div>
  );
}

function HandText({ x, y, size = 28, rot = 0, color = 'var(--ink)', weight = 600, children, family = '"Caveat", "Bradley Hand", cursive' }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`,
      fontFamily: family, fontSize: size, fontWeight: weight, color, lineHeight: 1.1,
      whiteSpace: 'pre',
    }}>{children}</div>
  );
}

function Rect({ x, y, w, h, stroke = 'var(--ink)', strokeWidth = 2, fill = 'transparent', rx = 0, rot = 0 }) {
  return (
    <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible', transform: `rotate(${rot}deg)` }} width={w} height={h}>
      <rect x={strokeWidth / 2} y={strokeWidth / 2} width={w - strokeWidth} height={h - strokeWidth} rx={rx} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
}

function Ellipse({ x, y, w, h, stroke = 'var(--ink)', strokeWidth = 2, fill = 'transparent' }) {
  return (
    <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }} width={w} height={h}>
      <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - strokeWidth} ry={h / 2 - strokeWidth} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
}

// hand-drawn curving arrow with arrowhead
function Arrow({ from, to, c1, c2, stroke = 'var(--ink)', strokeWidth = 2, dashed = false }) {
  const [x1, y1] = from, [x2, y2] = to;
  const cc1 = c1 ?? [(x1 + x2) / 2, y1];
  const cc2 = c2 ?? [(x1 + x2) / 2, y2];
  const pad = 40;
  const minX = Math.min(x1, x2, cc1[0], cc2[0]) - pad;
  const minY = Math.min(y1, y2, cc1[1], cc2[1]) - pad;
  const maxX = Math.max(x1, x2, cc1[0], cc2[0]) + pad;
  const maxY = Math.max(y1, y2, cc1[1], cc2[1]) + pad;
  const w = maxX - minX, h = maxY - minY;
  const path = `M ${x1 - minX} ${y1 - minY} C ${cc1[0] - minX} ${cc1[1] - minY}, ${cc2[0] - minX} ${cc2[1] - minY}, ${x2 - minX} ${y2 - minY}`;
  // arrowhead angle from c2 → end
  const ang = Math.atan2(y2 - cc2[1], x2 - cc2[0]);
  const ah = 11;
  const aw = 6;
  return (
    <svg style={{ position: 'absolute', left: minX, top: minY, overflow: 'visible', pointerEvents: 'none' }} width={w} height={h}>
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={dashed ? '6 5' : 'none'} />
      <g transform={`translate(${x2 - minX} ${y2 - minY}) rotate(${ang * 180 / Math.PI})`}>
        <path d={`M 0 0 L ${-ah} ${-aw} L ${-ah * 0.6} 0 L ${-ah} ${aw} Z`} fill={stroke} />
      </g>
    </svg>
  );
}

// Hand-drawn freeform stroke (passed as SVG path string, in absolute canvas coords)
function Stroke({ d, stroke = 'var(--ink)', strokeWidth = 3, x = 0, y = 0, width = 600, height = 400, opacity = 1 }) {
  return (
    <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible', pointerEvents: 'none', opacity }} width={width} height={height}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// remote-user cursor with name flag
function RemoteCursor({ x, y, color, name, flagAbove = false }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 50 }}>
      <svg width="20" height="22" viewBox="0 0 20 22" style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.15))' }}>
        <path d="M2 2 L2 18 L7 14 L10 20 L13 19 L10 13 L17 13 Z" fill={color} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      <div style={{
        position: 'absolute',
        left: flagAbove ? 14 : 14,
        top: flagAbove ? -20 : 18,
        background: color, color: '#fff',
        fontSize: 11, fontWeight: 600, letterSpacing: .2,
        padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0,0,0,.15)',
      }}>{name}</div>
    </div>
  );
}

function ImagePlaceholder({ x, y, w, h, label = 'screenshot.png', rot = 0 }) {
  const id = `pat-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`,
      background: '#f4f2ee', border: '1px solid rgba(20,20,30,.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 10, color: 'rgba(20,20,30,.4)', letterSpacing: .5,
      overflow: 'hidden', position: 'absolute',
    }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(20,20,30,.08)" strokeWidth="6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
      <span style={{ position: 'relative' }}>{label}</span>
    </div>
  );
}

// The canonical brainstorm scene — used inside the canvas in all board views.
// `offsetX`/`offsetY` shift the whole scene so different artboards can show
// different parts of the "infinite" canvas.
function BrainstormScene({ offsetX = 0, offsetY = 0 }) {
  return (
    <div style={{ position: 'absolute', left: offsetX, top: offsetY, width: 0, height: 0 }}>
      {/* Cluster A: "Onboarding pain points" */}
      <HandText x={40} y={20} size={26} weight={700}>Onboarding · what hurts?</HandText>
      <Stroke x={40} y={48} width={300} height={12} d="M 0 6 C 60 0, 120 12, 200 4 S 280 8, 300 6" stroke="var(--accent)" strokeWidth={3} />

      <Note x={20} y={80} w={172} h={108} rot={-2} color="var(--note-1)" author="Maya">
        Users drop off at step 3 — too many fields
      </Note>
      <Note x={210} y={92} w={172} h={108} rot={1.5} color="var(--note-2)" author="Jon">
        Tooltip copy is vague. "Why do you need this?"
      </Note>
      <Note x={120} y={210} w={172} h={108} rot={-1} color="var(--note-1)" author="Maya">
        Ask for the team name AFTER first board
      </Note>
      <Note x={310} y={220} w={172} h={108} rot={2.5} color="var(--note-3)" author="Ren">
        Empty state → seed with template
      </Note>

      {/* Cluster B: "What to test" */}
      <HandText x={580} y={20} size={26} weight={700}>This week → test</HandText>
      <Stroke x={580} y={48} width={220} height={12} d="M 0 6 C 50 0, 100 12, 160 4 S 200 8, 220 6" stroke="var(--accent)" strokeWidth={3} />

      <Rect x={570} y={80} w={260} h={150} stroke="var(--ink)" strokeWidth={2} rx={4} />
      <HandText x={586} y={94} size={14} family='"JetBrains Mono", monospace' weight={500}>HYPOTHESIS</HandText>
      <HandText x={586} y={120} size={18} weight={600}>If we defer team-name{`\n`}to post-board, then{`\n`}D1 activation ↑ 8%</HandText>

      <Note x={595} y={250} w={140} h={92} rot={-1.5} color="var(--note-4)" author="Ren">
        Ship Tue. Measure Fri.
      </Note>
      <Note x={745} y={260} w={88} h={92} rot={2} color="var(--note-2)">
        ⚠ Need analytics
      </Note>

      {/* Arrow connecting clusters */}
      <Arrow from={[490, 260]} to={[580, 200]} c1={[530, 280]} c2={[560, 240]} stroke="var(--accent)" strokeWidth={2.5} />

      {/* Cluster C below: sketch */}
      <HandText x={40} y={370} size={22} weight={700}>flow sketch</HandText>
      <Rect x={30} y={410} w={120} h={70} stroke="var(--ink)" strokeWidth={2} rx={6} />
      <HandText x={62} y={432} size={13} family='"JetBrains Mono", monospace'>landing</HandText>
      <Arrow from={[155, 445]} to={[195, 445]} c1={[170, 440]} c2={[180, 450]} stroke="var(--ink)" />

      <Rect x={200} y={410} w={120} h={70} stroke="var(--ink)" strokeWidth={2} rx={6} />
      <HandText x={232} y={432} size={13} family='"JetBrains Mono", monospace'>name +</HandText>
      <HandText x={232} y={448} size={13} family='"JetBrains Mono", monospace'>color</HandText>
      <Arrow from={[325, 445]} to={[365, 445]} c1={[340, 440]} c2={[355, 450]} stroke="var(--ink)" />

      <Rect x={370} y={410} w={120} h={70} stroke="var(--accent)" strokeWidth={2.5} rx={6} fill="var(--accent-tint)" />
      <HandText x={398} y={432} size={13} family='"JetBrains Mono", monospace' color="var(--accent)">board</HandText>
      <HandText x={398} y={448} size={13} family='"JetBrains Mono", monospace' color="var(--accent)">(empty)</HandText>

      <Ellipse x={530} y={400} w={170} h={90} stroke="var(--ink)" strokeWidth={2} />
      <HandText x={555} y={432} size={15} weight={600}>"aha" moment</HandText>
      <HandText x={570} y={452} size={11} family='"JetBrains Mono", monospace' color="var(--muted)">= 1st stroke</HandText>

      <Arrow from={[492, 445]} to={[528, 445]} c1={[508, 440]} c2={[518, 450]} stroke="var(--ink)" />

      {/* a screenshot reference */}
      <ImagePlaceholder x={760} y={400} w={170} h={110} label="user-test-03.png" rot={-2} />
      <Stroke x={750} y={360} width={200} height={60} d="M 10 50 C 40 20, 80 30, 130 10" stroke="var(--accent)" strokeWidth={2.5} />
      <HandText x={760} y={362} size={16} color="var(--accent)" rot={-4}>this part!</HandText>
    </div>
  );
}

window.BSScene = BrainstormScene;
window.BSNote = Note;
window.BSHandText = HandText;
window.BSRect = Rect;
window.BSEllipse = Ellipse;
window.BSArrow = Arrow;
window.BSStroke = Stroke;
window.BSRemoteCursor = RemoteCursor;
window.BSImagePlaceholder = ImagePlaceholder;
