import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import TargetsPage from '@/pages/TargetsPage'
import ScansPage from '@/pages/ScansPage'
import FindingsPage from '@/pages/FindingsPage'
import FindingDetailPage from '@/pages/FindingDetailPage'
import ReportsPage from '@/pages/ReportsPage'

/** Declares every protected workspace route and the public login entry. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/targets" element={<TargetsPage />} />
          <Route path="/scans" element={<ScansPage />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="/findings/:id" element={<FindingDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
