import { useCallback, useEffect, useState } from 'react'
import {
  Search, Plus, Eye, Pencil, Trash2, X,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react'
import api from '../../services/api'
import './ServiceRequestsManagement.css'

const statuses = [
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
  issue_description: '',
  document_description: '',
  number_of_copies: '1',
  paper_size: 'A4',
  color_mode: 'Black and White',
  printing_instructions: ''
}

function getError(error) {
  const data = error.response?.data
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }
  return data?.message || 'Something went wrong. Please try again.'
}

function isPrintingService(service) {
  return service?.service_type === 'printing'
}

function isPrintingRequest(request) {
  return request?.service?.service_type === 'printing' ||
    (!request?.service?.service_type && Boolean(request?.document_description))
}

function requestSummary(request) {
  if (isPrintingRequest(request)) {
    return {
      title: request.document_description || 'Document printing',
      subtitle: [
        request.number_of_copies
          ? `${request.number_of_copies} copies`
          : null,
        request.paper_size
      ].filter(Boolean).join(' · ')
    }
  }

  return {
    title: [request.printer_brand, request.printer_model]
      .filter(Boolean).join(' ') || 'Printer repair',
    subtitle: request.issue_description || ''
  }
}

function displayDate(value, withTime = false) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return withTime
    ? date.toLocaleString('en-PH')
    : date.toLocaleDateString('en-PH')
}

export default function ServiceRequestsManagement() {
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
  const [form, setForm] = useState({ ...emptyForm })
  const [newStatus, setNewStatus] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchRequests = useCallback(async (signal) => {
    const response = await api.get('/service-requests', {
      params: {
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        per_page: 10
      },
      signal
    })
    return response.data
  }, [search, statusFilter, page])

  const refresh = async () => {
    setLoading(true)
    try {
      const data = await fetchRequests()
      setRequests(data.data || [])
      setLastPage(data.last_page || 1)
      setTotal(data.total || 0)
      setError('')
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const data = await fetchRequests(controller.signal)
        if (!controller.signal.aborted) {
          setRequests(data.data || [])
          setLastPage(data.last_page || 1)
          setTotal(data.total || 0)
          setError('')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getError(err))
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchRequests])

  async function loadOptions() {
    try {
      const [customerResponse, serviceResponse] = await Promise.all([
        api.get('/customers', { params: { per_page: 100 } }),
        api.get('/admin/services', { params: { per_page: 100 } })
      ])

      setCustomers(customerResponse.data.customers?.data || [])
      setServices((serviceResponse.data.services?.data || []).filter(service => ['printing', 'repair'].includes(service.service_type)))
    } catch (err) {
      setError(getError(err))
    }
  }

  function openAdd() {
    setForm({ ...emptyForm })
    setSelected(null)
    setError('')
    setModal('add')
    loadOptions()
  }

  function openView(request) {
    setSelected(request)
    setError('')
    setModal('view')
  }

  function openEdit(request) {
    setSelected(request)
    setNewStatus(request.status)
    setForm({
      customer_id: String(request.customer_id || ''),
      service_id: String(request.service_id || ''),
      printer_brand: request.printer_brand || '',
      printer_model: request.printer_model || '',
      issue_description: request.issue_description || '',
      document_description: request.document_description || '',
      number_of_copies: String(request.number_of_copies ?? 1),
      paper_size: request.paper_size || 'A4',
      color_mode: request.color_mode || 'Black and White',
      printing_instructions: request.printing_instructions || ''
    })
    setError('')
    setModal('edit')
    loadOptions()
  }

  function closeModal() {
    if (saving) return
    setModal('')
    setSelected(null)
    setError('')
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
  }

  const chosenService = services.find(
    service => String(service.id) === String(form.service_id)
  )

  const printingForm = chosenService
    ? isPrintingService(chosenService)
    : modal === 'edit' && isPrintingRequest(selected)

  const availableStatuses = selected
    ? [selected.status, ...(nextStatuses[selected.status] || [])]
    : []

  async function saveRequest(event) {
    event.preventDefault()
    setError('')

    if (printingForm) {
      const copies = Number(form.number_of_copies)
      if (
        !form.document_description.trim() ||
        !Number.isInteger(copies) ||
        copies < 1 ||
        copies > 100000
      ) {
        setError('Enter a document description and 1–100,000 copies.')
        return
      }
    } else if (!form.printer_brand.trim() || !form.issue_description.trim()) {
      setError('Please complete the required printer repair fields.')
      return
    }

    const details = printingForm
      ? {
          document_description: form.document_description.trim(),
          number_of_copies: Number(form.number_of_copies),
          paper_size: form.paper_size,
          color_mode: form.color_mode,
          printing_instructions:
            form.printing_instructions.trim() || null
        }
      : {
          printer_brand: form.printer_brand.trim(),
          printer_model: form.printer_model.trim() || null,
          issue_description: form.issue_description.trim()
        }

    if (!chosenService || !['printing', 'repair'].includes(chosenService.service_type)) {
      setError('Please select an official J-Prints service.')
      return
    }

    const payload = {
      service_id: Number(form.service_id),
      ...details
    }

    if (modal === 'add') {
      payload.customer_id = Number(form.customer_id)
    } else {
      payload.status = newStatus
    }

    setSaving(true)

    try {
      if (modal === 'add') {
        await api.post('/service-requests', payload)
        setMessage('Service request created successfully.')
      } else {
        await api.patch(`/service-requests/${selected.id}`, payload)
        setMessage('Service request updated successfully.')
      }

      closeAfterSave()
      await refresh()
    } catch (err) {
      setError(getError(err))
    } finally {
      setSaving(false)
    }
  }

  function closeAfterSave() {
    setModal('')
    setSelected(null)
    setError('')
  }

  async function deleteRequest() {
    if (!selected) return
    setSaving(true)
    setError('')

    try {
      await api.delete(`/service-requests/${selected.id}`)
      setMessage('Service request deleted successfully.')
      closeAfterSave()

      if (requests.length === 1 && page > 1) {
        setPage(previous => previous - 1)
      } else {
        await refresh()
      }
    } catch (err) {
      setError(getError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="jpr-page">
      <div className="jpr-heading">
        <div>
          <h1>Service Requests Management</h1>
          <p>Manage printing, photocopying, and printer repair requests.</p>
        </div>
        <button type="button" className="jpr-primary" onClick={openAdd}>
          <Plus size={18} /> New Request
        </button>
      </div>

      {message && (
        <div className="jpr-success" role="status">
          {message}
          <button
            type="button"
            onClick={() => setMessage('')}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
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
              aria-label="Search service requests"
              placeholder="Search requests or customers..."
              value={search}
              onChange={event => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={event => {
              setStatusFilter(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <button
            type="button"
            className="jpr-outline"
            onClick={refresh}
            title="Refresh"
            aria-label="Refresh requests"
          >
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
                <th>Request Details</th>
                <th>Status</th>
                <th>Date Received</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="jpr-empty">
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="jpr-empty">
                    No service requests found.
                  </td>
                </tr>
              ) : requests.map(request => {
                const summary = requestSummary(request)

                return (
                  <tr key={request.id}>
                    <td>#{request.id}</td>
                    <td>{request.customer?.user?.name || 'N/A'}</td>
                    <td>{request.service?.service_name || 'N/A'}</td>
                    <td>
                      <div className="jpr-request-summary">
                        <strong>{summary.title}</strong>
                        {summary.subtitle && (
                          <span>{summary.subtitle}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`jpr-status status-${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>{displayDate(request.received_at)}</td>
                    <td>
                      <div className="jpr-actions">
                        <button
                          type="button"
                          title="View"
                          aria-label={`View request ${request.id}`}
                          onClick={() => openView(request)}
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          aria-label={`Edit request ${request.id}`}
                          onClick={() => openEdit(request)}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          aria-label={`Delete request ${request.id}`}
                          className="danger"
                          onClick={() => {
                            setSelected(request)
                            setError('')
                            setModal('delete')
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="jpr-footer">
          <span>
            {total} total request{total !== 1 ? 's' : ''}
          </span>
          <div className="jpr-pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(previous => previous - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>
            <span>Page {page} of {lastPage}</span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage(previous => previous + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <div
          className="jpr-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div className="jpr-modal" role="dialog" aria-modal="true">
            <div className="jpr-modal-header">
              <h2>
                {modal === 'add'
                  ? 'New Service Request'
                  : modal === 'edit'
                    ? 'Edit Service Request'
                    : modal === 'delete'
                      ? 'Delete Service Request'
                      : 'Service Request Details'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="jpr-error" role="alert">{error}</div>
            )}

            {modal === 'view' && selected && (
              <div className="jpr-details">
                <p><strong>Request ID:</strong> #{selected.id}</p>
                <p>
                  <strong>Customer:</strong>{' '}
                  {selected.customer?.user?.name || 'N/A'}
                </p>
                <p>
                  <strong>Email:</strong>{' '}
                  {selected.customer?.user?.email || 'N/A'}
                </p>
                <p>
                  <strong>Service:</strong>{' '}
                  {selected.service?.service_name || 'N/A'}
                </p>

                {isPrintingRequest(selected) ? (
                  <>
                    <h3 className="jpr-detail-subtitle">
                      Printing Information
                    </h3>
                    <p>
                      <strong>Document Description:</strong>{' '}
                      {selected.document_description || 'N/A'}
                    </p>
                    <p>
                      <strong>Number of Copies:</strong>{' '}
                      {selected.number_of_copies ?? 'N/A'}
                    </p>
                    <p>
                      <strong>Paper Size:</strong>{' '}
                      {selected.paper_size || 'N/A'}
                    </p>
                    <p>
                      <strong>Color Mode:</strong>{' '}
                      {selected.color_mode || 'N/A'}
                    </p>
                    <p>
                      <strong>Additional Instructions:</strong>{' '}
                      {selected.printing_instructions || 'None'}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="jpr-detail-subtitle">
                      Printer Information
                    </h3>
                    <p>
                      <strong>Printer Brand:</strong>{' '}
                      {selected.printer_brand || 'N/A'}
                    </p>
                    <p>
                      <strong>Printer Model:</strong>{' '}
                      {selected.printer_model || 'N/A'}
                    </p>
                    <p>
                      <strong>Issue Description:</strong>{' '}
                      {selected.issue_description || 'N/A'}
                    </p>
                  </>
                )}

                <p><strong>Status:</strong> {selected.status}</p>
                <p>
                  <strong>Received:</strong>{' '}
                  {displayDate(selected.received_at, true)}
                </p>

                <div className="jpr-modal-actions">
                  <button
                    type="button"
                    className="jpr-outline"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {(modal === 'add' || modal === 'edit') && (
              <form className="jpr-form" onSubmit={saveRequest}>
                {modal === 'add' && (
                  <label>
                    Customer
                    <select
                      required
                      name="customer_id"
                      value={form.customer_id}
                      onChange={updateField}
                    >
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
                  <select
                    required
                    name="service_id"
                    value={form.service_id}
                    onChange={updateField}
                  >
                    <option value="">Select service</option>
                    {services
                      .filter(service =>
                        service.is_active ||
                        String(service.id) === String(form.service_id)
                      )
                      .map(service => (
                        <option key={service.id} value={service.id}>
                          {service.service_name}
                        </option>
                      ))}
                  </select>
                </label>

                {printingForm ? (
                  <>
                    <label>
                      Document Description
                      <input
                        required
                        name="document_description"
                        maxLength={255}
                        value={form.document_description}
                        onChange={updateField}
                        placeholder="e.g. School Assignment"
                      />
                    </label>

                    <label>
                      Number of Copies
                      <input
                        required
                        type="number"
                        name="number_of_copies"
                        min="1"
                        max="100000"
                        step="1"
                        value={form.number_of_copies}
                        onChange={updateField}
                      />
                    </label>

                    <label>
                      Paper Size
                      <select
                        required
                        name="paper_size"
                        value={form.paper_size}
                        onChange={updateField}
                      >
                        {[
                          'A4', 'Letter', 'Legal',
                          'Short', 'Long', 'Other'
                        ].map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Color Mode
                      <select
                        required
                        name="color_mode"
                        value={form.color_mode}
                        onChange={updateField}
                      >
                        <option value="Black and White">
                          Black and White
                        </option>
                        <option value="Colored">Colored</option>
                      </select>
                    </label>

                    <label>
                      Additional Instructions
                      <textarea
                        name="printing_instructions"
                        rows={4}
                        value={form.printing_instructions}
                        onChange={updateField}
                        placeholder="e.g. Print double-sided"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Printer Brand
                      <input
                        required
                        name="printer_brand"
                        maxLength={255}
                        value={form.printer_brand}
                        onChange={updateField}
                        placeholder="e.g. Epson"
                      />
                    </label>

                    <label>
                      Printer Model
                      <input
                        name="printer_model"
                        maxLength={255}
                        value={form.printer_model}
                        onChange={updateField}
                        placeholder="e.g. EcoTank L3210"
                      />
                    </label>

                    <label>
                      Issue Description
                      <textarea
                        required
                        name="issue_description"
                        rows={4}
                        value={form.issue_description}
                        onChange={updateField}
                        placeholder="Describe the printer issue..."
                      />
                    </label>
                  </>
                )}

                {modal === 'edit' && (
                  <label>
                    Request Status
                    <select
                      value={newStatus}
                      onChange={event => setNewStatus(event.target.value)}
                    >
                      {availableStatuses.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="jpr-modal-actions">
                  <button
                    type="button"
                    className="jpr-outline"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="jpr-primary"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : modal === 'add'
                        ? 'Create Request'
                        : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {modal === 'delete' && selected && (
              <div className="jpr-details">
                <p>
                  Are you sure you want to delete request{' '}
                  <strong>#{selected.id}</strong>?
                </p>
                <p>
                  This action cannot be undone. Requests with service
                  records cannot be deleted.
                </p>
                <div className="jpr-modal-actions">
                  <button
                    type="button"
                    className="jpr-outline"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="jpr-danger-button"
                    onClick={deleteRequest}
                    disabled={saving}
                  >
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