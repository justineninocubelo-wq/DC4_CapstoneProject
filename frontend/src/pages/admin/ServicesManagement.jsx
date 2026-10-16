import { useCallback, useEffect, useState } from 'react'
import {
  Search, RefreshCw, Eye, Pencil, Trash2,
  X, Wrench, ChevronLeft, ChevronRight
} from 'lucide-react'
import api from '../../services/api'
import DashboardLayout from '../../components/DashboardLayout'
import './CustomerManagement.css'
import './ServicesManagement.css'

const emptyForm = {
  service_name: '',
  description: '',
  base_price: '',
  is_active: true
}

function getError(error, fallback) {
  const data = error.response?.data
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }
  return data?.message || fallback
}

function money(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(Number(value) || 0)
}

export default function ServicesManagement() {
  const [services, setServices] = useState([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [modal, setModal] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  const loadServices = useCallback(async (signal) => {
    setLoading(true)
    setError('')

    try {
      const params = {
        search: query,
        per_page: 10,
        page
      }

      if (filter !== 'all') {
        params.is_active = filter === 'active' ? 1 : 0
      }

      const response = await api.get('/admin/services', {
        params,
        signal
      })

      if (signal?.aborted) return

      const result = response.data.services
      const rows = result?.data ?? []

      setServices(rows)
      setTotal(result?.total ?? 0)
      setLastPage(result?.last_page ?? 1)
    } catch (err) {
      if (err.code !== 'ERR_CANCELED' && !signal?.aborted) {
        setError(getError(err, 'Unable to load services.'))
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [query, filter, page])

  useEffect(() => {
    const controller = new AbortController()

    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        loadServices(controller.signal)
      }
    })

    return () => controller.abort()
  }, [loadServices])

  function submitSearch(event) {
    event.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

  function changeFilter(event) {
    setFilter(event.target.value)
    setPage(1)
  }

  function openModal(type, service = null) {
    setModal(type)
    setSelected(service)
    setModalError('')
    setNotice('')

    setForm(service ? {
      service_name: service.service_name ?? '',
      description: service.description ?? '',
      base_price: String(service.base_price ?? ''),
      is_active: Boolean(service.is_active)
    } : { ...emptyForm })
  }

  function closeModal() {
    if (saving) return
    setModal('')
    setSelected(null)
    setModalError('')
  }

  async function refreshAfterChange() {
    if (page !== 1) {
      setPage(1)
    } else {
      await loadServices()
    }
  }

  async function saveService(event) {
    event.preventDefault()
    setModalError('')

    const price = Number(form.base_price)

    if (!form.service_name.trim()) {
      setModalError('Service name is required.')
      return
    }

    if (
      form.base_price.trim() === '' ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 99999999.99
    ) {
      setModalError('Enter a valid base price between 0 and 99,999,999.99.')
      return
    }

    const payload = {
      service_name: form.service_name.trim(),
      description: form.description.trim() || null,
      base_price: price,
      is_active: form.is_active
    }

    setSaving(true)

    try {
      await api.put(`/services/${selected.id}`, payload)

      setModal('')
      setSelected(null)
      setNotice('Service updated successfully.')
      await refreshAfterChange()
    } catch (err) {
      setModalError(getError(err, 'Unable to save service.'))
    } finally {
      setSaving(false)
    }
  }

  async function deleteService() {
    if (!selected) return

    setSaving(true)
    setModalError('')

    try {
      await api.delete(`/services/${selected.id}`)
      setModal('')
      setSelected(null)
      setNotice('Service deleted successfully.')

      if (services.length === 1 && page > 1) {
        setPage(previous => previous - 1)
      } else {
        await loadServices()
      }
    } catch (err) {
      setModalError(getError(err, 'Unable to delete service.'))
    } finally {
      setSaving(false)
    }
  }

  async function deactivateService() {
    if (!selected) return

    setSaving(true)
    setModalError('')

    try {
      await api.put(`/services/${selected.id}`, {
        is_active: false
      })

      setModal('')
      setSelected(null)
      setNotice('Service deactivated successfully.')
      await refreshAfterChange()
    } catch (err) {
      setModalError(getError(err, 'Unable to deactivate service.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Services Management">
      <div className="customers-page services-page">
        <div className="customers-heading">
          <div>
            <span className="customers-eyebrow">ADMINISTRATION</span>
            <h1>Services Management</h1>
            <p>Manage printing, photocopying, and printer repair services.</p>
          </div>

          <div className="services-heading-actions">
            <button
              className="customers-btn secondary"
              onClick={() => loadServices()}
              disabled={loading}
            >
              <RefreshCw size={17} /> Refresh
            </button>
          </div>
        </div>

        <div className="customers-summary">
          <div className="customers-summary-icon">
            <Wrench size={25} />
          </div>
          <div>
            <strong>{total}</strong>
            <span>Services matching current filters</span>
          </div>
        </div>

        {notice && (
          <div className="services-success" role="status">
            {notice}
          </div>
        )}

        <section className="customers-panel">
          <div className="customers-toolbar">
            <div>
              <h2>Service Directory</h2>
              <p>Manage the two official services. Legacy test services can be deactivated or removed if unused.</p>
            </div>

            <div className="services-toolbar-actions">
              <select
                className="services-filter"
                value={filter}
                onChange={changeFilter}
                aria-label="Filter services by status"
              >
                <option value="all">All Services</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <form
                onSubmit={submitSearch}
                className="customers-search"
              >
                <Search size={18} />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search services..."
                  aria-label="Search services"
                />
                <button type="submit">Search</button>
              </form>
            </div>
          </div>

          {error && (
            <div className="customers-alert" role="alert">
              {error}
            </div>
          )}

          <div className="customers-table-wrap">
            <table className="customers-table services-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Base Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="customers-empty">
                      Loading services...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="customers-empty">
                      Unable to display services.
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="customers-empty">
                      No services found.
                    </td>
                  </tr>
                ) : (
                  services.map(service => (
                    <tr key={service.id}>
                      <td>
                        <div className="customers-person">
                          <div className="customers-avatar">
                            <Wrench size={18} />
                          </div>
                          <div>
                            <strong>{service.service_name}</strong>
                            <small className="services-description">
                              {service.description || 'No description'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="services-price">
                        {money(service.base_price)}
                      </td>
                      <td>
                        <span className={
                          service.is_active
                            ? 'services-status active'
                            : 'services-status inactive'
                        }>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="customers-actions">
                          <button
                            title="View service"
                            aria-label={`View ${service.service_name}`}
                            onClick={() => openModal('view', service)}
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            title="Edit service"
                            aria-label={`Edit ${service.service_name}`}
                            onClick={() => openModal('edit', service)}
                            disabled={!service.service_type}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            className="danger-icon"
                            title="Delete service"
                            aria-label={`Delete ${service.service_name}`}
                            onClick={() => openModal('delete', service)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="customers-footer">
            <span>
              Page {page} of {lastPage} · {total} services
            </span>

            <div className="customers-pagination">
              <button
                disabled={loading || page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={17} /> Previous
              </button>
              <button
                disabled={loading || page >= lastPage}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        {modal && (
          <div
            className="customers-overlay"
            onMouseDown={event => {
              if (event.target === event.currentTarget) closeModal()
            }}
          >
            <div
              className="customers-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="service-modal-title"
            >
              <div className="customers-modal-header">
                <h2 id="service-modal-title">
                  {modal === 'edit' ? 'Edit Service'
                      : modal === 'view' ? 'Service Details'
                        : 'Delete Service'}
                </h2>

                <button
                  className="customers-close"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {modal === 'view' && selected && (
                <>
                  <div className="customers-detail-list">
                    <div>
                      <span>Service Name</span>
                      <strong>{selected.service_name}</strong>
                    </div>
                    <div>
                      <span>Description</span>
                      <strong>{selected.description || '—'}</strong>
                    </div>
                    <div>
                      <span>Base Price</span>
                      <strong>{money(selected.base_price)}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>
                        {selected.is_active ? 'Active' : 'Inactive'}
                      </strong>
                    </div>
                  </div>

                  <div className="customers-modal-footer">
                    <button
                      className="customers-btn secondary"
                      onClick={closeModal}
                    >
                      Close
                    </button>
                    <button
                      className="customers-btn primary"
                      onClick={() => setModal('edit')}
                      disabled={!selected.service_type}
                    >
                      Edit Service
                    </button>
                  </div>
                </>
              )}

              {modal === 'edit' && (
                <form className="customers-form" onSubmit={saveService}>
                  <p className="customers-form-hint">
                    Enter the service information below.
                  </p>

                  <label>
                    Service Name
                    <input
                      value={form.service_name}
                      onChange={event => setForm(f => ({
                        ...f,
                        service_name: event.target.value
                      }))}
                      maxLength={255}
                      required
                      placeholder="Service name"
                    />
                  </label>

                  <label>
                    Description
                    <textarea
                      value={form.description}
                      onChange={event => setForm(f => ({
                        ...f,
                        description: event.target.value
                      }))}
                      rows={3}
                      placeholder="Describe the service..."
                    />
                  </label>

                  <label>
                    Base Price (PHP)
                    <input
                      type="number"
                      min="0"
                      max="99999999.99"
                      step="0.01"
                      value={form.base_price}
                      onChange={event => setForm(f => ({
                        ...f,
                        base_price: event.target.value
                      }))}
                      required
                      placeholder="0.00"
                    />
                  </label>

                  <label className="services-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={event => setForm(f => ({
                        ...f,
                        is_active: event.target.checked
                      }))}
                    />
                    Active Service
                  </label>

                  {modalError && (
                    <div className="customers-alert" role="alert">
                      {modalError}
                    </div>
                  )}

                  <div className="customers-modal-footer">
                    <button
                      type="button"
                      className="customers-btn secondary"
                      onClick={closeModal}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="customers-btn primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {modal === 'delete' && selected && (
                <div className="customers-delete-content">
                  <p>
                    Are you sure you want to delete{' '}
                    <strong>{selected.service_name}</strong>?
                  </p>
                  <p>
                    Services with existing requests cannot be deleted.
                    You can deactivate them instead.
                  </p>

                  {modalError && (
                    <div className="customers-alert" role="alert">
                      {modalError}
                    </div>
                  )}

                  <div className="customers-modal-footer services-modal-actions">
                    <button
                      className="customers-btn secondary"
                      onClick={closeModal}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    {selected.is_active && (
                      <button
                        className="customers-btn secondary"
                        onClick={deactivateService}
                        disabled={saving}
                      >
                        Deactivate
                      </button>
                    )}

                    <button
                      className="customers-btn danger"
                      onClick={deleteService}
                      disabled={saving}
                    >
                      {saving ? 'Deleting...' : 'Delete Service'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
