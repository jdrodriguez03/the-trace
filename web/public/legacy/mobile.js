/* Dueño: Julian · Versión de celular de The Trace.
   No adapta la de PC: dibuja Hoy, Portafolio, Noticias y Mercado con un diseño propio para el
   teléfono (listas compactas, pestañas, hojas que suben desde abajo). Usa los mismos datos y
   funciones de app.js; el PC no cambia. Se activa con la clase html.mob (ancho de 760 px o menos).
   Se carga después de app.js (ver src/main.tsx). */
(() => {
  const MQ = matchMedia('(max-width:760px)')
  const on = () => MQ.matches
  const H = s => escapeHTML(String(s ?? ''))
  const K = c => chgKey(Number(c) || 0)
  const ST = { pf: 'acciones', mine: true, imp: null, dir: null, mk: 'all' }

  /* ---------- piezas comunes ---------- */
  const pill = c => `<span class="m-pill ${K(c)}">${dirArrow(K(c))} ${t4pct(c)} %</span>`
  const head = (t, sub) => `<header class="m-head"><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</header>`
  const sec = (t, extra = '') => `<div class="m-sec"><h2>${t}</h2>${extra}</div>`
  const empty = (t, p, btn) => `<div class="m-empty"><h2>${t}</h2><p>${p}</p>${btn || ''}</div>`
  const buyBtn = '<button class="m-btn m-btn-pri" type="button" onclick="openTradeModal(\'buy\')">Comprar</button>'
  const verbo = c => (c > 0 ? 'subió' : c < 0 ? 'bajó' : 'casi no cambió')
  const tag = d => {
    const k = d === 'Positivo' ? 'up' : d === 'Negativo' ? 'down' : 'flat'
    return `<span class="m-tag ${k}">${d === 'Positivo' ? 'Buena noticia' : d === 'Negativo' ? 'Mala noticia' : 'Neutra'}</span>`
  }
  const thumb = (n, w, eager) => {
    const ph = photoFor(n)
    return ph ? `<img src="${H(photoUrl(ph, w))}" alt=""${eager ? '' : ' loading="lazy"'} decoding="async" onerror="this.remove()">` : ''
  }
  const ia = '<svg class="m-ia" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>'

  function mount(view) {
    let el = document.getElementById('m-' + view)
    if (!el) {
      const s = document.getElementById('view-' + view)
      if (!s) return null
      s.insertAdjacentHTML('afterbegin', `<div class="m-view" id="m-${view}"></div>`)
      el = document.getElementById('m-' + view)
    }
    return el
  }

  /* Pregunta a Trace AI desde cualquier pantalla: abre el chat con la pregunta escrita. */
  window.mAsk = q => {
    mCloseSheet()
    switchView('chat')
    const i = document.getElementById('chatInput')
    if (i) { i.value = q; sendChat() }
  }

  /* ---------- HOY ---------- */
  function today() {
    const el = mount('today')
    if (!PORTFOLIO.length) {
      el.innerHTML = head('Hoy') + empty('Aún no tienes acciones', 'Compra tu primera acción de práctica y aquí verás qué pasó con ella cada día.', buyBtn)
      return
    }
    const m = todayModel(), dk = K(m.delta)
    const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    const serie = portfolioSeriesForRange('1m').map(p => p.value)
    const maxD = Math.max(...m.rows.map(r => Math.abs(r.d)), 1)
    const filas = m.sorted.map(r => {
      const k = K(r.d)
      return `<button class="m-row" type="button" onclick="openAssetDetail('${H(r.p.t)}')">
        ${logoHTML(r.p)}
        <span class="m-row-main"><strong>${H(r.p.n)}</strong><small>${Math.round(r.w)} % de tu dinero</small>
          <i class="m-bar ${k}" style="--w:${(Math.abs(r.d) / maxD * 100).toFixed(0)}%"></i></span>
        <span class="m-row-end"><strong class="chg ${k}">${H(signedCOP(r.d))}</strong>${pill(r.chg)}</span>
      </button>`
    }).join('')
    const news = localRadarResults(true).slice(0, 6)
    const cards = news.map(n => `<button class="m-ncard" type="button" onclick="mNews(${Number(n.id)})">
        <span class="m-ncard-img">${thumb(n, 520, true)}</span>
        <span class="m-ncard-body">${tag(n.direccion)}<strong>${H(n.titulo)}</strong><small>${H(assetName(n.t))}</small></span>
      </button>`).join('')
    const cc = COLCAP.chg, ck = K(cc), mx = Math.max(Math.abs(cc), Math.abs(m.pct), 0.1)
    const bar = (lbl, v) => `<div class="m-cmp"><span>${lbl}</span><i class="${K(v)}" style="--w:${(Math.abs(v) / mx * 100).toFixed(0)}%"></i><b class="chg ${K(v)}">${dirArrow(K(v))} ${t4pct(v)} %</b></div>`
    el.innerHTML = `
      <section class="m-hero ${dk}">
        <p class="m-kicker">${H(fecha)}</p>
        <h1>Hoy tu portafolio <em class="${m.dir === 'flat' ? 'flat' : dk}">${m.dir === 'flat' ? 'casi no cambió' : verbo(m.delta) + ' ' + t4pct(m.pct) + ' %'}</em></h1>
        <p class="m-amt">${H(t4amt(m.delta) || 'Sin cambio en pesos')}</p>
        <div class="m-hero-spark">${sparkSVG(serie, dk, 360, 64)}</div>
        <p class="m-hero-foot">Vale ${H(formatCOP(m.c.total))} · ${H(freshShort())}</p>
      </section>
      <button class="m-cta" type="button" onclick="mAsk('¿Qué pasó hoy con mi portafolio y por qué?')">${ia}Explícame mi día con IA</button>
      ${sec('Qué movió tu día', '<p>De lo que más pesó a lo que menos. Toca una para ver el detalle.</p>')}
      <div class="m-list">${filas}</div>
      ${cards ? sec('Noticias de tus acciones', '<button class="m-link" type="button" onclick="switchView(\'radar\')">Ver todas</button>') + `<div class="m-rail">${cards}</div>` : ''}
      ${sec('Tú frente al mercado')}
      <div class="m-card">
        <div class="m-cc-top"><div><small>COLCAP hoy</small><strong>${COLCAP.proxy ? '' : H(NUM_FMT.format(COLCAP.valor))}</strong></div>${pill(cc)}</div>
        ${bar('Tu portafolio', m.pct)}${bar('COLCAP', cc)}
        <p class="m-note">${H(colcapLine(m))} El COLCAP resume cómo les va a las acciones más grandes de Colombia.</p>
      </div>`
  }

  /* ---------- PORTAFOLIO ---------- */
  function portfolio() {
    const el = mount('portfolio')
    if (!PORTFOLIO.length) {
      el.innerHTML = head('Tu portafolio') + empty('Tu portafolio está vacío', 'Elige una acción y compra con pesos de práctica. No es dinero real.', buyBtn)
      return
    }
    const c = calculatePortfolio(), gk = K(Math.round(c.gain)), dk = K(c.delta)
    const tabs = [['acciones', 'Acciones'], ['reparto', 'Reparto'], ['movs', 'Movimientos']]
    let body = ''
    if (ST.pf === 'acciones') {
      body = '<div class="m-list">' + [...PORTFOLIO].sort((a, b) => b.value - a.value).map(p => `
        <button class="m-row" type="button" onclick="openAssetDetail('${H(p.t)}')">
          ${logoHTML(p)}
          <span class="m-row-main"><strong>${H(p.n)}</strong><small>${H(qtyTxt(p.shares))} acciones · ${Math.round(p.weight_pct)} % de tu dinero</small></span>
          <span class="m-row-end"><strong>${H(formatCOP(p.value))}</strong><span class="chg ${K(Math.round(p.gain))}">${H(signedCOP(p.gain))}</span></span>
        </button>`).join('') + '</div><p class="m-note">Junto a cada acción: cuánto ganas o pierdes desde que la compraste.</p>'
    } else if (ST.pf === 'reparto') {
      const items = c.sectors.map(([s, v]) => ({ key: s, label: s, value: v, color: sectorColor(s) }))
      const top = c.sectors[0], w = top && c.total ? top[1] / c.total * 100 : 0
      body = `<div class="m-card m-donut" id="mDonut">${donutSVG(items, { id: 'mDn', center: formatCompactCOP(c.total), sub: 'vale tu portafolio' })}</div>
        <div class="m-list">${items.map(x => `<div class="m-row m-row-static"><i class="m-dot" style="background:${x.color}"></i><span class="m-row-main"><strong>${H(x.label)}</strong></span><span class="m-row-end"><strong>${Math.round(x.value / c.total * 100)} %</strong><small>${H(formatCompactCOP(x.value))}</small></span></div>`).join('')}</div>
        ${top ? `<p class="m-note">${w >= 40 ? `<b>${Math.round(w)} %</b> de tu dinero está en ${H(top[0])}. Si a ese sector le va mal, tu portafolio lo sentirá más.` : 'Tu dinero está repartido entre varios sectores.'}</p>` : ''}
        <button class="m-cta" type="button" onclick="mAsk('Hazme una lectura de mi portafolio: de qué sector depende más mi dinero y qué conviene mirar')">${ia}Pídele una lectura a la IA</button>`
    } else {
      const txs = API.transactions()
      body = txs.length ? '<div class="m-list">' + txs.map(t => {
        const a = assetOf0(t.ticker) || { t: t.ticker, n: t.ticker, sector: '' }, buy = t.kind === 'buy'
        return `<div class="m-row m-row-static">${logoHTML(a, true)}
          <span class="m-row-main"><strong>${buy ? 'Compraste' : 'Vendiste'} ${H(a.n)}</strong><small>${H(dayTxt(t.day))} · ${H(qtyTxt(t.quantity))} a ${H(formatCOP(t.price))}</small></span>
          <span class="m-row-end"><strong class="chg ${buy ? 'flat' : 'up'}">${buy ? '−' : '+'}${H(formatCOP(t.quantity * t.price))}</strong>
          <button class="m-x" type="button" aria-label="Borrar este movimiento" onclick="deleteTx(${Number(t.id)})">Borrar</button></span></div>`
      }).join('') + '</div>' : '<p class="m-note">Aún no tienes movimientos.</p>'
    }
    el.innerHTML = `
      <section class="m-pf-top">
        ${liveDayChartHTML('mPfChart', portfolioSeriesForRange(), { label: 'Tu portafolio vale', value: formatCOP(c.total), meta: '', k: gk, aria: 'Cómo ha ido tu portafolio' })}
        <p class="m-pf-gain">Desde que empezaste <b class="chg ${gk}">${H(signedCOP(c.gain))} (${H(fmtPct(c.gain_pct))})</b> · Hoy <b class="chg ${dk}">${H(signedCOP(c.delta))}</b></p>
        <div class="m-actions"><button class="m-btn m-btn-pri" type="button" onclick="openTradeModal('buy')">Comprar</button><button class="m-btn" type="button" onclick="openTradeModal('sell')">Vender</button></div>
      </section>
      <div class="m-seg" role="tablist">${tabs.map(([k, t]) => `<button type="button" role="tab" aria-selected="${ST.pf === k}" class="${ST.pf === k ? 'on' : ''}" onclick="mPfTab('${k}')">${t}</button>`).join('')}</div>
      <div class="m-tabbody">${body}</div>
      <div class="m-ad">${document.getElementById('adSlotPortfolio')?.innerHTML || ''}</div>`
    bindLiveCharts()
    const dn = document.getElementById('mDonut')
    if (dn) bindDonut(dn, c.sectors.map(([s, v]) => ({ key: s, label: s, value: v, color: sectorColor(s) })), formatCompactCOP)
  }
  window.mPfTab = t => { ST.pf = t; portfolio() }

  /* ---------- NOTICIAS ---------- */
  function radar() {
    const el = mount('radar')
    const list = localRadarResults(ST.mine, { impact: ST.imp, direction: ST.dir })
    const chip = (on, txt, fn) => `<button type="button" class="m-chip${on ? ' on' : ''}" aria-pressed="${on}" onclick="${fn}">${txt}</button>`
    el.innerHTML = head('Noticias', 'Qué pasó con las acciones y por qué te afecta.') + `
      <div class="m-seg">${['Mis acciones', 'Todas'].map((t, i) => `<button type="button" class="${ST.mine === !i ? 'on' : ''}" onclick="mNewsSet('mine',${!i})">${t}</button>`).join('')}</div>
      <div class="m-chips">${chip(!ST.imp && !ST.dir, 'Todas', "mNewsSet('all')")}${chip(ST.imp === 'Alta', 'Impacto grande', "mNewsSet('imp','Alta')")}${chip(ST.dir === 'Positivo', 'Buenas', "mNewsSet('dir','Positivo')")}${chip(ST.dir === 'Negativo', 'Malas', "mNewsSet('dir','Negativo')")}</div>
      ${list.length ? '<div class="m-news">' + list.map(n => `
        <button class="m-nrow" type="button" onclick="mNews(${Number(n.id)})">
          <span class="m-nrow-main"><span class="m-nrow-meta">${tag(n.direccion)}<small>${H(assetName(n.t))} · ${H(n.time)}</small></span><strong>${H(n.titulo)}</strong></span>
          <span class="m-nrow-img">${thumb(n, 240, true)}</span>
        </button>`).join('') + '</div>'
        : empty(ST.mine && !PORTFOLIO.length ? 'Aún no tienes acciones' : 'No hay noticias con este filtro', 'Prueba con «Todas» para ver las noticias de todas las acciones.')}
      <p class="m-note">The Trace explica lo que pasó. No es una recomendación.</p>`
  }
  window.mNewsSet = (k, v) => {
    if (k === 'mine') ST.mine = v
    else if (k === 'all') { ST.imp = null; ST.dir = null }
    else if (k === 'imp') ST.imp = ST.imp === v ? null : v
    else ST.dir = ST.dir === v ? null : v
    radar()
  }

  /* Hoja de una noticia: sube desde abajo con la foto, el porqué y qué mirar. */
  window.mNews = id => {
    const n = localRadarResults(false).find(x => Number(x.id) === Number(id))
    if (!n) return
    const a = assetOf(n.t)
    mSheet(`
      <div class="m-sheet-img">${thumb(n, 900, true)}</div>
      <div class="m-sheet-pad">
        <div class="m-nrow-meta">${tag(n.direccion)}<small>${H(n.sourceHint || 'Resumen de mercado')} · ${H(n.time)}</small></div>
        <h2>${H(n.titulo)}</h2>
        <p>${H(n.dek)}</p>
        ${n.via ? `<h3>Por qué te afecta</h3><p>${H(n.via)}</p>` : ''}
        ${n.metric ? `<h3>Qué conviene mirar</h3><p>${H(n.metric)}</p>` : ''}
        <button class="m-row m-row-co" type="button" onclick="mCloseSheet();openAssetDetail('${H(n.t)}')">${logoHTML(a)}<span class="m-row-main"><strong>${H(a.n)}</strong><small>${n.exposure ? Math.round(n.exposure) + ' % de tu dinero' : 'No la tienes en tu portafolio'}</small></span><span class="m-row-end">${pill(a.chg)}</span></button>
        <button class="m-cta" type="button" onclick="mAsk(${H(JSON.stringify('Explícame esta noticia y cómo me afecta: ' + n.titulo))})">${ia}Pregúntale a Trace AI</button>
        ${n.url ? `<a class="m-link m-src" href="${H(n.url)}" target="_blank" rel="noopener">Leer la fuente</a>` : ''}
        <p class="m-note">The Trace explica lo que pasó. No te dice qué comprar ni vender.</p>
      </div>`)
  }

  /* ---------- MERCADO ---------- */
  function market() {
    const el = mount('market')
    const all = [...POOL_EXPANDIDO].sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg))
    const up = all.filter(a => a.chg > 0).length, dn = all.filter(a => a.chg < 0).length
    const mine = t => PORTFOLIO.find(p => p.t === t)
    const list = all.filter(a => ST.mk === 'all' || (ST.mk === 'up' && a.chg > 0) || (ST.mk === 'down' && a.chg < 0) || (ST.mk === 'mine' && mine(a.t)))
    const ck = K(COLCAP.chg)
    const chip = (k, t) => `<button type="button" class="m-chip${ST.mk === k ? ' on' : ''}" aria-pressed="${ST.mk === k}" onclick="mMk('${k}')">${t}</button>`
    el.innerHTML = head('Mercado', `Hoy el mercado <b class="chg ${ck}">${verbo(COLCAP.chg)} ${t4pct(COLCAP.chg)} %</b>`) + `
      <div class="m-breadth"><i class="up" style="flex:${up || 0.001}"></i><i class="down" style="flex:${dn || 0.001}"></i></div>
      <p class="m-breadth-txt"><span class="chg up">${up} subieron</span> · <span class="chg down">${dn} bajaron</span> · ${H(freshShort())}</p>
      <div class="m-chips">${chip('all', 'Todas')}${chip('up', 'Subieron')}${chip('down', 'Bajaron')}${chip('mine', 'Las mías')}</div>
      <div class="m-list">${list.map(a => {
        const p = mine(a.t)
        return `<button class="m-row" type="button" onclick="openAssetDetail('${H(a.t)}')">
          ${logoHTML(a)}
          <span class="m-row-main"><strong>${H(a.n)}${p ? '<em class="m-own">Tienes</em>' : ''}</strong><small>${H(a.sector)}</small></span>
          <span class="m-row-end"><strong>${H(formatCOP(a.price))}</strong>${pill(a.chg)}</span>
        </button>`
      }).join('') || '<p class="m-note">No hay acciones con este filtro.</p>'}</div>
      <p class="m-note">Precios de la Bolsa de Valores de Colombia. Toca una acción para ver su gráfica y qué la mueve.</p>`
  }
  window.mMk = k => { ST.mk = k; market() }

  /* ---------- hoja que sube desde abajo ---------- */
  function mSheet(html) {
    let o = document.getElementById('mSheetWrap')
    if (!o) {
      document.body.insertAdjacentHTML('beforeend', '<div class="m-sheet-wrap" id="mSheetWrap" onclick="if(event.target===this)mCloseSheet()"><div class="m-sheet" role="dialog" aria-modal="true"><div class="m-grab" aria-hidden="true"></div><button class="m-sheet-x" type="button" aria-label="Cerrar" onclick="mCloseSheet()">×</button><div class="m-sheet-body" id="mSheetBody"></div></div></div>')
      o = document.getElementById('mSheetWrap')
      bindSwipeDown(o.querySelector('.m-sheet'))
    }
    document.getElementById('mSheetBody').innerHTML = html
    o.querySelector('.m-sheet-body').scrollTop = 0
    requestAnimationFrame(() => o.classList.add('open'))
    document.documentElement.classList.add('m-lock')
  }
  window.mCloseSheet = () => {
    const o = document.getElementById('mSheetWrap')
    if (!o || !o.classList.contains('open')) return
    o.classList.remove('open')
    document.documentElement.classList.remove('m-lock')
  }
  /* Deslizar la hoja hacia abajo la cierra. */
  function bindSwipeDown(sh) {
    let y0 = null, dy = 0
    sh.addEventListener('touchstart', e => { if (sh.querySelector('.m-sheet-body').scrollTop > 0) return; y0 = e.touches[0].clientY; dy = 0 }, { passive: true })
    sh.addEventListener('touchmove', e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)` }, { passive: true })
    sh.addEventListener('touchend', () => { if (y0 == null) return; sh.style.transform = ''; if (dy > 90) mCloseSheet(); y0 = null })
  }
  addEventListener('keydown', e => { if (e.key === 'Escape') mCloseSheet() })

  /* ---------- PORTADA ----------
     En PC la portada se cuenta con el scroll (secciones pegadas que cambian al bajar). En celular eso
     deja pantallas vacías, así que aquí cada sección se muestra completa y el celular de muestra pasa
     solo por sus 4 pantallas. Para que el código del scroll no las mueva, se les cambia el id. */
  const LD_IDS = [['ldStory', 'ldStoryM'], ['ldZoom', 'ldZoomM'], ['ldFill', 'ldFillM']]
  let ldTimer = 0, ldI = 0
  function landing() {
    const mob = on()
    LD_IDS.forEach(([pc, m]) => {
      const el = document.getElementById(mob ? pc : m)
      if (el) el.id = mob ? m : pc
    })
    document.querySelectorAll('a[href="#ldStory"],a[href="#ldStoryM"]').forEach(a => { a.href = mob ? '#ldStoryM' : '#ldStory' })
    clearInterval(ldTimer)
    const st = document.getElementById('ldStoryM')
    if (!mob || !st) return
    document.querySelectorAll('#ldFillM .fw').forEach(w => { w.classList.add('on'); w.style.setProperty('--o', 1) })
    if (!st.querySelector('.m-ld-dots')) {
      st.querySelector('.ld-steps')?.insertAdjacentHTML('afterend', '<div class="m-ld-dots" role="group" aria-label="Pantallas de muestra">' +
        [0, 1, 2, 3].map(i => `<button type="button" aria-label="Pantalla ${i + 1}" onclick="mLdGo(${i},true)"></button>`).join('') + '</div>')
    }
    mLdGo(0)
    ldTimer = setInterval(() => { if (document.body.classList.contains('on-landing') && !document.hidden) mLdGo((ldI + 1) % 4) }, 3600)
  }
  window.mLdGo = (i, user) => {
    const st = document.getElementById('ldStoryM')
    if (!st) return
    ldI = i
    st.querySelectorAll('.ld-step').forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-past', false) })
    st.querySelectorAll('.ld-scr').forEach((s, k) => s.classList.toggle('is-on', k === i))
    st.querySelectorAll('.ld-prog i').forEach((b, k) => { b.classList.toggle('on', k === i); b.classList.toggle('done', k < i) })
    st.querySelectorAll('.m-ld-dots button').forEach((b, k) => b.classList.toggle('on', k === i))
    if (user) { clearInterval(ldTimer); ldTimer = setInterval(() => mLdGo((ldI + 1) % 4), 3600) }
  }

  /* ---------- cuándo dibujar ---------- */
  function render() {
    document.documentElement.classList.toggle('mob', on())
    if (!on()) return
    const v = currentView, b = document.body.classList
    try {
      if (v === 'today' && b.contains('today-mode-tech')) today()
      else if (v === 'portfolio') portfolio()
      else if (v === 'radar') radar()
      else if (v === 'market') market()
    } catch (e) { console.error('[mobile]', e) }
  }
  window.mRender = render
  const wrap = name => {
    const f = window[name]
    if (typeof f !== 'function') return
    window[name] = function () { const r = f.apply(this, arguments); render(); return r }
  }
  ;['switchView', 'refreshAll', 'setChartRange', 'setTodayMode'].forEach(wrap)
  /* Al cambiar de pantalla en el celular, arranca arriba. */
  const sv = window.switchView
  window.switchView = function () { const r = sv.apply(this, arguments); if (on()) { mCloseSheet(); scrollTo(0, 0) } return r }
  MQ.addEventListener('change', () => { render(); landing() })
  render()
  landing()
})()
