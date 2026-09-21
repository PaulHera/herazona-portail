import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, FileText, BarChart2, MessageSquare, LogOut } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/fiche', icon: FileText, label: 'Ma fiche' },
  { to: '/stats', icon: BarChart2, label: 'Stats' },
  { to: '/avis', icon: MessageSquare, label: 'Avis' },
]

export default function Layout() {
  const { gerant, signOut } = useAuth()

  return (
    <div style={s.wrapper}>
      <aside style={s.sidebar}>
        <div style={s.logoBlock}>
          <img src="/logos/logo-horizontal-sand.png" alt="HeraZona" style={s.logo} />
        </div>
        <div style={s.badge}>
          <p style={s.badgeText}>PARTENAIRE</p>
        </div>

        <nav style={s.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                ...s.navLink,
                ...(isActive ? s.navLinkActive : {}),
              })}
            >
              <item.icon size={18} style={{ flexShrink: 0 }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={s.userBlock}>
          <div style={s.userName}>{gerant?.prenom || 'Partenaire'} {gerant?.nom || ''}</div>
          <div style={s.userEmail}>{gerant?.email}</div>
          <button style={s.logoutBtn} onClick={signOut}>
            <LogOut size={12} /> Se deconnecter
          </button>
        </div>
      </aside>

      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 260, minWidth: 260, background: '#1B2A4A',
    display: 'flex', flexDirection: 'column', padding: '28px 0',
    position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10, overflowY: 'auto',
  },
  logoBlock: { padding: '0 28px', marginBottom: 8 },
  logo: { width: 160, height: 'auto', display: 'block' },
  badge: { padding: '0 30px', marginBottom: 36 },
  badgeText: {
    fontFamily: "'GillSans', sans-serif", fontWeight: 700, fontSize: 11,
    letterSpacing: 5, color: '#C9A84C', margin: 0,
  },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 28px',
    color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 14,
    fontFamily: "'GillSans', sans-serif", fontWeight: 600,
    borderLeft: '3px solid transparent', transition: 'all 0.2s ease',
  },
  navLinkActive: {
    color: '#C9A84C', background: 'rgba(201,168,76,0.08)', borderLeftColor: '#C9A84C',
  },
  userBlock: {
    margin: '0 20px', padding: '16px', borderRadius: 14,
    background: 'rgba(255,255,255,0.05)',
  },
  userName: {
    color: '#fff', fontSize: 14, fontFamily: "'GillSans', sans-serif",
    fontWeight: 700, marginBottom: 2,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: "'GillSans', sans-serif",
    marginBottom: 10,
  },
  logoutBtn: {
    background: 'none', border: 'none', color: '#C9A84C', fontSize: 12,
    fontFamily: "'GillSans', sans-serif", cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  main: {
    marginLeft: 260, flex: 1, background: '#F5F4F0', padding: '32px 40px', minHeight: '100vh',
  },
}
