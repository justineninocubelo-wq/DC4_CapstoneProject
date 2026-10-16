import { useCallback, useEffect, useState } from 'react'
import {
  Printer,
  Wrench,
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  FileText,
} from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../services/api'
import './CustomerDashboard.css'

const statuses = [
  'Received',
  'Diagnosing',
  'Repairing',
  'Ready',
  'Released',
  'Cancelled',
]

const emptyForm = {
  service_id: '',
  printer_brand: '',
  printer_model: '',
  issue_description: '',
  document_description: '',
  number_of_copies: '1',
  paper_size: 'A4',
  color_mode: 'Black and White',
  printing_instructions: '',
}

const peso = (value) =>
  `₱${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getErrorMessage(error) {
  const data = error.response?.data

  if (data?.errors) {
    const firstError = Object.values(data.errors)[0]

    if (Array.isArray(firstError) && firstError.length) {
      return firstError[0]
    }
  }

  return data?.message || 'Something went wrong. Please try again.'
}

function getStatusClass(status) {
  return `jpc-status jpc-status-${String(status || '')
    .toLowerCase()
    .replace(/\s+/g, '-')}`
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="jpc-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="jpc-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="jpc-modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="jpc-icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="jpc-modal-content">{children}</div>
      </div>
    </div>
  )
}

export default function CustomerDashboard() {
  const [services, setServices] = useState([])
  const [requests, setRequests] = useState([])
  const [records, setRecords] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeTab, setActiveTab] = useState('requests')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [cancelRequest, setCancelRequest] = useState(null)

  const [form, setForm] = useState(emptyForm)

  const selectedService = services.find(
    (service) => String(service.id) === String(form.service_id),
  )
  const isPrintingService = selectedService?.service_type === 'printing'

  const loadData = useCallback(async () => {
    const results = await Promise.allSettled([
      api.get('/services'),
      api.get('/service-requests', {
        params: { per_page: 100 },
      }),
      api.get('/service-records'),
    ])

    const [servicesResult, requestsResult, recordsResult] = results
    const errors = []

    if (servicesResult.status === 'fulfilled') {
      const data = servicesResult.value.data
      setServices(Array.isArray(data.services) ? data.services.filter(service => ['printing', 'repair'].includes(service.service_type)) : [])
    } else {
      errors.push('Unable to load available services.')
    }

    if (requestsResult.status === 'fulfilled') {
      const data = requestsResult.value.data
      setRequests(Array.isArray(data.data) ? data.data : [])
    } else {
      errors.push(getErrorMessage(requestsResult.reason))
    }

    if (recordsResult.status === 'fulfilled') {
      const data = recordsResult.value.data
      setRecords(Array.isArray(data) ? data : [])
    } else {
      errors.push('Unable to load service records.')
    }

    setError(errors.join(' '))
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      await loadData()

      if (cancelled) return
    }

    initialize()

    return () => {
      cancelled = true
    }
  }, [loadData])

  async function refreshData() {
    setRefreshing(true)
    setSuccess('')

    try {
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  function openNewRequest(serviceId = '') {
    setForm({
      ...emptyForm,
      service_id: serviceId ? String(serviceId) : '',
    })
    setError('')
    setShowRequestModal(true)
  }

  function updateForm(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function submitRequest(event) {
    event.preventDefault()

    if (!selectedService || !['printing', 'repair'].includes(selectedService.service_type)) {
      setError('Please select an available official service.')
      return
    }

    if (isPrintingService) {
      if (!form.document_description.trim() ||
          !Number.isInteger(Number(form.number_of_copies)) ||
          Number(form.number_of_copies) < 1 ||
          Number(form.number_of_copies) > 100000) {
        setError('Please enter a document description and a valid number of copies.')
        return
      }
    } else if (!form.printer_brand.trim() || !form.issue_description.trim()) {
      setError('Please complete the required printer repair details.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = isPrintingService
        ? {
            service_id: Number(form.service_id),
            document_description: form.document_description.trim(),
            number_of_copies: Number(form.number_of_copies),
            paper_size: form.paper_size,
            color_mode: form.color_mode,
            printing_instructions: form.printing_instructions.trim() || null,
          }
        : {
            service_id: Number(form.service_id),
            printer_brand: form.printer_brand.trim(),
            printer_model: form.printer_model.trim() || null,
            issue_description: form.issue_description.trim(),
          }

      await api.post('/service-requests', payload)
      setShowRequestModal(false)
      setForm(emptyForm)
      setSuccess('Your service request was submitted successfully.')
      setActiveTab('requests')
      setStatusFilter('All')
      setSearch('')
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function confirmCancellation() {
    if (!cancelRequest) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await api.patch(`/service-requests/${cancelRequest.id}/cancel`)

      setCancelRequest(null)
      setSelectedRequest(null)
      setSuccess('Service request cancelled successfully.')

      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const counts = {
    total: requests.length,
    active: requests.filter(
      (request) => !['Released', 'Cancelled'].includes(request.status),
    ).length,
    ready: requests.filter(
      (request) => request.status === 'Ready',
    ).length,
    completed: requests.filter(
      (request) => request.status === 'Released',
    ).length,
  }

  const filteredRequests = requests.filter((request) => {
    const text = [
      request.id,
      request.service?.service_name,
      request.printer_brand,
      request.printer_model,
      request.issue_description,
      request.document_description,
      request.printing_instructions,
      request.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch = text.includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'All' || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const filteredRecords = records.filter((record) => {
    const text = [
      record.id,
      record.service_request_id,
      record.diagnosis,
      record.work_performed,
      record.parts_used,
      record.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return text.includes(search.toLowerCase())
  })

  const filteredServices = services.filter((service) => {
    const text = [
      service.service_name,
      service.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return text.includes(search.toLowerCase())
  })

  return (
    <DashboardLayout title="Customer Dashboard">
      <div className="jpc-dashboard">
        <div className="jpc-page-heading">
          <div>
            <h1>Welcome to J-Prints!</h1>
            <p>
              Your printing and printer repair services in one place.
            </p>
          </div>

          <button
            type="button"
            className="jpc-primary-button"
            onClick={() => openNewRequest()}
          >
            <Plus size={18} />
            New Request
          </button>
        </div>

        {success && (
          <div className="jpc-alert jpc-alert-success" role="status">
            <CheckCircle2 size={19} />
            <span>{success}</span>
            <button type="button" className="jpc-alert-close" aria-label="Dismiss success notification" onClick={() => setSuccess('')}>
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div className="jpc-alert jpc-alert-error" role="alert">
            <AlertCircle size={19} />
            <span>{error}</span>
            <button type="button" className="jpc-alert-close" aria-label="Dismiss error notification" onClick={() => setError('')}>
              <X size={17} />
            </button>
          </div>
        )}

        <div className="jpc-stats-grid">
          <div className="jpc-stat-card">
            <div className="jpc-stat-icon">
              <ClipboardList size={25} />
            </div>
            <p>Total Requests</p>
            <h2>{counts.total}</h2>
          </div>

          <div className="jpc-stat-card">
            <div className="jpc-stat-icon">
              <Wrench size={25} />
            </div>
            <p>Active Requests</p>
            <h2>{counts.active}</h2>
          </div>

          <div className="jpc-stat-card">
            <div className="jpc-stat-icon">
              <Clock size={25} />
            </div>
            <p>Ready for Release</p>
            <h2>{counts.ready}</h2>
          </div>

          <div className="jpc-stat-card">
            <div className="jpc-stat-icon">
              <CheckCircle2 size={25} />
            </div>
            <p>Completed</p>
            <h2>{counts.completed}</h2>
          </div>
        </div>

        <div className="jpc-main-card">
          <div className="jpc-tabs">
            <button
              type="button"
              className={activeTab === 'requests' ? 'active' : ''}
              onClick={() => {
                setActiveTab('requests')
                setSearch('')
              }}
            >
              <ClipboardList size={18} />
              My Requests
            </button>

            <button
              type="button"
              className={activeTab === 'services' ? 'active' : ''}
              onClick={() => {
                setActiveTab('services')
                setSearch('')
              }}
            >
              <Printer size={18} />
              Available Services
            </button>

            <button
              type="button"
              className={activeTab === 'records' ? 'active' : ''}
              onClick={() => {
                setActiveTab('records')
                setSearch('')
              }}
            >
              <FileText size={18} />
              Service History
            </button>
          </div>

          <div className="jpc-toolbar">
            <div className="jpc-search">
              <Search size={19} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeTab === 'requests'
                    ? 'Search your requests...'
                    : activeTab === 'services'
                      ? 'Search available services...'
                      : 'Search service records...'
                }
              />
            </div>

            {activeTab === 'requests' && (
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="jpc-icon-button"
              onClick={refreshData}
              disabled={refreshing}
              title="Refresh data"
              aria-label="Refresh data"
            >
              <RefreshCw size={19} />
            </button>
          </div>

          {loading ? (
            <div className="jpc-empty-state">
              <RefreshCw size={30} />
              <p>Loading your dashboard...</p>
            </div>
          ) : (
            <>
              {activeTab === 'requests' && (
                <div className="jpc-table-wrapper">
                  <table className="jpc-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Service</th>
                        <th>Printer</th>
                        <th>Status</th>
                        <th>Date Received</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request.id}>
                          <td>#{request.id}</td>
                          <td>
                            {request.service?.service_name || '—'}
                          </td>
                          <td>
                            {request.document_description ? (
                              <>
                                <strong>{request.document_description}</strong>
                                <div className="jpc-muted">
                                  {request.number_of_copies} copies · {request.paper_size || '—'}
                                </div>
                              </>
                            ) : (
                              <>
                                <strong>{request.printer_brand || '—'}</strong>
                                <div className="jpc-muted">
                                  {request.printer_model || 'Model not specified'}
                                </div>
                              </>
                            )}
                          </td>
                          <td>
                            <span className={getStatusClass(request.status)}>
                              {request.status}
                            </span>
                          </td>
                          <td>{formatDate(request.received_at)}</td>
                          <td>
                            <div className="jpc-actions">
                              <button
                                type="button"
                                className="jpc-icon-button"
                                title="View request"
                                aria-label={`View request ${request.id}`}
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye size={18} />
                              </button>

                              {request.status === 'Received' && (
                                <button
                                  type="button"
                                  className="jpc-icon-button jpc-danger-text"
                                  title="Cancel request"
                                  aria-label={`Cancel request ${request.id}`}
                                  onClick={() => setCancelRequest(request)}
                                >
                                  <Ban size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredRequests.length === 0 && (
                        <tr>
                          <td colSpan="6">
                            <div className="jpc-empty-state">
                              <ClipboardList size={32} />
                              <h3>No service requests found</h3>
                              <p>
                                Submit a request to get started with J-Prints.
                              </p>
                              <button
                                type="button"
                                className="jpc-primary-button"
                                onClick={() => openNewRequest()}
                              >
                                <Plus size={17} />
                                New Request
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'services' && (
                <div className="jpc-services-grid">
                  {filteredServices.map((service) => (
                    <div className="jpc-service-card" key={service.id}>
                      <div className="jpc-service-icon">
                        <Printer size={26} />
                      </div>

                      <h3>{service.service_name}</h3>
                      <p>{service.description || 'J-Prints service'}</p>

                      <div className="jpc-service-footer">
                        <div className="jpc-service-price"><span>Starting price</span><strong>{peso(service.base_price)}</strong></div>

                        <button
                          type="button"
                          className="jpc-primary-button"
                          onClick={() => openNewRequest(service.id)}
                        >
                          Request Service
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredServices.length === 0 && (
                    <div className="jpc-empty-state">
                      <Printer size={32} />
                      <h3>No available services found</h3>
                      <p>Please try another search.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'records' && (
                <div className="jpc-table-wrapper">
                  <table className="jpc-table">
                    <thead>
                      <tr>
                        <th>Record ID</th>
                        <th>Request</th>
                        <th>Diagnosis</th>
                        <th>Work Performed</th>
                        <th>Labor Cost</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id}>
                          <td>#{record.id}</td>
                          <td>#{record.service_request_id}</td>
                          <td>{record.diagnosis || '—'}</td>
                          <td>{record.work_performed || '—'}</td>
                          <td>{peso(record.labor_cost)}</td>
                          <td>{formatDate(record.recorded_at)}</td>
                          <td>
                            <button
                              type="button"
                              className="jpc-icon-button"
                              title="View record"
                              aria-label={`View record ${record.id}`}
                              onClick={() => setSelectedRecord(record)}
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan="7">
                            <div className="jpc-empty-state">
                              <FileText size={32} />
                              <h3>No service records found</h3>
                              <p>
                                Your service history will appear here when
                                records are available.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {showRequestModal && (
          <Modal
            title="New Service Request"
            onClose={() => {
              if (!saving) setShowRequestModal(false)
            }}
          >
            <form onSubmit={submitRequest} className="jpc-form">
              <label>
                Service <span>*</span>
                <select
                  name="service_id"
                  value={form.service_id}
                  onChange={updateForm}
                  required
                >
                  <option value="">Select a service</option>

                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.service_name} — {peso(service.base_price)}
                    </option>
                  ))}
                </select>
              </label>

              {isPrintingService ? (
                <>
                  <label>
                    Document Description <span>*</span>
                    <input type="text" name="document_description"
                      value={form.document_description} onChange={updateForm}
                      placeholder="Example: School assignment, 10 pages"
                      maxLength={255} required />
                  </label>
                  <label>
                    Number of Copies <span>*</span>
                    <input type="number" name="number_of_copies"
                      min="1" max="100000" step="1"
                      value={form.number_of_copies} onChange={updateForm} required />
                  </label>
                  <label>
                    Paper Size <span>*</span>
                    <select name="paper_size" value={form.paper_size}
                      onChange={updateForm} required>
                      {['A4', 'Letter', 'Legal', 'Short', 'Long', 'Other'].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Color Mode <span>*</span>
                    <select name="color_mode" value={form.color_mode}
                      onChange={updateForm} required>
                      <option value="Black and White">Black and White</option>
                      <option value="Colored">Colored</option>
                    </select>
                  </label>
                  <label>
                    Additional Instructions
                    <textarea name="printing_instructions"
                      value={form.printing_instructions} onChange={updateForm}
                      placeholder="Example: Print double-sided" rows={4} />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Printer Brand <span>*</span>
                    <input type="text" name="printer_brand"
                      value={form.printer_brand} onChange={updateForm}
                      placeholder="Example: Epson" maxLength={255} required />
                  </label>
                  <label>
                    Printer Model
                    <input type="text" name="printer_model"
                      value={form.printer_model} onChange={updateForm}
                      placeholder="Example: EcoTank L3210" maxLength={255} />
                  </label>
                  <label>
                    Issue Description <span>*</span>
                    <textarea name="issue_description"
                      value={form.issue_description} onChange={updateForm}
                      placeholder="Describe the printer problem..." rows={5} required />
                  </label>
                </>
              )}

              <div className="jpc-modal-actions">
                <button
                  type="button"
                  className="jpc-secondary-button"
                  onClick={() => setShowRequestModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="jpc-primary-button"
                  disabled={saving}
                >
                  {saving ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {selectedRequest && (
          <Modal
            title="Service Request Details"
            onClose={() => setSelectedRequest(null)}
          >
            <div className="jpc-details">
              <p><strong>Request ID:</strong> #{selectedRequest.id}</p>
              <p>
                <strong>Service:</strong>{' '}
                {selectedRequest.service?.service_name || '—'}
              </p>
              {selectedRequest.document_description ? (
                <>
                  <p><strong>Document:</strong> {selectedRequest.document_description}</p>
                  <p><strong>Copies:</strong> {selectedRequest.number_of_copies ?? '—'}</p>
                  <p><strong>Paper Size:</strong> {selectedRequest.paper_size || '—'}</p>
                  <p><strong>Color Mode:</strong> {selectedRequest.color_mode || '—'}</p>
                  <p><strong>Instructions:</strong> {selectedRequest.printing_instructions || '—'}</p>
                </>
              ) : (
                <>
                  <p><strong>Printer Brand:</strong> {selectedRequest.printer_brand || '—'}</p>
                  <p><strong>Printer Model:</strong> {selectedRequest.printer_model || '—'}</p>
                  <p><strong>Issue Description:</strong> {selectedRequest.issue_description || '—'}</p>
                </>
              )}
              <p>
                <strong>Status:</strong>{' '}
                <span className={getStatusClass(selectedRequest.status)}>
                  {selectedRequest.status}
                </span>
              </p>
              <p>
                <strong>Date Received:</strong>{' '}
                {formatDate(selectedRequest.received_at)}
              </p>
            </div>

            <div className="jpc-modal-actions">
              {selectedRequest.status === 'Received' && (
                <button
                  type="button"
                  className="jpc-danger-button"
                  onClick={() => {
                    setCancelRequest(selectedRequest)
                    setSelectedRequest(null)
                  }}
                >
                  <Ban size={17} />
                  Cancel Request
                </button>
              )}

              <button
                type="button"
                className="jpc-secondary-button"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
            </div>
          </Modal>
        )}

        {selectedRecord && (
          <Modal
            title="Service Record Details"
            onClose={() => setSelectedRecord(null)}
          >
            <div className="jpc-details">
              <p><strong>Record ID:</strong> #{selectedRecord.id}</p>
              <p>
                <strong>Service Request:</strong>{' '}
                #{selectedRecord.service_request_id}
              </p>
              <p>
                <strong>Diagnosis:</strong>{' '}
                {selectedRecord.diagnosis || '—'}
              </p>
              <p>
                <strong>Work Performed:</strong>{' '}
                {selectedRecord.work_performed || '—'}
              </p>
              <p>
                <strong>Parts Used:</strong>{' '}
                {selectedRecord.parts_used || '—'}
              </p>
              <p>
                <strong>Labor Cost:</strong>{' '}
                {peso(selectedRecord.labor_cost)}
              </p>
              <p>
                <strong>Notes:</strong>{' '}
                {selectedRecord.notes || '—'}
              </p>
              <p>
                <strong>Recorded By:</strong>{' '}
                {selectedRecord.staff?.name || '—'}
              </p>
              <p>
                <strong>Date Recorded:</strong>{' '}
                {formatDate(selectedRecord.recorded_at)}
              </p>
            </div>

            <div className="jpc-modal-actions">
              <button
                type="button"
                className="jpc-secondary-button"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </Modal>
        )}

        {cancelRequest && (
          <Modal
            title="Cancel Service Request"
            onClose={() => {
              if (!saving) setCancelRequest(null)
            }}
          >
            <div className="jpc-details">
              <p>
                Are you sure you want to cancel service request{' '}
                <strong>#{cancelRequest.id}</strong>?
              </p>

              <p>
                Only requests with a Received status can be cancelled.
              </p>
            </div>

            <div className="jpc-modal-actions">
              <button
                type="button"
                className="jpc-secondary-button"
                onClick={() => setCancelRequest(null)}
                disabled={saving}
              >
                Keep Request
              </button>

              <button
                type="button"
                className="jpc-danger-button"
                onClick={confirmCancellation}
                disabled={saving}
              >
                {saving ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}