// Dueño: Julian · Las llamadas a la API de The Trace, con el token de la sesión.
import { token } from './supabase'

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  code: string | null
  constructor(status: number, detail: string, code: string | null = null) {
    super(detail)
    this.status = status
    this.code = code
  }
}

type Opciones = { method?: string; body?: unknown; publica?: boolean; timeoutMs?: number }

export async function api<T>(ruta: string, o: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (!o.publica) {
    const t = await token()
    if (t) headers.Authorization = `Bearer ${t}`
  }
  if (o.body !== undefined) headers['Content-Type'] = 'application/json'
  const ctrl = new AbortController()
  const reloj = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 20000)
  try {
    const r = await fetch(BASE + ruta, {
      method: o.method ?? 'GET',
      headers,
      body: o.body === undefined ? undefined : JSON.stringify(o.body),
      signal: ctrl.signal,
    })
    if (r.status === 204) return undefined as T
    const datos = await r.json().catch(() => ({}))
    if (!r.ok) {
      const d = datos?.detail
      // El detalle llega como texto, como lista (errores de validación) o como {code, message}.
      if (d && typeof d === 'object' && !Array.isArray(d) && d.message) throw new ApiError(r.status, d.message, d.code ?? null)
      const texto = typeof d === 'string' ? d : Array.isArray(d) ? (d[0]?.msg ?? 'Revisa los datos.') : 'Algo salió mal. Inténtalo de nuevo.'
      throw new ApiError(r.status, texto)
    }
    return datos as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(0, 'No hay conexión con The Trace. Revisa tu internet.')
  } finally {
    clearTimeout(reloj)
  }
}
