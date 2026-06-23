import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AdminAuthGate } from '#/features/admin/components/AdminAuthGate'
import { AdminLayout } from '#/features/admin/components/AdminLayout'

export const Route = createFileRoute('/admin')({ component: AdminRoute })

function AdminRoute() {
  return (
    <AdminAuthGate>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminAuthGate>
  )
}
