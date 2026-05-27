import { useState } from 'react'
import clsx from 'clsx'
import SaveScenarioDialog from '../components/SaveScenarioDialog'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export default function ScenariosPage({
  records,
  loading,
  activeId,
  activeName,
  changed,
  onLoad,
  onSave,
  onDelete,
  onRename,
  onDuplicate,
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('save')
  const [targetId, setTargetId] = useState(null)
  const [defaultName, setDefaultName] = useState('')

  function openSave() {
    setDialogMode('save')
    setTargetId(null)
    setDefaultName(activeName || '')
    setDialogOpen(true)
  }

  function openRename(record) {
    setDialogMode('rename')
    setTargetId(record.id)
    setDefaultName(record.name)
    setDialogOpen(true)
  }

  function openDuplicate(record) {
    setDialogMode('duplicate')
    setTargetId(record.id)
    setDefaultName(`${record.name} (copy)`)
    setDialogOpen(true)
  }

  async function handleDialogSave(name) {
    if (dialogMode === 'rename') return onRename(targetId, name)
    if (dialogMode === 'duplicate') return onDuplicate(targetId, name)
    return onSave(name)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Scenario Library</h2>
          <p className="text-sm text-slate-500 mt-1">
            Save assumption sets locally in SQLite. Load a scenario to continue editing or compare two scenarios.
          </p>
        </div>
        <button
          type="button"
          onClick={openSave}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#0f2444] text-white hover:bg-[#16335f]"
        >
          Save current scenario
        </button>
      </div>

      {activeName && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Active scenario: <strong>{activeName}</strong>
          {changed && <span className="text-amber-700"> · you have unsaved changes</span>}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-400">Loading scenarios…</p>
        ) : records.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No scenarios saved yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0f2444] text-white text-xs">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Location</th>
                  <th className="text-left px-4 py-3">Sizing</th>
                  <th className="text-left px-4 py-3">Updated</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr
                    key={record.id}
                    className={clsx(
                      'border-t border-slate-100',
                      record.id === activeId && 'bg-blue-50/50',
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {record.name}
                      {record.id === activeId && (
                        <span className="ml-2 text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.assumptions.city} · {record.assumptions.zone}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {record.assumptions.pvMWp} MWp PV · {record.assumptions.windMWp} MWp Wind · {record.assumptions.bessMWh} MWh BESS
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(record.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end flex-wrap gap-1">
                        <button type="button" onClick={() => onLoad(record)} className="px-2 py-1 text-xs rounded border border-slate-200 hover:bg-slate-50">Load</button>
                        <button type="button" onClick={() => openRename(record)} className="px-2 py-1 text-xs rounded border border-slate-200 hover:bg-slate-50">Rename</button>
                        <button type="button" onClick={() => openDuplicate(record)} className="px-2 py-1 text-xs rounded border border-slate-200 hover:bg-slate-50">Duplicate</button>
                        <button type="button" onClick={() => onDelete(record.id)} className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SaveScenarioDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleDialogSave}
        defaultName={defaultName}
        title={
          dialogMode === 'rename'
            ? 'Rename scenario'
            : dialogMode === 'duplicate'
              ? 'Duplicate scenario'
              : activeId
                ? 'Save scenario'
                : 'Save new scenario'
        }
      />
    </div>
  )
}
