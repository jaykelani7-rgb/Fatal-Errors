import { createContext, useContext, useState, type ReactNode } from 'react'

type View = 'map' | 'graph'

interface AppState {
  currentView: View
  searchModalOpen: boolean
  factsOpen: boolean
  setCurrentView: (view: View) => void
  setSearchModalOpen: (open: boolean) => void
  toggleSearchModal: () => void
  toggleFacts: () => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('map')
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [factsOpen, setFactsOpen] = useState(true)

  return (
    <AppContext.Provider
      value={{
        currentView,
        searchModalOpen,
        factsOpen,
        setCurrentView,
        setSearchModalOpen,
        toggleSearchModal: () => setSearchModalOpen((v) => !v),
        toggleFacts: () => setFactsOpen((v) => !v),
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppStore must be used inside AppProvider')
  return ctx
}
