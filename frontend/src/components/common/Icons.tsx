import type { ReactNode } from 'react'

function IconBase({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  )
}

export function IconCursor({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M5 3 L5 19 L9.5 15.5 L12 21 L15 20 L12.5 14 L19 14 Z" /></IconBase>
}

export function IconHand({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M6 11 V6.5 a1.5 1.5 0 0 1 3 0 V11" /><path d="M9 11 V5 a1.5 1.5 0 0 1 3 0 V11" /><path d="M12 11 V5.5 a1.5 1.5 0 0 1 3 0 V11" /><path d="M15 11 V8 a1.5 1.5 0 0 1 3 0 V14 a6 6 0 0 1 -6 6 H10 a4 4 0 0 1 -4 -4 V11 a1.5 1.5 0 0 1 3 0" /></IconBase>
}

export function IconPencil({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M16 3 L21 8 L8 21 L3 21 L3 16 Z" /><path d="M14 5 L19 10" /></IconBase>
}

export function IconText({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M5 5 L19 5" /><path d="M12 5 L12 20" /></IconBase>
}

export function IconShapes({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="9" rx="1.5" width="9" x="3" y="3" /><circle cx="16.5" cy="16.5" r="4.5" /></IconBase>
}

export function IconEraser({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M16 4 L20 8 L10 18 L6 18 L4 16 Z" /><path d="M10 18 L15 13" /><path d="M9 21 L21 21" /></IconBase>
}

export function IconLasso({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M4 6 C4 3.5 9 2.5 12 2.5 C17 2.5 20 5 20 8 C20 11 17 13 12 13 C9 13 6.5 12 5.5 11" /><path d="M5.5 11 C5 13 6 16 7 17.5" /><circle cx="7.5" cy="19" r="2" /></IconBase>
}

export function IconShare({ size }: { size?: number }) {
  return <IconBase size={size}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8 11 L16 7" /><path d="M8 13 L16 17" /></IconBase>
}

export function IconCheck({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M5 12 L10 17 L19 7" /></IconBase>
}

export function IconWifi({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M3 9 a13 13 0 0 1 18 0" /><path d="M6 12.5 a8 8 0 0 1 12 0" /><path d="M9 16 a3.5 3.5 0 0 1 6 0" /><circle cx="12" cy="19" fill="currentColor" r=".8" stroke="none" /></IconBase>
}

export function IconLogout({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M14 4 H5 a1 1 0 0 0 -1 1 V19 a1 1 0 0 0 1 1 H14" /><path d="M10 12 H20" /><path d="M17 9 L20 12 L17 15" /></IconBase>
}

export function IconPlus({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M12 5 L12 19" /><path d="M5 12 L19 12" /></IconBase>
}

export function IconMinus({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M5 12 L19 12" /></IconBase>
}

export function IconChevronDown({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M6 10 L12 16 L18 10" /></IconBase>
}

export function IconChevronLeft({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M14 6 L8 12 L14 18" /></IconBase>
}

export function IconChevronRight({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M10 6 L16 12 L10 18" /></IconBase>
}

export function IconKeyboard({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="13" rx="2" width="19" x="2.5" y="6" /><path d="M6 10 H6.01" /><path d="M10 10 H10.01" /><path d="M14 10 H14.01" /><path d="M18 10 H18.01" /><path d="M7 14.5 H17" /></IconBase>
}

export function IconClose({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M6 6 L18 18" /><path d="M18 6 L6 18" /></IconBase>
}

export function IconBoard({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="14" rx="1.5" width="18" x="3" y="4" /><path d="M3 9 H21" /><path d="M9 4 V9" /></IconBase>
}

export function IconSearch({ size }: { size?: number }) {
  return <IconBase size={size}><circle cx="11" cy="11" r="6" /><path d="M16 16 L20 20" /></IconBase>
}

export function IconMore({ size }: { size?: number }) {
  return <IconBase size={size}><circle cx="6" cy="12" fill="currentColor" r="1" stroke="none" /><circle cx="12" cy="12" fill="currentColor" r="1" stroke="none" /><circle cx="18" cy="12" fill="currentColor" r="1" stroke="none" /></IconBase>
}

export function IconFront({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="11" rx="1.5" width="11" x="4" y="4" /><rect fill="white" height="11" rx="1.5" stroke="currentColor" width="11" x="9" y="9" /></IconBase>
}

export function IconBack({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="11" rx="1.5" width="11" x="9" y="9" /><rect fill="white" height="11" rx="1.5" stroke="currentColor" width="11" x="4" y="4" /></IconBase>
}

export function IconDuplicate({ size }: { size?: number }) {
  return <IconBase size={size}><rect height="12" rx="1.5" width="12" x="8" y="8" /><path d="M5 16 H4 a1 1 0 0 1 -1 -1 V4 a1 1 0 0 1 1 -1 H15 a1 1 0 0 1 1 1 V5" /></IconBase>
}

export function IconTrash({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M4 7 H20" /><path d="M9 7 V4 H15 V7" /><path d="M6 7 L7 20 H17 L18 7" /></IconBase>
}

export function IconPalette({ size }: { size?: number }) {
  return <IconBase size={size}><circle cx="7.5" cy="11" fill="currentColor" r="1.2" stroke="none" /><circle cx="12" cy="8" fill="currentColor" r="1.2" stroke="none" /><circle cx="16.5" cy="11" fill="currentColor" r="1.2" stroke="none" /><path d="M12 3 a9 9 0 1 0 0 18 c1 0 1.5 -.7 1.5 -1.5 c0 -1.2 -1.5 -1.5 -1.5 -3 c0 -1 .8 -2 2 -2 H17 a4 4 0 0 0 4 -4 A9 9 0 0 0 12 3 z" /></IconBase>
}

export function IconType({ size }: { size?: number }) {
  return <IconBase size={size}><path d="M4 4 H11 V6" /><path d="M7.5 4 V14" /><path d="M5.5 14 H9.5" /><path d="M13 11 H20 V12.5" /><path d="M16.5 11 V20" /><path d="M14.5 20 H18.5" /></IconBase>
}
