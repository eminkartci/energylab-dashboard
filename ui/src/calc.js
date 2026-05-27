import { ANNUAL_REVENUE, ANNUAL_FER_Z_MARKET_PRICE, ZONES } from './data'

// ─── Constants ───────────────────────────────────────────────────────────────
const BASE_PV_MWP   = 150
const BASE_WIND_MWP = 100
const BASE_BESS_MWH = 150
const BASE_GEN_MWH      = 462_730   // annual generation at base capacity (Merchant)
const BASE_FER_Z_GEN_MWH = 467_457  // FER Z dispatch: fewer BESS RTE losses → more net export
const PV_GEN_SHARE  = 0.60      // PV generates ~60% at Palermo
const WIND_GEN_SHARE = 0.40

// BESS RTE calibration (vF source: FER_Z_PV_BESS_Financial_Model_vF.xlsx):
// Excel Inputs C48 = 90% RTE. ANNUAL_REVENUE Merchant series baked at 90% RTE.
// 246 cycles/year at 150 MWh = 36,900 MWh charge throughput (Merchant arbitrage).
const BASE_BESS_RTE    = 0.90
const BESS_ANNUAL_CYCLES = 246  // full cycles per year at base 150 MWh capacity (Merchant mode)

// PPA dispatch (Excel PPA/FER X Dispatch Strategy sheet, Y2 base year, 87% BESS RTE):
// 60% of gross renewable gen → PPA offtaker; BESS arbitrages only the 40% merchant portion.
// Analytical formula back-calculated so that:
//   Y2  revenue = 43.1 M (ppaVolumePct=60, strike=65)
//   Y16 revenue = 64.2 M (ppaVolumePct=60, strike=85.77)
//   volumeVariation targets match Excel ±0.04 pp IRR (relative ±20% of base ppaVolumePct)
const BASE_PPA_GROSS_GEN    = 468_322  // MWh: total gross renewable gen in PPA dispatch
const PPA_BESS_NET_LOSS     =   4_690  // MWh: BESS net loss (charge − discharge) at 87% RTE dispatch
const PPA_BASE_PRICE_ALPHA  =  0.94949 // flat market price / Merchant capturePrice (same year)
const PPA_BESS_ARB_MWH      =  19_858  // BESS arb value normalized to unit capturePrice (MWh-equiv)

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
  const bessAnnualRes = bessRepCost / (bessReplacementYear - 1)

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

    // BESS RTE adjustment: base revenue array (ANNUAL_REVENUE) was calibrated at 90% RTE.
    // ΔRevenue = charge_throughput × (new_RTE − 90%) × capturePrice.
    // At default bessRTE=90% this term is zero; non-zero only in RTE sensitivity sweeps.
    const bessRteAdj = (bessRteFrac - BASE_BESS_RTE) * bessChargeMWh * capturePrice / 1e6

    let revenue
    if (ppaType > 0 && y >= ppaStartYear && y < ppaStartYear + ppaDuration) {
      const ppaYr  = y - ppaStartYear
      const strike = ppaStrike * Math.pow(1 + ppaGrowth / 100, ppaYr)
      // Analytical PPA dispatch: BESS arbitrage concentrated on (1-p) merchant fraction.
      // ppaMchPrice derived from decomposing capturePrice into flat market + BESS uplift,
      // applying BESS arb only to merchant MWh. Constants back-calculated from Excel dispatch.
      const p           = ppaVolumePct / 100
      const mchGrossBase = BASE_PPA_GROSS_GEN * (1 - p)  // unscaled gross merchant
      const ppaMchPrice  = capturePrice
                         * (mchGrossBase * PPA_BASE_PRICE_ALPHA + PPA_BESS_ARB_MWH)
                         / (mchGrossBase - PPA_BESS_NET_LOSS)
      const ppaVol = BASE_PPA_GROSS_GEN * p * capScale * zone.genMultiplier * genBasisScale
      const mchVol = (mchGrossBase - PPA_BESS_NET_LOSS) * capScale * zone.genMultiplier * genBasisScale
      revenue = (ppaVol * strike + mchVol * ppaMchPrice) / 1e6
             + bessRteAdj * (1 - p)
    } else if (ferZEnabled && y >= ferZStartYear && y < ferZStartYear + ferZDuration) {
      // Excel convention: first delivery year (Y2) = ferYr 1, so strike = ferZStrike × (1+g)^1
      const ferYr  = y - ferZStartYear + 1
      const strike = ferZStrike * Math.pow(1 + ferZGrowth / 100, ferYr)
      const blMW   = (pvMWp + windMWp) * (ferZBaseloadPct / 100)
      const blMWh  = blMW * 8760
      // FER Z dispatch generates more than Merchant (fewer BESS RTE losses — BESS smooths, not arbitrages)
      const ferZGenMWh = BASE_FER_Z_GEN_MWH * capScale * zone.genMultiplier * genBasisScale
      const mchMWh = Math.max(0, ferZGenMWh - blMWh)
      // Market price for surplus: flat GME price, no BESS arbitrage uplift
      const ferZMarketPrice = ANNUAL_FER_Z_MARKET_PRICE[i] * zone.priceMultiplier * (a.merchantPriceAdj ?? 1)
      revenue = (blMWh * strike + mchMWh * ferZMarketPrice) / 1e6
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
    // Levered tax (EBT-based): used for CFADS, P&L, and equity FCF
    const taxAmt = Math.max(0, ebt) * (taxRate / 100)
    // Unlevered tax (EBIT-based): used for project FCF / project IRR only
    const taxAmtProject = Math.max(0, ebit) * (taxRate / 100)

    // BESS replacement capex this year
    const capexInYear = y === bessReplacementYear ? bessRepCost : 0

    // CFADS (cash flow available for debt service)
    const reserve = y < bessReplacementYear ? bessAnnualRes : 0
    const cfads = ebitda - taxAmt - reserve

    // FCF — project uses unlevered tax; equity uses levered tax (decoupled)
    const projectFCF = ebitda - taxAmtProject - capexInYear
    const equityFCF  = ebitda - taxAmt - capexInYear - ds

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
