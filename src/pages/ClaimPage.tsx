import { useEffect, useState } from 'react'
import { supabase, formatError } from '../lib/supabase'
import { Search, Send, CheckCircle } from 'lucide-react'

const NAVY = '#1B2A4A'
const GOLD = '#C9A84C'
const TEAL = '#78C7CE'
const GRAY = '#8A877F'
const GRAY_LIGHT = '#E8E6E0'
const ERROR = '#FF6B6B'

interface PageResult { id: string; nom: string; ville: string | null; type: string }

export default function ClaimPage() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<PageResult[]>([])
  const [selectedPage, setSelectedPage] = useState<PageResult | null>(null)
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Recherche fiches
  useEffect(() => {
    if (search.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('pages').select('id, nom, ville, type')
        .ilike('nom', `%${search}%`).eq('statut', 'active').limit(8)
      setResults(data || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPage || !email.trim()) return
    setSending(true); setError(null)
    try {
      const { data, error: err } = await supabase.rpc('request_claim', {
        p_page_id: selectedPage.id,
        p_email: email.trim(),
        p_prenom: prenom.trim() || null,
        p_nom: nom.trim() || null,
        p_message: message.trim() || null,
      })
      if (err) throw err
      if (data && !data.success) { setError(data.error); setSending(false); return }
      setSent(true)
    } catch (err) {
      setError(formatError(err))
    }
    setSending(false)
  }

  if (sent) {
    return (
      <div style={s.wrapper}>
        <div style={s.card}>
          <CheckCircle size={48} color={TEAL} style={{ marginBottom: 16 }} />
          <h1 style={s.title}>Demande envoyee</h1>
          <p style={s.text}>Notre equipe va verifier votre demande et vous recontactera sous 24 a 48h a l'adresse <strong>{email}</strong>.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <img src="/logos/logo-horizontal-sand.png" alt="HeraZona" style={{ width: 160, marginBottom: 20 }} />
        <h1 style={s.title}>Revendiquer votre fiche</h1>
        <p style={s.text}>Vous gerez un etablissement reference sur HeraZona ? Demandez l'acces a votre espace partenaire.</p>

        <form onSubmit={handleSubmit} style={s.form}>
          {/* Recherche fiche */}
          <div>
            <label style={s.label}>Votre etablissement *</label>
            {selectedPage ? (
              <div style={s.selectedPage}>
                <div>
                  <span style={{ fontWeight: 700, color: NAVY }}>{selectedPage.nom}</span>
                  {selectedPage.ville && <span style={{ color: GRAY, marginLeft: 6, fontSize: 12 }}>{selectedPage.ville}</span>}
                </div>
                <button type="button" onClick={() => { setSelectedPage(null); setSearch('') }}
                  style={{ background: 'none', border: 'none', color: TEAL, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Changer</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: GRAY }} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher par nom..." style={{ ...s.input, paddingLeft: 36 }} />
                </div>
                {results.length > 0 && (
                  <div style={s.dropdown}>
                    {results.map(r => (
                      <div key={r.id} style={s.dropdownItem} onClick={() => { setSelectedPage(r); setResults([]) }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F5F4F0')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                        <span style={{ fontWeight: 600, color: NAVY }}>{r.nom}</span>
                        {r.ville && <span style={{ fontSize: 12, color: GRAY, marginLeft: 8 }}>{r.ville}</span>}
                        <span style={{ fontSize: 10, color: GRAY, marginLeft: 'auto', textTransform: 'uppercase' }}>{r.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label style={s.label}>Email professionnel *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="contact@votrestudio.com" style={s.input} required />
            <span style={{ fontSize: 11, color: GRAY, marginTop: 4, display: 'block' }}>
              De preference l'email visible sur votre site ou page Instagram
            </span>
          </div>

          {/* Nom / Prénom */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Prenom</label>
              <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Votre prenom" style={s.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Nom</label>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom" style={s.input} />
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={s.label}>Message (optionnel)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Precisez votre role dans l'etablissement..." rows={3} style={s.textarea} />
          </div>

          {error && <div style={{ padding: '10px 14px', background: '#FFF0F0', borderRadius: 10, fontSize: 13, color: ERROR, fontWeight: 600 }}>{error}</div>}

          <button type="submit" disabled={sending || !selectedPage || !email.trim()} style={{
            ...s.btn, opacity: (!selectedPage || !email.trim()) ? 0.5 : 1,
          }}>
            <Send size={14} /> {sending ? 'Envoi...' : 'Envoyer ma demande'}
          </button>

          <p style={{ fontSize: 11, color: GRAY, textAlign: 'center', marginTop: 8 }}>
            Validation sous 24 a 48h — notre equipe verifie chaque demande manuellement.
          </p>
        </form>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1B2A4A 0%, #0D1B33 100%)', padding: 20 },
  card: { background: '#fff', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' },
  title: { fontFamily: "'GillSans', sans-serif", fontWeight: 800, fontSize: 22, color: NAVY, margin: '0 0 8px' },
  text: { fontFamily: "'GillSans', sans-serif", fontSize: 13, color: GRAY, margin: '0 0 24px', lineHeight: '19px' },
  form: { display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 5, letterSpacing: 0.3 },
  input: { width: '100%', padding: '10px 14px', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 12, fontSize: 14, background: '#FAFAF8', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 14px', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 12, fontSize: 14, background: '#FAFAF8', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  selectedPage: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(120,199,206,0.08)', borderRadius: 12, border: `1.5px solid ${TEAL}` },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 100, maxHeight: 240, overflowY: 'auto', marginTop: 4 },
  dropdownItem: { padding: '10px 14px', fontSize: 13, color: NAVY, cursor: 'pointer', borderBottom: '1px solid #F5F4F0', display: 'flex', alignItems: 'center' },
  btn: { padding: '14px 28px', background: NAVY, color: GOLD, border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
}
