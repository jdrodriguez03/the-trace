// Dueño: Julian · El puente entre las pantallas (public/legacy/app.js) y el backend.
// Las pantallas son el prototipo aprobado tal cual. Este archivo les entrega los datos reales
// en `window.TRACE` y guarda en el servidor cada compra, venta o borrado.
import { api, ApiError } from './api'
import { mensajeDeError, persona, supabase, type Persona } from './supabase'

type Num = number
type Cuota = { used: Record<string, number>; limit: number }
type Asset = { ticker: string; name: string; sector: string; price: Num; change_pct: Num; updated_at: string; drivers?: string | null }
type Colcap = { points: Num; change_pct: Num; day: string; updated_at: string; proxy: boolean }
type Punto = { day: string; price: Num }
type Tx = { id: number; ticker: string; kind: 'buy' | 'sell'; quantity: Num; price: Num; day: string; created_at: string }
type Noticia = {
  id: number; ticker: string; asset_name: string; direction: string; magnitude: string; title: string
  summary: string; why: string; watch: string; source: string; url: string | null; day: string; weight_pct: Num
}

export type Mercado = { assets: Asset[]; colcap: Colcap | null; history: Record<string, Punto[]>; updatedAt: string }

const num = (x: unknown) => Number(x) || 0

async function cargarMercado(): Promise<Mercado> {
  const [assets, colcap, history] = await Promise.all([
    api<Asset[]>('/v1/market/assets', { publica: true, timeoutMs: 60000 }),
    api<Colcap>('/v1/market/colcap', { publica: true, timeoutMs: 60000 }).catch(() => null),
    api<Record<string, Punto[]>>('/v1/market/history?range=1y', { publica: true, timeoutMs: 60000 }),
  ])
  const updatedAt = assets.reduce((m, a) => (a.updated_at > m ? a.updated_at : m), '')
  return {
    assets: assets.map((a) => ({ ...a, price: num(a.price), change_pct: num(a.change_pct) })),
    colcap: colcap && { ...colcap, points: num(colcap.points), change_pct: num(colcap.change_pct) },
    history: Object.fromEntries(Object.entries(history).map(([t, s]) => [t, s.map((p) => ({ day: p.day, price: num(p.price) }))])),
    updatedAt: updatedAt || new Date().toISOString(),
  }
}

// ---- Cola de cambios: se guardan en el servidor en el mismo orden en que la persona los hace ----
let cola: Promise<unknown> = Promise.resolve()
function enCola(tarea: () => Promise<unknown>) {
  cola = cola.then(tarea).catch((e) => {
    const detalle = e instanceof ApiError ? e.message : 'No pudimos guardar el cambio.'
    window.dispatchEvent(new CustomEvent('trace:error', { detail: detalle }))
  })
  return cola
}

const txNum = (t: Tx): Tx => ({ ...t, quantity: num(t.quantity), price: num(t.price) })

type DatosPersona = { tx: Tx[]; news: Noticia[]; quota: Cuota | null }

async function cargarPersonaDelServidor(): Promise<DatosPersona> {
  const me = await api<{ ai_quota?: Cuota | null }>('/v1/me') // crea la fila del usuario la primera vez
  const [tx, news] = await Promise.all([
    api<Tx[]>('/v1/portfolio/transactions'),
    api<Noticia[]>('/v1/news?mine=false').catch(() => []),
  ])
  return { tx: tx.map(txNum), news, quota: me.ai_quota ?? null }
}

export function crearTrace(mercado: Mercado | null, precarga: Promise<DatosPersona> | null = null) {
  let yo: Persona | null = null
  return {
    mode: mercado ? 'live' : 'demo',
    market: mercado,
    get persona() { return yo },

    auth: {
      async actual(): Promise<Persona | null> {
        if (!supabase) return null
        const { data } = await supabase.auth.getSession()
        yo = persona(data.session)
        return yo
      },
      /** Entra con correo y contraseña; si el correo no tiene cuenta, la crea. */
      async conCorreo(email: string, clave: string): Promise<Persona> {
        if (!supabase) throw new Error('El inicio de sesión no está configurado.')
        const entrar = await supabase.auth.signInWithPassword({ email, password: clave })
        if (!entrar.error) return (yo = persona(entrar.data.session)!)
        if (!entrar.error.message.toLowerCase().includes('invalid login')) throw new Error(mensajeDeError(entrar.error.message))
        const crear = await supabase.auth.signUp({ email, password: clave })
        if (crear.error) {
          // Ya existe: entonces la contraseña era la que no coincidía.
          const m = crear.error.message.toLowerCase().includes('already') ? 'invalid login' : crear.error.message
          throw new Error(mensajeDeError(m))
        }
        if (!crear.data.session) throw new Error('Revisa tu correo para confirmar la cuenta.')
        return (yo = persona(crear.data.session)!)
      },
      async invitado(): Promise<Persona> {
        if (!supabase) throw new Error('El inicio de sesión no está configurado.')
        const r = await supabase.auth.signInAnonymously()
        if (r.error) throw new Error(mensajeDeError(r.error.message))
        return (yo = persona(r.data.session)!)
      },
      async salir() {
        await cola
        yo = null
        await supabase?.auth.signOut()
      },
    },

    /** Lo de la persona: movimientos, noticias y cuota de IA. La primera vez usa lo que se pidió en paralelo con los precios. */
    async cargarPersona(): Promise<DatosPersona> {
      if (precarga) {
        const p = precarga
        precarga = null
        try { return await p } catch { /* se pide de nuevo abajo */ }
      }
      return cargarPersonaDelServidor()
    },

    /** Trace AI. El servidor arma el contexto con el portafolio: la web solo manda la pregunta. */
    ia(tipo: 'today' | 'portfolio' | 'chat' | 'explain', pregunta?: string, historial: { q: string; a: string }[] = []) {
      return api<{ text: string; source: 'ia' | 'cache' | 'respaldo'; remaining: number }>(`/v1/ai/${tipo}`, {
        method: 'POST',
        body: { question: pregunta || null, history: historial.map((h) => ({ question: h.q, answer: h.a })) },
        timeoutMs: 40000,
      })
    },

    sync: {
      /** Guarda una compra o venta. Al responder, el movimiento queda con el id del servidor. */
      agregar(mov: Tx) {
        return enCola(async () => {
          const r = await api<Tx>('/v1/portfolio/transactions', {
            method: 'POST',
            body: { ticker: mov.ticker, kind: mov.kind, quantity: mov.quantity, price: mov.price, day: mov.day },
          })
          mov.id = r.id
          mov.quantity = num(r.quantity)
          mov.price = num(r.price)
        })
      },
      /** Borra un movimiento. Lee el id al momento de enviar: así sirve aunque recién se haya creado. */
      borrar(mov: Tx) {
        return enCola(() => api(`/v1/portfolio/transactions/${mov.id}`, { method: 'DELETE' }))
      },
      reiniciar() {
        return enCola(() => api('/v1/portfolio/reset', { method: 'POST' }))
      },
      listaDeEspera() {
        return enCola(() => api('/v1/waitlist/trace-plus', { method: 'POST' }))
      },
      /** Espera a que todo lo pendiente quede guardado. */
      listo() { return cola },
    },
  }
}

const CACHE_MERCADO = 'trace_mercado_v1'
const ESPERA_MAXIMA_MS = 2500 // si la API tarda más, se abre con los precios guardados

function mercadoGuardado(): Mercado | null {
  try {
    const g = JSON.parse(localStorage.getItem(CACHE_MERCADO) || 'null')
    return g && Array.isArray(g.assets) && g.assets.length ? (g as Mercado) : null
  } catch { return null }
}

function guardarMercado(m: Mercado) {
  try { localStorage.setItem(CACHE_MERCADO, JSON.stringify(m)) } catch { /* sin espacio: no pasa nada */ }
}

/** Arranque rápido:
 *  1) Pide los precios y, si ya hay sesión, el portafolio, al mismo tiempo.
 *  2) Si los precios tardan más de 2,5 s y hay unos guardados de la visita anterior, abre con esos.
 *     Los nuevos quedan guardados para la próxima vez. */
export async function iniciarTrace() {
  const demo = import.meta.env.VITE_USE_MOCKS === 'true'
  if (demo) return crearTrace(null)

  const sesion = supabase ? (await supabase.auth.getSession()).data.session : null
  const precarga = sesion ? cargarPersonaDelServidor() : null
  precarga?.catch(() => undefined) // si falla, cargarPersona lo vuelve a pedir

  const fresco = cargarMercado().then((m) => { guardarMercado(m); return m })
  const guardado = mercadoGuardado()
  let mercado: Mercado | null
  try {
    mercado = guardado
      ? await Promise.race([fresco, new Promise<Mercado>((ok) => setTimeout(() => ok(guardado), ESPERA_MAXIMA_MS))])
      : await fresco
  } catch (e) {
    console.error('No se pudo cargar el mercado.', e)
    mercado = guardado // sin conexión: los últimos precios guardados; si no hay, modo demo
  }
  fresco.catch(() => undefined)
  return crearTrace(mercado, precarga)
}
