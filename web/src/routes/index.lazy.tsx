import { createLazyFileRoute } from '@tanstack/react-router'
import { Header, Footer } from '../components/layout'
import { Store, QrCode, Smartphone } from 'lucide-react'

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="bg-neutral text-white">
      <Header />
      <main>
        <section className="pt-32 pb-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Seu cardápio digital{' '}
              <span className="text-accent">simples e profissional</span>
            </h1>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              Crie, gerencie e compartilhe o cardápio do seu restaurante em
              minutos. QR Code, pedidos online e muito mais.
            </p>
            <a
              href="#cta"
              className="btn bg-accent text-white border-accent btn-lg hover:bg-accent/90"
            >
              Começar Agora
            </a>
          </div>
        </section>

        <section className="py-16 px-4 border-y border-base-300">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Restaurantes' },
              { value: '10k+', label: 'Cardápios' },
              { value: '50k+', label: 'Pedidos' },
              { value: '4.9', label: 'Avaliação' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-accent">{s.value}</p>
                <p className="text-sm text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Por que escolher o Saas Cardapio?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Store,
                  title: 'Gestão Completa',
                  desc: 'Controle total do cardápio com categorias, preços e disponibilidade.',
                },
                {
                  icon: QrCode,
                  title: 'QR Code Inteligente',
                  desc: 'Compartilhe o cardápio com QR Code na mesa ou link personalizado.',
                },
                {
                  icon: Smartphone,
                  title: 'Mobile First',
                  desc: 'Experiência otimizada para celular. Seus clientes acessam de qualquer lugar.',
                },
              ].map((p) => (
                <div key={p.title} className="text-center p-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <p.icon className="text-accent" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                  <p className="text-sm text-white/60">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="py-20 px-4 bg-accent/10 border-y border-accent/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para digitalizar seu cardápio?
            </h2>
            <p className="text-white/60 mb-8">
              Comece gratuitamente e transforme a experiência do seu restaurante.
            </p>
            <a
              href="/login"
              className="btn bg-accent text-white border-accent btn-lg hover:bg-accent/90"
            >
              Criar Conta Gratuita
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
