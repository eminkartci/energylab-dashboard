import { useEffect, useState } from 'react'

export default function SaveScenarioDialog({ open, onClose, onSave, defaultName = '', title = 'Save scenario' }) {
  const [name, setName] = useState(defaultName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(defaultName)
      setError('')
    }
  }, [open, defaultName])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Scenario name is required')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave(name.trim())
      onClose()
    } catch (err) {
      setError(err?.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-label="Close" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-5"
      >
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">Current assumptions will be stored in SQLite (browser).</p>
        <label className="block mt-4 text-xs font-medium text-slate-600">Scenario name</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Palermo PPA 70%"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#0f2444] text-white hover:bg-[#16335f] disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
