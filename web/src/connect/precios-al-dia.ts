// Mantiene los precios de la pantalla al día.
// Las pantallas calculan todo con los precios que reciben al abrir. Si abrieron con los guardados
// (la API tardó) o pasaron 15 minutos, aquí se piden de nuevo. Si hay unos más recientes, se
// guardan y aparece un aviso con «Actualizar», que recarga la página con esos precios.
import { copy } from '../content/copy'
import './precios-al-dia.css'

const CADA_MS = 15 * 60 * 1000 // la API también refresca los precios cada 15 minutos

type ConFecha = { updatedAt: string }

export function vigilarPrecios<M extends ConFecha>(
  enPantalla: M | null,
  fresco: Promise<M>,
  pedirDeNuevo: () => Promise<M>,
) {
  if (!enPantalla) return // modo demo: no hay precios reales que vigilar
  const deLaPantalla = enPantalla.updatedAt
  const revisar = (m: M) => { if (m.updatedAt > deLaPantalla) mostrarAviso() }

  fresco.then(revisar).catch(() => undefined)
  setInterval(() => {
    if (document.visibilityState === 'visible') pedirDeNuevo().then(revisar).catch(() => undefined)
  }, CADA_MS)
}

function mostrarAviso() {
  if (document.getElementById('aviso-precios')) return
  const aviso = document.createElement('div')
  aviso.id = 'aviso-precios'
  aviso.className = 'aviso-precios'
  aviso.setAttribute('role', 'status')

  const texto = document.createElement('span')
  texto.textContent = copy.precios.nuevos

  const boton = document.createElement('button')
  boton.type = 'button'
  boton.textContent = copy.precios.actualizar
  boton.addEventListener('click', () => window.location.reload())

  aviso.append(texto, boton)
  document.body.appendChild(aviso)
}
