import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Printer,
  Users,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isAdmin = user?.role === 'admin'
  const dashboardPath = isAdmin ? '/admin' : '/customer'

  async function handleLogout() {
    if (!window.confirm('Are you sure you want to log out?')) return

    setLoggingOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Printer size={27} />
          <span>J-Prints</span>

          <button
            className="mobile-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-label">MAIN MENU</div>

        <nav className="sidebar-nav">
          <NavLink
            to={dashboardPath}
            end
            onClick={closeMenu}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin/customers"
              onClick={closeMenu}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <Users size={19} />
              <span>Customers</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-bottom">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={19} />
            {loggingOut ? 'Logging Out...' : 'Log Out'}
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <strong>{title}</strong>
          </div>

          <div className="user-chip">
            <span className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>

            <div>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}