import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AdminDashboard from './pages/admin/AdminDashboard'
import CustomerDashboard from './pages/customer/CustomerDashboard'

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading J-Prints...</div>
  if (!user) return <Navigate to="/login" replace />

  const role = user.role?.toLowerCase()

  if (role !== allowedRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/customer'} replace />
  }

  return children
}

function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading J-Prints...</div>
  if (!user) return <Navigate to="/login" replace />

  return <Navigate to={user.role?.toLowerCase() === 'admin' ? '/admin' : '/customer'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}