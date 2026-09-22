import { useEffect, useState } from 'react'
import { supabase, formatError } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Eye, MousePointer, Star, TrendingUp, Calendar } from 'lucide-react'

const NAVY = '#1B2A4A'
const GOLD = '#C9A84C'
const TEAL = '#78C7CE'
const GRAY = '#8A877F'
const GRAY_LIGHT = '#E8E6E0'

interface Stats {
  vues_total: number
  vues_7j: number
  vues_30j: { jour: string; vues: number }[]
  clics_total: number
  clics_7j: number
  clics_par_type: Record<string, number>
  clics_par_jour: { jour: string; clics: number }[]
  avis_count: number
  avis_moyenne: number | null
  tracking_depuis: string
}

export default function StatsPage() {
  const { pages } = useAuth()
  const [pageId, setPageId] = useState(pages[0]?.id || '')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pageId) return
    setLoading(true)
    supabase.rpc('gerant_get_stats', { p_page_id: pageId })
      .then(({ data, error: err }) => {
        if (err) { setError(formatError(err)); setLoading(false); return }
        setStats(data)
        setError(null)
        setLoading(false)
      })
  }, [pageId])

  if (!pageId) return <div style={{ color: GRAY, padding: 40 }}>Aucune fiche associee.</div>

  const pageName = pages.find(p => p.id === pageId)?.nom || ''

  // Graphique simple : barres 30j (vues + clics combinés)
  const last30 = () => {
    if (!stats) return []
    const days: Record<string, { vues: number; clics: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days[key] = { vues: 0, clics: 0 }
    }
    for (const v of stats.vues_30j) days[v.jour] = { ...days[v.jour], vues: v.vues }
    for (const c of stats.clics_par_jour) if (days[c.jour]) days[c.jour].clics = c.clics
    return Object.entries(days).map(([jour, data]) => ({ jour, ...data }))
  }

  const chartData = last30()
  const maxVal = Math.max(1, ...chartData.map(d => d.vues + d.clics))

  const clicLabels: Record<string, string> = { reservation: 'Reservations', site: 'Site web', instagram: 'Instagram', telephone: 'Telephone' }

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Sélecteur si multi-fiches */}
      {pages.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <select value={pageId} onChange={e => setPageId(e.target.value)} style={s.select}>
            {pages.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
      )}

      <h1 style={s.title}>Statistiques — {pageName}</h1>

      {loading ? (
        <div style={{ color: GRAY, padding: 40 }}>Chargement...</div>
      ) : error ? (
        <div style={{ color: '#FF6B6B', padding: 20 }}>{error}</div>
      ) : stats && (
        <>
          {/* Compteurs */}
          <div style={s.countersGrid}>
            <CounterCard icon={<Eye size={20} color={TEAL} />} value={stats.vues_total} label="Vues totales" sub={`+${stats.vues_7j} cette semaine`} />
            <CounterCard icon={<MousePointer size={20} color={GOLD} />} value={stats.clics_total} label="Clics sortants" sub={`+${stats.clics_7j} cette semaine`} />
            <CounterCard icon={<Star size={20} color={GOLD} />} value={stats.avis_count} label="Avis" sub={stats.avis_moyenne ? `Moyenne ${stats.avis_moyenne}/5` : 'Aucun avis'} />
          </div>

          {/* Clics par type */}
          {stats.clics_total > 0 && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>CLICS PAR TYPE</h2>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {Object.entries(stats.clics_par_type).map(([type, count]) => (
                  <div key={type} style={s.typeCard}>
                    <div style={{ fontWeight: 800, fontSize: 22, color: NAVY }}>{count}</div>
                    <div style={{ fontSize: 12, color: GRAY }}>{clicLabels[type] || type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graphique 30j */}
          <div style={s.section}>
            <h2 style={s.sectionTitle}>ACTIVITE — 30 DERNIERS JOURS</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, padding: '0 4px' }}>
              {chartData.map((d, i) => {
                const vH = (d.vues / maxVal) * 100
                const cH = (d.clics / maxVal) * 100
                const isToday = i === chartData.length - 1
                return (
                  <div key={d.jour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }} title={`${d.jour}\n${d.vues} vues · ${d.clics} clics`}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 100, gap: 1 }}>
                      <div style={{ height: `${vH}%`, minHeight: d.vues > 0 ? 2 : 0, background: TEAL, borderRadius: 2, opacity: 0.7 }} />
                      <div style={{ height: `${cH}%`, minHeight: d.clics > 0 ? 2 : 0, background: GOLD, borderRadius: 2, opacity: 0.7 }} />
                    </div>
                    {(i % 7 === 0 || isToday) && (
                      <span style={{ fontSize: 8, color: GRAY, marginTop: 2 }}>
                        {new Date(d.jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: TEAL, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: TEAL, opacity: 0.7 }} /> Vues</span>
              <span style={{ fontSize: 11, color: GOLD, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: GOLD, opacity: 0.7 }} /> Clics</span>
            </div>
          </div>

          {/* Disclaimer tracking */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#FAFAF8', borderRadius: 12, marginTop: 16 }}>
            <Calendar size={14} color={GRAY} />
            <span style={{ fontSize: 12, color: GRAY }}>
              Statistiques de vues depuis le {new Date(stats.tracking_depuis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}. Les clics sortants sont suivis depuis la creation de la fiche.
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function CounterCard({ icon, value, label, sub }: { icon: React.ReactNode; value: number; label: string; sub: string }) {
  return (
    <div style={s.counterCard}>
      <div style={{ marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 28, color: NAVY, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: TEAL, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  title: { fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 24, fontFamily: "'GillSans', sans-serif" },
  select: { padding: '9px 14px', border: `1.5px solid ${GRAY_LIGHT}`, borderRadius: 10, fontSize: 14, background: '#fff', cursor: 'pointer' },
  countersGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  counterCard: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  section: { background: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: GRAY, letterSpacing: 1.5, margin: '0 0 16px' },
  typeCard: { background: '#FAFAF8', borderRadius: 10, padding: '12px 16px', minWidth: 100 },
}
