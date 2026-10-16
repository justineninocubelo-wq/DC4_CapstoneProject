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
  UserCircle
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'

const adminLinks = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    end: true
  },
  {
    label: 'Customers',
    path: '/admin/customers',
    icon: Users
  },
  {
    label: 'Services',
    path: '/admin/services',
    icon: Wrench
  },
  {
    label: 'Service Requests',
    path: '/admin/service-requests',
    icon: ClipboardList
  },
  {
    label: 'Service Records',
    path: '/admin/service-records',
    icon: FileText
  }
]

const customerLinks = [
  {
    label: 'Dashboard',
    path: '/customer',
    icon: LayoutDashboard,
    end: true
  }
]

export default function DashboardLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const links = isAdmin ? adminLinks : customerLinks

  async function handleLogout() {
    if (loggingOut) return

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

  const userName = user?.name || 'J-Prints User'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Printer size={27} />
          <span>J-Prints</span>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-label">
          MAIN MENU
        </div>

        <nav className="sidebar-nav">
          {links.map(link => {
            const Icon = link.icon

            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={19} />
                <span>{link.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={19} />
            <span>{loggingOut ? 'Logging Out...' : 'Log Out'}</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
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

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}