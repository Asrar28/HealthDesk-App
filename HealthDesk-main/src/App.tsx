import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute, RoleRoute } from '@/components/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from '@/pages/AuthPages';
import { DashboardPage } from '@/pages/DashboardPage';
import { PlannerPage } from '@/pages/PlannerPage';
import { FamilyPage } from '@/pages/FamilyPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { FacilitiesPage } from '@/pages/FacilitiesPage';
import { FacilityDetailPage } from '@/pages/FacilityDetailPage';
import { FacilityAdminPage } from '@/pages/FacilityAdminPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { ArticleDetailPage } from '@/pages/ArticleDetailPage';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { EditorDashboardPage } from '@/pages/EditorDashboardPage';
import { NotificationsPage } from '@/pages/NotificationsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/planner"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PlannerPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/family"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FamilyPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FacilitiesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FacilityDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities/admin"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RoleRoute roles={['admin']}>
                <FacilityAdminPage />
              </RoleRoute>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <AppLayout>
              <LibraryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/library/bookmarks"
        element={
          <ProtectedRoute>
            <AppLayout>
              <BookmarksPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/library/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ArticleDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/library/editor"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RoleRoute roles={['editor', 'reviewer', 'admin']}>
                <EditorDashboardPage />
              </RoleRoute>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <AppLayout>
              <NotificationsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
