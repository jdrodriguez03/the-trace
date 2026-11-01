// Medición con PostHog: solo 3 eventos y sin datos personales. Dueña: Isabela.
// Ningún evento lleva acciones, montos ni correos: no acepta propiedades.
// Usa la API pública de captura de PostHog con fetch, sin instalar librerías.
//
// Dónde se llama cada evento (los pone Juan Angel en sus archivos):
// - initAnalytics(): una vez, en web/src/main.tsx. Ya registra app_opened.
// - track("portfolio_created"): al terminar el onboarding.
// - track("ai_explanation_opened"): al abrir la explicación con IA de Hoy.

export type TraceEvent = "app_opened" | "portfolio_created" | "ai_explanation_opened";

const ALLOWED: readonly TraceEvent[] = ["app_opened", "portfolio_created", "ai_explanation_opened"];

// La llave de PostHog es pública por diseño (va en la app), por eso puede ser VITE_.
const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";
const ID_KEY = "trace_anon_id";

let started = false;

/** Un número al azar que identifica este navegador, sin datos de la persona. */
function anonymousId(): string {
  try {
    const saved = localStorage.getItem(ID_KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
    return id;
  } catch {
    return "anonimo";
  }
}

/** Arranca la medición y registra app_opened. Se llama una sola vez, al abrir la app. */
export function initAnalytics() {
  if (started) return;
  started = true;
  track("app_opened");
}

/** Registra uno de los 3 eventos permitidos. */
export function track(event: TraceEvent) {
  if (!ALLOWED.includes(event)) return;
  if (import.meta.env.DEV) console.info("[analytics]", event);
  if (!KEY) return;
  const body = JSON.stringify({ api_key: KEY, event, distinct_id: anonymousId() });
  fetch(`${HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Si la medición falla, la app sigue igual.
  });
}
