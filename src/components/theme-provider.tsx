import { createContext, useContext, useEffect, useState } from "react"
import { ThemeSelectionDialog } from "./theme-selection-dialog"

type Theme = "dark" | "light"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => {
      const saved = localStorage.getItem(storageKey) as Theme
      if (saved) {
        return saved
      }
      return defaultTheme
    }
  )

  const [showThemeDialog, setShowThemeDialog] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    const hasSeenThemeSelection = localStorage.getItem(`${storageKey}-seen`)
    
    if (!hasSeenThemeSelection) {
      setShowThemeDialog(true)
    }
  }, [])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    showThemeDialog,
    setShowThemeDialog
  }

  return (
    <>
      <ThemeProviderContext.Provider {...props} value={value}>
        {children}
      </ThemeProviderContext.Provider>
      
      {showThemeDialog && (
        <ThemeSelectionDialog
          isOpen={showThemeDialog}
          onClose={() => setShowThemeDialog(false)}
          onSelectTheme={(selectedTheme) => {
            setTheme(selectedTheme)
            setShowThemeDialog(false)
          }}
        />
      )}
    </>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
