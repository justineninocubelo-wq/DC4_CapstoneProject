import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { useAuth } from '../../contexts/useAuth'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      await register(form)
      navigate('/login', {
        state: { message: 'Registration successful. Please sign in.' },
      })
    } catch (err) {
      const errors = err.response?.data?.errors
      const firstError = errors && Object.values(errors).flat()[0]

      setError(firstError ?? err.response?.data?.message ?? 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <Link to="/login" className="register-logo">
          <Printer size={27} /> J-Prints
        </Link>

        <span className="eyebrow blue">GET STARTED</span>
        <h2>Create your account</h2>
        <p className="muted">Register to access J-Prints services.</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert-error">{error}</div>}

          <label htmlFor="name">Full name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={updateField}
            placeholder="Enter your full name"
            required
          />

          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            placeholder="Enter your email"
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            minLength={8}
            placeholder="Create a password"
            required
          />

          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={updateField}
            minLength={8}
            placeholder="Confirm your password"
            required
          />

          <button className="primary-button" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
