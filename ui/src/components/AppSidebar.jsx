import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { NAV_ITEMS } from '../config/navigation'
import { NAV_ICONS, IconStar } from './nav/NavIcons'
import { useNavStars } from '../hooks/useNavStars'
import pkg from '../../package.json'

export function readNavCollapsed() {
  return localStorage.getItem('energy-lab-nav-collapsed') === '1'
}

export default function AppSidebar({
  activeTab,
  onTabChange,
  onStartTour,
  onSaveClick,
  onReset,
  activeScenarioName,
  changed,
  city,
  zone,
  zoneLabel,
  collapsed,
  onCollapsedChange,
}) {
  const [filter, setFilter] = useState('')
  const { toggleStar, isStarred } = useNavStars()

  function toggleCollapsed() {
    const next = !collapsed
    localStorage.setItem('energy-lab-nav-collapsed', next ? '1' : '0')
    onCollapsedChange(next)
  }

  const filteredItems = useMemo(() => {
    const q = filter.trim().toLowerCase()
    let items = NAV_ITEMS
    if (q) {
      items = items.filter(item =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.includes(q) ||
        item.id.includes(q),
      )
    }
    return [...items].sort((a, b) => {
      const aStar = isStarred(a.id) ? 0 : 1
      const bStar = isStarred(b.id) ? 0 : 1
      if (aStar !== bStar) return aStar - bStar
      return a.label.localeCompare(b.label)
    })
  }, [filter, isStarred])

  const starredItems = filteredItems.filter(item => isStarred(item.id))
  const otherItems = filteredItems.filter(item => !isStarred(item.id))

  function renderNavItem(item) {
    const Icon = NAV_ICONS[item.id]
    const active = activeTab === item.id
    return (
      <div key={item.id} className="group relative flex items-center gap-1">
        <button
          type="button"
          onClick={() => onTabChange(item.id)}
          title={collapsed ? item.label : undefined}
          className={clsx(
            'flex-1 flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors min-w-0',
            active
              ? 'bg-blue-600/20 text-white border border-blue-400/30'
              : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent',
            collapsed && 'justify-center px-2',
          )}
        >
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
          {!collapsed && <span className="truncate">{item.label}</span>}
        </button>
        {!collapsed && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); toggleStar(item.id) }}
            className={clsx(
              'p-1 rounded-md flex-shrink-0 transition-colors',
              isStarred(item.id)
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-400',
            )}
            title={isStarred(item.id) ? 'Remove star' : 'Star page'}
          >
            <IconStar filled={isStarred(item.id)} />
          </button>
        )}
      </div>
    )
  }

  return (
    <aside
      id="tour-sidebar"
      className={clsx(
        'fixed left-0 top-0 h-full bg-[#0f2444] text-white flex flex-col border-r border-white/10 z-30 transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      <div className={clsx('flex items-center gap-3 px-3 py-4 border-b border-white/10', collapsed && 'justify-center px-2')}>
        <img src="/polimi-logo.png" alt="Politecnico di Milano" className="h-8 w-auto brightness-0 invert flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate">Energy LAB</p>
            <p className="text-[10px] text-blue-300 truncate">PV · Wind · BESS · Italy</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div id="tour-header" className="px-3 py-2 border-b border-white/10 space-y-1.5">
          <p className="text-[10px] text-blue-200/80 uppercase tracking-wide">Workspace</p>
          <p className="text-xs text-white truncate">
            {activeScenarioName || 'Unsaved workspace'}
            {changed && <span className="text-amber-300"> · edited</span>}
          </p>
          <p className="text-[10px] text-blue-200 truncate">
            {city || '—'} · {zone}{zoneLabel ? ` (${zoneLabel})` : ''}
          </p>
          {changed && (
            <button
              type="button"
              onClick={onReset}
              className="text-[10px] text-slate-300 hover:text-white underline"
            >
              Reset to base case
            </button>
          )}
        </div>
      )}

      {!collapsed && (
        <div className="px-3 py-2 border-b border-white/10">
          <input
            type="search"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter pages…"
            className="w-full rounded-lg bg-white/10 border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      )}

      <nav id="tour-nav" className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin">
        {!collapsed && starredItems.length > 0 && filter.trim() === '' && (
          <p className="px-2 text-[10px] font-semibold text-amber-400/90 uppercase tracking-wide mb-1">Starred</p>
        )}
        {starredItems.map(renderNavItem)}

        {!collapsed && otherItems.length > 0 && starredItems.length > 0 && filter.trim() === '' && (
          <p className="px-2 pt-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">All pages</p>
        )}
        {otherItems.map(renderNavItem)}

        {filteredItems.length === 0 && !collapsed && (
          <p className="text-xs text-slate-500 px-2">No results</p>
        )}
      </nav>

      <div className={clsx('px-2 py-2 border-t border-white/10 space-y-1', collapsed && 'px-1')}>
        <button
          type="button"
          onClick={onStartTour}
          title="Guided tour"
          className={clsx(
            'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white',
            collapsed && 'justify-center px-2',
          )}
        >
          <span className="text-base leading-none">?</span>
          {!collapsed && 'Guided tour'}
        </button>
        <button
          type="button"
          id="tour-save-scenario"
          onClick={onSaveClick}
          title="Save scenario"
          className={clsx(
            'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium bg-emerald-600/90 hover:bg-emerald-500 text-white',
            collapsed && 'justify-center px-2',
          )}
        >
          <span className="text-sm">+</span>
          {!collapsed && 'Save scenario'}
        </button>
      </div>

      <div className={clsx('border-t border-white/10', collapsed ? 'px-1 py-2' : 'px-3 py-3')}>
        <button
          type="button"
          onClick={toggleCollapsed}
          className={clsx(
            'w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-white/10 hover:text-white mb-2',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹ Collapse'}
        </button>

        {!collapsed && (
          <p id="tour-ferz-disclaimer" className="text-[10px] text-amber-300/90 leading-snug mb-2">
            FER Z tariffs are not yet published — FER Z values shown are illustrative only. Not for investment decisions.
          </p>
        )}

        <p className={clsx('text-[10px] text-slate-500', collapsed && 'text-center')}>
          {collapsed ? `v${pkg.version}` : `Energy LAB v${pkg.version}`}
        </p>
      </div>
    </aside>
  )
}
