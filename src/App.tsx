import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'

function AppRoutes() {
  const { gerant, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#1B2A4A', color: '#C9A84C', fontSize: 16, fontWeight: 600,
        fontFamily: "'GillSans', sans-serif",
      }}>
        Chargement...
      </div>
    )
  }

  if (!gerant) return <LoginPage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/fiche" element={<div style={{ color: '#8A877F', fontFamily: "'GillSans', sans-serif" }}>Ma fiche — bientot disponible</div>} />
        <Route path="/fiche/:id" element={<div style={{ color: '#8A877F', fontFamily: "'GillSans', sans-serif" }}>Edition de fiche — bientot disponible</div>} />
        <Route path="/stats" element={<div style={{ color: '#8A877F', fontFamily: "'GillSans', sans-serif" }}>Stats — bientot disponible</div>} />
        <Route path="/avis" element={<div style={{ color: '#8A877F', fontFamily: "'GillSans', sans-serif" }}>Avis — bientot disponible</div>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
