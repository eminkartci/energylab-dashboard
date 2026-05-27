import { useRef, useState } from 'react'
import { exportChartPng, exportChartSvg } from '../utils/chartExport'

export default function ChartPanel({
  title,
  subtitle,
  filename,
  className = 'bg-white rounded-xl border border-slate-100 p-5',
  children,
}) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(null)
  const base = filename || title || 'chart'

  async function run(kind, fn) {
    if (!ref.current || busy) return
    setBusy(kind)
    try {
      await fn(ref.current, base)
    } catch (err) {
      alert(err?.message || 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div ref={ref} className={className}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          {title && <p className="text-xs font-medium text-slate-400">{title}</p>}
          {subtitle && <p className="text-[11px] text-slate-300 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run('png', exportChartPng)}
            className="px-2 py-1 text-[10px] font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            title="Download chart as PNG"
          >
            {busy === 'png' ? '…' : 'PNG'}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run('svg', exportChartSvg)}
            className="px-2 py-1 text-[10px] font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            title="Download chart as SVG"
          >
            {busy === 'svg' ? '…' : 'SVG'}
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}
