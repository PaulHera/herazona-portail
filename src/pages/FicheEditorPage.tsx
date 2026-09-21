import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, formatError } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChevronDown, ChevronUp, MapPin, Check, AlertTriangle, X, Save, ArrowLeft } from 'lucide-react'

// ── Couleurs DS ─────────────────────────────────────────────────────────────
const NAVY = '#1B2A4A'
const GOLD = '#C9A84C'
const TEAL = '#78C7CE'
const GRAY = '#8A877F'
const GRAY_LIGHT = '#E8E6E0'
const SAND = '#F5F4F0'
const ERROR = '#FF6B6B'
const SUCCESS = '#059669'

// ── Horaires ────────────────────────────────────────────────────────────────
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HEURES: string[] = []
for (let h = 6; h <= 23; h++) { HEURES.push(`${String(h).padStart(2, '0')}:00`); HEURES.push(`${String(h).padStart(2, '0')}:30`) }

interface Plage { de: string; a: string }
type JourMode = 'ouvert' | 'ferme' | 'rdv'
interface JourData { ouvert: boolean; mode: JourMode; plages: Plage[] }
type HorairesStruct = Record<string, JourData>

function parseStruct(struct: any): JourData[] {
  return JOURS.map((_, i) => {
    const day = struct?.[String(i + 1)]
    if (!day) return { ouvert: false, mode: 'ferme' as JourMode, plages: [{ de: '09:00', a: '18:00' }] }
    const mode: JourMode = day.mode === 'rdv' ? 'rdv' : day.ouvert ? 'ouvert' : 'ferme'
    return {
      ouvert: day.ouvert ?? false, mode,
      plages: Array.isArray(day.plages) && day.plages.length > 0
        ? day.plages.map((p: any) => ({ de: p.de || '09:00', a: p.a || '18:00' }))
        : [{ de: '09:00', a: '18:00' }],
    }
  })
}

function joursToStruct(jours: JourData[]): HorairesStruct {
  const s: HorairesStruct = {}
  jours.forEach((j, i) => {
    s[String(i + 1)] = { ouvert: j.mode === 'ouvert', mode: j.mode, plages: j.mode === 'ouvert' ? j.plages : [] }
  })
  return s
}

// ── Nominatim ───────────────────────────────────────────────────────────────
interface NominatimResult { display_name: string; lat: string; lon: string; address: Record<string, string> }

// ── Composant principal ────────────────────────────────────────────────────
export default function FicheEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { pages } = useAuth()

  // Si pas d'id, prendre la première fiche
  const pageId = id || pages[0]?.id
  if (!pageId) return <div style={{ color: GRAY, padding: 40 }}>Aucune fiche associee a votre compte.</div>

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form
  const [nom, setNom] = useState('')
  const [accroche, setAccroche] = useState('')
  const [description, setDescription] = useState('')
  const [sports, setSports] = useState<string[]>([])
  const [sportInput, setSportInput] = useState('')
  const [sousCategorie, setSousCategorie] = useState('')
  const [instagram, setInstagram] = useState('')
  const [siteWeb, setSiteWeb] = useState('')
  const [pointsForts, setPointsForts] = useState<string[]>([])
  const [pfInput, setPfInput] = useState('')
  const [offreEssai, setOffreEssai] = useState('')
  const [pageType, setPageType] = useState('')

  // Adresse
  const [adresseQuery, setAdresseQuery] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [ville, setVille] = useState('')
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Horaires
  const [jours, setJours] = useState<JourData[]>(() => parseStruct(null))
  const [horairesOpen, setHorairesOpen] = useState(false)

  // Tarifs
  const [tarifs, setTarifs] = useState<{ libelle: string; prix: string; mis_en_avant: boolean }[]>([])

  // Adresses supplémentaires
  const [adresses, setAdresses] = useState<{ label: string; adresse: string; latitude: number | null; longitude: number | null }[]>([])
  const [adresseQueries, setAdresseQueries] = useState<string[]>([])
  const [adresseSugg, setAdresseSugg] = useState<Record<number, NominatimResult[]>>({})
  const [adresseShowSugg, setAdresseShowSugg] = useState<Record<number, boolean>>({})
  const adresseDebounceRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const { data, error: err } = await supabase.rpc('gerant_get_page', { p_page_id: pageId })
        if (err) throw err
        if (!data) throw new Error('Page introuvable')

        setNom(data.nom || '')
        setAccroche(data.accroche || '')
        setDescription(data.description || '')
        setSports(data.sports || [])
        setSousCategorie(data.sous_categorie || '')
        setInstagram(data.instagram || '')
        setSiteWeb(data.site_web || '')
        setPointsForts(data.points_forts || [])
        setOffreEssai(data.offre_essai || '')
        setPageType(data.type || '')
        setAdresseQuery(data.adresse || '')
        setLatitude(data.latitude)
        setLongitude(data.longitude)
        setVille(data.ville || '')
        setJours(parseStruct(data.horaires_struct))

        if (Array.isArray(data.tarifs)) {
          setTarifs(data.tarifs.map((t: any) => ({ libelle: t.libelle || '', prix: t.prix || '', mis_en_avant: t.mis_en_avant || false })))
        }
        if (Array.isArray(data.adresses) && data.adresses.length > 0) {
          setAdresses(data.adresses.map((a: any) => ({ label: a.label || '', adresse: a.adresse || '', latitude: a.latitude, longitude: a.longitude })))
          setAdresseQueries(data.adresses.map((a: any) => a.adresse || ''))
        }
      } catch (err) {
        setError(formatError(err))
      }
      setLoading(false)
    })()
  }, [pageId])

  // ── Nominatim (adresse principale) ────────────────────────────────────────
  const searchNominatim = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); return }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=fr&limit=5&addressdetails=1`)
      const results: NominatimResult[] = await res.json()
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    } catch { setSuggestions([]) }
  }, [])

  const handleAdresseChange = (value: string) => {
    setAdresseQuery(value); setLatitude(null); setLongitude(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchNominatim(value), 400)
  }

  const selectSuggestion = (sg: NominatimResult) => {
    const v = sg.address.city || sg.address.town || sg.address.village || sg.address.municipality || ''
    setAdresseQuery(sg.display_name); setLatitude(parseFloat(sg.lat)); setLongitude(parseFloat(sg.lon)); setVille(v)
    setShowSuggestions(false); setSuggestions([])
  }

  // ── Nominatim (adresses supplémentaires) ──────────────────────────────────
  const handleExtraAdresseChange = (idx: number, value: string) => {
    const nq = [...adresseQueries]; nq[idx] = value; setAdresseQueries(nq)
    const na = [...adresses]; na[idx] = { ...na[idx], adresse: value, latitude: null, longitude: null }; setAdresses(na)
    if (adresseDebounceRefs.current[idx]) clearTimeout(adresseDebounceRefs.current[idx])
    adresseDebounceRefs.current[idx] = setTimeout(async () => {
      if (value.length < 3) return
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&countrycodes=fr&limit=5&addressdetails=1`)
        const results: NominatimResult[] = await res.json()
        setAdresseSugg(p => ({ ...p, [idx]: results }))
        setAdresseShowSugg(p => ({ ...p, [idx]: results.length > 0 }))
      } catch {}
    }, 400)
  }

  const selectExtraSuggestion = (idx: number, sg: NominatimResult) => {
    const na = [...adresses]; na[idx] = { ...na[idx], adresse: sg.display_name, latitude: parseFloat(sg.lat), longitude: parseFloat(sg.lon) }; setAdresses(na)
    const nq = [...adresseQueries]; nq[idx] = sg.display_name; setAdresseQueries(nq)
    setAdresseShowSugg(p => ({ ...p, [idx]: false }))
  }

  // ── Prix formatter ────────────────────────────────────────────────────────
  const formatPrix = (p: string) => { const t = p.trim(); return t && /^\d+([.,]\d+)?$/.test(t) ? t + '€' : t }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (latitude === null || longitude === null) {
      setError("L'adresse doit etre geocodee (selectionnez une suggestion)")
      return
    }
    setSaving(true); setError(null); setSaved(false)
    try {
      // 1. Mise à jour de la fiche
      const { error: err } = await supabase.rpc('gerant_update_page', {
        p_page_id: pageId,
        p_accroche: accroche, p_description: description,
        p_sports: sports, p_sous_categorie: sousCategorie,
        p_adresse: adresseQuery, p_ville: ville,
        p_latitude: latitude, p_longitude: longitude,
        p_instagram: instagram, p_site_web: siteWeb,
        p_points_forts: pointsForts,
        p_horaires_struct: joursToStruct(jours),
        p_offre_essai: offreEssai,
      })
      if (err) throw err

      // 2. Tarifs
      const validTarifs = tarifs.filter(t => t.libelle.trim()).map((t, i) => ({
        libelle: t.libelle.trim(), prix: formatPrix(t.prix), ordre: i, mis_en_avant: t.mis_en_avant,
      }))
      const { error: tarifErr } = await supabase.rpc('gerant_set_tarifs', {
        p_page_id: pageId, p_tarifs: validTarifs,
      })
      if (tarifErr) throw tarifErr

      // 3. Adresses supplémentaires
      const validAdresses = adresses.filter(a => a.label.trim() && a.latitude !== null).map((a, i) => ({
        label: a.label.trim(), adresse: a.adresse, latitude: a.latitude, longitude: a.longitude, ordre: i,
      }))
      const { error: addrErr } = await supabase.rpc('gerant_set_adresses', {
        p_page_id: pageId, p_adresses: validAdresses,
      })
      if (addrErr) throw addrErr

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(formatError(err))
    }
    setSaving(false)
  }

  if (loading) return <div style={{ color: GRAY, padding: 40 }}>Chargement de la fiche...</div>

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: TEAL, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Retour
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>{nom}</h1>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999, background: 'rgba(27,42,74,0.08)', color: NAVY, letterSpacing: 0.5, textTransform: 'uppercase' }}>{pageType}</span>
      </div>

      {/* ═══ ESSENTIEL ═══ */}
      <Section title="INFORMATIONS">
        <Field label="Accroche" hint="120 car. max">
          <input style={s.input} value={accroche} onChange={e => setAccroche(e.target.value.slice(0, 120))} placeholder="Phrase courte..." maxLength={120} />
        </Field>

        <Field label="Description">
          <textarea style={s.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description detaillee..." rows={4} />
        </Field>

        <Field label="Sports">
          <div style={s.tagContainer}>
            {sports.map((sp, i) => (
              <span key={i} style={s.tag}>{sp}<button style={s.tagRemove} onClick={() => setSports(sports.filter((_, j) => j !== i))}><X size={10} /></button></span>
            ))}
            <input style={s.tagInput} value={sportInput} onChange={e => setSportInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const t = sportInput.trim(); if (t && !sports.includes(t)) setSports([...sports, t]); setSportInput('') } }} placeholder="Ajouter + Entree" />
          </div>
        </Field>

        <Field label="Points forts">
          <div style={s.tagContainer}>
            {pointsForts.map((pf, i) => (
              <span key={i} style={s.tag}>{pf}<button style={s.tagRemove} onClick={() => setPointsForts(pointsForts.filter((_, j) => j !== i))}><X size={10} /></button></span>
            ))}
            <input style={s.tagInput} value={pfInput} onChange={e => setPfInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const t = pfInput.trim(); if (t && !pointsForts.includes(t)) setPointsForts([...pointsForts, t]); setPfInput('') } }} placeholder="Ajouter + Entree" />
          </div>
        </Field>

        {(pageType === 'salle' || pageType === 'coach') && (
          <Field label="Offre essai">
            <input style={s.input} value={offreEssai} onChange={e => setOffreEssai(e.target.value)} placeholder="ex: 1er cours gratuit" />
          </Field>
        )}
      </Section>

      {/* ═══ ADRESSE ═══ */}
      <Section title="ADRESSE">
        <Field label="Adresse principale">
          <div style={{ position: 'relative' }}>
            <input style={s.input} value={adresseQuery} onChange={e => handleAdresseChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }} placeholder="Tapez une adresse..." />
            <div style={{ marginTop: 4 }}>
              {latitude !== null ? (
                <span style={s.geoBadge}><Check size={11} /> Geocode · {ville || '—'}</span>
              ) : adresseQuery.length > 2 ? (
                <span style={s.geoWarning}><AlertTriangle size={11} /> Selectionnez une suggestion</span>
              ) : null}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div style={s.dropdown}>
                {suggestions.map((sg, i) => (
                  <div key={i} style={s.dropdownItem} onClick={() => selectSuggestion(sg)}
                    onMouseEnter={e => (e.currentTarget.style.background = SAND)}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                    <MapPin size={13} style={{ flexShrink: 0, color: GRAY, marginRight: 6 }} />
                    {sg.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Field>

        {/* Adresses supplémentaires */}
        <Field label="Adresses supplementaires" hint="Pour les multi-sites">
          {adresses.map((a, i) => (
            <div key={i} style={{ marginBottom: 12, padding: 12, background: SAND, borderRadius: 10, border: `1px solid ${GRAY_LIGHT}` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input style={{ ...s.input, flex: 1 }} value={a.label}
                  onChange={e => { const na = [...adresses]; na[i] = { ...na[i], label: e.target.value }; setAdresses(na) }}
                  placeholder="Nom du site (ex: Passy)" />
                <button style={{ background: 'none', border: 'none', color: ERROR, cursor: 'pointer', padding: 4, display: 'flex' }}
                  onClick={() => { setAdresses(adresses.filter((_, j) => j !== i)); setAdresseQueries(adresseQueries.filter((_, j) => j !== i)) }}><X size={14} /></button>
              </div>
              <div style={{ position: 'relative' }}>
                <input style={s.input} value={adresseQueries[i] || ''} onChange={e => handleExtraAdresseChange(i, e.target.value)}
                  onFocus={() => { if ((adresseSugg[i] || []).length > 0) setAdresseShowSugg(p => ({ ...p, [i]: true })) }}
                  placeholder="Tapez une adresse..." />
                <div style={{ marginTop: 4 }}>
                  {a.latitude !== null ? <span style={s.geoBadge}><Check size={11} /> Geocode</span>
                    : (adresseQueries[i] || '').length > 2 ? <span style={s.geoWarning}><AlertTriangle size={11} /> Selectionnez</span>
                    : null}
                </div>
                {adresseShowSugg[i] && (adresseSugg[i] || []).length > 0 && (
                  <div style={s.dropdown}>
                    {adresseSugg[i].map((sg, si) => (
                      <div key={si} style={s.dropdownItem} onClick={() => selectExtraSuggestion(i, sg)}
                        onMouseEnter={e => (e.currentTarget.style.background = SAND)}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                        <MapPin size={13} style={{ flexShrink: 0, color: GRAY, marginRight: 6 }} />{sg.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button style={s.addBtn} onClick={() => { setAdresses([...adresses, { label: '', adresse: '', latitude: null, longitude: null }]); setAdresseQueries([...adresseQueries, '']) }}>
            + Ajouter une adresse
          </button>
        </Field>
      </Section>

      {/* ═══ CONTACTS ═══ */}
      <Section title="CONTACTS">
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Field label="Instagram" half>
            <input style={s.input} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle" />
          </Field>
          <Field label="Site web" half>
            <input style={s.input} value={siteWeb} onChange={e => setSiteWeb(e.target.value)} placeholder="https://..." />
          </Field>
        </div>
      </Section>

      {/* ═══ HORAIRES ═══ */}
      {(pageType === 'salle' || pageType === 'spot') && (
        <Section title="HORAIRES" collapsible open={horairesOpen} onToggle={() => setHorairesOpen(!horairesOpen)}>
          {JOURS.map((jour, i) => (
            <div key={jour} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: `1px solid ${GRAY_LIGHT}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 110, fontSize: 14, paddingTop: 4 }}>
                <span style={{ color: jours[i].mode !== 'ferme' ? NAVY : GRAY, fontWeight: jours[i].mode !== 'ferme' ? 600 : 400, width: 60 }}>{jour}</span>
                <select style={s.selectSmall} value={jours[i].mode} onChange={e => { const n = [...jours]; n[i] = { ...n[i], mode: e.target.value as JourMode, ouvert: e.target.value === 'ouvert' }; setJours(n) }}>
                  <option value="ouvert">Ouvert</option>
                  <option value="ferme">Ferme</option>
                  <option value="rdv">Sur RDV</option>
                </select>
              </div>
              {jours[i].mode === 'ouvert' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {jours[i].plages.map((p, pi) => (
                    <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <select style={s.selectSmall} value={p.de} onChange={e => { const n = [...jours]; n[i].plages[pi] = { ...p, de: e.target.value }; setJours([...n]) }}>
                        {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span style={{ color: GRAY }}>—</span>
                      <select style={s.selectSmall} value={p.a} onChange={e => { const n = [...jours]; n[i].plages[pi] = { ...p, a: e.target.value }; setJours([...n]) }}>
                        {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      {jours[i].plages.length > 1 && (
                        <button style={{ background: 'none', border: 'none', color: ERROR, cursor: 'pointer', padding: 2, display: 'flex' }}
                          onClick={() => { const n = [...jours]; n[i].plages = n[i].plages.filter((_, j) => j !== pi); setJours(n) }}><X size={12} /></button>
                      )}
                    </div>
                  ))}
                  <button style={{ background: 'none', border: 'none', color: TEAL, cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '2px 0', textAlign: 'left', width: 'fit-content' }}
                    onClick={() => { const n = [...jours]; n[i].plages = [...n[i].plages, { de: '14:00', a: '19:00' }]; setJours(n) }}>+ creneau</button>
                </div>
              ) : jours[i].mode === 'rdv' ? (
                <span style={{ fontSize: 13, color: TEAL, fontWeight: 500, flex: 1, paddingTop: 4 }}>Sur rendez-vous</span>
              ) : (
                <span style={{ fontSize: 13, color: GRAY, fontStyle: 'italic', paddingTop: 4 }}>Ferme</span>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ═══ TARIFS ═══ */}
      {(pageType === 'salle' || pageType === 'coach') && (
        <Section title="TARIFS">
          {tarifs.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input style={{ ...s.input, flex: 2 }} value={t.libelle}
                onChange={e => { const n = [...tarifs]; n[i] = { ...n[i], libelle: e.target.value }; setTarifs(n) }}
                placeholder="ex: Abonnement mensuel" />
              <input style={{ ...s.input, width: 100, textAlign: 'right' }} value={t.prix}
                onChange={e => { const n = [...tarifs]; n[i] = { ...n[i], prix: e.target.value }; setTarifs(n) }}
                placeholder="ex: 89€" />
              <label style={{ flexShrink: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={t.mis_en_avant} style={{ display: 'none' }}
                  onChange={e => { const n = [...tarifs]; n[i] = { ...n[i], mis_en_avant: e.target.checked }; setTarifs(n) }} />
                <span style={{ color: t.mis_en_avant ? GOLD : GRAY_LIGHT, fontSize: 18 }}>★</span>
              </label>
              <button style={{ background: 'none', border: 'none', color: ERROR, cursor: 'pointer', padding: 4, display: 'flex' }}
                onClick={() => setTarifs(tarifs.filter((_, j) => j !== i))}><X size={14} /></button>
            </div>
          ))}
          <button style={s.addBtn} onClick={() => setTarifs([...tarifs, { libelle: '', prix: '', mis_en_avant: false }])}>
            + Ajouter un tarif
          </button>
        </Section>
      )}

      {/* ═══ ACTIONS ═══ */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4, marginBottom: 40 }}>
        {error && <div style={{ flex: 1, padding: '10px 14px', background: '#FFF0F0', borderRadius: 10, fontSize: 13, color: ERROR, fontWeight: 600 }}>{error}</div>}
        {saved && <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,255,128,0.08)', borderRadius: 10, fontSize: 13, color: SUCCESS, fontWeight: 600 }}>Modifications enregistrees</div>}
        <button onClick={() => navigate('/')} style={s.cancelBtn}>Annuler</button>
        <button onClick={handleSave} disabled={saving} style={s.saveBtn}>
          <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

// ── Composants utilitaires ──────────────────────────────────────────────────
function Section({ title, children, collapsible, open, onToggle }: {
  title: string; children: React.ReactNode; collapsible?: boolean; open?: boolean; onToggle?: () => void
}) {
  const isOpen = collapsible ? open : true
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {collapsible ? (
        <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <h2 style={s.sectionTitle}>{title}</h2>
          {isOpen ? <ChevronUp size={18} color={GRAY} /> : <ChevronDown size={18} color={GRAY} />}
        </button>
      ) : (
        <h2 style={s.sectionTitle}>{title}</h2>
      )}
      {isOpen && <div style={{ marginTop: collapsible ? 16 : 0 }}>{children}</div>}
    </div>
  )
}

function Field({ label, hint, children, half }: { label: string; hint?: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div style={{ marginBottom: 14, ...(half ? { flex: '1 1 calc(50% - 7px)', minWidth: 220 } : {}) }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 5 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: GRAY, marginLeft: 6 }}>({hint})</span>}
      </label>
      {children}
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  sectionTitle: { fontSize: 11, fontWeight: 700, color: GRAY, letterSpacing: 1.5, margin: 0 },
  input: { width: '100%', padding: '9px 12px', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 10, fontSize: 14, background: '#fff', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '9px 12px', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 10, fontSize: 14, background: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  selectSmall: { padding: '5px 8px', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' },
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: '7px 10px', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 10, background: '#fff', minHeight: 40 },
  tag: { display: 'inline-flex', alignItems: 'center', gap: 4, background: NAVY, color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 },
  tagRemove: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, display: 'flex' },
  tagInput: { border: 'none', outline: 'none', fontSize: 13, flex: 1, minWidth: 100, padding: '3px 0' },
  geoBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: SUCCESS, background: 'rgba(0,255,128,0.1)', padding: '2px 10px', borderRadius: 999 },
  geoWarning: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#F59E0B', background: '#FFF7ED', padding: '2px 10px', borderRadius: 999 },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 100, maxHeight: 200, overflowY: 'auto', marginTop: 4 },
  dropdownItem: { padding: '9px 12px', fontSize: 13, color: NAVY, cursor: 'pointer', borderBottom: `1px solid ${SAND}`, display: 'flex', alignItems: 'flex-start' },
  addBtn: { background: 'none', border: `1.5px dashed ${GRAY_LIGHT}`, borderRadius: 10, padding: '8px 14px', color: GRAY, cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'center' },
  cancelBtn: { padding: '10px 24px', background: '#fff', color: GRAY, border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  saveBtn: { padding: '10px 28px', background: NAVY, color: GOLD, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 8 },
}
