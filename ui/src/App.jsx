import { useState, useMemo } from 'react'
import { BASE_ASSUMPTIONS, ZONES } from './data'
import { buildModel } from './calc'
import Dashboard      from './pages/Dashboard'
import Assumptions    from './pages/Assumptions'
import FinancialModel from './pages/FinancialModel'
import Sensitivity    from './pages/Sensitivity'
import PPAAnalysis    from './pages/PPAAnalysis'

const TABS = [
  { id: 'dashboard',   label: 'Dashboard',        icon: '▣' },
  { id: 'assumptions', label: 'Assumptions',       icon: '⚙' },
  { id: 'financial',   label: 'Financial Model',   icon: '◑' },
  { id: 'sensitivity', label: 'Sensitivity',       icon: '⊕' },
  { id: 'ppa',         label: 'PPA Analysis',      icon: '⊞' },
]

export default function App() {
  const [activeTab,   setActiveTab]   = useState('dashboard')
  const [assumptions, setAssumptions] = useState(BASE_ASSUMPTIONS)
  const [changed,     setChanged]     = useState(false)

  const model = useMemo(() => buildModel(assumptions), [assumptions])

  function update(key, value) {
    setAssumptions(prev => ({ ...prev, [key]: value }))
    setChanged(true)
  }

  function reset() {
    setAssumptions(BASE_ASSUMPTIONS)
    setChanged(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Top Bar ── */}
      <header className="bg-[#0f2444] text-white shadow-xl flex-shrink-0">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/polimi-logo.png" alt="Politecnico di Milano" className="h-8 w-auto brightness-0 invert" />
            <div className="w-px h-8 bg-white/20" />
            <div>
              <h1 className="text-base font-bold tracking-tight leading-tight">
                PV/Wind/BESS Financial Model
              </h1>
              <p className="text-xs text-blue-300 leading-tight">
                FER X &amp; FER Z Scenarios · Italy
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {changed && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-full">
                  ● Assumptions modified
                </span>
                <button
                  onClick={reset}
                  className="text-xs text-slate-300 hover:text-white underline"
                >
                  Reset to base case
                </button>
              </div>
            )}
            <div className="text-right text-xs text-blue-300 leading-snug">
              <div>
                Site: <span className="text-white font-medium">{assumptions.city || '—'}</span>
                {' · '}
                Zone: <span className="text-white font-medium">
                  {assumptions.zone ? `${assumptions.zone} — ${ZONES[assumptions.zone]?.label}` : '—'}
                </span>
              </div>
              <div className="text-amber-300">⚠ FER Z tariffs illustrative · Not for investment decisions</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <nav className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700 bg-blue-50/60'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <span className="mr-1.5 opacity-70">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main className="flex-1 max-w-screen-2xl w-full mx-auto px-6 py-6">
        {activeTab === 'dashboard'   && <Dashboard      model={model} assumptions={assumptions} />}
        {activeTab === 'assumptions' && <Assumptions    assumptions={assumptions} onUpdate={update} model={model} />}
        {activeTab === 'financial'   && <FinancialModel model={model} assumptions={assumptions} />}
        {activeTab === 'sensitivity' && <Sensitivity assumptions={assumptions} />}
        {activeTab === 'ppa'         && <PPAAnalysis assumptions={assumptions} onUpdate={update} />}
      </main>

      <footer className="bg-white border-t border-slate-100 text-center text-xs text-slate-400 py-2 flex-shrink-0">
        FER Z tariffs not yet published · Not for investment decisions
      </footer>
    </div>
  )
}
