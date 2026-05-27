import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { buildModel } from '../calc'
import ChartPanel from '../components/ChartPanel'
import ExportButton from '../components/ExportButton'
import { exportSensitivityWorkbook } from '../utils/excelExport'

// ─── Sweep infrastructure ─────────────────────────────────────────────────────
// Steps for ±20% symmetric sweeps
const STEPS7 = [
  { label: '−20%', factor: 0.80 },
  { label: '−10%', factor: 0.90 },
  { label: '−5%',  factor: 0.95 },
  { label: 'Base', factor: 1.00 },
  { label: '+5%',  factor: 1.05 },
  { label: '+10%', factor: 1.10 },
  { label: '+20%', factor: 1.20 },
]
const STEPS5 = [
  { label: '−20%', factor: 0.80 },
  { label: '−10%', factor: 0.90 },
  { label: 'Base', factor: 1.00 },
  { label: '+10%', factor: 1.10 },
  { label: '+20%', factor: 1.20 },
]
const BASE7 = 3
const COD_BASE_IDX = 2

// Run buildModel for each step and return a sensitivity data object
function sweep(baseA, paramFn, steps) {
  const rows = steps.map(s => {
    const m = buildModel({ ...baseA, ...paramFn(s.factor, baseA) })
    return { label: s.label, m }
  })
  return {
    labels:     rows.map(r => r.label),
    projectIRR: rows.map(r => r.m.projectIRR),
    equityIRR:  rows.map(r => r.m.equityIRR),
    minDSCR:    rows.map(r => r.m.minDSCR),
    minLLCR:    rows.map(r => r.m.minLLCR),
    projectNPV: rows.map(r => r.m.projectNPV),
    equityNPV:  rows.map(r => r.m.equityNPV),
  }
}

// Parameter override functions (factor × base value)
const capexFn  = (f, a) => ({ pvSpecificCapex: a.pvSpecificCapex * f, windSpecificCapex: a.windSpecificCapex * f, bessSpecificCapex: a.bessSpecificCapex * f })
const priceFn  = (f)    => ({ merchantPriceAdj: f })
const codFn    = (f, a) => ({ kd: a.kd * f })

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v, d = 2) { return v == null ? '—' : Number(v).toFixed(d) }

function cellColor(metric, value, isBase) {
  if (isBase) return 'bg-blue-100 text-blue-800 font-bold ring-1 ring-blue-400'
  if (metric === 'projectIRR' || metric === 'equityIRR') {
    if (value >= 12) return 'bg-emerald-100 text-emerald-800 font-semibold'
    if (value >= 8)  return 'bg-green-50 text-green-700'
    if (value >= 5)  return 'bg-amber-50 text-amber-700'
    return 'bg-red-100 text-red-700'
  }
  if (metric === 'minDSCR') {
    if (value >= 2.0) return 'bg-emerald-100 text-emerald-800 font-semibold'
    if (value >= 1.3) return 'bg-green-50 text-green-700'
    if (value >= 1.1) return 'bg-amber-50 text-amber-700'
    return 'bg-red-100 text-red-700 font-bold'
  }
  if (metric === 'minLLCR') {
    if (value >= 2.0) return 'bg-emerald-100 text-emerald-800 font-semibold'
    if (value >= 1.4) return 'bg-green-50 text-green-700'
    if (value >= 1.2) return 'bg-amber-50 text-amber-700'
    return 'bg-red-100 text-red-700 font-bold'
  }
  if (metric === 'projectNPV' || metric === 'equityNPV') {
    if (value > 200)  return 'bg-emerald-100 text-emerald-800 font-semibold'
    if (value > 50)   return 'bg-green-50 text-green-700'
    if (value > 0)    return 'bg-amber-50 text-amber-700'
    return 'bg-red-100 text-red-700 font-bold'
  }
  return 'text-slate-700'
}

function suffix(metric) {
  if (metric.includes('IRR')) return '%'
  if (metric.includes('DSCR') || metric.includes('LLCR')) return '×'
  if (metric.includes('NPV')) return 'M'
  return ''
}

function decPlaces(metric) {
  if (metric.includes('NPV')) return 1
  if (metric.includes('DSCR') || metric.includes('LLCR')) return 2
  return 2
}

const METRICS = [
  { key: 'projectIRR', label: 'Project IRR' },
  { key: 'equityIRR',  label: 'Equity IRR' },
  { key: 'minDSCR',    label: 'Min DSCR' },
  { key: 'minLLCR',    label: 'Min LLCR' },
  { key: 'projectNPV', label: 'Project NPV (€M)' },
  { key: 'equityNPV',  label: 'Equity NPV (€M)', optional: true },
]

// ─── Sensitivity Table ────────────────────────────────────────────────────────
function SensTable({ title, data, baseIdx }) {
  const metrics = METRICS.filter(m => !m.optional || data[m.key])
  const n = data.labels.length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <p className="text-xs text-slate-400 mt-0.5">Blue = base case</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#0f2444] text-white">
              <th className="text-left px-4 py-2.5 font-semibold">Metric</th>
              {data.labels.map((l, i) => (
                <th key={i} className={`px-3 py-2.5 text-center font-semibold whitespace-nowrap ${i === baseIdx ? 'bg-blue-800' : ''}`}>
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, mi) => {
              const arr = data[m.key]
              if (!arr) return null
              return (
                <tr key={m.key} className={mi % 2 === 0 ? '' : 'bg-slate-50/40'}>
                  <td className="px-4 py-2 font-medium text-slate-600 border-r border-slate-100 whitespace-nowrap">
                    {m.label}
                  </td>
                  {arr.map((v, i) => (
                    <td key={i} className={`px-3 py-2 text-center rounded-sm ${cellColor(m.key, v, i === baseIdx)}`}>
                      {fmt(v, decPlaces(m.key))}{suffix(m.key)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Sensitivity curve (single-variable line chart) ──────────────────────────
function SensLine({ data, metric, title, filename }) {
  const arr = data[metric]
  return (
    <ChartPanel
      title={title}
      filename={filename || `sensitivity-${metric}`}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-5"
    >
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data.labels.map((l, i) => ({ l, v: arr[i] }))}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="l" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}${suffix(metric)}`} width={44} />
          <Tooltip formatter={v => [`${fmt(v, decPlaces(metric))}${suffix(metric)}`]} />
          <Line type="monotone" dataKey="v" name={metric} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  )
}

// ─── Tornado panel (multi-metric, Excel-style) ────────────────────────────────
// Reuse the existing chart palette: blue, emerald, indigo, amber
const VAR_COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b']

const TORNADO_DISPLAY = [
  { key: 'projectIRR', label: 'Project IRR', suffix: '%', dec: 1, covenant: null },
  { key: 'equityIRR',  label: 'Equity IRR',  suffix: '%', dec: 1, covenant: null },
  { key: 'minDSCR',    label: 'Min DSCR',    suffix: '×', dec: 2, covenant: 1.10 },
]

function TornadoPanel({ variables, title }) {
  const varData = variables.map((v, vi) => ({
    label: v.label,
    color: VAR_COLORS[vi] ?? '#94a3b8',
    metrics: TORNADO_DISPLAY.map(m => {
      const arr = v.data[m.key]
      if (!arr) return null
      const base = arr[v.baseIdx]
      // tornadoSlice: [start, end) excludes stress-test outliers from bar calculation
      const rangeArr = v.tornadoSlice ? arr.slice(...v.tornadoSlice) : arr
      const lo   = Math.min(...rangeArr)
      const hi   = Math.max(...rangeArr)
      const abs  = Math.abs(base) > 1e-9 ? Math.abs(base) : 1
      const loPct = ((lo - base) / abs) * 100
      const hiPct = ((hi - base) / abs) * 100
      return { base, lo, hi, loPct, hiPct, range: Math.abs(loPct) + Math.abs(hiPct) }
    }),
  }))

  // Sort ascending by projectIRR range (smallest impact at top)
  const piIdx = TORNADO_DISPLAY.findIndex(m => m.key === 'projectIRR')
  const sorted = [...varData].sort((a, b) => (a.metrics[piIdx]?.range ?? 0) - (b.metrics[piIdx]?.range ?? 0))

  // Global x-axis scale
  const allPcts = sorted.flatMap(v => v.metrics.flatMap(m => m ? [Math.abs(m.loPct), Math.abs(m.hiPct)] : []))
  const xMax = Math.max(Math.ceil(Math.max(...allPcts, 5) / 10) * 10, 10)

  // Base KPIs from first variable's base index
  const baseKPIs = TORNADO_DISPLAY.map(m => {
    const v0 = variables[0]
    return (v0?.data[m.key])?.[v0.baseIdx] ?? null
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <p className="text-xs text-slate-400 mt-0.5">
          % deviation from base · absolute values at bar ends · sorted by Project IRR impact (smallest at top)
        </p>
      </div>

      <div className="flex">
        {/* ── Left KPI panel ── */}
        <div className="flex-shrink-0 w-36 border-r border-slate-100 bg-slate-50 px-3 py-4 flex flex-col">
          <div className="space-y-2 mb-4">
            {TORNADO_DISPLAY.map((m, i) => (
              <div key={m.key} className="text-center bg-white rounded-lg border border-slate-200 py-2 px-1">
                <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">{m.label}</div>
                <div className="text-base font-bold text-[#0f2444]">
                  {baseKPIs[i] != null ? `${Number(baseKPIs[i]).toFixed(m.dec)}${m.suffix}` : '—'}
                </div>
                {m.covenant && (
                  <div className="text-[9px] text-slate-400">floor {m.covenant}×</div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-1.5">
            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Variables</div>
            {sorted.map(v => (
              <div key={v.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: v.color }} />
                <span className="text-[10px] text-slate-600 leading-tight">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chart area ── */}
        <div className="flex-1 min-w-0 px-3 py-4 space-y-5">
          {TORNADO_DISPLAY.map((m, mi) => {
            const base = baseKPIs[mi]
            const hasBreach = m.covenant != null &&
              sorted.some(v => (v.metrics[mi]?.lo ?? Infinity) < m.covenant)

            return (
              <div key={m.key}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-slate-700">{m.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    base {base != null ? `${Number(base).toFixed(m.dec)}${m.suffix}` : '—'}
                  </span>
                  {hasBreach && (
                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
                      △ Below {m.covenant}× lender floor
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {sorted.map(v => {
                    const md = v.metrics[mi]
                    if (!md) return null
                    const noImpact = md.range < 0.05
                    const loPct100 = Math.min(100, (Math.abs(md.loPct) / xMax) * 100)
                    const hiPct100 = Math.min(100, (Math.abs(md.hiPct) / xMax) * 100)

                    return (
                      <div key={v.label} className="flex items-center h-5 gap-0.5">
                        <div className="w-24 flex-shrink-0 text-right text-[9px] text-slate-500 pr-1 leading-tight truncate">
                          {v.label}
                        </div>
                        <div className="w-11 flex-shrink-0 text-right text-[9px] font-mono font-semibold text-slate-600 pr-0.5">
                          {noImpact ? '' : `${Number(md.lo).toFixed(m.dec)}${m.suffix}`}
                        </div>

                        {/* Left half bar */}
                        <div className="flex-1 relative h-3.5 bg-slate-100 rounded-l-sm overflow-hidden">
                          <div className="absolute right-0 inset-y-0 w-px bg-slate-300 z-10" />
                          {!noImpact && loPct100 > 0 && (
                            <div className="absolute right-0 inset-y-0 rounded-l-sm"
                              style={{ width: `${loPct100}%`, background: v.color, opacity: 0.85 }} />
                          )}
                        </div>

                        {/* Right half bar */}
                        <div className="flex-1 relative h-3.5 bg-slate-100 rounded-r-sm overflow-hidden">
                          <div className="absolute left-0 inset-y-0 w-px bg-slate-300 z-10" />
                          {noImpact ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[8px] text-slate-400">no impact</span>
                            </div>
                          ) : hiPct100 > 0 && (
                            <div className="absolute left-0 inset-y-0 rounded-r-sm"
                              style={{ width: `${hiPct100}%`, background: v.color }} />
                          )}
                        </div>

                        <div className="w-11 flex-shrink-0 text-[9px] font-mono font-semibold text-slate-600 pl-0.5">
                          {noImpact ? '' : `${Number(md.hi).toFixed(m.dec)}${m.suffix}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* X-axis */}
          <div className="flex items-center gap-0.5 pt-2 border-t border-slate-100 text-[9px]">
            <div className="w-24 flex-shrink-0" />
            <div className="w-11 flex-shrink-0" />
            <div className="flex-[2] flex justify-between px-0.5">
              <span className="text-red-400 font-medium">← −{xMax}%</span>
              <span className="text-slate-500 font-semibold">Base (0%)</span>
              <span className="text-emerald-500 font-medium">+{xMax}% →</span>
            </div>
            <div className="w-11 flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Scenario Tabs ────────────────────────────────────────────────────────────
const SCENARIOS = [
  { id: 'merchant', label: 'Merchant',    color: 'blue' },
  { id: 'ppa',      label: 'PPA / FER X', color: 'emerald' },
  { id: 'ferz',     label: 'FER Z',       color: 'violet' },
]

function MerchantTab({ sens }) {
  const { base, priceVariation, capexVariation, costOfDebtVariation } = sens
  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-blue-800">
        <strong>Merchant scenario</strong> — pure spot-market revenue, no long-term off-take agreement.{' '}
        Project IRR: <strong>{fmt(base.projectIRR, 1)}%</strong>
        {' · '}Min DSCR: <strong>{fmt(base.minDSCR, 2)}×</strong>
        {' · '}NPV: <strong>€{fmt(base.projectNPV, 0)}M</strong>
      </div>
      <TornadoPanel
        title="Tornado: Key Drivers of Merchant Returns"
        variables={[
          { label: 'CAPEX',          data: capexVariation,      baseIdx: BASE7 },
          { label: 'Merchant Price', data: priceVariation,      baseIdx: BASE7 },
          { label: 'Cost of Debt',   data: costOfDebtVariation, baseIdx: COD_BASE_IDX },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SensTable title="Sensitivity to Merchant Price Level" data={priceVariation} baseIdx={BASE7} />
        <SensLine  data={priceVariation} metric="projectIRR" title="Project IRR vs. Price" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SensTable title="Sensitivity to CAPEX (and OPEX)" data={capexVariation} baseIdx={BASE7} />
        <SensLine  data={capexVariation} metric="equityIRR" title="Equity IRR vs. CAPEX" />
      </div>
      <SensTable title="Sensitivity to Cost of Debt (Kd)" data={costOfDebtVariation} baseIdx={COD_BASE_IDX} />
    </div>
  )
}

function PPATab({ sens, ppaStrike, ppaVolumePct }) {
  const { base, priceVariation, capexVariation, volumeVariation, costOfDebtVariation } = sens
  return (
    <div className="space-y-5">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 text-sm text-emerald-800">
        <strong>PPA / FER X scenario</strong> — {fmt(ppaVolumePct, 0)}% of generation contracted at €{fmt(ppaStrike, 0)}/MWh strike.{' '}
        Project IRR: <strong>{fmt(base.projectIRR, 1)}%</strong>
        {' · '}Min DSCR: <strong>{fmt(base.minDSCR, 2)}×</strong>
        {' · '}NPV: <strong>€{fmt(base.projectNPV, 0)}M</strong>
      </div>
      <TornadoPanel
        title="Tornado: Key Drivers of PPA Returns"
        variables={[
          { label: 'CAPEX',            data: capexVariation,      baseIdx: BASE7 },
          { label: 'PPA Strike Price', data: priceVariation,      baseIdx: BASE7 },
          { label: 'PPA Volume (%)',   data: volumeVariation,     baseIdx: COD_BASE_IDX },
          { label: 'Cost of Debt',     data: costOfDebtVariation, baseIdx: COD_BASE_IDX },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SensTable title="Sensitivity to PPA Strike Price" data={priceVariation} baseIdx={BASE7} />
        <SensLine  data={priceVariation} metric="projectIRR" title="Project IRR vs. PPA Price" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SensTable title="Sensitivity to CAPEX" data={capexVariation} baseIdx={BASE7} />
        <SensTable title="Sensitivity to PPA Volume (% of output)" data={volumeVariation} baseIdx={COD_BASE_IDX} />
      </div>
      <SensTable title="Sensitivity to Cost of Debt (Kd)" data={costOfDebtVariation} baseIdx={COD_BASE_IDX} />
    </div>
  )
}

function FerZTab({ sens, ferZStrike, ferZBaseloadPct }) {
  const { base, strikeVariation, capexVariation, baseloadVariation, costOfDebtVariation } = sens
  return (
    <div className="space-y-5">
      <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 text-sm text-violet-800">
        <strong>FER Z scenario</strong> (ILLUSTRATIVE — tariffs not yet published) — two-way CfD at €{fmt(ferZStrike, 0)}/MWh,
        {' '}{fmt(ferZBaseloadPct, 1)}% baseload obligation.{' '}
        Project IRR: <strong>{fmt(base.projectIRR, 1)}%</strong>
        {' · '}Min DSCR: <strong>{fmt(base.minDSCR, 2)}×</strong>
        {' · '}NPV: <strong>€{fmt(base.projectNPV, 0)}M</strong>
      </div>
      <TornadoPanel
        title="Tornado: Key Drivers of FER Z Returns"
        variables={[
          { label: 'CAPEX',               data: capexVariation,      baseIdx: BASE7 },
          { label: 'FER Z Strike Price',  data: strikeVariation,     baseIdx: BASE7 },
          { label: 'Baseload Obligation', data: baseloadVariation,   baseIdx: COD_BASE_IDX },
          { label: 'Cost of Debt',        data: costOfDebtVariation, baseIdx: COD_BASE_IDX },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SensTable title={`Sensitivity to FER Z Strike Price (% change from €${fmt(ferZStrike, 0)}/MWh base)`} data={strikeVariation} baseIdx={BASE7} />
        <SensLine  data={strikeVariation} metric="projectNPV" title="Project NPV vs. FER Z Strike" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SensTable title="Sensitivity to CAPEX" data={capexVariation} baseIdx={BASE7} />
        <SensTable title={`Sensitivity to Baseload Obligation (% change from ${fmt(ferZBaseloadPct, 1)}% base)`} data={baseloadVariation} baseIdx={COD_BASE_IDX} />
      </div>
      <SensTable title="Sensitivity to Cost of Debt (Kd)" data={costOfDebtVariation} baseIdx={COD_BASE_IDX} />
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend_() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {[
        { cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200', label: 'Strong' },
        { cls: 'bg-green-50 text-green-700 border border-green-200',        label: 'Acceptable' },
        { cls: 'bg-amber-50 text-amber-700 border border-amber-200',        label: 'Marginal' },
        { cls: 'bg-red-100 text-red-700 border border-red-200',             label: 'Breach / Loss' },
        { cls: 'bg-blue-100 text-blue-800 ring-1 ring-blue-400',            label: 'Base Case' },
      ].map(e => (
        <span key={e.label} className={`px-2 py-0.5 rounded font-medium ${e.cls}`}>{e.label}</span>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Sensitivity({ assumptions, scenarios }) {
  const [tab, setTab] = useState('merchant')

  // scenarios.merchant / .ppa / .ferz come from App.jsx (single source of truth).
  // Only the sensitivity sweeps are computed here — base models are NOT re-derived.
  const sens = useMemo(() => {
    const merch = { ...assumptions, ppaType: 0, ferZEnabled: false }
    const ppa   = { ...assumptions, ppaType: 1, ferZEnabled: false }
    const ferz  = { ...assumptions, ppaType: 0, ferZEnabled: true  }

    return {
      merchant: {
        base:                scenarios.merchant,
        priceVariation:      sweep(merch, priceFn,                                           STEPS7),
        capexVariation:      sweep(merch, capexFn,                                           STEPS7),
        costOfDebtVariation: sweep(merch, codFn,                                             STEPS5),
      },
      ppa: {
        base:                scenarios.ppa,
        priceVariation:      sweep(ppa,   (f, a) => ({ ppaStrike:      a.ppaStrike * f }),   STEPS7),
        capexVariation:      sweep(ppa,   capexFn,                                           STEPS7),
        volumeVariation:     sweep(ppa,   (f, a) => ({ ppaVolumePct:   a.ppaVolumePct * f }),STEPS5),
        costOfDebtVariation: sweep(ppa,   codFn,                                             STEPS5),
      },
      ferz: {
        base:                scenarios.ferz,
        strikeVariation:     sweep(ferz,  (f, a) => ({ ferZStrike:      a.ferZStrike * f }),  STEPS7),
        capexVariation:      sweep(ferz,  capexFn,                                            STEPS7),
        baseloadVariation:   sweep(ferz,  (f, a) => ({ ferZBaseloadPct: a.ferZBaseloadPct * f }), STEPS5),
        costOfDebtVariation: sweep(ferz,  codFn,                                              STEPS5),
      },
    }
  }, [assumptions, scenarios])

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <ExportButton
          label="Download sensitivity Excel"
          onExport={() => exportSensitivityWorkbook(sens[tab], tab)}
        />
      </div>

      {/* Scenario tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1 flex gap-1">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => setTab(s.id)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === s.id
                ? 'bg-[#0f2444] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-slate-500">Colour scale:</span>
        <Legend_ />
      </div>

      {/* Active scenario */}
      {tab === 'merchant' && <MerchantTab sens={sens.merchant} />}
      {tab === 'ppa'      && <PPATab      sens={sens.ppa}  ppaStrike={assumptions.ppaStrike} ppaVolumePct={assumptions.ppaVolumePct} />}
      {tab === 'ferz'     && <FerZTab     sens={sens.ferz} ferZStrike={assumptions.ferZStrike} ferZBaseloadPct={assumptions.ferZBaseloadPct} />}
    </div>
  )
}
