import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signIn, error, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    signIn(email.trim(), password)
  }

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <img src="/logos/logo-horizontal-sand.png" alt="HeraZona" style={s.logo} />
        <h1 style={s.title}>Espace Partenaires</h1>
        <p style={s.subtitle}>Gerez votre presence sur HeraZona</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div>
            <label style={s.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com" style={s.input} autoFocus />
          </div>
          <div>
            <label style={s.label}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" style={s.input} />
          </div>

          {error && <div style={s.error}>{error}</div>}

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={s.footer}>
          Vous n'avez pas encore d'acces ?{' '}
          <a href="mailto:contact@herazona.com" style={s.link}>Contactez-nous</a>
        </p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #1B2A4A 0%, #0D1B33 100%)',
    padding: 20,
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '48px 40px', width: '100%', maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center',
  },
  logo: { width: 180, marginBottom: 24 },
  title: {
    fontFamily: "'GillSans', sans-serif", fontWeight: 800, fontSize: 22, color: '#1B2A4A',
    margin: '0 0 6px',
  },
  subtitle: {
    fontFamily: "'GillSans', sans-serif", fontSize: 14, color: '#8A877F',
    margin: '0 0 32px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' },
  label: {
    display: 'block', fontFamily: "'GillSans', sans-serif", fontSize: 12, fontWeight: 700,
    color: '#1B2A4A', marginBottom: 5, letterSpacing: 0.3,
  },
  input: {
    width: '100%', padding: '12px 14px', border: '1.5px solid #E8E6E0', borderRadius: 12,
    fontSize: 14, fontFamily: "'GillSans', sans-serif", background: '#FAFAF8',
    outline: 'none', boxSizing: 'border-box',
  },
  error: {
    padding: '10px 14px', background: '#FFF0F0', borderRadius: 10,
    fontSize: 13, color: '#FF6B6B', fontFamily: "'GillSans', sans-serif", fontWeight: 600,
  },
  btn: {
    padding: '14px 28px', background: '#1B2A4A', color: '#00FF80', border: 'none',
    borderRadius: 14, fontSize: 15, fontWeight: 700, fontFamily: "'GillSans', sans-serif",
    cursor: 'pointer', letterSpacing: 0.5, marginTop: 8,
  },
  footer: {
    fontFamily: "'GillSans', sans-serif", fontSize: 12, color: '#8A877F', marginTop: 24,
  },
  link: { color: '#C9A84C', textDecoration: 'none', fontWeight: 700 },
}
