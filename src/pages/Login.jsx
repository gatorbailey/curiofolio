import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.brand}>
          <div style={styles.logo}>CF</div>
          <h1 style={styles.brandName}>CurioFolio</h1>
          <p style={styles.brandTagline}>Your personal museum for the things you collect</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
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
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/signup">Create one free</Link>
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
    transition: 'border-color 0.15s',
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
}