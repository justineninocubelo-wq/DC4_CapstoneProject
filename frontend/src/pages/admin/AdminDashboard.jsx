import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Printer, ClipboardList, Wrench, FileText, Clock,
  CheckCircle2, RefreshCw, ArrowRight, AlertCircle,
} from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../services/api'
import './AdminDashboard.css'

const getCollection = (payload, key) => {
  const value = payload?.[key] ?? payload
  return Array.isArray(value) ? value : (Array.isArray(value?.data) ? value.data : [])
}

const getTotal = (payload, key) => {
  const value = payload?.[key] ?? payload
  return typeof value?.total === 'number' ? value.total : getCollection(payload, key).length
}

const statusClass = (status) => String(status || 'unknown').toLowerCase().replace(/\s+/g, '-')

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      const [customers, services, requests, records] = await Promise.all([
        api.get('/customers', { params: { per_page: 1 }, signal }),
        api.get('/admin/services', { params: { per_page: 100 }, signal }),
        api.get('/service-requests', { params: { per_page: 100 }, signal }),
        api.get('/service-records', { signal }),
      ])
      if (signal?.aborted) return
      const requestRows = getCollection(requests.data)
      const serviceRows = getCollection(services.data, 'services')
      setData({
        customers: getTotal(customers.data, 'customers'),
        services: serviceRows.filter((service) => service.is_active && ['printing', 'repair'].includes(service.service_type)).length,
        requests: getTotal(requests.data),
        active: requestRows.filter((request) => ['Received', 'Diagnosing', 'Repairing'].includes(request.status)).length,
        ready: requestRows.filter((request) => request.status === 'Ready').length,
        completed: requestRows.filter((request) => request.status === 'Released').length,
        records: getCollection(records.data).length,
        recent: [...requestRows].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5),
        requestsTruncated: getTotal(requests.data) > requestRows.length,
      })
    } catch (err) {
      if (signal?.aborted || err.code === 'ERR_CANCELED') return
      setError(err.response?.data?.message || 'Unable to load dashboard information. Please try again.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) loadDashboard(controller.signal)
    })
    return () => controller.abort()
  }, [loadDashboard])

  const stats = [
    { label: 'Total Customers', value: data?.customers, icon: Users },
    { label: 'Total Requests', value: data?.requests, icon: ClipboardList },
    { label: 'Active Requests', value: data?.active, icon: Wrench },
    { label: 'Ready for Release', value: data?.ready, icon: Clock },
  ]
  const shortcuts = [
    { label: 'Customers', detail: 'Manage customer accounts', path: '/admin/customers', icon: Users },
    { label: 'Services', detail: 'Manage printing and repair', path: '/admin/services', icon: Printer },
    { label: 'Service Requests', detail: 'Review and update requests', path: '/admin/service-requests', icon: ClipboardList },
    { label: 'Service Records', detail: 'View completed work records', path: '/admin/service-records', icon: FileText },
  ]

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="jad-heading">
        <div><h1>Dashboard Overview</h1><p className="muted">A quick look at J-Prints operations and customer requests.</p></div>
        <button type="button" className="jad-refresh" onClick={() => loadDashboard()} disabled={loading}>
          <RefreshCw size={17} /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="jad-error" role="alert"><AlertCircle size={19} /> {error}</div>}
      {loading && !data && <p className="muted" role="status">Loading dashboard statistics...</p>}

      {data && <>
        <div className="jad-stats">
          {stats.map(({ label, value, icon: Icon }) => (
            <div className="jad-stat" key={label}><span className="jad-stat-icon"><Icon size={23} /></span><span className="jad-stat-label">{label}</span><strong>{value}</strong></div>
          ))}
        </div>
        {data.requestsTruncated && <p className="jad-note">Active, ready and completed counts reflect the latest 100 requests. Total Requests includes all requests.</p>}
        <div className="jad-details">
          <section className="jad-panel">
            <div className="jad-panel-heading"><h2>Recent Service Requests</h2><Link to="/admin/service-requests">View all <ArrowRight size={16} /></Link></div>
            {data.recent.length ? <div className="jad-table-wrap"><table className="jad-table"><thead><tr><th>Request</th><th>Service</th><th>Status</th></tr></thead><tbody>
              {data.recent.map((request) => <tr key={request.id}><td>#{request.id}</td><td>{request.service?.service_name || request.service_name || 'Service'}</td><td><span className={`jad-status jad-status-${statusClass(request.status)}`}>{request.status || 'Unknown'}</span></td></tr>)}
            </tbody></table></div> : <p className="muted">No service requests yet.</p>}
          </section>
          <section className="jad-panel jad-summary"><h2>Service Summary</h2>
            <div><span><Printer size={18} /> Active Official Services</span><strong>{data.services}</strong></div>
            <div><span><CheckCircle2 size={18} /> Released Requests</span><strong>{data.completed}</strong></div>
            <div><span><FileText size={18} /> Service Records</span><strong>{data.records}</strong></div>
          </section>
        </div>
      </>}
      <section className="jad-shortcuts"><h2>Quick Management</h2><div className="jad-shortcut-grid">
        {shortcuts.map(({ label, detail, path, icon: Icon }) => <Link className="jad-shortcut" to={path} key={path}><Icon size={23} /><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={17} /></Link>)}
      </div></section>
    </DashboardLayout>
  )
}
