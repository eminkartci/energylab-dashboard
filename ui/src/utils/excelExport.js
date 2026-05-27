import ExcelJS from 'exceljs'
import { downloadBlob, sanitizeFilename, timestamp } from './download'

const METRICS = [
  { key: 'projectIRR', label: 'Project IRR (%)' },
  { key: 'equityIRR', label: 'Equity IRR (%)' },
  { key: 'minDSCR', label: 'Min DSCR (x)' },
  { key: 'minLLCR', label: 'Min LLCR (x)' },
  { key: 'projectNPV', label: 'Project NPV (EUR M)' },
  { key: 'equityNPV', label: 'Equity NPV (EUR M)' },
]

const ANNUAL_COLUMNS = [
  ['Year', 'y'],
  ['Revenue (EUR M)', 'revenue'],
  ['OPEX (EUR M)', 'opex'],
  ['EBITDA (EUR M)', 'ebitda'],
  ['EBITDA margin', 'ebitdaMargin'],
  ['Depreciation (EUR M)', 'dep'],
  ['EBIT (EUR M)', 'ebit'],
  ['EBT (EUR M)', 'ebt'],
  ['Tax (EUR M)', 'taxAmt'],
  ['Interest (EUR M)', 'interest'],
  ['Principal (EUR M)', 'principal'],
  ['Debt service (EUR M)', 'ds'],
  ['Opening debt (EUR M)', 'openDebt'],
  ['Closing debt (EUR M)', 'closeDebt'],
  ['CFADS (EUR M)', 'cfads'],
  ['DSCR (x)', 'dscr'],
  ['LLCR (x)', 'llcr'],
  ['Project FCF (EUR M)', 'projectFCF'],
  ['Equity FCF (EUR M)', 'equityFCF'],
  ['BESS replacement capex (EUR M)', 'capexInYear'],
  ['Terminal value (EUR M)', 'terminalValue'],
]

async function saveWorkbook(workbook, filenameBase) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, `${sanitizeFilename(filenameBase)}-${timestamp()}.xlsx`)
}

function styleHeaderRow(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2444' } }
  row.alignment = { vertical: 'middle', horizontal: 'center' }
}

function addKeyValueSheet(workbook, name, pairs) {
  const ws = workbook.addWorksheet(name.slice(0, 31))
  ws.columns = [{ width: 32 }, { width: 18 }]
  const header = ws.addRow(['Parameter', 'Value'])
  styleHeaderRow(header)
  pairs.forEach(([k, v]) => ws.addRow([k, v ?? '']))
  return ws
}

function addAnnualSheet(workbook, name, model) {
  const ws = workbook.addWorksheet(name.slice(0, 31))
  ws.addRow(ANNUAL_COLUMNS.map(([label]) => label)).eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2444' } }
  })
  model.rows.forEach(row => {
    ws.addRow(ANNUAL_COLUMNS.map(([, key]) => row[key] ?? ''))
  })
  ws.columns = ANNUAL_COLUMNS.map(() => ({ width: 16 }))
  return ws
}

function addKpiSheet(workbook, name, model, assumptions = {}) {
  const pairs = [
    ['Project IRR (%)', model.projectIRR],
    ['Equity IRR (%)', model.equityIRR],
    ['Project NPV (EUR M)', model.projectNPV],
    ['Equity NPV (EUR M)', model.equityNPV],
    ['Min DSCR (x)', model.minDSCR],
    ['Avg DSCR (x)', model.avgDSCR],
    ['Min LLCR (x)', model.minLLCR],
    ['Total CAPEX (EUR M)', model.totalCapex],
    ['Senior debt (EUR M)', model.seniorDebt],
    ['Equity investment (EUR M)', model.equityInv],
    ['WACC (%)', model.wacc],
    ['Annual generation (GWh)', model.annualGenGWh],
    ['City', assumptions.city],
    ['Zone', assumptions.zone],
    ['PV (MWp)', assumptions.pvMWp],
    ['Wind (MWp)', assumptions.windMWp],
    ['BESS (MWh)', assumptions.bessMWh],
  ]
  return addKeyValueSheet(workbook, name, pairs)
}

function addSweepSheet(workbook, name, sweepData) {
  const ws = workbook.addWorksheet(name.slice(0, 31))
  const header = ws.addRow(['Metric', ...sweepData.labels])
  styleHeaderRow(header)
  METRICS.forEach(({ key, label }) => {
    const arr = sweepData[key]
    if (!arr) return
    ws.addRow([label, ...arr])
  })
  ws.columns = [{ width: 22 }, ...sweepData.labels.map(() => ({ width: 12 }))]
  return ws
}

function addTableSheet(workbook, name, headers, rows) {
  const ws = workbook.addWorksheet(name.slice(0, 31))
  const header = ws.addRow(headers)
  styleHeaderRow(header)
  rows.forEach(r => ws.addRow(r))
  ws.columns = headers.map(() => ({ width: 14 }))
  return ws
}

function assumptionsPairs(assumptions) {
  return Object.entries(assumptions).map(([k, v]) => [k, v])
}

export async function exportAssumptionsWorkbook(assumptions, model) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Energy LAB Financial Model'
  addKeyValueSheet(wb, 'Assumptions', assumptionsPairs(assumptions))
  addKpiSheet(wb, 'Live KPIs', model, assumptions)
  await saveWorkbook(wb, 'energy-lab-assumptions')
}

export async function exportDashboardWorkbook({ model, assumptions, chartData, capexSlices }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Energy LAB Financial Model'
  addKpiSheet(wb, 'KPIs', model, assumptions)
  addTableSheet(
    wb,
    'Chart Data',
    ['Year', 'Revenue (EUR M)', 'EBITDA (EUR M)', 'Project FCF (EUR M)', 'Equity FCF (EUR M)', 'DSCR (x)', 'LLCR (x)'],
    chartData.map(d => [d.y, d.Revenue, d.EBITDA, d['Proj. FCF'], d['Eq. FCF'], d.DSCR, d.LLCR]),
  )
  addTableSheet(
    wb,
    'CAPEX Breakdown',
    ['Component', 'EUR M', 'Share (%)'],
    capexSlices.map(s => [s.name, s.value, +(s.value / model.totalCapex * 100).toFixed(1)]),
  )
  addAnnualSheet(wb, 'Annual Model', model)
  await saveWorkbook(wb, 'energy-lab-dashboard')
}

export async function exportFinancialModelWorkbook({ model, assumptions }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Energy LAB Financial Model'
  addKeyValueSheet(wb, 'Assumptions', assumptionsPairs(assumptions))
  addKpiSheet(wb, 'Summary KPIs', model, assumptions)
  addAnnualSheet(wb, 'Annual Cash Flow', model)
  await saveWorkbook(wb, 'energy-lab-financial-model')
}

export async function exportSensitivityWorkbook(sens, tabLabel) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Energy LAB Financial Model'
  addKpiSheet(wb, 'Base Case', sens.base, {})
  Object.entries(sens).forEach(([key, value]) => {
    if (key === 'base' || !value?.labels) return
    addSweepSheet(wb, key, value)
  })
  await saveWorkbook(wb, `energy-lab-sensitivity-${tabLabel}`)
}

export async function exportPPAWorkbook({
  assumptions,
  baseMod,
  dscrSeries,
  volSweep,
  scenarioRows,
  stressScenarios,
  bep,
}) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Energy LAB Financial Model'
  addKpiSheet(wb, 'PPA KPIs', baseMod, assumptions)
  addKeyValueSheet(wb, 'PPA Inputs', [
    ['PPA strike (EUR/MWh)', assumptions.ppaStrike],
    ['PPA volume (%)', assumptions.ppaVolumePct],
    ['Break-even strike (EUR/MWh)', bep],
    ['Lender DSCR threshold', 1.25],
  ])

  if (dscrSeries?.length) {
    const keys = Object.keys(dscrSeries[0]).filter(k => k !== 'year')
    addTableSheet(
      wb,
      'DSCR Strike Sensitivity',
      ['Year', ...keys],
      dscrSeries.map(row => [row.year, ...keys.map(k => row[k])]),
    )
  }

  if (volSweep?.length) {
    addTableSheet(
      wb,
      'Volume vs Min DSCR',
      ['Volume (%)', 'Min DSCR (x)', 'Rev std dev (EUR M)'],
      volSweep.map(row => [row.pct, row.minDSCR, row.revStd]),
    )
  }

  if (scenarioRows?.length) {
    addTableSheet(
      wb,
      'Structure Comparison',
      ['Metric', ...scenarioRows.map(s => s.label)],
      [
        ['Project IRR (%)', ...scenarioRows.map(s => s.m.projectIRR)],
        ['Equity IRR (%)', ...scenarioRows.map(s => s.m.equityIRR)],
        ['Min DSCR (x)', ...scenarioRows.map(s => s.m.minDSCR)],
        ['Avg DSCR (x)', ...scenarioRows.map(s => s.m.avgDSCR)],
        ['Min LLCR (x)', ...scenarioRows.map(s => s.m.minLLCR)],
      ],
    )
  }

  if (stressScenarios?.length) {
    addTableSheet(
      wb,
      'Stress Test',
      ['Scenario', 'Min DSCR (x)', 'Avg DSCR (x)', 'Covenant'],
      stressScenarios.map(s => [s.label, s.minDSCR, s.avgDSCR, s.breach ? 'BREACH' : 'PASS']),
    )
  }

  await saveWorkbook(wb, 'energy-lab-ppa-analysis')
}

export async function exportFullWorkbook({ model, assumptions, scenarios, sens }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Energy LAB Financial Model'
  addKeyValueSheet(wb, 'Assumptions', assumptionsPairs(assumptions))
  addKpiSheet(wb, 'Active Scenario', model, assumptions)
  addAnnualSheet(wb, 'Active Annual', model)

  if (scenarios) {
    ;[
      ['Merchant', scenarios.merchant],
      ['PPA', scenarios.ppa],
      ['FER Z', scenarios.ferz],
    ].forEach(([label, m]) => addKpiSheet(wb, `${label} KPIs`, m, assumptions))
  }

  if (sens) {
    ;[
      ['Merchant', sens.merchant],
      ['PPA', sens.ppa],
      ['FER Z', sens.ferz],
    ].forEach(([label, tab]) => {
      Object.entries(tab).forEach(([key, value]) => {
        if (key === 'base' || !value?.labels) return
        addSweepSheet(wb, `${label} ${key}`, value)
      })
    })
  }

  await saveWorkbook(wb, 'energy-lab-full-export')
}
