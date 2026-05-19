// icons.jsx — small library of stroke icons used across the prototype.
// 24x24 viewBox, currentColor stroke. Each component takes a `size` prop.

const Ico = ({ size = 18, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    {children}
  </svg>
);

const IconCursor = (p) => <Ico {...p}><path d="M5 3 L5 19 L9.5 15.5 L12 21 L15 20 L12.5 14 L19 14 Z" /></Ico>;
const IconPencil = (p) => <Ico {...p}><path d="M16 3 L21 8 L8 21 L3 21 L3 16 Z" /><path d="M14 5 L19 10" /></Ico>;
const IconText = (p) => <Ico {...p}><path d="M5 5 L19 5" /><path d="M12 5 L12 20" /></Ico>;
const IconShapes = (p) => <Ico {...p}><rect x="3" y="3" width="9" height="9" rx="1.5" /><circle cx="16.5" cy="16.5" r="4.5" /></Ico>;
const IconEraser = (p) => <Ico {...p}><path d="M16 4 L20 8 L10 18 L6 18 L4 16 Z" /><path d="M10 18 L15 13" /><path d="M9 21 L21 21" /></Ico>;
const IconLasso = (p) => <Ico {...p}><path d="M4 6 C 4 3.5 9 2.5 12 2.5 C 17 2.5 20 5 20 8 C 20 11 17 13 12 13 C 9 13 6.5 12 5.5 11" /><path d="M5.5 11 C 5 13 6 16 7 17.5" /><circle cx="7.5" cy="19" r="2" /></Ico>;
const IconHand = (p) => <Ico {...p}><path d="M6 11 V6.5 a1.5 1.5 0 0 1 3 0 V11" /><path d="M9 11 V5 a1.5 1.5 0 0 1 3 0 V11" /><path d="M12 11 V5.5 a1.5 1.5 0 0 1 3 0 V11" /><path d="M15 11 V8 a1.5 1.5 0 0 1 3 0 V14 a6 6 0 0 1 -6 6 H 10 a4 4 0 0 1 -4 -4 V11 a1.5 1.5 0 0 1 3 0" /></Ico>;
const IconShare = (p) => <Ico {...p}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8 11 L16 7" /><path d="M8 13 L16 17" /></Ico>;
const IconLink = (p) => <Ico {...p}><path d="M9 14 a3 3 0 0 1 0-4 l3-3 a3 3 0 1 1 4 4 l-1.5 1.5" /><path d="M15 10 a3 3 0 0 1 0 4 l-3 3 a3 3 0 1 1 -4 -4 l1.5 -1.5" /></Ico>;
const IconCheck = (p) => <Ico {...p}><path d="M5 12 L10 17 L19 7" /></Ico>;
const IconClose = (p) => <Ico {...p}><path d="M6 6 L18 18" /><path d="M18 6 L6 18" /></Ico>;
const IconChevronUp = (p) => <Ico {...p}><path d="M6 14 L12 8 L18 14" /></Ico>;
const IconChevronDown = (p) => <Ico {...p}><path d="M6 10 L12 16 L18 10" /></Ico>;
const IconPlus = (p) => <Ico {...p}><path d="M12 5 L12 19" /><path d="M5 12 L19 12" /></Ico>;
const IconMinus = (p) => <Ico {...p}><path d="M5 12 L19 12" /></Ico>;
const IconKeyboard = (p) => <Ico {...p}><rect x="2.5" y="6" width="19" height="13" rx="2" /><path d="M6 10 H 6.01" /><path d="M10 10 H 10.01" /><path d="M14 10 H 14.01" /><path d="M18 10 H 18.01" /><path d="M7 14.5 H 17" /></Ico>;
const IconRotate = (p) => <Ico {...p}><path d="M20 12 a8 8 0 1 1 -3.5 -6.6" /><path d="M20 4 V 9 H 15" /></Ico>;
const IconWifi = (p) => <Ico {...p}><path d="M3 9 a13 13 0 0 1 18 0" /><path d="M6 12.5 a8 8 0 0 1 12 0" /><path d="M9 16 a3.5 3.5 0 0 1 6 0" /><circle cx="12" cy="19" r=".8" fill="currentColor" /></Ico>;
const IconLogout = (p) => <Ico {...p}><path d="M14 4 H5 a1 1 0 0 0 -1 1 V19 a1 1 0 0 0 1 1 H 14" /><path d="M10 12 H 20" /><path d="M17 9 L20 12 L17 15" /></Ico>;
const IconPlay = (p) => <Ico {...p}><path d="M6 4 L20 12 L6 20 Z" fill="currentColor" stroke="none" /></Ico>;
const IconBoard = (p) => <Ico {...p}><rect x="3" y="4" width="18" height="14" rx="1.5" /><path d="M3 9 H 21" /><path d="M9 4 V 9" /></Ico>;
const IconSearch = (p) => <Ico {...p}><circle cx="11" cy="11" r="6" /><path d="M16 16 L20 20" /></Ico>;
const IconMore = (p) => <Ico {...p}><circle cx="6" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="18" cy="12" r="1" fill="currentColor" /></Ico>;
const IconFront = (p) => <Ico {...p}><rect x="4" y="4" width="11" height="11" rx="1.5" /><rect x="9" y="9" width="11" height="11" rx="1.5" fill="white" /></Ico>;
const IconBack = (p) => <Ico {...p}><rect x="9" y="9" width="11" height="11" rx="1.5" /><rect x="4" y="4" width="11" height="11" rx="1.5" fill="white" /></Ico>;
const IconDuplicate = (p) => <Ico {...p}><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M5 16 H 4 a1 1 0 0 1 -1 -1 V 4 a1 1 0 0 1 1 -1 H 15 a1 1 0 0 1 1 1 V 5" /></Ico>;
const IconTrash = (p) => <Ico {...p}><path d="M4 7 H 20" /><path d="M9 7 V 4 H 15 V 7" /><path d="M6 7 L7 20 H 17 L 18 7" /></Ico>;
const IconPalette = (p) => <Ico {...p}><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none" /><circle cx="16.5" cy="11" r="1.2" fill="currentColor" stroke="none" /><path d="M12 3 a 9 9 0 1 0 0 18 c 1 0 1.5 -.7 1.5 -1.5 c 0 -1.2 -1.5 -1.5 -1.5 -3 c 0 -1 .8 -2 2 -2 H 17 a 4 4 0 0 0 4 -4 a 9 9 0 0 0 -9 -7.5 z" /></Ico>;
const IconType = (p) => <Ico {...p}><path d="M4 4 H 11 V 6" /><path d="M7.5 4 V 14" /><path d="M5.5 14 H 9.5" /><path d="M13 11 H 20 V 12.5" /><path d="M16.5 11 V 20" /><path d="M14.5 20 H 18.5" /></Ico>;

Object.assign(window, {
  IconCursor, IconPencil, IconText, IconShapes, IconEraser, IconLasso, IconHand,
  IconShare, IconLink, IconCheck, IconClose, IconChevronUp, IconChevronDown,
  IconPlus, IconMinus, IconKeyboard, IconRotate, IconWifi, IconLogout, IconPlay,
  IconBoard, IconSearch, IconMore, IconFront, IconBack, IconDuplicate, IconTrash,
  IconPalette, IconType,
});
