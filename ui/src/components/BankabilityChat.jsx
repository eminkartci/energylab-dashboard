import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { useChatSessions } from '../hooks/useChatSessions'
import { buildBankabilityContext, buildSystemPrompt, formatContextSummary } from '../utils/buildChatContext'
import {
  getStoredApiKey,
  getStoredModel,
  sendChatCompletion,
  setStoredApiKey,
  setStoredModel,
} from '../services/openaiChat'
import { readChatDraft, writeChatDraft } from '../utils/chatStorage'
import { downloadChatSessionTxt } from '../utils/chatExport'
import ChatMarkdown from './ChatMarkdown'

const SUGGESTIONS = [
  'How bankable is this project?',
  'Compare PPA vs Merchant',
]

export default function BankabilityChat({
  activeTab,
  assumptions,
  model,
  scenarios,
  activeScenarioName,
  assumptionsChanged,
  savedScenarios,
  sidebarOpen,
  open: openProp,
  onOpenChange,
}) {
  const {
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
  } = useChatSessions()

  const [openInternal, setOpenInternal] = useState(false)
  const open = openProp ?? openInternal
  const setOpen = onOpenChange ?? setOpenInternal
  const [input, setInput] = useState(() => readChatDraft())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [lastSentContextKey, setLastSentContextKey] = useState(null)
  const [apiKey, setApiKey] = useState(() => getStoredApiKey())
  const [modelName, setModelName] = useState(() => getStoredModel())
  const messagesRef = useRef(null)

  const context = useMemo(
    () => buildBankabilityContext({
      activeTab,
      assumptions,
      model,
      scenarios,
      activeScenarioName,
      assumptionsChanged,
      savedScenarios,
    }),
    [activeTab, assumptions, model, scenarios, activeScenarioName, assumptionsChanged, savedScenarios],
  )

  const contextSummary = useMemo(() => formatContextSummary(context), [context])
  const contextKey = useMemo(() => JSON.stringify(context), [context])
  const contextStale = lastSentContextKey != null && lastSentContextKey !== contextKey

  const contextBrief = useMemo(() => {
    const irr = contextSummary.kpis.find(k => k.label === 'Project IRR')?.value ?? '—'
    const dscr = contextSummary.kpis.find(k => k.label === 'Min DSCR')?.value ?? '—'
    const caseLabel = contextSummary.structure.startsWith('FER Z')
      ? 'FER Z'
      : contextSummary.structure.startsWith('PPA')
        ? 'PPA'
        : 'Merchant'
    return `${caseLabel} · IRR ${irr} · DSCR ${dscr}`
  }, [contextSummary])

  useEffect(() => {
    writeChatDraft(input)
  }, [input])

  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, open, busy])

  async function handleSend(text) {
    const question = (text ?? input).trim()
    if (!question || busy) return
    setOpen(true)
    setInput('')
    writeChatDraft('')
    setError('')
    setBusy(true)
    try {
      const freshContext = buildBankabilityContext({
        activeTab,
        assumptions,
        model,
        scenarios,
        activeScenarioName,
        assumptionsChanged,
        savedScenarios,
      })
      const freshPrompt = buildSystemPrompt(freshContext)
      setLastSentContextKey(JSON.stringify(freshContext))

      await appendMessage('user', question)
      const history = [...messages, { role: 'user', content: question }]
      const answer = await sendChatCompletion({
        apiKey,
        model: modelName,
        systemPrompt: freshPrompt,
        messages: history,
      })
      await appendMessage('assistant', answer)
      if (activeSession?.title === 'New chat' || activeSession?.title === 'Bankability review') {
        const shortTitle = question.slice(0, 42) + (question.length > 42 ? '…' : '')
        if (activeSessionId) await renameSession(activeSessionId, shortTitle)
      }
    } catch (err) {
      setError(err?.message || 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  function saveSettings() {
    setStoredApiKey(apiKey)
    setStoredModel(modelName)
    setShowSettings(false)
  }

  function handleDownloadChat() {
    if (!messages.length) return
    downloadChatSessionTxt(activeSession, messages)
  }

  const hasApiKey = !!apiKey.trim()

  return (
    <div
      className={clsx(
        // Keep bottom-nav clickable on mobile:
        // - lift chat launcher above the bottom bar
        // - ensure bottom bar (z-40) stays on top
        'fixed z-30 flex flex-col items-end gap-2',
        sidebarOpen ? 'right-[21rem] bottom-[92px] md:bottom-4' : 'right-4 bottom-[92px] md:bottom-4',
      )}
    >
      {open && (
        <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-[#0f2444] text-white flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Bankability Advisor</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowSessions(v => !v)}
                className="px-2 py-1 text-[10px] rounded bg-white/10 hover:bg-white/20"
                title="Switch chat"
              >
                Chats
              </button>
              <button
                type="button"
                onClick={() => startSession('New chat')}
                className="px-2 py-1 text-[10px] rounded bg-white/10 hover:bg-white/20"
                title="New chat"
              >
                + New
              </button>
              <button
                type="button"
                onClick={handleDownloadChat}
                disabled={!messages.length}
                className="px-2 py-1 text-[10px] rounded bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Download chat as .txt"
              >
                ↓ TXT
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(v => !v)}
                className="px-2 py-1 text-[10px] rounded bg-white/10 hover:bg-white/20"
              >
                ⚙
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-2 py-1 text-[10px] rounded bg-white/10 hover:bg-white/20"
              >
                ✕
              </button>
            </div>
          </div>

          {showSessions && (
            <div className="border-b border-slate-200 bg-slate-50 max-h-40 overflow-y-auto">
              {loading && <p className="text-xs text-slate-400 p-3">Loading chats…</p>}
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 border-b border-slate-100',
                    session.id === activeSessionId && 'bg-blue-50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => { selectSession(session.id); setShowSessions(false) }}
                    className="flex-1 text-left text-xs text-slate-700 truncate"
                  >
                    {session.id === activeSessionId && <span className="text-blue-600 font-bold mr-1">●</span>}
                    {session.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSession(session.id)}
                    className="text-[10px] text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Compact disclaimer + context */}
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 space-y-1.5">
            <p className="text-[10px] text-slate-500 leading-snug">
              AI responses may be inaccurate — not for investment or lending decisions.
            </p>
            <button
              type="button"
              onClick={() => setShowContext(v => !v)}
              className="w-full flex items-center justify-between gap-2 text-left rounded-md px-2 py-1.5 hover:bg-slate-100/80"
            >
              <span className="min-w-0 text-[10px] text-slate-600 truncate">
                <span className="font-medium text-slate-700">Context:</span>{' '}
                {contextBrief}
                {contextSummary.unsaved && (
                  <span className="text-amber-600"> · unsaved</span>
                )}
                {contextStale && (
                  <span className="text-amber-600"> · updated</span>
                )}
              </span>
              <span className="text-[10px] text-slate-400 flex-shrink-0">{showContext ? '▾' : '▸'}</span>
            </button>
            {showContext && (
              <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[10px] text-slate-600 space-y-1">
                <p><span className="text-slate-400">Case:</span> {contextSummary.structure}</p>
                <p>
                  <span className="text-slate-400">KPIs:</span>{' '}
                  {contextSummary.kpis
                    .filter(k => ['Project IRR', 'Min DSCR', 'Project NPV'].includes(k.label))
                    .map(k => `${k.label} ${k.value}`)
                    .join(' · ')}
                </p>
                {contextSummary.savedCount > 0 && (
                  <p className="text-slate-400">{contextSummary.savedCount} saved scenarios included</p>
                )}
              </div>
            )}
          </div>

          {showSettings && (
            <div className="border-b border-slate-200 p-3 space-y-2 bg-amber-50/60">
              <p className="text-[11px] text-slate-600">OpenAI API key is stored only in this browser (localStorage).</p>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
              />
              <input
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={saveSettings}
                className="w-full py-1.5 text-xs font-medium rounded bg-[#0f2444] text-white"
              >
                Save settings
              </button>
            </div>
          )}

          <div ref={messagesRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 min-h-0">
            {!hasApiKey && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Add your OpenAI API key in ⚙ settings to start.
              </div>
            )}
            {messages.length === 0 && hasApiKey && (
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="text-left text-[11px] px-2.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={clsx(
                  'rounded-xl px-3 py-2 text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white ml-8 whitespace-pre-wrap'
                    : 'bg-white border border-slate-200 text-slate-700 mr-4',
                )}
              >
                {msg.role === 'user' ? msg.content : <ChatMarkdown>{msg.content}</ChatMarkdown>}
              </div>
            ))}
            {busy && (
              <div className="text-xs text-slate-400 italic mr-4">Analyzing model…</div>
            )}
          </div>

          {error && (
            <div className="px-3 py-2 text-[11px] text-red-600 bg-red-50 border-t border-red-100">{error}</div>
          )}

          <form
            className="border-t border-slate-200 p-3 bg-white flex gap-2"
            onSubmit={e => { e.preventDefault(); handleSend() }}
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a bankability question…"
              disabled={busy || !hasApiKey}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={busy || !input.trim() || !hasApiKey}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        id="tour-ai-advisor"
        onClick={() => setOpen(v => !v)}
        className={clsx(
          'rounded-full shadow-xl px-4 py-3 text-sm font-semibold flex items-center gap-2',
          open ? 'bg-slate-700 text-white' : 'bg-[#0f2444] text-white hover:bg-[#16335f]',
        )}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        {open ? 'Hide advisor' : 'AI Advisor'}
        {!open && activeSession && (
          <span className="text-[10px] font-normal text-blue-200 max-w-[120px] truncate">
            · {activeSession.title}
          </span>
        )}
      </button>
    </div>
  )
}
