import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildProjectSite } from '../data/cityCoordinates'
import { ZONES } from '../data'

function assetIcon(type, color) {
  const icons = {
    pv: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="4" fill="${color}"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
    wind: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path fill="${color}" d="M12 2C8 8 6 12 12 12c6 0 4-4 0-10z"/><path d="M12 12v10M8 22h8"/></svg>`,
    bess: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="4" y="7" width="14" height="10" rx="2" fill="${color}"/><path d="M20 10v4M7 10h2M7 14h2"/></svg>`,
    grid: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path fill="${color}" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  }
  return L.divIcon({
    className: 'project-map-icon',
    html: `<div style="background:${color};width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid white">${icons[type]}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })
}

function MapViewSync({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 })
  }, [map, center[0], center[1], zoom])
  return null
}

export default function ProjectSiteMap({
  city,
  zone,
  pvMWp,
  windMWp,
  bessMWh,
  zoomBoost = 0,
  mapHeight = 220,
}) {
  const site = useMemo(
    () => buildProjectSite(city || 'Palermo', { pvMWp, windMWp, bessMWh }),
    [city, pvMWp, windMWp, bessMWh],
  )

  const zoneLabel = zone ? ZONES[zone]?.label : null
  const mapCenter = site.center
  const mapZoom = site.zoom + zoomBoost
  const connectionLines = site.connections.map(c => [c.from, c.to])

  const markers = [
    { key: 'pv', ...site.assets.pv, iconType: 'pv' },
    { key: 'wind', ...site.assets.wind, iconType: 'wind' },
    { key: 'bess', ...site.assets.bess, iconType: 'bess' },
    { key: 'grid', ...site.assets.grid, iconType: 'grid' },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-500">Project site map</p>
          <p className="text-sm font-semibold text-slate-800">
            {city || '—'}
            {zoneLabel && <span className="text-slate-400 font-normal"> · GME {zone} ({zoneLabel})</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> PV</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Wind</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> BESS</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Grid</span>
        </div>
      </div>

      <div className="w-full relative z-0" style={{ height: mapHeight }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={false}
          className="h-full w-full"
          attributionControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewSync center={mapCenter} zoom={mapZoom} />

          <Polygon
            positions={site.boundary}
            pathOptions={{
              color: '#0f2444',
              weight: 2,
              fillColor: '#3b82f6',
              fillOpacity: 0.08,
              dashArray: '6 4',
            }}
          />

          {connectionLines.map((line, i) => (
            <Polyline
              key={i}
              positions={line}
              pathOptions={{
                color: '#64748b',
                weight: 2,
                opacity: 0.75,
                dashArray: i === 2 ? undefined : '4 6',
              }}
            />
          ))}

          {markers.map(m => (
            <Marker
              key={m.key}
              position={m.position}
              icon={assetIcon(m.iconType, m.color)}
            >
              <Popup>
                <span className="text-xs font-semibold">{m.label}</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-50">
        Illustrative layout near {city} — project boundary and asset positions are schematic, not survey-grade.
      </p>
    </div>
  )
}
