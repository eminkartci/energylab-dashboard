import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell,
} from 'recharts'
import { useCallback, useState } from 'react'
import ChartPanel from '../components/ChartPanel'
import ExportButton from '../components/ExportButton'
import BankabilityReviewPanel from '../components/BankabilityReviewPanel'
import ProjectSiteMap from '../components/ProjectSiteMap'
import { exportDashboardWorkbook } from '../utils/excelExport'
import { requestBankerReview } from '../services/bankabilityReview'
import { getStoredApiKey } from '../services/openaiChat'
import { PROJECT } from '../data/credits'

function fmt(n, dec = 1) {
  return n == null ? '—' : Number(n).toFixed(dec)
}

// ─── Shared tooltip ───────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-2">Year {label}</p>
      {payload.map(p => {
        const isCov = p.name === 'DSCR' || p.name === 'LLCR'
        return (
          <div key={p.name} className="flex items-center gap-3 mb-0.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-slate-400 w-20">{p.name}</span>
            <span className="font-semibold text-slate-700">
              {isCov ? `${fmt(p.value, 2)}×` : `€${fmt(p.value, 1)}M`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Primary KPI tile (large, left-border accent) ────────────────────────────
function Tile({ label, value, accent, sub, ok }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 px-5 py-4"
         style={{ borderLeft: `3px solid ${accent}` }}>
      <p className="text-[11px] text-slate-400 mb-2">{label}</p>
      <p className="text-[28px] font-bold text-slate-800 leading-none tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-2">{sub}</p>}
      {ok !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className={`text-[11px] font-medium ${ok ? 'text-emerald-600' : 'text-red-500'}`}>
            {ok ? 'Passes covenant' : 'Covenant breach'}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Inline stat (for the secondary strip) ────────────────────────────────────
function Stat({ label, value, sub }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({
  model,
  assumptions,
  scenarios,
  activeScenarioName,
  assumptionsChanged,
  savedScenarios = [],
}) {
  const r = model.rows
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewMarkdown, setReviewMarkdown] = useState('')

  const runBankerReview = useCallback(async () => {
    if (!getStoredApiKey()) {
      setReviewError('OpenAI API key missing. Add it in AI Advisor ⚙ settings.')
      setReviewOpen(true)
      return
    }
    setReviewOpen(true)
    setReviewLoading(true)
    setReviewError('')
    try {
      const markdown = await requestBankerReview({
        assumptions,
        model,
        scenarios,
        activeScenarioName,
        assumptionsChanged,
        savedScenarios,
      })
      setReviewMarkdown(markdown)
    } catch (err) {
      setReviewError(err?.message || 'Review failed')
      setReviewMarkdown('')
    } finally {
      setReviewLoading(false)
    }
  }, [assumptions, model, scenarios, activeScenarioName, assumptionsChanged, savedScenarios])

  const chartData = r.map(row => ({
    y: row.y,
    Revenue:     +row.revenue.toFixed(2),
    EBITDA:      +row.ebitda.toFixed(2),
    'Proj. FCF': +row.projectFCF.toFixed(2),
    'Eq. FCF':   +row.equityFCF.toFixed(2),
    DSCR: row.dscr != null ? +row.dscr.toFixed(3) : null,
    LLCR: model.llcrValues[row.y - 1] != null ? +model.llcrValues[row.y - 1].toFixed(3) : null,
  }))

  const capexSlices = [
    { name: 'PV',          value: +model.pvHard.toFixed(1),      color: '#f59e0b' },
    { name: 'Wind',        value: +model.windHard.toFixed(1),     color: '#3b82f6' },
    { name: 'BESS',        value: +model.bessHard.toFixed(1),     color: '#10b981' },
    { name: 'Grid / BOP',  value: +model.gridBOP.toFixed(1),      color: '#8b5cf6' },
    { name: 'Dev. Costs',  value: +model.devCosts.toFixed(1),     color: '#ec4899' },
    { name: 'Contingency', value: +model.contingency.toFixed(1),  color: '#94a3b8' },
  ]

  const ebitdaMargin = r[0] ? (r[0].ebitda / r[0].revenue) * 100 : 0

  return (
    <div className={`space-y-4 transition-all ${reviewOpen ? 'lg:mr-[28rem]' : ''}`}>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={runBankerReview}
          disabled={reviewLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#0f2444] bg-[#0f2444] text-white hover:bg-[#16335f] disabled:opacity-60"
        >
          {reviewLoading ? 'Analyzing…' : 'Banker review'}
        </button>
        <ExportButton
          label="Download page Excel"
          onExport={() => exportDashboardWorkbook({ model, assumptions, chartData, capexSlices })}
        />
      </div>

      {/* ── Overview + site map ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <div className="bg-white rounded-xl border border-slate-100 px-5 py-5 flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1b4332]">
            {PROJECT.group}
          </p>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            {PROJECT.summary}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] text-slate-600">
              {assumptions.city || '—'} · GME {assumptions.zone || '—'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] text-slate-600">
              {assumptions.pvMWp} MWp PV · {assumptions.windMWp} MWp Wind · {assumptions.bessMWh} MWh BESS
            </span>
          </div>
        </div>

        <ProjectSiteMap
          city={assumptions.city}
          zone={assumptions.zone}
          pvMWp={assumptions.pvMWp}
          windMWp={assumptions.windMWp}
          bessMWh={assumptions.bessMWh}
          mapHeight={280}
          zoomBoost={2}
        />
      </div>

      {/* ── Primary KPIs ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile
          label="Project IRR (unlevered)"
          value={`${fmt(model.projectIRR, 1)}%`}
          accent="#3b82f6"
          sub="25-year horizon"
          ok={model.projectIRR >= 5}
        />
        <Tile
          label="Equity IRR (levered)"
          value={`${fmt(model.equityIRR, 1)}%`}
          accent="#10b981"
          sub={`Hurdle rate ${assumptions.ke}%`}
          ok={model.equityIRR >= assumptions.ke}
        />
        <Tile
          label="Min DSCR"
          value={`${fmt(model.minDSCR, 2)}×`}
          accent={model.minDSCR >= 1.10 ? '#10b981' : '#ef4444'}
          sub="Covenant floor 1.10×"
          ok={model.minDSCR >= 1.10}
        />
        <Tile
          label="Min LLCR"
          value={`${fmt(model.minLLCR, 2)}×`}
          accent={model.minLLCR >= 1.20 ? '#10b981' : '#ef4444'}
          sub="Covenant floor 1.20×"
          ok={model.minLLCR >= 1.20}
        />
      </div>

      {/* ── Secondary stats strip ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-slate-100">
          <Stat
            label="Total CAPEX"
            value={`€${fmt(model.totalCapex, 1)}M`}
            sub={`${assumptions.pvMWp} MWp · ${assumptions.windMWp} MWp · ${assumptions.bessMWh} MWh`}
          />
          <Stat
            label="Y1 Revenue"
            value={`€${fmt(r[0]?.revenue, 1)}M`}
            sub="First full year"
          />
          <Stat
            label="Y1 EBITDA"
            value={`€${fmt(r[0]?.ebitda, 1)}M`}
            sub={`${fmt(ebitdaMargin, 1)}% margin`}
          />
          <Stat
            label="Project NPV"
            value={`€${fmt(model.projectNPV, 0)}M`}
            sub={`@ ${model.wacc?.toFixed(2)}% WACC`}
          />
          <Stat
            label="Equity NPV"
            value={`€${fmt(model.equityNPV, 0)}M`}
            sub={`@ ${assumptions.ke}% Ke`}
          />
          <Stat
            label="Senior Debt"
            value={`€${fmt(model.seniorDebt, 1)}M`}
            sub={`${fmt(assumptions.ltv, 0)}% LTV · ${assumptions.debtTenor}yr tenor`}
          />
        </div>
      </div>

      {/* ── Charts row 1 ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue & EBITDA */}
        <ChartPanel
          className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5"
          title="Revenue & EBITDA"
          subtitle="25-year forecast · €M"
          filename="dashboard-revenue-ebitda"
        >
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEbi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="y" tick={{ fontSize: 11, fill: '#94a3b8' }}
                     tickFormatter={v => `Y${v}`} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }}
                     tickFormatter={v => `${v}`} width={28} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
              <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" fill="url(#gRev)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="EBITDA"  stroke="#10b981" fill="url(#gEbi)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* CAPEX donut */}
        <ChartPanel
          title="CAPEX Breakdown"
          subtitle={`Total €${fmt(model.totalCapex, 1)}M`}
          filename="dashboard-capex-breakdown"
        >
          <p className="text-xl font-bold text-slate-800 mb-3">€{fmt(model.totalCapex, 1)}M</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={capexSlices} cx="50%" cy="50%"
                   innerRadius={46} outerRadius={68}
                   dataKey="value" paddingAngle={2} startAngle={90} endAngle={-270}>
                {capexSlices.map(e => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`€${v}M`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {capexSlices.map(e => (
              <div key={e.name} className="flex items-center gap-2 text-[11px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                <span className="text-slate-500 flex-1">{e.name}</span>
                <span className="font-medium text-slate-700">€{e.value}M</span>
                <span className="text-slate-300 w-9 text-right">
                  {fmt(e.value / model.totalCapex * 100, 0)}%
                </span>
              </div>
            ))}
          </div>
        </ChartPanel>
      </div>

      {/* ── Charts row 2 ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* FCF bars */}
        <ChartPanel
          title="Free Cash Flow"
          subtitle="25-year · €M · Project vs Equity"
          filename="dashboard-free-cash-flow"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="8%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="y" tick={{ fontSize: 11, fill: '#94a3b8' }}
                     tickFormatter={v => `Y${v}`} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }}
                     tickFormatter={v => `${v}`} width={28} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <ReferenceLine y={0} stroke="#e2e8f0" />
              <Bar dataKey="Proj. FCF" fill="#6366f1" radius={[2,2,0,0]} maxBarSize={28} />
              <Bar dataKey="Eq. FCF"   fill="#f59e0b" radius={[2,2,0,0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* DSCR / LLCR */}
        <ChartPanel
          title="DSCR & LLCR"
          subtitle="Debt tenor · Covenant floors shown"
          filename="dashboard-dscr-llcr"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData.filter(d => d.DSCR !== null)}
                       margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="y" tick={{ fontSize: 11, fill: '#94a3b8' }}
                     tickFormatter={v => `Y${v}`} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }}
                     domain={[0.8, 'auto']} tickFormatter={v => `${v}×`}
                     width={36} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <ReferenceLine y={1.10} stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={1.20} stroke="#f97316" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="DSCR" stroke="#3b82f6" strokeWidth={2}
                    dot={{ r: 2.5, fill: '#3b82f6', strokeWidth: 0 }} />
              <Line type="monotone" dataKey="LLCR" stroke="#8b5cf6" strokeWidth={2}
                    dot={{ r: 2.5, fill: '#8b5cf6', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <BankabilityReviewPanel
        open={reviewOpen}
        loading={reviewLoading}
        error={reviewError}
        markdown={reviewMarkdown}
        scenarioName={activeScenarioName}
        onClose={() => setReviewOpen(false)}
        onRefresh={runBankerReview}
      />
    </div>
  )
}
