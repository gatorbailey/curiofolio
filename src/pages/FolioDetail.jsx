import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function FolioDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [folio, setFolio] = useState(null)
  const [halls, setHalls] = useState([])
  const [exhibits, setExhibits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add hall state
  const [showAddHall, setShowAddHall] = useState(false)
  const [newHallName, setNewHallName] = useState('')
  const [addingHall, setAddingHall] = useState(false)

  // Add exhibit state
  const [showAddExhibit, setShowAddExhibit] = useState(null)
  const [newExhibitName, setNewExhibitName] = useState('')
  const [addingExhibit, setAddingExhibit] = useState(false)

  // Expanded halls
  const [expandedHalls, setExpandedHalls] = useState({})

  useEffect(() => {
    fetchFolio()
  }, [id])

  const fetchFolio = async () => {
    const { data: folioData, error: folioError } = await supabase
      .from('folios')
      .select('*')
      .eq('id', id)
      .single()

    if (folioError) {
      setError('Folio not found')
      setLoading(false)
      return
    }

    const { data: hallsData } = await supabase
      .from('halls')
      .select('*')
      .eq('folio_id', id)
      .order('display_order')

    const exhibitsMap = {}
    if (hallsData && hallsData.length > 0) {
      const hallIds = hallsData.map(h => h.id)
      const { data: exhibitsData } = await supabase
        .from('exhibits')
        .select('*')
        .in('hall_id', hallIds)
        .order('display_order')

      if (exhibitsData) {
        exhibitsData.forEach(exhibit => {
          if (!exhibitsMap[exhibit.hall_id]) {
            exhibitsMap[exhibit.hall_id] = []
          }
          exhibitsMap[exhibit.hall_id].push(exhibit)
        })
      }

      // Expand all halls by default
      const expanded = {}
      hallsData.forEach(h => expanded[h.id] = true)
      setExpandedHalls(expanded)
    }

    setFolio(folioData)
    setHalls(hallsData || [])
    setExhibits(exhibitsMap)
    setLoading(false)
  }

  const handleAddHall = async () => {
    if (!newHallName.trim()) return
    setAddingHall(true)

    const { data, error } = await supabase
      .from('halls')
      .insert({
        folio_id: id,
        name: newHallName.trim(),
        display_order: halls.length,
      })
      .select()
      .single()

    if (!error) {
      setHalls([...halls, data])
      setExhibits({ ...exhibits, [data.id]: [] })
      setExpandedHalls({ ...expandedHalls, [data.id]: true })
      setNewHallName('')
      setShowAddHall(false)
    }
    setAddingHall(false)
  }

  const handleAddExhibit = async (hallId) => {
    if (!newExhibitName.trim()) return
    setAddingExhibit(true)

    const currentExhibits = exhibits[hallId] || []
    const { data, error } = await supabase
      .from('exhibits')
      .insert({
        hall_id: hallId,
        name: newExhibitName.trim(),
        display_order: currentExhibits.length,
      })
      .select()
      .single()

    if (!error) {
      setExhibits({
        ...exhibits,
        [hallId]: [...currentExhibits, data],
      })
      setNewExhibitName('')
      setShowAddExhibit(null)
    }
    setAddingExhibit(false)
  }

  const toggleHall = (hallId) => {
    setExpandedHalls({
      ...expandedHalls,
      [hallId]: !expandedHalls[hallId],
    })
  }

  if (loading) return (
    <div style={styles.loadingPage}>
      <div style={styles.loadingText}>Loading your folio...</div>
    </div>
  )

  if (error) return (
    <div style={styles.loadingPage}>
      <div style={styles.loadingText}>{error}</div>
    </div>
  )

  return (
    <div style={styles.page}>

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div
            style={styles.logo}
            onClick={() => navigate('/')}
          >
            CF
          </div>
          <span style={styles.navDivider}>/</span>
          <span style={styles.navFolioName}>{folio.name}</span>
        </div>
        <div style={styles.navRight}>
          <button
            onClick={() => navigate('/')}
            style={styles.navBtn}
          >
            ← All Folios
          </button>
        </div>
      </nav>

      <main style={styles.main}>

        {/* Folio header */}
        <div style={styles.folioHeader}>
          <div>
            <div style={styles.folioTypeBadge}>
              {folio.folio_type.replace(/_/g, ' ')}
            </div>
            <h1 style={styles.folioTitle}>{folio.name}</h1>
            {folio.description && (
              <p style={styles.folioDesc}>{folio.description}</p>
            )}
          </div>
          <div style={styles.headerActions}>
            <button
              onClick={() => navigate(`/folios/${id}/curios/new`)}
              style={styles.addCurioBtn}
            >
              + Add Curio
            </button>
          </div>
        </div>

        {/* Two column layout */}
        <div style={styles.layout}>

          {/* Left sidebar — halls and exhibits */}
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <span style={styles.sidebarTitle}>Halls & Exhibits</span>
              <button
                onClick={() => setShowAddHall(true)}
                style={styles.addSmallBtn}
              >
                + Hall
              </button>
            </div>

            {/* Add hall input */}
            {showAddHall && (
              <div style={styles.inlineAdd}>
                <input
                  type="text"
                  value={newHallName}
                  onChange={e => setNewHallName(e.target.value)}
                  style={styles.inlineInput}
                  placeholder="Hall name..."
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddHall()
                    if (e.key === 'Escape') setShowAddHall(false)
                  }}
                />
                <div style={styles.inlineBtns}>
                  <button
                    onClick={handleAddHall}
                    style={styles.inlineConfirm}
                    disabled={addingHall}
                  >
                    {addingHall ? '...' : 'Add'}
                  </button>
                  <button
                    onClick={() => { setShowAddHall(false); setNewHallName('') }}
                    style={styles.inlineCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {halls.length === 0 ? (
              <div style={styles.emptyHalls}>
                <p style={styles.emptyHallsText}>No halls yet.</p>
                <p style={styles.emptyHallsText}>Click + Hall to add one.</p>
              </div>
            ) : (
              <div style={styles.hallList}>
                {halls.map(hall => (
                  <div key={hall.id} style={styles.hallBlock}>

                    {/* Hall row */}
                    <div
                      style={styles.hallRow}
                      onClick={() => toggleHall(hall.id)}
                    >
                      <span style={styles.hallChevron}>
                        {expandedHalls[hall.id] ? '▾' : '▸'}
                      </span>
                      <span style={styles.hallName}>{hall.name}</span>
                      <span style={styles.hallCount}>
                        {(exhibits[hall.id] || []).length}
                      </span>
                    </div>

                    {/* Exhibits */}
                    {expandedHalls[hall.id] && (
                      <div style={styles.exhibitList}>
                        {(exhibits[hall.id] || []).map(exhibit => (
                          <div
                            key={exhibit.id}
                            style={styles.exhibitRow}
                            onClick={() => navigate(`/exhibits/${exhibit.id}`)}
                          >
                            <span style={styles.exhibitDot}>·</span>
                            <span style={styles.exhibitName}>{exhibit.name}</span>
                          </div>
                        ))}

                        {/* Add exhibit */}
                        {showAddExhibit === hall.id ? (
                          <div style={styles.inlineAdd}>
                            <input
                              type="text"
                              value={newExhibitName}
                              onChange={e => setNewExhibitName(e.target.value)}
                              style={styles.inlineInput}
                              placeholder="Exhibit name..."
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleAddExhibit(hall.id)
                                if (e.key === 'Escape') setShowAddExhibit(null)
                              }}
                            />
                            <div style={styles.inlineBtns}>
                              <button
                                onClick={() => handleAddExhibit(hall.id)}
                                style={styles.inlineConfirm}
                                disabled={addingExhibit}
                              >
                                {addingExhibit ? '...' : 'Add'}
                              </button>
                              <button
                                onClick={() => { setShowAddExhibit(null); setNewExhibitName('') }}
                                style={styles.inlineCancel}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            style={styles.addExhibitBtn}
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowAddExhibit(hall.id)
                              setNewExhibitName('')
                            }}
                          >
                            + Exhibit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — main content area */}
          <div style={styles.content}>
            <div style={styles.contentEmpty}>
              <div style={styles.contentEmptyIcon}>✦</div>
              <h2 style={styles.contentEmptyTitle}>
                Select an exhibit to view its curios
              </h2>
              <p style={styles.contentEmptyText}>
                Or add your first curio directly to this folio.
              </p>
              <button
                onClick={() => navigate(`/folios/${id}/curios/new`)}
                style={styles.contentEmptyBtn}
              >
                + Add your first Curio
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#F9FAFB' },
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { fontSize: '15px', color: '#6B7280' },
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
    cursor: 'pointer',
  },
  navDivider: { color: '#D1D5DB', fontSize: '18px' },
  navFolioName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111827',
  },
  navRight: { display: 'flex', gap: '12px' },
  navBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#374151',
    fontSize: '13px',
    fontWeight: '500',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '36px 24px',
  },
  folioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  folioTypeBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 10px',
    borderRadius: '20px',
    background: '#EDE9FE',
    color: '#5B21B6',
    textTransform: 'capitalize',
    marginBottom: '8px',
    letterSpacing: '0.02em',
  },
  folioTitle: {
    fontSize: '30px',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '-0.5px',
    marginBottom: '6px',
  },
  folioDesc: {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.5',
  },
  headerActions: { display: 'flex', gap: '10px' },
  addCurioBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  sidebar: {
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
    position: 'sticky',
    top: '80px',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid #F3F4F6',
  },
  sidebarTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  addSmallBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#7C3AED',
    fontSize: '12px',
    fontWeight: '600',
  },
  inlineAdd: {
    padding: '10px 12px',
    borderBottom: '1px solid #F3F4F6',
    background: '#FAFAFA',
  },
  inlineInput: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1.5px solid #7C3AED',
    fontSize: '13px',
    outline: 'none',
    marginBottom: '8px',
    background: '#fff',
  },
  inlineBtns: { display: 'flex', gap: '6px' },
  inlineConfirm: {
    padding: '5px 12px',
    borderRadius: '6px',
    border: 'none',
    background: '#7C3AED',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '600',
  },
  inlineCancel: {
    padding: '5px 12px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#6B7280',
    fontSize: '12px',
  },
  emptyHalls: {
    padding: '24px 16px',
    textAlign: 'center',
  },
  emptyHallsText: {
    fontSize: '13px',
    color: '#9CA3AF',
    lineHeight: '1.6',
  },
  hallList: { padding: '8px 0' },
  hallBlock: { marginBottom: '2px' },
  hallRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  hallChevron: {
    fontSize: '11px',
    color: '#9CA3AF',
    width: '12px',
  },
  hallName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  hallCount: {
    fontSize: '11px',
    color: '#9CA3AF',
    background: '#F3F4F6',
    padding: '1px 6px',
    borderRadius: '10px',
  },
  exhibitList: { paddingBottom: '6px' },
  exhibitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px 6px 32px',
    cursor: 'pointer',
  },
  exhibitDot: { color: '#D1D5DB', fontSize: '16px' },
  exhibitName: {
    fontSize: '13px',
    color: '#6B7280',
  },
  addExhibitBtn: {
    marginLeft: '32px',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px dashed #D1D5DB',
    background: 'none',
    color: '#9CA3AF',
    fontSize: '12px',
    cursor: 'pointer',
    marginTop: '2px',
    marginBottom: '4px',
  },
  content: {
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid #E5E7EB',
    minHeight: '500px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentEmpty: {
    textAlign: 'center',
    padding: '60px 24px',
  },
  contentEmptyIcon: {
    fontSize: '32px',
    color: '#DDD6FE',
    marginBottom: '16px',
  },
  contentEmptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  contentEmptyText: {
    fontSize: '14px',
    color: '#9CA3AF',
    marginBottom: '24px',
  },
  contentEmptyBtn: {
    padding: '11px 24px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
  },
}