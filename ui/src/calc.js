import { ANNUAL_REVENUE, ZONES } from './data'

// ─── Constants ───────────────────────────────────────────────────────────────
const BASE_PV_MWP   = 150
const BASE_WIND_MWP = 100
const BASE_BESS_MWH = 150
const BASE_GEN_MWH  = 462_730   // annual generation at base capacity
const PV_GEN_SHARE  = 0.60      // PV generates ~60% at Palermo
const WIND_GEN_SHARE = 0.40

// BESS RTE calibration (derived from Excel Merchant vs FER Z dispatch):
// Merchant export 462.7 GWh vs FER Z 467.5 GWh → 4.8 GWh net loss from arbitrage cycling
// Implied charge throughput = 4.8 GWh / (1 − 0.87) ≈ 36,900 MWh → 246 cycles × 150 MWh
const BASE_BESS_RTE    = 0.87
const BESS_ANNUAL_CYCLES = 246  // full cycles per year at base 150 MWh capacity (Merchant mode)

// Base average capture prices (€/MWh) derived from model revenue / generation
const BASE_CAPTURE_PRICE = ANNUAL_REVENUE.map(r => (r * 1e6) / BASE_GEN_MWH)

// ─── NPV ─────────────────────────────────────────────────────────────────────
export function npv(rate, cashflows) {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0)
}

// ─── IRR via Newton-Raphson ──────────────────────────────────────────────────
export function irr(cashflows) {
  let rate = 0.10
  for (let i = 0; i < 500; i++) {
    let f  = 0
    let df = 0
    cashflows.forEach((cf, t) => {
      const d = Math.pow(1 + rate, t)
      f  += cf / d
      df -= t * cf / (d * (1 + rate))
    })
    if (Math.abs(df) < 1e-12) break
    const next = rate - f / df
    if (Math.abs(next - rate) < 1e-9) return next
    rate = next
  }
  return rate
}

// ─── Annuity payment (level-debt service) ────────────────────────────────────
function annuity(principal, rate, periods) {
  if (rate === 0) return principal / periods
  return principal * (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1)
}

// ─── Full financial model ─────────────────────────────────────────────────────
export function buildModel(a) {
  const {
    pvMWp, windMWp, bessMWh,
    bessRTE, generationBasis, pvP90P50, windP90P50,
    pvSpecificCapex, windSpecificCapex, bessSpecificCapex,
    gridBOPPct, devCostsPct, contingencyPct, bessReplacementCostPct,
    opexPct, opexEscalation,
    ppaType, ppaStrike, ppaDuration, ppaGrowth, ppaStartYear, ppaVolumePct,
    ferZEnabled, ferZStrike, ferZGrowth, ferZDuration, ferZStartYear, ferZBaseloadPct,
    ltv, kd, debtTenor, ke, taxRate, depPeriod,
    bessReplacementYear, terminalValueEnabled,
    pvResidualPct, bessResidualEurKWh, windResidualPct, landResidual,
    decommPVPct, decommBESSPct, decommWindPct,
  } = normalise(a)

  // ── CAPEX ──────────────────────────────────────────────────────────────────
  const pvHard   = pvMWp   * 1000 * pvSpecificCapex   / 1e6  // MWp → kWp → €M
  const windHard = windMWp * 1000 * windSpecificCapex / 1e6  // MWp → kWp → €M
  const bessHard = bessMWh * 1000 * bessSpecificCapex  / 1e6 // MWh → kWh → €M
  const hardware = pvHard + windHard + bessHard
  const gridBOP  = hardware * (gridBOPPct / 100)
  const devCosts = hardware * (devCostsPct / 100)
  const contingency = (hardware + gridBOP + devCosts) * (contingencyPct / 100)
  const totalCapex = hardware + gridBOP + devCosts + contingency

  // ── Zone calibration ──────────────────────────────────────────────────────
  const zone = ZONES[a.zone] ?? ZONES.SICI

  // ── P50 / P90 generation basis (matches Excel "Generation factor PV/Wind") ─
  // P90 = conservative: PV × pvP90P50% + Wind × windP90P50%, weighted by gen share
  const genBasisScale = generationBasis === 2
    ? PV_GEN_SHARE * ((pvP90P50 ?? 92) / 100) + WIND_GEN_SHARE * ((windP90P50 ?? 90) / 100)
    : 1.0

  // ── Revenue scaling ────────────────────────────────────────────────────────
  const capScale = PV_GEN_SHARE * (pvMWp / BASE_PV_MWP) + WIND_GEN_SHARE * (windMWp / BASE_WIND_MWP)
  const scaledGenMWh = BASE_GEN_MWH * capScale * zone.genMultiplier * genBasisScale

  // ── BESS RTE pre-computation ──────────────────────────────────────────────
  // Annual charge throughput scales with BESS capacity vs base (246 cycles × 150 MWh)
  const bessRteFrac      = (bessRTE ?? 87) / 100
  const bessChargeMWh    = bessMWh * BESS_ANNUAL_CYCLES  // MWh charged per year

  // ── BESS replacement ───────────────────────────────────────────────────────
  const bessRepCost   = bessHard * (bessReplacementCostPct / 100)
  const bessAnnualRes = bessRepCost / bessReplacementYear

  // ── Debt ───────────────────────────────────────────────────────────────────
  const seniorDebt = totalCapex * (ltv / 100)
  const equityInv  = totalCapex - seniorDebt
  const kdFrac     = kd / 100
  const annDS      = annuity(seniorDebt, kdFrac, debtTenor)

  // ── Terminal value ─────────────────────────────────────────────────────────
  let tv = 0
  if (terminalValueEnabled) {
    const pvRes    = pvHard   * (pvResidualPct   / 100)
    const windRes  = windHard * (windResidualPct / 100)
    const bessRes  = bessMWh  * 1000 * bessResidualEurKWh / 1e6  // MWh → kWh
    const decomPV  = pvHard   * (decommPVPct   / 100)
    const decomBESS = bessHard * (decommBESSPct / 100)
    const decomWind = windHard * (decommWindPct / 100)
    tv = pvRes + windRes + bessRes + (landResidual || 0) - decomPV - decomBESS - decomWind
  }

  // ── Annual rows ────────────────────────────────────────────────────────────
  let openDebt = seniorDebt
  const rows = []

  for (let y = 1; y <= 25; y++) {
    const i = y - 1  // 0-based

    // Revenue
    const capturePrice = BASE_CAPTURE_PRICE[i] * zone.priceMultiplier * (a.merchantPriceAdj ?? 1)

    // BESS RTE adjustment: base revenue array was computed at 87% RTE.
    // ΔRevenue = charge_throughput × (new_RTE − base_RTE) × avg_discharge_price.
    // Applied proportionally to each scenario's merchant component only.
    const bessRteAdj = (bessRteFrac - BASE_BESS_RTE) * bessChargeMWh * capturePrice / 1e6

    let revenue
    if (ppaType > 0 && y >= ppaStartYear && y < ppaStartYear + ppaDuration) {
      const ppaYr  = y - ppaStartYear
      const strike = ppaStrike * Math.pow(1 + ppaGrowth / 100, ppaYr)
      const ppaVol = scaledGenMWh * (ppaVolumePct / 100)
      const mchVol = scaledGenMWh * (1 - ppaVolumePct / 100)
      // BESS arbitrages only the merchant residual share
      revenue = (ppaVol * strike + mchVol * capturePrice) / 1e6
             + bessRteAdj * (1 - ppaVolumePct / 100)
    } else if (ferZEnabled && y >= ferZStartYear && y < ferZStartYear + ferZDuration) {
      const ferYr  = y - ferZStartYear
      const strike = ferZStrike * Math.pow(1 + ferZGrowth / 100, ferYr)
      const blMW   = (pvMWp + windMWp) * (ferZBaseloadPct / 100)
      const blMWh  = blMW * 8760
      const mchMWh = Math.max(0, scaledGenMWh - blMWh)
      // FER Z BESS mainly smooths for baseload (Excel: ~31 cycles vs 246 for Merchant = 12.6%)
      revenue = (blMWh * strike + mchMWh * capturePrice) / 1e6 + bessRteAdj * 0.126
    } else {
      // Pure merchant: full BESS arbitrage cycling
      revenue = scaledGenMWh * capturePrice / 1e6 + bessRteAdj
    }

    // OPEX
    const opex = totalCapex * (opexPct / 100) * Math.pow(1 + opexEscalation / 100, i)
    const ebitda = revenue - opex

    // Depreciation
    const capexForDep = totalCapex + (y > bessReplacementYear ? bessRepCost : 0)
    const dep = y <= depPeriod ? (totalCapex / depPeriod) : 0

    // Debt schedule
    const interest  = y <= debtTenor ? openDebt * kdFrac : 0
    const principal = y <= debtTenor ? Math.min(openDebt, annDS - interest) : 0
    const ds        = interest + principal
    const closeDebt = Math.max(0, openDebt - principal)

    // Tax
    const ebit   = ebitda - dep
    const ebt    = ebit - interest
    const taxAmt = Math.max(0, ebt) * (taxRate / 100)

    // BESS replacement capex this year
    const capexInYear = y === bessReplacementYear ? bessRepCost : 0

    // CFADS (cash flow available for debt service)
    const reserve = y < bessReplacementYear ? bessAnnualRes : 0
    const cfads = ebitda - taxAmt - reserve

    // FCF
    const projectFCF = ebitda - taxAmt - capexInYear
    const equityFCF  = projectFCF - ds

    rows.push({
      y, revenue, opex, ebitda,
      ebitdaMargin: revenue > 0 ? ebitda / revenue : 0,
      dep, ebit, ebt, taxAmt,
      interest, principal, ds, openDebt, closeDebt,
      cfads, dscr: ds > 0 ? cfads / ds : null,
      projectFCF, equityFCF,
      capexInYear,
    })

    openDebt = closeDebt
  }

  // Attach terminal value to Y25 row so the table can display it
  rows[rows.length - 1].terminalValue = tv

  // ── Streams ────────────────────────────────────────────────────────────────
  const pFCF = [-totalCapex, ...rows.map(r => r.projectFCF)]
  const eFCF = [-equityInv,  ...rows.map(r => r.equityFCF)]
  pFCF[25] += tv
  eFCF[25] += tv

  // ── Metrics ────────────────────────────────────────────────────────────────
  const waccFrac = (ke / 100) * (1 - ltv / 100) + (kd / 100) * (ltv / 100) * (1 - taxRate / 100)
  const keFrac   = ke   / 100

  const projectNPV = npv(waccFrac, pFCF)
  const equityNPV  = npv(keFrac,   eFCF)
  const projectIRR = irr(pFCF)
  const equityIRR  = irr(eFCF)

  const dscrValues  = rows.filter(r => r.dscr !== null).map(r => r.dscr)
  const minDSCR     = Math.min(...dscrValues)
  const avgDSCR     = dscrValues.reduce((a, b) => a + b, 0) / dscrValues.length

  const llcrValues  = computeLLCR(rows, seniorDebt, kdFrac, debtTenor)
  const minLLCR     = Math.min(...llcrValues.filter(v => v !== null))

  // Attach LLCR to each row so the table can display it inline
  rows.forEach((r, i) => { r.llcr = llcrValues[i] })

  return {
    // Capex breakdown
    totalCapex, pvHard, windHard, bessHard, hardware, gridBOP, devCosts, contingency,
    seniorDebt, equityInv, annDS,
    // Annual rows
    rows,
    // Cash-flow streams (index 0 = Y0)
    pFCF, eFCF,
    // KPIs
    projectNPV, equityNPV,
    wacc: waccFrac * 100,
    projectIRR: projectIRR * 100,
    equityIRR:  equityIRR  * 100,
    minDSCR, avgDSCR, llcrValues, minLLCR,
    annualGenGWh: (scaledGenMWh / 1e3).toFixed(2),
    tv,
  }
}

// ─── LLCR helper ─────────────────────────────────────────────────────────────
function computeLLCR(rows, seniorDebt, kdFrac, debtTenor) {
  return rows.map((r, i) => {
    if (r.y > debtTenor || r.openDebt < 1e-6) return null
    const remaining = rows.slice(i).filter(rr => rr.y <= debtTenor)
    const pvCfads = remaining.reduce((sum, rr, j) => sum + rr.cfads / Math.pow(1 + kdFrac, j + 1), 0)
    return pvCfads / r.openDebt
  })
}

// ─── Normalise: handle both %-stored and fraction inputs ─────────────────────
function normalise(a) {
  return { ...a }
}
