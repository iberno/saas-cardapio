import { createLazyFileRoute } from '@tanstack/react-router'
import { Header, Footer } from '../components/layout'
import { Bot, TrendingUp, BarChart3, BotMessageSquare, Smartphone, CreditCard, Calendar, Send, Heart } from 'lucide-react'

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral text-base-content">
      <Header />

      <section className="pt-24 pb-16 px-4 bg-gradient-to-b from-primary to-neutral">
        <div className="max-w-7xl mx-auto text-center">
          <div className="badge badge-accent badge-outline mb-4 px-4 py-3 text-xs font-semibold tracking-wide">
            Cardápio Digital
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            O Sistema de Cardápio <br />
            <span className="text-accent">Digital</span> mais completo
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Automatize seus pedidos de WhatsApp, aumente suas vendas e gerencie seu negócio em um só lugar.
          </p>

          <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl p-6 text-left">
            <p className="text-white font-semibold mb-4 text-sm">Comece agora — é grátis!</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
              <input placeholder="Seu nome" className="input w-full bg-white/10 border-white/20 text-white placeholder:text-white/40" />
              <input type="email" placeholder="E-mail" className="input w-full bg-white/10 border-white/20 text-white placeholder:text-white/40" />
              <input placeholder="WhatsApp" className="input w-full bg-white/10 border-white/20 text-white placeholder:text-white/40" />
              <button type="submit" className="btn bg-accent text-white border-accent hover:bg-accent/90 w-full font-bold">
                TESTE GRÁTIS
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '+10', label: 'Lojas Ativas' },
            { value: '+5k', label: 'Clientes Atendidos' },
            { value: '+50k', label: 'Pedidos Realizados' },
            { value: '99%', label: 'Satisfação' },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-white/5 rounded-xl p-4">
              <div className="text-3xl font-extrabold text-accent">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Os 3 Pilares</h2>
          <p className="text-white/50 mb-8">Tudo que seu negócio precisa</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Bot, title: 'Automação', desc: 'Cardápio digital com chatbot IA, pagamento online e agendamento. Atendimento 24h.' },
              { icon: TrendingUp, title: 'Vendas', desc: 'Disparo em massa no WhatsApp, programa de fidelidade e integração com anúncios.' },
              { icon: BarChart3, title: 'Gestão', desc: 'Controle de caixa, estoque, notas fiscais e comandas integrado ao iFood.' },
            ].map((pilar) => (
              <div key={pilar.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <pilar.icon className="text-accent mb-3" size={28} />
                <h3 className="text-lg font-semibold text-accent mb-2">{pilar.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{pilar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Funcionalidades</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: BotMessageSquare, label: 'Chatbot IA' },
              { icon: Smartphone, label: 'Cardápio Online' },
              { icon: CreditCard, label: 'Pagamento Online' },
              { icon: Calendar, label: 'Agendamento' },
              { icon: Send, label: 'Disparo WhatsApp' },
              { icon: Heart, label: 'Fidelidade' },
            ].map((feat) => (
              <div key={feat.label} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <feat.icon className="text-accent mx-auto mb-2" size={24} />
                <span className="text-white text-sm font-medium">{feat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-b from-primary to-neutral text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para começar?</h2>
          <p className="text-white/60 mb-8">Mais de 10 restaurantes já usam o Saas Cardapio</p>
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="btn bg-accent text-white border-accent hover:bg-accent/90 btn-lg">
            FALE COM UM CONSULTOR
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
