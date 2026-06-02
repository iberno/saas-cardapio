export function Footer() {
  return (
    <footer className="bg-neutral border-t border-base-300/20 py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-lg font-bold text-white mb-2">
            <span className="text-accent">&#9670;</span> SaasCardapio
          </div>
          <p className="text-sm text-white/50">
            Sistema de cardápio digital para restaurantes.
          </p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Links</h4>
          <div className="flex flex-col gap-2 text-sm text-white/50">
            <a href="#funcionalidades" className="hover:text-accent transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-accent transition-colors">Planos</a>
            <a href="#contato" className="hover:text-accent transition-colors">Contato</a>
          </div>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Contato</h4>
          <div className="flex flex-col gap-2 text-sm text-white/50">
            <span>contato@saascardapio.com.br</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-base-300/20 text-center text-sm text-white/30">
        &copy; {new Date().getFullYear()} Saas Cardapio. Todos os direitos reservados.
      </div>
    </footer>
  )
}
