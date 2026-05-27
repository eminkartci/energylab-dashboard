import { CITY_TO_ZONE } from '../data'

/** Provincial capital & major city coordinates [lat, lng] — OpenStreetMap alignment */
export const CITY_COORDS = {
  Torino: [45.0703, 7.6869], Vercelli: [45.3205, 8.4194], Biella: [45.5668, 8.0534],
  Novara: [45.4469, 8.6218], Cuneo: [44.3841, 7.5427], Asti: [44.9008, 8.2065],
  Alessandria: [44.912, 8.615], Verbania: [45.921, 8.551], Aosta: [45.737, 7.320],
  Genova: [44.4056, 8.9463], Savona: [44.309, 8.481], Imperia: [43.889, 8.039],
  'La Spezia': [44.102, 9.824],
  Milano: [45.4642, 9.19], Varese: [45.820, 8.825], Como: [45.808, 9.085],
  Lecco: [45.856, 9.394], Sondrio: [46.170, 9.870], Bergamo: [45.698, 9.677],
  Brescia: [45.541, 10.212], Pavia: [45.185, 9.158], Lodi: [45.314, 9.503],
  Cremona: [45.133, 10.022], Mantova: [45.156, 10.792], Monza: [45.584, 9.274],
  Bolzano: [46.498, 11.355], Trento: [46.074, 11.121],
  Venezia: [45.440, 12.315], Verona: [45.438, 10.993], Vicenza: [45.546, 11.547],
  Padova: [45.406, 11.876], Belluno: [46.138, 12.217], Treviso: [45.666, 12.243],
  Rovigo: [45.071, 11.790], Trieste: [45.649, 13.776], Gorizia: [45.941, 13.622],
  Udine: [46.071, 13.234], Pordenone: [45.956, 12.660],
  Piacenza: [45.052, 9.693], Parma: [44.801, 10.328], 'Reggio Emilia': [44.698, 10.629],
  Modena: [44.647, 10.925], Bologna: [44.494, 11.342], Ferrara: [44.838, 11.619],
  Ravenna: [44.418, 12.203], Forlì: [44.222, 12.041], Rimini: [44.067, 12.569],
  Massa: [44.036, 10.142], Lucca: [43.843, 10.502], Pistoia: [43.933, 10.917],
  Firenze: [43.769, 11.255], Prato: [43.877, 11.102], Livorno: [43.548, 10.310],
  Pisa: [43.716, 10.401], Arezzo: [43.463, 11.879], Siena: [43.318, 11.331],
  Grosseto: [42.763, 11.113], Perugia: [43.112, 12.388], Terni: [42.563, 12.643],
  Pesaro: [43.909, 12.913], Ancona: [43.615, 13.518], Macerata: [43.300, 13.453],
  Fermo: [43.160, 13.718], 'Ascoli Piceno': [42.853, 13.575],
  Viterbo: [42.417, 12.104], Rieti: [42.404, 12.857], Roma: [41.902, 12.496],
  Latina: [41.467, 12.903], Frosinone: [41.640, 13.351],
  "L'Aquila": [42.350, 13.399], Teramo: [42.658, 13.704], Pescara: [42.461, 14.214],
  Chieti: [42.350, 14.167], Campobasso: [41.560, 14.660], Isernia: [41.589, 14.233],
  Caserta: [41.074, 14.332], Benevento: [41.129, 14.782], Napoli: [40.851, 14.268],
  Avellino: [40.914, 14.790], Salerno: [40.682, 14.768],
  Foggia: [41.462, 15.544], Bari: [41.117, 16.871], Taranto: [40.464, 17.247],
  Brindisi: [40.638, 17.945], Lecce: [40.351, 18.172], Barletta: [41.314, 16.281],
  Potenza: [40.639, 15.805], Matera: [40.666, 16.604],
  Cosenza: [39.310, 16.250], Crotone: [39.080, 17.127], Catanzaro: [38.909, 16.587],
  'Vibo Valentia': [38.676, 16.100], 'Reggio Calabria': [38.111, 15.661],
  Palermo: [38.1157, 13.3615], Trapani: [38.017, 12.536], Agrigento: [37.311, 13.576],
  Caltanissetta: [37.490, 14.062], Enna: [37.567, 14.279], Catania: [37.507, 15.083],
  Ragusa: [36.926, 14.725], Siracusa: [37.075, 15.286], Messina: [38.193, 15.554],
  Cagliari: [39.223, 9.121], Oristano: [39.903, 8.591], Nuoro: [40.321, 9.329],
  Sassari: [40.725, 8.555], Carbonia: [39.164, 8.521],
}

const ZONE_CENTROIDS = {
  NORD: [45.465, 9.19],
  CNORD: [44.494, 11.342],
  CSUD: [41.902, 12.496],
  SUD: [41.117, 16.871],
  SICI: [37.507, 14.0],
  SARD: [39.223, 9.121],
}

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function getCityCenter(city) {
  if (CITY_COORDS[city]) return CITY_COORDS[city]
  const zone = CITY_TO_ZONE[city] || 'SICI'
  const [lat, lng] = ZONE_CENTROIDS[zone]
  const h = hashString(city || 'Italy')
  return [lat + ((h % 40) - 20) * 0.015, lng + (((h >> 4) % 40) - 20) * 0.015]
}

/** Hybrid site layout: PV + Wind + BESS cluster with grid tie to city */
export function buildProjectSite(city, { pvMWp, windMWp, bessMWh }) {
  const cityCenter = getCityCenter(city)
  const [clat, clng] = cityCenter

  const scale = 0.008 + Math.min(pvMWp, 300) * 0.000015 + Math.min(windMWp, 200) * 0.00002
  const siteLat = clat - scale * 1.8
  const siteLng = clng + scale * 1.2

  const pv = [siteLat - scale * 0.35, siteLng - scale * 0.9]
  const wind = [siteLat + scale * 0.55, siteLng + scale * 0.75]
  const bess = [siteLat + scale * 0.05, siteLng - scale * 0.05]
  const grid = cityCenter

  const boundary = [
    [siteLat - scale * 0.6, siteLng - scale * 1.15],
    [siteLat - scale * 0.55, siteLng + scale * 1.05],
    [siteLat + scale * 0.85, siteLng + scale * 1.2],
    [siteLat + scale * 0.9, siteLng - scale * 0.95],
  ]

  return {
    cityCenter,
    center: [(siteLat + siteLat + scale * 0.85) / 2, (siteLng - scale * 1.15 + siteLng + scale * 1.2) / 2],
    boundary,
    assets: {
      pv: { position: pv, label: `PV ${pvMWp} MWp`, color: '#f59e0b' },
      wind: { position: wind, label: `Wind ${windMWp} MWp`, color: '#3b82f6' },
      bess: { position: bess, label: `BESS ${bessMWh} MWh`, color: '#10b981' },
      grid: { position: grid, label: 'Grid POI', color: '#8b5cf6' },
    },
    connections: [
      { from: pv, to: bess, type: 'dc/ac' },
      { from: wind, to: bess, type: 'ac' },
      { from: bess, to: grid, type: 'hv' },
    ],
    zoom: scale > 0.012 ? 13 : 14,
  }
}
