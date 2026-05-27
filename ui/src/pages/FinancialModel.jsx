import React, { useState } from 'react'
import {
  ComposedChart, Bar, Line, Area, AreaChart, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import ChartPanel from '../components/ChartPanel'
import ExportButton from '../components/ExportButton'
import { exportFinancialModelWorkbook } from '../utils/excelExport'

function fmt(v, d = 2) {
  if (v == null) return '—'
  const n = Number(v)
  if (isNaN(n)) return '—'
  return n.toFixed(d)
}
function fmtM(v)  { return v == null ? '—' : `€${fmt(v, 2)}M` }
function fmtPct(v){ return v == null ? '—' : `${fmt(v * 100, 1)}%` }
function fmtX(v)  { return v == null ? '—' : `${fmt(v, 2)}×` }

const CHART_KEYS = [
  { key: 'revenue',    label: 'Revenue',        color: '#3b82f6' },
  { key: 'ebitda',     label: 'EBITDA',         color: '#10b981' },
  { key: 'projectFCF', label: 'Project FCF',    color: '#6366f1' },
  { key: 'equityFCF',  label: 'Equity FCF',     color: '#f59e0b' },
  { key: 'cfads',      label: 'CFADS',          color: '#8b5cf6' },
  { key: 'openDebt',   label: 'Opening Debt',   color: '#ef4444' },
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs max-w-xs">
      <p className="font-semibold text-slate-600 mb-1">Year {label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium">€{fmt(p.value, 2)}M</span>
        </div>
      ))}
    </div>
  )
}

// Row definitions for the table
const TABLE_SECTIONS = [
  {
    label: 'A. Capital Expenditure',
    rows: [
      { key: 'pvHardRow',   label: '  PV hard capex',   special: 'pvHard' },
      { key: 'wHardRow',    label: '  Wind hard capex',  special: 'windHard' },
      { key: 'bHardRow',    label: '  BESS hard capex',  special: 'bessHard' },
      { key: 'capexInYear', label: '  BESS replacement capex', format: fmtM, zero: true },
    ],
  },
  {
    label: 'B. Revenue',
    rows: [
      { key: 'revenue', label: '  Total Revenue', format: fmtM, highlight: 'rev' },
    ],
  },
  {
    label: 'C. Operating Costs',
    rows: [
      { key: 'opex',          label: '  O&M / insurance', format: fmtM, neg: true },
      { key: 'ebitda',        label: '  EBITDA',          format: fmtM, highlight: 'ebitda', bold: true },
      { key: 'ebitdaMargin',  label: '  EBITDA margin',   format: fmtPct },
    ],
  },
  {
    label: 'D. Debt Schedule',
    rows: [
      { key: 'openDebt',   label: '  Opening debt balance', format: fmtM },
      { key: 'interest',   label: '  Interest expense',     format: fmtM, neg: true },
      { key: 'principal',  label: '  Principal repayment',  format: fmtM, neg: true },
      { key: 'ds',         label: '  Total debt service',   format: fmtM, neg: true, bold: true },
      { key: 'closeDebt',  label: '  Closing debt balance', format: fmtM },
    ],
  },
  {
    label: 'E. Tax & Free Cash Flow',
    rows: [
      { key: 'dep',        label: '  Depreciation',           format: fmtM },
      { key: 'ebit',       label: '  EBIT',                   format: fmtM },
      { key: 'ebt',        label: '  EBT',                    format: fmtM },
      { key: 'taxAmt',     label: '  Tax (IRES + IRAP)',      format: fmtM, neg: true },
      { key: 'projectFCF',   label: '  Project FCF (unlevered)', format: fmtM, highlight: 'fcf', bold: true },
      { key: 'equityFCF',   label: '  Equity FCF (levered)',    format: fmtM, highlight: 'eq',  bold: true },
      { key: 'tvSpecial',   label: '  Terminal Value (Y25)',     special: 'tv', zero: true },
    ],
  },
  {
    label: 'F. Bankability Metrics',
    rows: [
      { key: 'cfads', label: '  CFADS',  format: fmtM },
      { key: 'dscr',  label: '  DSCR',   format: fmtX, highlight: 'dscr' },
      { key: 'llcr',  label: '  LLCR',   format: fmtX, highlight: 'llcr' },
    ],
  },
]

function highlightClass(h, v) {
  if (!h) return ''
  if (h === 'rev' || h === 'ebitda') return 'text-blue-700 font-medium'
  if (h === 'fcf' || h === 'eq') {
    return v < 0 ? 'text-red-600 font-medium' : 'text-emerald-700 font-medium'
  }
  if (h === 'dscr') {
    if (v == null) return 'text-slate-400'
    return v < 1.10 ? 'text-red-600 font-bold' : v < 1.30 ? 'text-amber-600 font-medium' : 'text-emerald-700 font-medium'
  }
  if (h === 'llcr') {
    if (v == null) return 'text-slate-400'
    return v < 1.20 ? 'text-red-600 font-bold' : v < 1.40 ? 'text-amber-600 font-medium' : 'text-emerald-700 font-medium'
  }
  return ''
}

export default function FinancialModel({ model, assumptions }) {
  const [activeChart, setActiveChart] = useState('revenue')

  const rows = model.rows
  const years = rows.map(r => r.y)

  // Chart data
  const chartData = rows.map(r => ({
    y: r.y,
    ...Object.fromEntries(CHART_KEYS.map(k => [k.label, +(r[k.key] ?? 0).toFixed(3)])),
  }))

  const activeKey  = CHART_KEYS.find(k => k.key === activeChart)
  const activeData = chartData.map(d => ({ y: d.y, [activeKey.label]: d[activeKey.label] }))

  // Render a special capex cell (only in Y0 column)
  function getCell(row, r, y0capex) {
    if (row.special === 'pvHard')   return y0capex ? `€${model.pvHard.toFixed(2)}M`   : '—'
    if (row.special === 'windHard') return y0capex ? `€${model.windHard.toFixed(2)}M`  : '—'
    if (row.special === 'bessHard') return y0capex ? `€${model.bessHard.toFixed(2)}M`  : '—'
    if (row.special === 'tv')       return r ? fmtM(r.terminalValue ?? null) : '—'
    const v = r[row.key]
    if (row.zero && (v === 0 || v == null)) return '—'
    return row.format ? row.format(v) : v ?? '—'
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <ExportButton
          label="Download model Excel"
          onExport={() => exportFinancialModelWorkbook({ model, assumptions })}
        />
      </div>

      {/* Chart toggle + chart */}
      <ChartPanel
        className="bg-white rounded-xl shadow-sm border border-slate-100 p-5"
        title="Time series"
        subtitle={`${activeKey.label} · 25-year · €M`}
        filename={`financial-model-${activeChart}`}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {CHART_KEYS.map(k => (
            <button
              key={k.key}
              onClick={() => setActiveChart(k.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeChart === k.key
                  ? 'text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={activeChart === k.key ? { background: k.color } : {}}
            >
              {k.label}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={activeData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={activeKey.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={activeKey.color} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="y" tick={{ fontSize: 11 }} tickFormatter={v => `Y${v}`} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${v}M`} width={62} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 2" />
            <Area type="monotone" dataKey={activeKey.label}
              stroke={activeKey.color} fill="url(#chartGrad)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      {/* ── 25-year table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Project Economics: Annual Cash Flow Model (€M)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Scroll horizontally to see all 25 years</p>
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse min-w-max">
            <thead>
              <tr className="bg-[#0f2444] text-white">
                <th className="sticky left-0 bg-[#0f2444] text-left px-4 py-2.5 font-semibold z-10 min-w-[220px]">
                  Parameter
                </th>
                <th className="px-3 py-2.5 text-center font-semibold bg-slate-700 whitespace-nowrap">Y0</th>
                {years.map(y => (
                  <th key={y} className="px-3 py-2.5 text-center font-semibold whitespace-nowrap">Y{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_SECTIONS.map(section => (
                <React.Fragment key={section.label}>
                  <tr className="bg-slate-100">
                    <td colSpan={years.length + 2}
                      className="sticky left-0 px-4 py-1.5 font-bold text-slate-600 text-[11px] uppercase tracking-wider bg-slate-100 z-10">
                      {section.label}
                    </td>
                  </tr>
                  {section.rows.map((row, ri) => (
                    <tr key={row.key + ri}
                      className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${ri % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                      <td className={`sticky left-0 bg-white px-4 py-1.5 z-10 ${row.bold ? 'font-bold text-slate-700' : 'text-slate-600'} border-r border-slate-100`}>
                        {row.label}
                      </td>
                      {/* Y0 column */}
                      <td className="px-3 py-1.5 text-center text-slate-500 bg-slate-50/60">
                        {row.special ? getCell(row, null, true) : '—'}
                      </td>
                      {/* Y1–Y25 */}
                      {rows.map(r => {
                        const raw = r[row.key]
                        const cell = getCell(row, r, false)
                        const cls = highlightClass(row.highlight, raw)
                        return (
                          <td key={r.y} className={`px-3 py-1.5 text-right whitespace-nowrap ${cls || (row.neg && raw > 0 ? 'text-red-500' : 'text-slate-700')}`}>
                            {cell}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waterfall summary Y1 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Year 1 Cash Flow Waterfall</h3>
        <p className="text-[11px] text-slate-400 mb-4">
          Depreciation (€{fmt(rows[0]?.dep, 1)}M) is a non-cash tax shield — it reduces taxable income but is not a cash outflow.
          BESS replacement reserve (set-aside Y1–Y12) reduces CFADS only; full replacement capex hits in Y{model.rows.findIndex(r => r.capexInYear > 0) + 1}.
        </p>
        <div className="flex flex-col gap-2 max-w-lg">
          {[
            { label: 'Revenue',              value: rows[0]?.revenue,    color: 'bg-blue-500' },
            { label: '− O&M / OpEx',         value: -rows[0]?.opex,      color: 'bg-red-400' },
            { label: 'EBITDA',               value: rows[0]?.ebitda,     color: 'bg-emerald-500', bold: true },
            { label: '− Tax (IRES + IRAP)',  value: -rows[0]?.taxAmt,    color: 'bg-red-300' },
            { label: 'Project FCF',          value: rows[0]?.projectFCF, color: 'bg-indigo-500', bold: true },
            { label: '− Debt Service',       value: -rows[0]?.ds,        color: 'bg-amber-400' },
            { label: 'Equity FCF',           value: rows[0]?.equityFCF,  color: 'bg-purple-500', bold: true },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className={`text-xs w-40 ${item.bold ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{item.label}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full ${item.color}`}
                  style={{ width: `${Math.min(100, Math.abs(item.value ?? 0) / (rows[0]?.revenue ?? 1) * 100)}%`, opacity: item.value < 0 ? 0.7 : 1 }}
                />
              </div>
              <span className={`text-xs w-20 text-right font-mono ${item.bold ? 'font-bold text-slate-800' : item.value < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                €{(item.value ?? 0).toFixed(1)}M
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-6 text-[11px] text-slate-500">
          <span>CFADS (Y1): <strong className="text-slate-700">€{fmt(rows[0]?.cfads, 1)}M</strong></span>
          <span>Debt Service: <strong className="text-slate-700">€{fmt(rows[0]?.ds, 1)}M</strong></span>
          <span>DSCR (Y1): <strong className={rows[0]?.dscr >= 1.3 ? 'text-emerald-600' : 'text-amber-600'}>{fmt(rows[0]?.dscr, 2)}×</strong></span>
        </div>
      </div>

    </div>
  )
}
