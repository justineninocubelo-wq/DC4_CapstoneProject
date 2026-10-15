import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Menu, Printer, X } from 'lucide-react'
import { useAuth } from '../contexts/useAuth'

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (!window.confirm('Are you sure you want to log out?')) return

    setLoggingOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Printer size={27} />
          <span>J-Prints</span>
          <button className="mobile-close" onClick={() => setMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-label">MAIN MENU</div>
        <div className="sidebar-item active">
          <LayoutDashboard size={19} />
          Dashboard
        </div>

        <div className="sidebar-bottom">
          <button onClick={handleLogout} disabled={loggingOut}>
            <LogOut size={19} /> Log Out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-button" onClick={() => setMenuOpen(true)}>
              <Menu size={23} />
            </button>
            <strong>{title}</strong>
          </div>

          <div className="user-chip">
            <span className="user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
