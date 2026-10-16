import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/useAuth'
import DashboardLayout from './components/DashboardLayout'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import AdminDashboard from './pages/admin/AdminDashboard'
import CustomerManagement from './pages/admin/CustomerManagement'
import ServicesManagement from './pages/admin/ServicesManagement'
import ServiceRequestsManagement from './pages/admin/ServiceRequestsManagement'
import ServiceRecordsManagement from './pages/admin/ServiceRecordsManagement'

import CustomerDashboard from './pages/customer/CustomerDashboard'

function ProtectedRoute({ children, role }) {
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

  const userRole = user.role?.toLowerCase()

  if (role && userRole !== role) {
    return (
      <Navigate
        to={userRole === 'admin' ? '/admin' : '/customer'}
        replace
      />
    )
  }

  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        Loading J-Prints...
      </div>
    )
  }

  if (user) {
    return (
      <Navigate
        to={user.role?.toLowerCase() === 'admin' ? '/admin' : '/customer'}
        replace
      />
    )
  }

  return children
}

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

  return (
    <Navigate
      to={user.role?.toLowerCase() === 'admin' ? '/admin' : '/customer'}
      replace
    />
  )
}

function AdminPage({ title, children }) {
  return (
    <DashboardLayout title={title}>
      {children}
    </DashboardLayout>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/customers"
        element={
          <ProtectedRoute role="admin">
            <CustomerManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/services"
        element={
          <ProtectedRoute role="admin">
            <ServicesManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/service-requests"
        element={
          <ProtectedRoute role="admin">
            <AdminPage title="Service Requests Management">
              <ServiceRequestsManagement />
            </AdminPage>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/service-records"
        element={
          <ProtectedRoute role="admin">
            <AdminPage title="Service Records Management">
              <ServiceRecordsManagement />
            </AdminPage>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer"
        element={
          <ProtectedRoute role="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}