import { createClient, AuthError } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)

// Intercepteur global : transforme les erreurs Supabase en messages lisibles
export function formatError(err: unknown): string {
  if (!err) return 'Erreur inconnue'
  if (err instanceof AuthError) return err.message
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>
    if (typeof e.message === 'string') return e.message
    if (typeof e.error === 'string') return e.error
    if (typeof e.msg === 'string') return e.msg
  }
  if (typeof err === 'string') return err
  return 'Erreur inconnue'
}
