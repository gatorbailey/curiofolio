import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [folios, setFolios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFolios()
  }, [])

  const fetchFolios = async () => {
    const { data, error } = await supabase
      .from('folios')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setFolios(data || [])
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={styles.page}>

      {/* Top nav */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.logo}>CF</div>
          <span style={styles.logoText}>CurioFolio</span>
        </div>
        <div style={styles.navRight}>
          <span style={styles.userEmail}>{user?.email}</span>
          <button onClick={handleSignOut} style={styles.signOutBtn}>
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main style={styles.main}>

        {/* Header row */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>My Folios</h1>
            <p style={styles.pageSubtitle}>
              {folios.length === 0
                ? 'Create your first folio to start collecting'
                : `${folios.length} folio${folios.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => navigate('/folios/new')}
            style={styles.newFolioBtn}
          >
            + New Folio
          </button>
        </div>

        {/* Folios grid */}
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading...</p>
          </div>
        ) : folios.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🏛️</div>
            <h2 style={styles.emptyTitle}>Your museum awaits</h2>
            <p style={styles.emptyText}>
              A Folio is your top-level collection — like a museum building.
              Inside it you'll create Halls, Exhibits, and individual Curios.
            </p>
            <button
              onClick={() => navigate('/folios/new')}
              style={styles.emptyBtn}
            >
              Create your first Folio
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {folios.map(folio => (
              <div
                key={folio.id}
                style={styles.folioCard}
                onClick={() => navigate(`/folios/${folio.id}`)}
              >
                <div style={styles.folioCardTop}>
                  <div style={styles.folioTypeTag}>{folio.folio_type}</div>
                  {folio.is_public && (
                    <div style={styles.publicTag}>Public</div>
                  )}
                </div>
                <h3 style={styles.folioName}>{folio.name}</h3>
                {folio.description && (
                  <p style={styles.folioDesc}>{folio.description}</p>
                )}
                <div style={styles.folioFooter}>
                  <span style={styles.folioDate}>
                    {new Date(folio.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                  <span style={styles.folioArrow}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F9FAFB',
  },
  nav: {
    background: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    padding: '0 32px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontWeight: '700',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: '700',
    fontSize: '17px',
    color: '#111827',
    letterSpacing: '-0.3px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userEmail: {
    fontSize: '13px',
    color: '#6B7280',
  },
  signOutBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#374151',
    fontSize: '13px',
    fontWeight: '500',
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '-0.5px',
    marginBottom: '4px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6B7280',
  },
  newFolioBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 24px',
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '10px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6B7280',
    maxWidth: '400px',
    margin: '0 auto 24px',
    lineHeight: '1.6',
  },
  emptyBtn: {
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  folioCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '22px',
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.15s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  folioCardTop: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  folioTypeTag: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '20px',
    background: '#EDE9FE',
    color: '#5B21B6',
    textTransform: 'capitalize',
  },
  publicTag: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '20px',
    background: '#CCFBF1',
    color: '#0F766E',
  },
  folioName: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '6px',
    letterSpacing: '-0.2px',
  },
  folioDesc: {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  folioFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '14px',
    borderTop: '1px solid #F3F4F6',
  },
  folioDate: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  folioArrow: {
    fontSize: '16px',
    color: '#7C3AED',
  },
}