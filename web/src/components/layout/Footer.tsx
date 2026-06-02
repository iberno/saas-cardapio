export function Footer() {
  return (
    <footer className="bg-neutral text-white/60 border-t border-base-300 py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-lg font-bold text-white mb-2">
            Saas Cardapio
          </h3>
          <p className="text-sm">
            A plataforma completa para gerenciar o cardápio do seu restaurante.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Produto</h4>
          <ul className="text-sm space-y-2">
            <li>
              <a
                href="#features"
                className="hover:text-accent transition-colors"
              >
                Funcionalidades
              </a>
            </li>
            <li>
              <a
                href="#pricing"
                className="hover:text-accent transition-colors"
              >
                Preços
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Contato</h4>
          <ul className="text-sm space-y-2">
            <li>
              <a
                href="mailto:contato@saascardapio.com"
                className="hover:text-accent transition-colors"
              >
                contato@saascardapio.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-base-300 text-sm text-center">
        &copy; {new Date().getFullYear()} Saas Cardapio. Todos os direitos
        reservados.
      </div>
    </footer>
  )
}
