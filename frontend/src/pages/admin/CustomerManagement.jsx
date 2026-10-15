import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import api from '../../services/api'
import DashboardLayout from '../../components/DashboardLayout'
import './CustomerManagement.css'

const emptyForm = {
  phone: '',
  address: ''
}

function getError(error, fallback) {
  const data = error.response?.data

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return data?.message || fallback
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  const loadCustomers = useCallback(async (signal) => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/customers', {
        params: {
          search: query,
          per_page: 10,
          page
        },
        signal
      })

      const result = response.data.customers ?? response.data
      const rows = Array.isArray(result)
        ? result
        : result.data ?? []

      setCustomers(rows)
      setLastPage(result.last_page ?? 1)
      setTotal(result.total ?? rows.length)
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') {
        setError(getError(err, 'Unable to load customers.'))
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [query, page])

  useEffect(() => {
        const controller = new AbortController()

        const fetchCustomers = async () => {
            await loadCustomers(controller.signal)
        }

        Promise.resolve().then(fetchCustomers)

        return () => controller.abort()
    }, [loadCustomers])

  function submitSearch(event) {
    event.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

  function openModal(type, customer) {
    setSelected(customer)

    setForm({
      phone: customer.phone ?? '',
      address: customer.address ?? ''
    })

    setModalError('')
    setModal(type)
  }

  function closeModal() {
    if (saving) return

    setModal('')
    setSelected(null)
    setModalError('')
  }

  async function saveCustomer(event) {
    event.preventDefault()

    if (!selected) return

    setSaving(true)
    setModalError('')

    try {
      await api.patch(`/customers/${selected.id}`, {
        phone: form.phone.trim(),
        address: form.address.trim()
      })

      setModal('')
      setSelected(null)

      await loadCustomers()
    } catch (err) {
      setModalError(
        getError(err, 'Unable to update customer.')
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteCustomer() {
    if (!selected) return

    setSaving(true)
    setModalError('')

    try {
      await api.delete(`/customers/${selected.id}`)

      setModal('')
      setSelected(null)

      if (customers.length === 1 && page > 1) {
        setPage(previous => previous - 1)
      } else {
        await loadCustomers()
      }
    } catch (err) {
      setModalError(
        getError(err, 'Unable to delete customer.')
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Customer Management">
      <div className="customers-page">

        <div className="customers-heading">
          <div>
            <span className="customers-eyebrow">
              ADMINISTRATION
            </span>

            <h1>Customer Management</h1>

            <p>
              View and manage J-Prints customer accounts.
            </p>
          </div>

          <button
            className="customers-btn secondary"
            onClick={() => loadCustomers()}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="customers-summary">
          <div className="customers-summary-icon">
            <Users size={25} />
          </div>

          <div>
            <strong>{total}</strong>
            <span>Registered customers</span>
          </div>
        </div>

        <section className="customers-panel">
          <div className="customers-toolbar">
            <div>
              <h2>Customer Directory</h2>

              <p>
                Search for a customer or manage their information.
              </p>
            </div>

            <form
              onSubmit={submitSearch}
              className="customers-search"
            >
              <Search size={18} />

              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search customers..."
                aria-label="Search customers"
              />

              <button type="submit">
                Search
              </button>
            </form>
          </div>

          {error && (
            <div className="customers-alert" role="alert">
              {error}
            </div>
          )}

          <div className="customers-table-wrap">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="customers-empty"
                    >
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="customers-empty"
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map(customer => (
                    <tr key={customer.id}>
                      <td>
                        <div className="customers-person">
                          <div className="customers-avatar">
                            {(customer.user?.name ?? 'C')
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {customer.user?.name ??
                                'Unnamed Customer'}
                            </strong>

                            <small>
                              {customer.user?.email ??
                                'No email available'}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {customer.phone || '—'}
                      </td>

                      <td>
                        {customer.address || '—'}
                      </td>

                      <td>
                        <div className="customers-actions">
                          <button
                            title="View details"
                            aria-label="View details"
                            onClick={() =>
                              openModal('view', customer)
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            title="Edit customer"
                            aria-label="Edit customer"
                            onClick={() =>
                              openModal('edit', customer)
                            }
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            className="danger-icon"
                            title="Delete customer"
                            aria-label="Delete customer"
                            onClick={() =>
                              openModal('delete', customer)
                            }
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
              Page {page} of {lastPage} · {total} customers
            </span>

            <div className="customers-pagination">
              <button
                disabled={loading || page <= 1}
                onClick={() =>
                  setPage(previous => previous - 1)
                }
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <button
                disabled={loading || page >= lastPage}
                onClick={() =>
                  setPage(previous => previous + 1)
                }
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        {modal && selected && (
          <div
            className="customers-overlay"
            onMouseDown={event => {
              if (event.target === event.currentTarget) {
                closeModal()
              }
            }}
          >
            <div
              className="customers-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="customer-modal-title"
            >
              <div className="customers-modal-header">
                <h2 id="customer-modal-title">
                  {modal === 'view'
                    ? 'Customer Details'
                    : modal === 'edit'
                      ? 'Edit Customer'
                      : 'Delete Customer'}
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

              {modal === 'view' && (
                <div className="customers-detail-list">
                  <div>
                    <span>Full Name</span>
                    <strong>
                      {selected.user?.name ?? '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Email Address</span>
                    <strong>
                      {selected.user?.email ?? '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Phone Number</span>
                    <strong>
                      {selected.phone || '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Address</span>
                    <strong>
                      {selected.address || '—'}
                    </strong>
                  </div>
                </div>
              )}

              {modal === 'edit' && (
                <form
                  onSubmit={saveCustomer}
                  className="customers-form"
                >
                  <p className="customers-form-hint">
                    Update the contact details for{' '}
                    {selected.user?.name ?? 'this customer'}.
                  </p>

                  <label>
                    Phone Number

                    <input
                      value={form.phone}
                      onChange={event =>
                        setForm(previous => ({
                          ...previous,
                          phone: event.target.value
                        }))
                      }
                      maxLength={255}
                      required
                    />
                  </label>

                  <label>
                    Address

                    <textarea
                      value={form.address}
                      onChange={event =>
                        setForm(previous => ({
                          ...previous,
                          address: event.target.value
                        }))
                      }
                      maxLength={255}
                      rows={3}
                      required
                    />
                  </label>

                  {modalError && (
                    <div
                      className="customers-alert"
                      role="alert"
                    >
                      {modalError}
                    </div>
                  )}

                  <div className="customers-modal-footer">
                    <button
                      type="button"
                      className="customers-btn secondary"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="customers-btn primary"
                      disabled={saving}
                    >
                      {saving
                        ? 'Saving...'
                        : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {modal === 'delete' && (
                <div className="customers-delete-content">
                  <p>
                    Are you sure you want to delete{' '}
                    <strong>
                      {selected.user?.name ??
                        'this customer'}
                    </strong>
                    ?
                  </p>

                  <p>
                    This action may be permanent.
                    Customers with related service requests
                    may be protected from deletion by the
                    backend.
                  </p>

                  {modalError && (
                    <div
                      className="customers-alert"
                      role="alert"
                    >
                      {modalError}
                    </div>
                  )}

                  <div className="customers-modal-footer">
                    <button
                      className="customers-btn secondary"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>

                    <button
                      className="customers-btn danger"
                      onClick={deleteCustomer}
                      disabled={saving}
                    >
                      {saving
                        ? 'Deleting...'
                        : 'Delete Customer'}
                    </button>
                  </div>
                </div>
              )}

              {modal === 'view' && (
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
                  >
                    Edit Customer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}