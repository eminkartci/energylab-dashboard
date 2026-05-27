import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { buildModel } from '../calc'
import { BASE_ASSUMPTIONS, ZONES } from '../data'
import ChartPanel from '../components/ChartPanel'
import ExportButton from '../components/ExportButton'
import { exportPPAWorkbook } from '../utils/excelExport'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(v, d = 2) {
  if (v == null) return '—'
  const n = Number(v)
  return isNaN(n) ? '—' : n.toFixed(d)
}
function fmtX(v)   { return v == null ? '—' : `${fmt(v, 2)}×` }
function fmtEur(v) { return v == null ? '—' : `€${fmt(v, 1)}/MWh` }

function stdDev(arr) {
  if (arr.length < 2) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((a, v) => a + (v - mean) ** 2, 0) / arr.length)
}

function dscrColor(v) {
  if (v == null) return 'text-slate-400'
  if (v >= 1.50) return 'text-emerald-600 font-semibold'
  if (v >= 1.25) return 'text-green-600'
  if (v >= 1.10) return 'text-amber-600'
  return 'text-red-600 font-bold'
}

function dscrBadge(v) {
  const cls = v >= 1.50 ? 'bg-emerald-100 text-emerald-700'
            : v >= 1.25 ? 'bg-green-100 text-green-700'
            : v >= 1.10 ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700 font-bold'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>{fmtX(v)}</span>
}

// Build a scenario by overriding specific keys on top of the shared assumptions
function buildScenario(base, overrides) {
  return buildModel({ ...base, ...overrides })
}

// Binary search: minimum PPA strike price to achieve DSCR ≥ threshold
function breakEvenStrike(base, volPct, threshold = 1.25) {
  let lo = 20, hi = 150
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const m = buildScenario(base, { ppaType: 1, ppaVolumePct: volPct, ppaStrike: mid, ferZEnabled: false })
    if (m.minDSCR >= threshold) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

function DscrTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-600 mb-1">Year {label}</p>
      {payload.map(p => p.value != null && (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {Number(p.value).toFixed(2)}×</p>
      ))}
    </div>
  )
}

export default function PPAAnalysis({ assumptions = BASE_ASSUMPTIONS, scenarios, onUpdate }) {
  // ── Read live values from shared assumptions ─────────────────────────────
  const zone   = assumptions.zone   || 'SICI'
  const strike = assumptions.ppaStrike
  const volPct = assumptions.ppaVolumePct

  const LENDER_THRESHOLD = 1.25

  // ── Base PPA model: use canonical model from App.jsx (single source of truth) ──
  // Falls back to local buildScenario only when scenarios prop is unavailable.
  const baseMod = useMemo(() =>
    scenarios?.ppa ?? buildScenario(assumptions, { ppaType: 1, ferZEnabled: false }),
    [assumptions, scenarios]
  )

  // ── DSCR time-series: base / −20% / +20% strike ──────────────────────────
  const dscrSeries = useMemo(() => {
    const lo = buildScenario(assumptions, { ppaType: 1, ppaStrike: strike * 0.80, ferZEnabled: false })
    const hi = buildScenario(assumptions, { ppaType: 1, ppaStrike: strike * 1.20, ferZEnabled: false })
    return baseMod.rows.map((r, i) => ({
      year: r.y,
      'Base': r.dscr,
      '−20% strike': lo.rows[i].dscr,
      '+20% strike': hi.rows[i].dscr,
    }))
  }, [assumptions, strike, baseMod])

  // ── Contracted volume sweep ───────────────────────────────────────────────
  const volSweep = useMemo(() =>
    [0, 20, 40, 60, 70, 80, 100].map(pct => {
      const m = buildScenario(assumptions, {
        ppaType: pct > 0 ? 1 : 0,
        ppaVolumePct: pct,
        ferZEnabled: false,
      })
      return { pct: `${pct}%`, minDSCR: m.minDSCR, revStd: stdDev(m.rows.map(r => r.revenue)) }
    }),
    [assumptions]
  )

  // ── Three-scenario comparison: Merchant / PPA / FER Z ────────────────────
  // Use canonical models from App.jsx scenarios prop; fall back to local computation only if unavailable.
  const scenarioRows = useMemo(() => {
    const merchant = scenarios?.merchant ?? buildScenario(assumptions, { ppaType: 0, ferZEnabled: false })
    const ppa      = scenarios?.ppa      ?? buildScenario(assumptions, { ppaType: 1, ferZEnabled: false })
    const ferZ     = scenarios?.ferz     ?? buildScenario(assumptions, { ppaType: 0, ferZEnabled: true })
    return [
      { id: 'merchant', label: 'Merchant',       sub: '100% variable',                          m: merchant, color: '#f59e0b', headerCls: 'text-orange-700' },
      { id: 'ppa',      label: `PPA ${volPct}%`, sub: `${volPct}% contracted · €${strike}/MWh`, m: ppa,      color: '#3b82f6', headerCls: 'text-blue-700'   },
      { id: 'ferz',     label: 'FER Z (illus.)', sub: `CfD @ €${assumptions.ferZStrike}/MWh`,   m: ferZ,     color: '#8b5cf6', headerCls: 'text-violet-700' },
    ]
  }, [assumptions, scenarios, strike, volPct])

  // ── Stress test ───────────────────────────────────────────────────────────
  const stressScenarios = useMemo(() => [
    { label: 'Base case',            pStrike: strike,       mAdj: 1.00 },
    { label: 'Strike −20%',          pStrike: strike * 0.8, mAdj: 1.00 },
    { label: 'Merchant prices −20%', pStrike: strike,       mAdj: 0.80 },
    { label: 'Joint shock −20%',     pStrike: strike * 0.8, mAdj: 0.80 },
  ].map(s => {
    const m = buildScenario(assumptions, {
      ppaType: 1, ppaStrike: s.pStrike, ferZEnabled: false, merchantPriceAdj: s.mAdj,
    })
    return { ...s, minDSCR: m.minDSCR, avgDSCR: m.avgDSCR, breach: m.minDSCR < LENDER_THRESHOLD }
  }), [assumptions, strike])

  // ── Break-even strike ─────────────────────────────────────────────────────
  const bep = useMemo(() => breakEvenStrike(assumptions, volPct), [assumptions, volPct])

  const zoneLabel = ZONES[zone]?.label ?? zone

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButton
          label="Download PPA Excel"
          onExport={() => exportPPAWorkbook({
            assumptions,
            baseMod,
            dscrSeries,
            volSweep,
            scenarioRows,
            stressScenarios,
            bep,
          })}
        />
      </div>

      {/* ── Header ── */}
      <div className="bg-[#0f2444] text-white rounded-xl px-6 py-4">
        <h2 className="text-base font-bold">PPA Bankability Analysis — Strike Price & DSCR Sensitivity</h2>
        <p className="text-sm text-blue-300 mt-1">
          Lender view: how PPA strike price and contracted volume % affect DSCR, LLCR, and stress resilience.
          150 MWp PV + 100 MWp Wind + 150 MWh BESS · Italy · 25-year project life.
        </p>
      </div>

      {/* ── Controls (linked to Assumptions) ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">PPA Parameters</h3>
          <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
            Synced with Assumptions · Location: <span className="font-semibold text-slate-600">{assumptions.city || zoneLabel}</span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">
              PPA Strike Price —{' '}
              <span className="text-blue-600 font-bold">€{strike}/MWh</span>
            </label>
            <input type="range" min={30} max={120} step={1} value={strike}
              onChange={e => onUpdate?.('ppaStrike', Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>€30</span><span>€75 base</span><span>€120</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">
              Contracted Volume —{' '}
              <span className="text-emerald-600 font-bold">{volPct}%</span>
              <span className="text-slate-400 font-normal"> ({100 - volPct}% merchant residual)</span>
            </label>
            <input type="range" min={0} max={100} step={5} value={volPct}
              onChange={e => onUpdate?.('ppaVolumePct', Number(e.target.value))}
              className="w-full accent-emerald-600 h-1.5" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0% (Merchant)</span><span>100% (Full PPA)</span>
            </div>
          </div>

          {/* Location is read-only here — set in Assumptions */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-500 mb-1">Active Location</p>
            <p className="text-base font-bold text-[#0f2444]">{assumptions.city || zoneLabel}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Zone {zone} · Price ×{ZONES[zone]?.priceMultiplier ?? 1} · Gen ×{ZONES[zone]?.genMultiplier ?? 1}
            </p>
            <p className="text-[10px] text-blue-500 mt-1">Change in Assumptions → Section 1</p>
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Min DSCR (PPA)',
            value: fmtX(baseMod.minDSCR),
            sub: 'Lender threshold: 1.25×',
            ok: baseMod.minDSCR >= LENDER_THRESHOLD,
            note: baseMod.minDSCR >= LENDER_THRESHOLD ? 'Passes covenant' : 'Below covenant',
          },
          {
            label: 'Avg DSCR (PPA)',
            value: fmtX(baseMod.avgDSCR),
            sub: `Over ${assumptions.debtTenor ?? 18}-yr debt tenor`,
            ok: baseMod.avgDSCR >= 1.40,
            note: `Headroom: ${fmt((baseMod.avgDSCR - LENDER_THRESHOLD) * 100, 0)} bps`,
          },
          {
            label: 'Min LLCR',
            value: fmtX(baseMod.minLLCR),
            sub: 'Lender threshold ~1.20×',
            ok: baseMod.minLLCR >= 1.20,
            note: baseMod.minLLCR >= 1.20 ? 'Passes covenant' : 'Below covenant',
          },
          {
            label: 'Break-even Strike',
            value: fmtEur(bep),
            sub: `At DSCR = 1.25× · ${volPct}% contracted`,
            ok: bep < strike,
            note: bep < strike ? `€${fmt(strike - bep, 1)}/MWh headroom` : `Need +€${fmt(bep - strike, 1)}/MWh`,
          },
        ].map(c => (
          <div key={c.label}
            className={`bg-white rounded-xl shadow-sm border p-4 ${c.ok ? 'border-emerald-200' : 'border-red-200'}`}>
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.ok ? 'text-emerald-600' : 'text-red-600'}`}>{c.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
            <p className={`text-[10px] font-medium mt-1 ${c.ok ? 'text-emerald-600' : 'text-red-600'}`}>{c.note}</p>
          </div>
        ))}
      </div>

      {/* ── DSCR time-series + comparison table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <ChartPanel
          className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 p-5"
          title="Annual DSCR — Strike Price Sensitivity"
          subtitle={`Base (€${strike}/MWh) vs ±20% shock · ${volPct}% contracted · ${zoneLabel}`}
          filename="ppa-dscr-strike-sensitivity"
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dscrSeries} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }}
                label={{ value: 'Project Year', position: 'insideBottom', offset: -4, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(1)}×`} domain={['auto', 'auto']} />
              <Tooltip content={<DscrTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <ReferenceLine y={1.25} stroke="#ef4444" strokeDasharray="5 3"
                label={{ value: '1.25× covenant', fontSize: 9, fill: '#ef4444', position: 'right' }} />
              <Line dataKey="Base" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
              <Line dataKey="−20% strike" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              <Line dataKey="+20% strike" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Structure Comparison</h3>
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left pb-2 text-slate-400 font-medium">Metric</th>
                {scenarioRows.map(s => (
                  <th key={s.id} className={`text-center pb-1 font-semibold px-1 ${s.headerCls}`}>
                    {s.label}
                  </th>
                ))}
              </tr>
              <tr>
                <td />
                {scenarioRows.map(s => (
                  <td key={s.id} className="text-center text-[9px] text-slate-400 px-1 pb-2">{s.sub}</td>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Project IRR',  fn: m => `${fmt(m.projectIRR, 1)}%` },
                { label: 'Equity IRR',   fn: m => `${fmt(m.equityIRR, 1)}%` },
                { label: 'DSCR min',     fn: m => dscrBadge(m.minDSCR), raw: true },
                { label: 'DSCR avg',     fn: m => fmtX(m.avgDSCR) },
                { label: 'LLCR min',     fn: m => fmtX(m.minLLCR) },
                { label: 'Rev. std dev', fn: m => `€${fmt(stdDev(m.rows.map(r => r.revenue)), 1)}M` },
              ].map(row => (
                <tr key={row.label} className="border-t border-slate-50">
                  <td className="py-2 pr-2 text-slate-500 font-medium whitespace-nowrap">{row.label}</td>
                  {scenarioRows.map(s => (
                    <td key={s.id} className="py-2 px-1 text-center text-slate-600">
                      {row.fn(s.m)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[9px] text-slate-400 mt-3">
            Finance params, CAPEX, and location all from Assumptions. FER Z uses Assumptions → Section 5 strike.
          </p>
        </div>
      </div>

      {/* ── Contracted volume sweep + stress test ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <ChartPanel
          title="Contracted Volume vs. Min DSCR"
          subtitle={`PPA coverage % · strike €${strike}/MWh · ${zoneLabel}`}
          filename="ppa-volume-vs-dscr"
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-5"
        >
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={volSweep} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="pct" tick={{ fontSize: 10 }}
                label={{ value: '% Contracted', position: 'insideBottom', offset: -4, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(2)}×`} />
              <Tooltip formatter={v => [`${Number(v).toFixed(3)}×`, 'Min DSCR']} />
              <ReferenceLine y={1.25} stroke="#ef4444" strokeDasharray="5 3"
                label={{ value: '1.25×', fontSize: 9, fill: '#ef4444', position: 'right' }} />
              <Line dataKey="minDSCR" name="Min DSCR" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Downside Resilience — Lender Stress Test</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">
            ±20% shocks to strike and/or merchant prices · {volPct}% contracted · {zoneLabel}
          </p>
          <table className="w-full text-xs mb-4">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-3 py-2 text-slate-500 font-medium">Scenario</th>
                <th className="text-center px-3 py-2 text-slate-500 font-medium">DSCR min</th>
                <th className="text-center px-3 py-2 text-slate-500 font-medium">DSCR avg</th>
                <th className="text-center px-3 py-2 text-slate-500 font-medium">Covenant</th>
              </tr>
            </thead>
            <tbody>
              {stressScenarios.map(s => (
                <tr key={s.label} className="border-t border-slate-50 hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 font-medium text-slate-700">{s.label}</td>
                  <td className={`px-3 py-2.5 text-center font-semibold ${dscrColor(s.minDSCR)}`}>
                    {fmtX(s.minDSCR)}
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{fmtX(s.avgDSCR)}</td>
                  <td className="px-3 py-2.5 text-center">
                    {s.breach
                      ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">BREACH</span>
                      : <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">PASS</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs">
              <span className="font-semibold text-blue-700">Break-even strike @ {volPct}% contracted:</span>{' '}
              <span className="font-bold text-blue-800">{fmtEur(bep)}</span>
              {bep < strike
                ? <span className="text-emerald-600 font-medium"> · €{fmt(strike - bep, 1)}/MWh headroom above current strike.</span>
                : <span className="text-red-600 font-medium"> · Current strike is €{fmt(bep - strike, 1)}/MWh below break-even.</span>
              }
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
              <span className="font-semibold">Note:</span> Debt params (LTV {assumptions.ltv}%, Kd {assumptions.kd}%,
              tenor {assumptions.debtTenor} yr) from Assumptions. Merchant shock applies to {100 - volPct}% uncovered volume.
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
