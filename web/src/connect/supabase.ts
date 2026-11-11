// Dueño: Julian · La sesión: Supabase guarda el token en el navegador y lo renueva solo.
// Solo usa la clave PÚBLICA (publishable). Nada secreto en variables VITE_ (regla 4).
import { createClient, type Session } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabase = url && key ? createClient(url, key) : null

export type Persona = { email: string | null; isGuest: boolean; id: string }

export function persona(s: Session | null): Persona | null {
  if (!s) return null
  const u = s.user
  return { id: u.id, email: u.email ?? null, isGuest: Boolean(u.is_anonymous) || !u.email }
}

export async function token(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/** Mensajes de Supabase traducidos a frases cortas para la persona. */
export function mensajeDeError(m: string): string {
  const t = m.toLowerCase()
  if (t.includes('invalid login')) return 'El correo o la contraseña no coinciden.'
  if (t.includes('already registered')) return 'Ese correo ya tiene cuenta. Revisa la contraseña.'
  if (t.includes('password should be')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (t.includes('anonymous sign-ins are disabled')) return 'Entrar sin correo no está activo todavía.'
  if (t.includes('rate limit')) return 'Demasiados intentos. Espera un minuto.'
  if (t.includes('email')) return 'Revisa tu correo: parece que le falta algo.'
  return 'No pudimos entrar. Inténtalo de nuevo.'
}
