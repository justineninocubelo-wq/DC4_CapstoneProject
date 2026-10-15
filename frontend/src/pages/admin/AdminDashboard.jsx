import { ClipboardList, Printer, Users, Wrench } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <h1>Dashboard Overview</h1>
      <p className="muted">Manage J-Prints services and customer requests.</p>

      <div className="dashboard-grid">
        <div className="stat-card"><Users /><h3>Customers</h3><p>Customer Management</p></div>
        <div className="stat-card"><Printer /><h3>Services</h3><p>Printing and Repair Services</p></div>
        <div className="stat-card"><ClipboardList /><h3>Service Requests</h3><p>Track Incoming Requests</p></div>
        <div className="stat-card"><Wrench /><h3>Service Records</h3><p>View Service History</p></div>
      </div>
    </DashboardLayout>
  )
}
