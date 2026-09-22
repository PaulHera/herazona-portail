import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import FicheEditorPage from './pages/FicheEditorPage'
import StatsPage from './pages/StatsPage'
import AvisPage from './pages/AvisPage'
import ClaimPage from './pages/ClaimPage'

function AuthenticatedRoutes() {
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
    <Layout />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Page publique : revendication (pas besoin d'être connecté) */}
        <Route path="/revendiquer" element={<ClaimPage />} />

        {/* Routes authentifiées */}
        <Route element={<AuthenticatedRoutes />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/fiche" element={<FicheEditorPage />} />
          <Route path="/fiche/:id" element={<FicheEditorPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/avis" element={<AvisPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
