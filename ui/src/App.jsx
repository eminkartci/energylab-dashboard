import { useState, useMemo, useCallback } from 'react'
import clsx from 'clsx'
import { BASE_ASSUMPTIONS, ZONES } from './data'
import { buildModel } from './calc'
import { useScenarios } from './hooks/useScenarios'
import { startWelcomeTour } from './tours/welcomeTour'
import { NAV_LABELS } from './config/navigation'
import { PROJECT } from './data/credits'
import AppSidebar, { readNavCollapsed } from './components/AppSidebar'
import MobileHeader from './components/MobileHeader'
import MobileBottomNav from './components/MobileBottomNav'
import Dashboard      from './pages/Dashboard'
import Assumptions    from './pages/Assumptions'
import FinancialModel from './pages/FinancialModel'
import Sensitivity    from './pages/Sensitivity'
import PPAAnalysis    from './pages/PPAAnalysis'
import ScenariosPage  from './pages/Scenarios'
import ComparePage    from './pages/Compare'
import CreditsPage    from './pages/Credits'
import ScenarioSidebar from './components/ScenarioSidebar'
import SaveScenarioDialog from './components/SaveScenarioDialog'
import BankabilityChat from './components/BankabilityChat'
import { readChatOpen, writeChatOpen } from './utils/chatStorage'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [assumptions, setAssumptions] = useState(BASE_ASSUMPTIONS)
  const [changed, setChanged] = useState(false)
  const [navCollapsed, setNavCollapsed] = useState(readNavCollapsed)
  const [scenarioPanelOpen, setScenarioPanelOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [chatOpen, setChatOpenState] = useState(readChatOpen)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function setChatOpen(open) {
    setChatOpenState(open)
    writeChatOpen(open)
  }

  const {
    records,
    loading: scenariosLoading,
    activeId,
    activeName,
    save,
    remove,
    rename,
    duplicate,
    markActive,
    clearActive,
  } = useScenarios()

  const model = useMemo(() => buildModel(assumptions), [assumptions])

  const scenarios = useMemo(() => ({
    merchant: buildModel({ ...assumptions, ppaType: 0, ferZEnabled: false }),
    ppa:      buildModel({ ...assumptions, ppaType: 1, ferZEnabled: false }),
    ferz:     buildModel({ ...assumptions, ppaType: 0, ferZEnabled: true  }),
  }), [assumptions])

  const zoneLabel = assumptions.zone ? ZONES[assumptions.zone]?.label : null

  function update(key, value) {
    setAssumptions(prev => ({ ...prev, [key]: value }))
    setChanged(true)
  }

  function reset() {
    setAssumptions(BASE_ASSUMPTIONS)
    setChanged(false)
    clearActive()
  }

  function loadScenario(record) {
    setAssumptions({ ...record.assumptions })
    markActive(record)
    setChanged(false)
  }

  async function handleSaveScenario(name) {
    const shouldUpdate = activeId && name === activeName
    const saved = await save(name, assumptions, shouldUpdate ? activeId : null)
    if (!shouldUpdate) markActive(saved)
    setChanged(false)
  }

  async function handleDeleteScenario(id) {
    if (!confirm('Delete this scenario?')) return
    await remove(id)
  }

  const startTour = useCallback(() => {
    startWelcomeTour({
      setActiveTab,
      setSidebarOpen: setScenarioPanelOpen,
      setChatOpen,
    })
  }, [])

  const pageTitle = activeTab === 'dashboard'
    ? PROJECT.title
    : (NAV_LABELS[activeTab] || activeTab)

  const pageSubtitle = activeTab === 'dashboard'
    ? `${PROJECT.group} · ${assumptions.city || '—'} · GME ${assumptions.zone || '—'}`
    : activeTab === 'credits'
      ? 'Energy Management Lab · Group 5 · Politecnico di Milano'
      : `FER X & FER Z Scenarios · ${assumptions.city || '—'} · Zone ${assumptions.zone || '—'}`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden md:block">
        <AppSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onStartTour={startTour}
          onSaveClick={() => setSaveOpen(true)}
          onReset={reset}
          activeScenarioName={activeName}
          changed={changed}
          city={assumptions.city}
          zone={assumptions.zone}
          zoneLabel={zoneLabel}
          collapsed={navCollapsed}
          onCollapsedChange={setNavCollapsed}
        />
      </div>

      <div
        className={clsx(
          'min-h-screen flex flex-col transition-all duration-200',
          'ml-0',
          navCollapsed ? 'md:ml-[68px]' : 'md:ml-64',
          scenarioPanelOpen && 'md:mr-80',
        )}
      >
        <div className="md:hidden sticky top-0 z-40">
          <MobileHeader
            title={pageTitle}
            subtitle={pageSubtitle}
            menuOpen={mobileMenuOpen}
            onMenuOpenChange={setMobileMenuOpen}
            activeTab={activeTab}
            onTabChange={(id) => {
              setActiveTab(id)
              setMobileMenuOpen(false)
            }}
            onOpenScenarios={() => setScenarioPanelOpen(true)}
          />
        </div>

        <header className="hidden md:block bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
          <h1 className="text-base font-semibold text-slate-800 leading-snug">
            {pageTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {pageSubtitle}
          </p>
        </header>

        <main
          id="tour-main"
          className="flex-1 w-full max-w-screen-2xl mx-auto px-4 py-4 pb-[84px] md:px-6 md:py-6 md:pb-6"
        >
          {activeTab === 'dashboard' && (
            <Dashboard
              model={model}
              assumptions={assumptions}
              scenarios={scenarios}
              activeScenarioName={activeName}
              assumptionsChanged={changed}
              savedScenarios={records}
            />
          )}
          {activeTab === 'assumptions' && <Assumptions assumptions={assumptions} onUpdate={update} model={model} />}
          {activeTab === 'financial' && <FinancialModel model={model} assumptions={assumptions} />}
          {activeTab === 'sensitivity' && <Sensitivity assumptions={assumptions} scenarios={scenarios} />}
          {activeTab === 'ppa' && <PPAAnalysis assumptions={assumptions} scenarios={scenarios} onUpdate={update} />}
          {activeTab === 'scenarios' && (
            <ScenariosPage
              records={records}
              loading={scenariosLoading}
              activeId={activeId}
              activeName={activeName}
              changed={changed}
              onLoad={loadScenario}
              onSave={handleSaveScenario}
              onDelete={handleDeleteScenario}
              onRename={rename}
              onDuplicate={duplicate}
            />
          )}
          {activeTab === 'compare' && (
            <ComparePage records={records} liveAssumptions={assumptions} />
          )}
          {activeTab === 'credits' && <CreditsPage />}
        </main>

        <div className="md:hidden">
          <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <ScenarioSidebar
        open={scenarioPanelOpen}
        onToggle={() => setScenarioPanelOpen(v => !v)}
        records={records}
        loading={scenariosLoading}
        activeId={activeId}
        activeName={activeName}
        changed={changed}
        onLoad={loadScenario}
        onSaveClick={() => setSaveOpen(true)}
        onDelete={handleDeleteScenario}
        onOpenScenariosPage={() => {
          setActiveTab('scenarios')
          setScenarioPanelOpen(true)
        }}
      />

      <SaveScenarioDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={handleSaveScenario}
        defaultName={activeName || ''}
        title={activeId ? 'Save scenario' : 'Save new scenario'}
      />

      <BankabilityChat
        activeTab={activeTab}
        assumptions={assumptions}
        model={model}
        scenarios={scenarios}
        activeScenarioName={activeName}
        assumptionsChanged={changed}
        savedScenarios={records}
        sidebarOpen={scenarioPanelOpen}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  )
}
