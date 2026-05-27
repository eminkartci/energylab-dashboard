import ReactMarkdown from 'react-markdown'

const components = {
  h1: ({ children }) => (
    <h1 className="text-sm font-bold text-slate-800 mt-2 mb-1 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xs font-bold text-[#0f2444] mt-3 mb-1.5 first:mt-0 border-b border-slate-100 pb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold text-slate-700 mt-2 mb-1">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-xs leading-relaxed text-slate-700 mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="text-xs text-slate-700 space-y-1 mb-2 ml-4 list-disc">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="text-xs text-slate-700 space-y-1 mb-2 ml-4 list-decimal">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const inline = !className
    if (inline) {
      return (
        <code className="px-1 py-0.5 rounded bg-slate-100 text-[11px] font-mono text-slate-800">
          {children}
        </code>
      )
    }
    return (
      <code className="block p-2 rounded bg-slate-100 text-[11px] font-mono text-slate-800 overflow-x-auto my-2">
        {children}
      </code>
    )
  },
  pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-slate-200 pl-2 my-2 text-slate-600 italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-2 border-slate-100" />,
}

export default function ChatMarkdown({ children }) {
  return (
    <div className="chat-markdown">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  )
}
