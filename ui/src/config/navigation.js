export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    keywords: 'results kpi chart irr dscr overview',
  },
  {
    id: 'assumptions',
    label: 'Assumptions',
    keywords: 'inputs capex ppa ferz financing',
  },
  {
    id: 'financial',
    label: 'Financial Model',
    keywords: 'cash flow table schedule pnl debt',
  },
  {
    id: 'sensitivity',
    label: 'Sensitivity',
    keywords: 'stress test tornado drivers',
  },
  {
    id: 'ppa',
    label: 'PPA Analysis',
    keywords: 'bankability dscr ppa strike volume',
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    keywords: 'save load sqlite library',
  },
  {
    id: 'compare',
    label: 'Compare',
    keywords: 'compare delta side by side diff',
  },
  {
    id: 'credits',
    label: 'Credits',
    keywords: 'team authors contributors tutors about',
  },
]

export const NAV_LABELS = Object.fromEntries(NAV_ITEMS.map(i => [i.id, i.label]))
