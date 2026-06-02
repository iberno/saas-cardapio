import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-neutral/80 border-b border-base-300/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white">
          <span className="text-accent">&#9670;</span> SaasCardapio
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#funcionalidades" className="text-sm text-white/70 hover:text-white transition-colors">Funcionalidades</a>
          <a href="#planos" className="text-sm text-white/70 hover:text-white transition-colors">Planos</a>
          <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors">Login</Link>
          <Link to="/login" className="btn btn-sm bg-accent text-white border-accent hover:bg-accent/90">
            Teste Grátis
          </Link>
        </nav>

        <button className="md:hidden btn btn-ghost btn-sm" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-base-300/20 bg-neutral p-4 flex flex-col gap-3">
          <a href="#funcionalidades" className="text-sm text-white/70 hover:text-white" onClick={() => setOpen(false)}>Funcionalidades</a>
          <a href="#planos" className="text-sm text-white/70 hover:text-white" onClick={() => setOpen(false)}>Planos</a>
          <Link to="/login" className="text-sm text-white/70 hover:text-white" onClick={() => setOpen(false)}>Login</Link>
          <Link to="/login" className="btn btn-sm bg-accent text-white border-accent" onClick={() => setOpen(false)}>Teste Grátis</Link>
        </div>
      )}
    </header>
  )
}
