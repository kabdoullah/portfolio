import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AdminAuthGate } from '#/features/admin/components/AdminAuthGate'
import { AdminLayout } from '#/features/admin/components/AdminLayout'

export const Route = createFileRoute('/admin')({
  component: AdminRoute,
  // Internal single-language tool: keep it out of search indexes and give it a
  // fixed French title (no localized/hreflang tags, unlike the public site).
  head: () => ({
    meta: [
      { title: 'Admin — Abdoulaye Kemogoha COULIBALY' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
})

function AdminRoute() {
  return (
    <AdminAuthGate>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminAuthGate>
  )
}
