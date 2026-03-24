import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function NewCurio() {
  const { id: folioId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // Folio + structure
  const [folio, setFolio] = useState(null)
  const [exhibits, setExhibits] = useState([])
  const [fieldDefinitions, setFieldDefinitions] = useState([])

  // AI identification
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [aiError, setAiError] = useState('')

  // Curio form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedExhibits, setSelectedExhibits] = useState([])
  const [fieldValues, setFieldValues] = useState({})
  const [buyItUrl, setBuyItUrl] = useState('')

  // Images
  const [images, setImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)

  // Saving
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step
  const [step, setStep] = useState(1)

  useEffect(() => {
    fetchFolioData()
  }, [folioId])

  const fetchFolioData = async () => {
    const { data: folioData } = await supabase
      .from('folios')
      .select('*')
      .eq('id', folioId)
      .single()

    const { data: hallsData } = await supabase
      .from('halls')
      .select('*')
      .eq('folio_id', folioId)
      .order('display_order')

    if (hallsData && hallsData.length > 0) {
      const hallIds = hallsData.map(h => h.id)
      const { data: exhibitsData } = await supabase
        .from('exhibits')
        .select('*, halls(name)')
        .in('hall_id', hallIds)
        .order('display_order')
      setExhibits(exhibitsData || [])
    }

    const { data: fieldsData } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('folio_id', folioId)
      .order('display_order')

    setFolio(folioData)
    setFieldDefinitions(fieldsData || [])
  }

  // AI identification
  const handleAiIdentify = async () => {
    if (!aiInput.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiSuggestions(null)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
headers: {
  'Content-Type': 'application/json',
  'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
},        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are an expert curator and collector assistant for an app called CurioFolio. 
When given a description of a collectible item, respond ONLY with a valid JSON object — no explanation, no markdown, no backticks.
The JSON must have exactly these fields:
{
  "name": "full descriptive name of the item",
  "description": "2-3 sentence description",
  "suggestedFields": [{"field_name": "Field Name", "value": "the value"}],
  "didYouKnow": "one fascinating fact about this item in 2-3 sentences"
}
Keep field names short. Include 4-8 relevant fields based on what the item is.
For the didYouKnow, make it genuinely interesting and surprising.`,
          messages: [{
            role: 'user',
            content: `Tell me about this collectible: ${aiInput}`
          }]
        })
      })

      const data = await response.json()
      const text = data.content[0].text
      const parsed = JSON.parse(text)
      setAiSuggestions(parsed)

      // Pre-fill form
      if (parsed.name) setName(parsed.name)
      if (parsed.description) setDescription(parsed.description)

      // Match suggested fields to existing field definitions
      // and pre-fill values
      const newFieldValues = { ...fieldValues }
      if (parsed.suggestedFields) {
        parsed.suggestedFields.forEach(suggestion => {
          const match = fieldDefinitions.find(fd =>
            fd.field_name.toLowerCase() === suggestion.field_name.toLowerCase()
          )
          if (match) {
            newFieldValues[match.id] = suggestion.value
          }
        })
      }
      setFieldValues(newFieldValues)
      setStep(2)

    } catch (err) {
      setAiError('Could not identify this item. Try being more specific, or skip to fill in manually.')
    }
    setAiLoading(false)
  }

  // Image handling
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingImages(true)
    const newImages = []

    for (const file of files) {
      const preview = URL.createObjectURL(file)
      newImages.push({ file, preview, uploading: true })
    }

    setImages(prev => [...prev, ...newImages])
    setUploadingImages(false)
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const setPrimaryImage = (index) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })))
  }

  // Toggle exhibit selection
  const toggleExhibit = (exhibitId) => {
    setSelectedExhibits(prev =>
      prev.includes(exhibitId)
        ? prev.filter(id => id !== exhibitId)
        : [...prev, exhibitId]
    )
  }

  // Save curio
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please give your curio a name')
      return
    }
    setSaving(true)
    setError('')

    try {
      // Get primary exhibit for the curio record
      const primaryExhibitId = selectedExhibits[0] || exhibits[0]?.id
      if (!primaryExhibitId) {
        setError('Please add at least one exhibit to this folio before adding a curio')
        setSaving(false)
        return
      }

      // Insert curio
      const { data: curio, error: curioError } = await supabase
        .from('curios')
        .insert({
          exhibit_id: primaryExhibitId,
          name: name.trim(),
          description: description.trim(),
          ai_identification_input: aiInput || null,
          did_you_know: aiSuggestions?.didYouKnow
            ? { text: aiSuggestions.didYouKnow }
            : null,
          ai_suggested_values: aiSuggestions || null,
          buy_it_url: buyItUrl.trim() || null,
        })
        .select()
        .single()

      if (curioError) throw curioError

      // Insert exhibit links
      if (selectedExhibits.length > 0) {
        const links = selectedExhibits.map(exhibitId => ({
          curio_id: curio.id,
          exhibit_id: exhibitId,
        }))
        await supabase.from('curio_exhibit_links').insert(links)
      }

      // Insert field values
      const valuesToInsert = Object.entries(fieldValues)
        .filter(([_, value]) => value && value.toString().trim() !== '')
        .map(([fieldDefId, value]) => ({
          curio_id: curio.id,
          field_definition_id: fieldDefId,
          value: value.toString().trim(),
        }))

      if (valuesToInsert.length > 0) {
        await supabase.from('curio_field_values').insert(valuesToInsert)
      }

      // Upload images
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          const ext = img.file.name.split('.').pop()
          const path = `${user.id}/${curio.id}/${Date.now()}-${i}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('curio-images')
            .upload(path, img.file)

          if (!uploadError) {
            await supabase.from('curio_images').insert({
              curio_id: curio.id,
              storage_path: path,
              display_order: i,
              is_primary: img.isPrimary || i === 0,
            })
          }
        }
      }

      navigate(`/folios/${folioId}`)

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={styles.page}>

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.logo} onClick={() => navigate('/')}>CF</div>
          <span style={styles.navDivider}>/</span>
          <span
            style={styles.navLink}
            onClick={() => navigate(`/folios/${folioId}`)}
          >
            {folio?.name}
          </span>
          <span style={styles.navDivider}>/</span>
          <span style={styles.navCurrent}>New Curio</span>
        </div>
        <button
          onClick={() => navigate(`/folios/${folioId}`)}
          style={styles.backBtn}
        >
          ← Back
        </button>
      </nav>

      <main style={styles.main}>
        <div style={styles.formCard}>

          {/* Header */}
          <div style={styles.formHeader}>
            <h1 style={styles.formTitle}>Add a Curio</h1>
            <p style={styles.formSubtitle}>
              Let AI identify it, or fill in the details yourself.
            </p>
          </div>

          {/* AI Identification */}
          <div style={styles.aiSection}>
            <div style={styles.aiLabel}>
              <span style={styles.aiSparkle}>✦</span>
              AI Identification
            </div>
            <p style={styles.aiDesc}>
              Type what you have — like <em>"Mark Grace 1989 Topps #465"</em> or <em>"Canyon Diablo iron meteorite"</em> — and we'll fill in the details.
            </p>
            <div style={styles.aiInputRow}>
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                style={styles.aiInput}
                placeholder="Describe your item..."
                onKeyDown={e => e.key === 'Enter' && handleAiIdentify()}
              />
              <button
                onClick={handleAiIdentify}
                style={aiLoading ? {...styles.aiBtn, opacity: 0.6} : styles.aiBtn}
                disabled={aiLoading}
              >
                {aiLoading ? 'Identifying...' : 'Identify →'}
              </button>
            </div>
            {aiError && <div style={styles.aiError}>{aiError}</div>}

            {aiSuggestions && (
              <div style={styles.aiResult}>
                <div style={styles.aiResultHeader}>
                  <span style={styles.aiResultIcon}>✓</span>
                  Item identified — details pre-filled below
                </div>
                {aiSuggestions.didYouKnow && (
                  <div style={styles.didYouKnow}>
                    <span style={styles.didYouKnowLabel}>Did you know…</span>
                    <p style={styles.didYouKnowText}>{aiSuggestions.didYouKnow}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={styles.divider} />

          {/* Name + Description */}
          <div style={styles.section}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Curio name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                style={styles.input}
                placeholder="e.g. Mark Grace 1989 Topps #465"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Description <span style={styles.optional}>(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={styles.textarea}
                placeholder="Any notes about this item..."
                rows={3}
              />
            </div>
          </div>

          <div style={styles.divider} />

          {/* Dynamic fields */}
          {fieldDefinitions.length > 0 && (
            <>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Details</div>
                <div style={styles.fieldsGrid}>
                  {fieldDefinitions.map(field => (
                    <div key={field.id} style={styles.fieldGroup}>
                      <label style={styles.label}>{field.field_name}</label>
                      <input
                        type={field.field_type === 'number' ? 'number' : 'text'}
                        value={fieldValues[field.id] || ''}
                        onChange={e => setFieldValues({
                          ...fieldValues,
                          [field.id]: e.target.value
                        })}
                        style={styles.input}
                        placeholder={
                          field.field_type === 'number' ? '0' : `Enter ${field.field_name.toLowerCase()}...`
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.divider} />
            </>
          )}

          {/* Exhibits */}
          {exhibits.length > 0 && (
            <>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Add to Exhibits</div>
                <p style={styles.sectionSubtitle}>
                  A curio can appear in multiple exhibits.
                </p>
                <div style={styles.exhibitGrid}>
                  {exhibits.map(exhibit => (
                    <div
                      key={exhibit.id}
                      style={
                        selectedExhibits.includes(exhibit.id)
                          ? {...styles.exhibitChip, ...styles.exhibitChipSelected}
                          : styles.exhibitChip
                      }
                      onClick={() => toggleExhibit(exhibit.id)}
                    >
                      <span style={styles.exhibitChipHall}>
                        {exhibit.halls?.name}
                      </span>
                      <span style={styles.exhibitChipName}>{exhibit.name}</span>
                      {selectedExhibits.includes(exhibit.id) && (
                        <span style={styles.exhibitChipCheck}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.divider} />
            </>
          )}

          {/* Images */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Photos</div>
            <p style={styles.sectionSubtitle}>
              Upload up to 10 photos. Click one to set it as the primary image.
            </p>

            <div style={styles.imageGrid}>
              {images.map((img, index) => (
                <div key={index} style={styles.imageThumb}>
                  <img
                    src={img.preview}
                    alt=""
                    style={{
                      ...styles.thumbImg,
                      ...(img.isPrimary || index === 0 ? styles.thumbImgPrimary : {})
                    }}
                    onClick={() => setPrimaryImage(index)}
                  />
                  {(img.isPrimary || (index === 0 && !images.some(i => i.isPrimary))) && (
                    <div style={styles.primaryBadge}>Primary</div>
                  )}
                  <button
                    style={styles.removeImageBtn}
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}

              {images.length < 10 && (
                <div
                  style={styles.uploadZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={styles.uploadIcon}>+</div>
                  <div style={styles.uploadText}>Add photo</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={styles.divider} />

          {/* Buy it URL */}
          <div style={styles.section}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Buy it link <span style={styles.optional}>(optional)</span>
              </label>
              <input
                type="url"
                value={buyItUrl}
                onChange={e => setBuyItUrl(e.target.value)}
                style={styles.input}
                placeholder="https://ebay.com/..."
              />
            </div>
          </div>

          {/* Error + Save */}
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.saveRow}>
            <button
              onClick={() => navigate(`/folios/${folioId}`)}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={saving ? {...styles.saveBtn, opacity: 0.6} : styles.saveBtn}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Curio →'}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#F9FAFB' },
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
  navLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
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
  navDivider: { color: '#D1D5DB', fontSize: '16px' },
  navLink: {
    fontSize: '14px',
    color: '#6B7280',
    cursor: 'pointer',
  },
  navCurrent: { fontSize: '14px', fontWeight: '600', color: '#111827' },
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
    maxWidth: '720px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  formCard: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
  },
  formHeader: {
    padding: '32px 32px 24px',
    borderBottom: '1px solid #F3F4F6',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '-0.3px',
    marginBottom: '4px',
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#6B7280',
  },
  aiSection: {
    padding: '24px 32px',
    background: '#FAFAFF',
    borderBottom: '1px solid #F3F4F6',
  },
  aiLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#5B21B6',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  aiSparkle: { fontSize: '14px' },
  aiDesc: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '14px',
    lineHeight: '1.5',
  },
  aiInputRow: {
    display: 'flex',
    gap: '10px',
  },
  aiInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #DDD6FE',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    background: '#fff',
  },
  aiBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  aiError: {
    marginTop: '10px',
    fontSize: '13px',
    color: '#DC2626',
    background: '#FEF2F2',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #FECACA',
  },
  aiResult: {
    marginTop: '14px',
    borderRadius: '10px',
    border: '1px solid #DDD6FE',
    overflow: 'hidden',
  },
  aiResultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: '#EDE9FE',
    fontSize: '13px',
    fontWeight: '600',
    color: '#5B21B6',
  },
  aiResultIcon: { fontSize: '14px', color: '#7C3AED' },
  didYouKnow: {
    padding: '14px 16px',
    background: '#fff',
  },
  didYouKnowLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#0D9488',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: '6px',
  },
  didYouKnowText: {
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.6',
    fontStyle: 'italic',
  },
  divider: {
    height: '1px',
    background: '#F3F4F6',
  },
  section: { padding: '24px 32px' },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
  },
  sectionSubtitle: {
    fontSize: '13px',
    color: '#9CA3AF',
    marginBottom: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  required: { color: '#DC2626' },
  optional: { color: '#9CA3AF', fontWeight: '400' },
  input: {
    padding: '10px 13px',
    borderRadius: '8px',
    border: '1.5px solid #E5E7EB',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    background: '#F9FAFB',
    width: '100%',
  },
  textarea: {
    padding: '10px 13px',
    borderRadius: '8px',
    border: '1.5px solid #E5E7EB',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    background: '#F9FAFB',
    width: '100%',
    resize: 'vertical',
    lineHeight: '1.5',
  },
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0 20px',
  },
  exhibitGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  exhibitChip: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1.5px solid #E5E7EB',
    cursor: 'pointer',
    background: '#fff',
    minWidth: '120px',
  },
  exhibitChipSelected: {
    border: '1.5px solid #7C3AED',
    background: '#EDE9FE',
  },
  exhibitChipHall: {
    fontSize: '10px',
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '2px',
  },
  exhibitChipName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  exhibitChipCheck: {
    fontSize: '11px',
    color: '#7C3AED',
    marginTop: '4px',
    fontWeight: '700',
  },
  imageGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  imageThumb: {
    position: 'relative',
    width: '100px',
    height: '100px',
    borderRadius: '10px',
    overflow: 'visible',
  },
  thumbImg: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '10px',
    border: '2px solid #E5E7EB',
    cursor: 'pointer',
    display: 'block',
  },
  thumbImgPrimary: {
    border: '2px solid #7C3AED',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#7C3AED',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '10px',
    whiteSpace: 'nowrap',
  },
  removeImageBtn: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: '#EF4444',
    color: '#fff',
    border: 'none',
    fontSize: '14px',
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: '700',
  },
  uploadZone: {
    width: '100px',
    height: '100px',
    borderRadius: '10px',
    border: '2px dashed #D1D5DB',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: '#F9FAFB',
  },
  uploadIcon: {
    fontSize: '24px',
    color: '#9CA3AF',
    lineHeight: '1',
    marginBottom: '4px',
  },
  uploadText: {
    fontSize: '11px',
    color: '#9CA3AF',
    fontWeight: '500',
  },
  error: {
    margin: '0 32px',
    background: '#FEF2F2',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    border: '1px solid #FECACA',
    marginBottom: '16px',
  },
  saveRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '24px 32px',
    borderTop: '1px solid #F3F4F6',
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
  saveBtn: {
    padding: '11px 28px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #7C3AED, #0D9488)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
  },
}