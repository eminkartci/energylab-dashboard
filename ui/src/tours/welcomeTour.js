import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { flushSync } from 'react-dom'

function prep(deps, fn) {
  return () => {
    if (fn) flushSync(() => fn(deps))
  }
}

export function startWelcomeTour(deps) {
  const {
    setActiveTab,
    setSidebarOpen,
    setChatOpen,
  } = deps

  const driverObj = driver({
    showProgress: true,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayColor: 'rgba(15, 36, 68, 0.88)',
    stagePadding: 10,
    stageRadius: 10,
    popoverClass: 'energy-lab-tour-popover',
    progressText: '{{current}} / {{total}}',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Finish tour',
    steps: [
      {
        popover: {
          title: 'Welcome to Energy LAB',
          description:
            'This tour walks you through the PV + Wind + BESS hybrid financial model: ' +
            'which inputs you can change, what the charts show, what bankability metrics mean, ' +
            'and how to compare Merchant / PPA / FER Z scenarios.',
          side: 'over',
          align: 'center',
        },
      },
      {
        element: '#tour-sidebar',
        popover: {
          title: 'Left navigation',
          description:
            'The main menu is on the left: switch pages, star favorites, filter, and collapse the sidebar. ' +
            'The version number and FER Z disclaimer appear at the bottom.',
          side: 'right',
          align: 'start',
        },
        onDeselected: prep(deps, () => {
          setSidebarOpen(false)
          setChatOpen?.(false)
        }),
      },
      {
        element: '#tour-header',
        popover: {
          title: 'Workspace summary',
          description:
            'Active scenario name, edit status, and location (city and GME zone) appear here. ' +
            'The model runs entirely client-side in your browser.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-nav',
        popover: {
          title: 'Page navigation',
          description:
            'Each page shows a different view of the model. Pin frequently used pages with the star icon; ' +
            'filter pages with the search box.',
          side: 'right',
          align: 'start',
        },
        onHighlighted: prep(deps, () => setActiveTab('assumptions')),
      },
      {
        element: '#tour-main',
        popover: {
          title: 'Assumptions — model inputs',
          description:
            'Set capacity (MWp/MWh), CAPEX unit costs, PPA strike & volume, FER Z parameters, and ' +
            'financing (LTV, Kd, Ke, tenor). Every change recalculates instantly across all pages.',
          side: 'top',
          align: 'center',
        },
        onHighlighted: prep(deps, () => setActiveTab('assumptions')),
      },
      {
        element: '#tour-main',
        popover: {
          title: 'Dashboard — results overview',
          description:
            'Project IRR, Equity IRR, Min DSCR/LLCR, and NPV at a glance. Charts show 25-year Revenue/EBITDA, ' +
            'CAPEX breakdown, Free Cash Flow, and covenant metrics. KPI tiles indicate green/red covenant pass or breach.',
          side: 'top',
          align: 'center',
        },
        onHighlighted: prep(deps, () => setActiveTab('dashboard')),
      },
      {
        element: '#tour-main',
        popover: {
          title: 'Financial Model — cash flow detail',
          description:
            '25-year P&L and debt schedule: revenue, OPEX, EBITDA, interest, principal, CFADS, DSCR, LLCR, ' +
            'Project FCF, and Equity FCF. The Y1 waterfall walks through debt service and tax step by step.',
          side: 'top',
          align: 'center',
        },
        onHighlighted: prep(deps, () => setActiveTab('financial')),
      },
      {
        element: '#tour-main',
        popover: {
          title: 'Sensitivity — stress testing',
          description:
            'See how IRR, DSCR, and NPV shift when price, CAPEX, PPA strike/volume, or FER Z strike/baseload move ±20%. ' +
            'Tornado charts show which variables drive bankability most.',
          side: 'top',
          align: 'center',
        },
        onHighlighted: prep(deps, () => setActiveTab('sensitivity')),
      },
      {
        element: '#tour-main',
        popover: {
          title: 'PPA Analysis — bankability',
          description:
            'Explore PPA strike and contracted volume vs the DSCR time series, lender stress tests, and ' +
            'Merchant / PPA / FER Z structure comparison. Break-even strike is calculated against the 1.25× DSCR threshold.',
          side: 'top',
          align: 'center',
        },
        onHighlighted: prep(deps, () => setActiveTab('ppa')),
      },
      {
        element: '#tour-main',
        popover: {
          title: 'Scenarios — scenario library',
          description:
            'Save assumption sets by name to SQLite. Load different locations, PPA terms, or CAPEX cases ' +
            'and rerun the same model.',
          side: 'top',
          align: 'center',
        },
        onHighlighted: prep(deps, () => setActiveTab('scenarios')),
      },
      {
        element: '#tour-main',
        popover: {
          title: 'Compare — two scenarios side by side',
          description:
            'Pick two saved scenarios (or the live workspace): KPI delta table, overlaid Revenue/EBITDA/FCF/DSCR charts, ' +
            'and a list of differing assumptions.',
          side: 'top',
          align: 'center',
        },
        onHighlighted: prep(deps, () => setActiveTab('compare')),
      },
      {
        element: '#tour-save-scenario',
        popover: {
          title: 'Save scenario',
          description:
            'After changing inputs, name and save the scenario here. ' +
            'Saving with an existing name updates that scenario; a new name creates a new record.',
          side: 'bottom',
          align: 'end',
        },
        onHighlighted: prep(deps, () => {
          setActiveTab('assumptions')
          setSidebarOpen(false)
        }),
      },
      {
        element: '#tour-scenario-sidebar',
        popover: {
          title: 'Quick scenario panel',
          description:
            'Use the right-hand panel to switch between saved scenarios, delete, or save — ' +
            'without opening the Scenarios page.',
          side: 'left',
          align: 'start',
        },
        onHighlighted: prep(deps, () => {
          setActiveTab('dashboard')
          setSidebarOpen(true)
        }),
        onDeselected: prep(deps, () => setSidebarOpen(false)),
      },
      {
        element: '#tour-ai-advisor',
        popover: {
          title: 'AI Bankability Advisor',
          description:
            'Ask OpenAI to interpret current results: “How bankable is this?”, “What does DSCR mean?”, ' +
            '“PPA vs Merchant risks?”, or compare saved scenarios.',
          side: 'left',
          align: 'end',
        },
        onHighlighted: prep(deps, () => {
          setSidebarOpen(false)
          setChatOpen?.(true)
        }),
        onDeselected: prep(deps, () => setChatOpen?.(false)),
      },
      {
        popover: {
          title: 'Tour complete',
          description:
            'You\'re ready to explore the model. Tip: adjust Assumptions first, review results on the Dashboard, ' +
            'save a scenario, then use Compare or AI Advisor for bankability. ' +
            'Restart the tour anytime from the “Guided tour” button in the sidebar.',
          side: 'over',
          align: 'center',
        },
        onHighlighted: prep(deps, () => {
          setActiveTab('dashboard')
          setSidebarOpen(false)
          setChatOpen?.(false)
        }),
      },
    ],
  })

  driverObj.drive()
  return driverObj
}

export function hasCompletedWelcomeTour() {
  return localStorage.getItem('energy-lab-tour-done') === '1'
}

export function markWelcomeTourComplete() {
  localStorage.setItem('energy-lab-tour-done', '1')
}
