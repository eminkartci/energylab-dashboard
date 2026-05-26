// ─── Base assumptions (mirrors the Excel "Assumptions" sheet) ────────────────
export const BASE_ASSUMPTIONS = {
  // 1. Project Sizing & Location
  city: 'Palermo',
  zone: 'SICI',
  pvMWp: 150,
  windMWp: 100,
  bessMWh: 150,
  bessMW: 37.5,
  bessRTE: 87,           // % round-trip efficiency
  lifetime: 25,
  constructionYears: 2,
  bessReplacementYear: 13,
  generationBasis: 1,    // 1=P50, 2=P90
  pvP90P50: 92,          // %
  windP90P50: 90,        // %

  // 2. Capital Expenditure
  pvSpecificCapex: 1050,     // €/kWp
  windSpecificCapex: 1600,   // €/kWp
  bessSpecificCapex: 350,    // €/kWh
  gridBOPPct: 8.0,           // % of hardware
  devCostsPct: 3.0,          // % of hardware
  contingencyPct: 5.0,       // % of hard costs
  bessReplacementCostPct: 50, // % of original BESS capex

  // 3. Operating Expenditure
  opexPct: 2.5,          // % of total capex per year
  opexEscalation: 2.0,   // % CPI per year

  // 4. PPA / FER X
  ppaType: 0,            // 0=none, 1=vPPA/sPPA/PRS, 2=FER X
  ppaStrike: 65,         // €/MWh
  ppaDuration: 15,       // years
  ppaGrowth: 2.0,        // % per year (inflation-indexed)
  ppaStartYear: 2,
  ppaVolumePct: 60,      // % of PV+Wind output

  // 5. FER Z
  ferZEnabled: true,
  ferZStrike: 80,        // €/MWh (illustrative)
  ferZGrowth: 2.0,       // %
  ferZDuration: 20,      // years
  ferZStartYear: 2,
  ferZBaseloadPct: 3.0,  // % of installed capacity → 7.5 MW baseload
  ferZComplianceMin: 96, // % minimum compliance

  // 6. Project Finance
  ltv: 70,               // % Senior debt / total capex
  kd: 5.0,               // % cost of debt
  debtTenor: 18,         // years
  ke: 8.0,               // % cost of equity (hurdle)
  taxRate: 27,           // % IRES + IRAP
  wacc: 5.0,             // % WACC
  depPeriod: 12,         // years (fiscal straight-line)
  targetDSCR: 1.10,
  targetLLCR: 1.20,
  terminalValueEnabled: true,
  pvResidualPct: 5.0,    // % of PV capex
  bessResidualEurKWh: 20, // €/kWh at end of life
  windResidualPct: 2.0,  // %
  landResidual: 0,       // €M — Excel treats land as leased (no ownership residual)
  decommPVPct: 3.0,      // %
  decommBESSPct: 2.0,    // %
  decommWindPct: 6.0,    // %
}

// ─── Italian GME pricing zones ───────────────────────────────────────────────
// priceMultiplier: capture price relative to Sicilia base (= 1.00)
// genMultiplier:   annual MWh yield relative to Sicilia base (PV irr + wind CF combined 60/40)
export const ZONES = {
  NORD:  { label: 'Nord',        priceMultiplier: 0.86, genMultiplier: 0.77, regions: 'Piemonte, Valle d\'Aosta, Lombardia, Liguria, Trentino-AA, Veneto, FVG' },
  CNORD: { label: 'Centro-Nord', priceMultiplier: 0.90, genMultiplier: 0.83, regions: 'Emilia-Romagna, Toscana, Umbria, Marche' },
  CSUD:  { label: 'Centro-Sud',  priceMultiplier: 0.94, genMultiplier: 0.92, regions: 'Lazio, Abruzzo, Molise, Campania' },
  SUD:   { label: 'Sud',         priceMultiplier: 0.97, genMultiplier: 0.99, regions: 'Puglia, Basilicata, Calabria' },
  SICI:  { label: 'Sicilia',     priceMultiplier: 1.00, genMultiplier: 1.00, regions: 'Sicilia' },
  SARD:  { label: 'Sardegna',    priceMultiplier: 0.93, genMultiplier: 1.03, regions: 'Sardegna' },
}

// ─── City → GME zone mapping (all 107 Italian provincial capitals + major cities) ──
export const CITY_TO_ZONE = {
  // ── NORD ──
  Torino: 'NORD', Vercelli: 'NORD', Biella: 'NORD', Novara: 'NORD', Cuneo: 'NORD',
  Asti: 'NORD', Alessandria: 'NORD', Verbania: 'NORD', Aosta: 'NORD',
  Genova: 'NORD', Savona: 'NORD', Imperia: 'NORD', 'La Spezia': 'NORD',
  Milano: 'NORD', Varese: 'NORD', Como: 'NORD', Lecco: 'NORD', Sondrio: 'NORD',
  Bergamo: 'NORD', Brescia: 'NORD', Pavia: 'NORD', Lodi: 'NORD',
  Cremona: 'NORD', Mantova: 'NORD', Monza: 'NORD',
  Bolzano: 'NORD', Trento: 'NORD',
  Venezia: 'NORD', Verona: 'NORD', Vicenza: 'NORD', Padova: 'NORD',
  Belluno: 'NORD', Treviso: 'NORD', Rovigo: 'NORD',
  Trieste: 'NORD', Gorizia: 'NORD', Udine: 'NORD', Pordenone: 'NORD',
  // ── CENTRO-NORD ──
  Piacenza: 'CNORD', Parma: 'CNORD', 'Reggio Emilia': 'CNORD', Modena: 'CNORD',
  Bologna: 'CNORD', Ferrara: 'CNORD', Ravenna: 'CNORD', Forlì: 'CNORD', Rimini: 'CNORD',
  Massa: 'CNORD', Lucca: 'CNORD', Pistoia: 'CNORD', Firenze: 'CNORD', Prato: 'CNORD',
  Livorno: 'CNORD', Pisa: 'CNORD', Arezzo: 'CNORD', Siena: 'CNORD', Grosseto: 'CNORD',
  Perugia: 'CNORD', Terni: 'CNORD',
  Pesaro: 'CNORD', Ancona: 'CNORD', Macerata: 'CNORD', Fermo: 'CNORD', 'Ascoli Piceno': 'CNORD',
  // ── CENTRO-SUD ──
  Viterbo: 'CSUD', Rieti: 'CSUD', Roma: 'CSUD', Latina: 'CSUD', Frosinone: 'CSUD',
  "L'Aquila": 'CSUD', Teramo: 'CSUD', Pescara: 'CSUD', Chieti: 'CSUD',
  Campobasso: 'CSUD', Isernia: 'CSUD',
  Caserta: 'CSUD', Benevento: 'CSUD', Napoli: 'CSUD', Avellino: 'CSUD', Salerno: 'CSUD',
  // ── SUD ──
  Foggia: 'SUD', Bari: 'SUD', Taranto: 'SUD', Brindisi: 'SUD', Lecce: 'SUD', Barletta: 'SUD',
  Potenza: 'SUD', Matera: 'SUD',
  Cosenza: 'SUD', Crotone: 'SUD', Catanzaro: 'SUD', 'Vibo Valentia': 'SUD', 'Reggio Calabria': 'SUD',
  // ── SICILIA ──
  Palermo: 'SICI', Trapani: 'SICI', Agrigento: 'SICI', Caltanissetta: 'SICI', Enna: 'SICI',
  Catania: 'SICI', Ragusa: 'SICI', Siracusa: 'SICI', Messina: 'SICI',
  // ── SARDEGNA ──
  Cagliari: 'SARD', Oristano: 'SARD', Nuoro: 'SARD', Sassari: 'SARD', Carbonia: 'SARD',
}

// ─── 25-year annual financial data (FER Z base case from Excel vF) ───────────
// Arrays are indexed 0 = Y1, 1 = Y2, …, 24 = Y25
//
// ANNUAL_REVENUE stores implied merchant capture prices (scaled to BASE_GEN_MWH),
// back-calculated from the Excel FER Z base case revenues so that calc.js
// produces exact Excel revenues when the FER Z overlay is applied:
//   revenue = (mchMWh × capturePrice + blMWh × ferZStrike) / 1e6
// Y1 is pre-FER Z (pure merchant). Y22–Y25 are post-FER Z (pure merchant).
// Y2–Y21: capturePrice derived from Excel EBITDA+OPEX to ensure exact match.

export const ANNUAL_REVENUE = [
  54.408, 51.319, 54.806, 58.304, 61.775, 65.272, 68.782, 70.112,
  71.439, 72.793, 74.114, 75.459, 78.060, 80.673, 83.300, 85.932,
  88.531, 90.010, 91.499, 92.981, 94.424, 102.045, 102.327, 102.610, 102.892,
]

export const ANNUAL_OPEX = [
  10.781, 10.996, 11.216, 11.441, 11.670, 11.903, 12.141, 12.384,
  12.632, 12.884, 13.142, 13.405, 13.673, 13.946, 14.225, 14.510,
  14.800, 15.096, 15.398, 15.706, 16.020, 16.340, 16.667, 17.000, 17.340,
]

export const ANNUAL_EBITDA = [
  43.627, 38.297, 41.178, 44.057, 46.933, 49.808, 52.680, 53.694,
  54.706, 55.716, 56.723, 57.727, 59.835, 61.940, 64.043, 66.142,
  68.239, 69.357, 70.471, 71.582, 72.691, 85.705, 85.660, 85.609, 85.551,
]

export const ANNUAL_EBITDA_MARGIN = [
  80.2, 77.7, 78.6, 79.4, 80.1, 80.7, 81.3, 81.3,
  81.2, 81.2, 81.2, 81.2, 81.4, 81.6, 81.8, 82.0,
  82.2, 82.1, 82.1, 82.0, 81.9, 84.0, 83.7, 83.4, 83.1,
]

export const ANNUAL_DEPRECIATION = [
  35.936, 35.936, 35.936, 35.936, 35.936, 35.936,
  35.936, 35.936, 35.936, 35.936, 35.936, 35.936,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]

export const ANNUAL_EBIT = [
  7.691, 2.361, 5.242, 8.121, 10.997, 13.872, 16.744, 17.758,
  18.770, 19.780, 20.787, 21.791, 59.835, 61.940, 64.043, 66.142,
  68.239, 69.357, 70.471, 71.582, 72.691, 85.705, 85.660, 85.609, 85.551,
]

export const ANNUAL_EBT = [
  -7.402, -12.196, -8.752, -5.281, -1.784, 1.743, 5.300, 7.033,
  8.800, 10.602, 12.441, 14.320, 53.282, 56.350, 59.465, 62.626,
  65.838, 68.127, 70.471, 71.582, 72.691, 85.705, 85.660, 85.609, 85.551,
]

export const ANNUAL_TAX = [
  0, 0, 0, 0, 0, 0.471, 1.431, 1.899,
  2.376, 2.863, 3.359, 3.866, 14.386, 15.215, 16.055, 16.909,
  17.776, 18.394, 19.027, 19.327, 19.626, 23.140, 23.128, 23.115, 23.099,
]

export const ANNUAL_NET_INCOME = [
  -7.402, -12.196, -8.752, -5.281, -1.784, 1.272, 3.869, 5.134,
  6.424, 7.740, 9.082, 10.453, 38.896, 41.136, 43.409, 45.717,
  48.062, 49.733, 51.444, 52.255, 53.064, 62.565, 62.532, 62.495, 62.452,
]

// Index 0 = Y0, indexes 1..25 = Y1..Y25
export const PROJECT_FCF = [
  -431.235,
  41.551, 37.659, 39.763, 41.864, 43.964, 46.063, 48.159, 48.900,
  49.638, 50.375, 51.110, 51.844, 17.430, 45.216, 46.751, 48.284,
  49.815, 50.630, 51.444, 52.255, 53.064, 62.565, 62.532, 62.495, 61.157,
]

export const EQUITY_FCF = [
  -129.371,
  17.804, 12.473, 15.355, 18.234, 21.110, 23.514, 25.426, 25.972,
  26.507, 27.030, 27.540, 28.037, -6.624, 20.902, 22.164, 23.410,
  24.639, 25.139, 51.444, 52.255, 53.064, 62.565, 62.532, 62.495, 61.157,
]

export const OPENING_DEBT = [
  301.865, 291.134, 279.868, 268.038, 255.616, 242.574, 228.879, 214.500,
  199.401, 183.548, 166.902, 149.424, 131.071, 111.802, 91.568, 70.323,
  48.016, 24.594, 0, 0, 0, 0, 0, 0, 0,
]

export const CLOSING_DEBT = [
  291.134, 279.868, 268.038, 255.616, 242.574, 228.879, 214.500, 199.401,
  183.548, 166.902, 149.424, 131.071, 111.802, 91.568, 70.323, 48.016,
  24.594, 0, 0, 0, 0, 0, 0, 0, 0,
]

export const INTEREST_EXPENSE = [
  15.093, 14.557, 13.993, 13.402, 12.781, 12.129, 11.444, 10.725,
  9.970, 9.177, 8.345, 7.471, 6.554, 5.590, 4.578, 3.516,
  2.401, 1.230, 0, 0, 0, 0, 0, 0, 0,
]

export const TOTAL_DEBT_SERVICE = [
  25.823, 25.823, 25.823, 25.823, 25.823, 25.823, 25.823, 25.823,
  25.823, 25.823, 25.823, 25.823, 25.823, 25.823, 25.823, 25.823,
  25.823, 25.823, 0, 0, 0, 0, 0, 0, 0,
]

export const CFADS = [
  41.440, 36.109, 38.991, 41.870, 44.746, 47.150, 49.061, 49.608,
  50.143, 50.666, 51.176, 51.673, 45.449, 46.726, 47.988, 49.233,
  50.463, 50.962, 51.444, 52.255, 53.064, 62.565, 62.532, 62.495, 62.452,
]

export const DSCR = [
  1.61, 1.40, 1.51, 1.62, 1.73, 1.83, 1.90, 1.92,
  1.94, 1.96, 1.98, 2.00, 1.76, 1.81, 1.86, 1.91,
  1.95, 1.97, null, null, null, null, null, null, null,
]

export const LLCR = [
  1.78, 1.80, 1.83, 1.87, 1.89, 1.91, 1.92, 1.92,
  1.92, 1.91, 1.91, 1.89, 1.87, 1.90, 1.92, 1.94,
  1.96, 1.97, null, null, null, null, null, null, null,
]

export const BESS_REPLACEMENT_CAPEX = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  26.25, // Y13
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]

// ─── Base-case KPIs (FER Z base case from Excel vF) ─────────────────────────
export const BASE_KPIS = {
  totalCapex: 431.24,
  pvHardCapex: 157.50,
  windHardCapex: 160.00,
  bessHardCapex: 52.50,
  gridBOP: 29.60,
  devCosts: 11.10,
  contingency: 20.54,
  annualGenerationGWh: 467.46,
  y1Revenue: 54.41,
  y1EBITDA: 43.63,
  y1EBITDAMargin: 80.2,
  y1ProjectFCF: 41.55,
  y1EquityFCF: 17.80,
  seniorDebt: 301.86,
  ltv: 70.0,
  annualDebtService: 25.82,
  dscrY1: 1.60,
  dscrMin: 1.40,
  dscrAvg: 1.81,
  llcrY1: 1.78,
  llcrMin: 1.78,
  projectIRR: 9.4,
  equityIRR: 16.1,
  projectNPV: 230.04,
  equityNPV: 136.25,
  ferZCompliance: 100,
}

// ─── Sensitivity analysis data ───────────────────────────────────────────────
export const SENSITIVITY_MERCHANT = {
  priceVariation: {
    labels: ['- 20%', '- 10%', '- 5%', 'Base', '+ 5%', '+ 10%', '+ 20%'],
    projectIRR: [8.2, 9.7, 10.4, 11.1, 11.8, 12.4, 13.7],
    equityIRR:  [13.0, 16.9, 18.8, 20.7, 22.5, 24.3, 27.6],
    minDSCR:    [1.18, 1.39, 1.50, 1.60, 1.71, 1.82, 1.99],
    minLLCR:    [1.62, 1.85, 1.97, 2.08, 2.19, 2.30, 2.51],
    projectNPV: [160.03, 243.00, 284.01, 325.03, 366.05, 407.06, 489.10],
    equityNPV:  [82.68, 128.84, 181.02, 212.71, 243.87, 274.47, 334.59],
  },
  capexVariation: {
    labels: ['- 20%', '- 10%', '- 5%', 'Base', '+ 5%', '+ 10%', '+ 20%'],
    projectIRR: [14.3, 12.5, 11.8, 11.1, 10.4, 9.8, 8.7],
    equityIRR:  [29.2, 24.6, 22.6, 20.7, 18.9, 17.3, 14.3],
    minDSCR:    [2.07, 1.84, 1.72, 1.60, 1.50, 1.41, 1.25],
    minLLCR:    [2.62, 2.32, 2.19, 2.08, 1.97, 1.87, 1.70],
    projectNPV: [424.27, 374.65, 349.84, 325.03, 300.22, 275.41, 225.36],
    equityNPV:  [291.61, 253.17, 233.26, 212.71, 191.64, 170.17, 125.96],
  },
  costOfDebtVariation: {
    labels: ['- 20%', '- 10%', 'Base (5%)', '+ 10%', '+ 20%', 'Risky (8%)'],
    projectIRR: [11.1, 11.1, 11.1, 11.1, 11.1, 11.1],
    equityIRR:  [21.7, 21.2, 20.7, 20.2, 19.6, 17.3],
    minDSCR:    [1.74, 1.67, 1.60, 1.54, 1.49, 1.29],
    minLLCR:    [2.24, 2.16, 2.08, 2.00, 1.93, 1.68],
    projectNPV: [368.00, 346.08, 325.03, 304.81, 285.39, 214.92],
    equityNPV:  [226.92, 219.88, 212.71, 205.23, 197.46, 164.30],
  },
}

export const SENSITIVITY_PPA = {
  priceVariation: {
    labels: ['- 20%', '- 10%', '- 5%', 'Base', '+ 5%', '+ 10%', '+ 20%'],
    projectIRR: [7.4, 7.7, 7.9, 8.0, 8.2, 8.3, 8.7],
    equityIRR:  [10.0, 10.9, 11.4, 11.8, 12.3, 12.7, 13.6],
    minDSCR:    [1.02, 1.09, 1.12, 1.16, 1.20, 1.23, 1.30],
    minLLCR:    [1.33, 1.40, 1.44, 1.47, 1.51, 1.54, 1.61],
    projectNPV: [128.61, 145.87, 154.31, 162.61, 170.78, 178.87, 194.65],
    equityNPV:  [39.07, 54.77, 62.63, 70.39, 78.12, 85.76, 100.80],
  },
  capexVariation: {
    labels: ['- 20%', '- 10%', '- 5%', 'Base', '+ 5%', '+ 10%', '+ 20%'],
    projectIRR: [10.7, 9.3, 8.7, 8.0, 7.4, 6.9, 5.8],
    equityIRR:  [19.3, 15.3, 13.4, 11.8, 10.3, 9.0, 6.7],
    minDSCR:    [1.58, 1.35, 1.25, 1.16, 1.08, 1.01, 0.88],
    minLLCR:    [1.93, 1.68, 1.58, 1.47, 1.38, 1.30, 1.19],
    projectNPV: [263.34, 213.72, 188.56, 162.61, 135.94, 108.41, 49.22],
    equityNPV:  [163.27, 119.10, 95.09, 70.39, 45.31, 20.14, -30.20],
  },
  volumeVariation: {
    labels: ['- 20%', '- 10%', 'Base', '+ 10%', '+ 20%'],
    projectIRR: [8.7, 8.4, 8.0, 7.7, 7.3],
    equityIRR:  [13.7, 12.8, 11.8, 10.8, 9.8],
    minDSCR:    [1.28, 1.22, 1.16, 1.10, 1.03],
    minLLCR:    [1.62, 1.55, 1.47, 1.40, 1.31],
    projectNPV: [196.83, 180.02, 162.61, 144.22, 123.74],
    equityNPV:  [102.40, 86.70, 70.39, 53.33, 35.07],
  },
  costOfDebtVariation: {
    labels: ['- 20%', '- 10%', 'Base (5%)', '+ 10%', '+ 20%'],
    projectIRR: [8.0, 8.0, 8.0, 8.0, 8.0],
    equityIRR:  [12.9, 12.3, 11.8, 11.3, 10.7],
    minDSCR:    [1.26, 1.21, 1.16, 1.12, 1.07],
    minLLCR:    [1.60, 1.54, 1.47, 1.42, 1.36],
    projectNPV: [198.41, 180.13, 162.61, 145.83, 129.74],
    equityNPV:  [88.18, 79.40, 70.39, 61.21, 51.76],
  },
}

export const SENSITIVITY_FERZ = {
  strikeVariation: {
    labels: ['- 20%', '- 10%', '- 5%', 'Base (€80)', '+ 5%', '+ 10%', '+ 20%'],
    projectIRR: [9.2, 9.3, 9.4, 9.4, 9.5, 9.5, 9.6],
    equityIRR:  [15.5, 15.8, 15.9, 16.1, 16.2, 16.4, 16.6],
    minDSCR:    [1.36, 1.38, 1.39, 1.40, 1.41, 1.42, 1.44],
    minLLCR:    [1.75, 1.76, 1.77, 1.78, 1.79, 1.80, 1.82],
    projectNPV: [219.06, 224.55, 227.29, 230.04, 232.78, 235.53, 241.02],
    equityNPV:  [127.10, 131.68, 133.96, 136.25, 138.53, 140.82, 145.39],
  },
  capexVariation: {
    labels: ['- 20%', '- 10%', '- 5%', 'Base', '+ 5%', '+ 10%', '+ 20%'],
    projectIRR: [12.4, 10.8, 10.1, 9.4, 8.8, 8.2, 7.1],
    equityIRR:  [24.3, 19.9, 17.9, 16.1, 14.4, 12.9, 10.1],
    minDSCR:    [1.87, 1.61, 1.50, 1.40, 1.31, 1.22, 1.08],
    minLLCR:    [2.27, 2.00, 1.89, 1.78, 1.68, 1.59, 1.46],
    projectNPV: [329.28, 279.66, 254.85, 230.04, 205.23, 179.85, 127.37],
    equityNPV:  [220.44, 180.04, 158.38, 136.25, 113.67, 90.69, 42.79],
  },
  baseloadVariation: {
    labels: ['- 20%', '- 10%', 'Base (3%)', '+ 10%', '+ 20%'],
    projectIRR: [9.6, 9.5, 9.4, 9.3, 9.3],
    equityIRR:  [16.5, 16.3, 16.1, 15.9, 15.7],
    minDSCR:    [1.42, 1.41, 1.40, 1.39, 1.38],
    minLLCR:    [1.81, 1.79, 1.78, 1.77, 1.75],
    projectNPV: [238.69, 234.36, 230.04, 225.74, 221.47],
    equityNPV:  [143.13, 139.68, 136.25, 132.83, 129.43],
  },
  costOfDebtVariation: {
    labels: ['- 20%', '- 10%', 'Base (5%)', '+ 10%', '+ 20%'],
    projectIRR: [9.4, 9.4, 9.4, 9.4, 9.4],
    equityIRR:  [17.2, 16.6, 16.1, 15.5, 14.9],
    minDSCR:    [1.51, 1.45, 1.40, 1.35, 1.30],
    minLLCR:    [1.92, 1.85, 1.78, 1.72, 1.65],
    projectNPV: [267.95, 248.60, 230.04, 212.22, 195.11],
    equityNPV:  [151.95, 144.26, 136.25, 128.08, 119.62],
  },
}

// ─── PPA Analysis comparison matrix ─────────────────────────────────────────
export const PPA_DIMENSIONS = [
  'Settlement mechanism',
  'Price risk',
  'Volume risk',
  'Shape risk',
  'Basis risk',
  'Counterparty risk',
  'Regulatory risk',
  'Bankability',
  'Stacking with FER Z',
  'Typical contract term',
  'GME / GSE role',
  'Recommended use',
]

export const PPA_STRUCTURES = {
  vPPA: {
    label: 'vPPA (virtual CfD)',
    color: 'blue',
    data: {
      'Settlement mechanism': 'Financial — strike vs spot index (PUN)',
      'Price risk': { level: 'Low', note: 'strike stabilises revenue' },
      'Volume risk': { level: 'Medium', note: 'PV variability; notional may differ from actual' },
      'Shape risk': { level: 'Medium', note: 'capture rate erosion applies' },
      'Basis risk': { level: 'Medium', note: 'PUN vs zonal; MGP vs delivery' },
      'Counterparty risk': { level: 'Low–Med', note: 'financial intermediary, ISDA' },
      'Regulatory risk': { level: 'Low', note: 'established structure' },
      'Bankability': { level: 'Good', note: 'widely used; lenders comfortable' },
      'Stacking with FER Z': { level: 'Caution', note: 'double CfD settlement risk' },
      'Typical contract term': '10–20 years',
      'GME / GSE role': 'No direct role; private bilateral',
      'Recommended use': 'Large corporate offtakers; hedge without physical delivery',
    },
  },
  sPPA: {
    label: 'sPPA (physical)',
    color: 'emerald',
    data: {
      'Settlement mechanism': 'Physical delivery to offtaker at fixed price',
      'Price risk': { level: 'Very Low', note: 'fixed price, no market exposure' },
      'Volume risk': { level: 'Medium', note: 'must deliver contracted volume' },
      'Shape risk': { level: 'Low', note: 'offtaker bears shape risk' },
      'Basis risk': { level: 'Low', note: 'physical delivery; zonal price applies' },
      'Counterparty risk': { level: 'High', note: 'offtaker credit = key bankability driver' },
      'Regulatory risk': { level: 'Low', note: 'established structure' },
      'Bankability': { level: 'Best', note: 'simplest cash flow; preferred for debt sizing' },
      'Stacking with FER Z': { level: 'Compatible', note: 'FER Z adds on top of fixed price' },
      'Typical contract term': '10–20 years',
      'GME / GSE role': 'No direct role; private bilateral',
      'Recommended use': 'Preferred for project finance; simplest structure',
    },
  },
  PRS: {
    label: 'Proxy Revenue Swap',
    color: 'amber',
    data: {
      'Settlement mechanism': 'Revenue reference vs actual; partial compensation',
      'Price risk': { level: 'Medium', note: 'partial hedge only' },
      'Volume risk': { level: 'Med–High', note: 'reference based on modeled output' },
      'Shape risk': { level: 'High', note: 'capture erosion reduces actual vs reference' },
      'Basis risk': { level: 'Medium', note: 'index may not match project zone' },
      'Counterparty risk': { level: 'Medium', note: 'financial counterparty, mark-to-market' },
      'Regulatory risk': { level: 'Medium', note: 'niche; lender familiarity low in Italy' },
      'Bankability': { level: 'Emerging', note: 'requires lender education' },
      'Stacking with FER Z': { level: 'Compatible', note: 'FER Z provides floor on top of swap' },
      'Typical contract term': '5–15 years',
      'GME / GSE role': 'No direct role',
      'Recommended use': 'Supplement to market revenue; upside protection',
    },
  },
  FERZ: {
    label: 'FER Z CfD',
    color: 'violet',
    data: {
      'Settlement mechanism': 'Two-way CfD with GSE; portfolio-level programmable profile',
      'Price risk': { level: 'Low*', note: 'once operational; HIGH until tariff published' },
      'Volume risk': { level: 'Medium', note: 'portfolio basis; mix of assets' },
      'Shape risk': { level: 'Medium', note: 'BESS time-shifting reduces shape mismatch' },
      'Basis risk': { level: 'Low–Med', note: 'GSE national settlement' },
      'Counterparty risk': { level: 'Low', note: 'GSE / Italian state counterparty' },
      'Regulatory risk': { level: 'Very High', note: 'pending EU State Aid clearance' },
      'Bankability': { level: 'Forward-looking', note: 'cannot be base case until approved' },
      'Stacking with FER Z': { level: 'N/A', note: 'IS the FER Z mechanism' },
      'Typical contract term': 'Expected 20 years (FER X precedent)',
      'GME / GSE role': 'GSE administers auction and CfD settlement',
      'Recommended use': 'Portfolio-level market integration; post-approval',
    },
  },
}
