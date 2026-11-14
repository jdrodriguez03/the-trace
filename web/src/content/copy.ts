// Todos los textos de la interfaz, copiados del prototipo (the-trace-mvp7.html).
// Regla 5: ninguna pantalla escribe textos a mano; los toma de aquí.
// Dueña: Isabela.

export const copy = {
  brand: "The Trace",

  precios: {
    nuevos: "Hay precios más recientes.",
    actualizar: "Actualizar",
  },

  practice: {
    tag: "De práctica · sin dinero real",
    stripStrong: "Modo práctica:",
    // En el prototipo decía «Los precios y movimientos son de ejemplo».
    // En el MVP los precios son reales, con unos 15 min de retraso.
    stripText: "sin dinero real. Los precios pueden tener unos 15 min de retraso.",
  },

  login: {
    artTitle: "Cada día, la explicación de lo que movió tus acciones.",
    artLede:
      "Arma un portafolio de práctica con empresas colombianas y entiende, en palabras simples, por qué subió o bajó.",
    previewTitle: "Ejemplo de resumen diario",
    previewTag: "Práctica",
    previewSentence: "Hoy tu portafolio subió 0,6 %, unos $28.400 más",
    title: "Entiende qué mueve tus acciones.",
    subtitle:
      "Practica con acciones de Colombia y recibe una explicación clara de lo que pasó cada día.",
    emailLabel: "Tu correo (opcional)",
    emailPlaceholder: "tucorreo@correo.com",
    enter: "Entrar y practicar",
    guest: "Probar sin correo",
    // El prototipo decía «se guarda solo en este navegador». En el MVP se
    // guarda en el servidor. Por confirmar con Julian.
    note: "Practica con acciones de Colombia, sin dinero real. Tu portafolio de práctica queda guardado en tu cuenta.",
    trust: [
      "Sin dinero real: es un portafolio de práctica.",
      "Explicaciones en palabras simples, sin jerga.",
      "No te decimos qué comprar ni vender.",
    ],
    magicLinkSent: "Te enviamos un enlace a tu correo para entrar.",
  },

  onboarding: {
    // El prototipo decía «de 3» por error: son 2 pasos.
    stepLabel: (step: number) => `Paso ${step} de 2`,
    steps: ["Acciones", "Monto"],
    step1Title: "Elige las acciones con las que quieres practicar",
    step1Text:
      "Una acción es una parte de una empresa. Tu portafolio de práctica es el conjunto de acciones que eliges, sin dinero real.",
    countNone: "Puedes elegir de 1 a 5. Se sugieren 3.",
    countSome: (n: number) => `Elegiste ${n} de 5. Se sugieren 3.`,
    maxReached: "Puedes elegir hasta 5 acciones",
    todaySuffix: "hoy",
    nextNone: "Elige al menos 1 acción",
    nextSome: (n: number) => `Seguir con ${n} ${n === 1 ? "acción" : "acciones"}`,
    useExample: "Usar un portafolio de ejemplo",
    back: "Volver",
    step2Title: "¿Con cuánto quieres practicar?",
    step2Text: (n: number) =>
      `Es un monto de práctica, no dinero real. Se reparte en partes iguales entre tus ${n} ${n === 1 ? "acción" : "acciones"}.`,
    quickAmounts: [1_000_000, 5_000_000, 10_000_000],
    amountLabel: "O escribe otro monto en pesos",
    // Recibe el monto ya formateado, por ejemplo «$1.666.667».
    split: (amountPerAsset: string) => `Serían ${amountPerAsset} en cada acción.`,
    amountInvalid: "Escribe un monto mayor a $0.",
    create: "Crear mi portafolio de práctica",
  },

  nav: {
    today: "Hoy",
    portfolio: "Mi portafolio",
    chat: "Pregúntale a la IA",
    more: "Más",
    extras: "Funcionalidades extra",
    insights: { label: "Lectura de tu portafolio", hint: "De qué depende tu dinero" },
    news: { label: "Noticias que te afectan", hint: "Lo que pasó con tus acciones" },
    market: { label: "Mercado colombiano", hint: "Qué subió y qué bajó hoy" },
    close: "Cerrar",
    account: "Mi cuenta",
  },

  welcome: {
    text: "Este es tu portafolio de práctica. Aquí encuentras cada día una explicación de lo que ocurrió.",
    ok: "Entendido",
  },

  empty: {
    portfolioTitle: "Tu portafolio está vacío",
    portfolioText: "Agrega una acción para empezar a practicar.",
    todayTitle: "Tu portafolio está vacío",
    todayText: "Agrega una acción de práctica y aquí te explicamos qué pasó con ella.",
    addAsset: "Agregar acción",
    newsTitle: "Sin noticias por ahora",
    newsText: "Busca noticias de hoy para ver qué pasó con tus acciones.",
    newsFilterTitle: "No hay noticias con este filtro",
    newsFilterText: "Prueba otro filtro o busca noticias de hoy.",
    generic: "Aún no hay información para mostrar.",
  },

  // Textos de los componentes propios (web/src/components/trace/).
  direction: {
    up: "Subió",
    down: "Bajó",
    flat: "Igual",
  },
  weight: {
    label: "Qué parte de tu dinero",
    lessThanOne: "Menos de 1",
  },
  sectorLegend: {
    all: "Todos",
    ofYourMoney: "de tu dinero",
  },

  // Etiquetas y textos de las noticias (NewsCard, Hoy y Noticias).
  news: {
    direction: { Positivo: "Buena noticia", Negativo: "Mala noticia", Neutro: "Neutra" },
    impact: { Alta: "Impacto grande", Media: "Impacto mediano", Baja: "Impacto pequeño" },
    notAdvice: "No es una recomendación.",
    defaultSource: "Resumen de mercado",
    moreToggle: "Por qué te afecta y qué conviene mirar",
    whyItAffects: "Por qué te afecta",
    whatToWatch: "Qué conviene mirar",
    yourMoney: "Qué parte de tu dinero",
    seeAsset: "Ver acción",
    aiNote: "La IA explica lo ocurrido y cómo se relaciona con tus acciones.",
  },

  // Gráfica de precio (PriceChart).
  priceChart: {
    ranges: { "1m": "1M", "3m": "3M", "1y": "1A" },
    rangeLabels: { "1m": "Último mes", "3m": "Últimos 3 meses", "1y": "Último año" },
    priceLabel: "Precio",
    empty: "Aún no hay precios para mostrar.",
  },

  // Hora del último precio (PriceFreshness).
  freshness: {
    justNow: "Actualizado hace un momento",
    minutesAgo: (min: number) => `Actualizado hace ${min} min`,
    hoursAgo: (h: number) => `Actualizado hace ${h} ${h === 1 ? "hora" : "horas"}`,
    delay: "puede tener unos 15 min de retraso",
    // Recibe la fecha ya escrita, por ejemplo «23 de octubre».
    closed: (date: string) => `Precio de cierre del ${date}`,
  },

  market: {
    title: "Mercado colombiano",
    subtitle: "Consulta las acciones colombianas y toca una para ver más información.",
    count: (n: number) => `${n} acciones`,
    countSuffix: "para practicar",
    moversTitle: "Qué subió y qué bajó",
    moversSubtitle: "Acciones colombianas que puedes practicar, de mayor a menor movimiento.",
    heatTitle: "Vista rápida",
    heatSubtitle: "Cambios de hoy. Entre más intenso el color, más se movió.",
    seeAsset: (name: string) => `Ver ${name}`,
  },

  account: {
    menuLabel: "Mi cuenta",
    guest: "Invitado",
    guestSub: "Sin correo, portafolio de práctica",
    userSub: "Portafolio de práctica",
    portfolio: "Mi portafolio",
    plan: "Plan Trace+",
    reset: "Empezar de nuevo",
    logout: "Cerrar sesión",
    resetTitle: "¿Empezar de nuevo?",
    resetText: "Se borrará tu portafolio de práctica y podrás elegir tus acciones otra vez.",
    resetConfirm: "Sí, empezar de nuevo",
    resetCancel: "Cancelar",
    resetDone: "Listo: tu portafolio de práctica quedó vacío",
    resetError: "No pudimos borrar tu portafolio. Inténtalo de nuevo.",
    logoutError: "No pudimos cerrar tu sesión. Inténtalo de nuevo.",
  },

  ads: {
    label: "Publicidad",
    remove: "Quitar anuncios",
    note: "Los anuncios no usan tu portafolio.",
    // Anuncios ficticios del prototipo. Rotan según el día.
    items: [
      {
        brand: "Panadería Hornilla Dorada",
        line: "Pan recién horneado y almojábanas calientes, todas las mañanas.",
        initials: "PH",
        color: "#F1D9A8",
      },
      {
        brand: "Cuadernos Mariposa Verde",
        line: "Cuadernos de papel reciclado para tus apuntes, listas y dibujos.",
        initials: "CM",
        color: "#BFE0CB",
      },
      {
        brand: "Bicicletas Cóndor Azul",
        line: "Alquiler de bicicletas por horas para recorrer la ciudad el fin de semana.",
        initials: "BC",
        color: "#C3D5F0",
      },
    ],
  },

  plan: {
    title: "Trace+",
    text: "Trace+ es un plan de pago que llegará más adelante. Hoy no se cobra nada.",
    benefits: [
      "Sin anuncios en toda la app.",
      "Alertas cuando pase algo importante con tus acciones.",
      "Más explicaciones con IA cada día.",
      "Más adelante: tu portafolio real, o sea, las acciones que tienes de verdad.",
    ],
    notify: "Avísame cuando esté listo",
    later: "Ahora no",
    notified: "Listo: te avisaremos cuando Trace+ esté disponible",
    notifyError: "No pudimos guardar tu aviso. Inténtalo de nuevo.",
    stripTitle: "Trace+",
    stripText: "Quita los anuncios y recibe alertas.",
  },

  radar: {
    title: "Noticias que te afectan",
    subtitle: "Lo que ocurrió con las acciones de tu portafolio y por qué te afecta.",
    filtersLabel: "Filtrar noticias",
    impactLabel: "Impacto",
    typeLabel: "Tipo",
    all: "Todas",
    reset: "Restablecer filtros",
    listTitle: "Noticias para ti",
    count: (n: number) =>
      n ? `${n} ${n === 1 ? "noticia" : "noticias"}, primero las que más te afectan` : "Sin noticias con este filtro",
    loading: "Buscando las noticias de tus acciones…",
    error: "No pudimos cargar las noticias. Inténtalo de nuevo.",
    retry: "Reintentar",
  },

  // Textos de error de la IA (Hoy, chat y Lectura).
  aiErrors: {
    failed: "La IA no pudo responder ahora. Te mostramos la explicación sin IA.",
    timeout: "La IA se demoró demasiado. Te mostramos la explicación sin IA.",
    quota: "Ya usaste tus 5 explicaciones con IA de hoy. Mañana tienes 5 más. Mientras tanto, te mostramos la explicación sin IA.",
    retry: "Intentar de nuevo",
  },

  // Errores generales.
  errors: {
    generic: "Algo salió mal. Inténtalo de nuevo.",
    offline: "No hay conexión. Revisa tu internet e inténtalo de nuevo.",
    retry: "Reintentar",
  },
} as const;
