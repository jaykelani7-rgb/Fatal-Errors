import { useAppStore } from './store.tsx'
import MapView from './components/MapView'
import GraphView from './components/GraphView'
import SearchModal from './components/SearchModal'
import FactsSidebar from './components/FactsSidebar'

export default function App() {
  const { currentView, setCurrentView, toggleSearchModal, factsOpen, toggleFacts } = useAppStore()

  return (
    <div className="min-h-screen bg-[#F4F4F0] flex flex-col" style={{ fontFamily: 'var(--font-mono)' }}>

      {/* ── MASTHEAD ── */}
      <header className="border-b-4 border-black">
        {/* Volume / edition strip */}
        <div className="border-b-2 border-black flex items-center justify-between px-6 py-1">
          <span className="text-[10px] tracking-[0.3em] uppercase">VOL. XLVII — NO. 312</span>
          <span className="text-[10px] tracking-[0.3em] uppercase opacity-60">RESTRICTED DISTRIBUTION — INTERNAL USE ONLY</span>
          <span className="text-[10px] tracking-[0.3em] uppercase">FOUNDED 1931</span>
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-6 py-4 gap-4">
          {/* Left meta column */}
          <div className="flex flex-col gap-1 w-48">
            <div className="text-[9px] font-bold tracking-[0.25em] uppercase border-b border-black pb-1 mb-1">
              OPERATION NIGHTFALL
            </div>
            <div className="text-[8px] tracking-wider opacity-60">FILE CLASSIFICATION:</div>
            <div className="text-[9px] font-black tracking-[0.3em] border border-black px-2 py-0.5 inline-block" style={{ boxShadow: '2px 2px 0 #000' }}>
              TOP SECRET
            </div>
            <div className="text-[8px] tracking-wider opacity-60 mt-1">CASE NO. 1974-7741-NF</div>
          </div>

          {/* Main title */}
          <div className="flex-1 text-center border-l-2 border-r-2 border-black px-6">
            <div className="text-[10px] tracking-[0.5em] uppercase opacity-60 mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
              DIVISION OF CRIMINAL INTELLIGENCE
            </div>
            <h1
              className="leading-none font-black uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.2rem, 5vw, 4rem)', letterSpacing: '-0.01em' }}
            >
              THE DOSSIER
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px flex-1 bg-black" />
              <span className="text-[9px] tracking-[0.4em] uppercase opacity-60" style={{ fontFamily: 'var(--font-mono)' }}>
                INTERACTIVE INTELLIGENCE PLATFORM
              </span>
              <div className="h-px flex-1 bg-black" />
            </div>
          </div>

          {/* Right controls column */}
          <div className="flex flex-col items-end gap-2 w-48">
            <button
              onClick={toggleSearchModal}
              className="flex items-center gap-2 border-2 border-black px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase bg-[#F4F4F0] hover:bg-black hover:text-[#F4F4F0] transition-colors"
              style={{ boxShadow: '2px 2px 0 #000', fontFamily: 'var(--font-mono)' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.5" />
                <line x1="6.5" y1="6.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              SEARCH FILES
            </button>
            <div className="text-[8px] tracking-widest opacity-50 text-right">
              LAST SYNC: 02:47 HRS<br />STATUS: ACTIVE
            </div>
          </div>
        </div>

        {/* Bottom decoration strip */}
        <div className="border-t-2 border-black h-1.5 bg-black" />
      </header>

      {/* ── SUB-NAVIGATION ── */}
      <nav className="border-b-2 border-black flex items-stretch bg-[#F4F4F0]">
        <div className="flex items-center px-6 border-r-2 border-black">
          <span className="text-[9px] tracking-[0.3em] uppercase opacity-50 font-bold">VIEW MODE:</span>
        </div>

        {[
          { view: 'map' as const, label: 'THE BLUEPRINT', sub: 'GEOSPATIAL MAP' },
          { view: 'graph' as const, label: 'THE EVIDENCE BOARD', sub: 'ASSOCIATION GRAPH' },
        ].map(({ view, label, sub }) => {
          const active = currentView === view
          return (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className="relative flex flex-col items-start px-6 py-3 border-r-2 border-black transition-colors"
              style={{
                background: active ? '#000' : 'transparent',
                color: active ? '#F4F4F0' : '#000',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4F4F0]" />
              )}
              <span className="text-[11px] font-black tracking-[0.25em] uppercase leading-tight">{label}</span>
              <span className="text-[8px] tracking-[0.2em] uppercase leading-tight mt-0.5" style={{ opacity: active ? 0.7 : 0.4 }}>
                {sub}
              </span>
            </button>
          )
        })}

        {/* Right side badges + facts toggle */}
        <div className="ml-auto flex items-center border-l-2 border-black">
          <div className="flex items-center gap-4 px-4">
            <div className="flex items-center gap-2 text-[9px] tracking-widest opacity-50 uppercase">
              <div className="w-2 h-2 border border-black" style={{ background: currentView === 'map' ? '#000' : 'transparent' }} />
              {currentView === 'map' ? 'MAP ACTIVE' : 'MAP STANDBY'}
            </div>
            <div className="flex items-center gap-2 text-[9px] tracking-widest opacity-50 uppercase">
              <div className="w-2 h-2 border border-black" style={{ background: currentView === 'graph' ? '#000' : 'transparent' }} />
              {currentView === 'graph' ? 'GRAPH ACTIVE' : 'GRAPH STANDBY'}
            </div>
          </div>
          <button
            onClick={toggleFacts}
            className="flex items-center gap-2 h-full px-4 border-l-2 border-black text-[9px] font-black tracking-[0.25em] uppercase transition-colors"
            style={{
              background: factsOpen ? '#000' : 'transparent',
              color: factsOpen ? '#F4F4F0' : '#000',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1.5" />
              <line x1="3" y1="3.5" x2="7" y2="3.5" stroke="currentColor" strokeWidth="1" />
              <line x1="3" y1="5.5" x2="7" y2="5.5" stroke="currentColor" strokeWidth="1" />
              <line x1="3" y1="7.5" x2="5.5" y2="7.5" stroke="currentColor" strokeWidth="1" />
            </svg>
            FACTS
          </button>
        </div>
      </nav>

      {/* ── MAIN VIEW CONTAINER ── */}
      <main
        className="flex-1 relative overflow-hidden"
        style={{ minHeight: 0, marginRight: factsOpen ? 320 : 0, transition: 'margin-right 0.25s ease' }}
      >
        <div
          className="absolute inset-0"
          style={{ display: currentView === 'map' ? 'block' : 'none' }}
        >
          <MapView />
        </div>
        <div
          className="absolute inset-0"
          style={{ display: currentView === 'graph' ? 'block' : 'none' }}
        >
          <GraphView />
        </div>
      </main>

      <FactsSidebar />
      <SearchModal />
    </div>
  )
}
