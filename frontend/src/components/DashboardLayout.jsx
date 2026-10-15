import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Printer,
  Users,
  Wrench,
  X
} from 'lucide-react'

import { useAuth } from '../contexts/useAuth'

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isAdmin = user?.role?.toLowerCase() === 'admin'

  const dashboardPath = isAdmin ? '/admin' : '/customer'

  function closeMenu() {
    setMenuOpen(false)
  }

  async function handleLogout() {
    if (!window.confirm('Are you sure you want to log out?')) {
      return
    }

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

  return (
    <div className="app-shell">

      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>

        {/* Application Brand */}
        <div className="sidebar-brand">
          <Printer size={27} />
          <span>J-Prints</span>

          <button
            type="button"
            className="mobile-close"
            onClick={closeMenu}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="sidebar-label">
          MAIN MENU
        </div>

        <nav className="sidebar-nav">

          {/* Dashboard */}
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

          {/* Administrator Navigation */}
          {isAdmin && (
            <>
              {/* Customer Management */}
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

              {/* Services Management */}
              <NavLink
                to="/admin/services"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <Wrench size={19} />
                <span>Services</span>
              </NavLink>
            </>
          )}

        </nav>

        {/* Logout */}
        <div className="sidebar-bottom">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={19} />
            <span>
              {loggingOut ? 'Logging Out...' : 'Log Out'}
            </span>
          </button>
        </div>

      </aside>

      {/* Main Content */}
      <div className="main-area">

        {/* Top Navigation Bar */}
        <header className="topbar">

          <div className="topbar-left">
            <button
              type="button"
              className="menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={23} />
            </button>

            <strong>{title}</strong>
          </div>

          {/* User Information */}
          <div className="user-chip">

            <span className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>

            <div>
              <strong>
                {user?.name || 'User'}
              </strong>

              <small>
                {isAdmin ? 'Admin' : 'Customer'}
              </small>
            </div>

          </div>

        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>

      </div>

    </div>
  )
}