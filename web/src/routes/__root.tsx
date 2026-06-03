import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from '../lib/theme-context'
import { Toaster } from 'sonner'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <Outlet />
      <Toaster richColors closeButton />
    </ThemeProvider>
  ),
})
