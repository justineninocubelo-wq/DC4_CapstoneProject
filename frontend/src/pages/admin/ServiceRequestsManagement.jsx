import { useEffect, useState } from 'react'
import {
  Search, Plus, Eye, Pencil, Trash2, X,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react'
import api from '../../services/api'
import './ServiceRequestsManagement.css'

const statusOptions = [
  'Received', 'Diagnosing', 'Repairing',
  'Ready', 'Released', 'Cancelled'
]

const nextStatuses = {
  Received: ['Diagnosing', 'Cancelled'],
  Diagnosing: ['Repairing'],
  Repairing: ['Ready'],
  Ready: ['Released'],
  Released: [],
  Cancelled: []
}

const emptyForm = {
  customer_id: '',
  service_id: '',
  printer_brand: '',
  printer_model: '',
  issue_description: ''
}

function getError(error) {
  const data = error.response?.data
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }
  return data?.message || 'Something went wrong. Please try again.'
}

function ServiceRequestsManagement() {
  const [requests, setRequests] = useState([])
  const [customers, setCustomers] = useState([])
  const [services, setServices] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [newStatus, setNewStatus] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadRequests() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/service-requests', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          page,
          per_page: 10
        }
      })
      setRequests(response.data.data || [])
      setLastPage(response.data.last_page || 1)
      setTotal(response.data.total || 0)
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function fetchRequests() {
      setLoading(true)
      try {
        const response = await api.get('/service-requests', {
          params: {
            search: search || undefined,
            status: statusFilter || undefined,
            page,
            per_page: 10
          }
        })
        if (!cancelled) {
          setRequests(response.data.data || [])
          setLastPage(response.data.last_page || 1)
          setTotal(response.data.total || 0)
          setError('')
        }
      } catch (err) {
        if (!cancelled) setError(getError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const timer = setTimeout(fetchRequests, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, statusFilter, page])

  async function loadOptions() {
    try {
      const [customerResponse, serviceResponse] = await Promise.all([
        api.get('/customers', { params: { per_page: 100 } }),
        api.get('/admin/services', { params: { per_page: 100 } })
      ])
      setCustomers(customerResponse.data.customers?.data || [])
      setServices(serviceResponse.data.services?.data || [])
    } catch (err) {
      setError(getError(err))
    }
  }

  function openAdd() {
    setForm(emptyForm)
    setSelected(null)
    setModal('add')
    setError('')
    loadOptions()
  }

  function openView(request) {
    setSelected(request)
    setModal('view')
    setError('')
  }

  function openEdit(request) {
    setSelected(request)
    setNewStatus(request.status)
    setForm({
      service_id: String(request.service_id || ''),
      printer_brand: request.printer_brand || '',
      printer_model: request.printer_model || '',
      issue_description: request.issue_description || ''
    })
    setModal('edit')
    setError('')
    loadOptions()
  }

  function closeModal() {
    if (saving) return
    setModal('')
    setSelected(null)
    setError('')
  }

  async function saveRequest(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (modal === 'add') {
        await api.post('/service-requests', {
          ...form,
          customer_id: Number(form.customer_id),
          service_id: Number(form.service_id)
        })
        setMessage('Service request created successfully.')
      } else {
        await api.patch(`/service-requests/${selected.id}`, {
          service_id: Number(form.service_id),
          printer_brand: form.printer_brand,
          printer_model: form.printer_model,
          issue_description: form.issue_description,
          status: newStatus
        })
        setMessage('Service request updated successfully.')
      }
      setModal('')
      setSelected(null)
      await loadRequests()
    } catch (err) {
      setError(getError(err))
    } finally {
      setSaving(false)
    }
  }

  async function deleteRequest() {
    setSaving(true)
    setError('')
    try {
      await api.delete(`/service-requests/${selected.id}`)
      setMessage('Service request deleted successfully.')
      setModal('')
      setSelected(null)
      if (requests.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadRequests()
      }
    } catch (err) {
      setError(getError(err))
    } finally {
      setSaving(false)
    }
  }

  const availableStatuses = selected
    ? [selected.status, ...(nextStatuses[selected.status] || [])]
    : []

  return (
    <div className="jpr-page">
      <div className="jpr-heading">
        <div>
          <h1>Service Requests Management</h1>
          <p>Manage printing, photocopying, and printer repair requests.</p>
        </div>
        <button className="jpr-primary" onClick={openAdd}>
          <Plus size={18} /> New Request
        </button>
      </div>

      {message && (
        <div className="jpr-success" role="status">
          {message}
          <button onClick={() => setMessage('')} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}

      {error && !modal && (
        <div className="jpr-error" role="alert">{error}</div>
      )}

      <div className="jpr-panel">
        <div className="jpr-toolbar">
          <div className="jpr-search">
            <Search size={18} />
            <input
              placeholder="Search requests or customers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button className="jpr-outline" onClick={loadRequests} title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="jpr-table-scroll">
          <table className="jpr-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Printer</th>
                <th>Status</th>
                <th>Date Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="jpr-empty">Loading requests...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="7" className="jpr-empty">No service requests found.</td></tr>
              ) : requests.map(request => (
                <tr key={request.id}>
                  <td>#{request.id}</td>
                  <td>{request.customer?.user?.name || 'N/A'}</td>
                  <td>{request.service?.service_name || 'N/A'}</td>
                  <td>{[request.printer_brand, request.printer_model].filter(Boolean).join(' ')}</td>
                  <td>
                    <span className={`jpr-status status-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{request.received_at ? new Date(request.received_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="jpr-actions">
                      <button title="View" onClick={() => openView(request)}><Eye size={17} /></button>
                      <button title="Edit" onClick={() => openEdit(request)}><Pencil size={17} /></button>
                      <button title="Delete" className="danger" onClick={() => { setSelected(request); setModal('delete'); setError('') }}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="jpr-footer">
          <span>{total} total request{total !== 1 ? 's' : ''}</span>
          <div className="jpr-pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={17} />
            </button>
            <span>Page {page} of {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <div className="jpr-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="jpr-modal" role="dialog" aria-modal="true">
            <div className="jpr-modal-header">
              <h2>
                {modal === 'add' ? 'New Service Request'
                  : modal === 'edit' ? 'Edit Service Request'
                  : modal === 'delete' ? 'Delete Service Request'
                  : 'Service Request Details'}
              </h2>
              <button onClick={closeModal} disabled={saving} aria-label="Close"><X size={20} /></button>
            </div>

            {error && <div className="jpr-error" role="alert">{error}</div>}

            {modal === 'view' && selected && (
              <div className="jpr-details">
                <p><strong>Request ID:</strong> #{selected.id}</p>
                <p><strong>Customer:</strong> {selected.customer?.user?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selected.customer?.user?.email || 'N/A'}</p>
                <p><strong>Service:</strong> {selected.service?.service_name || 'N/A'}</p>
                <p><strong>Printer Brand:</strong> {selected.printer_brand}</p>
                <p><strong>Printer Model:</strong> {selected.printer_model || 'N/A'}</p>
                <p><strong>Issue Description:</strong> {selected.issue_description}</p>
                <p><strong>Status:</strong> {selected.status}</p>
                <p><strong>Received:</strong> {selected.received_at ? new Date(selected.received_at).toLocaleString() : 'N/A'}</p>
                <div className="jpr-modal-actions">
                  <button className="jpr-outline" onClick={closeModal}>Close</button>
                </div>
              </div>
            )}

            {(modal === 'add' || modal === 'edit') && (
              <form onSubmit={saveRequest} className="jpr-form">
                {modal === 'add' && (
                  <label>
                    Customer
                    <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                      <option value="">Select customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.user?.name || `Customer #${customer.id}`}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  Service
                  <select required value={form.service_id} onChange={e => setForm({ ...form, service_id: e.target.value })}>
                    <option value="">Select service</option>
                    {services.filter(service => service.is_active || String(service.id) === String(form.service_id)).map(service => (
                      <option key={service.id} value={service.id}>
                        {service.service_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Printer Brand
                  <input required maxLength={255} value={form.printer_brand} onChange={e => setForm({ ...form, printer_brand: e.target.value })} placeholder="e.g. Epson" />
                </label>

                <label>
                  Printer Model
                  <input maxLength={255} value={form.printer_model} onChange={e => setForm({ ...form, printer_model: e.target.value })} placeholder="e.g. L3210" />
                </label>

                <label>
                  Issue Description
                  <textarea required rows="4" value={form.issue_description} onChange={e => setForm({ ...form, issue_description: e.target.value })} placeholder="Describe the service request..." />
                </label>

                {modal === 'edit' && (
                  <label>
                    Request Status
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                      {availableStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="jpr-modal-actions">
                  <button type="button" className="jpr-outline" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button type="submit" className="jpr-primary" disabled={saving}>
                    {saving ? 'Saving...' : modal === 'add' ? 'Create Request' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {modal === 'delete' && selected && (
              <div className="jpr-details">
                <p>Are you sure you want to delete request <strong>#{selected.id}</strong>?</p>
                <p>This action cannot be undone. Requests with service records cannot be deleted.</p>
                <div className="jpr-modal-actions">
                  <button className="jpr-outline" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button className="jpr-danger-button" onClick={deleteRequest} disabled={saving}>
                    {saving ? 'Deleting...' : 'Delete Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceRequestsManagement