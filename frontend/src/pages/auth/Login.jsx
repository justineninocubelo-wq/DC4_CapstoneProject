
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Printer,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  FileText,
  Wrench,
  Copy
} from 'lucide-react'
import { useAuth } from '../../contexts/useAuth'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        replace: true
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
    <div className="jprints-login-page">
      <div className="jprints-login-container">

        {/* LEFT SIDE - BRANDING */}
        <section className="jprints-login-brand">
          <div className="jprints-login-shape shape-one"></div>
          <div className="jprints-login-shape shape-two"></div>
          <div className="jprints-login-shape shape-three"></div>

          <div className="jprints-login-logo">
            <div className="jprints-logo-icon">
              <Printer size={26} />
            </div>
            <span>J-Prints</span>
          </div>

          <div className="jprints-login-welcome">
            <div className="jprints-welcome-tag">
              YOUR PRINTING & REPAIR PARTNER
            </div>

            <h1>
              WELCOME TO
              <span> J-PRINTS.</span>
            </h1>

            <h2>
              Printing made simple.
              <br />
              Service made reliable.
            </h2>

            <p>
              Manage your printing needs and printer repair
              requests through one convenient platform.
            </p>

            <div className="jprints-login-features">
              <div className="jprints-feature">
                <FileText size={18} />
                <span>Document Printing</span>
              </div>

              <div className="jprints-feature">
                <Copy size={18} />
                <span>Photocopying</span>
              </div>

              <div className="jprints-feature">
                <Wrench size={18} />
                <span>Printer Repair</span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE - LOGIN FORM */}
        <section className="jprints-login-form-section">
          <div className="jprints-login-card">

            <div className="jprints-login-card-header">
              <div className="jprints-login-mobile-logo">
                <Printer size={22} />
                <span>J-Prints</span>
              </div>

              <span className="jprints-login-eyebrow">
                ACCOUNT ACCESS
              </span>

              <h2>Welcome back!</h2>

              <p>
                Sign in to continue to your dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="jprints-login-form">

              {error && (
                <div className="jprints-login-error" role="alert">
                  {error}
                </div>
              )}

              <div className="jprints-login-field">
                <label htmlFor="email">Email address</label>

                <div className="jprints-login-input">
                  <Mail size={19} />

                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="jprints-login-field">
                <label htmlFor="password">Password</label>

                <div className="jprints-login-input">
                  <LockKeyhole size={19} />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="jprints-login-eye"
                    onClick={() => setShowPassword(previous => !previous)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <EyeOff size={19} />
                      : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="jprints-login-submit"
                disabled={submitting}
              >
                <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
                {!submitting && <ArrowRight size={19} />}
              </button>
            </form>

            <div className="jprints-login-divider">
              <span>NEW TO J-PRINTS?</span>
            </div>

            <p className="jprints-login-register">
              Don't have an account?{' '}
              <Link to="/register">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}