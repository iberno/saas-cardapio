import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { AuthProvider, useAuth } from './lib/auth-context'
import { routeTree } from './routeTree.gen'
import './index.css'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

const router = createRouter({
  routeTree,
  context: { isAuthenticated: false, authLoading: true },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function RouterWithAuth() {
  const { user, loading } = useAuth()

  useEffect(() => {
    router.update({
      context: { isAuthenticated: !!user, authLoading: loading },
    })
  }, [user, loading])

  return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterWithAuth />
    </AuthProvider>
  </StrictMode>,
)
