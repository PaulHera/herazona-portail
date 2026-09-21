import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, formatError } from '../lib/supabase'

interface GerantProfile {
  id: string
  email: string
  prenom: string | null
  nom: string | null
}

interface PageSummary {
  id: string
  type: string
  nom: string
  ville: string | null
  photo_couverture: string | null
  accroche: string | null
  statut: string
}

interface AuthContextType {
  gerant: GerantProfile | null
  pages: PageSummary[]
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [gerant, setGerant] = useState<GerantProfile | null>(null)
  const [pages, setPages] = useState<PageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadGerantProfile() {
    // Vérifier que le compte a un profil gérant (table gerants, PAS utilisateurs)
    const { data: profile, error: profileErr } = await supabase
      .from('gerants')
      .select('id, email, prenom, nom')
      .single()

    if (profileErr || !profile) {
      // Auth valide mais pas de profil gérant → rejeté
      await supabase.auth.signOut()
      setError('Ce compte n\'est pas un compte partenaire. Contactez contact@herazona.com pour obtenir votre accès.')
      setGerant(null)
      setPages([])
      setLoading(false)
      return
    }

    // Charger les fiches liées
    const { data: myPages } = await supabase.rpc('gerant_get_my_pages')

    setGerant(profile)
    setPages(Array.isArray(myPages) ? myPages : [])
    setError(null)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadGerantProfile()
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setGerant(null)
        setPages([])
        setLoading(false)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadGerantProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    setError(null)
    setLoading(true)
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        setError(signInErr.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : formatError(signInErr))
        setLoading(false)
      }
      // onAuthStateChange → loadGerantProfile
    } catch (err) {
      setError(formatError(err))
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setGerant(null)
    setPages([])
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ gerant, pages, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
