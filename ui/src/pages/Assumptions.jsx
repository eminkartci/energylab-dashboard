import { useState } from 'react'
import { CITY_TO_ZONE, ZONES } from '../data'
import ExportButton from '../components/ExportButton'
import { exportAssumptionsWorkbook } from '../utils/excelExport'

// ─── SVG icon set (Heroicons 2 outline, 24×24 viewBox) ────────────────────────
function IconMapPin({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}
function IconBuilding({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}
function IconWrench({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  )
}
function IconDocument({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}
function IconBolt({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}
function IconBank({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
  )
}
function IconChevronDown({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}
function IconInfo({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}
function IconWarning({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}

// ─── Reusable field components ────────────────────────────────────────────────
function Field({ label, note, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
        {label}
      </label>
      {children}
      {note && <p className="text-[10px] text-slate-400 leading-relaxed">{note}</p>}
    </div>
  )
}

function NumInput({ value, onChange, min, max, step = 0.1, unit }) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={value}
        min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all tabular-nums hover:border-slate-300"
      />
      {unit && <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">{unit}</span>}
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${value ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all hover:border-slate-300 cursor-pointer"
    >
      {Object.entries(options).map(([k, v]) => (
        <option key={k} value={k}>{v}</option>
      ))}
    </select>
  )
}

// ─── City dropdown ─────────────────────────────────────────────────────────────
const CITIES_BY_ZONE = Object.entries(ZONES).map(([zoneKey, zoneData]) => ({
  zoneKey,
  label: zoneData.label,
  cities: Object.entries(CITY_TO_ZONE)
    .filter(([, z]) => z === zoneKey)
    .map(([c]) => c)
    .sort(),
}))

function CityInput({ city, onCityChange, onZoneChange }) {
  function handleChange(e) {
    const val = e.target.value
    onCityChange(val)
    onZoneChange(CITY_TO_ZONE[val])
  }
  const zone = CITY_TO_ZONE[city]
  const zoneData = zone ? ZONES[zone] : null
  return (
    <div className="sm:col-span-2 space-y-1.5">
      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
        Project location
      </label>
      <div className="flex gap-2 items-stretch">
        <div className="flex-1">
          <select
            value={city}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all hover:border-slate-300 cursor-pointer"
          >
            {CITIES_BY_ZONE.map(({ zoneKey, label, cities }) => (
              <optgroup key={zoneKey} label={`${label} · ${zoneKey}`}>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        {zoneData && (
          <div className="flex flex-col justify-center px-3 py-1.5 bg-[#0f2444]/5 border border-[#0f2444]/10 rounded-lg text-center whitespace-nowrap">
            <span className="text-xs font-bold text-[#0f2444]">{zone}</span>
            <span className="text-[10px] text-slate-500">{zoneData.label}</span>
          </div>
        )}
      </div>
      {zoneData && (
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Price ×{zoneData.priceMultiplier.toFixed(2)} · Generation ×{zoneData.genMultiplier.toFixed(2)} vs Sicilia · {zoneData.regions}
        </p>
      )}
    </div>
  )
}

// ─── Accordion Section ────────────────────────────────────────────────────────
function Section({ num, title, Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.04)]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50/60 transition-colors group"
      >
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200/80 transition-colors flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-slate-500" />
        </span>
        <span className="font-semibold text-slate-700 text-sm tracking-tight flex-1 text-left">
          {title}
        </span>
        <span className="text-[10px] font-mono font-bold text-slate-300 mr-1 tabular-nums">
          {String(num).padStart(2, '0')}
        </span>
        <IconChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Derived CAPEX summary ────────────────────────────────────────────────────
function CapexSummary({ model }) {
  const rows = [
    { label: 'PV hard capex',        value: model.pvHard,      indent: true },
    { label: 'Wind hard capex',       value: model.windHard,    indent: true },
    { label: 'BESS hard capex',       value: model.bessHard,    indent: true },
    { label: 'Grid connection / BOP', value: model.gridBOP,     indent: true },
    { label: 'Development costs',     value: model.devCosts,    indent: true },
    { label: 'Contingency',           value: model.contingency, indent: true },
    { label: 'TOTAL CAPEX',           value: model.totalCapex,  bold: true },
    { label: 'Senior debt',           value: model.seniorDebt,  sub: true },
    { label: 'Equity investment',     value: model.equityInv,   sub: true },
  ]
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
        Computed CAPEX
      </p>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className={`flex justify-between items-baseline gap-2 ${
            r.bold
              ? 'font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2 text-sm'
              : r.sub
              ? 'text-slate-400 text-[11px] pl-2'
              : 'text-slate-600 text-xs'
          }`}>
            <span className="truncate">{r.label}</span>
            <span className={`font-mono tabular-nums flex-shrink-0 ${r.bold ? '' : 'text-slate-500'}`}>
              €{r.value.toFixed(1)}M
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Assumptions Page ────────────────────────────────────────────────────
export default function Assumptions({ assumptions: a, onUpdate: u, model }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportButton
          label="Download assumptions Excel"
          onExport={() => exportAssumptionsWorkbook(a, model)}
        />
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-200/60 rounded-xl px-5 py-3.5 text-sm text-blue-800">
        <IconInfo className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <span>
          <strong className="font-semibold">Live recalculation</strong> — changes update the Dashboard and Financial Model in real time.
          Revenue is scaled from the base Palermo/Sicilia merchant dispatch profile.
          The PPA and FER Z supplements are approximate (full-precision dispatch requires the Excel model).
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 space-y-3">

          {/* Section 1 */}
          <Section num={1} title="Project Sizing & Location" Icon={IconMapPin}>
            <CityInput
              city={a.city}
              onCityChange={v => u('city', v)}
              onZoneChange={v => u('zone', v)}
            />
            <Field label="PV installed capacity" note="DC nameplate capacity">
              <NumInput value={a.pvMWp} onChange={v => u('pvMWp', v)} min={10} max={500} step={10} unit="MWp" />
            </Field>
            <Field label="Wind installed capacity" note="AC nameplate capacity">
              <NumInput value={a.windMWp} onChange={v => u('windMWp', v)} min={0} max={400} step={10} unit="MWp" />
            </Field>
            <Field label="BESS energy capacity" note="Usable energy capacity">
              <NumInput value={a.bessMWh} onChange={v => u('bessMWh', v)} min={0} max={500} step={10} unit="MWh" />
            </Field>
            <Field label="BESS power rating" note="C-rate = MW/MWh">
              <NumInput value={a.bessMW} onChange={v => u('bessMW', v)} min={0} max={200} step={0.5} unit="MW" />
            </Field>
            <Field label="BESS round-trip efficiency">
              <NumInput value={a.bessRTE} onChange={v => u('bessRTE', v)} min={60} max={98} step={0.5} unit="%" />
            </Field>
            <Field label="Project lifetime">
              <NumInput value={a.lifetime} onChange={v => u('lifetime', v)} min={10} max={35} step={1} unit="years" />
            </Field>
            <Field label="BESS replacement year">
              <NumInput value={a.bessReplacementYear} onChange={v => u('bessReplacementYear', v)} min={5} max={20} step={1} unit="year" />
            </Field>
            <Field label="Generation basis" note="P50 = expected; P90 = conservative">
              <Select value={a.generationBasis} onChange={v => u('generationBasis', v)}
                options={{ 1: 'P50 (base case)', 2: 'P90 (conservative)' }} />
            </Field>
            <Field label="PV P90 / P50 ratio">
              <NumInput value={a.pvP90P50} onChange={v => u('pvP90P50', v)} min={70} max={99} step={1} unit="%" />
            </Field>
            <Field label="Wind P90 / P50 ratio">
              <NumInput value={a.windP90P50} onChange={v => u('windP90P50', v)} min={70} max={99} step={1} unit="%" />
            </Field>
          </Section>

          {/* Section 2 */}
          <Section num={2} title="Capital Expenditure" Icon={IconBuilding}>
            <Field label="PV specific capex">
              <NumInput value={a.pvSpecificCapex} onChange={v => u('pvSpecificCapex', v)} min={500} max={2000} step={50} unit="€/kWp" />
            </Field>
            <Field label="Onshore wind specific capex">
              <NumInput value={a.windSpecificCapex} onChange={v => u('windSpecificCapex', v)} min={800} max={3000} step={50} unit="€/kWp" />
            </Field>
            <Field label="BESS specific capex">
              <NumInput value={a.bessSpecificCapex} onChange={v => u('bessSpecificCapex', v)} min={100} max={800} step={10} unit="€/kWh" />
            </Field>
            <Field label="Grid connection & BOP" note="% of hardware capex">
              <NumInput value={a.gridBOPPct} onChange={v => u('gridBOPPct', v)} min={2} max={20} step={0.5} unit="%" />
            </Field>
            <Field label="Development costs" note="Permitting, legal, financing">
              <NumInput value={a.devCostsPct} onChange={v => u('devCostsPct', v)} min={1} max={10} step={0.5} unit="%" />
            </Field>
            <Field label="Contingency" note="Standard project-finance allowance">
              <NumInput value={a.contingencyPct} onChange={v => u('contingencyPct', v)} min={1} max={15} step={0.5} unit="%" />
            </Field>
            <Field label="BESS replacement cost" note="% of original BESS hard capex (Y13 default)">
              <NumInput value={a.bessReplacementCostPct} onChange={v => u('bessReplacementCostPct', v)} min={20} max={80} step={5} unit="%" />
            </Field>
          </Section>

          {/* Section 3 */}
          <Section num={3} title="Operating Expenditure" Icon={IconWrench}>
            <Field label="OpEx (% of total CAPEX / yr)" note="O&M, insurance, land lease">
              <NumInput value={a.opexPct} onChange={v => u('opexPct', v)} min={0.5} max={5} step={0.1} unit="%" />
            </Field>
            <Field label="OpEx escalation (CPI)" note="Annual cost inflation">
              <NumInput value={a.opexEscalation} onChange={v => u('opexEscalation', v)} min={0} max={5} step={0.1} unit="%" />
            </Field>
          </Section>

          {/* Section 4 */}
          <Section num={4} title="PPA Structure / FER X Incentive" Icon={IconDocument} defaultOpen={false}>
            <Field label="PPA type" note="0 = no PPA / pure merchant">
              <Select value={a.ppaType} onChange={v => u('ppaType', v)}
                options={{ 0: 'Merchant only', 1: 'PPA (sPPA / vPPA)', 2: 'FER X (Gov. CfD via GSE)' }} />
            </Field>
            <Field label="PPA / FER X strike price" note="Negotiated strike (nominally flat real)">
              <NumInput value={a.ppaStrike} onChange={v => u('ppaStrike', v)} min={20} max={150} step={1} unit="€/MWh" />
            </Field>
            <Field label="Contract duration">
              <NumInput value={a.ppaDuration} onChange={v => u('ppaDuration', v)} min={5} max={20} step={1} unit="years" />
            </Field>
            <Field label="Strike tariff growth rate" note="Inflation-indexed">
              <NumInput value={a.ppaGrowth} onChange={v => u('ppaGrowth', v)} min={0} max={5} step={0.1} unit="%" />
            </Field>
            <Field label="PPA start year (relative to ops)">
              <NumInput value={a.ppaStartYear} onChange={v => u('ppaStartYear', v)} min={1} max={5} step={1} unit="year" />
            </Field>
            <Field label="PPA volume" note="% of PV + Wind output under contract">
              <NumInput value={a.ppaVolumePct} onChange={v => u('ppaVolumePct', v)} min={10} max={100} step={5} unit="%" />
            </Field>
          </Section>

          {/* Section 5 */}
          <Section num={5} title="FER Z Incentive: ILLUSTRATIVE (pending EU State Aid)" Icon={IconBolt} defaultOpen={false}>
            <div className="col-span-full">
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200/70 rounded-lg px-4 py-3 text-xs text-amber-800 mb-1">
                <IconWarning className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold">Disclaimer:</strong> FER Z tariffs are illustrative. Reference strike not yet published.
                  First auctions expected no earlier than mid-2026. Model is for academic scenario analysis only.
                </span>
              </div>
            </div>
            <Field label="FER Z enabled">
              <div className="flex items-center gap-2.5 mt-1">
                <Toggle value={a.ferZEnabled} onChange={v => u('ferZEnabled', v)} />
                <span className="text-sm font-medium text-slate-600">{a.ferZEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </Field>
            <Field label="FER Z CfD strike tariff" note="Illustrative">
              <NumInput value={a.ferZStrike} onChange={v => u('ferZStrike', v)} min={40} max={150} step={1} unit="€/MWh" />
            </Field>
            <Field label="Strike growth rate (inflation)">
              <NumInput value={a.ferZGrowth} onChange={v => u('ferZGrowth', v)} min={0} max={5} step={0.1} unit="%" />
            </Field>
            <Field label="FER Z contract term">
              <NumInput value={a.ferZDuration} onChange={v => u('ferZDuration', v)} min={10} max={25} step={1} unit="years" />
            </Field>
            <Field label="FER Z start year">
              <NumInput value={a.ferZStartYear} onChange={v => u('ferZStartYear', v)} min={1} max={5} step={1} unit="year" />
            </Field>
            <Field label="Baseload obligation" note="% of installed PV+Wind capacity per hour">
              <NumInput value={a.ferZBaseloadPct} onChange={v => u('ferZBaseloadPct', v)} min={1} max={10} step={0.5} unit="%" />
            </Field>
            <Field label="Min. compliance rate" note="Below this triggers breach penalty">
              <NumInput value={a.ferZComplianceMin} onChange={v => u('ferZComplianceMin', v)} min={80} max={99} step={1} unit="%" />
            </Field>
          </Section>

          {/* Section 6 */}
          <Section num={6} title="Project Finance Structure" Icon={IconBank}>
            <Field label="Debt share (LTV)" note="Senior debt / total CAPEX">
              <NumInput value={a.ltv} onChange={v => u('ltv', v)} min={30} max={85} step={1} unit="%" />
            </Field>
            <Field label="Cost of debt (Kd)" note="Fixed-rate senior term loan">
              <NumInput value={a.kd} onChange={v => u('kd', v)} min={2} max={12} step={0.25} unit="%" />
            </Field>
            <Field label="Debt tenor" note="Typical Italian renewable PF tenor">
              <NumInput value={a.debtTenor} onChange={v => u('debtTenor', v)} min={8} max={22} step={1} unit="years" />
            </Field>
            <Field label="Cost of equity (Ke)" note="Required equity IRR / hurdle rate">
              <NumInput value={a.ke} onChange={v => u('ke', v)} min={4} max={20} step={0.25} unit="%" />
            </Field>
            <Field label="Tax rate (IRES + IRAP)" note="Combined Italian corporate tax">
              <NumInput value={a.taxRate} onChange={v => u('taxRate', v)} min={15} max={40} step={0.5} unit="%" />
            </Field>
            <Field label="WACC" note="Auto-calculated: Ke × (1−LTV) + Kd × LTV × (1−tax)">
              <div className="mt-1 px-3 py-2 bg-slate-100 rounded-lg text-sm font-semibold text-slate-700 w-28 text-right">
                {model?.wacc?.toFixed(3) ?? '—'} %
              </div>
            </Field>
            <Field label="Depreciation period (fiscal)" note="Italian straight-line ~9%/yr">
              <NumInput value={a.depPeriod} onChange={v => u('depPeriod', v)} min={5} max={20} step={1} unit="years" />
            </Field>
            <Field label="Terminal value">
              <div className="flex items-center gap-2.5 mt-1">
                <Toggle value={a.terminalValueEnabled} onChange={v => u('terminalValueEnabled', v)} />
                <span className="text-sm font-medium text-slate-600">{a.terminalValueEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </Field>
            <Field label="PV residual (% of PV capex)">
              <NumInput value={a.pvResidualPct} onChange={v => u('pvResidualPct', v)} min={0} max={20} step={0.5} unit="%" />
            </Field>
            <Field label="BESS residual value">
              <NumInput value={a.bessResidualEurKWh} onChange={v => u('bessResidualEurKWh', v)} min={0} max={100} step={1} unit="€/kWh" />
            </Field>
            <Field label="Wind residual (% of wind capex)">
              <NumInput value={a.windResidualPct} onChange={v => u('windResidualPct', v)} min={0} max={15} step={0.5} unit="%" />
            </Field>
            <Field label="Decommissioning PV">
              <NumInput value={a.decommPVPct} onChange={v => u('decommPVPct', v)} min={0} max={10} step={0.5} unit="%" />
            </Field>
            <Field label="Decommissioning BESS">
              <NumInput value={a.decommBESSPct} onChange={v => u('decommBESSPct', v)} min={0} max={10} step={0.5} unit="%" />
            </Field>
            <Field label="Decommissioning Wind">
              <NumInput value={a.decommWindPct} onChange={v => u('decommWindPct', v)} min={0} max={15} step={0.5} unit="%" />
            </Field>
          </Section>

        </div>

        {/* ── Sticky sidebar ── */}
        <div className="xl:col-span-1">
          <div className="sticky top-4 space-y-3">
            <CapexSummary model={model} />

            {/* Live KPIs */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Live KPIs
              </p>
              <div className="space-y-2.5">
                {[
                  { label: 'Project IRR',  value: `${model.projectIRR.toFixed(1)}%`, ok: model.projectIRR >= 5 },
                  { label: 'Equity IRR',   value: `${model.equityIRR.toFixed(1)}%`,  ok: model.equityIRR >= a.ke },
                  { label: 'Project NPV',  value: `€${model.projectNPV.toFixed(0)}M`, ok: model.projectNPV > 0 },
                  { label: 'Equity NPV',   value: `€${model.equityNPV.toFixed(0)}M`,  ok: model.equityNPV > 0 },
                  { label: 'Min DSCR',     value: `${model.minDSCR.toFixed(2)}×`,    ok: model.minDSCR >= 1.10 },
                  { label: 'Min LLCR',     value: `${model.minLLCR.toFixed(2)}×`,    ok: model.minLLCR >= 1.20 },
                ].map(kpi => (
                  <div key={kpi.label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{kpi.label}</span>
                    <span className={`text-xs font-semibold font-mono tabular-nums ${kpi.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                      {kpi.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
