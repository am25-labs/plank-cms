import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/auth.tsx'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/content-types', label: 'Content Types' },
  { to: '/content', label: 'Content' },
  { to: '/media', label: 'Media' },
  { to: '/settings', label: 'Settings' },
]

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, borderRight: '1px solid #e5e7eb', padding: '24px 16px' }}>
        <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 32 }}>Plank CMS</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                color: isActive ? '#111' : '#6b7280',
                background: isActive ? '#f3f4f6' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{user?.email}</p>
          <button onClick={logout} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32 }}>
        <Outlet />
      </main>
    </div>
  )
}
