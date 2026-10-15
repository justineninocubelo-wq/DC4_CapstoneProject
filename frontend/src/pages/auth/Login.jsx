import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Printer, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await login(email, password)
      const role = user.role?.toLowerCase()

      navigate(role === 'admin' ? '/admin' : '/customer', {
        replace: true,
      })
    } catch (err) {
      setError(
        err.response?.data?.message ??
        err.message ??
        'Unable to log in. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand">
        <div className="brand-logo"><Printer size={30} /></div>
        <div className="brand-content">
          <span className="eyebrow">WELCOME TO J-PRINTS</span>
          <h1>Printing made simple. Service made reliable.</h1>
          <p>
            Manage your printing needs and printer repair requests
            through one convenient platform.
          </p>
          <div className="brand-features">
            <span>Document Printing</span>
            <span>Photocopying</span>
            <span>Printer Repair</span>
          </div>
        </div>
        <small>J-Prints Service Management System</small>
      </section>

      <section className="auth-form-side">
        <div className="auth-card">
          <div className="mobile-brand"><Printer size={24} /> J-Prints</div>
          <span className="eyebrow blue">ACCOUNT ACCESS</span>
          <h2>Welcome back!</h2>
          <p className="muted">Sign in to continue to your dashboard.</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="alert-error">{error}</div>}

            <label htmlFor="email">Email address</label>
            <div className="input-wrapper">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <LockKeyhole size={18} />
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="primary-button" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  )
}