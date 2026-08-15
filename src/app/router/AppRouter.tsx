import { Route, Routes } from 'react-router-dom'

import { AdminRoute, ProtectedRoute, VerifiedRoute } from '@/app/router/guards'
import { AccountPage } from '@/features/auth/pages/AccountPage'
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage'
import { HomePage } from '@/features/home/pages/HomePage'
import { NotFoundPage } from '@/features/home/pages/NotFoundPage'
import { AdminDashboardPage } from '@/features/moderation/pages/AdminDashboardPage'
import { AdminLayout } from '@/features/moderation/components/AdminLayout'
import { AdminNeedsPage } from '@/features/moderation/pages/AdminNeedsPage'
import { AdminReportsPage } from '@/features/moderation/pages/AdminReportsPage'
import { AdminUsersPage } from '@/features/moderation/pages/AdminUsersPage'
import { ReportPage } from '@/features/moderation/pages/ReportPage'
import { NeedDetailPage } from '@/features/needs/pages/NeedDetailPage'
import { NeedsListPage } from '@/features/needs/pages/NeedsListPage'
import { NewNeedPage } from '@/features/needs/pages/NewNeedPage'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import { MyHelpPage } from '@/features/profile/pages/MyHelpPage'
import { MyNeedsPage } from '@/features/profile/pages/MyNeedsPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/needs" element={<NeedsListPage />} />
      <Route path="/needs/:id" element={<NeedDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<VerifiedRoute />}>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/my-needs" element={<MyNeedsPage />} />
          <Route path="/my-help" element={<MyHelpPage />} />
          <Route path="/needs/new" element={<NewNeedPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* Panel administrativo (Fase 6: moderación). La protección real es RLS (ARCH §36). */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/needs" element={<AdminNeedsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
