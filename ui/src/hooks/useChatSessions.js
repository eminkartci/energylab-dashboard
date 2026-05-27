import { useCallback, useEffect, useState } from 'react'
import {
  appendChatMessage,
  createChatSession,
  deleteChatSession,
  getActiveSessionId,
  getChatMessages,
  getChatSessions,
  loadChatState,
  renameChatSession,
  setActiveSessionId,
} from '../utils/chatStorage'

export function useChatSessions() {
  const [sessions, setSessions] = useState(() => getChatSessions())
  const [activeSessionId, setActiveSessionIdState] = useState(() => getActiveSessionId())
  const [messages, setMessages] = useState(() => getChatMessages(getActiveSessionId()))
  const [loading, setLoading] = useState(false)

  const syncFromStorage = useCallback(() => {
    const state = loadChatState()
    setSessions(state.sessions)
    setActiveSessionIdState(state.activeSessionId)
    setMessages(state.messagesBySession[state.activeSessionId] ?? [])
  }, [])

  useEffect(() => {
    syncFromStorage()
  }, [syncFromStorage])

  const selectSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId)
    setActiveSessionIdState(sessionId)
    setMessages(getChatMessages(sessionId))
  }, [])

  const startSession = useCallback((title = 'New chat') => {
    const session = createChatSession(title)
    setSessions(getChatSessions())
    setActiveSessionIdState(session.id)
    setMessages([])
    return session
  }, [])

  const appendMessage = useCallback((role, content) => {
    const sessionId = getActiveSessionId()
    if (!sessionId) throw new Error('No active chat session')
    const msg = appendChatMessage(sessionId, role, content)
    setMessages(prev => [...prev, msg])
    setSessions(getChatSessions())
    return msg
  }, [])

  const removeSession = useCallback((sessionId) => {
    deleteChatSession(sessionId)
    const state = loadChatState()
    setSessions(state.sessions)
    setActiveSessionIdState(state.activeSessionId)
    setMessages(state.messagesBySession[state.activeSessionId] ?? [])
  }, [])

  const renameSession = useCallback((sessionId, title) => {
    renameChatSession(sessionId, title)
    setSessions(getChatSessions())
  }, [])

  const activeSession = sessions.find(s => s.id === activeSessionId) || null

  return {
    sessions,
    activeSession,
    activeSessionId,
    messages,
    loading,
    selectSession,
    startSession,
    appendMessage,
    removeSession,
    renameSession,
    refreshSessions: syncFromStorage,
  }
}
