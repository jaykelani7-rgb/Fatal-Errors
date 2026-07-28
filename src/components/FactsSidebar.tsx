import { useAppStore } from '../store.tsx'

interface EvidenceItem {
  id: string
  ref: string
  date: string
  text: string
  keywords: string[]
  verdict: 'VERIFIED' | 'FABRICATED'
  source: string
  analyst: string
}

const EVIDENCE: EvidenceItem[] = [
  {
    id: 'E-001',
    ref: 'REF-NF-001',
    date: '1974-03-04',
    text: 'Subject V. Markov was observed transferring a sealed package to an unidentified male at Pier 17 at 02:14 hrs. Package contents unknown. Contact departed northbound on foot.',
    keywords: ['V. Markov', 'Pier 17', 'sealed package'],
    verdict: 'VERIFIED',
    source: 'FIELD OPERATIVE / UNIT-7',
    analyst: 'BRECKENRIDGE, H.',
  },
  {
    id: 'E-002',
    ref: 'REF-NF-002',
    date: '1974-03-06',
    text: 'Intelligence intercept suggests Iron Gate Co. disbursed $240,000 to offshore account #7741 held under a false beneficiary. Transaction routed via Zurich clearinghouse.',
    keywords: ['Iron Gate Co.', '$240,000', 'account #7741', 'Zurich'],
    verdict: 'VERIFIED',
    source: 'SIGNALS INTELLIGENCE / UNIT-9',
    analyst: 'OKAFOR, M.',
  },
  {
    id: 'E-003',
    ref: 'REF-NF-003',
    date: '1974-03-08',
    text: 'Anonymous tip alleges E. Cross met with a government minister at the Dorchester Club to exchange classified naval documents. No corroborating evidence recovered from scene.',
    keywords: ['E. Cross', 'Dorchester Club', 'naval documents'],
    verdict: 'FABRICATED',
    source: 'ANONYMOUS TIP / UNVERIFIED',
    analyst: 'PENDING REVIEW',
  },
  {
    id: 'E-004',
    ref: 'REF-NF-004',
    date: '1974-03-11',
    text: 'D. Ashwood confirmed to have accessed the North Safehouse between 23:00 and 01:30 hrs on three consecutive nights. Security footage recovered and authenticated.',
    keywords: ['D. Ashwood', 'North Safehouse', 'security footage'],
    verdict: 'VERIFIED',
    source: 'SURVEILLANCE LOG / UNIT-3',
    analyst: 'BRECKENRIDGE, H.',
  },
  {
    id: 'E-005',
    ref: 'REF-NF-005',
    date: '1974-03-13',
    text: 'Source claims V. Markov traveled to East Berlin on commercial flight under alias "K. Voronov" and met with foreign intelligence officers. Passport records do not corroborate alias.',
    keywords: ['V. Markov', 'East Berlin', 'K. Voronov'],
    verdict: 'FABRICATED',
    source: 'HUMINT SOURCE / RELIABILITY: LOW',
    analyst: 'OKAFOR, M.',
  },
  {
    id: 'E-006',
    ref: 'REF-NF-006',
    date: '1974-03-15',
    text: 'Victim R. Chen found unresponsive at Warehouse Row. Blunt force trauma. Personal effects missing. Witness accounts place an unidentified vehicle—black saloon—at the scene at 21:45.',
    keywords: ['R. Chen', 'Warehouse Row', 'blunt force trauma'],
    verdict: 'VERIFIED',
    source: 'METROPOLITAN POLICE / DIV. 4',
    analyst: 'SINCLAIR, T.',
  },
]

function highlight(text: string, keywords: string[]) {
  const parts: { text: string; highlight: boolean }[] = []
  let remaining = text

  // Build a sorted list of all keyword occurrences
  while (remaining.length > 0) {
    let earliest = -1
    let earliestLen = 0
    for (const kw of keywords) {
      const idx = remaining.toLowerCase().indexOf(kw.toLowerCase())
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx
        earliestLen = kw.length
      }
    }
    if (earliest === -1) {
      parts.push({ text: remaining, highlight: false })
      break
    }
    if (earliest > 0) parts.push({ text: remaining.slice(0, earliest), highlight: false })
    parts.push({ text: remaining.slice(earliest, earliest + earliestLen), highlight: true })
    remaining = remaining.slice(earliest + earliestLen)
  }

  return parts
}

const STAMP_STYLES: Record<EvidenceItem['verdict'], { color: string; bg: string; rotate: string }> = {
  VERIFIED:   { color: '#1a5c2a', bg: 'rgba(26,92,42,0.08)',  rotate: '-6deg' },
  FABRICATED: { color: '#8b1a1a', bg: 'rgba(139,26,26,0.08)', rotate: '5deg'  },
}

export default function FactsSidebar() {
  const { factsOpen, toggleFacts } = useAppStore()

  return (
    <>
      {/* Toggle tab — always visible */}
      <button
        onClick={toggleFacts}
        className="fixed top-1/2 right-0 z-30 border-2 border-black border-r-0 bg-[#F4F4F0] flex items-center justify-center transition-transform"
        style={{
          transform: 'translateY(-50%)',
          writingMode: 'vertical-rl',
          fontFamily: 'var(--font-mono)',
          padding: '10px 6px',
          boxShadow: '-3px 0 0 #000',
          letterSpacing: '0.2em',
          fontSize: '9px',
          fontWeight: '700',
          textTransform: 'uppercase',
          right: factsOpen ? 320 : 0,
          transition: 'right 0.25s ease',
        }}
      >
        {factsOpen ? '▶ CLOSE' : '◀ FACTS'}
      </button>

      {/* Sidebar panel */}
      <aside
        className="fixed top-0 right-0 h-full z-20 flex flex-col bg-[#F4F4F0] border-l-4 border-black overflow-hidden"
        style={{
          width: 320,
          transform: factsOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          boxShadow: factsOpen ? '-6px 0 0 #000' : 'none',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Header */}
        <div className="border-b-4 border-black flex-shrink-0">
          <div className="border-b-2 border-black px-4 py-1 flex items-center justify-between">
            <span className="text-[8px] tracking-[0.35em] uppercase opacity-50">OP-NIGHTFALL / ESTABLISHED FACTS</span>
            <span className="text-[8px] tracking-widest opacity-40">{EVIDENCE.length} ITEMS</span>
          </div>
          <div className="px-4 py-3">
            <h2
              className="text-[18px] font-black uppercase leading-tight tracking-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Evidence<br />Registry
            </h2>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 border border-black" style={{ background: '#1a5c2a' }} />
                <span className="text-[8px] tracking-widest uppercase opacity-60">
                  {EVIDENCE.filter(e => e.verdict === 'VERIFIED').length} VERIFIED
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 border border-black" style={{ background: '#8b1a1a' }} />
                <span className="text-[8px] tracking-widest uppercase opacity-60">
                  {EVIDENCE.filter(e => e.verdict === 'FABRICATED').length} FABRICATED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable evidence list */}
        <div className="flex-1 overflow-y-auto">
          {EVIDENCE.map((item, idx) => {
            const stamp = STAMP_STYLES[item.verdict]
            const parts = highlight(item.text, item.keywords)

            return (
              <div
                key={item.id}
                className="border-b-2 border-black"
                style={{ background: idx % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent' }}
              >
                {/* Item header */}
                <div className="border-b border-black px-3 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black tracking-widest">{item.id}</span>
                    <span className="text-[7px] tracking-widest opacity-40">{item.ref}</span>
                  </div>
                  <span className="text-[7px] tracking-widest opacity-50">{item.date}</span>
                </div>

                {/* Two-column body */}
                <div className="flex min-h-0">
                  {/* Left: evidence text */}
                  <div className="flex-1 px-3 py-3 pr-2 border-r-2 border-black">
                    <p className="text-[9px] leading-[1.65] tracking-wide" style={{ color: '#111' }}>
                      {parts.map((p, i) =>
                        p.highlight ? (
                          <mark
                            key={i}
                            style={{
                              background: item.verdict === 'VERIFIED' ? '#fef08a' : '#fecaca',
                              color: '#000',
                              padding: '0 1px',
                              fontWeight: '700',
                            }}
                          >
                            {p.text}
                          </mark>
                        ) : (
                          <span key={i}>{p.text}</span>
                        )
                      )}
                    </p>

                    {/* Source / analyst */}
                    <div className="mt-2 pt-1.5 border-t border-black border-opacity-20">
                      <div className="text-[7px] tracking-widest opacity-45 uppercase leading-tight">{item.source}</div>
                      <div className="text-[7px] tracking-widest opacity-35 uppercase leading-tight">ANALYST: {item.analyst}</div>
                    </div>
                  </div>

                  {/* Right: verdict stamp */}
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 88, background: stamp.bg }}
                  >
                    <div
                      style={{
                        transform: `rotate(${stamp.rotate})`,
                        border: `3px solid ${stamp.color}`,
                        padding: '4px 6px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: item.verdict === 'FABRICATED' ? '11px' : '13px',
                          fontWeight: '900',
                          color: stamp.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          lineHeight: 1.1,
                          opacity: 0.88,
                        }}
                      >
                        {item.verdict === 'FABRICATED' ? 'FABRI-\nCATED' : 'VERI-\nFIED'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black px-3 py-2 flex-shrink-0 flex items-center justify-between">
          <span className="text-[8px] tracking-widest opacity-40 uppercase">CLEARANCE: OMEGA</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-black animate-pulse" />
            <span className="text-[8px] tracking-widest opacity-40 uppercase">LIVE</span>
          </div>
        </div>
      </aside>
    </>
  )
}
