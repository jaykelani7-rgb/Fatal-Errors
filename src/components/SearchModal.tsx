import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from '../store.tsx'

const MOCK_RESULTS: Record<string, { id: string; category: string; label: string; sub: string }[]> = {
  default: [
    { id: 'r1', category: 'SUSPECT', label: 'V. MARKOV', sub: 'PRIMARY SUSPECT — CASE 1974-7741' },
    { id: 'r2', category: 'SUSPECT', label: 'E. CROSS', sub: 'KNOWN ASSOCIATE — HARBOR DISTRICT' },
    { id: 'r3', category: 'LOCATION', label: 'HARBOR DEPOT', sub: 'EXCHANGE POINT — SITE ALPHA' },
    { id: 'r4', category: 'ASSET', label: 'ACCT #7741', sub: 'OFFSHORE ACCOUNT — IRON GATE CO.' },
    { id: 'r5', category: 'INCIDENT', label: 'CANAL ST. CONTACT', sub: 'REF: BRAVO-2 / 1974-03-07' },
  ],
}

const LOAD_LINES = [
  '[DONE] SCRAPING LIVE FEEDS...',
  '[DONE] PARSING LINGUISTIC FALLACIES...',
  '> CROSS-REFERENCING GLOBAL ARCHIVE...',
]

type Phase = 'idle' | 'loading' | 'results'

export default function SearchModal() {
  const { searchModalOpen, setSearchModalOpen } = useAppStore()
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [loadLines, setLoadLines] = useState<string[]>([])
  const [results, setResults] = useState<typeof MOCK_RESULTS['default']>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const loadTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const close = useCallback(() => {
    setSearchModalOpen(false)
  }, [setSearchModalOpen])

  const reset = useCallback(() => {
    setQuery('')
    setPhase('idle')
    setLoadLines([])
    setResults([])
    loadTimers.current.forEach(clearTimeout)
    loadTimers.current = []
  }, [])

  // Cmd/Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchModalOpen((prev: boolean) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setSearchModalOpen])

  // Focus input when opening
  useEffect(() => {
    if (searchModalOpen) {
      reset()
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [searchModalOpen, reset])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchModalOpen) close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchModalOpen, close])

  const runSearch = useCallback(() => {
    if (!query.trim()) return
    loadTimers.current.forEach(clearTimeout)
    loadTimers.current = []
    setPhase('loading')
    setLoadLines([])
    setResults([])

    LOAD_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setLoadLines((prev) => [...prev, line])
        if (i === LOAD_LINES.length - 1) {
          const t2 = setTimeout(() => {
            setResults(MOCK_RESULTS.default)
            setPhase('results')
          }, 400)
          loadTimers.current.push(t2)
        }
      }, (i + 1) * 300)
      loadTimers.current.push(t)
    })
  }, [query])

  if (!searchModalOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={close}
    >
      <div
        className="bg-[#F4F4F0] border-4 border-black w-full flex flex-col"
        style={{
          maxWidth: 580,
          boxShadow: '8px 8px 0 #000',
          fontFamily: 'var(--font-mono)',
          margin: '0 16px',
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="border-b-2 border-black px-4 py-2 flex items-center justify-between bg-black flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-[#F4F4F0]">
              CLASSIFIED DATABASE SEARCH
            </span>
            <span className="text-[8px] tracking-widest text-[#F4F4F0] opacity-50">OP-NIGHTFALL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] tracking-widest text-[#F4F4F0] opacity-40 border border-[#F4F4F0] border-opacity-30 px-1.5 py-0.5">ESC</span>
            <button
              onClick={close}
              className="w-6 h-6 border border-[#F4F4F0] border-opacity-40 flex items-center justify-center font-black text-[#F4F4F0] hover:bg-[#F4F4F0] hover:text-black transition-colors text-xs leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search input row */}
        <div className="border-b-2 border-black flex items-center flex-shrink-0">
          <div className="px-4 py-3 border-r-2 border-black flex items-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#000" strokeWidth="2" />
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="#000" strokeWidth="2" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch()
            }}
            placeholder="TYPE QUERY AND PRESS ENTER..."
            className="flex-1 px-4 py-3 text-[14px] tracking-wider uppercase bg-[#F4F4F0] outline-none placeholder-black"
            style={{
              fontFamily: 'var(--font-mono)',
              caretColor: '#000',
              caretShape: 'block',
              letterSpacing: '0.1em',
            }}
          />
          <button
            onClick={runSearch}
            className="px-4 py-3 border-l-2 border-black text-[9px] font-black tracking-widest uppercase hover:bg-black hover:text-[#F4F4F0] transition-colors"
          >
            EXECUTE
          </button>
        </div>

        {/* Body: idle / loading / results */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {phase === 'idle' && (
            <div>
              {/* Quick filters */}
              <div className="px-4 pt-3 pb-2 border-b border-black border-opacity-20">
                <div className="text-[8px] font-bold tracking-[0.35em] uppercase opacity-50 mb-2">FILTER BY CATEGORY</div>
                <div className="flex gap-2 flex-wrap">
                  {['ALL FILES', 'SUSPECTS', 'LOCATIONS', 'ASSETS', 'VICTIMS', 'CLASSIFIED'].map((tag) => (
                    <button
                      key={tag}
                      className="border-2 border-black px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase hover:bg-black hover:text-[#F4F4F0] transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              {/* Recent */}
              <div className="px-4 pt-3">
                <div className="text-[8px] font-bold tracking-[0.35em] uppercase opacity-50 mb-2">RECENT QUERIES</div>
                {['V. MARKOV — SUSPECT', 'HARBOR DEPOT — LOCATION', 'ACCT #7741 — ASSET'].map((item) => (
                  <button
                    key={item}
                    className="flex items-center gap-3 w-full py-2 border-b border-black border-opacity-15 hover:opacity-60 transition-opacity text-left"
                    onClick={() => { setQuery(item.split(' — ')[0]); inputRef.current?.focus() }}
                  >
                    <div className="w-1.5 h-1.5 bg-black flex-shrink-0" />
                    <span className="text-[10px] tracking-widest uppercase">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'loading' && (
            <div className="px-4 py-4">
              <div className="text-[9px] font-bold tracking-[0.3em] uppercase opacity-50 mb-3">
                EXECUTING SEARCH: "{query}"
              </div>
              <div className="space-y-2">
                {loadLines.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2"
                    style={{ animation: 'fadeInLine 0.2s ease-in' }}
                  >
                    <span
                      className="text-[11px] font-bold tracking-wide"
                      style={{
                        color: line.startsWith('[DONE]') ? '#000' : '#D22B2B',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {line}
                    </span>
                  </div>
                ))}
                {loadLines.length < LOAD_LINES.length && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-3 bg-black animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          )}

          {phase === 'results' && (
            <div>
              <div className="px-4 py-2 border-b border-black flex items-center justify-between">
                <span className="text-[8px] font-bold tracking-[0.3em] uppercase opacity-50">
                  {results.length} RECORDS FOUND FOR "{query}"
                </span>
                <button
                  onClick={reset}
                  className="text-[8px] tracking-widest uppercase opacity-50 hover:opacity-100 transition-opacity"
                >
                  ← NEW SEARCH
                </button>
              </div>
              {results.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-stretch border-b-2 border-black hover:bg-black hover:text-[#F4F4F0] transition-colors cursor-pointer group"
                >
                  {/* Category badge */}
                  <div className="flex items-center px-3 border-r-2 border-black min-w-[90px] group-hover:border-[#F4F4F0]">
                    <span className="text-[8px] font-black tracking-[0.2em] uppercase opacity-60 group-hover:opacity-80">
                      {r.category}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 px-4 py-3">
                    <div className="text-[12px] font-black tracking-widest uppercase leading-tight">{r.label}</div>
                    <div className="text-[9px] tracking-wider opacity-50 mt-0.5">{r.sub}</div>
                  </div>
                  {/* Index */}
                  <div className="flex items-center px-3 border-l-2 border-black group-hover:border-[#F4F4F0]">
                    <span className="text-[8px] font-black opacity-30">#{String(i + 1).padStart(2, '0')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black px-4 py-1.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[8px] tracking-widest opacity-40">
              <span className="border border-black border-opacity-40 px-1 py-0.5 mr-1">↵</span>SEARCH
            </span>
            <span className="text-[8px] tracking-widest opacity-40">
              <span className="border border-black border-opacity-40 px-1 py-0.5 mr-1">ESC</span>CLOSE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-black animate-pulse" />
            <span className="text-[8px] tracking-widest opacity-40 uppercase">SECURE CHANNEL ACTIVE</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInLine {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        input::placeholder {
          opacity: 0.25;
        }
      `}</style>
    </div>
  )
}
