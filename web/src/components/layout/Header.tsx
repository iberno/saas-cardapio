import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral/80 backdrop-blur-sm border-b border-base-300">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white">
          Saas Cardapio
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <Link to="/" className="hover:text-accent transition-colors">
            Início
          </Link>
          <a href="#features" className="hover:text-accent transition-colors">
            Funcionalidades
          </a>
          <a href="#pricing" className="hover:text-accent transition-colors">
            Preços
          </a>
          <a href="/login" className="btn btn-primary btn-sm">
            Entrar
          </a>
          <a
            href="#cta"
            className="btn btn-sm bg-accent text-white border-accent hover:bg-accent/90"
          >
            Começar
          </a>
        </nav>

        <button
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-neutral border-t border-base-300 px-4 py-4 flex flex-col gap-3 text-sm text-white/70">
          <Link to="/" className="hover:text-accent" onClick={() => setOpen(false)}>
            Início
          </Link>
          <a
            href="#features"
            className="hover:text-accent"
            onClick={() => setOpen(false)}
          >
            Funcionalidades
          </a>
          <a
            href="#pricing"
            className="hover:text-accent"
            onClick={() => setOpen(false)}
          >
            Preços
          </a>
          <a
            href="/login"
            className="btn btn-primary btn-sm"
            onClick={() => setOpen(false)}
          >
            Entrar
          </a>
          <a
            href="#cta"
            className="btn btn-sm bg-accent text-white border-accent hover:bg-accent/90"
            onClick={() => setOpen(false)}
          >
            Começar
          </a>
        </div>
      )}
    </header>
  )
}
