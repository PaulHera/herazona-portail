import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'

export default function HomePage() {
  const { gerant, pages } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <div style={s.welcome}>
        <h1 style={s.title}>Bienvenue{gerant?.prenom ? `, ${gerant.prenom}` : ''}</h1>
        <p style={s.subtitle}>
          {pages.length === 0
            ? 'Aucune fiche associee a votre compte.'
            : `${pages.length} fiche${pages.length > 1 ? 's' : ''} associee${pages.length > 1 ? 's' : ''}`
          }
        </p>
      </div>

      <div style={s.grid}>
        {pages.map(page => (
          <div key={page.id} style={s.card} onClick={() => navigate(`/fiche/${page.id}`)}>
            <div style={s.cardHeader}>
              <span style={s.typeBadge}>{(page.type || '').toUpperCase()}</span>
              <span style={{
                ...s.statutBadge,
                background: page.statut === 'active' ? 'rgba(0,255,128,0.1)' : '#F3F2EE',
                color: page.statut === 'active' ? '#059669' : '#8A877F',
              }}>
                {page.statut === 'active' ? 'Active' : 'Masquee'}
              </span>
            </div>
            <h2 style={s.cardTitle}>{page.nom}</h2>
            {page.accroche && <p style={s.cardAccroche}>{page.accroche}</p>}
            {page.ville && (
              <div style={s.cardVille}>
                <MapPin size={12} />
                <span>{page.ville}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  welcome: { marginBottom: 32 },
  title: {
    fontFamily: "'GillSans', sans-serif", fontWeight: 800, fontSize: 26, color: '#1B2A4A',
    margin: '0 0 6px',
  },
  subtitle: {
    fontFamily: "'GillSans', sans-serif", fontSize: 14, color: '#8A877F', margin: 0,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320, 1fr))', gap: 16 },
  card: {
    background: '#fff', borderRadius: 20, padding: 24, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1.5px solid #F0EFE9',
    transition: 'box-shadow 0.15s, transform 0.15s',
  },
  cardHeader: { display: 'flex', gap: 8, marginBottom: 12 },
  typeBadge: {
    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
    background: 'rgba(27,42,74,0.08)', color: '#1B2A4A', letterSpacing: 0.5,
    fontFamily: "'GillSans', sans-serif",
  },
  statutBadge: {
    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
    fontFamily: "'GillSans', sans-serif",
  },
  cardTitle: {
    fontFamily: "'GillSans', sans-serif", fontWeight: 800, fontSize: 18, color: '#1B2A4A',
    margin: '0 0 6px',
  },
  cardAccroche: {
    fontFamily: "'GillSans', sans-serif", fontSize: 13, color: '#8A877F',
    margin: '0 0 10px', lineHeight: '18px',
  },
  cardVille: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontFamily: "'GillSans', sans-serif", fontSize: 12, color: '#78C7CE',
  },
}
