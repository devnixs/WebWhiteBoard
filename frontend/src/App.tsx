import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { apiBaseUrl, boardIdPattern } from './app/constants'
import { clearIdentity, createIdentity, getRoute, initializeBoardHistoryStore, loadIdentity, persistIdentity, rememberBoardForIdentity } from './app/utils'
import type { BoardHistoryStore, LocalIdentity, RouteState } from './app/types'
import { BoardScreen } from './components/board/BoardScreen'
import { HomeScreen } from './components/home/HomeScreen'
import { LoginScreen } from './components/home/LoginScreen'
import { NotFoundScreen } from './components/home/NotFoundScreen'

function App() {
  const [route, setRoute] = useState<RouteState>(() => getRoute(window.location.pathname))
  const [identity, setIdentity] = useState<LocalIdentity | null>(() => loadIdentity())
  const [boardHistoryStore, setBoardHistoryStore] = useState<BoardHistoryStore>(() =>
    initializeBoardHistoryStore(),
  )

  const knownBoards = useMemo(() => {
    if (!identity) {
      return []
    }

    return boardHistoryStore[identity.sessionId] ?? []
  }, [boardHistoryStore, identity])

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRoute(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const rememberBoard = (sessionId: string, boardId: string) => {
    setBoardHistoryStore((current) => rememberBoardForIdentity(current, sessionId, boardId))
  }

  const navigate = (pathname: string, sessionIdOverride?: string) => {
    const nextRoute = getRoute(pathname)

    if (nextRoute.kind === 'board') {
      const sessionId = sessionIdOverride ?? identity?.sessionId
      if (sessionId) {
        rememberBoard(sessionId, nextRoute.boardId)
      }
    }

    window.history.pushState({}, '', pathname)
    setRoute(nextRoute)
  }

  const handleLogin = (name: string, color: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    const nextIdentity = createIdentity(trimmedName, color)
    persistIdentity(nextIdentity)
    setIdentity(nextIdentity)

    if (route.kind === 'board') {
      rememberBoard(nextIdentity.sessionId, route.boardId)
    }
  }

  const handleLogout = () => {
    clearIdentity()
    setIdentity(null)
    navigate('/')
  }

  const handleCreateBoard = async () => {
    const response = await fetch(`${apiBaseUrl}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      throw new Error('Unable to create a new board.')
    }

    const created = (await response.json()) as { boardId: string }
    navigate(`/board/${created.boardId}`)
  }

  const handleJoinBoard = (boardId: string) => {
    const normalizedBoardId = boardId.trim().toLowerCase()
    if (!boardIdPattern.test(normalizedBoardId)) {
      throw new Error('Board ids must be valid GUIDs.')
    }

    navigate(`/board/${normalizedBoardId}`)
  }

  if (route.kind === 'not-found') {
    return <NotFoundScreen onNavigate={navigate} />
  }

  if (!identity) {
    return <LoginScreen route={route} onLogin={handleLogin} />
  }

  if (route.kind === 'home') {
    return (
      <HomeScreen
        identity={identity}
        knownBoards={knownBoards}
        onCreateBoard={handleCreateBoard}
        onJoinBoard={handleJoinBoard}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    )
  }

  return <BoardScreen boardId={route.boardId} identity={identity} onLogout={handleLogout} />
}

export default App
