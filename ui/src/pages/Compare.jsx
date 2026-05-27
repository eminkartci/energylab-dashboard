import { useMemo, useState } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { buildModel } from '../calc'
import ChartPanel from '../components/ChartPanel'

const COLOR_A = '#3b82f6'
const COLOR_B = '#f59e0b'

function fmt(n, d = 1) {
  return n == null ? '—' : Number(n).toFixed(d)
}

function delta(a, b, d = 1, suffix = '') {
  if (a == null || b == null) return '—'
  const diff = b - a
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff.toFixed(d)}${suffix}`
}

function deltaClass(a, b, higherIsBetter = true) {
  if (a == null || b == null) return 'text-slate-500'
  const diff = b - a
  if (Math.abs(diff) < 0.01) return 'text-slate-500'
  const good = higherIsBetter ? diff > 0 : diff < 0
  return good ? 'text-emerald-600' : 'text-red-600'
}

const KPI_ROWS = [
  { key: 'projectIRR', label: 'Project IRR', suffix: '%', higher: true },
  { key: 'equityIRR', label: 'Equity IRR', suffix: '%', higher: true },
  { key: 'projectNPV', label: 'Project NPV', suffix: ' M', prefix: '€', higher: true },
  { key: 'equityNPV', label: 'Equity NPV', suffix: ' M', prefix: '€', higher: true },
  { key: 'minDSCR', label: 'Min DSCR', suffix: '×', higher: true },
  { key: 'minLLCR', label: 'Min LLCR', suffix: '×', higher: true },
  { key: 'totalCapex', label: 'Total CAPEX', suffix: ' M', prefix: '€', higher: false },
]

const ASSUMPTION_LABELS = {
  city: 'City',
  zone: 'Zone',
  pvMWp: 'PV (MWp)',
  windMWp: 'Wind (MWp)',
  bessMWh: 'BESS (MWh)',
  bessRTE: 'BESS RTE (%)',
  pvSpecificCapex: 'PV CAPEX (€/kWp)',
  windSpecificCapex: 'Wind CAPEX (€/kWp)',
  bessSpecificCapex: 'BESS CAPEX (€/kWh)',
  ltv: 'LTV (%)',
  kd: 'Cost of debt (%)',
  ke: 'Cost of equity (%)',
  ppaStrike: 'PPA strike (€/MWh)',
  ppaVolumePct: 'PPA volume (%)',
  ferZEnabled: 'FER Z enabled',
  ferZStrike: 'FER Z strike (€/MWh)',
}

function CompareTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-2">Year {label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-700">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function buildComparisonData(modelA, modelB) {
  return modelA.rows.map((row, i) => {
    const b = modelB.rows[i]
    return {
      y: row.y,
      revenueA: +row.revenue.toFixed(2),
      revenueB: +b.revenue.toFixed(2),
      ebitdaA: +row.ebitda.toFixed(2),
      ebitdaB: +b.ebitda.toFixed(2),
      projectFCFA: +row.projectFCF.toFixed(2),
      projectFCFB: +b.projectFCF.toFixed(2),
      equityFCFA: +row.equityFCF.toFixed(2),
      equityFCFB: +b.equityFCF.toFixed(2),
      dscrA: row.dscr != null ? +row.dscr.toFixed(3) : null,
      dscrB: b.dscr != null ? +b.dscr.toFixed(3) : null,
    }
  })
}

function getAssumptionDiffs(a, b) {
  return Object.keys(ASSUMPTION_LABELS)
    .filter(key => JSON.stringify(a[key]) !== JSON.stringify(b[key]))
    .map(key => ({
      key,
      label: ASSUMPTION_LABELS[key],
      a: a[key],
      b: b[key],
    }))
}

function ScenarioPicker({ label, value, onChange, records, color }) {
  return (
    <div className="flex-1 min-w-[220px]">
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <option value="live">Current workspace (unsaved)</option>
        {records.map(r => (
          <option key={r.id} value={String(r.id)}>{r.name}</option>
        ))}
      </select>
    </div>
  )
}

export default function ComparePage({ records, liveAssumptions }) {
  const [selectionA, setSelectionA] = useState('live')
  const [selectionB, setSelectionB] = useState(records[0] ? String(records[0].id) : 'live')

  const assumptionsA = useMemo(() => {
    if (selectionA === 'live') return liveAssumptions
    const rec = records.find(r => String(r.id) === selectionA)
    return rec?.assumptions ?? liveAssumptions
  }, [selectionA, records, liveAssumptions])

  const assumptionsB = useMemo(() => {
    if (selectionB === 'live') return liveAssumptions
    const rec = records.find(r => String(r.id) === selectionB)
    return rec?.assumptions ?? liveAssumptions
  }, [selectionB, records, liveAssumptions])

  const labelA = selectionA === 'live' ? 'Current workspace' : records.find(r => String(r.id) === selectionA)?.name ?? 'Scenario A'
  const labelB = selectionB === 'live' ? 'Current workspace' : records.find(r => String(r.id) === selectionB)?.name ?? 'Scenario B'

  const modelA = useMemo(() => buildModel(assumptionsA), [assumptionsA])
  const modelB = useMemo(() => buildModel(assumptionsB), [assumptionsB])
  const chartData = useMemo(() => buildComparisonData(modelA, modelB), [modelA, modelB])
  const diffs = useMemo(() => getAssumptionDiffs(assumptionsA, assumptionsB), [assumptionsA, assumptionsB])

  const sameSelection = selectionA === selectionB

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Scenario Comparison</h2>
        <p className="text-sm text-slate-500 mt-1">
          Select two scenarios to compare KPIs, assumptions, and 25-year charts side by side.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
        <ScenarioPicker label="Scenario A" value={selectionA} onChange={setSelectionA} records={records} color={COLOR_A} />
        <ScenarioPicker label="Scenario B" value={selectionB} onChange={setSelectionB} records={records} color={COLOR_B} />
      </div>

      {sameSelection && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Select two different scenarios to compare.
        </div>
      )}

      {!sameSelection && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[['A', labelA, modelA, COLOR_A], ['B', labelB, modelB, COLOR_B]].map(([tag, label, model, color]) => (
              <div key={tag} className="bg-white rounded-xl border border-slate-200 p-4" style={{ borderTop: `3px solid ${color}` }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>Scenario {tag}</p>
                <h3 className="text-base font-bold text-slate-800 mt-1">{label}</h3>
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div><span className="text-slate-400">Project IRR</span><p className="font-semibold">{fmt(model.projectIRR)}%</p></div>
                  <div><span className="text-slate-400">Equity IRR</span><p className="font-semibold">{fmt(model.equityIRR)}%</p></div>
                  <div><span className="text-slate-400">Min DSCR</span><p className="font-semibold">{fmt(model.minDSCR, 2)}×</p></div>
                  <div><span className="text-slate-400">Project NPV</span><p className="font-semibold">€{fmt(model.projectNPV, 0)}M</p></div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">KPI Delta (B − A)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500">
                    <th className="text-left px-4 py-2">Metric</th>
                    <th className="text-right px-4 py-2">{labelA}</th>
                    <th className="text-right px-4 py-2">{labelB}</th>
                    <th className="text-right px-4 py-2">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {KPI_ROWS.map(row => {
                    const a = modelA[row.key]
                    const b = modelB[row.key]
                    return (
                      <tr key={row.key} className="border-t border-slate-100">
                        <td className="px-4 py-2 text-slate-600">{row.label}</td>
                        <td className="px-4 py-2 text-right font-mono">{row.prefix || ''}{fmt(a, row.suffix.includes('M') ? 0 : 1)}{row.suffix.replace(' M', 'M')}</td>
                        <td className="px-4 py-2 text-right font-mono">{row.prefix || ''}{fmt(b, row.suffix.includes('M') ? 0 : 1)}{row.suffix.replace(' M', 'M')}</td>
                        <td className={`px-4 py-2 text-right font-mono font-semibold ${deltaClass(a, b, row.higher)}`}>
                          {delta(a, b, row.suffix.includes('M') ? 0 : 1, row.suffix.replace(' M', 'M'))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartPanel title="Revenue comparison" subtitle={`${labelA} vs ${labelB} · €M`} filename="compare-revenue">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="y" tickFormatter={v => `Y${v}`} />
                  <YAxis width={40} />
                  <Tooltip content={<CompareTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="revenueA" name={labelA} stroke={COLOR_A} fill={COLOR_A} fillOpacity={0.08} strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="revenueB" name={labelB} stroke={COLOR_B} fill={COLOR_B} fillOpacity={0.08} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="EBITDA comparison" subtitle="€M" filename="compare-ebitda">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="y" tickFormatter={v => `Y${v}`} />
                  <YAxis width={40} />
                  <Tooltip content={<CompareTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="ebitdaA" name={labelA} stroke={COLOR_A} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ebitdaB" name={labelB} stroke={COLOR_B} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Project FCF comparison" subtitle="€M" filename="compare-project-fcf">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="8%" barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="y" tickFormatter={v => `Y${v}`} />
                  <YAxis width={40} />
                  <Tooltip content={<CompareTooltip />} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#cbd5e1" />
                  <Bar dataKey="projectFCFA" name={labelA} fill={COLOR_A} maxBarSize={28} />
                  <Bar dataKey="projectFCFB" name={labelB} fill={COLOR_B} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="DSCR comparison" subtitle="Debt tenor years" filename="compare-dscr">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData.filter(d => d.dscrA != null || d.dscrB != null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="y" tickFormatter={v => `Y${v}`} />
                  <YAxis width={40} tickFormatter={v => `${v}×`} />
                  <Tooltip content={<CompareTooltip />} />
                  <Legend />
                  <ReferenceLine y={1.25} stroke="#ef4444" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="dscrA" name={labelA} stroke={COLOR_A} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="dscrB" name={labelB} stroke={COLOR_B} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Assumption Differences</h3>
              <p className="text-xs text-slate-400 mt-0.5">{diffs.length} changed parameter(s)</p>
            </div>
            {diffs.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No assumption differences — scenarios use identical inputs.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500">
                      <th className="text-left px-4 py-2">Parameter</th>
                      <th className="text-right px-4 py-2">{labelA}</th>
                      <th className="text-right px-4 py-2">{labelB}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffs.map(row => (
                      <tr key={row.key} className="border-t border-slate-100">
                        <td className="px-4 py-2 text-slate-600">{row.label}</td>
                        <td className="px-4 py-2 text-right font-mono">{String(row.a)}</td>
                        <td className="px-4 py-2 text-right font-mono">{String(row.b)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export { buildComparisonData }
