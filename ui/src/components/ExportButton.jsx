import { useState } from 'react'

export default function ExportButton({ label = 'Download Excel', onExport, className = '' }) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    if (busy) return
    setBusy(true)
    try {
      await onExport()
    } catch (err) {
      alert(err?.message || 'Excel export failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 ${className}`}
    >
      <span aria-hidden="true">⬇</span>
      {busy ? 'Preparing…' : label}
    </button>
  )
}
