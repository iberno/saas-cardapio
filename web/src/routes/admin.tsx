import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '../components/layout'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context, location }) => {
    if (context.authLoading) return
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: AdminLayout,
})
