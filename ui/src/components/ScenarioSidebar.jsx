import clsx from 'clsx'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export default function ScenarioSidebar({
  open,
  onToggle,
  records,
  loading,
  activeId,
  activeName,
  changed,
  onLoad,
  onSaveClick,
  onDelete,
  onOpenScenariosPage,
}) {
  function PanelBody() {
    return (
      <>
        <div className="px-4 py-4 border-b border-slate-100 bg-[#0f2444] text-white">
          <h2 className="text-sm font-semibold">Saved Scenarios</h2>
          <p className="text-[11px] text-blue-200 mt-1">SQLite · stored in this browser</p>
        </div>

        <div className="p-3 border-b border-slate-100 space-y-2">
          <button
            type="button"
            onClick={onSaveClick}
            className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {activeId ? 'Update / save scenario' : 'Save current scenario'}
          </button>
          {activeName && (
            <div className="text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              Active: <span className="font-semibold text-slate-700">{activeName}</span>
              {changed && <span className="text-amber-600"> · unsaved edits</span>}
            </div>
          )}
          <button
            type="button"
            onClick={onOpenScenariosPage}
            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Open scenarios page
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && <p className="text-xs text-slate-400 px-1">Loading…</p>}
          {!loading && records.length === 0 && (
            <p className="text-xs text-slate-400 px-1">No saved scenarios yet. Change inputs and save one.</p>
          )}
          {records.map(record => (
            <div
              key={record.id}
              className={clsx(
                'rounded-lg border p-3',
                record.id === activeId ? 'border-blue-300 bg-blue-50/60' : 'border-slate-200 bg-white',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{record.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {record.assumptions.city} · {record.assumptions.zone}
                  </p>
                  <p className="text-[10px] text-slate-400">{fmtDate(record.updatedAt)}</p>
                </div>
                {record.id === activeId && (
                  <span className="text-[10px] font-medium text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Active</span>
                )}
              </div>
              <div className="flex gap-1 mt-2">
                <button
                  type="button"
                  onClick={() => onLoad(record)}
                  className="flex-1 px-2 py-1 text-[10px] font-medium rounded border border-slate-200 hover:bg-slate-50"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(record.id)}
                  className="px-2 py-1 text-[10px] font-medium rounded border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      {/* Desktop: right slide-over */}
      <div className="hidden md:block">
        <button
          type="button"
          id="tour-scenario-sidebar"
          onClick={onToggle}
          className={clsx(
            'fixed right-0 top-1/2 -translate-y-1/2 z-40 rounded-l-lg border border-r-0 border-slate-200 bg-white px-2 py-3 shadow-md text-xs font-medium text-slate-600 hover:bg-slate-50',
            open && 'translate-x-[-320px]',
          )}
          title={open ? 'Close scenarios panel' : 'Open scenarios panel'}
        >
          {open ? '›' : '‹'} Scenarios
        </button>

        <aside
          className={clsx(
            'fixed right-0 top-0 h-full w-80 bg-white border-l border-slate-200 shadow-2xl z-30 flex flex-col transition-transform duration-200',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <PanelBody />
        </aside>
      </div>

      {/* Mobile: bottom-sheet */}
      <div className="md:hidden">
        <div
          className={clsx(
            'fixed inset-0 z-50',
            open ? 'pointer-events-auto' : 'pointer-events-none',
          )}
          aria-hidden={!open}
        >
          <div
            className={clsx(
              'absolute inset-0 bg-slate-900/30 transition-opacity',
              open ? 'opacity-100' : 'opacity-0',
            )}
            onClick={onToggle}
          />

          <aside
            className={clsx(
              'absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl transition-transform duration-200 flex flex-col max-h-[82vh]',
              open ? 'translate-y-0' : 'translate-y-full',
            )}
          >
            <div className="px-4 pt-3 pb-2 border-b border-slate-100">
              <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto" />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs font-semibold text-slate-700">Scenarios</p>
                <button
                  type="button"
                  onClick={onToggle}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>

            <PanelBody />
          </aside>
        </div>
      </div>
    </>
  )
}
