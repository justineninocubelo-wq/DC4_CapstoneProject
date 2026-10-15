import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { useAuth } from './contexts/useAuth'

// Authentication Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import CustomerManagement from './pages/admin/CustomerManagement'
import ServicesManagement from './pages/admin/ServicesManagement'

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard'

// Protect routes based on user role
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        Loading J-Prints...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toLowerCase()

  if (role !== allowedRole) {
    return (
      <Navigate
        to={role === 'admin' ? '/admin' : '/customer'}
        replace
      />
    )
  }

  return children
}

// Redirect users to their respective dashboards
function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        Loading J-Prints...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toLowerCase()

  return (
    <Navigate
      to={role === 'admin' ? '/admin' : '/customer'}
      replace
    />
  )
}

// Main Application
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Home */}
          <Route
            path="/"
            element={<HomeRedirect />}
          />

          {/* Authentication */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Customer Management */}
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute allowedRole="admin">
                <CustomerManagement />
              </ProtectedRoute>
            }
          />

          {/* Services Management */}
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute allowedRole="admin">
                <ServicesManagement />
              </ProtectedRoute>
            }
          />

          {/* Customer Dashboard */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}