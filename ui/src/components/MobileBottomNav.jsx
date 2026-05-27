import clsx from 'clsx'
import { NAV_ICONS } from './nav/NavIcons'

const TABS = [
  { id: 'dashboard',  label: 'Home' },
  { id: 'assumptions', label: 'Inputs' },
  { id: 'financial',  label: 'Model' },
  { id: 'sensitivity', label: 'Sensitivity' },
  { id: 'scenarios',  label: 'Scenarios' },
]

export default function MobileBottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 safe-bottom">
      <div className="max-w-screen-2xl mx-auto px-2">
        <div className="grid grid-cols-5 gap-1 py-2">
          {TABS.map(t => {
            const Icon = NAV_ICONS[t.id]
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 transition-colors',
                  active ? 'text-blue-700 bg-blue-50' : 'text-slate-500 hover:bg-slate-50',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {Icon && <Icon className={clsx('w-5 h-5', active ? 'text-blue-700' : 'text-slate-500')} />}
                <span className={clsx('text-[10px] font-semibold leading-none', active ? 'text-blue-700' : 'text-slate-500')}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

