import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Printer,
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardList,
  FileText,
  LogOut,
  Menu,
  X,
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'
import './DashboardLayout.css'

const adminLinks = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Services', path: '/admin/services', icon: Wrench },
  { label: 'Service Requests', path: '/admin/service-requests', icon: ClipboardList },
  { label: 'Service Records', path: '/admin/service-records', icon: FileText }
]

const customerLinks = [
  { label: 'Dashboard', path: '/customer', icon: LayoutDashboard, end: true }
]

export default function DashboardLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('jprints-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const links = isAdmin ? adminLinks : customerLinks

  const userName = user?.name || 'J-Prints User'
  const userInitial = userName.charAt(0).toUpperCase()

  function toggleCollapsed() {
    setCollapsed(previous => {
      const next = !previous

      try {
        localStorage.setItem('jprints-sidebar-collapsed', String(next))
      } catch {
        // Sidebar toggle still works without local storage.
      }

      return next
    })
  }

  function openLogoutModal() {
    setShowLogoutModal(true)
  }

  function closeLogoutModal() {
    if (!loggingOut) {
      setShowLogoutModal(false)
    }
  }

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await logout()
      setShowLogoutModal(false)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
      setShowLogoutModal(false)
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className={`app-shell jprints-layout ${collapsed ? 'jprints-layout-collapsed' : ''}`}>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Printer size={27} className="jprints-brand-icon" aria-hidden="true" />

          <span className="jprints-brand-name">J-Prints</span>

          <button
            type="button"
            className="jprints-collapse-button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed
              ? <PanelLeftOpen size={19} />
              : <PanelLeftClose size={19} />}
          </button>

          <button
            type="button"
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-label">MAIN MENU</div>

        <nav className="sidebar-nav" aria-label="Main menu">
          {links.map(link => {
            const Icon = link.icon

            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? link.label : undefined}
                aria-label={link.label}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={19} aria-hidden="true" />
                <span className="jprints-nav-label">{link.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            onClick={openLogoutModal}
            disabled={loggingOut}
            title={collapsed ? 'Log Out' : undefined}
            aria-label="Log Out"
          >
            <LogOut size={19} aria-hidden="true" />
            <span className="jprints-nav-label">Log Out</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <strong>{title || 'J-Prints Dashboard'}</strong>
          </div>

          <div className="user-chip">
            <div>
              <strong>{userName}</strong>
              <small>{isAdmin ? 'Administrator' : 'Customer'}</small>
            </div>

            <div className="user-avatar" title={userName}>
              {userInitial || <UserCircle size={20} />}
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>

      {showLogoutModal && (
        <div
          className="jprints-modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closeLogoutModal()
            }
          }}
        >
          <div
            className="jprints-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
          >
            <div className="jprints-modal-icon">
              <AlertTriangle size={28} />
            </div>

            <h2 id="logout-title">Confirm Logout</h2>

            <p id="logout-description">
              Are you sure you want to log out of your J-Prints account?
            </p>

            <div className="jprints-modal-actions">
              <button
                type="button"
                className="jprints-cancel-button"
                onClick={closeLogoutModal}
                disabled={loggingOut}
                autoFocus
              >
                Cancel
              </button>

              <button
                type="button"
                className="jprints-confirm-logout-button"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut size={17} />
                {loggingOut ? 'Logging Out...' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}