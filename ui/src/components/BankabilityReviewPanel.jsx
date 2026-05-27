import ReactMarkdown from 'react-markdown'

const markdownComponents = {
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-[#0f2444] mt-5 mb-2 first:mt-0 border-b border-slate-100 pb-1">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="text-xs font-semibold text-slate-700 mt-3 mb-1">{children}</h3>,
  p: ({ children }) => <p className="text-xs leading-relaxed text-slate-600 mb-2">{children}</p>,
  ul: ({ children }) => <ul className="text-xs text-slate-600 space-y-1.5 mb-3 ml-4 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="text-xs text-slate-600 space-y-1.5 mb-3 ml-4 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-500">{children}</em>,
}

export default function BankabilityReviewPanel({
  open,
  loading,
  error,
  markdown,
  scenarioName,
  onClose,
  onRefresh,
}) {
  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden"
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside className="fixed right-0 top-0 h-full w-full sm:w-[420px] lg:w-[440px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100 bg-[#0f2444] text-white flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Banker Review</p>
            <p className="text-[11px] text-blue-200 truncate mt-0.5">
              {scenarioName || 'Current workspace'}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="px-2 py-1 text-[10px] rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 text-[10px] rounded bg-white/10 hover:bg-white/20"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
              <p className="text-xs text-slate-400 pt-2">Preparing AI banker perspective…</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700">
              {error}
              <p className="mt-2 text-red-600/80">Add your OpenAI API key in AI Advisor ⚙ settings.</p>
            </div>
          )}

          {markdown && !loading && (
            <article className="banker-review-markdown">
              <ReactMarkdown components={markdownComponents}>{markdown}</ReactMarkdown>
            </article>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 text-[10px] text-slate-400 bg-slate-50">
          AI-assisted preliminary review — not an investment or lending decision.
        </div>
      </aside>
    </>
  )
}
