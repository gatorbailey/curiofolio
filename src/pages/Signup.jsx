import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, fullName)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Check your email</h2>
          <p style={styles.successText}>
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account then come back to sign in.
          </p>
          <Link to="/login" style={styles.successLink}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.brand}>
          <div style={styles.logo}>CF</div>
          <h1 style={styles.brandName}>CurioFolio</h1>
          <p style={styles.brandTagline}>Start building your personal museum</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={styles.input}
              placeholder="Jake Smith"
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Min. 6 characters"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create free account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #EDE9FE 0%, #CCFBF1 100%)',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '20px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
  },
  brand: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  logo: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontWeight: '700',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
    letterSpacing: '0.5px',
  },
  brandName: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '6px',
    letterSpacing: '-0.5px',
  },
  brandTagline: {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1.5px solid #E5E7EB',
    fontSize: '15px',
    color: '#111827',
    outline: 'none',
    background: '#F9FAFB',
  },
  error: {
    background: '#FEF2F2',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    border: '1px solid #FECACA',
  },
  button: {
    padding: '13px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '4px',
    transition: 'opacity 0.15s',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#6B7280',
    marginTop: '24px',
  },
  successIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: '12px',
  },
  successText: {
    fontSize: '14px',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  successLink: {
    display: 'block',
    textAlign: 'center',
    padding: '13px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontWeight: '600',
    fontSize: '15px',
  },
}