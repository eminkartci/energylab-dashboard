const STORAGE_KEY = 'energy-lab-chat-v1'

function nowIso() {
  return new Date().toISOString()
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function emptyState() {
  return {
    activeSessionId: null,
    sessions: [],
    messagesBySession: {},
  }
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    return {
      activeSessionId: parsed.activeSessionId ?? null,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      messagesBySession: parsed.messagesBySession && typeof parsed.messagesBySession === 'object'
        ? parsed.messagesBySession
        : {},
    }
  } catch {
    return emptyState()
  }
}

function saveRaw(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function loadChatState() {
  const state = loadRaw()
  if (state.sessions.length === 0) {
    const session = createDefaultSession(state)
    saveRaw(state)
    return { ...state, activeSessionId: session.id }
  }
  if (!state.activeSessionId || !state.sessions.some(s => s.id === state.activeSessionId)) {
    state.activeSessionId = state.sessions[0].id
    saveRaw(state)
  }
  return state
}

function createDefaultSession(state) {
  const ts = nowIso()
  const session = {
    id: newId(),
    title: 'Bankability review',
    createdAt: ts,
    updatedAt: ts,
  }
  state.sessions.unshift(session)
  state.messagesBySession[session.id] = []
  state.activeSessionId = session.id
  return session
}

export function getChatSessions() {
  return loadChatState().sessions
}

export function getActiveSessionId() {
  return loadChatState().activeSessionId
}

export function setActiveSessionId(sessionId) {
  const state = loadChatState()
  state.activeSessionId = sessionId
  saveRaw(state)
}

export function getChatMessages(sessionId) {
  if (!sessionId) return []
  const state = loadChatState()
  return state.messagesBySession[sessionId] ?? []
}

export function createChatSession(title = 'New chat') {
  const state = loadChatState()
  const ts = nowIso()
  const session = {
    id: newId(),
    title,
    createdAt: ts,
    updatedAt: ts,
  }
  state.sessions.unshift(session)
  state.messagesBySession[session.id] = []
  state.activeSessionId = session.id
  saveRaw(state)
  return session
}

export function renameChatSession(sessionId, title) {
  const trimmed = title.trim()
  if (!trimmed) throw new Error('Chat title is required')
  const state = loadChatState()
  const session = state.sessions.find(s => s.id === sessionId)
  if (!session) throw new Error('Chat session not found')
  session.title = trimmed
  session.updatedAt = nowIso()
  saveRaw(state)
  return session
}

export function deleteChatSession(sessionId) {
  const state = loadChatState()
  state.sessions = state.sessions.filter(s => s.id !== sessionId)
  delete state.messagesBySession[sessionId]
  if (state.activeSessionId === sessionId) {
    state.activeSessionId = state.sessions[0]?.id ?? null
    if (!state.sessions.length) createDefaultSession(state)
  }
  saveRaw(state)
  return state
}

export function appendChatMessage(sessionId, role, content) {
  const state = loadChatState()
  const session = state.sessions.find(s => s.id === sessionId)
  if (!session) throw new Error('Chat session not found')

  const msg = {
    id: newId(),
    sessionId,
    role,
    content,
    createdAt: nowIso(),
  }

  if (!state.messagesBySession[sessionId]) {
    state.messagesBySession[sessionId] = []
  }
  state.messagesBySession[sessionId].push(msg)
  session.updatedAt = nowIso()
  saveRaw(state)
  return msg
}

export const CHAT_DRAFT_KEY = 'energy-lab-chat-draft'
export const CHAT_OPEN_KEY = 'energy-lab-chat-open'

export function readChatDraft() {
  return localStorage.getItem(CHAT_DRAFT_KEY) || ''
}

export function writeChatDraft(text) {
  localStorage.setItem(CHAT_DRAFT_KEY, text)
}

export function readChatOpen() {
  return localStorage.getItem(CHAT_OPEN_KEY) === '1'
}

export function writeChatOpen(open) {
  localStorage.setItem(CHAT_OPEN_KEY, open ? '1' : '0')
}
