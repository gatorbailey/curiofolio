import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FOLIO_TYPES } from '../lib/folioTypes'

export default function NewFolio() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTypeSelect = (type) => {
    setSelectedType(type)
    if (name === '') setName(type.label + ' Collection')
    setStep(2)
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please give your folio a name')
      return
    }
    setLoading(true)
    setError('')

    // Create the folio
    const { data: folio, error: folioError } = await supabase
      .from('folios')
      .insert({
        owner_id: user.id,
        name: name.trim(),
        description: description.trim(),
        folio_type: selectedType.id,
        is_public: isPublic,
      })
      .select()
      .single()

    if (folioError) {
      setError(folioError.message)
      setLoading(false)
      return
    }

    // Insert suggested field definitions
    if (selectedType.suggestedFields.length > 0) {
      const fields = selectedType.suggestedFields.map((f, index) => ({
        folio_id: folio.id,
        field_name: f.field_name,
        field_type: f.field_type,
        display_order: index,
        ai_suggested: false,
        user_confirmed: true,
      }))
      await supabase.from('field_definitions').insert(fields)
    }

    // Insert suggested halls and exhibits
    for (const hall of selectedType.suggestedHalls) {
      const { data: hallData, error: hallError } = await supabase
        .from('halls')
        .insert({
          folio_id: folio.id,
          name: hall.name,
          display_order: selectedType.suggestedHalls.indexOf(hall),
        })
        .select()
        .single()

      if (!hallError && hall.suggestedExhibits.length > 0) {
        const exhibits = hall.suggestedExhibits.map((e, index) => ({
          hall_id: hallData.id,
          name: e,
          display_order: index,
        }))
        await supabase.from('exhibits').insert(exhibits)
      }
    }

    navigate(`/folios/${folio.id}`)
  }

  return (
    <div style={styles.page}>

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.logo}>CF</div>
          <span style={styles.logoText}>CurioFolio</span>
        </div>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          ← Back
        </button>
      </nav>

      <main style={styles.main}>

        {/* Step indicator */}
        <div style={styles.stepRow}>
          <div style={step >= 1 ? styles.stepActive : styles.stepInactive}>
            1 · Choose type
          </div>
          <div style={styles.stepDivider}>—</div>
          <div style={step >= 2 ? styles.stepActive : styles.stepInactive}>
            2 · Name it
          </div>
        </div>

        {/* Step 1 — pick a type */}
        {step === 1 && (
          <div>
            <h1 style={styles.pageTitle}>What are you collecting?</h1>
            <p style={styles.pageSubtitle}>
              Pick a type and we'll suggest halls, exhibits, and fields to get you started fast.
            </p>
            <div style={styles.typeGrid}>
              {FOLIO_TYPES.map(type => (
                <div
                  key={type.id}
                  style={styles.typeCard}
                  onClick={() => handleTypeSelect(type)}
                >
                  <div style={styles.typeIcon}>{type.icon}</div>
                  <div style={styles.typeLabel}>{type.label}</div>
                  <div style={styles.typeDesc}>{type.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — name and details */}
        {step === 2 && selectedType && (
          <div style={styles.formWrap}>
            <div style={styles.selectedTypeBadge}>
              <span>{selectedType.icon}</span>
              <span>{selectedType.label}</span>
              <button
                onClick={() => setStep(1)}
                style={styles.changeTypeBtn}
              >
                Change
              </button>
            </div>

            <h1 style={styles.pageTitle}>Name your Folio</h1>
            <p style={styles.pageSubtitle}>
              You can always rename it later.
            </p>

            <div style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Folio name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. My Baseball Card Collection"
                  autoFocus
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Description <span style={styles.optional}>(optional)</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={styles.textarea}
                  placeholder="What's in this collection? Any notes about it..."
                  rows={3}
                />
              </div>

              <div style={styles.toggleRow}>
                <div>
                  <div style={styles.toggleLabel}>Make this folio public</div>
                  <div style={styles.toggleDesc}>Anyone with the link can view it</div>
                </div>
                <div
                  style={isPublic ? styles.toggleOn : styles.toggleOff}
                  onClick={() => setIsPublic(!isPublic)}
                >
                  <div style={isPublic ? styles.toggleThumbOn : styles.toggleThumbOff} />
                </div>
              </div>

              {selectedType.suggestedHalls.length > 0 && (
                <div style={styles.previewBox}>
                  <div style={styles.previewTitle}>
                    What we'll set up for you
                  </div>
                  <div style={styles.previewList}>
                    {selectedType.suggestedHalls.map(hall => (
                      <div key={hall.name} style={styles.previewHall}>
                        <span style={styles.previewHallName}>🏛 {hall.name}</span>
                        <span style={styles.previewExhibits}>
                          {hall.suggestedExhibits.slice(0, 4).join(' · ')}
                          {hall.suggestedExhibits.length > 4 ? ' · ...' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={styles.previewFields}>
                    <strong>Fields:</strong>{' '}
                    {selectedType.suggestedFields.map(f => f.field_name).join(', ')}
                  </div>
                </div>
              )}

              {error && <div style={styles.error}>{error}</div>}

              <div style={styles.btnRow}>
                <button
                  onClick={() => setStep(1)}
                  style={styles.cancelBtn}
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  style={loading ? {...styles.createBtn, opacity: 0.6} : styles.createBtn}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Folio →'}
                </button>
              </div>
            </div>
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
  backBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#374151',
    fontSize: '13px',
    fontWeight: '500',
  },
  main: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '48px 24px',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '36px',
  },
  stepActive: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#7C3AED',
  },
  stepInactive: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#9CA3AF',
  },
  stepDivider: {
    color: '#D1D5DB',
    fontSize: '13px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '-0.5px',
    marginBottom: '8px',
  },
  pageSubtitle: {
    fontSize: '15px',
    color: '#6B7280',
    marginBottom: '36px',
    lineHeight: '1.5',
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '14px',
  },
  typeCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '24px 18px',
    border: '1.5px solid #E5E7EB',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  typeIcon: {
    fontSize: '32px',
    marginBottom: '10px',
  },
  typeLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
  },
  typeDesc: {
    fontSize: '12px',
    color: '#9CA3AF',
    lineHeight: '1.4',
  },
  formWrap: {
    maxWidth: '560px',
  },
  selectedTypeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#EDE9FE',
    color: '#5B21B6',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '28px',
  },
  changeTypeBtn: {
    background: 'none',
    border: 'none',
    color: '#7C3AED',
    fontSize: '12px',
    fontWeight: '600',
    textDecoration: 'underline',
    padding: '0',
    marginLeft: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
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
  optional: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1.5px solid #E5E7EB',
    fontSize: '15px',
    color: '#111827',
    outline: 'none',
    background: '#F9FAFB',
    width: '100%',
  },
  textarea: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1.5px solid #E5E7EB',
    fontSize: '15px',
    color: '#111827',
    outline: 'none',
    background: '#F9FAFB',
    width: '100%',
    resize: 'vertical',
    lineHeight: '1.5',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#F9FAFB',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
  },
  toggleLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827',
    marginBottom: '2px',
  },
  toggleDesc: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  toggleOn: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    background: '#7C3AED',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  toggleOff: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    background: '#D1D5DB',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  toggleThumbOn: {
    position: 'absolute',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: '#fff',
    top: '3px',
    right: '3px',
    transition: 'right 0.2s',
  },
  toggleThumbOff: {
    position: 'absolute',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: '#fff',
    top: '3px',
    left: '3px',
    transition: 'left 0.2s',
  },
  previewBox: {
    background: '#F5F3FF',
    border: '1px solid #DDD6FE',
    borderRadius: '10px',
    padding: '16px 18px',
  },
  previewTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#5B21B6',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px',
  },
  previewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  previewHall: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  previewHallName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  previewExhibits: {
    fontSize: '12px',
    color: '#6B7280',
    paddingLeft: '20px',
  },
  previewFields: {
    fontSize: '12px',
    color: '#6B7280',
    paddingTop: '10px',
    borderTop: '1px solid #DDD6FE',
    lineHeight: '1.5',
  },
  error: {
    background: '#FEF2F2',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    border: '1px solid #FECACA',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  cancelBtn: {
    padding: '11px 22px',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
  },
  createBtn: {
    padding: '11px 28px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
  },
}