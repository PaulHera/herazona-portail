import { useEffect, useState } from 'react'
import { supabase, formatError } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { MessageSquare, AlertTriangle, Send, X } from 'lucide-react'

const NAVY = '#1B2A4A'
const GOLD = '#C9A84C'
const TEAL = '#78C7CE'
const GRAY = '#8A877F'
const GRAY_LIGHT = '#E8E6E0'
const ERROR = '#FF6B6B'

interface Avis {
  id: string
  note: number
  commentaire: string | null
  created_at: string
  pseudo: string
  reponse_gerant: string | null
  reponse_gerant_at: string | null
  nb_signalements: number
}

export default function AvisPage() {
  const { pages } = useAuth()
  const [pageId, setPageId] = useState(pages[0]?.id || '')
  const [avis, setAvis] = useState<Avis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reply state
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)

  const loadAvis = async () => {
    if (!pageId) return
    setLoading(true)
    const { data, error: err } = await supabase.rpc('gerant_list_avis', { p_page_id: pageId })
    if (err) { setError(formatError(err)); setLoading(false); return }
    setAvis(data || [])
    setError(null)
    setLoading(false)
  }

  useEffect(() => { loadAvis() }, [pageId])

  const handleReply = async (avisId: string) => {
    if (!replyText.trim()) return
    setSaving(true); setError(null)
    try {
      const { error: err } = await supabase.rpc('gerant_reply_avis', { p_avis_id: avisId, p_reponse: replyText.trim() })
      if (err) throw err
      setReplyingId(null); setReplyText('')
      await loadAvis()
    } catch (err) {
      setError(formatError(err))
    }
    setSaving(false)
  }

  const handleSignaler = async (avisId: string) => {
    if (!confirm('Signaler cet avis a l\'equipe HeraZona ?')) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('page_avis_signalements').insert({ avis_id: avisId, user_id: user.id })
      alert('Signalement envoye. Notre equipe va l\'examiner.')
    } catch {}
  }

  const startReply = (a: Avis) => {
    setReplyingId(a.id)
    setReplyText(a.reponse_gerant || '')
  }

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

  const pageName = pages.find(p => p.id === pageId)?.nom || ''
  const moyenne = avis.length > 0 ? (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1) : null

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Sélecteur si multi-fiches */}
      {pages.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <select value={pageId} onChange={e => setPageId(e.target.value)}
            style={{ padding: '9px 14px', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 10, fontSize: 14, background: '#fff', cursor: 'pointer' }}>
            {pages.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>Avis — {pageName}</h1>
        {moyenne && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: GOLD, fontSize: 14, letterSpacing: -1 }}>{stars(Math.round(parseFloat(moyenne)))}</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{moyenne}/5</span>
            <span style={{ fontSize: 12, color: GRAY }}>({avis.length} avis)</span>
          </div>
        )}
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#FFF0F0', borderRadius: 10, fontSize: 13, color: ERROR, fontWeight: 600, marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ color: GRAY, padding: 40 }}>Chargement...</div>
      ) : avis.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', color: GRAY }}>
          Aucun avis pour le moment
        </div>
      ) : (
        avis.map(a => (
          <div key={a.id} style={s.card}>
            {/* Header */}
            <div style={s.cardHeader}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{a.pseudo}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{ color: GOLD, fontSize: 12, letterSpacing: -1 }}>{stars(a.note)}</span>
                  <span style={{ fontSize: 11, color: GRAY }}>
                    {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <button onClick={() => handleSignaler(a.id)} title="Signaler" style={{ background: 'none', border: 'none', color: GRAY, cursor: 'pointer', padding: 4 }}>
                <AlertTriangle size={14} />
              </button>
            </div>

            {/* Commentaire */}
            {a.commentaire && <p style={s.commentaire}>{a.commentaire}</p>}

            {/* Réponse existante */}
            {a.reponse_gerant && replyingId !== a.id && (
              <div style={s.reponseBlock}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 4 }}>Reponse de l'etablissement</div>
                <p style={{ margin: 0, fontSize: 13, color: NAVY, lineHeight: '18px' }}>{a.reponse_gerant}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: GRAY }}>{a.reponse_gerant_at && new Date(a.reponse_gerant_at).toLocaleDateString('fr-FR')}</span>
                  <button onClick={() => startReply(a)} style={{ background: 'none', border: 'none', color: TEAL, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Modifier</button>
                </div>
              </div>
            )}

            {/* Formulaire de réponse */}
            {replyingId === a.id ? (
              <div style={s.replyForm}>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value.slice(0, 500))}
                  placeholder="Votre reponse (500 car. max)..." rows={3} style={s.replyTextarea} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: GRAY }}>{replyText.length}/500</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setReplyingId(null); setReplyText('') }} style={s.cancelBtn}><X size={12} /> Annuler</button>
                    <button onClick={() => handleReply(a.id)} disabled={saving || !replyText.trim()} style={s.sendBtn}>
                      <Send size={12} /> {saving ? '...' : 'Publier'}
                    </button>
                  </div>
                </div>
              </div>
            ) : !a.reponse_gerant && (
              <button onClick={() => startReply(a)} style={s.replyBtn}>
                <MessageSquare size={14} /> Repondre
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { background: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  commentaire: { margin: '12px 0 0', fontSize: 13, color: NAVY, lineHeight: '19px' },
  reponseBlock: { marginTop: 12, padding: 12, background: '#FAFAF8', borderRadius: 10, borderLeft: `3px solid ${GOLD}` },
  replyForm: { marginTop: 12 },
  replyTextarea: { width: '100%', padding: '9px 12px', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 10, fontSize: 13, resize: 'vertical' as const, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 8 },
  replyBtn: { marginTop: 8, background: 'none', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 10, padding: '8px 14px', color: TEAL, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  cancelBtn: { padding: '6px 12px', background: '#fff', color: GRAY, border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  sendBtn: { padding: '6px 14px', background: NAVY, color: GOLD, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
}
