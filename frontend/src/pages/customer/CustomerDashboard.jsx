import { ClipboardList, Printer, Wrench } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'

export default function CustomerDashboard() {
  return (
    <DashboardLayout title="Customer Dashboard">
      <h1>Welcome to J-Prints!</h1>
      <p className="muted">Your printing and printer repair services in one place.</p>

      <div className="dashboard-grid">
        <div className="stat-card"><Printer /><h3>Printing Services</h3><p>Explore available printing services</p></div>
        <div className="stat-card"><Wrench /><h3>Printer Repair</h3><p>Request printer maintenance or repair</p></div>
        <div className="stat-card"><ClipboardList /><h3>My Requests</h3><p>Track your service requests</p></div>
      </div>
    </DashboardLayout>
  )
}
