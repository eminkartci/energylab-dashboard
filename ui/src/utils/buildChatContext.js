import { buildModel } from '../calc'

const TAB_LABELS = {
  dashboard: 'Dashboard',
  assumptions: 'Assumptions',
  financial: 'Financial Model',
  sensitivity: 'Sensitivity',
  ppa: 'PPA Analysis',
  scenarios: 'Scenarios',
  compare: 'Compare',
  credits: 'Credits',
}

function summariseModel(model) {
  return {
    projectIRR: +model.projectIRR.toFixed(2),
    equityIRR: +model.equityIRR.toFixed(2),
    projectNPV_EUR_M: +model.projectNPV.toFixed(1),
    equityNPV_EUR_M: +model.equityNPV.toFixed(1),
    minDSCR: +model.minDSCR.toFixed(2),
    avgDSCR: +model.avgDSCR.toFixed(2),
    minLLCR: +model.minLLCR.toFixed(2),
    totalCapex_EUR_M: +model.totalCapex.toFixed(1),
    seniorDebt_EUR_M: +model.seniorDebt.toFixed(1),
    equityInv_EUR_M: +model.equityInv.toFixed(1),
    wacc_pct: +model.wacc.toFixed(2),
    annualGen_GWh: model.annualGenGWh,
    y1Revenue_EUR_M: model.rows[0] ? +model.rows[0].revenue.toFixed(2) : null,
    y1EBITDA_EUR_M: model.rows[0] ? +model.rows[0].ebitda.toFixed(2) : null,
  }
}

export function describeRevenueStructure(assumptions) {
  if (assumptions.ferZEnabled) {
    return `FER Z CfD (€${assumptions.ferZStrike}/MWh · ${assumptions.ferZBaseloadPct}% baseload)`
  }
  if (assumptions.ppaType > 0) {
    return `PPA (${assumptions.ppaVolumePct}% @ €${assumptions.ppaStrike}/MWh)`
  }
  return 'Merchant (100% variable)'
}

export function formatContextSummary(context) {
  const { workspace, activeModel, structureComparison, savedScenarios, currentView } = context
  const rev = workspace.revenueStructure
  const sz = workspace.sizing
  let structure = 'Merchant (100% variable)'
  if (rev.ferZEnabled) {
    structure = `FER Z CfD (€${rev.ferZStrike_EUR_MWh}/MWh · ${sz.ferZBaseloadPct}% baseload)`
  } else if (rev.ppaType > 0) {
    structure = `PPA (${rev.ppaVolume_pct}% @ €${rev.ppaStrike_EUR_MWh}/MWh)`
  }
  return {
    scenario: workspace.activeScenarioName,
    unsaved: workspace.assumptionsChanged,
    page: currentView,
    structure,
    location: `${workspace.location.city} · ${workspace.location.zone}`,
    sizing: `${workspace.sizing.pvMWp} MWp PV · ${workspace.sizing.windMWp} MWp Wind · ${workspace.sizing.bessMWh} MWh BESS`,
    finance: `LTV ${workspace.finance.ltv_pct}% · Kd ${workspace.finance.kd_pct}% · ${workspace.finance.debtTenor_years}yr`,
    kpis: [
      { label: 'Project IRR', value: `${activeModel.projectIRR}%` },
      { label: 'Equity IRR', value: `${activeModel.equityIRR}%` },
      { label: 'Min DSCR', value: `${activeModel.minDSCR}×` },
      { label: 'Min LLCR', value: `${activeModel.minLLCR}×` },
      { label: 'Project NPV', value: `€${activeModel.projectNPV_EUR_M}M` },
      { label: 'Total CAPEX', value: `€${activeModel.totalCapex_EUR_M}M` },
    ],
    structures: [
      { label: 'Merchant', irr: structureComparison.merchant.projectIRR, dscr: structureComparison.merchant.minDSCR },
      { label: 'PPA', irr: structureComparison.ppa.projectIRR, dscr: structureComparison.ppa.minDSCR },
      { label: 'FER Z', irr: structureComparison.ferZ.projectIRR, dscr: structureComparison.ferZ.minDSCR },
    ],
    savedCount: savedScenarios.length,
  }
}

export function buildBankabilityContext({
  activeTab,
  assumptions,
  model,
  scenarios,
  activeScenarioName,
  assumptionsChanged,
  savedScenarios = [],
}) {
  const savedSummaries = savedScenarios.map(record => {
    const m = buildModel(record.assumptions)
    return {
      name: record.name,
      city: record.assumptions.city,
      zone: record.assumptions.zone,
      ...summariseModel(m),
    }
  })

  return {
    app: 'PV/Wind/BESS Financial Model — Italy (FER X / FER Z)',
    disclaimer: 'FER Z tariffs are illustrative. Not for investment decisions.',
    currentView: TAB_LABELS[activeTab] || activeTab,
    workspace: {
      activeScenarioName: activeScenarioName || 'Unsaved workspace',
      assumptionsChanged: !!assumptionsChanged,
      location: {
        city: assumptions.city,
        zone: assumptions.zone,
      },
      sizing: {
        pvMWp: assumptions.pvMWp,
        windMWp: assumptions.windMWp,
        bessMWh: assumptions.bessMWh,
        bessRTE_pct: assumptions.bessRTE,
        ferZBaseloadPct: assumptions.ferZBaseloadPct,
      },
      finance: {
        ltv_pct: assumptions.ltv,
        kd_pct: assumptions.kd,
        ke_pct: assumptions.ke,
        debtTenor_years: assumptions.debtTenor,
        taxRate_pct: assumptions.taxRate,
      },
      revenueStructure: {
        ppaType: assumptions.ppaType,
        ppaStrike_EUR_MWh: assumptions.ppaStrike,
        ppaVolume_pct: assumptions.ppaVolumePct,
        ferZEnabled: assumptions.ferZEnabled,
        ferZStrike_EUR_MWh: assumptions.ferZStrike,
      },
    },
    activeModel: summariseModel(model),
    structureComparison: {
      merchant: summariseModel(scenarios.merchant),
      ppa: summariseModel(scenarios.ppa),
      ferZ: summariseModel(scenarios.ferz),
    },
    savedScenarios: savedSummaries,
    bankabilityBenchmarks: {
      minDSCR_covenant: 1.10,
      lenderDSCR_threshold: 1.25,
      minLLCR_covenant: 1.20,
      equityHurdle_pct: assumptions.ke,
    },
  }
}

export function buildSystemPrompt(context) {
  return `You are a senior project finance advisor specialising in Italian renewable energy (PV, wind, BESS) bankability.

Use ONLY the JSON context provided by the app for numeric facts. If data is missing, say so clearly.
Explain metrics in plain language (DSCR, LLCR, IRR, NPV, CFADS, PPA strike, FER Z).
Assess bankability vs typical lender thresholds in the context.
Compare Merchant vs PPA vs FER Z structures using structureComparison when relevant.
Compare saved scenarios when the user asks about other cases.
Highlight key risks (merchant exposure, DSCR headroom, LLCR, leverage, BESS replacement, zone/price).
Respond in English.
Do not invent tariffs or claim FER Z is final regulation.
Keep answers structured and concise unless the user asks for detail.

Current model context JSON:
${JSON.stringify(context, null, 2)}`
}
