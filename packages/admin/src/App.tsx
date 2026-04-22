import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/auth.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { Layout } from './components/Layout.tsx'
import { Login } from './pages/Login.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { ContentTypeBuilder } from './pages/ContentTypeBuilder.tsx'
import { ContentManager } from './pages/ContentManager.tsx'
import { MediaLibrary } from './pages/MediaLibrary.tsx'
import { Settings } from './pages/Settings.tsx'
import { SettingsOverview } from './pages/settings/Overview.tsx'
import { SettingsUsers } from './pages/settings/Users.tsx'
import { SettingsRoles } from './pages/settings/Roles.tsx'
import { SettingsApiTokens } from './pages/settings/ApiTokens.tsx'
import { Profile } from './pages/Profile.tsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="content" element={<ContentManager />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route
              path="content-types"
              element={
                <ProtectedRoute roles={['super admin', 'admin']}>
                  <ContentTypeBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute roles={['super admin', 'admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<SettingsOverview />} />
              <Route path="users" element={<SettingsUsers />} />
              <Route
                path="roles"
                element={
                  <ProtectedRoute roles={['super admin']}>
                    <SettingsRoles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="api-tokens"
                element={
                  <ProtectedRoute roles={['super admin']}>
                    <SettingsApiTokens />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
