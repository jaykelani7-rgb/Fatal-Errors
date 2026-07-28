import { useState, useCallback } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

interface Incident {
  id: string
  code: string
  label: string
  type: 'EXCHANGE' | 'SURVEILLANCE' | 'CONTACT' | 'DISPOSAL' | 'SAFEHOUSE'
  lat: number
  lng: number
  date: string
  status: 'CONFIRMED' | 'UNCONFIRMED' | 'CLASSIFIED'
  agent: string
  notes: string
}

const INCIDENTS: Incident[] = [
  { id: 'I-001', code: 'ALPHA-7', label: 'Harbor Drop', type: 'EXCHANGE', lat: 40.7023, lng: -74.0156, date: '1974-03-04', status: 'CONFIRMED', agent: 'UNIT-7', notes: 'Package transferred at pier 17. Contact departed north.' },
  { id: 'I-002', code: 'BRAVO-2', label: 'Canal St. Contact', type: 'CONTACT', lat: 40.7185, lng: -74.0015, date: '1974-03-07', status: 'CONFIRMED', agent: 'UNIT-3', notes: 'V. Markov observed meeting E. Cross for approx 11 min.' },
  { id: 'I-003', code: 'CHARLIE-9', label: 'North Bridge Tail', type: 'SURVEILLANCE', lat: 40.7282, lng: -73.9942, date: '1974-03-09', status: 'UNCONFIRMED', agent: 'UNIT-7', notes: 'Subject lost at bridge junction. Possible counter-surveillance.' },
  { id: 'I-004', code: 'DELTA-1', label: 'Iron Gate Depot', type: 'DISPOSAL', lat: 40.7128, lng: -74.0060, date: '1974-03-11', status: 'CLASSIFIED', agent: 'UNIT-9', notes: 'REDACTED — OMEGA CLEARANCE REQUIRED.' },
  { id: 'I-005', code: 'ECHO-4', label: 'East Warehouse', type: 'SAFEHOUSE', lat: 40.7061, lng: -73.9969, date: '1974-03-13', status: 'CONFIRMED', agent: 'UNIT-3', notes: 'Safehouse confirmed active. Entry/exit logged x4 over 72 hrs.' },
  { id: 'I-006', code: 'FOXTROT-6', label: 'Fulton Approach', type: 'CONTACT', lat: 40.7093, lng: -74.0070, date: '1974-03-15', status: 'UNCONFIRMED', agent: 'UNIT-7', notes: 'Unidentified third party present. Identity under review.' },
]

const TYPE_SYMBOL: Record<Incident['type'], string> = {
  EXCHANGE: '✕',
  SURVEILLANCE: '◎',
  CONTACT: '+',
  DISPOSAL: '▲',
  SAFEHOUSE: '■',
}

const STATUS_COLOR: Record<Incident['status'], string> = {
  CONFIRMED: '#000',
  UNCONFIRMED: '#666',
  CLASSIFIED: '#000',
}

export default function MapView() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const initialViewState = {
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 13,
  }

  const activeIncident = INCIDENTS.find((i) => i.id === activeId) ?? null

  const handleMarkerClick = useCallback((id: string) => {
    setActiveId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Strip header */}
      <div
        className="border-b-2 border-black px-6 py-2 flex items-center justify-between flex-shrink-0"
        style={{ fontFamily: 'var(--font-mono)', background: '#F4F4F0' }}
      >
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase">OPERATIONAL GRID — LOWER MANHATTAN SECTOR</span>
        <span className="text-[10px] tracking-widest opacity-60">REF: OP-NIGHTFALL / {INCIDENTS.length} INCIDENTS LOGGED</span>
        <span className="text-[10px] font-bold tracking-widest">COORD: 40.7128°N 74.0060°W</span>
      </div>

      {/* Map + sidebar layout */}
      <div className="flex-1 flex min-h-0">
        {/* Map */}
        <div className="flex-1 relative min-h-0">
          {/* Brutalist filter */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{ mixBlendMode: 'multiply', background: 'rgba(244,244,240,0.08)' }}
          />
          <div
            className="absolute inset-0"
            style={{ filter: 'grayscale(100%) sepia(20%) contrast(1.05)' }}
          >
            <Map
              initialViewState={initialViewState}
              style={{ width: '100%', height: '100%' }}
              mapStyle="https://tiles.openfreemap.org/styles/positron"
              onClick={() => setActiveId(null)}
            >
              <NavigationControl position="bottom-right" showCompass={false} />

              {INCIDENTS.map((inc) => (
                <Marker
                  key={inc.id}
                  longitude={inc.lng}
                  latitude={inc.lat}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation()
                    handleMarkerClick(inc.id)
                  }}
                >
                  <div className="relative group" style={{ cursor: 'pointer' }}>
                    {/* Outer pulse ring on active */}
                    {activeId === inc.id && (
                      <div
                        className="absolute inset-0 -m-2 border-2 border-black animate-ping"
                        style={{ borderRadius: 0 }}
                      />
                    )}
                    {/* Marker body */}
                    <div
                      className="flex items-center justify-center border-2 border-black w-7 h-7 transition-transform"
                      style={{
                        background: activeId === inc.id ? '#000' : '#F4F4F0',
                        color: activeId === inc.id ? '#F4F4F0' : STATUS_COLOR[inc.status],
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        fontWeight: '700',
                        boxShadow: activeId === inc.id ? '3px 3px 0 #000' : '2px 2px 0 rgba(0,0,0,0.4)',
                        transform: activeId === inc.id ? 'scale(1.15)' : 'scale(1)',
                        lineHeight: 1,
                        userSelect: 'none',
                      }}
                    >
                      {TYPE_SYMBOL[inc.type]}
                    </div>
                  </div>
                </Marker>
              ))}
            </Map>
          </div>

          {/* Tooltip */}
          {activeIncident && (
            <div
              className="absolute z-20 border-4 border-black bg-[#F4F4F0] pointer-events-none"
              style={{
                top: 24,
                left: 24,
                width: 260,
                boxShadow: '6px 6px 0 #000',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {/* Tooltip header */}
              <div className="border-b-2 border-black px-3 py-2 flex items-center justify-between bg-black">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#F4F4F0]">
                  {activeIncident.code}
                </span>
                <span
                  className="text-[8px] tracking-widest px-1.5 py-0.5 border border-[#F4F4F0] text-[#F4F4F0]"
                  style={{ opacity: 0.8 }}
                >
                  {activeIncident.status}
                </span>
              </div>

              {/* Incident title */}
              <div className="px-3 pt-3 pb-1">
                <div
                  className="text-[15px] font-black uppercase leading-tight tracking-wide"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {activeIncident.label}
                </div>
                <div className="text-[9px] tracking-widest opacity-60 uppercase mt-0.5">
                  {activeIncident.type}
                </div>
              </div>

              {/* Data rows */}
              <div className="px-3 pb-2 border-t border-black mt-2 pt-2 flex flex-col gap-1">
                {[
                  ['DATE', activeIncident.date],
                  ['AGENT', activeIncident.agent],
                  ['LAT', activeIncident.lat.toFixed(4) + '°N'],
                  ['LNG', Math.abs(activeIncident.lng).toFixed(4) + '°W'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between">
                    <span className="text-[8px] font-bold tracking-[0.3em] opacity-50 uppercase">{k}</span>
                    <span className="text-[9px] font-bold tracking-widest">{v}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="border-t-2 border-black px-3 py-2">
                <div className="text-[8px] font-bold tracking-[0.25em] uppercase opacity-50 mb-1">FIELD NOTES</div>
                <p className="text-[9px] tracking-wide leading-relaxed opacity-80">{activeIncident.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Incident list sidebar */}
        <div
          className="w-52 border-l-2 border-black flex flex-col flex-shrink-0 overflow-hidden"
          style={{ fontFamily: 'var(--font-mono)', background: '#F4F4F0' }}
        >
          <div className="border-b-2 border-black px-3 py-2">
            <span className="text-[10px] font-black tracking-[0.25em] uppercase">INCIDENT LOG</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {INCIDENTS.map((inc) => {
              const active = activeId === inc.id
              return (
                <button
                  key={inc.id}
                  onClick={() => handleMarkerClick(inc.id)}
                  className="w-full text-left border-b border-black px-3 py-2 transition-colors"
                  style={{
                    background: active ? '#000' : 'transparent',
                    color: active ? '#F4F4F0' : '#000',
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-black tracking-widest">{inc.code}</span>
                    <span
                      className="text-[11px] font-bold leading-none"
                      style={{ opacity: active ? 0.9 : 0.6 }}
                    >
                      {TYPE_SYMBOL[inc.type]}
                    </span>
                  </div>
                  <div className="text-[8px] tracking-wide uppercase truncate" style={{ opacity: active ? 0.8 : 0.5 }}>
                    {inc.label}
                  </div>
                  <div className="text-[7px] tracking-widest mt-0.5" style={{ opacity: active ? 0.6 : 0.35 }}>
                    {inc.date} — {inc.status}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="border-t-2 border-black px-3 py-2">
            <div className="text-[8px] font-bold tracking-[0.25em] uppercase opacity-50 mb-1.5">SYMBOL KEY</div>
            {(Object.entries(TYPE_SYMBOL) as [Incident['type'], string][]).map(([type, sym]) => (
              <div key={type} className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold w-4 text-center leading-none">{sym}</span>
                <span className="text-[7px] tracking-widest uppercase opacity-60">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div
        className="border-t-2 border-black px-6 py-2 flex items-center justify-between flex-shrink-0"
        style={{ fontFamily: 'var(--font-mono)', background: '#F4F4F0' }}
      >
        <span className="text-[10px] tracking-widest">
          {INCIDENTS.filter((i) => i.status === 'CONFIRMED').length} CONFIRMED / {INCIDENTS.length} TOTAL
        </span>
        <span className="text-[10px] tracking-widest opacity-60">LAST UPDATED: 1974-03-15 / 02:47 HRS</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-black animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest">LIVE FEED ACTIVE</span>
        </div>
      </div>
    </div>
  )
}
