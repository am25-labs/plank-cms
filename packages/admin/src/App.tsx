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
            <Route path="content-types" element={<ContentTypeBuilder />} />
            <Route path="content" element={<ContentManager />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
