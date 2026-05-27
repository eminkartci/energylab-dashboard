import { useEffect, useMemo } from 'react'
import clsx from 'clsx'
import { NAV_ITEMS } from '../config/navigation'
import { NAV_ICONS } from './nav/NavIcons'

function IconMenu({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function IconClose({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function IconFolder({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  )
}

export default function MobileHeader({
  title,
  subtitle,
  menuOpen,
  onMenuOpenChange,
  activeTab,
  onTabChange,
  onOpenScenarios,
}) {
  const items = useMemo(() => NAV_ITEMS, [])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onMenuOpenChange(false)
    }
    if (!menuOpen) return
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen, onMenuOpenChange])

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onMenuOpenChange(!menuOpen)}
            className="p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 leading-snug truncate">{title}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onOpenScenarios}
            className="p-2 -mr-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Open scenarios"
          >
            <IconFolder />
          </button>
        </div>
      </header>

      {/* Menu bottom-sheet */}
      <div
        className={clsx(
          'fixed inset-0 z-50 md:hidden',
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!menuOpen}
      >
        <div
          className={clsx(
            'absolute inset-0 bg-slate-900/30 transition-opacity',
            menuOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => onMenuOpenChange(false)}
        />

        <div
          className={clsx(
            'absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl transition-transform duration-200',
            menuOpen ? 'translate-y-0' : 'translate-y-full',
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="px-4 pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto" />
            <div className="flex items-center justify-between mt-3 mb-2">
              <p className="text-xs font-semibold text-slate-700">Menu</p>
              <button
                type="button"
                onClick={() => onMenuOpenChange(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
          </div>

          <nav className="max-h-[70vh] overflow-y-auto px-2 pb-4">
            {items.map(item => {
              const Icon = NAV_ICONS[item.id]
              const active = item.id === activeTab
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                    active ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700',
                  )}
                >
                  {Icon && (
                    <span className={clsx('p-2 rounded-lg', active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')}>
                      <Icon className="w-5 h-5" />
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate">{item.label}</span>
                    <span className="block text-[11px] text-slate-500 truncate">{item.keywords}</span>
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}

