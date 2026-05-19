// app.jsx — top-level: DesignCanvas with the chosen direction ("Studio").

const {
  DesignCanvas, DCSection, DCArtboard,
  HomepageNameEntry, HomepageBoardList,
  BoardDefault, BoardSelection, BoardPencilAndShortcuts,
} = window;

// ── Theme: "Studio" — cool slate + blue accent, dot-grid canvas ──
const THEME = {
  '--ui-font': '"Helvetica Neue", Helvetica, Arial, sans-serif',
  '--bg': '#f7f8fa',
  '--bg-soft': '#f1f3f6',
  '--panel': '#ffffff',
  '--canvas': '#fafbfc',
  '--ink': '#0f172a',
  '--muted': '#64748b',
  '--border': '#e4e7ec',
  '--border-strong': '#cbd2dc',
  '--grid': 'rgba(15, 23, 42, 0.12)',
  '--grid-faint': 'rgba(15, 23, 42, 0.04)',
  '--accent': 'oklch(0.58 0.16 254)',
  '--accent-on': '#ffffff',
  '--accent-tint': 'oklch(0.95 0.04 254)',
  '--panel-shadow': '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 14px rgba(15, 23, 42, 0.05)',
  '--panel-shadow-strong': '0 8px 30px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)',
  '--note-1': '#fef9c3',  // soft yellow
  '--note-2': '#dbeafe',  // soft blue
  '--note-3': '#fce7f3',  // soft pink
  '--note-4': '#dcfce7',  // soft green
};
const BRAND = { name: 'WebWhiteBoard', canvasKind: 'dots' };
const YOU = { name: 'Maya', color: 'oklch(0.58 0.16 254)' };

// Themed wrapper — sets CSS variables on its root so all children resolve.
function Themed({ theme, children, style = {} }) {
  return (
    <div style={{ ...theme, position: 'absolute', inset: 0, ...style }}>
      {children}
    </div>
  );
}

// NB: DCSection filters its children by `type === DCArtboard`, so a wrapper
// component would hide them. Always render DCArtboard directly at the section
// level and apply the theme inside via <Themed>.

function App() {
  return (
    <DesignCanvas>
      <DCSection id="overview" title="WebWhiteBoard"
        subtitle="Hi-fi mockups · 5 screens. Click any artboard's expand icon to open it fullscreen.">
        <DCArtboard id="header" label="Spec" width={420} height={540}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff', padding: 28, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#0f172a', overflow: 'auto' }}>
            <div style={{ fontSize: 10, letterSpacing: 0.8, color: '#64748b', textTransform: 'uppercase' }}>Brief</div>
            <h1 style={{ margin: '6px 0 12px', fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>WebWhiteBoard</h1>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: '#334155', margin: 0 }}>
              Real-time collaborative whiteboard. Infinite canvas, floating tool panels, multiplayer cursors, share-link based access. No accounts — just a name + a color stored locally.
            </p>
            <div style={{ height: 1, background: '#e4e7ec', margin: '22px 0' }} />
            <div style={{ fontSize: 10, letterSpacing: 0.8, color: '#64748b', textTransform: 'uppercase' }}>System</div>
            <ul style={{ fontSize: 13, lineHeight: 1.7, color: '#334155', paddingLeft: 18, margin: '6px 0 0' }}>
              <li>Clean & minimal — white panels, 1px borders, soft shadows</li>
              <li>Cool slate neutrals · blue accent · dot-grid canvas</li>
              <li>Type: Helvetica Neue UI · JetBrains Mono for keys/IDs · Caveat for handwriting on canvas</li>
              <li>Conventional whiteboard layout: tools left, share top-left, presence top-right, zoom bottom-right</li>
            </ul>
            <div style={{ height: 1, background: '#e4e7ec', margin: '22px 0' }} />
            <div style={{ fontSize: 10, letterSpacing: 0.8, color: '#64748b', textTransform: 'uppercase' }}>Screens</div>
            <ol style={{ fontSize: 13, lineHeight: 1.7, color: '#334155', paddingLeft: 20, margin: '6px 0 0' }}>
              <li>Homepage · name entry (first visit)</li>
              <li>Homepage · board list (return)</li>
              <li>Board · default brainstorm state</li>
              <li>Board · multi-select + right-click menu</li>
              <li>Board · pencil active + link-copied + shortcuts modal</li>
            </ol>
          </div>
        </DCArtboard>
      </DCSection>

      <DCSection id="screens" title="Screens"
        subtitle="White panels, crisp 1px borders, blue accent. Restrained and precise.">

        <DCArtboard id="home-name" label="01 · Name entry" width={1280} height={800}>
          <Themed theme={THEME}><HomepageNameEntry brand={BRAND} palette={['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16']} /></Themed>
        </DCArtboard>

        <DCArtboard id="home-list" label="02 · Board list" width={1280} height={800}>
          <Themed theme={THEME}><HomepageBoardList brand={BRAND} you={YOU} /></Themed>
        </DCArtboard>

        <DCArtboard id="board-default" label="03 · Board (default)" width={1440} height={900}>
          <Themed theme={THEME}><BoardDefault brand={BRAND} you={YOU} /></Themed>
        </DCArtboard>

        <DCArtboard id="board-select" label="04 · Selection + context menu" width={1440} height={900}>
          <Themed theme={THEME}><BoardSelection brand={BRAND} you={YOU} /></Themed>
        </DCArtboard>

        <DCArtboard id="board-pencil" label="05 · Pencil + shortcuts" width={1440} height={900}>
          <Themed theme={THEME}><BoardPencilAndShortcuts brand={BRAND} you={YOU} /></Themed>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
