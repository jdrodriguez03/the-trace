// Dueño: Julian · Arranque de la web.
// 1) Carga los precios reales del backend. 2) Deja el puente en window.TRACE.
// 3) Abre las pantallas del prototipo aprobado (public/legacy/app.js), que leen de ese puente.
import Chart from 'chart.js/auto'
import './legacy/styles.css'
import { iniciarTrace } from './connect/trace'

declare global {
  interface Window {
    Chart: typeof Chart
    TRACE: Awaited<ReturnType<typeof iniciarTrace>> & { user?: unknown }
  }
}

window.Chart = Chart

async function arrancar() {
  window.TRACE = await iniciarTrace()
  const s = document.createElement('script')
  s.src = '/legacy/app.js?v=' + __BUILD_ID__
  document.body.appendChild(s)
}

arrancar()
