import { useTheme } from '../../lib/theme-context'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button onClick={toggleTheme} className="btn btn-ghost btn-sm btn-square" title={theme === 'business' ? 'Tema claro' : 'Tema escuro'}>
      {theme === 'business' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
