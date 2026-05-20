import { normalizeBoardDocumentSnapshot } from './canvasRuntime'
import { apiBaseUrl, boardHistoryStorageKey, colorChoices, colorPalette, fontChoices, identityStorageKey, isMacPlatform, sizeChoices } from './constants'
import type { BoardDocumentSnapshot, BoardHistoryStore, ColorChoice, FontChoice, LocalIdentity, RealtimeCursor, RouteState, SizeChoice } from './types'

export function getRoute(pathname: string): RouteState {
  if (pathname === '/') {
    return { kind: 'home' }
  }

  const boardMatch = /^\/board\/([0-9a-fA-F-]+)$/.exec(pathname)
  if (boardMatch) {
    return { kind: 'board', boardId: boardMatch[1].toLowerCase() }
  }

  return { kind: 'not-found' }
}

export function createIdentity(
  name: string,
  color = colorPalette[Math.floor(Math.random() * colorPalette.length)],
): LocalIdentity {
  return {
    sessionId: name,
    name,
    color,
  }
}

export function indexRemoteCursors(cursors: RealtimeCursor[], ownActorId: string) {
  return cursors.reduce<Record<string, RealtimeCursor>>((accumulator, cursor) => {
    if (cursor.actorId !== ownActorId) {
      accumulator[cursor.actorId] = cursor
    }

    return accumulator
  }, {})
}

export function applyRemoteDocument(document: unknown): BoardDocumentSnapshot {
  return normalizeBoardDocumentSnapshot(document)
}

export function getBoardSocketUrl(boardId: string) {
  const url = getApiUrl(`/ws/boards/${boardId}`)
  return url.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
}

export function getApiUrl(pathname: string) {
  const url = apiBaseUrl ? new URL(apiBaseUrl, window.location.origin) : new URL(window.location.origin)
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`
  url.pathname = `${url.pathname.replace(/\/$/, '')}${normalizedPathname}`
  return url.toString()
}

export function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function getGridOpacity(
  size: number,
  minVisibleSize: number,
  fullyVisibleSize: number,
  maxOpacity: number,
) {
  const visibility = clamp((size - minVisibleSize) / (fullyVisibleSize - minVisibleSize), 0, 1)
  return visibility * maxOpacity
}

export function getWrappedGridOffset(offset: number, size: number) {
  const normalizedOffset = offset % size
  return normalizedOffset >= 0 ? normalizedOffset : size + normalizedOffset
}

export function loadIdentity(): LocalIdentity | null {
  try {
    const rawValue = window.localStorage.getItem(identityStorageKey)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as LocalIdentity
    if (!parsed.name || !parsed.sessionId || !parsed.color) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function persistIdentity(identity: LocalIdentity) {
  window.localStorage.setItem(identityStorageKey, JSON.stringify(identity))
}

export function clearIdentity() {
  window.localStorage.removeItem(identityStorageKey)
}

export function loadBoardHistoryStore(): BoardHistoryStore {
  try {
    const rawValue = window.localStorage.getItem(boardHistoryStorageKey)
    if (!rawValue) {
      return {}
    }

    return JSON.parse(rawValue) as BoardHistoryStore
  } catch {
    return {}
  }
}

export function initializeBoardHistoryStore() {
  const store = loadBoardHistoryStore()
  const identity = loadIdentity()
  const route = getRoute(window.location.pathname)

  if (!identity || route.kind !== 'board') {
    return store
  }

  return rememberBoardForIdentity(store, identity.sessionId, route.boardId)
}

export function rememberBoardForIdentity(
  currentStore: BoardHistoryStore,
  sessionId: string,
  boardId: string,
): BoardHistoryStore {
  const nextBoard = {
    boardId,
    lastVisitedAt: new Date().toISOString(),
  }

  const previousBoards = currentStore[sessionId] ?? []
  const nextBoards = [nextBoard, ...previousBoards.filter((board) => board.boardId !== boardId)]
  const trimmedBoards = nextBoards.slice(0, 20)
  const nextStore = {
    ...currentStore,
    [sessionId]: trimmedBoards,
  }

  window.localStorage.setItem(boardHistoryStorageKey, JSON.stringify(nextStore))
  return nextStore
}

export function shortBoardId(boardId: string) {
  return `Board ${boardId.slice(0, 8)}`
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function getBoardPreviewPalette(boardId: string) {
  const palette = ['#3b82f6', '#f59e0b', '#22c55e', '#e5e7eb']
  const seed = Array.from(boardId).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return Array.from({ length: 4 }, (_, index) => palette[(seed + index) % palette.length]).slice(0, 4)
}

export function modifierGlyph() {
  return isMacPlatform ? 'Cmd' : 'Ctrl'
}

export function toMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

export function formatRelative(isoString: string) {
  const deltaMs = Date.now() - new Date(isoString).getTime()
  const deltaMinutes = Math.max(1, Math.round(deltaMs / 60000))

  if (deltaMinutes < 60) {
    return `${deltaMinutes} min ago`
  }

  const deltaHours = Math.round(deltaMinutes / 60)
  if (deltaHours < 24) {
    return `${deltaHours} hr ago`
  }

  const deltaDays = Math.round(deltaHours / 24)
  return `${deltaDays} day${deltaDays === 1 ? '' : 's'} ago`
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export function getNextSizeChoice(size: SizeChoice): SizeChoice {
  const currentIndex = sizeChoices.indexOf(size)
  return sizeChoices[Math.min(sizeChoices.length - 1, currentIndex + 1)]
}

export function getNextColorChoice(color: ColorChoice): ColorChoice {
  const currentIndex = colorChoices.indexOf(color)
  return colorChoices[(currentIndex + 1) % colorChoices.length]
}

export function getNextFontChoice(font: FontChoice): FontChoice {
  const currentIndex = fontChoices.indexOf(font)
  return fontChoices[(currentIndex + 1) % fontChoices.length]
}

export async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall back to a temporary textarea when async clipboard access is denied.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.setAttribute('readonly', 'true')
  textArea.style.position = 'absolute'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}
