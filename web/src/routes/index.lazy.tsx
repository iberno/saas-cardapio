import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/')({
  component: () => <div className="min-h-screen bg-neutral text-white flex items-center justify-center"><h1 className="text-2xl">Saas Cardapio</h1></div>,
})
