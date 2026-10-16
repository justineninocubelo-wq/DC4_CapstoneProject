import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Eye, Pencil, Trash2, X,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react'
import api from '../../services/api'
import './ServiceRecordsManagement.css'

const emptyForm = {
  service_request_id: '',
  diagnosis: '',
  work_performed: '',
  parts_used: '',
  labor_cost: '0',
  notes: '',
  recorded_at: ''
}

function getError(error) {
  const data = error.response?.data

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return data?.message || 'Something went wrong. Please try again.'
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return 'N/A'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleDateString('en-PH')
}

function toDateTimeInput(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )

  return local.toISOString().slice(0, 16)
}

export default function ServiceRecordsManagement() {
  const [records, setRecords] = useState([])
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const perPage = 10

  const loadRecords = useCallback(async () => {
    setLoading(true)

    try {
      const response = await api.get('/service-records')
      setRecords(Array.isArray(response.data) ? response.data : [])
      setError('')
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function fetchRecords() {
      try {
        const response = await api.get('/service-records')

        if (active) {
          setRecords(Array.isArray(response.data) ? response.data : [])
          setError('')
        }
      } catch (err) {
        if (active) setError(getError(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchRecords()

    return () => {
      active = false
    }
  }, [])

  async function loadRequests() {
    try {
      const allRequests = []
      let currentPage = 1
      let lastPage = 1

      do {
        const response = await api.get('/service-requests', {
          params: { page: currentPage, per_page: 100 }
        })

        allRequests.push(...(response.data.data || []))
        lastPage = response.data.last_page || 1
        currentPage++
      } while (currentPage <= lastPage)

      setRequests(allRequests)
    } catch (err) {
      setError(getError(err))
    }
  }

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return records

    return records.filter(record => {
      const request = record.service_request || record.serviceRequest
      const service = request?.service
      const customer = request?.customer

      return [
        record.id,
        record.service_request_id,
        record.diagnosis,
        record.work_performed,
        record.parts_used,
        record.notes,
        record.staff?.name,
        request?.printer_brand,
        request?.printer_model,
        service?.service_name,
        customer?.user?.name
      ].some(value =>
        String(value ?? '').toLowerCase().includes(keyword)
      )
    })
  }, [records, search])

  const lastPage = Math.max(
    1,
    Math.ceil(filteredRecords.length / perPage)
  )

  const currentPage = Math.min(page, lastPage)

  const visibleRecords = filteredRecords.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  )

  function openAdd() {
    setForm(emptyForm)
    setSelected(null)
    setError('')
    setModal('add')
    loadRequests()
  }

  function openView(record) {
    setSelected(record)
    setError('')
    setModal('view')
  }

  function openEdit(record) {
    setSelected(record)
    setForm({
      service_request_id: String(record.service_request_id),
      diagnosis: record.diagnosis || '',
      work_performed: record.work_performed || '',
      parts_used: record.parts_used || '',
      labor_cost: String(record.labor_cost ?? 0),
      notes: record.notes || '',
      recorded_at: toDateTimeInput(record.recorded_at)
    })
    setError('')
    setModal('edit')
  }

  function closeModal() {
    if (saving) return

    setModal('')
    setSelected(null)
    setError('')
  }

  async function saveRecord(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        diagnosis: form.diagnosis || null,
        work_performed: form.work_performed || null,
        parts_used: form.parts_used || null,
        labor_cost: Number(form.labor_cost),
        notes: form.notes || null,
        ...(form.recorded_at
          ? { recorded_at: form.recorded_at }
          : {})
      }

      if (modal === 'add') {
        await api.post('/service-records', {
          ...payload,
          service_request_id: Number(form.service_request_id)
        })

        setMessage('Service record created successfully.')
      } else {
        await api.patch(`/service-records/${selected.id}`, payload)
        setMessage('Service record updated successfully.')
      }

      setModal('')
      setSelected(null)
      await loadRecords()
    } catch (err) {
      setError(getError(err))
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecord() {
    if (!selected) return

    setSaving(true)
    setError('')

    try {
      await api.delete(`/service-records/${selected.id}`)
      setMessage('Service record deleted successfully.')
      setModal('')
      setSelected(null)
      await loadRecords()
    } catch (err) {
      setError(getError(err))
    } finally {
      setSaving(false)
    }
  }

  function requestLabel(request) {
    const customer = request.customer?.user?.name || 'Customer'
    const service = request.service
    const serviceName = service?.service_name || 'Service request'
    const printer = [request.printer_brand, request.printer_model]
      .filter(Boolean)
      .join(' ')
    const document = request.document_description?.trim()

    let details
    if (service?.service_type === 'printing') {
      details = document || serviceName
    } else if (service?.service_type === 'repair') {
      details = printer || serviceName
    } else {
      details = document || printer || serviceName
    }

    return `#${request.id} - ${customer} - ${details}`
  }

  return (
    <div className="srm-page">
      <div className="srm-heading">
        <div>
          <h1>Service Records Management</h1>
          <p>Manage service history, repairs, and labor costs.</p>
        </div>

        <button className="srm-primary" onClick={openAdd}>
          <Plus size={18} />
          New Record
        </button>
      </div>

      {message && (
        <div className="srm-success" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage('')} aria-label="Dismiss">
            <X size={17} />
          </button>
        </div>
      )}

      {error && !modal && (
        <div className="srm-error" role="alert">{error}</div>
      )}

      <div className="srm-panel">
        <div className="srm-toolbar">
          <div className="srm-search">
            <Search size={18} />
            <input
              value={search}
              placeholder="Search service records..."
              onChange={event => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <button
            className="srm-outline"
            title="Refresh"
            onClick={loadRecords}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="srm-table-wrap">
          <table className="srm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Request</th>
                <th>Diagnosis</th>
                <th>Work Performed</th>
                <th>Labor Cost</th>
                <th>Recorded At</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="srm-empty">
                    Loading service records...
                  </td>
                </tr>
              ) : visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="srm-empty">
                    No service records found.
                  </td>
                </tr>
              ) : visibleRecords.map(record => (
                <tr key={record.id}>
                  <td>#{record.id}</td>
                  <td>#{record.service_request_id}</td>
                  <td className="srm-truncate">
                    {record.diagnosis || 'Not specified'}
                  </td>
                  <td className="srm-truncate">
                    {record.work_performed || 'Not specified'}
                  </td>
                  <td>{formatMoney(record.labor_cost)}</td>
                  <td>{formatDate(record.recorded_at)}</td>
                  <td>
                    <div className="srm-actions">
                      <button
                        title="View"
                        onClick={() => openView(record)}
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        title="Edit"
                        onClick={() => openEdit(record)}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        title="Delete"
                        className="danger"
                        onClick={() => {
                          setSelected(record)
                          setError('')
                          setModal('delete')
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="srm-footer">
          <span>
            {filteredRecords.length} total record
            {filteredRecords.length !== 1 ? 's' : ''}
          </span>

          <div className="srm-pagination">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={17} />
            </button>

            <span>Page {currentPage} of {lastPage}</span>

            <button
              disabled={currentPage >= lastPage}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <div
          className="srm-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div
            className="srm-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Service record"
          >
            <div className="srm-modal-header">
              <h2>
                {modal === 'add'
                  ? 'New Service Record'
                  : modal === 'edit'
                    ? 'Edit Service Record'
                    : modal === 'delete'
                      ? 'Delete Service Record'
                      : 'Service Record Details'}
              </h2>

              <button
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="srm-error" role="alert">{error}</div>
            )}

            {modal === 'view' && selected && (
              <div className="srm-details">
                <p><strong>Record ID:</strong> #{selected.id}</p>
                <p>
                  <strong>Service Request:</strong> #
                  {selected.service_request_id}
                </p>
                <p>
                  <strong>Diagnosis:</strong> {selected.diagnosis || 'N/A'}
                </p>
                <p>
                  <strong>Work Performed:</strong>{' '}
                  {selected.work_performed || 'N/A'}
                </p>
                <p>
                  <strong>Parts Used:</strong>{' '}
                  {selected.parts_used || 'N/A'}
                </p>
                <p>
                  <strong>Labor Cost:</strong>{' '}
                  {formatMoney(selected.labor_cost)}
                </p>
                <p>
                  <strong>Notes:</strong> {selected.notes || 'N/A'}
                </p>
                <p>
                  <strong>Staff:</strong>{' '}
                  {selected.staff?.name || 'N/A'}
                </p>
                <p>
                  <strong>Recorded At:</strong>{' '}
                  {formatDate(selected.recorded_at)}
                </p>

                <div className="srm-modal-actions">
                  <button className="srm-outline" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </div>
            )}

            {(modal === 'add' || modal === 'edit') && (
              <form className="srm-form" onSubmit={saveRecord}>
                {modal === 'add' && (
                  <label>
                    Service Request
                    <select
                      required
                      value={form.service_request_id}
                      onChange={event => setForm({
                        ...form,
                        service_request_id: event.target.value
                      })}
                    >
                      <option value="">Select service request</option>

                      {requests
                        .filter(request => request.status !== 'Cancelled')
                        .map(request => (
                          <option key={request.id} value={request.id}>
                            {requestLabel(request)}
                          </option>
                        ))}
                    </select>
                  </label>
                )}

                {modal === 'edit' && (
                  <p className="srm-readonly">
                    Service Request #{selected.service_request_id}
                  </p>
                )}

                <label>
                  Diagnosis
                  <textarea
                    rows="3"
                    value={form.diagnosis}
                    onChange={event => setForm({
                      ...form,
                      diagnosis: event.target.value
                    })}
                    placeholder="Enter diagnosis..."
                  />
                </label>

                <label>
                  Work Performed
                  <textarea
                    rows="3"
                    value={form.work_performed}
                    onChange={event => setForm({
                      ...form,
                      work_performed: event.target.value
                    })}
                    placeholder="Describe the work performed..."
                  />
                </label>

                <label>
                  Parts Used
                  <textarea
                    rows="2"
                    value={form.parts_used}
                    onChange={event => setForm({
                      ...form,
                      parts_used: event.target.value
                    })}
                    placeholder="Enter parts used..."
                  />
                </label>

                <label>
                  Labor Cost (PHP)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.labor_cost}
                    onChange={event => setForm({
                      ...form,
                      labor_cost: event.target.value
                    })}
                  />
                </label>

                <label>
                  Notes
                  <textarea
                    rows="3"
                    value={form.notes}
                    onChange={event => setForm({
                      ...form,
                      notes: event.target.value
                    })}
                    placeholder="Additional notes..."
                  />
                </label>

                <label>
                  Date Recorded
                  <input
                    type="datetime-local"
                    value={form.recorded_at}
                    onChange={event => setForm({
                      ...form,
                      recorded_at: event.target.value
                    })}
                  />
                </label>

                <div className="srm-modal-actions">
                  <button
                    type="button"
                    className="srm-outline"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="srm-primary"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : modal === 'add'
                        ? 'Create Record'
                        : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {modal === 'delete' && selected && (
              <div className="srm-details">
                <p>
                  Are you sure you want to delete service record{' '}
                  <strong>#{selected.id}</strong>?
                </p>
                <p>This action cannot be undone.</p>

                <div className="srm-modal-actions">
                  <button
                    className="srm-outline"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    className="srm-danger-button"
                    onClick={deleteRecord}
                    disabled={saving}
                  >
                    {saving ? 'Deleting...' : 'Delete Record'}
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