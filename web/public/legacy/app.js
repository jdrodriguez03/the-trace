/* The Trace · pantallas del prototipo aprobado, conectadas al backend.
   window.TRACE (src/connect/trace.ts) entrega los datos reales. Si no hay conexión con la API,
   TRACE.mode es 'demo' y todo funciona con los datos de ejemplo, como el artefacto. */
const LIVE=!!(window.TRACE&&TRACE.mode==='live');
const SRV=LIVE?TRACE.market:null;

/* ======================= DATOS ======================= */
/* =========================================================================
   DATOS CON LA FORMA DE LA API
   Este prototipo funciona solo: no llama al servidor. Pero cada dato tiene la
   forma exacta de api/app/schemas.py y cada función de API.* dice qué ruta la
   reemplaza. Al pasarlo a web/, el cuerpo de cada función se cambia por un
   fetch a esa ruta con el token de Supabase. Los cálculos copian los de
   api/app/core/ (portfolio.py, history.py, news.py y today.py).
   ========================================================================= */
const ISO=d=>{const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const HOY_ISO=ISO(new Date());
const RANGOS={'1m':30,'3m':91,'1y':365}; /* los botones 1M, 3M y 1A (api/app/core/history.py) */
/* Días con mercado (lunes a viernes) del último año y unos días más. */
const MARKET_DAYS=LIVE?(()=>{const d=new Set();Object.values(SRV.history).forEach(a=>a.forEach(p=>d.add(p.day)));SRV.assets.forEach(a=>d.add(String(a.updated_at).slice(0,10)));const out=[...d].filter(x=>x<=HOY_ISO).sort();return out.length?out:[HOY_ISO]})():(()=>{const out=[];const d=new Date();d.setHours(12,0,0,0);for(let i=0;i<380;i++){const w=d.getDay();if(w!==0&&w!==6)out.unshift(ISO(d));d.setDate(d.getDate()-1)}return out})();
const LAST_MARKET_DAY=MARKET_DAYS[MARKET_DAYS.length-1];
/* Hora del precio más reciente: Yahoo llega con unos 15 minutos de retraso y la Bolsa cierra a las 4:00 p. m. */
const MARKET_UPDATED_AT=LIVE?SRV.updatedAt:(()=>{const now=new Date(),t=new Date(now.getTime()-15*60e3);const d=new Date(LAST_MARKET_DAY+'T15:45:00');if(LAST_MARKET_DAY!==HOY_ISO||t>d)return d.toISOString();const open=new Date(HOY_ISO+'T09:30:00');if(t<open){const prev=new Date(MARKET_DAYS[MARKET_DAYS.length-2]+'T15:45:00');return prev.toISOString()}return t.toISOString()})();
const DRIVERS={
ECOPETROL:'La mueven el precio del petróleo, el dólar y cuánto petróleo produce. Si el dólar sube, su petróleo vale más en pesos.',
PFBCOLOM:'Le importan lo que cuesta pedir prestado, cuánta gente pide préstamos y si los clientes pagan a tiempo.',
ISA:'Dependen de sus contratos de líneas de energía, del dólar y de las reglas del gobierno. Como los contratos duran años, sus ingresos son estables.',
GRUPOSURA:'Le afectan los seguros que ofrece y cómo les va a las empresas donde invierte. También pesa lo que cuesta pedir prestado.',
GRUPOARGOS:'Depende de cómo les vaya a las empresas de las que es dueño, como las de cemento y energía.',
CEMARGOS:'Se mueve con la construcción de casas y obras, el precio de los materiales y el dólar. Cuando se construye menos, recibe menos pedidos.',
GEB:'Le importan sus contratos de transporte de energía y gas, las reglas del gobierno y el dólar. Casi todo su ingreso viene de contratos largos.',
CELSIA:'La mueven las lluvias: con más agua produce más energía y más barata. También pesa el precio de la energía.',
PFDAVVNDA:'Le afectan lo que cuesta pedir prestado, cuánta gente pide préstamos y si los clientes pagan. Una economía débil le complica el cobro.',
MINEROS:'Depende del precio del oro, del dólar y de cuánto oro logra sacar. Si el oro sube, cada gramo que produce vale más.'};
/* GET /v1/market/assets → list[AssetOut]. Mismo catálogo que api/scripts/provisional_catalog.py. */
const ASSETS_API=[
  ['ECOPETROL','Ecopetrol','Petróleo y energía',2350,-1.4],
  ['PFBCOLOM','Bancolombia (Grupo Cibest)','Bancos',38400,0.8],
  ['ISA','ISA','Energía eléctrica',21800,1.9],
  ['GRUPOSURA','Grupo Sura','Seguros e inversiones',37500,-0.6],
  ['GRUPOARGOS','Grupo Argos','Seguros e inversiones',16900,0.3],
  ['CEMARGOS','Cementos Argos','Construcción',9800,-2.1],
  ['GEB','Grupo Energía Bogotá','Energía eléctrica',2700,1.2],
  ['CELSIA','Celsia','Energía eléctrica',4100,2.6],
  ['PFDAVVNDA','Davivienda','Bancos',22600,-0.9],
  ['MINEROS','Mineros','Minería',8900,2.8]
].map(([ticker,name,sector,price,change_pct])=>({ticker,name,sector,price,change_pct,updated_at:MARKET_UPDATED_AT,drivers:DRIVERS[ticker]}));
if(LIVE){ASSETS_API.length=0;SRV.assets.forEach(a=>ASSETS_API.push({...a,drivers:a.drivers||DRIVERS[a.ticker]||''}))}
/* GET /v1/market/colcap → ColcapOut. proxy=true: el dato viene del fondo ICOLCAP, que sigue al índice.
   Entonces `points` es el precio del fondo en pesos y la web NO lo muestra como puntos: solo el cambio del día. */
const COLCAP_API=(LIVE&&SRV.colcap)?SRV.colcap:{points:14520,change_pct:0.6,day:LAST_MARKET_DAY,updated_at:MARKET_UPDATED_AT,proxy:true};
/* Lo mismo, con los nombres cortos que usan las pantallas (t, n, chg). */
const POOL_EXPANDIDO=ASSETS_API.map(a=>({t:a.ticker,n:a.name,sector:a.sector,price:a.price,chg:a.change_pct,updated_at:a.updated_at,drivers:a.drivers}));
const COLCAP={valor:COLCAP_API.points,chg:COLCAP_API.change_pct,proxy:COLCAP_API.proxy,frase:'el termómetro de las acciones más grandes de Colombia'};
/* ---- Cierres diarios de ejemplo (en la API: tabla PriceSnapshot, un año de cierres) ----
   Una serie fija por acción que termina en el precio de hoy y pasa por el cierre de ayer. */
const CLOSES_CACHE={};
function closesFor(t){
  if(CLOSES_CACHE[t])return CLOSES_CACHE[t];
  if(LIVE&&SRV.history[t]&&SRV.history[t].length>1){const s=SRV.history[t].map(p=>({day:p.day,price:p.price}));const a=t==='COLCAP'?null:ASSETS_API.find(x=>x.ticker===t);if(a&&s[s.length-1].day===String(a.updated_at).slice(0,10))s[s.length-1].price=a.price;return CLOSES_CACHE[t]=s}
  const a=t==='COLCAP'?{price:COLCAP_API.points,change_pct:COLCAP_API.change_pct}:ASSETS_API.find(x=>x.ticker===t);
  if(!a)return[];
  const n=MARKET_DAYS.length,r=mulberry32(hashStr('cierres|'+t)),vol=t==='COLCAP'?0.007:0.013;
  const px=new Array(n);px[n-1]=a.price;px[n-2]=a.price/(1+a.change_pct/100);
  for(let i=n-3;i>=0;i--){const u=Math.max(r(),1e-9),v=r();const z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);const drift=0.0004;px[i]=px[i+1]/(1+drift+z*vol)}
  const out=MARKET_DAYS.map((day,i)=>({day,price:Math.round(px[i]*100)/100}));
  out[n-1].price=a.price;
  return CLOSES_CACHE[t]=out}
function closeOn(t,day){const s=closesFor(t);let last=null;for(const c of s){if(c.day<=day)last=c;else break}return last?last.price:null}
const sinceFor=range=>{const d=new Date(HOY_ISO+'T12:00:00');d.setDate(d.getDate()-RANGOS[range]);return ISO(d)};

/* ---- Cálculos del portafolio: copia de api/app/core/portfolio.py (método de costo promedio) ---- */
function enOrden(movs){return [...movs].sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:(a.kind==='sell')-(b.kind==='sell')||(a.id-b.id))}
function applyMove(m,q,cost,real){const t=m.ticker;q[t]=q[t]||0;cost[t]=cost[t]||0;real[t]=real[t]||0;
  if(m.kind==='buy'){q[t]+=m.quantity;cost[t]+=m.quantity*m.price;return}
  const avg=q[t]?cost[t]/q[t]:0;real[t]+=(m.price-avg)*m.quantity;cost[t]-=avg*m.quantity;q[t]-=m.quantity;
  if(q[t]<=1e-9){q[t]=0;cost[t]=0}}
function enNegativo(movs){const q={};for(const m of enOrden(movs)){q[m.ticker]=(q[m.ticker]||0)+(m.kind==='buy'?m.quantity:-m.quantity);if(q[m.ticker]<-1e-9)return true}return false}
const dayChange=(v,chg)=>v-v/(1+chg/100);
function buildPortfolioOut(movs){
  const q={},cost={},real={};enOrden(movs).forEach(m=>applyMove(m,q,cost,real));
  const positions=[];
  for(const t of Object.keys(q)){if(q[t]<=1e-9)continue;const a=ASSETS_API.find(x=>x.ticker===t);if(!a)continue;
    const value=q[t]*a.price,gain=value-cost[t];
    positions.push({ticker:t,name:a.name,sector:a.sector,quantity:q[t],avg_cost:cost[t]/q[t],invested:cost[t],price:a.price,change_pct:a.change_pct,value,gain,gain_pct:cost[t]?gain/cost[t]*100:0,realized_gain:real[t]||0,day_change:dayChange(value,a.change_pct),weight_pct:0})}
  positions.sort((a,b)=>b.value-a.value);
  const total=positions.reduce((s,p)=>s+p.value,0),invested=positions.reduce((s,p)=>s+p.invested,0),dc=positions.reduce((s,p)=>s+p.day_change,0);
  const realized=Object.values(real).reduce((s,x)=>s+x,0);
  positions.forEach(p=>p.weight_pct=total?p.value/total*100:0);
  const secs={};positions.forEach(p=>secs[p.sector]=(secs[p.sector]||0)+p.value);
  const sectors=Object.entries(secs).map(([sector,value])=>({sector,value,weight_pct:total?value/total*100:0})).sort((a,b)=>b.value-a.value);
  const prev=total-dc;
  return{
    holdings:positions.map(p=>({ticker:p.ticker,name:p.name,quantity:p.quantity})),
    positions,
    summary:{total_value:total,invested,gain:total-invested,gain_pct:invested?(total-invested)/invested*100:0,realized_gain:realized,day_change:dc,day_change_pct:prev?dc/prev*100:0,top_sector:sectors[0]?sectors[0].sector:null,top_sector_pct:sectors[0]?sectors[0].weight_pct:0,positions_count:positions.length,sectors},
    updated_at:MARKET_UPDATED_AT}
}
/* Historial: copia de api/app/core/history.py. Cada día con mercado, lo que valían tus acciones frente a lo que habías pagado. */
function buildPortfolioHistory(movs,range){
  if(!movs.length)return[];
  const ord=enOrden(movs),desde=sinceFor(range);
  const days=MARKET_DAYS.filter(d=>d>=desde&&d<=HOY_ISO&&d>=ord[0].day);
  if(!days.includes(LAST_MARKET_DAY)&&LAST_MARKET_DAY>=ord[0].day)days.push(LAST_MARKET_DAY);
  const q={},cost={},real={};let i=0;const out=[];
  for(const day of days){while(i<ord.length&&ord[i].day<=day){applyMove(ord[i],q,cost,real);i++}
    let value=0,invested=0;for(const t of Object.keys(q)){if(q[t]<=1e-9)continue;value+=q[t]*(closeOn(t,day)||0);invested+=cost[t]}
    out.push({day,value,invested})}
  return out}

/* ---- Usuario y sesión (Supabase en la app real) ---- */
const userSlug=()=>currentUser==='Invitado'?'invitado':String(currentUser).toLowerCase().trim();
const txKey=()=>'trace_tx_'+userSlug();
let TX=[];
function readTX(){if(LIVE)return (TRACE.user&&TRACE.user.tx)||[];try{const v=JSON.parse(localStorage.getItem(txKey())||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function writeTX(){if(LIVE)return;localStorage.setItem(txKey(),JSON.stringify(TX))}
const round=(x,d)=>Math.round(x*10**d)/10**d;
const floorTo=(x,d)=>Math.floor(x*10**d+1e-9)/10**d;

/* ---- Las rutas de la API. Hoy responden con datos de ejemplo; mañana, con fetch. ---- */
const API={
  /* GET /v1/me → MeOut */
  me(){return{id:'demo-'+userSlug(),email:currentUser==='Invitado'?null:currentUser,is_guest:currentUser==='Invitado'}},
  /* GET /v1/market/assets */
  assets(){return ASSETS_API},
  /* GET /v1/market/colcap */
  colcap(){return COLCAP_API},
  /* GET /v1/market/assets/{ticker}/history?range=1m|3m|1y → list[PricePointOut] */
  assetHistory(t,range='1m'){const d=sinceFor(range);return closesFor(t).filter(c=>c.day>=d)},
  /* GET /v1/portfolio → PortfolioOut */
  portfolio(){return buildPortfolioOut(TX)},
  /* GET /v1/portfolio/transactions → list[TransactionOut], del más nuevo al más viejo */
  transactions(){return [...TX].sort((a,b)=>b.day<a.day?-1:b.day>a.day?1:b.id-a.id)},
  /* POST /v1/portfolio/transactions con TransactionIn. Mismas reglas y mensajes que api/app/routes/portfolio.py */
  addTransaction(body){
    const ticker=String(body.ticker||'').trim().toUpperCase();
    if((body.quantity==null)===(body.amount==null))return{ok:false,status:422,detail:'Envía la cantidad de acciones o el monto en pesos, solo uno.'};
    if(body.quantity!=null&&!(body.quantity>0))return{ok:false,status:422,detail:'Escribe una cantidad mayor a 0.'};
    if(body.amount!=null&&!(body.amount>0))return{ok:false,status:422,detail:'Escribe un monto mayor a $0.'};
    const a=ASSETS_API.find(x=>x.ticker===ticker);if(!a)return{ok:false,status:404,detail:'Esa acción no existe en The Trace.'};
    const day=body.day||HOY_ISO;if(day>HOY_ISO)return{ok:false,status:400,detail:'La fecha no puede ser futura.'};
    let price=body.price;if(price==null)price=a.price; /* sin precio: el último guardado */
    price=round(price,4);
    const quantity=body.quantity!=null?round(body.quantity,6):floorTo(body.amount/price,6);
    if(quantity<=0)return{ok:false,status:400,detail:'Esa cantidad es demasiado pequeña.'};
    const nueva={id:TX.reduce((m,x)=>Math.max(m,x.id),0)+1,ticker,kind:body.kind,quantity,price,day,created_at:new Date().toISOString()};
    if(enNegativo([...TX,nueva]))return{ok:false,status:400,detail:'No tienes tantas acciones para vender.'};
    TX.push(nueva);writeTX();return{ok:true,status:201,data:nueva}},
  /* DELETE /v1/portfolio/transactions/{id} */
  deleteTransaction(id){
    const mov=TX.find(x=>x.id===id);if(!mov)return{ok:false,status:404,detail:'Ese movimiento no existe.'};
    const rest=TX.filter(x=>x.id!==id);
    if(enNegativo(rest))return{ok:false,status:400,detail:'No puedes borrar esta compra: después vendiste acciones que dependen de ella.'};
    TX=rest;writeTX();return{ok:true,status:204}},
  /* POST /v1/portfolio/reset: borra TODOS tus movimientos */
  reset(){TX=[];writeTX();return{ok:true,status:204}},
  /* GET /v1/portfolio/history?range=1m|3m|1y → list[PortfolioPointOut] */
  portfolioHistory(range='1m'){return buildPortfolioHistory(TX,range)},
  /* GET /v1/news?mine=true&impact=&direction= → list[NewsOut], ordenadas por impacto × qué parte de tu dinero (core/news.py) */
  news({mine=true,impact=null,direction=null}={}){
    const pesos={};API.portfolio().positions.forEach(p=>pesos[p.ticker]=p.weight_pct);
    const pts={Alta:3,Media:2,Baja:1};
    return NEWS_DATABASE.filter(n=>(!impact||n.magnitud===impact)&&(!direction||n.direccion===direction)).map(n=>{const r=LOCAL_RADAR[n.id]||{},w=pesos[n.t]||0;
      return{id:n.id,ticker:n.t,asset_name:assetName(n.t),direction:n.direccion,magnitude:n.magnitud,title:n.titulo,summary:n.dek,why:r.via||LOCAL_VIA,watch:r.metric||LOCAL_METRIC,source:n.fuente,url:null,day:NEWS_DAY[n.id]||MARKET_DAYS[Math.max(0,MARKET_DAYS.length-1-(NEWS_AGE[n.id]||0))],url:n.url||null,weight_pct:w,_s:(pts[n.magnitud]||0)*w}})
      .filter(n=>!mine||n.weight_pct>0).sort((a,b)=>b._s-a._s||(pts[b.magnitude]-pts[a.magnitude])||b.id-a.id)},
  /* POST /v1/waitlist/trace-plus (la tabla WaitlistEntry aún no existe en el servidor) */
  waitlist(){localStorage.setItem('trace_waitlist_'+userSlug(),new Date().toISOString());return{ok:true,status:201}},
  onWaitlist(){return !!localStorage.getItem('trace_waitlist_'+userSlug())}
};
/* Ejemplo listo para mostrar: compras de hace unos meses y una venta, con el precio de cierre de cada día. */
function seedTransactions(){
  const ago=n=>MARKET_DAYS[Math.max(0,MARKET_DAYS.length-1-n)];
  const plan=[['ECOPETROL','buy',1400,62],['PFBCOLOM','buy',60,62],['ISA','buy',90,45],['GRUPOSURA','buy',40,30],['ECOPETROL','sell',200,12]];
  return plan.map(([ticker,kind,quantity,n],i)=>({id:i+1,ticker,kind,quantity,price:round(closeOn(ticker,ago(n)),4),day:ago(n),created_at:new Date().toISOString()}))
}

const NEWS_DATABASE = [
  {id:1,t:"ECOPETROL",direccion:"Negativo",magnitud:"Alta",titulo:"El petróleo baja de precio y Ecopetrol lo siente",fuente:"Resumen de mercado",dek:"El precio del petróleo es clave para Ecopetrol. Si baja, la empresa recibe menos por cada barril."},
  {id:2,t:"ECOPETROL",direccion:"Positivo",magnitud:"Baja",titulo:"Ecopetrol produce un poco más de petróleo este mes",fuente:"Resumen de mercado",dek:"Producir más significa tener más petróleo disponible. El efecto es pequeño por ahora."},
  {id:3,t:"PFBCOLOM",direccion:"Positivo",magnitud:"Media",titulo:"Bancolombia gana más por los préstamos que entrega",fuente:"Resumen de mercado",dek:"Cuando más personas piden préstamos y los pagan a tiempo, el banco gana más."},
  {id:4,t:"PFDAVVNDA",direccion:"Negativo",magnitud:"Media",titulo:"Más clientes de Davivienda se atrasan en sus pagos",fuente:"Resumen de mercado",dek:"Si los clientes no pagan a tiempo, el banco debe guardar plata para cubrir esas pérdidas."},
  {id:5,t:"ISA",direccion:"Positivo",magnitud:"Alta",titulo:"ISA gana un contrato para nuevas líneas de energía",fuente:"Resumen de mercado",dek:"Construir y operar líneas eléctricas le asegura ingresos durante muchos años."},
  {id:6,t:"GEB",direccion:"Neutro",magnitud:"Baja",titulo:"El Grupo Energía Bogotá sigue con sus planes de obras",fuente:"Resumen de mercado",dek:"La empresa dijo que sus proyectos avanzan como estaban previstos. No hay cambios por ahora."},
  {id:7,t:"CELSIA",direccion:"Positivo",magnitud:"Media",titulo:"Celsia genera más energía gracias a las lluvias",fuente:"Resumen de mercado",dek:"Con más agua en los embalses, sus plantas producen más energía y a menor costo."},
  {id:8,t:"GRUPOSURA",direccion:"Neutro",magnitud:"Media",titulo:"Grupo Sura presenta resultados parecidos a los del año pasado",fuente:"Resumen de mercado",dek:"Sus seguros y sus inversiones dejaron ganancias similares. No hubo sorpresas."},
  {id:9,t:"GRUPOARGOS",direccion:"Negativo",magnitud:"Baja",titulo:"A una de las empresas de Grupo Argos le va un poco peor",fuente:"Resumen de mercado",dek:"Grupo Argos es dueño de partes de otras empresas. Si a ellas les va peor, a él también."},
  {id:10,t:"CEMARGOS",direccion:"Negativo",magnitud:"Alta",titulo:"Baja la demanda de cemento por menos obras",fuente:"Resumen de mercado",dek:"Cementos Argos recibe menos pedidos cuando se levantan menos casas y edificios en el país."},
  {id:11,t:"MINEROS",direccion:"Positivo",magnitud:"Alta",titulo:"El oro sube de precio y Mineros recibe más por cada gramo",fuente:"Resumen de mercado",dek:"Mineros extrae oro. Cuando el precio sube, cada gramo que produce vale más."}
];
/* Etiquetas visibles. Los valores internos (Positivo/Alta…) no cambian. */
const LABELS = {
  direccion:{Positivo:'Buena noticia',Negativo:'Mala noticia',Neutro:'Neutra'},
  severidad:{Alta:'Impacto grande',Media:'Impacto mediano',Baja:'Impacto pequeño'}
};
const labelDir=v=>LABELS.direccion[v]||v;
const labelSev=v=>LABELS.severidad[v]||v;
const LOCAL_VIA='Cambia lo que la empresa gana o gasta';
const LOCAL_METRIC='Cómo le va a la empresa';
/* Color fijo por sector: el mismo en el gráfico, las listas y los logos. */
const SECTOR_COLORS={'Petróleo y energía':'#1F2A44','Bancos':'#2251E8','Energía eléctrica':'#E7A400','Seguros e inversiones':'#0E9F9A','Construcción':'#8B96AB','Minería':'#C2722C'};
const EXTRA_COLORS=['#7C5CD6','#D9507A','#5BA04A','#3E9BE6'];
function sectorColor(s){if(SECTOR_COLORS[s])return SECTOR_COLORS[s];let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))>>>0;return EXTRA_COLORS[h%EXTRA_COLORS.length]}
const initials=n=>escapeHTML(String(n||'').slice(0,2).toUpperCase());
/* Logos: con una clave pública de logo.dev se ven en alta calidad; sin clave se usa el ícono del sitio de la empresa y, si falla, las iniciales. */
const LOGO_DEV_TOKEN=''; /* Pega aquí la clave pública de logo.dev (empieza por pk_) o guárdala desde «Conexión con IA». */
let logoKey=(localStorage.getItem('logo_dev_token')||LOGO_DEV_TOKEN||'').trim();
const DOMAINS={ECOPETROL:'ecopetrol.com.co',PFBCOLOM:'bancolombia.com',ISA:'isa.co',GRUPOSURA:'gruposura.com',GRUPOARGOS:'grupoargos.com',CEMARGOS:'argos.co',GEB:'grupoenergiabogota.com',CELSIA:'celsia.com',PFDAVVNDA:'davivienda.com',MINEROS:'mineros.com.co'};
function logoUrl(t){const d=DOMAINS[t];if(!d)return'';return logoKey?`https://img.logo.dev/${d}?token=${encodeURIComponent(logoKey)}&size=96&format=png&retina=true&fallback=404`:`https://www.google.com/s2/favicons?domain=${d}&sz=128`}
function logoHTML(a,sz){const cls=sz==='lg'?' lg':sz?' sm':'';const u=logoUrl(a.t);return `<span class="logo${cls}" style="--c:${sectorColor(a.sector)}" aria-hidden="true">${initials(a.n)}${u?`<img src="${u}" alt="" loading="lazy" decoding="async" onload="this.parentNode.classList.add('has-img')" onerror="this.parentNode.classList.remove('has-img');this.remove()">`:''}</span>`}
/* Fotos de noticias: Unsplash (licencia gratuita), con crédito al autor. Si una foto no carga, queda un fondo con el color del sector. */
const PHOTOS={
  oil:{id:'photo-1516199423456-1f1e91b06f25',by:'Zbynek Burival',u:'zburival',alt:'Bomba de extracción de petróleo al atardecer'},
  oilfield:{id:'photo-1648369000096-109763c11e8e',by:'Documerica',u:'documerica',alt:'Varias bombas de petróleo en un campo'},
  medellin:{id:'photo-1512250431446-d0b4b57b27ec',by:'Joel Duncan',u:'joelduncan',alt:'Edificios de Medellín al atardecer'},
  card:{id:'photo-1563013544-824ae1b704d3',by:'rupixen',u:'rupixen',alt:'Persona con una tarjeta frente a un computador'},
  towers:{id:'photo-1543489816-c87b0f5f7dd4',by:'Nikola Johnny Mirkovic',u:'thejohnnyme',alt:'Torre de energía bajo nubes naranjas'},
  bogota:{id:'photo-1568632234157-ce7aecd03d0d',by:'Random Institute',u:'randominstitute',alt:'Edificios de Bogotá junto a la montaña'},
  dam:{id:'photo-1560279966-2d681f3d4dfc',by:'Dan Meyers',u:'dmey503',alt:'Represa que deja salir agua hacia un río'},
  skyline:{id:'photo-1590598016835-83cf3357ebc5',by:'Mike Swigunski',u:'mike_swigunski',alt:'Edificios de Medellín bajo un cielo azul'},
  valley:{id:'photo-1653932610416-399b3deb52d2',by:'Lawrson Pinson',u:'lawrsonpinson',alt:'Ciudad rodeada de montañas'},
  build:{id:'photo-1527335988388-b40ee248d80c',by:'Jacek Dylag',u:'dylu',alt:'Estructura de un edificio en construcción junto a una grúa'},
  gold:{id:'photo-1610375461246-83df859d849d',by:'Jingming Pan',u:'pokmer',alt:'Lingotes de oro apilados'}
};
const NEWS_PHOTO={1:'oil',2:'oilfield',3:'medellin',4:'card',5:'towers',6:'bogota',7:'dam',8:'skyline',9:'valley',10:'build',11:'gold'};
const SECTOR_PHOTO={'Petróleo y energía':'oil','Bancos':'medellin','Energía eléctrica':'towers','Seguros e inversiones':'skyline','Construcción':'build','Minería':'gold'};
const assetOf=t=>POOL_EXPANDIDO.find(a=>a.t===t)||PORTFOLIO.find(a=>a.t===t)||{t,n:assetName(t),sector:''};
/* Banco de imágenes por sector (hechas con IA, en public/img/sectores). Cada noticia toma siempre la misma
   imagen de su sector: se elige con el número de la noticia. Si el sector no tiene imágenes, la ilustración de antes. */
const SECTOR_BANK={'Petróleo y energía':['petroleo-1','petroleo-2','petroleo-3'],'Bancos':['bancos-1','bancos-2','bancos-3'],'Energía eléctrica':['electrica-1','electrica-2','electrica-3'],'Seguros e inversiones':['seguros-1','seguros-2','seguros-3'],'Construcción':['construccion-1','construccion-2','construccion-3'],'Minería':['mineria-1','mineria-2']};
function photoFor(n){const a=assetOf(n.t||n.ticker);const bank=SECTOR_BANK[a.sector];
  if(bank&&bank.length){const k=bank[Math.abs(Number(n.id)||hashStr(String(n.titulo||n.title||'')))%bank.length];return{img:'/img/sectores/'+k+'.webp',alt:''}}
  return PHOTOS[NEWS_PHOTO[n.id]||SECTOR_PHOTO[a.sector]||'bogota']}
/* ---- Biblioteca de imágenes por sector (ilustraciones) ----
   Ocupa el lugar de las fotos mientras llega la biblioteca hecha con IA: una imagen por tema,
   asignada por sector o por noticia. Son SVG dentro de la página: no dependen de internet. */
const ART_CACHE={};
const ART_SCENES={
  oil:['#1d1307','#8a5214','#f5b04c',`<circle cx="610" cy="165" r="78" fill="#ffd08a" opacity=".55"/><circle cx="610" cy="165" r="150" fill="#ffd08a" opacity=".08"/><path d="M0 372 C200 360 600 360 800 372 V500 H0Z" fill="#120b03"/><g fill="none" stroke="#120b03" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"><path d="M262 372 L332 238 L402 372"/><path d="M168 250 L486 214"/><path d="M486 214 Q520 232 512 282"/><path d="M332 238 V250"/><path d="M190 256 V330"/></g><rect x="138" y="226" width="70" height="46" rx="12" fill="#120b03"/><g fill="none" stroke="#120b03" stroke-width="10" stroke-linecap="round"><path d="M600 372 L640 300 L680 372"/><path d="M560 306 L720 290"/></g>`],
  oilfield:['#130f08','#5e3d12','#e09a3c',`<path d="M0 330 C220 312 560 318 800 330 V500 H0Z" fill="#0c0904"/>${[80,250,430,610].map((x,i)=>`<g fill="none" stroke="#0c0904" stroke-width="${12-i}" stroke-linecap="round"><path d="M${x} 330 L${x+45} ${250+i*6} L${x+90} 330"/><path d="M${x-20} ${262+i*6} L${x+140} ${242+i*6}"/></g>`).join('')}<circle cx="700" cy="120" r="44" fill="#ffc77a" opacity=".5"/>`],
  medellin:['#0a1430','#2251e8','#9fb6ff',`<path d="M0 300 L120 210 L250 280 L400 170 L560 270 L700 200 L800 250 V500 H0Z" fill="#132a6b" opacity=".8"/>${[[40,250],[110,190],[180,300],[240,160],[320,230],[390,120],[470,260],[540,180],[620,240],[700,150]].map(([x,y],i)=>`<rect x="${x}" y="${y}" width="${54-(i%3)*8}" height="${500-y}" fill="#081029" opacity=".95"/>${Array.from({length:6},(_,k)=>`<rect x="${x+10}" y="${y+20+k*34}" width="8" height="12" fill="#cfe0ff" opacity="${.15+(k*i%4)*.15}"/>`).join('')}`).join('')}`],
  card:['#0b1433','#3157ff','#a8bcff',`<g transform="rotate(-12 400 250)"><rect x="210" y="140" width="380" height="230" rx="26" fill="#1b37a8"/><rect x="210" y="140" width="380" height="230" rx="26" fill="url(#hl)" opacity=".5"/><rect x="250" y="200" width="64" height="48" rx="10" fill="#f3c969"/><rect x="250" y="300" width="220" height="16" rx="8" fill="#cfdaff" opacity=".6"/><circle cx="520" cy="320" r="26" fill="#ff8a65" opacity=".85"/><circle cx="548" cy="320" r="26" fill="#ffd36e" opacity=".75"/></g>`],
  towers:['#1c1404','#a56f00','#ffd34d',`<circle cx="160" cy="130" r="90" fill="#ffe08a" opacity=".22"/>${[220,560].map((x,i)=>`<g fill="none" stroke="#140d02" stroke-width="${9-i*2}" stroke-linejoin="round"><path d="M${x-50} 470 L${x} ${120+i*40} L${x+50} 470"/><path d="M${x-80} ${180+i*40} H${x+80} M${x-60} ${240+i*40} H${x+60} M${x-38} ${310+i*40} H${x+38} M${x-44} 380 L${x+40} ${300+i*40} M${x+44} 380 L${x-40} ${300+i*40}"/></g>`).join('')}<g fill="none" stroke="#140d02" stroke-width="2.5" opacity=".8"><path d="M0 200 Q110 240 140 180 Q390 260 480 220 Q650 290 800 230"/><path d="M0 260 Q110 300 160 240 Q390 320 500 280 Q650 340 800 290"/></g>`],
  bogota:['#081325','#24508a','#8fb7e8',`<path d="M0 260 L90 170 L190 230 L300 110 L420 210 L520 150 L640 220 L800 140 V500 H0Z" fill="#183a63"/><path d="M0 320 L140 250 L260 300 L380 230 L520 300 L660 240 L800 290 V500 H0Z" fill="#102a4a"/>${[[60,330],[120,290],[200,350],[270,270],[350,320],[430,250],[500,330],[580,280],[660,340],[720,300]].map(([x,y])=>`<rect x="${x}" y="${y}" width="46" height="${500-y}" fill="#06101f"/>${Array.from({length:4},(_,k)=>`<rect x="${x+8}" y="${y+18+k*30}" width="30" height="6" fill="#ffd27a" opacity="${.12+(k%2)*.2}"/>`).join('')}`).join('')}`],
  dam:['#04161a','#0e7a74','#7fe3dc',`<path d="M0 230 C180 200 300 260 420 230 S660 200 800 236 V500 H0Z" fill="#0b5b57" opacity=".85"/>${[0,1,2,3,4].map(i=>`<path d="M0 ${290+i*40} C140 ${270+i*40} 260 ${310+i*40} 400 ${290+i*40} S660 ${270+i*40} 800 ${294+i*40}" fill="none" stroke="#bff5ef" stroke-width="${3-i*.4}" opacity="${.5-i*.08}"/>`).join('')}<path d="M520 150 L800 120 V230 L560 250Z" fill="#03292a"/><circle cx="160" cy="120" r="50" fill="#e6fffb" opacity=".25"/>`],
  skyline:['#071a19','#0e9f9a','#9ff0e8',`<circle cx="620" cy="140" r="64" fill="#d6fff9" opacity=".3"/>${[[60,260],[130,210],[210,280],[280,150],[370,230],[450,180],[530,260],[600,200],[680,250]].map(([x,y],i)=>`<rect x="${x}" y="${y}" width="${60-(i%2)*12}" height="${500-y}" rx="4" fill="#041312"/><rect x="${x+8}" y="${y+12}" width="6" height="${500-y-30}" fill="#9ff0e8" opacity=".12"/>`).join('')}`],
  valley:['#0d1220','#5a6378','#c3cad8',`<path d="M0 230 L150 120 L280 210 L420 90 L560 200 L700 130 L800 180 V500 H0Z" fill="#3a4256"/><path d="M0 310 L170 220 L320 300 L470 210 L640 300 L800 240 V500 H0Z" fill="#262c3b"/><path d="M0 390 C200 360 600 380 800 360 V500 H0Z" fill="#161a24"/>`],
  build:['#12151c','#8b96ab','#e2e7f0',`<g fill="none" stroke="#0a0c11" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><path d="M250 470 V90"/><path d="M190 110 H640"/><path d="M250 90 L330 110"/><path d="M560 110 V230"/></g><g stroke="#0a0c11" stroke-width="3" fill="none">${[0,1,2,3,4,5,6,7].map(i=>`<path d="M238 ${120+i*42} L262 ${150+i*42}"/>`).join('')}</g><rect x="525" y="230" width="70" height="40" fill="#0a0c11"/><rect x="420" y="300" width="300" height="170" fill="#1b2029"/>${[0,1,2].map(r=>[0,1,2,3,4].map(c=>`<rect x="${440+c*56}" y="${320+r*48}" width="34" height="26" fill="#e2e7f0" opacity=".14"/>`).join('')).join('')}`],
  gold:['#1a1204','#b07a12','#ffe08a',`<circle cx="400" cy="200" r="220" fill="#ffd56b" opacity=".12"/>${[[260,330],[400,330],[540,330],[330,250],[470,250],[400,170]].map(([x,y])=>`<path d="M${x-62} ${y+56} L${x-44} ${y} H${x+44} L${x+62} ${y+56}Z" fill="#d69a1e"/><path d="M${x-44} ${y} H${x+44} L${x+52} ${y+18} H${x-52}Z" fill="#ffe7a1" opacity=".9"/>`).join('')}`]
};
function artURI(key){if(ART_CACHE[key])return ART_CACHE[key];const sc=ART_SCENES[key]||ART_SCENES.bogota;const [c1,c2,c3,body]=sc;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient><radialGradient id="gl" cx=".7" cy=".2" r=".8"><stop offset="0" stop-color="${c3}" stop-opacity=".35"/><stop offset="1" stop-color="${c3}" stop-opacity="0"/></radialGradient><linearGradient id="hl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="800" height="500" fill="url(#bg)"/><rect width="800" height="500" fill="url(#gl)"/>${body}</svg>`;
  return ART_CACHE[key]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
const photoKey=p=>Object.keys(PHOTOS).find(k=>PHOTOS[k]===p)||'bogota';

const photoUrl=(p,w)=>p&&p.img?p.img:artURI(photoKey(p));
function mediaHTML(p,{w=640,credit=false,sector=''}={}){return `<div class="media" style="--c:${sectorColor(sector)}"><img src="${photoUrl(p,w)}" alt="${escapeHTML(p.alt)}" loading="lazy" decoding="async" onerror="var c=this.parentNode.querySelector('.credit');if(c)c.remove();this.remove()"></div>`}
const tagHTML=d=>{const k=dirKey(d);return `<span class="tag ${k}">${dirArrow(k)} ${escapeHTML(labelDir(d))}</span>`};
const impactHTML=m=>`<span class="impact"><span class="bars" data-l="${({Alta:3,Media:2,Baja:1})[m]||2}" aria-hidden="true"><i></i><i></i><i></i></span>${escapeHTML(labelSev(m))}</span>`;
const weightHTML=w=>`<span class="meter" aria-hidden="true"><span style="width:${Math.min(Number(w)||0,100)}%"></span></span>${pctComma(w)} de tu dinero`;
/* Semillas fijas para las series de ejemplo: la misma acción siempre dibuja la misma curva. */
function hashStr(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* Mini gráficas: los cierres del último mes. La API solo guarda cierres diarios, no el minuto a minuto. */
const assetSeries=a=>API.assetHistory(a.t||a.ticker,'1m').map(c=>c.price);
const colcapSeries=()=>closesFor('COLCAP').filter(c=>c.day>=sinceFor('1m')).map(c=>c.price);
function portfolioSeries(){return API.portfolioHistory('1m').map(p=>p.value)}
/* Los botones 1M, 3M y 1A: el parámetro range de las rutas de historial. */
const CHART_RANGES={'1m':{label:'1M',long:'el último mes'},'3m':{label:'3M',long:'los últimos 3 meses'},'1y':{label:'1A',long:'el último año'}};
let chartRange=localStorage.getItem('trace_chart_range');if(!CHART_RANGES[chartRange])chartRange='1m';
let selectedTicker=null;
let activeTraceTicker=null;
/* GET /v1/portfolio/history?range=… → [{day, value, invested}] */
function portfolioSeriesForRange(range=chartRange){return API.portfolioHistory(range)}
function chartRangeNavHTML(fn='setChartRange',cur=chartRange){return `<div class="chart-range-nav" role="group" aria-label="Periodo de la gráfica">${Object.entries(CHART_RANGES).map(([k,v])=>`<button type="button" class="chart-range-btn ${cur===k?'active':''}" aria-pressed="${cur===k}" aria-label="${escapeHTML(v.long)}" onclick="event.stopPropagation();${fn}('${k}')">${v.label}</button>`).join('')}</div>`}
function setChartRange(r){if(!CHART_RANGES[r])return;chartRange=r;localStorage.setItem('trace_chart_range',r);if($('todayMain')&&todayMode==='tech')renderTodayMain(PORTFOLIO.length?todayModel():null);renderPfHistory();bindLiveCharts()}
/* Gráfica «Cómo ha ido tu portafolio»: lo que vale (línea) frente a lo que pagaste (punteada). */
function liveDayChartHTML(chartId,pts,{label,value,meta,k,cls,aria}){
  const top=`<div class="daychart-top"><div><span class="stat-label">${label}</span><span class="daychart-val" id="${chartId}-val" data-final="${value}">${value}</span></div><span class="daychart-meta" id="${chartId}-meta">${meta||''}</span></div>`;
  if(!pts||pts.length<2)return `<div class="daychart ${k||'flat'} ${cls||''}">${top}${chartRangeNavHTML()}<p class="chart-empty">Tu gráfica empieza ${pts&&pts.length?'hoy':'con tu primera compra'}. Cada día de mercado suma un punto.</p></div>`;
  const s=pts.map(p=>p.value),inv=pts.map(p=>p.invested);
  const w=600,h=150,{min,rg}=scaleOf([...s,...inv],0.008),pad=10;
  const X=i=>(i/(s.length-1))*w,Y=v=>pad+(h-2*pad)*(1-(v-min)/rg);
  const path=a=>a.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
  const d=path(s),di=path(inv);
  const last=s[s.length-1],lx=X(s.length-1).toFixed(1),ly=Y(last).toFixed(1);
  return `<div class="daychart daychart-live ${k} ${cls||''}" data-live-chart="${chartId}">${top}${chartRangeNavHTML()}<div class="daychart-plot" role="img" aria-label="${escapeHTML(aria)}"><div class="chart-tip" id="${chartId}-tip" hidden></div><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}L${w} ${h}L0 ${h}Z" fill="url(#g-${k})"/><path class="inv" d="${di}"/><path class="line" d="${d}"/><line class="chart-hover-line" x1="${lx}" y1="${pad}" x2="${lx}" y2="${h-pad}" opacity="0"/><circle class="chart-hover-dot" r="5" cx="${lx}" cy="${ly}" stroke="var(--${k==='up'?'up':k==='down'?'down':'faint'})" fill="#fff"/></svg></div><div class="daychart-axis"><span>${escapeHTML(dayTxt(pts[0].day))}</span><span>Hoy</span></div><div class="chart-legend"><span><i></i>Lo que vale</span><span><i class="inv-k"></i>Lo que pagaste</span></div></div>`;
}
function bindLiveCharts(){
  document.querySelectorAll('[data-live-chart]').forEach(root=>{
    if(root.dataset.liveBound==='1')return;
    root.dataset.liveBound='1';
    const plot=root.querySelector('.daychart-plot'),svg=plot&&plot.querySelector('svg'),tip=root.querySelector('.chart-tip'),metaEl=root.querySelector('[id$="-meta"]'),valEl=root.querySelector('[id$="-val"]');
    if(!plot||!svg||!tip)return;
    const pts=portfolioSeriesForRange();
    if(pts.length<2)return;
    const s=pts.map(p=>p.value),inv=pts.map(p=>p.invested);
    const w=600,h=150,{min,rg}=scaleOf([...s,...inv],0.008),pad=10;
    const X=i=>(i/(s.length-1))*w,Y=v=>pad+(h-2*pad)*(1-(v-min)/rg);
    const line=svg.querySelector('.chart-hover-line'),dot=svg.querySelector('.chart-hover-dot');
    const total=valEl?(valEl.dataset.final||valEl.textContent):'';
    const idle='Arrastra sobre la gráfica para ver cada día';
    const show=(i)=>{
      const idx=Math.max(0,Math.min(s.length-1,i)),v=s[idx],x=X(idx),y=Y(v),g=v-inv[idx];
      if(line){line.setAttribute('x1',x);line.setAttribute('x2',x);line.setAttribute('opacity','1')}
      if(dot){dot.setAttribute('cx',x);dot.setAttribute('cy',y)}
      tip.hidden=false;tip.style.left=(idx/(s.length-1)*100)+'%';tip.style.top='0';
      tip.textContent=`${dayTxt(pts[idx].day)} · ${formatCOP(v)}`;
      if(valEl)valEl.textContent=formatCOP(v);
      if(metaEl)metaEl.textContent=`Pagaste ${formatCOP(inv[idx])} · ${g>=0?'ganabas':'perdías'} ${formatCOP(Math.abs(g))}`;
    };
    plot.addEventListener('pointermove',e=>{const r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*w;show(Math.round((x/w)*(s.length-1)))});
    plot.addEventListener('pointerleave',()=>{tip.hidden=true;if(line)line.setAttribute('opacity','0');if(valEl)valEl.textContent=total;if(metaEl)metaEl.textContent=idle});
    if(metaEl)metaEl.textContent=idle;
  });
}
function setActiveTrace(t){activeTraceTicker=activeTraceTicker===t?null:t;renderTodayMain(PORTFOLIO.length?todayModel():null)}
function highlightTicker(t){selectedTicker=selectedTicker===t?null:t;renderHoldings()}
function clearTickerHighlight(){selectedTicker=null;renderHoldings()}
function goHome(){openInsights()}
function openInsights(){storySlide=0;storyPick=null;closeMoreSheet(false);toggleExtras(false);closeSearch();switchView('today',{todayMode:'story'})}
function openTodayPage(){closeMoreSheet(false);toggleExtras(false);closeSearch();switchView('today',{todayMode:'tech'})}
function goBack(){
  if(document.body.dataset.currentView==='today'&&todayMode==='story'&&storySlide>0){storySlide--;renderTodayStory(PORTFOLIO.length?todayModel():null);return}
  if(!(document.body.dataset.currentView==='today'&&todayMode==='story'))goHome();
}
function openTodayDetail(mode){closeMoreSheet(false);switchView('today',{todayMode:mode})}
const chgKey=c=>c>0?'up':c<0?'down':'flat';
function scaleOf(s,minPct){const lo=Math.min(...s),hi=Math.max(...s),rg=Math.max(hi-lo,Math.abs(s[0])*minPct)||1,mid=(hi+lo)/2;return{min:mid-rg/2,rg}}
function sparkSVG(s,k,w=88,h=30){if(!s||s.length<2)return'';const {min,rg}=scaleOf(s,0.02),pad=2;const X=i=>(i/(s.length-1))*w,Y=v=>pad+(h-2*pad)*(1-(v-min)/rg);const d=s.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');const by=Y(s[0]).toFixed(1);return `<svg class="spark ${k}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="${by}" x2="${w}" y2="${by}"/><path class="area" d="${d}L${w} ${h}L0 ${h}Z" fill="url(#g-${k})"/><path class="line" d="${d}"/></svg>`}
function dayChartHTML(s,{label,value,meta='',k='flat',cls='',aria='',axis=['Apertura','Ahora']}){if(!s||s.length<2)return'';const w=600,h=150,{min,rg}=scaleOf(s,0.008),pad=10;const X=i=>(i/(s.length-1))*w,Y=v=>pad+(h-2*pad)*(1-(v-min)/rg);const d=s.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');const by=Y(s[0]).toFixed(1);return `<div class="daychart ${k} ${cls}"><div class="daychart-top"><div><span class="stat-label">${label}</span><span class="daychart-val">${value}</span></div><span class="daychart-meta">${meta}</span></div><div class="daychart-plot" role="img" aria-label="${escapeHTML(aria)}"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><line class="base" x1="0" y1="${by}" x2="${w}" y2="${by}"/><path d="${d}L${w} ${h}L0 ${h}Z" fill="url(#g-${k})"/><path class="line" d="${d}"/></svg><span class="daychart-dot" style="left:100%;top:${(Y(s[s.length-1])/h*100).toFixed(1)}%"></span></div><div class="daychart-axis"><span>${escapeHTML(axis[0])}</span><span>${escapeHTML(axis[1])}</span></div></div>`}
function tickItem(a,dup){const x=dup?' class="tick dup" tabindex="-1" aria-hidden="true"':' class="tick"';const k=chgKey(a.chg);return a.t==='COLCAP'?`<button type="button"${x.replace('tick','tick tick-index')} onclick="switchView('market')"><b>COLCAP</b>${COLCAP.proxy?'':`<span class="px">${NUM_FMT.format(COLCAP.valor)}</span>`}<span class="chg ${k}">${dirArrow(k)} ${t4pct(a.chg)} %</span></button>`:`<button type="button"${x} onclick="openMarketAsset('${escapeHTML(a.t)}')">${logoHTML(a,true)}<b>${escapeHTML(a.n)}</b><span class="px">${formatCOP(a.price)}</span><span class="chg ${k}">${dirArrow(k)} ${t4pct(a.chg)} %</span></button>`}
function renderTicker(){const el=$('tickerTrack');if(!el)return;const list=[{t:'COLCAP',chg:COLCAP.chg},...POOL_EXPANDIDO];el.innerHTML=list.map(a=>tickItem(a,false)).join('')+list.map(a=>tickItem(a,true)).join('')}
function renderLoginPreview(){const el=$('loginPreview');if(!el)return;const rows=[['ISA','+$19.700','up'],['PFBCOLOM','+$10.300','up'],['ECOPETROL','−$1.600','down']];el.innerHTML=rows.map(([t,v,k])=>{const a=assetOf(t);return `<div class="preview-row">${logoHTML(a,true)}<b>${escapeHTML(a.n)}</b>${sparkSVG(assetSeries(a),chgKey(a.chg),70,24)}<span class="chg ${k}">${v}</span></div>`}).join('')}
function saveLogoKey(){logoKey=$('logoDevKey').value.trim();if(logoKey)localStorage.setItem('logo_dev_token',logoKey);else localStorage.removeItem('logo_dev_token');closeApiModal();renderLoginPreview();renderTicker();if($('appShell').classList.contains('app-shell-active'))refreshAll();showToast(logoKey?'Clave de logos guardada':'Se quitó la clave de logos')}
const dirKey=d=>d==='Positivo'?'up':d==='Negativo'?'down':'flat';
const dirArrow=k=>k==='up'?'▲':k==='down'?'▼':'●';
const pctComma=(x,d=1)=>(Number(x)||0).toFixed(d).replace('.',',')+' %';
const assetName=t=>(POOL_EXPANDIDO.find(a=>a.t===t)||PORTFOLIO.find(a=>a.t===t)||{}).n||t;
function applyLabels(){document.querySelectorAll('.radar-filter').forEach(b=>{const k=b.dataset.radarFilter;const t=LABELS.direccion[k]||LABELS.severidad[k];if(t)b.textContent=t})}
let PORTFOLIO = [];
let chartInstance = null;
let RADAR_RESULTS = [];
let radarFilter = {impact:null,direction:null}; /* GET /v1/news acepta un impacto y una dirección a la vez */
let radarMine = true; /* mine=true: solo noticias de tus acciones */
let activeSectorFilter = 'all';
let currentUser = 'Invitado';

/* PF: lo último que respondió GET /v1/portfolio. PORTFOLIO: lo mismo con los nombres cortos de las pantallas. */
let PF=null;
const assetOf0=t=>POOL_EXPANDIDO.find(a=>a.t===t);
function loadPortfolio(){TX=readTX();return syncPortfolio()}
function syncPortfolio(){PF=API.portfolio();PORTFOLIO=PF.positions.map(p=>{const a=assetOf0(p.ticker)||{};return{t:p.ticker,n:p.name,sector:p.sector,price:p.price,chg:p.change_pct,shares:p.quantity,avg_cost:p.avg_cost,invested:p.invested,value:p.value,gain:p.gain,gain_pct:p.gain_pct,realized_gain:p.realized_gain,day_change:p.day_change,weight_pct:p.weight_pct,updated_at:a.updated_at,drivers:a.drivers}});return PORTFOLIO}
function savePortfolio(){syncPortfolio()}
const COP_FMT=new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0});
const NUM_FMT=new Intl.NumberFormat('es-CO',{maximumFractionDigits:1});
const QTY_FMT=new Intl.NumberFormat('es-CO',{maximumFractionDigits:2});
const qtyTxt=q=>QTY_FMT.format(Number(q)||0);
const timeTxt=iso=>new Date(iso).toLocaleTimeString('es-CO',{hour:'numeric',minute:'2-digit'});
const dayTxt=d=>new Date(String(d).slice(0,10)+'T12:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'short'});
/* «Precios de las 3:45 p. m.»: viene de updated_at (AssetOut y PortfolioOut). */
function freshTxt(){const d=new Date(MARKET_UPDATED_AT);return ISO(d)===HOY_ISO?`Precios de las ${timeTxt(MARKET_UPDATED_AT)}, con unos 15 minutos de retraso`:`Precios del cierre del ${d.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}`}
function freshShort(){const d=new Date(MARKET_UPDATED_AT);return ISO(d)===HOY_ISO?'Precios de las '+timeTxt(MARKET_UPDATED_AT):'Precios del último cierre'}
function formatCOP(num){return COP_FMT.format(Number(num)||0)}
function formatCompactCOP(num){const n=Number(num)||0;return n>=1e6?'$'+NUM_FMT.format(n/1e6)+' M':n>=1e3?'$'+Math.round(n/1e3)+' mil':formatCOP(n)}
function fmtPct(n,d=1){n=Number(n)||0;return (n>0?'+':n<0?'−':'')+Math.abs(n).toFixed(d).replace('.',',')+' %'}
const pctTxt=x=>(x>0&&x<1?'Menos de 1':Math.round(x))+' %';
const dots=n=>String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const parseCOP=s=>Number(String(s??'').replace(/\D/g,''))||0;
const chgTxt=c=>(c>=0?'▲ Subió ':'▼ Bajó ')+Math.abs(c).toFixed(1).replace('.',',')+' %';
function showToast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>el.classList.remove('show'),2800)}
function escapeHTML(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function parseMarkdown(text){if(!text)return '';let html=escapeHTML(text);html=html.replace(/^### (.*)$/gim,'<h4>$1</h4>').replace(/^## (.*)$/gim,'<h3>$1</h3>').replace(/^# (.*)$/gim,'<h2>$1</h2>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/^\s*[-*]\s+(.*)$/gim,'<li>$1</li>').replace(/\n/g,'<br>');return html}

/* ======================= ESTADO DE LA APP ======================= */
/* Entrar: en la app real, Supabase entrega el token (invitado o enlace mágico) y GET /v1/me dice quién es. */
function enterApp(user){currentUser=user||'Invitado';localStorage.setItem('trace_session',currentUser);$('loginScreen').style.display='none';setAvatar(currentUser);loadPortfolio();CHAT_HISTORY=[];$('chatLog').innerHTML='';updateApiStatus();if(!TX.length){startOnboarding();return}bootApp()}
function bootApp(){$('appShell').classList.add('app-shell-active');refreshAll();startChat();switchView('today',{todayMode:'story'});showWelcome();syncAmbient()}
function showWelcome(){$('welcomeBanner').hidden=!!localStorage.getItem('trace_welcome_seen')}
function dismissWelcome(){localStorage.setItem('trace_welcome_seen','1');$('welcomeBanner').hidden=true}
/* ---- ONBOARDING ---- */
const OB={step:1,picked:[],amount:5000000};
function startOnboarding(){OB.step=1;OB.picked=[];OB.amount=5000000;$('appShell').classList.remove('app-shell-active');$('loginScreen').style.display='none';$('onboarding').classList.add('active');renderOnboarding()}
function obSeedBtn(){return `<button class="btn-secondary" type="button" onclick="obUseSeed()">Usar un portafolio de ejemplo</button>`}
function renderOnboarding(){
  const hint=$('obTopHint');if(hint)hint.textContent=OB.step===1?'Toca las empresas que quieres practicar':'Define un monto de práctica en pesos';
  if(OB.step===1){
    $('obBody').innerHTML=`<h1 class="ob-h" id="obTitle" tabindex="-1">Elige empresas colombianas para practicar</h1><p class="ob-p">Toca una tarjeta para marcarla. Puedes elegir entre 1 y 5. No es dinero real: es tu portafolio de práctica.</p><p class="ob-count" id="obCount" aria-live="polite"></p><div class="ob-grid">${POOL_EXPANDIDO.map(a=>`<button type="button" class="ob-card" data-t="${escapeHTML(a.t)}" aria-pressed="false" onclick="obToggle('${escapeHTML(a.t)}')"><span class="ob-check" aria-hidden="true"><svg class="ico"><use href="#i-check"/></svg></span>${logoHTML(a)}<span class="ob-name">${escapeHTML(a.n)}</span><span class="ob-sector">${escapeHTML(a.sector)}</span><span class="ob-foot-row"><span class="ob-chg-lbl">Precio de hoy</span><span class="ob-chg ${a.chg>=0?'positive':'negative'}">${formatCOP(a.price)} · ${chgTxt(a.chg)}</span></span></button>`).join('')}</div>`;
    $('obFoot').innerHTML=`<button class="btn-primary" type="button" id="obNext" onclick="obGo(2)">Siguiente: cuánto practicar</button>${obSeedBtn()}`;obUpdate()
  }else{
    const n=OB.picked.length;
    $('obBody').innerHTML=`<div class="ob-narrow"><button class="btn-ghost ob-back" type="button" onclick="obGo(1)"><svg class="ico" aria-hidden="true"><use href="#i-back"/></svg>Cambiar acciones</button><h1 class="ob-h" id="obTitle" tabindex="-1">¿Con cuántos pesos quieres practicar?</h1><p class="ob-p">El monto se reparte a partes iguales entre tus ${n} ${n===1?'empresa':'empresas'}. Se registra como una compra de hoy, al último precio.</p><p class="field-label" style="margin-bottom:10px">Elige un monto rápido</p><div class="ob-quick">${[1000000,5000000,10000000].map(v=>`<button type="button" data-v="${v}" aria-pressed="false" onclick="obSetAmount(${v})">${formatCOP(v)}</button>`).join('')}</div><label class="field-label" for="obAmount">O escribe otro monto en pesos</label><input class="field-input" id="obAmount" inputmode="numeric" autocomplete="off" placeholder="Ej. $5.000.000" oninput="obAmountInput(this.value)"><p class="ob-split" id="obSplit" aria-live="polite"></p></div>`;
    $('obFoot').innerHTML=`<button class="btn-primary" type="button" id="obNext" onclick="obFinish()">Entrar a The Trace</button>${obSeedBtn()}`;$('obAmount').value=dots(OB.amount);obAmountUI()
  }
  $('onboarding').scrollTop=0;$('obTitle').focus({preventScroll:true})
}
function obUpdate(){const n=OB.picked.length;const el=$('obCount');document.querySelectorAll('.ob-card').forEach(b=>b.setAttribute('aria-pressed',String(OB.picked.includes(b.dataset.t))));if(el){el.classList.toggle('is-ready',n>0);el.textContent=n?`Tienes ${n} ${n===1?'empresa marcada':'empresas marcadas'}. Cuando quieras, pulsa «Siguiente».`:'Marca al menos una empresa para continuar.'}const b=$('obNext');if(b){b.disabled=!n;b.textContent=n?'Siguiente: cuánto practicar':'Marca al menos una empresa'}}
function obToggle(tk){const i=OB.picked.indexOf(tk);if(i>=0)OB.picked.splice(i,1);else if(OB.picked.length>=5){showToast('Puedes elegir hasta 5 acciones');return}else OB.picked.push(tk);obUpdate()}
function obGo(s){if(s===2&&!OB.picked.length)return;OB.step=s;renderOnboarding()}
function obSetAmount(n){OB.amount=n;$('obAmount').value=dots(n);obAmountUI()}
function obAmountInput(v){OB.amount=parseCOP(v);$('obAmount').value=OB.amount?dots(OB.amount):'';obAmountUI()}
function obAmountUI(){document.querySelectorAll('.ob-quick button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.v)===OB.amount)));const n=OB.picked.length;$('obSplit').textContent=OB.amount>0?`Serían ${formatCOP(OB.amount/n)} en cada acción.`:'Escribe un monto mayor a $0.';$('obNext').disabled=OB.amount<=0}
/* Onboarding: una compra por empresa con POST /v1/portfolio/transactions {ticker, kind:'buy', amount}. */
function obFinish(){const n=OB.picked.length;if(!n||OB.amount<=0)return;for(const tk of OB.picked){const r=API.addTransaction({ticker:tk,kind:'buy',amount:Math.floor(OB.amount/n)});if(!r.ok){showToast(r.detail);return}}obDone()}
function obUseSeed(){API.reset();TX=seedTransactions();writeTX();obDone()}
function obDone(){syncPortfolio();$('onboarding').classList.remove('active');bootApp()}
function setAvatar(value){const initials=(value==='Invitado'?'TR':String(value).split('@')[0].slice(0,2).toUpperCase());document.getElementById('avatarCircle').textContent=initials;renderAccount()}
const $=id=>document.getElementById(id);
const EXTRA_VIEWS=['insights','radar','market'];
let currentView='today';
function switchView(name,opts={}){
  if(name!=='chat'&&!$('view-'+name))name='today';
  const prev=currentView;
  if(name!=='today'){
    document.body.classList.remove('today-mode-story','today-mode-studio','today-mode-tech');
    stopDotField();
    document.querySelectorAll('.today-mode').forEach(el=>{el.classList.remove('active');el.hidden=true});
  }
  currentView=name;const isExtra=EXTRA_VIEWS.includes(name);
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));
  document.querySelectorAll('[data-view]').forEach(b=>{
    const v=b.dataset.view;
    const storyOn=name==='today'&&(opts.todayMode||todayMode)==='story';
    const on=v==='story'?storyOn:(v==='today'?name==='today'&&!storyOn:v===name);
    b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')
  });
  document.body.dataset.currentView=name;document.body.classList.toggle('in-extra',isExtra);
  $('moreBtn').classList.toggle('active',isExtra);
  const deepToday=name==='today'&&(opts.todayMode||todayMode)!=='story';
  $('extrasToggle').classList.toggle('has-active',isExtra||deepToday);toggleExtras(false);
  closeMoreSheet(false);
  if(name==='today')setTodayMode(opts.todayMode||'story');
  else if(prev==='today'){const tick=$('ticker');if(tick)tick.style.display=''}
  try{window.scrollTo({top:0,behavior:'instant'})}catch{window.scrollTo(0,0)}
  if(name==='portfolio'){renderHoldings();if(chartInstance)requestAnimationFrame(()=>chartInstance.resize())}
  if(name==='insights'){renderInsights();hideAskAI()}
  if(name==='radar'){updateRadarCoverage();renderRadar()}
  if(name==='chat'){startChat();renderChatContext();hideAskAI();requestAnimationFrame(()=>{const i=$('chatInput');if(i)i.focus()})}
  if(name==='today'&&todayMode==='story'){const tick=$('ticker');if(tick)tick.style.display='none';requestAnimationFrame(()=>{initTodayReveals();initDotField()})}
  else if(name==='today'&&todayMode==='studio'){const tick=$('ticker');if(tick)tick.style.display='none';requestAnimationFrame(()=>initTodayReveals())}
  else{const tick=$('ticker');if(tick)tick.style.display=''}
  if(name==='today'&&todayMode==='tech')requestAnimationFrame(()=>bindLiveCharts());
  syncAmbient();
}
/* Funcionalidades extra: menú desplegable (escritorio) y hoja inferior «Más» (móvil) */
function toggleExtras(force){const g=$('extrasGroup'),t=$('extrasToggle');const open=typeof force==='boolean'?force:g.hidden;g.hidden=!open;t.setAttribute('aria-expanded',String(open));if(open){closeAccountMenu(false);closeSearch();const f=g.querySelector('.menu-item');if(f&&typeof force!=='boolean')f.focus()}}
function extrasOpen(){return !$('extrasGroup').hidden}
document.addEventListener('click',e=>{if(extrasOpen()&&!e.target.closest('.more-wrap'))toggleExtras(false)});
let moreReturnFocus=null;
function sheetIsOpen(){return $('moreSheet').classList.contains('open')}
function openMoreSheet(){if(sheetIsOpen())return;moreReturnFocus=document.activeElement;$('moreOverlay').classList.add('open');$('moreSheet').classList.add('open');document.body.classList.add('more-open');$('moreBtn').setAttribute('aria-expanded','true');setTimeout(()=>{const c=$('moreSheet').querySelector('.sheet-close');if(c)c.focus()},30)}
function closeMoreSheet(restoreFocus=true){if(!sheetIsOpen())return;$('moreOverlay').classList.remove('open');$('moreSheet').classList.remove('open');document.body.classList.remove('more-open');$('moreBtn').setAttribute('aria-expanded','false');if(restoreFocus&&moreReturnFocus&&moreReturnFocus.focus)moreReturnFocus.focus();moreReturnFocus=null}
function resetDemo(){closeMoreSheet(false);$('resetModal').classList.add('active')}
function closeResetModal(){$('resetModal').classList.remove('active')}
/* «Empezar de nuevo»: POST /v1/portfolio/reset borra todos tus movimientos. Las preferencias de pantalla también se limpian. */
function doResetDemo(){closeResetModal();API.reset();const keep=k=>k.startsWith('trace_tx_')||k.startsWith('trace_waitlist_')||k.startsWith('trace_ai_')||k==='trace_session';const ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('trace_')&&!keep(k))ks.push(k)}ks.forEach(k=>localStorage.removeItem(k));syncPortfolio();activeSectorFilter='all';RADAR_RESULTS=[];CHAT_HISTORY=[];$('chatLog').innerHTML='';$('bellDot').classList.remove('show');setRadarFilter('all');closeAssetDrawer();closeAddModal();startOnboarding()}
/* Búsqueda: en móvil se colapsa a un ícono */
function openSearchMobile(){$('topbar').classList.add('search-open');$('searchToggle').setAttribute('aria-expanded','true');$('globalSearch').focus()}
function refreshAll(){syncPortfolio();renderTicker();renderHoldings();renderMarket();renderInsights();updateRadarCoverage();updatePortfolioTime();renderToday();renderAds();renderChatContext()}
function updatePortfolioTime(){$('portfolioUpdated').textContent=freshShort();$('portfolioUpdated').title=freshTxt()}

/* Los totales salen de PortfolioOut.summary: no se recalculan en el navegador. */
function calculatePortfolio(){const s=PF&&PF.summary;if(!s||!PORTFOLIO.length)return{total:0,delta:0,sectorTotals:{},sectors:[],weightedChange:0,invested:0,gain:0,gain_pct:0,realized:s?s.realized_gain:0};const sectorTotals={};s.sectors.forEach(x=>sectorTotals[x.sector]=x.value);return{total:s.total_value,delta:s.day_change,sectorTotals,sectors:s.sectors.map(x=>[x.sector,x.value]),weightedChange:s.day_change_pct,invested:s.invested,gain:s.gain,gain_pct:s.gain_pct,realized:s.realized_gain}}
function portfolioWeight(t){const p=PORTFOLIO.find(x=>x.t===t);return p?p.weight_pct:0}
const gainHTML=(g,pct)=>{const k=chgKey(Math.round(g));return `<span class="chg ${k}">${escapeHTML(signedCOP(g))}${pct==null?'':` (${fmtPct(pct)})`}</span>`};
/* Cada acción: PositionOut (cantidad, costo promedio, valor, ganancia o pérdida). */
function holdCard(p,i,c){const w=p.weight_pct,up=p.chg>=0,nm=escapeHTML(p.n),col=sectorColor(p.sector);const sel=selectedTicker===p.t,dim=selectedTicker&&selectedTicker!==p.t;return `<article class="holding${sel?' is-selected':''}${dim?' is-dimmed':''}"><div class="holding-id" role="button" tabindex="0" aria-label="Ver detalle de ${nm}" onclick="highlightTicker('${escapeHTML(p.t)}');openAssetDrawer(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();highlightTicker('${escapeHTML(p.t)}');openAssetDrawer(${i})}">${logoHTML(p)}<div class="holding-name"><strong>${nm}</strong><div class="holding-meta"><span>${escapeHTML(p.t)}</span><span><i class="sec-dot" style="--c:${col}"></i>${escapeHTML(p.sector)}</span></div></div><div class="holding-move">${sparkSVG(assetSeries(p),chgKey(p.chg),84,30)}<span class="chg ${up?'up':'down'}">${chgTxt(p.chg)}</span></div></div><div><div class="weight-meta"><span>Qué parte de tu dinero</span><strong>${pctTxt(w)}</strong></div><div class="meter"><span style="width:${Math.min(w,100)}%;--c:${col}"></span></div></div><div class="hold-actions"><button class="btn-secondary" type="button" onclick="openTradeModal('buy','${escapeHTML(p.t)}')">Comprar</button><button class="btn-secondary" type="button" onclick="openTradeModal('sell','${escapeHTML(p.t)}')">Vender</button></div><dl class="hold-stats"><div><dt>Tienes</dt><dd>${qtyTxt(p.shares)} acciones</dd></div><div><dt>Costo promedio</dt><dd>${formatCOP(p.avg_cost)}</dd></div><div><dt>Vale hoy</dt><dd>${formatCOP(p.value)}</dd></div><div><dt>Ganancia o pérdida</dt><dd>${gainHTML(p.gain,p.gain_pct)}</dd></div></dl></article>`}
function renderConcNotice(c){const el=$('concNotice'),top=c.sectors[0],w=top&&c.total?top[1]/c.total*100:0;if(w<40){el.hidden=true;return}el.hidden=false;el.textContent=`${w>=55?'Más de la mitad':w>=45?'Casi la mitad':'Una parte grande'} de tu dinero (${Math.round(w)} %) está en ${top[0]}. Si a ese sector le va mal, tu portafolio lo sentirá más.`}
function renderHoldings(){const c=calculatePortfolio();if(activeSectorFilter!=='all'&&!c.sectorTotals[activeSectorFilter])activeSectorFilter='all';
  const top=c.sectors[0],topPct=top&&c.total?top[1]/c.total*100:0;
  $('heroTotal').textContent=formatCOP(c.total);$('heroAssets').textContent=PORTFOLIO.length+(PORTFOLIO.length===1?' acción':' acciones');$('heroTopSector').textContent=top?`${top[0]} (${pctTxt(topPct)})`:'—';
  $('heroInvested').textContent=formatCOP(c.invested);
  $('heroGain').innerHTML=(c.total?gainHTML(c.gain,c.gain_pct):'—')+(Math.round(c.realized)?`<small class="summary-real">Con lo que ya vendiste: ${escapeHTML(signedCOP(c.realized))}</small>`:'');
  const up=c.delta>=0,ch=$('heroChange'),flat=Math.round(c.delta)===0;ch.textContent=!c.total?'—':flat?'Sin cambios hoy':(up?'▲ Hoy subió ':'▼ Hoy bajó ')+formatCOP(Math.abs(c.delta))+' ('+fmtPct(c.weightedChange,2)+')';ch.className='summary-chg '+(!c.total||flat?'flat':up?'up':'down');
  $('colcapLine').textContent=COLCAP.proxy?`Como referencia, el COLCAP, ${COLCAP.frase}, hoy ${COLCAP.chg>=0?'subió':'bajó'} ${t4pct(COLCAP.chg)} %.`:`Como referencia, el COLCAP, ${COLCAP.frase}, está en ${NUM_FMT.format(COLCAP.valor)} puntos y hoy ${COLCAP.chg>=0?'subió':'bajó'} ${t4pct(COLCAP.chg)} %.`;
  renderConcNotice(c);
  const list=PORTFOLIO.map((p,i)=>[p,i]).filter(([p])=>activeSectorFilter==='all'||p.sector===activeSectorFilter);
  $('holdingsBody').innerHTML=list.map(([p,i])=>holdCard(p,i,c)).join('')||`<div class="empty-state"><div class="empty-icon"><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></div><h3>Tu portafolio está vacío</h3><p>Compra una acción de práctica para empezar.</p><button class="btn-primary" type="button" onclick="openTradeModal('buy')">Comprar una acción</button></div>`;
  renderSectorFilters(c);renderInteractiveChart(c);renderPfHistory();renderTxList()
}
function renderSectorFilters(c){const sectors=['all',...c.sectors.map(x=>x[0])];document.getElementById('sectorFilters').innerHTML=sectors.map(s=>`<button class="filter-chip ${activeSectorFilter===s?'active':''}" type="button" aria-pressed="${activeSectorFilter===s}" onclick="setSectorFilter('${escapeHTML(s)}')">${s==='all'?'Todos':escapeHTML(s)}</button>`).join('')}
function setSectorFilter(sector){activeSectorFilter=sector;renderHoldings();showToast(sector==='all'?'Mostrando todo el portafolio':'Filtrado por '+sector)}
function clearSectorFilter(){activeSectorFilter='all';clearTickerHighlight();renderHoldings()}
function renderInteractiveChart(c){
  const items=PORTFOLIO.map(p=>({t:p.t,n:p.n,sector:p.sector,v:p.shares*p.price}));
  const labels=items.map(x=>x.n),values=items.map(x=>x.v),colors=items.map(x=>sectorColor(x.sector));
  const ctx=document.getElementById('portfolioChart').getContext('2d');
  if(chartInstance){chartInstance.destroy();chartInstance=null}
  if(typeof Chart!=='undefined')chartInstance=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data:values,backgroundColor:colors,borderWidth:3,borderColor:'#101218',hoverOffset:10,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{legend:{display:false},tooltip:{backgroundColor:'#13182B',padding:10,cornerRadius:8,callbacks:{label:(context)=>{const v=context.raw||0;return `${context.label}: ${formatCompactCOP(v)}, ${pctTxt(c.total?v/c.total*100:0)} de tu dinero`}}}},onClick:(_,elements)=>{if(elements[0])highlightTicker(items[elements[0].index].t)}}});
  const focus=selectedTicker?items.find(x=>x.t===selectedTicker):null;
  const sel=focus||(activeSectorFilter!=='all'?items.find(x=>x.sector===activeSectorFilter):null)||items[0];
  document.getElementById('chartCenterValue').textContent=sel&&c.total?pctTxt(sel.v/c.total*100):'0 %';
  document.getElementById('chartCenterLabel').textContent=sel?sel.n:'sin acciones';
  document.getElementById('sectorList').innerHTML=items.map(it=>{const w=c.total?it.v/c.total*100:0;const on=selectedTicker===it.t;return `<button type="button" class="sector-item ${on?'selected':''}" aria-pressed="${on}" onclick="highlightTicker('${escapeHTML(it.t)}')"><span class="sec-dot" style="--c:${sectorColor(it.sector)}"></span><span class="sector-name">${escapeHTML(it.n)}</span>${logoHTML({t:it.t,n:it.n,sector:it.sector},true)}<span class="sector-pct">${pctTxt(w)}</span></button>`}).join('');
}
/* «Cómo ha ido tu portafolio»: GET /v1/portfolio/history. */
function renderPfHistory(){const el=$('pfHistory');if(!el)return;const c=calculatePortfolio();el.innerHTML=`<h2 class="panel-title" id="pfHistTitle">Cómo ha ido tu portafolio</h2><p class="panel-sub">Cada día de mercado, cuánto valían tus acciones frente a lo que pagaste por ellas.</p>${liveDayChartHTML('pfHistChart',portfolioSeriesForRange(),{label:'Cuánto vale hoy',value:formatCOP(c.total),meta:'',k:chgKey(Math.round(c.gain)),aria:'Cómo ha ido tu portafolio frente a lo que pagaste'})}`;requestAnimationFrame(bindLiveCharts)}
/* «Tus movimientos»: GET /v1/portfolio/transactions y DELETE /v1/portfolio/transactions/{id}. */
function renderTxList(){const el=$('txList');if(!el)return;const txs=API.transactions();if(!txs.length){el.innerHTML='<p class="t-empty tx-empty">Aún no tienes movimientos. Tu primera compra aparecerá aquí.</p>';return}
  el.innerHTML=txs.map(m=>{const a=assetOf0(m.ticker)||{t:m.ticker,n:m.ticker,sector:''},buy=m.kind==='buy';return `<div class="tx-row">${logoHTML(a,true)}<div class="tx-main"><strong>${escapeHTML(a.n)}</strong><span>${escapeHTML(dayTxt(m.day))} · ${qtyTxt(m.quantity)} acciones a ${formatCOP(m.price)}</span></div><span class="tx-kind ${buy?'buy':'sell'}">${buy?'Compra':'Venta'}</span><strong class="tx-total">${formatCOP(m.quantity*m.price)}</strong><button class="btn-ghost btn-sm tx-del" type="button" aria-label="Borrar ${buy?'la compra':'la venta'} de ${escapeHTML(a.n)} del ${escapeHTML(dayTxt(m.day))}" onclick="deleteTx(${m.id})">Borrar</button></div>`}).join('')}
function deleteTx(id){const res=API.deleteTransaction(id);if(!res.ok){showToast(res.detail);return}syncPortfolio();refreshAll();showToast('Borraste el movimiento')}

/* ---- Comprar o vender: POST /v1/portfolio/transactions ----
   Se manda la cantidad de acciones O el monto en pesos. Fecha y precio son opcionales:
   vacíos, el servidor usa hoy y el último precio. */
const TRADE={kind:'buy',mode:'amount'};
function tradeList(){return TRADE.kind==='sell'?PORTFOLIO.map(p=>assetOf0(p.t)).filter(Boolean):POOL_EXPANDIDO}
function fillTradeSelect(t){const sel=$('addTickerSelect');const list=tradeList();sel.innerHTML=list.map(a=>`<option value="${escapeHTML(a.t)}">${escapeHTML(a.n)} (${escapeHTML(a.sector)})</option>`).join('');if(t&&list.some(a=>a.t===t))sel.value=t}
function openTradeModal(kind='buy',t){if(kind==='sell'&&!PORTFOLIO.length){showToast('Aún no tienes acciones para vender');return}TRADE.kind=kind;TRADE.mode=kind==='sell'?'quantity':'amount';fillTradeSelect(t);$('addAmountInput').value='';const d=$('tradeDay');d.max=HOY_ISO;d.value=HOY_ISO;tradeFillPrice();tradeUI();$('addModal').classList.add('active');setTimeout(()=>$('addAmountInput').focus(),40)}
function openAddModal(){openTradeModal('buy')}
function closeAddModal(){$('addModal').classList.remove('active')}
function setTradeKind(k){if(k==='sell'&&!PORTFOLIO.length){showToast('Aún no tienes acciones para vender');return}const cur=$('addTickerSelect').value;TRADE.kind=k;fillTradeSelect(cur);tradeFillPrice();tradeUI()}
function setTradeMode(m){TRADE.mode=m;$('addAmountInput').value='';tradeUI();$('addAmountInput').focus()}
function tradeDayChange(){const d=$('tradeDay');if(d.value>HOY_ISO)d.value=HOY_ISO;tradeFillPrice();tradeUI()}
function tradeTicker(){tradeFillPrice();tradeUI()}
/* El precio se llena con el cierre de esa fecha. Se puede cambiar. */
function tradeFillPrice(){const t=$('addTickerSelect').value,d=$('tradeDay').value||HOY_ISO,a=assetOf0(t);const px=!a?0:d>=LAST_MARKET_DAY?a.price:closeOn(t,d);$('tradePrice').value=px?dots(px):''}
function tradeValue(){const raw=$('addAmountInput').value;return TRADE.mode==='amount'?parseCOP(raw):Number(String(raw).replace(/\./g,'').replace(',','.'))||0}
function tradeInput(el){if(TRADE.mode==='amount')el.value=el.value?dots(parseCOP(el.value)):'';else el.value=el.value.replace(/[^\d,]/g,'').replace(/,(?=.*,)/g,'');tradeUI()}
function tradeUI(){const buy=TRADE.kind==='buy',t=$('addTickerSelect').value,a=assetOf0(t),p=PORTFOLIO.find(x=>x.t===t);
  document.querySelectorAll('#addModal [data-kind]').forEach(b=>{const on=b.dataset.kind===TRADE.kind;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
  document.querySelectorAll('#addModal [data-mode]').forEach(b=>{const on=b.dataset.mode===TRADE.mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
  $('addTitle').textContent=buy?'Comprar acciones':'Vender acciones';
  $('tradeSubmit').textContent=buy?'Registrar compra':'Registrar venta';
  $('addAmountLbl').textContent=TRADE.mode==='amount'?(buy?'Cuánto quieres invertir (pesos)':'Cuánto quieres recibir (pesos)'):(buy?'Cuántas acciones quieres comprar':'Cuántas acciones quieres vender');
  $('addAmountInput').placeholder=TRADE.mode==='amount'?'Ej. $1.000.000':'Ej. 10';
  $('addAmountInput').inputMode=TRADE.mode==='amount'?'numeric':'decimal';
  $('tradeHave').textContent=p?`Tienes ${qtyTxt(p.shares)} acciones de ${p.n}, con un costo promedio de ${formatCOP(p.avg_cost)}.`:a?`Aún no tienes acciones de ${a.n}.`:'';
  const v=tradeValue(),px=parseCOP($('tradePrice').value);let txt='';
  if(v>0&&px>0){const qty=TRADE.mode==='amount'?floorTo(v/px,6):v,total=TRADE.mode==='amount'?v:v*px;
    txt=TRADE.mode==='amount'?`Serían unas ${qtyTxt(qty)} acciones a ${formatCOP(px)} cada una.`:`Serían ${formatCOP(total)} en total.`;
    if(!buy&&p){const g=(px-p.avg_cost)*qty;txt+=` Con esta venta ${g>=0?'ganarías':'perderías'} unos ${formatCOP(Math.abs(g))} frente a lo que pagaste.`}}
  $('tradeCalc').textContent=txt;$('tradeErr').hidden=true}
function submitTrade(){const t=$('addTickerSelect').value,v=tradeValue(),px=parseCOP($('tradePrice').value);
  const body={ticker:t,kind:TRADE.kind,day:$('tradeDay').value||null,price:px||null};
  if(TRADE.mode==='amount')body.amount=v;else body.quantity=v;
  const res=API.addTransaction(body);
  if(!res.ok){const e=$('tradeErr');e.textContent=res.detail;e.hidden=false;return}
  syncPortfolio();closeAddModal();refreshAll();
  showToast(`${TRADE.kind==='buy'?'Compraste':'Vendiste'} ${qtyTxt(res.data.quantity)} acciones de ${assetName(t)}`)}

/* ======================= LECTURA ======================= */
function renderInsights(){const c=calculatePortfolio();const top=c.sectors[0];const topPct=top&&c.total?(top[1]/c.total*100):0;
  const head=$('insightHeadline'),sum=$('insightSummary'),sig=$('insightSignals');if(!head||!sum)return;
  document.getElementById('insightHeadline').textContent=top?`Tu dinero depende más de ${top[0]}`:'Agrega acciones para ver tu lectura';
  document.getElementById('insightSummary').textContent=top?`Cerca de ${topPct.toFixed(0)} % de tu dinero está en ese sector. Si le va mal, lo sientes más en el total.`:'Necesitamos al menos una acción para armar la lectura.';
  const relevant=localRadarResults(true);
  if(sig)sig.innerHTML=relevant.length?relevant.slice(0,3).map(n=>{const a=assetOf(n.t);return `<button type="button" class="signal" onclick="openNewsForAsset('${escapeHTML(n.t)}')"><span><span class="signal-row">${tagHTML(n.direccion)}<span class="signal-co">${logoHTML(a,true)}${escapeHTML(a.n)}</span></span><h3>${escapeHTML(n.titulo)}</h3><p>${pctComma(portfolioWeight(n.t))} de tu dinero</p></span>${mediaHTML(photoFor(n),{w:180,sector:a.sector})}</button>`}).join(''):`<div class="empty-state"><div class="empty-icon"><svg class="ico" aria-hidden="true"><use href="#i-radar"/></svg></div><h3>Sin noticias por ahora</h3><p>Hoy no hay noticias sobre tus acciones.</p></div>`}

/* ======================= DETALLE DE ACCIÓN ======================= */
function drawerMetaHTML(a){return `<span>${escapeHTML(a.t)}</span><span><i class="sec-dot" style="--c:${sectorColor(a.sector)}"></i>${escapeHTML(a.sector)}</span>`}
/* Detalle de una acción: AssetOut + su historial (GET /v1/market/assets/{ticker}/history)
   y, si la tienes, tu posición (PositionOut). Sirve para las de tu portafolio y para las del mercado. */
let drawerTicker=null,drawerRange='1m';
function openAssetDrawer(index){const p=PORTFOLIO[index];if(p)openAssetDetail(p.t)}
function setDrawerRange(r){if(!CHART_RANGES[r])return;drawerRange=r;if(drawerTicker)openAssetDetail(drawerTicker,true)}
function drawerTrade(kind,t){closeAssetDrawer();openTradeModal(kind,t)}
function openAssetDetail(t,keepScroll){const a=assetOf0(t);if(!a)return;drawerTicker=t;
  const p=PORTFOLIO.find(x=>x.t===t),k=chgKey(a.chg),news=localRadarResults(false).filter(n=>n.t===t);
  const hist=API.assetHistory(t,drawerRange),s=hist.map(c=>c.price),first=s[0]||a.price,var_=first?(a.price-first)/first*100:0;
  const tk=escapeHTML(a.t);
  $('drawerLogo').innerHTML=logoHTML(a,'lg');$('drawerTitle').textContent=a.n;$('drawerMeta').innerHTML=drawerMetaHTML(a);
  const chart=dayChartHTML(s,{label:'Precio por acción',value:formatCOP(a.price),meta:`${fmtPct(var_)} en ${CHART_RANGES[drawerRange].long}`,k:chgKey(var_),cls:'drawer-hero',aria:`Precio de ${a.n} en ${CHART_RANGES[drawerRange].long}`,axis:[hist.length?dayTxt(hist[0].day):'','Hoy']});
  const mine=p?`<div class="drawer-metric"><label>Tienes</label><strong>${qtyTxt(p.shares)} acciones</strong></div><div class="drawer-metric"><label>Costo promedio</label><strong>${formatCOP(p.avg_cost)}</strong></div><div class="drawer-metric"><label>Vale hoy en tu portafolio</label><strong>${formatCOP(p.value)}</strong></div><div class="drawer-metric"><label>Ganancia o pérdida</label><strong>${gainHTML(p.gain,p.gain_pct)}</strong></div><div class="drawer-metric"><label>Ganancia de lo que vendiste</label><strong>${Math.round(p.realized_gain)?gainHTML(p.realized_gain):'Aún no vendes'}</strong></div><div class="drawer-metric"><label>Qué parte de tu dinero</label><strong>${pctTxt(p.weight_pct)}</strong></div>`:`<div class="drawer-metric"><label>Sector</label><strong>${escapeHTML(a.sector)}</strong></div><div class="drawer-metric"><label>En tu portafolio</label><strong>Aún no la tienes</strong></div>`;
  const newsHTML=news.length?news.map(n=>`<div class="drawer-news">${mediaHTML(photoFor(n),{w:160,sector:a.sector})}<div>${tagHTML(n.direccion)}<div class="drawer-news-title">${escapeHTML(n.titulo)}</div><div class="drawer-news-dek">${escapeHTML(n.dek)}</div></div></div>`).join(''):'<p>Por ahora no hay noticias sobre esta acción.</p>';
  const actions=p?`<div class="drawer-actions"><button class="btn-secondary" type="button" onclick="drawerTrade('buy','${tk}')">Comprar</button><button class="btn-secondary" type="button" onclick="drawerTrade('sell','${tk}')">Vender</button></div><button class="btn-primary btn-lg drawer-ask" type="button" onclick="askAboutAsset('${tk}')"><span class="ia-badge inv" aria-hidden="true">IA</span>Pregúntale a la IA sobre esta acción</button>`:`<p class="drawer-note">Aún no la tienes en tu portafolio de práctica. Cómprala para que las noticias y la IA la tengan en cuenta.</p><button class="btn-primary btn-lg" type="button" onclick="drawerTrade('buy','${tk}')"><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg>Comprar esta acción</button>`;
  $('drawerBody').innerHTML=`${chart}<div class="drawer-range">${chartRangeNavHTML('setDrawerRange',drawerRange)}</div><div class="drawer-metric-grid"><div class="drawer-metric"><label>Precio</label><strong>${formatCOP(a.price)}</strong></div><div class="drawer-metric"><label>Hoy</label><strong class="${a.chg>=0?'positive':'negative'}">${chgTxt(a.chg)}</strong></div>${mine}</div><p class="drawer-fresh">${escapeHTML(freshTxt())}.</p><div class="drawer-block"><h4>¿Qué mueve a esta acción?</h4><p>${escapeHTML(sensitivityFor(a))}</p></div><div class="drawer-block"><h4>Noticias sobre esta acción</h4>${newsHTML}</div>${actions}`;
  $('drawerOverlay').classList.add('active');$('assetDrawer').classList.add('active');if(!keepScroll)$('drawerBody').scrollTop=0}
function closeAssetDrawer(){document.getElementById('drawerOverlay').classList.remove('active');document.getElementById('assetDrawer').classList.remove('active')}
/* «¿Qué mueve a esta acción?»: el campo drivers de AssetOut. */
function sensitivityFor(p){return (assetOf(p.t).drivers)||'Le afectan la economía del país, su sector y las decisiones de la empresa.'}
function openNewsForAsset(t){openMarketAsset(t)}
function askAboutAsset(t){closeAssetDrawer();switchView('chat');document.getElementById('chatInput').value=`¿Qué está pasando con ${assetName(t)} y cómo se relaciona con mi portafolio?`;sendChat()}

/* ======================= MERCADO ======================= */
function moveTxt(c){return `${c>0?'▲ Subió':c<0?'▼ Bajó':'● Igual'} ${Math.abs(c).toFixed(1).replace('.',',')} %`}
function heatBg(c){const a=Math.min(Math.abs(c)/3,1);return c>0?`rgba(11,122,78,${(0.06+a*0.15).toFixed(3)})`:c<0?`rgba(180,69,47,${(0.06+a*0.13).toFixed(3)})`:'var(--sunken)'}
function renderMarket(){const mf=$('marketFresh');if(mf)mf.textContent=freshTxt()+'.';const list=[...PORTFOLIO,...POOL_EXPANDIDO.filter(x=>!PORTFOLIO.some(p=>p.t===x.t))].sort((a,b)=>Math.abs(b.chg||0)-Math.abs(a.chg||0));document.getElementById('marketCount').textContent=list.length+' acciones';document.getElementById('moversList').innerHTML=list.map(m=>{const k=chgKey(m.chg);return `<div class="market-row" role="button" tabindex="0" aria-label="Ver ${escapeHTML(m.n)}" onclick="openMarketAsset('${escapeHTML(m.t)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openMarketAsset('${escapeHTML(m.t)}')}">${logoHTML(m)}<div class="market-main"><strong>${escapeHTML(m.n)}</strong><div class="market-name"><span>${escapeHTML(m.t)}</span><span><i class="sec-dot" style="--c:${sectorColor(m.sector)}"></i>${escapeHTML(m.sector)}</span></div></div>${sparkSVG(assetSeries(m),k,92,30)}<div class="market-price">${formatCOP(m.price)}</div><div class="market-change chg ${k}">${moveTxt(m.chg)}</div></div>`}).join('');const heat=list.slice(0,9);document.getElementById('marketHeatmap').innerHTML=heat.map(m=>`<button type="button" class="heat ${m.chg>0?'pos':m.chg<0?'neg':'neu'}" style="background:${heatBg(m.chg)}" onclick="openMarketAsset('${escapeHTML(m.t)}')"><span class="heat-top">${logoHTML(m,true)}<span class="heat-ticker">${escapeHTML(m.n)}</span></span><span class="heat-val">${moveTxt(m.chg)}</span></button>`).join('')}
function openMarketAsset(t){openAssetDetail(t)}

function handleGlobalSearch(query){const overlay=document.getElementById('searchOverlay');const q=query.trim().toLowerCase();if(!q){overlay.classList.remove('open');return}const assets=[...PORTFOLIO,...POOL_EXPANDIDO].filter((a,i,self)=>self.findIndex(x=>x.t===a.t)===i).filter(a=>a.t.toLowerCase().includes(q)||a.n.toLowerCase().includes(q)||a.sector.toLowerCase().includes(q));const news=NEWS_DATABASE.filter(n=>n.titulo.toLowerCase().includes(q)||n.t.toLowerCase().includes(q));let html='';if(assets.length)html+='<div class="search-section-label">Acciones</div>'+assets.slice(0,6).map(a=>`<div class="search-item" role="button" tabindex="0" onclick="openMarketAsset('${escapeHTML(a.t)}');closeSearch()" onkeydown="if(event.key==='Enter'){openMarketAsset('${escapeHTML(a.t)}');closeSearch()}"><div class="search-item-main">${logoHTML(a,true)}<div><div class="search-item-title">${escapeHTML(a.n)}</div><div class="search-item-meta">${escapeHTML(a.t)}, ${escapeHTML(a.sector)}</div></div></div><div class="search-item-sub">${formatCOP(a.price)}</div></div>`).join('');if(news.length)html+='<div class="search-section-label">Noticias</div>'+news.slice(0,5).map(n=>`<div class="search-item" role="button" tabindex="0" onclick="openMarketAsset('${escapeHTML(n.t)}');closeSearch()" onkeydown="if(event.key==='Enter'){openMarketAsset('${escapeHTML(n.t)}');closeSearch()}"><div class="search-item-main">${mediaHTML(photoFor(n),{w:120,sector:assetOf(n.t).sector})}<div><div class="search-item-title" style="font-weight:500">${escapeHTML(n.titulo)}</div><div class="search-item-meta">${escapeHTML(assetName(n.t))}</div></div></div></div>`).join('');overlay.innerHTML=html||'<div class="search-empty">No encontramos coincidencias. Prueba con el nombre de una empresa o un sector.</div>';overlay.classList.add('open')}
function closeSearch(){$('searchOverlay').classList.remove('open');$('globalSearch').value='';$('topbar').classList.remove('search-open');$('searchToggle').setAttribute('aria-expanded','false')}
document.addEventListener('click',e=>{if(!e.target.closest('.topbar-search-wrap,.search-toggle'))closeSearch()});

/* ======================= IA DESDE EL SERVIDOR =======================
   La clave de Gemini vive solo en api/. La web llama a POST /v1/ai/today, /v1/ai/portfolio y /v1/ai/chat
   con su token. El servidor arma el contexto del portafolio (sin nombre ni correo), escribe los prompts,
   filtra cualquier recomendación y cuenta 5 usos al día por tipo.
   En este prototipo, la «respuesta» es la explicación que ya calcula la app con tus datos. */
let AI_QUOTA=5; /* el servidor manda el límite real en /v1/me */
const AI_KINDS={today:'Explicación de Hoy',portfolio:'Lectura de tu portafolio',chat:'Preguntas a Trace AI'};
const AI_BLOCK=/\b(compra|vende|aprovecha|deberías|deberias)\b/i; /* filtro de salida del plan del MVP */
const quotaMsg=()=>`Ya usaste tus ${AI_QUOTA} usos de IA de hoy para esto. Mañana tienes ${AI_QUOTA} más. Mientras tanto, te muestro la explicación básica.`;
const aiKey=kind=>`trace_ai_${HOY_ISO}_${userSlug()}_${kind}`;
function aiLeft(kind){return Math.max(0,AI_QUOTA-(Number(localStorage.getItem(aiKey(kind)))||0))}
async function callAI(kind,makeText){
  if(!aiLeft(kind))return{text:'',error:'QUOTA',remaining:0};
  await new Promise(r=>setTimeout(r,600));
  let text=String(makeText()||'');
  if(AI_BLOCK.test(text))text='The Trace explica lo que pasó; no dice qué hacer con tus acciones.';
  localStorage.setItem(aiKey(kind),String(AI_QUOTA-aiLeft(kind)+1));
  updateApiStatus();
  return{text,error:null,remaining:aiLeft(kind)}}
function updateApiStatus(){const dot=$('miniStatusDot'),txt=$('miniStatusText'),sub=$('miniStatusSub');if(!dot)return;dot.className='status-dot ok';txt.textContent='IA desde el servidor';if(sub)sub.textContent=`Te quedan ${aiLeft('chat')} preguntas hoy`;renderQuota()}
function renderQuota(){const el=$('aiQuotaList');if(!el)return;el.innerHTML=Object.entries(AI_KINDS).map(([k,l])=>`<li><span>${escapeHTML(l)}</span><strong>${aiLeft(k)} de ${AI_QUOTA}</strong></li>`).join('')}
function openApiModal(){renderQuota();$('logoDevKey').value=logoKey;$('apiModal').classList.add('active');setTimeout(()=>$('logoDevKey').focus(),40)}
function closeApiModal(){$('apiModal').classList.remove('active')}
async function runPortfolioAI(question){switchView('insights');$('insightSummary').textContent='Leyendo…';
  const res=await callAI('portfolio',()=>localPortfolioInsight(),question);
  if(res.error){$('insightHeadline').textContent='En corto';$('insightSummary').textContent=localPortfolioInsight();showToast(quotaMsg());return}
  $('insightHeadline').textContent='Lectura con IA';$('insightSummary').innerHTML=parseMarkdown(res.text)+`<p class="ai-left">Te quedan ${res.remaining} lecturas hoy.</p>`}
function localPortfolioInsight(){
  const c=calculatePortfolio();if(!PORTFOLIO.length)return'Agrega acciones para ver tu lectura.';
  const top=c.sectors[0],tw=c.total?top[1]/c.total*100:0,mv=c.weightedChange,n=PORTFOLIO.length;
  const s=[`Tienes ${n} ${n===1?'acción':'acciones'} y hoy valen ${formatCOP(c.total)}.`];
  s.push(Math.abs(mv)<0.05?'Hoy casi no cambió.':`Hoy ${mv>0?'subió':'bajó'} ${t4pct(mv)} %.`);
  s.push(tw>=40?`Donde más tienes tu dinero es ${top[0]}: ${Math.round(tw)} % del total. Si a ese sector le va mal, lo sientes más.`:'Tu dinero está repartido entre varios sectores, así que ninguno pesa demasiado.');
  s.push('En Noticias ves qué está pasando. Esto explica, no recomienda.');
  return s.join(' ')}

/* ======================= NOTICIAS (RADAR) ======================= */
/* Respaldo local del radar: explicación en cero jerga para cada noticia del catálogo (por id). */
const LOCAL_RADAR={
  1:{via:'Si el petróleo baja, Ecopetrol recibe menos plata por cada barril que vende.',metric:'El precio del petróleo.'},
  2:{via:'Con más petróleo para vender, la empresa puede recibir más plata.',metric:'Cuánto petróleo produce cada mes.'},
  3:{via:'Cuando entrega más préstamos y se los pagan, el banco gana más.',metric:'Cuántos préstamos entrega y cuántos le pagan a tiempo.'},
  4:{via:'Si los clientes se atrasan, el banco guarda plata para cubrir la pérdida y gana menos.',metric:'Cuántos clientes se atrasan en sus pagos.'},
  5:{via:'Los contratos de energía le aseguran ingresos durante muchos años.',metric:'Cómo avanzan las obras de esas líneas.'},
  6:{via:'Por ahora no cambia lo que la empresa espera ganar.',metric:'Si las obras siguen avanzando como estaban previstas.'},
  7:{via:'Con más agua en los embalses, produce más energía y le cuesta menos.',metric:'Cuánta lluvia cae y qué tan llenos están los embalses.'},
  8:{via:'Sus ganancias son parecidas a las del año pasado, sin sorpresas.',metric:'Cuánto ganan sus seguros y sus inversiones.'},
  9:{via:'Si a las empresas de las que es dueño les va peor, a Grupo Argos también.',metric:'Cómo les va a las empresas de las que es dueño.'},
  10:{via:'Con menos obras, la empresa recibe menos pedidos de cemento.',metric:'Cuántas casas y edificios se están construyendo.'},
  11:{via:'Si el oro sube, cada gramo que Mineros produce vale más.',metric:'El precio del oro.'}
};
/* Noticias: GET /v1/news (NewsOut) con los nombres que usan las tarjetas. */
function localRadarResults(onlyMine,f={}){return API.news({mine:onlyMine,impact:f.impact||null,direction:f.direction||null}).map(n=>({id:n.id,t:n.ticker,ticker:n.ticker,direccion:n.direction,magnitud:n.magnitude,titulo:n.title,dek:n.summary,fuente:n.source,impactWhy:n.summary,via:n.why,metric:n.watch,exposure:n.weight_pct,time:dayTxt(n.day),sourceHint:n.source,url:n.url}))}
/* «Actualizar»: vuelve a pedir GET /v1/news con los filtros elegidos. */
function runLiveRadarAnalysis(){const btn=$('analyzeBtn');btn.disabled=true;btn.textContent='Actualizando…';$('radarLiveDot').classList.add('searching');$('radarStatusText').textContent='Trayendo las noticias de hoy…';$('briefList').innerHTML=`<div class="panel-pad"><div class="skeleton line w80"></div><div class="skeleton line w55" style="margin-top:10px"></div><div class="skeleton box" style="margin-top:16px"></div></div>`;
  setTimeout(()=>{$('radarLiveDot').classList.remove('searching');btn.disabled=false;btn.textContent='Actualizar';$('radarStatusText').textContent='Noticias de hoy';renderRadar();showToast('Listo: estas son las noticias de hoy')},450)}
function setRadarFilter(filter){
  if(filter==='all')radarFilter={impact:null,direction:null};
  else if(['Alta','Media','Baja'].includes(filter))radarFilter.impact=radarFilter.impact===filter?null:filter;
  else radarFilter.direction=radarFilter.direction===filter?null:filter;
  document.querySelectorAll('.radar-filter').forEach(b=>{const v=b.dataset.radarFilter;const on=v==='all'?(!radarFilter.impact&&!radarFilter.direction):(radarFilter.impact===v||radarFilter.direction===v);b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
  renderRadar()}
function setRadarMine(v){radarMine=v;document.querySelectorAll('[data-radar-mine]').forEach(b=>{const on=(b.dataset.radarMine==='1')===v;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});renderRadar()}
function renderRadar(){const filtered=localRadarResults(radarMine,radarFilter);RADAR_RESULTS=filtered;
  const cnt=$('radarResultCount');if(cnt)cnt.textContent=filtered.length?`${filtered.length} ${filtered.length===1?'noticia':'noticias'}, primero las que más te afectan`:'Sin noticias con este filtro';
  if(!filtered.length){const none=radarMine&&!PORTFOLIO.length;$('briefList').innerHTML=`<div class="empty-state"><div class="empty-icon"><svg class="ico" aria-hidden="true"><use href="#i-radar"/></svg></div><h3>${none?'Aún no tienes acciones':'No hay noticias con este filtro'}</h3><p>${none?'Compra una acción de práctica o mira las noticias de todas las acciones.':'Prueba otro filtro o mira las noticias de todas las acciones.'}</p></div>`;return}
  $('briefList').innerHTML=`<div class="radar-list">${filtered.map(n=>newsCardHTML(n)).join('')}</div>`}
function newsCardHTML(n){const dir=n.direccion||'Neutro';const mag=n.magnitud||'Media';const weight=Number(n.exposure ?? portfolioWeight(n.t));const tk=n.t||n.ticker;const a=assetOf(tk);return `<article class="news-card">${mediaHTML(photoFor(n),{w:480,credit:true,sector:a.sector})}<div><div class="news-meta">${tagHTML(dir)}${impactHTML(mag)}<span class="news-src">${escapeHTML(n.sourceHint||n.fuente||'Resumen de mercado')}</span><span class="news-src">${escapeHTML(n.time||'Hoy')}</span></div><h3>${escapeHTML(n.titulo||n.title||'Noticia para ti')}</h3><p class="news-why">${escapeHTML(n.impactWhy||n.why||n.dek||'Esta noticia puede afectar tu acción.')}</p><details class="more"><summary>Por qué te afecta y qué conviene mirar<svg class="ico" aria-hidden="true"><use href="#i-chev"/></svg></summary><div class="more-body"><p class="fact"><b>Por qué te afecta</b>${escapeHTML(n.via||'—')}</p><p class="fact"><b>Qué conviene mirar</b>${escapeHTML(n.metric||'—')}</p></div></details><div class="news-footer"><span class="news-co">${logoHTML(a,true)}${escapeHTML(a.n)}</span><span class="news-weight">${weightHTML(weight)}</span><button class="btn-secondary btn-sm" type="button" onclick="openNewsForAsset('${escapeHTML(tk)}')">Ver acción</button></div><p class="source-note">The Trace explica lo ocurrido y cómo se relaciona con tus acciones. <strong>No es una recomendación.</strong></p></div></article>`}
function sourcePanel(items){const chunks=[];items.forEach(i=>(i.grounding?.groundingChunks||i.grounding?.grounding_chunks||[]).forEach(c=>{const web=c.web||c?.web; if(web?.uri&&!chunks.some(x=>x.uri===web.uri))chunks.push({uri:web.uri,title:web.title||new URL(web.uri).hostname})}));if(!chunks.length)return'';return `<div class="sources"><h3>Fuentes web consultadas</h3><div class="sources-list">${chunks.slice(0,8).map(c=>`<a class="source-link" href="${escapeHTML(c.uri)}" target="_blank" rel="noopener">${escapeHTML(c.title)}<svg class="ico" aria-hidden="true" style="width:14px;height:14px"><use href="#i-link"/></svg></a>`).join('')}</div></div>`}
function updateRadarCoverage(){const n=PORTFOLIO.length,s=Object.keys(calculatePortfolio().sectorTotals).length;document.getElementById('radarCoverage').textContent=`${n} ${n===1?'acción':'acciones'} en ${s} ${s===1?'sector':'sectores'}`;const l=$('radarLogos');if(l)l.innerHTML=PORTFOLIO.map(p=>logoHTML(p)).join('')}
/* ======================= CHAT ======================= */
function startChat(){const log=document.getElementById('chatLog');if(log.children.length)return;pushMsg('bot',`Hola, soy Trace AI. Conozco tus **${PORTFOLIO.length} acciones** y cómo se movieron hoy. Escribe, dicta o usa las sugerencias de abajo. Explico lo que pasó; no te digo qué comprar ni vender. Hoy te quedan **${aiLeft('chat')} preguntas**.`)}
function renderChatContext(){const el=$('chatContext');if(!el)return;el.innerHTML=''}
let CHAT_HISTORY=[];
/* Chat con Trace AI: POST /v1/ai/chat {question}. El servidor responde y descuenta un uso. */
async function sendChat(opts){
  const input=document.getElementById('chatInput');
  const custom=!!(opts&&typeof opts==='object'&&opts.question);
  const display=(custom?String(opts.display||''):input.value).trim();
  const question=(custom?String(opts.question):display).trim();
  if(!display||!question)return;
  if(!custom)input.value='';
  openAdvisor();
  pushMsg('user',display);
  const typing=pushTyping();
  const res=await callAI('chat',()=>localChatFallback(question),question);
  typing.remove();
  if(res.error){pushMsg('bot',`Ya usaste tus ${AI_QUOTA} preguntas de hoy. Mañana tienes ${AI_QUOTA} más. Mientras tanto, en Hoy y en Noticias ves lo que pasó con tus acciones.`);return}
  CHAT_HISTORY.push({q:question,a:res.text});pushMsg('bot',res.text)
}
const noAcc=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const reEsc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
/* Busca una acción por nombre, por nombre corto («Bancolombia») o por ticker. */
function chatAssetIn(q){return [...PORTFOLIO,...POOL_EXPANDIDO].find(a=>{const names=[a.n,String(a.n).replace(/\s*\(.*\)\s*/,''),a.t].map(x=>reEsc(noAcc(x).trim())).filter(Boolean);return new RegExp('\\b('+names.join('|')+')\\b').test(q)})}
function localChatFallback(text){
  if(!PORTFOLIO.length)return'Tu portafolio de práctica está vacío. Agrega una acción y te cuento qué pasó con ella.';
  const c=calculatePortfolio(),q=noAcc(text),asset=chatAssetIn(q),top=c.sectors[0],tw=c.total&&top?top[1]/c.total*100:0;
  const heavy=[...PORTFOLIO].sort((a,b)=>b.shares*b.price-a.shares*a.price);
  const pfx=x=>pctTxt(x).replace('Menos','menos');
  const why=a=>`• **${a.n}**: ${sensitivityFor(a)}`;
  if(/\b(comprar|compro|vender|vendo|mantener|mantengo|debo|deberia|recomiend\w*)\b/.test(q)){
    const list=asset?[asset]:heavy.slice(0,3);
    return`The Trace no recomienda comprar, vender ni mantener acciones: explica lo que pasó, y la decisión es tuya. Lo que sí te cuento es qué influye en ${asset?'esta acción':'tus acciones'}:\n${list.map(why).join('\n')}`}
  if(asset){const p=PORTFOLIO.find(x=>x.t===asset.t),chg=Number(asset.chg)||0,n=NEWS_DATABASE.filter(x=>x.t===asset.t)[0];
    let s=`**${asset.n}** ${chg>0?'subió':chg<0?'bajó':'no cambió'}${chg?' '+t4pct(chg)+' %':''} hoy y su precio es ${formatCOP(asset.price)}. ${p?`Es ${pfx(portfolioWeight(p.t))} de tu dinero.`:'Todavía no la tienes en tu portafolio de práctica.'}\n${sensitivityFor(asset)}`;
    if(n)s+=`\n${labelDir(n.direccion)}: ${n.titulo}. ${n.dek}`;
    return s}
  if(/\b(noticia\w*|afecta\w*|pasando|novedad\w*|aviso\w*)\b/.test(q)){
    const rel=NEWS_DATABASE.filter(n=>PORTFOLIO.some(p=>p.t===n.t)).sort((a,b)=>portfolioWeight(b.t)-portfolioWeight(a.t)).slice(0,3);
    if(!rel.length)return'Por ahora no hay noticias claras sobre tus acciones. Revisa «Noticias que te afectan» más tarde.';
    return`Estas son las noticias que más te afectan, empezando por la acción que pesa más en tu dinero:\n${rel.map(n=>`• **${assetName(n.t)}** (${labelDir(n.direccion)}, ${labelSev(n.magnitud).toLowerCase()}): ${n.titulo}. ${n.dek}`).join('\n')}\nSe explican los hechos; no se indica qué hacer.`}
  if(/(depende|sector|concentr|repartid|donde tengo)/.test(q)){
    const names=top?PORTFOLIO.filter(p=>p.sector===top[0]).map(p=>p.n).join(', '):'';
    return`Tu dinero depende más de **${top?top[0]:'—'}**: ahí está **${tw.toFixed(1).replace('.',',')} %** de tu portafolio (${names}). ${tw>=40?'Si a ese sector le va mal, tu portafolio lo siente más.':'Es la parte más grande, pero tu dinero está bastante repartido.'} Esto explica cómo está repartido tu dinero; no es una recomendación.`}
  if(/(primera vez|resumen|de que esta hecho|explicame (mi|el) portafolio|que tengo)/.test(q)){
    return`Tu portafolio de práctica es el conjunto de acciones que practicas, sin dinero real. Tiene **${PORTFOLIO.length} ${PORTFOLIO.length===1?'acción':'acciones'}** y hoy vale **${formatCOP(c.total)}**. Una acción es una parte de una empresa: si a la empresa le va mejor o peor, su precio sube o baja.\nAsí está repartido tu dinero:\n${heavy.slice(0,4).map(p=>`• **${p.n}**: ${pfx(portfolioWeight(p.t))}`).join('\n')}\nPregúntame qué pasó hoy o qué noticias te afectan.`}
  if(/(hoy|paso|subio|bajo|cambio|como (me )?(fue|va))/.test(q)){
    const m=todayModel(),amt=t4amt(m.delta);
    return`Hoy tu portafolio de práctica ${todayPortMove(m)}${amt?', '+amt:''}. ${todayLead(m).join(' ')} ${colcapLine(m)}\nEsto explica lo que pasó. No dice qué va a pasar ni qué hacer.`}
  if(/(mover|mueve|movimiento|factor|influye|que puede)/.test(q))
    return`Tus acciones se mueven por cosas distintas. Las que más pesan en tu dinero:\n${heavy.slice(0,3).map(why).join('\n')}`;
  return`Tu portafolio de práctica tiene **${PORTFOLIO.length} ${PORTFOLIO.length===1?'acción':'acciones'}** y hoy vale **${formatCOP(c.total)}**. Puedo contarte qué pasó hoy, de qué depende tu dinero, qué noticias te afectan o qué pasa con una de tus acciones.`}
function pushMsg(who,text,raw=false){const log=document.getElementById('chatLog');const div=document.createElement('div');div.className='msg '+who;div.innerHTML=who==='bot'&&!raw?parseMarkdown(text):escapeHTML(text);log.appendChild(div);log.scrollTop=log.scrollHeight;return div}
function pushTyping(){const log=document.getElementById('chatLog');const div=document.createElement('div');div.className='msg bot';div.innerHTML='<span class="typing" aria-label="La IA está escribiendo"><span></span><span></span><span></span></span>';log.appendChild(div);log.scrollTop=log.scrollHeight;return div}
function fillChat(text){openAdvisor();const input=document.getElementById('chatInput');input.value=text;input.focus()}
let micRec=null;
function stopMic(){if(micRec){try{micRec.onend=null;micRec.stop()}catch{} micRec=null}const b=$('micBtn');if(b){b.classList.remove('on');b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Prender micrófono')}}
function toggleMic(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){showToast('Este navegador no permite dictar. Puedes escribir y enviar.');return}
  if(micRec){stopMic();return}
  const rec=new SR();micRec=rec;rec.lang='es-CO';rec.interimResults=true;rec.continuous=false;
  const b=$('micBtn');b.classList.add('on');b.setAttribute('aria-pressed','true');b.setAttribute('aria-label','Detener micrófono');
  rec.onresult=e=>{const text=[...e.results].map(r=>r[0].transcript).join(' ');$('chatInput').value=text};
  rec.onerror=()=>{stopMic();showToast('No se pudo usar el micrófono. Escribe la pregunta y envíala.')};
  rec.onend=()=>{micRec=null;const btn=$('micBtn');if(btn){btn.classList.remove('on');btn.setAttribute('aria-pressed','false');btn.setAttribute('aria-label','Prender micrófono')}if($('chatInput').value.trim())$('chatInput').focus()};
  try{rec.start()}catch{stopMic();showToast('No se pudo prender el micrófono.')}
}
function openAdvisor(){switchView('chat')}
function openAdvisorQuick(e){if(e)e.stopPropagation();switchView('chat')}
function closeAdvisor(){stopMic()}
function toggleAdvisor(e){if(e)e.stopPropagation();switchView('chat')}
function hideAskAI(){const b=$('askAI');if(b)b.hidden=true}
function selectionPlace(node){
  const el=node&&(node.nodeType===1?node:node.parentElement);
  if(!el)return 'la app';
  if(el.closest('.news-card,#view-radar'))return 'una noticia';
  if(el.closest('.story-section'))return 'Insights';
  if(el.closest('#view-portfolio,#assetDrawer'))return 'el portafolio';
  if(el.closest('#view-insights'))return 'la lectura';
  if(el.closest('#view-market'))return 'el mercado';
  if(el.closest('#view-chat'))return 'Trace AI';
  if(el.closest('#view-today'))return 'Hoy';
  return 'la app'
}
function selectionAsk(raw){
  const text=raw.replace(/\s+/g,' ').trim().slice(0,700);
  const place=($('askAI')&&$('askAI').dataset.place)||'la app';
  const asset=chatAssetIn(noAcc(text));
  /* La web solo manda la pregunta; el servidor arma el contexto y las reglas (sin nombre ni correo). */
  return {display:'Consulta: «'+short+'»',question:`Explícame esto que leí en ${place}: «${text}»`}
}
function placeAskAI(){
  const bar=$('askAI'),sel=window.getSelection();
  if(!bar)return;
  if(!sel||sel.isCollapsed||!sel.rangeCount){hideAskAI();return}
  const text=sel.toString().replace(/\s+/g,' ').trim();
  if(text.length<2){hideAskAI();return}
  const node=sel.anchorNode;
  const el=node&&(node.nodeType===1?node:node.parentElement);
  if(!el||el.closest('input,textarea,#askAI,.advisor-compose')){hideAskAI();return}
  const r=sel.getRangeAt(0).getBoundingClientRect();
  if(r.width<1&&r.height<1){hideAskAI();return}
  bar.dataset.text=text.slice(0,700);
  bar.dataset.place=selectionPlace(node);
  bar.hidden=false;
  const x=Math.min(window.innerWidth-24,Math.max(24,r.left+r.width/2));
  let top=r.top-46;
  if(top<72)top=Math.min(window.innerHeight-48,r.bottom+10);
  bar.style.left=x+'px';bar.style.top=top+'px'
}
let askTimer;
function scheduleAskAI(){clearTimeout(askTimer);askTimer=setTimeout(placeAskAI,30)}
function askFromSelection(){
  const text=(($('askAI')&&$('askAI').dataset.text)||'').trim();
  hideAskAI();
  const sel=window.getSelection();if(sel)sel.removeAllRanges();
  if(text.length<2)return;
  const built=selectionAsk(text);
  openAdvisor();
  sendChat({display:built.display,question:built.question})
}
document.addEventListener('mouseup',scheduleAskAI);
document.addEventListener('touchend',scheduleAskAI);
document.addEventListener('keyup',e=>{if(e.key==='Escape')hideAskAI();else if(e.shiftKey||e.key==='Shift')scheduleAskAI()});
window.addEventListener('scroll',hideAskAI,true);
document.addEventListener('mousedown',e=>{if(!e.target.closest('#askAI'))hideAskAI()});
$('askAIBtn').addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation()});
$('askAIBtn').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();askFromSelection()});

/* ======================= HOY ======================= */
/* Causa en palabras simples para cada noticia del catálogo (se usa solo si coincide con lo que hizo la acción). */
const TODAY_CAUSE={1:'el precio del petróleo bajó',2:'la empresa produce un poco más de petróleo',3:'el banco gana más por los préstamos que entrega',4:'más clientes se atrasan en sus pagos',5:'ganó un contrato para nuevas líneas de energía',7:'las lluvias le dan más energía para producir',9:'a una de las empresas de las que es dueño le va un poco peor',10:'se levantan menos casas y edificios',11:'el precio del oro subió'};
const T4_SC={Alta:3,Media:2,Baja:1};
const t4pct=x=>Math.abs(Number(x)||0).toFixed(1).replace('.',',');
const t4chgTxt=c=>Number(c)===0?'● Sin cambios':chgTxt(c);
function t4amt(d){const n=Math.abs(Number(d)||0);if(Math.round(n)<1)return'';return 'unos '+formatCOP(n<1000?Math.round(n/10)*10:Math.round(n/100)*100)+(d>0?' más':' menos')}
function signedCOP(d){const n=Math.round(Math.abs(Number(d)||0));if(n<1)return'Sin cambio';return (d>0?'+':'−')+formatCOP(n)}
function todayModel(){
  const c=calculatePortfolio();
  const rows=PORTFOLIO.map(p=>{const v=p.shares*p.price,chg=Number(p.chg)||0;return{p,chg,d:v-v/(1+chg/100),w:c.total?v/c.total*100:0}});
  const sorted=[...rows].sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
  return{c,rows,sorted,top:sorted[0],pct:c.weightedChange,delta:c.delta,dir:Math.abs(c.weightedChange)<0.05?'flat':(c.delta>0?'up':'down')}
}
function todayCause(p,chg){if(!chg)return null;const want=chg>0?'Positivo':'Negativo';const n=NEWS_DATABASE.filter(x=>x.t===p.t&&x.direccion===want&&TODAY_CAUSE[x.id]).sort((a,b)=>T4_SC[b.magnitud]-T4_SC[a.magnitud])[0];return n?{news:n,text:TODAY_CAUSE[n.id]}:null}
function todayHead(m){if(m.dir==='flat')return 'Hoy tu portafolio casi no cambió';const up=m.dir==='up';return `Hoy tu portafolio ${up?'subió':'bajó'} ${t4pct(m.pct)} %, ${t4amt(m.delta)||'sin mucho cambio en pesos'}`}
function todayLead(m){
  const t=m.top,nm=t.p.n;
  if(!t.chg)return['Ninguna de tus acciones se movió hoy.'];
  const up=t.chg>0,verb=up?'subió':'bajó',cz=todayCause(t.p,t.chg),s=[];
  const sameSign=m.dir!=='flat'&&(t.d>0)===(m.delta>0);
  const lead=m.dir==='flat'?'La que más se movió fue':'La que más pesó fue';
  if(cz&&sameSign)s.push(`La mayor causa fue ${nm}, porque ${cz.text}.`);
  else if(cz)s.push(`${lead} ${nm}, que ${verb} porque ${cz.text}.`);
  else s.push(`${lead} ${nm}, que ${verb} ${t4pct(t.chg)} %. Hoy no hay una noticia clara que lo explique.`);
  const amt=t4amt(t.d);
  s.push(`Representa ${pctTxt(t.w).replace('Menos','menos')} de tu dinero${amt?`, así que su ${up?'subida':'bajada'} movió tu portafolio ${amt}`:''}.`);
  const comp=m.sorted.find(r=>r!==t&&r.d*t.d<0);
  if(comp)s.push(`Del otro lado, ${comp.p.n} ${comp.chg>0?'subió':'bajó'} ${t4pct(comp.chg)} % y compensó una parte.`);
  else if(m.rows.length>1&&m.rows.every(r=>r.d*t.d>=0))s.push('Todas tus acciones se movieron hacia el mismo lado.');
  return s
}
function todayPortMove(m){return m.dir==='flat'?'casi no cambió':`${m.dir==='up'?'subió':'bajó'} ${t4pct(m.pct)} %`}
function colcapLine(m){
  const c=COLCAP.chg,a=Math.abs(c);
  const mag=a<0.3?'casi no se movieron':a<1?(c>0?'subieron un poco':'bajaron un poco'):(c>0?'subieron bastante':'bajaron bastante');
  let cmp='';if(m){const d=m.pct-c;cmp=Math.abs(d)<0.3?' Tu portafolio se movió parecido.':d>0?' A tu portafolio le fue mejor.':' A tu portafolio le fue peor.'}
  return `Hoy las acciones más grandes del país ${mag}.${cmp}`
}
function todayExtended(m){
  const items=m.sorted.map(r=>{const cz=todayCause(r.p,r.chg),amt=t4amt(r.d);const k=r.chg>0?'up':r.chg<0?'down':'flat';
    return `<li>${logoHTML(r.p,true)}<span><span class="explain-name">${escapeHTML(r.p.n)}</span><span class="explain-tk">${escapeHTML(r.p.t)}</span> <span class="chg ${k}">${t4chgTxt(r.chg)}</span></span><span>${pctTxt(r.w)} de tu dinero${amt?`. Movió tu portafolio ${escapeHTML(amt)}`:''}.${cz?` Por qué: ${escapeHTML(cz.text)}.`:''}</span></li>`}).join('');
  const cc=COLCAP.chg,dd=m.pct-cc;
  const cmp=Math.abs(dd)<0.3?'Se movió parecido al mercado.':dd>0?'Hoy le fue mejor que al COLCAP.':'Hoy le fue peor que al COLCAP.';
  const top=m.c.sectors[0],tw=top&&m.c.total?top[1]/m.c.total*100:0;
  const sec=tw>=40?`<h3 class="explain-h">Dónde está tu dinero</h3><p>${pctTxt(tw)} de tu dinero está en ${escapeHTML(top[0])}. Por eso lo que le pase a ese sector se nota más en tu portafolio.</p>`:'';
  return `<h3 class="explain-h">Acción por acción</h3><ul class="explain-list">${items}</ul><h3 class="explain-h">Frente al COLCAP</h3><p>El COLCAP, ${COLCAP.frase}, ${cc>=0?'subió':'bajó'} ${t4pct(cc)} %. Tu portafolio ${todayPortMove(m)}. ${cmp}</p>${sec}<p class="explain-foot">Esto explica lo que pasó. No dice qué va a pasar ni qué hacer.</p>`
}
const EXPLAIN_LABEL='<span class="ia-badge inv" aria-hidden="true">IA</span>Explicación con IA';
/* Explicación con IA de Hoy: POST /v1/ai/today. Si la IA no responde o no quedan usos, se muestra
   la explicación de respaldo (TodayOut.fallback), que ya viene calculada del servidor. */
function todayAIText(m){return [todayHead(m)+'.',...todayLead(m),colcapLine(m)].join(' ')}
async function explainTodayWithAI(){
  if(!PORTFOLIO.length)return;
  let out=$('todayExplainOut'),b=$('todayExplainBtn');if(b.disabled)return;
  if(!out.hidden){out.hidden=true;out.removeAttribute('aria-busy');b.setAttribute('aria-expanded','false');b.innerHTML=EXPLAIN_LABEL;return}
  const m=todayModel();
  const show=html=>{out=$('todayExplainOut');b=$('todayExplainBtn');if(!out||!b)return;out.innerHTML=html;out.hidden=false;out.removeAttribute('aria-busy');b.disabled=false;b.setAttribute('aria-expanded','true');b.textContent='Ocultar la explicación';out.focus()};
  b.disabled=true;b.textContent='Generando explicación…';b.setAttribute('aria-expanded','true');out.setAttribute('aria-busy','true');
  out.innerHTML='<div class="skeleton line w80"></div><div class="skeleton line w55" style="margin-top:10px"></div><div class="skeleton line w80" style="margin-top:10px"></div>';out.hidden=false;
  const res=await callAI('today',()=>todayAIText(m));
  if(res.error){showToast(quotaMsg());show(todayExtended(m));return}
  show(`<div class="explain-ai">${parseMarkdown(res.text)}</div><p class="explain-foot">Explicación hecha con IA a partir de tus datos. Te quedan ${res.remaining} hoy. Cuenta lo que pasó; no dice qué va a pasar ni qué hacer.</p>`)
}
function traceRows(m){
  const max=Math.max(...m.rows.map(r=>Math.abs(r.d)),0)||1;
  const axis=`<li class="trace-row axis" aria-hidden="true"><span class="trace-name"></span><span class="trace-axis"><span>Restó</span><span>Sumó</span></span><span class="trace-val"></span></li>`;
  return axis+m.sorted.map(r=>{const k=r.d>0.5?'up':r.d<-0.5?'down':'flat',w=Math.abs(r.d)/max*50,ck=r.chg>0?'up':r.chg<0?'down':'flat';
    const act=activeTraceTicker===r.p.t;
    return `<li class="trace-row${act?' is-active pulse-hint':''}" role="button" tabindex="0" onclick="setActiveTrace('${escapeHTML(r.p.t)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setActiveTrace('${escapeHTML(r.p.t)}')}"><span class="trace-name">${logoHTML(r.p,true)}<span><strong>${escapeHTML(r.p.n)}</strong><small>${pctTxt(r.w)} de tu dinero</small></span></span><span class="trace-bar" aria-hidden="true">${k==='flat'?'':`<span class="${k}" style="width:${w.toFixed(1)}%"></span>`}</span><span class="trace-val"><strong class="chg ${k}">${signedCOP(r.d)}</strong><small class="chg ${ck}">${t4chgTxt(r.chg)}</small></span></li>`}).join('')
}
function renderTodayMain(m){
  const el=$('todayMain');
  if(!m){el.innerHTML=`<h2 class="hero-kicker" id="t4MainTitle">Qué pasó hoy con tu portafolio</h2><div class="panel"><div class="empty-state"><div class="empty-icon"><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></div><h3>Tu portafolio está vacío</h3><p>Agrega una acción de práctica y aquí te explicamos qué pasó con ella.</p><button class="btn-primary" type="button" onclick="openAddModal()">Comprar una acción</button></div></div>`;return}
  const t=m.top,k=t.chg>0?'up':t.chg<0?'down':'flat',cc=COLCAP.chg,ck=chgKey(cc),dd=m.pct-cc;
  const vs=Math.abs(dd)<0.3?'Te moviste parecido':dd>0?'A tu portafolio le fue mejor':'A tu portafolio le fue peor';
  el.innerHTML=`<h2 class="hero-kicker" id="t4MainTitle">Qué pasó hoy con tu portafolio</h2>
<p class="hero-sentence">${headRich(m)}</p>
${liveDayChartHTML('todayPortChart',portfolioSeriesForRange(),{label:'Cuánto vale hoy',value:formatCOP(m.c.total),meta:'',k:chgKey(Math.round(m.c.gain)),aria:`Cómo ha ido tu portafolio: ${todayPortMove(m)} hoy`})}
<div class="hero-stats">
  <div class="hero-stat"><span class="stat-label">Cuánto movió tu dinero</span><span class="stat-value chg ${m.dir}">${escapeHTML(signedCOP(m.delta))}</span><span class="stat-note">${dirArrow(m.dir)} ${t4pct(m.pct)} % del portafolio</span></div>
  <div class="hero-stat"><span class="stat-label">La acción que más pesó</span><span class="stat-value stat-value-asset">${logoHTML(t.p,true)}<span>${escapeHTML(t.p.n)}</span></span><span class="stat-note chg ${k}">${t4chgTxt(t.chg)} · ${pctTxt(t.w)} de tu dinero</span></div>
  <div class="hero-stat"><span class="stat-label">COLCAP hoy</span><span class="stat-value chg ${ck}">${dirArrow(ck)} ${t4pct(cc)} %</span><span class="stat-note">${vs}</span></div>
</div>
<p class="hero-lead">${todayLead(m).map(escapeHTML).join(' ')}</p>
<section class="panel trace-panel" aria-labelledby="traceTitle">
  <div class="trace-head"><h3 class="panel-title" id="traceTitle">Qué movió tu portafolio hoy</h3><p class="panel-sub">Toca una fila para resaltarla. Cuántos pesos sumó o restó cada acción.</p></div>
  <ul class="trace-list">${traceRows(m)}</ul>
  <div class="trace-foot"><p class="note"><svg class="ico" aria-hidden="true"><use href="#i-info"/></svg><span>The Trace explica lo que pasó. No te dice qué comprar ni vender.</span></p><button class="btn-primary" id="todayExplainBtn" type="button" aria-expanded="false" aria-controls="todayExplainOut" onclick="explainTodayWithAI()">${EXPLAIN_LABEL}</button></div>
  <div class="explain-out" id="todayExplainOut" tabindex="-1" hidden></div>
</section>`;
  bindLiveCharts();
}
function compareRow(label,v,mx){const k=v>0?'up':v<0?'down':'flat',w=Math.max(Math.abs(v)/mx*100,3);return `<div class="compare-row"><span>${label}</span><div class="compare-track" aria-hidden="true"><span class="${k}" style="width:${w.toFixed(1)}%"></span></div><span class="chg ${k}">${dirArrow(k)} ${t4pct(v)} %</span></div>`}
function renderTodayColcap(m){const c=COLCAP.chg,k=c>0?'up':c<0?'down':'flat';const mx=Math.max(Math.abs(c),m?Math.abs(m.pct):0,0.1);$('todayColcap').innerHTML=`<h2 class="rail-title">COLCAP hoy</h2><div class="cc-row">${COLCAP.proxy?`<span class="cc-val chg ${k}">${dirArrow(k)} ${t4pct(c)} %</span><span class="chg flat">Cambio de hoy</span>`:`<span class="cc-val">${NUM_FMT.format(COLCAP.valor)}</span><span class="chg ${k}">${t4chgTxt(c)}</span>`}</div><div class="cc-spark">${sparkSVG(colcapSeries(),k,300,52).replace('width="300"','width="100%"')}</div><p class="rail-sub">El COLCAP es ${COLCAP.frase}.${COLCAP.proxy?' Lo seguimos con el fondo ICOLCAP, que copia al índice. Por eso solo mostramos cuánto cambió.':''}</p>${m?`<div class="compare">${compareRow('Tu portafolio',m.pct,mx)}${compareRow('COLCAP',c,mx)}</div>`:''}<p class="cc-line">${escapeHTML(colcapLine(m))}</p>`}
/* Noticias de Hoy: misma lógica que el radar (mismos datos y orden), en una versión compacta. */
/* Las 3 noticias que más te afectan: TodayOut.news (mismo orden que GET /v1/news). */
function todayNewsItems(){return localRadarResults(true).slice(0,3)}
function storyBits(n){const dir=n.direccion||'Neutro',mag=n.magnitud||'Media',tk=n.t||n.ticker,a=assetOf(tk),w=Number(n.exposure??portfolioWeight(tk));return{dir,mag,tk,a,w,title:escapeHTML(n.titulo||n.title||'Noticia para ti'),why:escapeHTML(n.impactWhy||n.why||n.dek||''),via:escapeHTML(n.via||'—')}}
function todayNewsCard(n,i){const b=storyBits(n);const more=`<details class="more"><summary>Por qué te afecta<svg class="ico" aria-hidden="true"><use href="#i-chev"/></svg></summary><div class="more-body">${i?`<p class="story-why">${b.why}</p>`:''}<p class="fact"><b>Por qué te afecta</b>${b.via}</p></div></details>`;const foot=`<div class="story-foot"><span class="story-co">${logoHTML(b.a,true)}${escapeHTML(b.a.n)}</span><span class="weight">${weightHTML(b.w)}</span><button class="btn-ghost btn-sm" type="button" onclick="openNewsForAsset('${escapeHTML(b.tk)}')">Ver acción</button></div>`;
  if(!i)return `<article class="feature">${mediaHTML(photoFor(n),{w:1000,credit:true,sector:b.a.sector})}<div class="feature-body"><div class="story-meta">${tagHTML(b.dir)}${impactHTML(b.mag)}</div><h3>${b.title}</h3><p class="story-why">${b.why}</p>${more}${foot}</div></article>`;
  return `<article class="story-row"><div><div class="story-meta">${tagHTML(b.dir)}${impactHTML(b.mag)}</div><h3>${b.title}</h3></div>${mediaHTML(photoFor(n),{w:280,sector:b.a.sector})}<div class="story-rest">${more}${foot}</div></article>`}
function renderTodayNews(){const list=todayNewsItems();$('todayNewsList').innerHTML=list.length?list.map((n,i)=>todayNewsCard(n,i)).join(''):'<p class="t-empty">Hoy no hay noticias claras sobre tus acciones.</p>'}
/* Aviso diario: solo guarda la preferencia en localStorage ('trace_daily_alert'). No hay backend, así que todavía no envía nada. */
function renderDailyAlert(){const s=$('dailyAlertSwitch');if(!s)return;const on=localStorage.getItem('trace_daily_alert')==='1';s.setAttribute('aria-checked',String(on));$('dailyAlertState').textContent=on?'Activado':'Desactivado'}
function toggleDailyAlert(){const on=localStorage.getItem('trace_daily_alert')!=='1';localStorage.setItem('trace_daily_alert',on?'1':'0');renderDailyAlert();showToast(on?'Preferencia guardada: resumen diario activado':'Resumen diario desactivado')}
function renderTodayDate(){const el=$('todayDate');if(el)el.textContent=new Date().toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}
let todayMode=localStorage.getItem('trace_today_mode')||'story';
let storySlide=0;
let storyPick=null;
let todayRevealObs=null;
function setTodayMode(mode){
  if(!['story','studio','tech'].includes(mode))mode='story';
  todayMode=mode;localStorage.setItem('trace_today_mode',mode);
  document.querySelectorAll('.today-mode').forEach(el=>{
    const id=el.id;
    const on=(mode==='story'&&id==='todayModeStory')||(mode==='studio'&&id==='todayModeStudio')||(mode==='tech'&&id==='todayModeTech');
    el.classList.toggle('active',on);el.hidden=!on;
  });
  document.querySelectorAll('[data-today-mode]').forEach(b=>{
    const on=b.dataset.todayMode===mode;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));
  });
  document.body.classList.toggle('today-mode-story',mode==='story');
  document.body.classList.toggle('today-mode-studio',mode==='studio');
  document.body.classList.toggle('today-mode-tech',mode==='tech');
  const tick=$('ticker');if(tick)tick.style.display=(mode==='tech'||document.body.dataset.currentView!=='today')?'':'none';
  if(mode==='story'){renderTodayStory(PORTFOLIO.length?todayModel():null);requestAnimationFrame(()=>{initTodayReveals();initDotField()})}
  else{stopDotField();if(mode==='studio'){renderTodayStudio(PORTFOLIO.length?todayModel():null);requestAnimationFrame(()=>{initTodayReveals();try{window.scrollTo(0,0)}catch{}});hideAskAI()}if(mode==='tech'){renderTodayDate();const m=PORTFOLIO.length?todayModel():null;renderTodayMain(m);renderTodayColcap(m);renderTodayNews();requestAnimationFrame(()=>bindLiveCharts())}}
  syncAmbient();
  try{window.scrollTo({top:0,behavior:'instant'})}catch{window.scrollTo(0,0)}
}
function todayModesEmptyHTML(){
  return `<div class="panel" style="margin:0 24px 24px"><div class="empty-state"><div class="empty-icon"><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></div><h3>Tu portafolio está vacío</h3><p>Agrega acciones para ver la historia de tu día.</p><button class="btn-primary" type="button" onclick="openAddModal()">Comprar una acción</button></div></div>`;
}
function initTodayReveals(){
  if(todayRevealObs){todayRevealObs.disconnect();todayRevealObs=null}
  const root=$('todayModeStory');if(!root||todayMode!=='story')return;
  root.querySelectorAll('[data-reveal]').forEach(n=>n.classList.remove('is-visible'));
  todayRevealObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');todayRevealObs.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -10% 0px'});
  root.querySelectorAll('[data-reveal]').forEach(n=>todayRevealObs.observe(n));
  const first=root.querySelector('[data-reveal]');if(first)first.classList.add('is-visible');
}
let dotRAF=0,dotOn=false,auroraRAF=0,auroraOn=false,ambientMouse={x:.62,y:.42},auroraRipples=[],auroraStars=[],ambientLitTimer=0;
/* Rendimiento: los fondos animados se dibujan a 30 cuadros por segundo (no 60) y a menor resolución.
   En equipos con 4 núcleos o menos, o poca memoria, se activa el modo liviano (clase body.lite). */
const PERF=(()=>{const lite=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4;
  if(lite)document.documentElement.classList.add('lite');
  const P={lite,fps:lite?20:30,idleFps:lite?8:15,move:0,dpr:max=>Math.min(devicePixelRatio||1,lite?1:max)};
  /* Si nadie mueve el cursor, toca la pantalla ni hace scroll por 2,5 s, el fondo baja el ritmo. */
  const mov=()=>{P.move=performance.now()};['pointermove','pointerdown','scroll','touchmove'].forEach(e=>addEventListener(e,mov,{passive:true}));
  return P})();
/* Cambia una variable CSS solo si su valor cambió: cada cambio obliga al navegador a recalcular estilos. */
function setVar(el,k,v){const c=el.__v||(el.__v={});if(c[k]!==v){c[k]=v;el.style.setProperty(k,v)}}
function perfSkip(st,now){const fps=now-PERF.move<2500?PERF.fps:PERF.idleFps;if(now-(st.t||0)<1000/fps)return true;st.t=now;return false}
function isMobileAmbient(){return window.matchMedia('(max-width:760px)').matches}
function setAmbientLit(on){
  const shell=$('appShell');if(!shell||!shell.classList.contains('app-shell-active')||!isMobileAmbient())return;
  shell.classList.toggle('trace-ambient-lit',!!on);
}
function pulseAmbientLit(ms=950){
  if(!isMobileAmbient())return;
  setAmbientLit(true);
  clearTimeout(ambientLitTimer);
  ambientLitTimer=setTimeout(()=>setAmbientLit(false),ms);
}
function bindAmbientPointer(){
  if(bindAmbientPointer.done)return;
  bindAmbientPointer.done=true;
  addEventListener('pointermove',e=>{
    ambientMouse.x=e.clientX/innerWidth;
    ambientMouse.y=e.clientY/innerHeight;
    document.documentElement.style.setProperty('--trace-mx',(ambientMouse.x*100).toFixed(1)+'%');
    document.documentElement.style.setProperty('--trace-my',(ambientMouse.y*100).toFixed(1)+'%');
  });
  addEventListener('pointerdown',e=>{
    if(isMobileAmbient()&&$('appShell')?.classList.contains('app-shell-active'))pulseAmbientLit();
    if(!auroraShouldShow())return;
    const t=e.target;if(t&&t.closest('input,textarea,select,label'))return;
    if(t&&t.closest('button,a,[role=button],.switch,.trace-row,.holding,.ob-card'))return;
    auroraRipples.push({x:e.clientX/innerWidth,y:e.clientY/innerHeight,t:performance.now()});
    if(auroraRipples.length>6)auroraRipples.shift();
  });
  window.matchMedia('(max-width:760px)').addEventListener('change',e=>{if(!e.matches)setAmbientLit(false)});
}
function auroraShouldShow(){
  const shell=$('appShell');
  if(!shell||!shell.classList.contains('app-shell-active'))return false;
  if($('onboarding')?.classList.contains('active'))return false;
  if(document.body.dataset.currentView==='today'&&document.body.classList.contains('today-mode-story'))return false;
  if(document.body.dataset.currentView==='today'&&document.body.classList.contains('today-mode-studio'))return false;
  return true;
}
function syncAmbient(){bindAmbientPointer();const on=auroraShouldShow();document.body.classList.toggle('trace-ambient',on);if(on)initAuroraField();else stopAuroraField()}
function stopAuroraField(){auroraOn=false;cancelAnimationFrame(auroraRAF)}
function seedAuroraStars(w,h){
  auroraStars=[];
  const n=Math.min(110,Math.round((w*h)/18000));
  for(let i=0;i<n;i++){
    const tone=Math.random();
    auroraStars.push({
      x:Math.random()*w,y:Math.random()*h,
      vx:(0.35+Math.random()*1.1)*(w/innerWidth),
      vy:(Math.random()-.5)*0.25*(w/innerWidth),
      r:.8+Math.random()*1.6,
      hue:tone<.12?'#3dcc8e':tone<.2?'#9eb6ff':'#f4f5f7'
    });
  }
}
function initAuroraField(){
  const c=$('auroraField');if(!c)return;
  bindAmbientPointer();
  const ctx=c.getContext('2d');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fit=()=>{const d=PERF.lite?.5:.75;/* fondo suave: no necesita resolución completa */c.width=innerWidth*d;c.height=innerHeight*d;if(!auroraStars.length)seedAuroraStars(c.width,c.height)};
  if(!initAuroraField.bound){initAuroraField.bound=true;addEventListener('resize',()=>{fit();seedAuroraStars(c.width,c.height)})}
  fit();auroraOn=true;cancelAnimationFrame(auroraRAF);
  let sweep=0,hid=false;const st={};
  const draw=ts=>{
    if(!auroraOn)return;
    if(perfSkip(st,ts||performance.now())){auroraRAF=requestAnimationFrame(draw);return}
    if(!auroraShouldShow()){if(!hid){ctx.clearRect(0,0,c.width,c.height);hid=true}auroraRAF=requestAnimationFrame(draw);return}
    hid=false;
    const w=c.width,h=c.height,s=w/innerWidth,mx=ambientMouse.x*w,my=ambientMouse.y*h;
    const rich=document.body.classList.contains('trace-ambient');
    const mob=isMobileAmbient();
    const lit=mob&&$('appShell')?.classList.contains('trace-ambient-lit');
    const mobMul=mob?(lit?1:.52):1;
    const ib=(rich?2.15:1)*mobMul;
    const reach=(rich?320:220)*s;
    ctx.clearRect(0,0,w,h);
    const vig=ctx.createRadialGradient(mx,my,0,mx,my,Math.max(w,h)*(.55+rich*.14));
    vig.addColorStop(0,`rgba(61,204,142,${(0.04*ib).toFixed(3)})`);vig.addColorStop(.4,`rgba(158,182,255,${(0.025*ib).toFixed(3)})`);vig.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=vig;ctx.fillRect(0,0,w,h);
    if(!reduce){
      const spd=rich?0.0028:0.0018;
      sweep=(sweep+w*spd)%(w*1.25);
      const band=ctx.createLinearGradient(sweep-w*.15,0,sweep+w*.22,0);
      band.addColorStop(0,'rgba(255,255,255,0)');band.addColorStop(.45,`rgba(244,245,247,${(0.045*ib).toFixed(3)})`);band.addColorStop(.55,`rgba(61,204,142,${(0.07*ib).toFixed(3)})`);band.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=band;ctx.fillRect(sweep-w*.15,0,w*.38,h);
    }
    const now=performance.now();
    auroraRipples=auroraRipples.filter(r=>now-r.t<1400);
    auroraRipples.forEach(r=>{
      const age=(now-r.t)/1400,rad=(80+age*220)*s;
      const g=ctx.createRadialGradient(r.x*w,r.y*h,0,r.x*w,r.y*h,rad);
      g.addColorStop(0,`rgba(61,204,142,${(0.12*(1-age)).toFixed(3)})`);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(r.x*w,r.y*h,rad,0,6.2832);ctx.fill();
    });
    const links=[];
    auroraStars.forEach(p=>{
      if(!reduce){p.x+=p.vx*s*.6;p.y+=p.vy*s*.6;if(p.x>w+12){p.x=-12;p.y=Math.random()*h}if(p.y<-8)p.y=h+8;if(p.y>h+8)p.y=-8}
      const dx=p.x-mx,dy=p.y-my,d=Math.hypot(dx,dy);
      const near=Math.max(0,1-d/reach);
      const a=(.08+near*.6)*ib;
      const len=(10+near*26)*s;
      ctx.strokeStyle=p.hue==='#3dcc8e'?`rgba(61,204,142,${(a*.45).toFixed(3)})`:p.hue==='#9eb6ff'?`rgba(158,182,255,${(a*.4).toFixed(3)})`:`rgba(244,245,247,${(a*.35).toFixed(3)})`;
      ctx.lineWidth=(0.6+near*1.4)*s;
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*len,p.y-p.vy*len);ctx.stroke();
      ctx.strokeStyle=`rgba(255,255,255,${(a*.85).toFixed(3)})`;
      ctx.lineWidth=(0.5+near*.8)*s;
      const r=p.r*s*(1+near*.8);
      ctx.beginPath();ctx.moveTo(p.x-r,p.y);ctx.lineTo(p.x+r,p.y);ctx.moveTo(p.x,p.y-r);ctx.lineTo(p.x,p.y+r);ctx.stroke();
      if(near>.35)links.push(p);
    });
    if(links.length>1&&!reduce){
      ctx.strokeStyle='rgba(158,182,255,.08)';ctx.lineWidth=.8*s;
      for(let i=0;i<links.length;i++)for(let j=i+1;j<links.length;j++){
        const a=links[i],b=links[j],d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<140*s){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
      }
    }
    auroraRAF=requestAnimationFrame(draw);
  };
  draw();
}
function stopDotField(){dotOn=false;cancelAnimationFrame(dotRAF)}
function initDotField(){
  const c=$('dotField');if(!c)return;
  const ctx=c.getContext('2d');
  const fit=()=>{const d=PERF.dpr(1.5);c.width=innerWidth*d;c.height=innerHeight*d};
  if(!initDotField.bound){initDotField.bound=true;addEventListener('resize',fit);bindAmbientPointer()}
  fit();dotOn=true;cancelAnimationFrame(dotRAF);let firma='';const st={};
  const draw=now=>{
    if(!dotOn)return;
    const show=document.body.dataset.currentView==='today'&&document.body.classList.contains('today-mode-story');
    if(!show||perfSkip(st,now||performance.now())){dotRAF=requestAnimationFrame(draw);return}
    const f=[ambientMouse.x.toFixed(3),ambientMouse.y.toFixed(3),c.width,c.height,$('appShell')?.classList.contains('trace-ambient-lit')].join();
    if(f===firma){dotRAF=requestAnimationFrame(draw);return}firma=f;
    const w=c.width,h=c.height,gap=26*(w/innerWidth),ox=(ambientMouse.x-.5)*22,oy=(ambientMouse.y-.5)*22;
    const mob=isMobileAmbient();
    const lit=mob&&$('appShell')?.classList.contains('trace-ambient-lit');
    const baseA=mob?(lit?0.12:0.07):0.14;
    const peakA=mob?(lit?0.62:0.38):0.7;
    ctx.clearRect(0,0,w,h);
    for(let y=gap*.5;y<h;y+=gap){for(let x=gap*.5;x<w;x+=gap){
      const dx=x/w-ambientMouse.x,dy=y/h-ambientMouse.y,dist=Math.hypot(dx,dy);
      const near=Math.max(0,1-dist*3.2);
      ctx.fillStyle=`rgba(255,255,255,${(baseA+near*peakA).toFixed(3)})`;
      ctx.beginPath();ctx.arc(x+ox*near,y+oy*near,(0.7+near*1.8)*(w/innerWidth),0,6.2832);ctx.fill();
    }}
    dotRAF=requestAnimationFrame(draw);
  };
  draw();
}
function wordSpans(text){return String(text||'').split(' ').filter(Boolean).map((w,i)=>`<span class="word" style="--d:${80+i*70}ms">${escapeHTML(w)}</span>`).join(' ')}
function headRich(m){if(m.dir==='flat')return 'Hoy tu portafolio casi no cambió';const up=m.dir==='up',cls=up?'up':'down',verb=up?'subió':'bajó',amt=t4amt(m.delta);return `Hoy tu portafolio <span class="hl ${cls}">${verb} ${escapeHTML(t4pct(m.pct))} %</span>${amt?`, <span class="hl ${cls}">${escapeHTML(amt)}</span>`:''}`}
function storyHeadHTML(m){if(m.dir==='flat')return wordSpans('Hoy tu portafolio casi no cambió');const up=m.dir==='up',cls=up?'up':'down',verb=up?'subió':'bajó';const bits=['Hoy','tu','portafolio',verb];const rest=[t4pct(m.pct)+' %'];const amt=t4amt(m.delta);if(amt)rest.push(...amt.split(' '));const all=bits.map(w=>({w,mark:w===verb})).concat(rest.map(w=>({w,mark:true})));return all.map((o,i)=>`<span class="word${o.mark?' hl '+cls:''}" style="--d:${70+i*65}ms">${escapeHTML(o.w+(i===bits.length&&amt?',':''))}</span>`).join(' ')}
function renderTodayStory(m){
  const el=$('todayModeStory');if(!el)return;
  if(!m){el.innerHTML=todayModesEmptyHTML();return}
  const t=m.top,slides=storySlides(m,t);
  if(storySlide>slides.length-1)storySlide=0;
  const dots=slides.map((_,i)=>`<button type="button" class="story-dot${i===storySlide?' on':''}" aria-label="Paso ${i+1}" onclick="event.stopPropagation();storyJump(${i})"></button>`).join('');
  el.innerHTML=`<div class="story-stage"><button type="button" class="story-nav story-nav-prev" aria-label="Anterior" onclick="event.stopPropagation();storyPrev()">‹</button><button type="button" class="story-nav story-nav-next" aria-label="Siguiente" onclick="event.stopPropagation();storyNext()">›</button><div class="story-scroll">${slides.map((html,i)=>`<section class="story-section${i===0?' story-hero':''}${i===2?' story-slide-action':''}${i===3?' story-slide-donut':''}${i===storySlide?' is-on':''}" onclick="storyTap(event)">${html}</section>`).join('')}</div><div class="story-dots">${dots}</div></div>`;
  const on=el.querySelector('.story-section.is-on');if(on)replayStoryWords(on);
  bindStoryGestures(el.querySelector('.story-stage'));
  bindStoryPicksPanel(el);
  maybeStorySwipeHint(el.querySelector('.story-stage'));
  if(m)applyStoryDonutUI(m,{animate:false});
  if(todayMode==='story')initDotField();
}
const STORY_DONUT_PALETTE=['#f4f5f7','#3dcc8e','#9eb6ff','#e2b15a','#f07167'];
function storyDonutSlices(m){
  const c=m.c,shown=m.sorted.slice(0,5);
  let acc=0;
  return shown.map((r,i)=>{
    const p=c.total?(r.p.shares*r.p.price)/c.total*100:0;
    const start=acc;acc+=p;
    return {row:r,start,end:acc,p,color:STORY_DONUT_PALETTE[i%STORY_DONUT_PALETTE.length],t:r.p.t};
  });
}
function storyDonutBaseGradient(slices,pick){
  const parts=slices.map(s=>`${pick?'rgba(255,255,255,.14)':s.color} ${s.start.toFixed(2)}% ${s.end.toFixed(2)}%`);
  const tail=slices.length?slices[slices.length-1].end:0;
  if(tail<99.5)parts.push(`rgba(255,255,255,.08) ${tail.toFixed(2)}% 100%`);
  return `conic-gradient(${parts.join(',')||'#f4f5f7 0 100%'})`;
}
function storyDonutHoleContent(m,slices){
  const c=m.c,picked=storyPick?slices.find(s=>s.t===storyPick)?.row:null;
  if(picked)return `<b>${escapeHTML(picked.p.n)}</b><small class="chg ${picked.chg>=0?'up':'down'}">${escapeHTML(signedCOP(picked.d))}</small>`;
  return `<b>${formatCompactCOP(c.total)}</b><small>en práctica</small>`;
}
function storyDonutHoleMorph(hole,m,slices,animate){
  if(!hole)return;
  const picked=storyPick?slices.find(s=>s.t===storyPick)?.row:null;
  const c=m.c;
  const name=picked?picked.p.n:formatCompactCOP(c.total);
  const sub=picked?signedCOP(picked.d):'en práctica';
  const subCls=picked?(picked.chg>=0?'up':'down'):'';
  const apply=()=>{
    let b=hole.querySelector('b'),sm=hole.querySelector('small');
    if(!b||!sm){hole.innerHTML=storyDonutHoleContent(m,slices);return}
    b.textContent=name;
    if(picked){sm.textContent=sub;sm.className=`chg ${subCls}`}
    else{sm.textContent=sub;sm.className=''}
  };
  if(!animate){apply();return}
  hole.classList.remove('is-swapping');void hole.offsetWidth;hole.classList.add('is-swapping');
  setTimeout(apply,190);
  setTimeout(()=>hole.classList.remove('is-swapping'),580);
}
function applyStoryDonutUI(m,opts){
  const animate=!(opts&&opts.animate===false);
  const root=$('todayModeStory');if(!root||!m)return;
  const donut=root.querySelector('.story-donut-live');if(!donut)return;
  const slices=storyDonutSlices(m);
  const bg=donut.querySelector('.home-donut-bg'),lit=donut.querySelector('.home-donut-lit'),hole=donut.querySelector('.home-donut-hole');
  if(bg)bg.style.background=storyDonutBaseGradient(slices,storyPick);
  if(lit){
    const sel=storyPick?slices.find(s=>s.t===storyPick):null;
    if(sel){
      const span=Math.max(sel.end-sel.start,.35);
      const hadOn=lit.classList.contains('is-on');
      lit.style.setProperty('--lit-color',sel.color);
      lit.style.setProperty('--lit-span',String(span));
      if(!hadOn){
        lit.style.transition='none';
        lit.style.transform=`rotate(${sel.start*3.6}deg)`;
        void lit.offsetWidth;
        lit.style.transition='';
        lit.classList.add('is-on');
      }else lit.style.transform=`rotate(${sel.start*3.6}deg)`;
    }else lit.classList.remove('is-on');
  }
  storyDonutHoleMorph(hole,m,slices,animate);
  root.querySelectorAll('.home-pick[data-t]').forEach(btn=>{btn.classList.toggle('on',btn.dataset.t===storyPick)});
}
function storyPickToggle(t){
  const m=PORTFOLIO.length?todayModel():null;if(!m)return;
  storyPick=storyPick===t?null:t;
  applyStoryDonutUI(m,{animate:true});
}
function maybeStorySwipeHint(stage){
  if(!stage||storySlide!==0||!storyViewOn())return;
  if(!window.matchMedia('(max-width:760px)').matches)return;
  try{if(localStorage.getItem('trace_story_swipe_hint'))return}catch(e){}
  if(stage.querySelector('.story-swipe-hint'))return;
  const hint=document.createElement('div');
  hint.className='story-swipe-hint';
  hint.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Desliza hacia abajo</span>';
  stage.appendChild(hint);
  hint.addEventListener('animationend',()=>{hint.remove();try{localStorage.setItem('trace_story_swipe_hint','1')}catch(e){}},{once:true});
}
function storyDonutSlideActive(){
  if(!storyViewOn())return false;
  return !!$('todayModeStory')?.querySelector('.story-section.is-on.story-slide-donut');
}
function storyNavFromTarget(t){
  if(!t)return false;
  if(t.closest('button,.story-nav,.story-dot'))return false;
  if(!storyDonutSlideActive())return true;
  if(t.closest('.home-pick'))return false;
  {const pk=t.closest('.home-split-picks');return !pk||pk.scrollHeight<=pk.clientHeight+2}
}
function storyTap(e){
  const stage=$('todayModeStory')?.querySelector('.story-stage');
  if(stage?.dataset.skipStoryTap==='1')return;
  if(e.target.closest('button,.story-nav,.story-dots,.home-pick'))return;
  if(storyDonutSlideActive()&&e.target.closest('.home-split-picks,.home-pick'))return;
  if(!storyDonutSlideActive()&&e.target.closest('.home-split-picks'))return;
  if(window.getSelection&&String(window.getSelection()).trim().length>1)return;
  const r=e.currentTarget.getBoundingClientRect();
  const x=(e.clientX-r.left)/Math.max(r.width,1);
  if(x<0.28)storyPrev();else storyNext();
}
function bindStoryPicksPanel(root){
  if(!root)return;
  root.querySelectorAll('.home-split-picks').forEach(panel=>{
    if(panel.dataset.bound)return;
    panel.dataset.bound='1';
    panel.addEventListener('click',e=>e.stopPropagation());
    panel.addEventListener('pointerdown',e=>e.stopPropagation());
  });
  root.querySelectorAll('.home-pick').forEach(btn=>{
    if(btn.dataset.pickBound)return;
    btn.dataset.pickBound='1';
    btn.addEventListener('click',e=>e.stopPropagation());
    btn.addEventListener('pointerdown',e=>e.stopPropagation());
  });
}
function storySwipeFromDelta(dx,dy){
  const ax=Math.abs(dx),ay=Math.abs(dy);
  if(ax<40&&ay<40)return;
  if(ay>ax*1.12){if(dy>36)storyNext();else if(dy<-36)storyPrev();return}
  if(ax<36)return;
  if(dx<-36)storyNext();else if(dx>36)storyPrev();
}
function bindStoryGestures(stage){
  if(!stage||stage.dataset.gestures)return;
  stage.dataset.gestures='1';
  let ptr=null;
  stage.addEventListener('pointerdown',e=>{
    if(!storyViewOn())return;
    if(e.button!==undefined&&e.button!==0)return;
    if(!storyNavFromTarget(e.target))return;
    ptr={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false,nav:true};
    try{stage.setPointerCapture(e.pointerId)}catch{}
  });
  stage.addEventListener('pointermove',e=>{
    if(!ptr||e.pointerId!==ptr.id)return;
    if(Math.hypot(e.clientX-ptr.x,e.clientY-ptr.y)>8)ptr.moved=true;
  });
  stage.addEventListener('pointerup',e=>{
    if(!ptr||e.pointerId!==ptr.id)return;
    try{stage.releasePointerCapture(e.pointerId)}catch{}
    const dx=e.clientX-ptr.x,dy=ptr.y-e.clientY;
    const wasPtr=ptr;ptr=null;
    if(!wasPtr.moved||!wasPtr.nav)return;
    const ax=Math.abs(dx),ay=Math.abs(dy);
    if(ax<40&&ay<40)return;
    stage.dataset.skipStoryTap='1';
    storySwipeFromDelta(dx,dy);
    setTimeout(()=>{delete stage.dataset.skipStoryTap},400);
  });
  stage.addEventListener('pointercancel',()=>{ptr=null});
}
function replayStoryWords(section){
  if(!section)return;
  section.querySelectorAll('.word').forEach(w=>{w.style.animation='none';void w.offsetWidth;w.style.animation=''});
  const flash=section.querySelector('.story-flash');
  if(flash){flash.style.animation='none';void flash.offsetWidth;flash.style.animation=''}
}
let storyNavLock=0;
function storyGo(dir){
  const now=Date.now();
  if(now<storyNavLock)return;
  const m=PORTFOLIO.length?todayModel():null;if(!m)return;
  const n=storySlides(m,m.top).length;
  const next=storySlide+dir;if(next<0||next>=n)return;
  storyNavLock=now+520;
  const root=$('todayModeStory');
  const sections=[...root.querySelectorAll('.story-section')];
  if(sections.length!==n){storySlide=Math.max(0,next);renderTodayStory(m);return}
  sections.forEach(s=>s.classList.remove('is-on'));
  storySlide=next;
  const incoming=sections[storySlide];
  incoming.classList.add('is-on');
  replayStoryWords(incoming);
  root.querySelectorAll('.story-dot').forEach((d,i)=>d.classList.toggle('on',i===storySlide));
  bindStoryPicksPanel(root);
  if(incoming.classList.contains('story-slide-donut'))applyStoryDonutUI(m,{animate:false});
}
function storyNext(){storyGo(1)}
function storyPrev(){storyGo(-1)}
function storyJump(i){storyGo(i-storySlide)}
function storySlides(m,t){
  const palette=STORY_DONUT_PALETTE;
  const shown=m.sorted.slice(0,5);
  const slices=storyDonutSlices(m);
  const hole=storyDonutHoleContent(m,slices);
  const picks=shown.map((r,i)=>{
    const on=storyPick===r.p.t;
    const tk=escapeHTML(r.p.t);
    return `<button type="button" class="home-pick${on?' on':''}" data-t="${tk}" style="--slice:${palette[i%palette.length]}" onclick="event.stopPropagation();storyPickToggle('${tk}')">${logoHTML(r.p,true)}<span><b>${escapeHTML(r.p.n)}</b><small>${pctTxt(r.w)} · ${t4chgTxt(r.chg)}</small></span><span class="chg ${r.chg>=0?'up':'down'}">${signedCOP(r.d)}</span></button>`;
  }).join('');
  const ck=t.chg>0?'up':t.chg<0?'down':'flat';
  return [
    `<div class="story-section-inner"><h2 class="story-h">${storyHeadHTML(m)}</h2><p class="story-p">${escapeHTML((todayLead(m)[0]||'').split('.').slice(0,1).join('.'))}.</p></div>`,
    `<div class="story-section-inner"><h2 class="story-h">${wordSpans('Cuánto movió tu dinero')}</h2><p class="story-metric chg ${m.dir}">${escapeHTML(signedCOP(m.delta))}</p></div>`,
    `<div class="story-section-inner story-slide-action-inner"><p class="story-flash chg ${ck}">${escapeHTML(t4chgTxt(t.chg))}</p><h2 class="story-h">${wordSpans(t.p.n)}</h2><p class="story-p">${pctTxt(t.w)} de tu dinero.</p></div>`,
    `<div class="story-section-inner story-portfolio-inner"><h2 class="story-h">${wordSpans('Tu portafolio')}</h2><div class="home-split story-portfolio-split"><div class="story-donut-zone"><div class="home-donut story-donut-live" role="img" aria-label="Distribución del portafolio"><div class="home-donut-bg" aria-hidden="true"></div><div class="home-donut-lit" aria-hidden="true"></div><div class="home-donut-hole">${hole}</div></div><p class="story-donut-hint">Toca o desliza aquí para cambiar de pantalla</p></div><div class="home-split-picks" role="region" aria-label="Lista de tus acciones"><p class="home-split-picks-k">Tus acciones · desliza solo esta lista</p>${picks}<div class="home-split-picks-spacer" aria-hidden="true"></div></div></div></div>`,
    `<div class="story-section-inner"><h2 class="story-h">${wordSpans('Sigue por aquí')}</h2>${storyRoutesHTML(m)}</div>`
  ];
}
function renderTodayStudio(m){
  const el=$('todayModeStudio');if(!el)return;
  if(!m){el.innerHTML=`<div class="studio-wrap">${todayModesEmptyHTML()}</div>`;return}
  const t=m.top,cc=COLCAP.chg,ck=chgKey(cc),topSec=m.c.sectors[0];
  const news=todayNewsItems();const feat=news[0],side=news.slice(1,3);
  el.innerHTML=`<div class="studio-wrap">
    <header class="studio-hero"><p class="studio-eyebrow">The Trace · Colombia</p><h2 class="studio-title">${escapeHTML(todayHead(m))}</h2><p class="studio-lede">${escapeHTML(todayLead(m).slice(0,2).join(' '))}</p><button class="studio-cta" type="button" onclick="setTodayMode('tech')">Explorar datos</button></header>
    <div class="studio-stats"><div class="studio-stat"><strong class="chg ${m.dir}">${t4pct(m.pct)} %</strong><span>Cambio de tu portafolio hoy</span></div><div class="studio-stat"><strong>${formatCompactCOP(m.c.total)}</strong><span>Valor total hoy</span></div><div class="studio-stat"><strong class="chg ${ck}">${t4pct(cc)} %</strong><span>COLCAP hoy</span></div></div>
    <section class="studio-section"><h3 class="studio-section-h">Explora tu día</h3><p class="studio-section-p">Vista editorial con titulares claros y un acceso directo al detalle numérico del día.</p>
      <div class="studio-cards">
        <button type="button" class="studio-card" onclick="setTodayMode('tech')"><span class="studio-card-k">Datos</span><h3>Panel técnico</h3><p>Gráficas, trazas por acción, COLCAP y noticias con detalle.</p><span class="studio-card-link">Abrir vista técnica →</span></button>
      </div>
    </section>
    <section class="studio-section"><h3 class="studio-section-h">Perspectivas de hoy</h3><p class="studio-section-p">${topSec?`Donde más tienes tu dinero: ${escapeHTML(topSec[0])}. `:''}Estas piezas conectan noticias con el peso de cada acción.</p>
      <div class="studio-news">${feat?`<article class="studio-news-main"><span class="studio-tag">${escapeHTML(labelDir(feat.direccion||'Neutro'))}</span><h3>${escapeHTML(feat.titulo||feat.title||'Noticia destacada')}</h3><p>${escapeHTML(feat.impactWhy||feat.dek||'')}</p></article>`:`<article class="studio-news-main"><p>Hoy no hay noticias sobre tus acciones.</p></article>`}
        <div class="studio-news-side">${side.length?side.map(n=>`<div><span class="studio-tag">${escapeHTML(assetName(n.t||n.ticker))}</span><h4>${escapeHTML(n.titulo||n.title||'')}</h4><p>${escapeHTML((n.impactWhy||n.dek||'').slice(0,120))}…</p></div>`).join(''):'<p style="color:var(--studio-muted);font-size:14px">No hay más noticias por hoy.</p>'}</div>
      </div>
    </section>
    <div class="studio-foot"><p>The Trace · tu día contado como reportaje</p><button class="btn-secondary" type="button" onclick="goHome()">Volver al inicio</button></div>
  </div>`;
}
function renderToday(){if(!$('todayMain'))return;renderTodayDate();const m=PORTFOLIO.length?todayModel():null;renderTodayMain(m);renderTodayColcap(m);renderTodayNews();renderDailyAlert();renderTodayStory(m);renderTodayStudio(m)}
/* Publicidad (plan gratuito). Anuncios FICTICIOS y no financieros. Se elige por día: el portafolio del usuario NO interviene.
   Solo se pintan en #adSlotToday y #adSlotPortfolio; nunca en el chat, el onboarding ni junto a texto de IA. */
const ADS=[
  {b:'Panadería Hornilla Dorada',l:'Pan recién horneado y almojábanas calientes, todas las mañanas.',i:'PH',c:'#F1D9A8'},
  {b:'Cuadernos Mariposa Verde',l:'Cuadernos de papel reciclado para tus apuntes, listas y dibujos.',i:'CM',c:'#BFE0CB'},
  {b:'Bicicletas Cóndor Azul',l:'Alquiler de bicicletas por horas para recorrer la ciudad el fin de semana.',i:'BC',c:'#C3D5F0'}];
function adHTML(off){const d=new Date(),day=Math.floor((d-new Date(d.getFullYear(),0,0))/864e5),a=ADS[(day+off)%ADS.length];return `<aside class="ad" aria-label="Publicidad"><div class="ad-top"><span class="ad-tag">Publicidad</span><button class="btn-ghost ad-off" type="button" onclick="openPlanSheet()">Quitar anuncios</button></div><div class="ad-body"><div class="ad-logo" style="background:${a.c}" aria-hidden="true">${a.i}</div><div><div class="ad-brand">${escapeHTML(a.b)}</div><p class="ad-line">${escapeHTML(a.l)}</p></div></div><p class="ad-note">Los anuncios no usan tu portafolio.</p></aside>`}
/* Anuncio propio: invita a marcas a anunciarse. Se muestra en Portafolio; en Hoy rota un patrocinador. */
function houseAdHTML(){return `<aside class="ad ad-house" aria-label="Publicidad"><div class="ad-top"><span class="ad-tag">Publicidad</span><button class="btn-ghost ad-off" type="button" onclick="openPlanSheet()">Quitar anuncios</button></div><div class="ad-body"><div class="ad-logo ad-logo-house" aria-hidden="true"><svg class="brand-mark" viewBox="0 0 24 24"><use href="#i-logo"/></svg></div><div><div class="ad-brand">Anúnciate en The Trace</div><p class="ad-line">Llega a personas que están aprendiendo a invertir en Colombia.</p></div></div><div class="ad-house-foot"><a class="btn-secondary btn-sm" href="mailto:thetracefinance@gmail.com?subject=Quiero%20anunciarme%20en%20The%20Trace">Escríbenos</a><p class="ad-note">Los anuncios no usan tu portafolio.</p></div></aside>`}
function renderAds(){const a=$('adSlotToday'),b=$('adSlotPortfolio');if(a)a.innerHTML=adHTML(0);if(b)b.innerHTML=houseAdHTML()}
/* Plan de pago Trace+. Sin pagos: el botón solo muestra un aviso. */
let planReturnFocus=null;
const planIsOpen=()=>$('planSheet').classList.contains('open');
function openPlanSheet(){if(planIsOpen())return;renderPlanCta();planReturnFocus=document.activeElement;$('planOverlay').classList.add('open');$('planSheet').classList.add('open');document.body.classList.add('plan-open');setTimeout(()=>$('planClose').focus(),30)}
function closePlanSheet(restore=true){if(!planIsOpen())return;$('planOverlay').classList.remove('open');$('planSheet').classList.remove('open');document.body.classList.remove('plan-open');if(restore&&planReturnFocus&&planReturnFocus.focus)planReturnFocus.focus();planReturnFocus=null}
/* «Avísame»: POST /v1/waitlist/trace-plus. */
function renderPlanCta(){const b=$('planCta');if(!b)return;const on=API.onWaitlist();b.disabled=on;b.textContent=on?'Ya estás en la lista':'Avísame cuando esté listo'}
function planNotify(){if(API.onWaitlist())return;API.waitlist();renderPlanCta();closePlanSheet();showToast(currentUser==='Invitado'?'Listo: te avisaremos aquí cuando Trace+ esté disponible':'Listo: te avisaremos por correo cuando Trace+ esté disponible')}
document.addEventListener('keydown',e=>{
  if(!planIsOpen())return;
  if(e.key==='Escape'){closePlanSheet();return}
  if(e.key==='Tab'){const f=[...$('planSheet').querySelectorAll('button')],first=f[0],last=f[f.length-1],a=document.activeElement;
    if(!$('planSheet').contains(a)){e.preventDefault();first.focus()}else if(e.shiftKey&&a===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&a===last){e.preventDefault();first.focus()}}
});

/* Cerrar ventanas con Escape */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(sheetIsOpen()){closeMoreSheet();return}
    if(extrasOpen()){toggleExtras(false);$('extrasToggle').focus();return}
    closeAddModal();closeResetModal();closeApiModal();closeAssetDrawer();
    const tb=$('topbar'),wasOpen=tb.classList.contains('search-open');
    if(wasOpen||$('searchOverlay').classList.contains('open')){closeSearch();if(wasOpen)$('searchToggle').focus()}
  }else if(e.key==='Tab'&&sheetIsOpen()){
    const f=[...$('moreSheet').querySelectorAll('button')],first=f[0],last=f[f.length-1],a=document.activeElement;
    if(!$('moreSheet').contains(a)){e.preventDefault();first.focus()}
    else if(e.shiftKey&&a===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&a===last){e.preventDefault();first.focus()}
  }
});
/* Si la pantalla pasa a escritorio, se cierran los elementos solo móviles */
window.matchMedia('(max-width:760px)').addEventListener('change',e=>{if(!e.matches){closeMoreSheet(false);$('topbar').classList.remove('search-open');$('searchToggle').setAttribute('aria-expanded','false')}else{toggleExtras(false)}});

/* Cuenta: menú del avatar */
function renderAccount(){const n=$('acctName'),sub=$('acctSub');if(!n)return;const me=API.me(),guest=me.is_guest;n.textContent=guest?'Invitado':me.email;sub.textContent=guest?'Sin correo, portafolio de práctica':'Portafolio de práctica guardado en tu cuenta';const note=$('acctNote');if(note)note.textContent=guest?'Entraste sin correo. Si cierras sesión, se borra tu portafolio de práctica.':'Al cerrar sesión, tu portafolio sigue guardado en tu cuenta.'}
function accountOpen(){const m=$('accountMenu');return m&&!m.hidden}
function toggleAccountMenu(e){if(e)e.stopPropagation();const m=$('accountMenu');if(accountOpen()){closeAccountMenu(true);return}closeSearch();closeMoreSheet(false);toggleExtras(false);renderAccount();m.hidden=false;$('avatarCircle').setAttribute('aria-expanded','true');const f=m.querySelector('.acct-item');if(f)f.focus()}
function closeAccountMenu(restore){const m=$('accountMenu');if(!m||m.hidden)return;m.hidden=true;$('avatarCircle').setAttribute('aria-expanded','false');if(restore)$('avatarCircle').focus()}
function accountGo(v){closeAccountMenu(false);switchView(v)}
function accountPlan(){closeAccountMenu(false);openPlanSheet()}
function accountReset(){closeAccountMenu(false);resetDemo()}
/* Cerrar sesión. Con correo, el portafolio queda en la cuenta. Como invitado, la sesión anónima
   de Supabase se pierde, y con ella el portafolio: por eso aquí se borra. */
function logout(){closeAccountMenu(false);closeMoreSheet(false);closePlanSheet(false);closeAssetDrawer();closeAddModal();closeApiModal();closeResetModal();closeSearch();toggleExtras(false);
  const guest=currentUser==='Invitado';if(guest)localStorage.removeItem(txKey());localStorage.removeItem('trace_session');
  currentUser='Invitado';TX=[];syncPortfolio();setAvatar('Invitado');$('chatLog').innerHTML='';$('todayExplainOut')&&($('todayExplainOut').hidden=true);
  $('appShell').classList.remove('app-shell-active');$('onboarding').classList.remove('active');$('emailInput').value='';magicBack();$('loginScreen').style.display='flex';
  try{window.scrollTo(0,0)}catch{}showToast(guest?'Cerraste sesión. Como entraste sin correo, se borró tu portafolio de práctica.':'Cerraste sesión. Tu portafolio sigue guardado en tu cuenta.')}
document.addEventListener('click',e=>{if(!e.target.closest('.acct-wrap'))closeAccountMenu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAccountMenu(true)});
/* Entrar con correo: Supabase envía un enlace mágico (sin contraseña). «Probar sin correo» = sesión de invitado. */
function magicBack(){const f=$('loginForm'),m=$('magicSent');if(f)f.hidden=false;if(m)m.hidden=true}
document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();const v=$('emailInput').value.trim(),pw=($('passInput')||{}).value||'';if(!v){showToast('Escribe tu correo o usa «Probar sin correo»');$('emailInput').focus();return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){showToast('Revisa tu correo: parece que le falta algo');$('emailInput').focus();return}
  if(!LIVE){enterApp(v.toLowerCase());return}
  if(pw.length<6){showToast('La contraseña debe tener al menos 6 caracteres.');$('passInput').focus();return}
  setLoginBusy(true);try{const p=await TRACE.auth.conCorreo(v.toLowerCase(),pw);await liveEnter(p)}catch(err){showToast(err.message)}finally{setLoginBusy(false)}});


window.addEventListener('chartready',()=>{if(PORTFOLIO.length&&$('appShell').classList.contains('app-shell-active'))renderHoldings()});
/* Arranque seguro */
applyLabels();
function storyViewOn(){return document.body.dataset.currentView==='today'&&document.body.classList.contains('today-mode-story')}
let storyWheelAt=0;
document.addEventListener('wheel',e=>{
  if(!storyViewOn())return;
  const pk=e.target.closest('.home-split-picks');
  if(pk&&pk.scrollHeight>pk.clientHeight+2){const atTop=pk.scrollTop<=0,atEnd=pk.scrollTop+pk.clientHeight>=pk.scrollHeight-2;if((e.deltaY>0&&!atEnd)||(e.deltaY<0&&!atTop))return}
  e.preventDefault();
  const now=Date.now();if(now<storyWheelAt)return;
  const dx=e.deltaX,dy=e.deltaY;
  const ax=Math.abs(dx),ay=Math.abs(dy);
  if(ax<8&&ay<8)return;
  storyWheelAt=now+650;
  if(ay>ax*1.12){if(dy>0)storyNext();else storyPrev()}
  else{if(ax<8)return;if(dx>0)storyPrev();else storyNext()}
},{passive:false});
document.addEventListener('touchmove',e=>{
  if(!storyViewOn())return;
  if(e.target.closest('.story-dots,.home-split-picks'))return;
  {const pk=e.target.closest('.home-split-picks');if(pk&&pk.scrollHeight>pk.clientHeight+2)return}
  e.preventDefault();
},{passive:false});
document.addEventListener('keydown',e=>{
  if(!storyViewOn())return;
  const tag=(e.target&&e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea'||e.target.isContentEditable)return;
  if(e.key==='ArrowDown'||e.key==='PageDown'||e.key==='ArrowRight'||e.key===' '){e.preventDefault();storyNext()}
  else if(e.key==='ArrowUp'||e.key==='PageUp'||e.key==='ArrowLeft'){e.preventDefault();storyPrev()}
});
/* =========================================================================
   CAPA VISUAL: portada, inicio de sesión, cifras que cuentan, cascada,
   revelados al hacer scroll, Estudio, detalle y recibo.
   Regla: el contenido ya está escrito en la página; la animación solo lo acompaña.
   ========================================================================= */
document.documentElement.classList.add('js');
/* Portada e inicio de sesión: fotos del banco de imágenes. Si una no carga, queda la ilustración. */
const ART_PHOTO={towers:'electrica-1',bogota:'seguros-1',login:'bancos-1'};
document.querySelectorAll('img[data-art]').forEach(i=>{const k=ART_PHOTO[i.dataset.art];const fb=artURI(i.dataset.art==='login'?'bogota':i.dataset.art);if(!k){i.src=fb;return}i.onerror=()=>{i.onerror=null;i.src=fb};i.src='/img/sectores/'+k+'.webp'});
const safe=(fn,name)=>{try{fn()}catch(e){console.warn('[visual] '+name,e)}};

/* ---- Cifras que cuentan hasta su valor ---- */
function countUp(el,to,{from=0,fmt=formatCOP,dur=1000}={}){if(!el)return;const t0=performance.now();const ease=x=>1-Math.pow(1-x,3);
  const step=now=>{const k=Math.min(1,(now-t0)/dur);el.textContent=fmt(from+(to-from)*ease(k));if(k<1)requestAnimationFrame(step);else el.textContent=fmt(to)};requestAnimationFrame(step)}
function countIn(el){if(!el||el.dataset.counted)return;el.dataset.counted='1';countUp(el,Number(el.dataset.ldCount)||0)}

/* ---- Revelado al entrar en pantalla, con red de seguridad ---- */
let rvObs=null;
function rvObserver(){if(rvObs)return rvObs;rvObs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rvObs.unobserve(e.target)}}),{threshold:0.05,rootMargin:'0px 0px -6% 0px'});return rvObs}
function observeRv(nodes){const o=rvObserver();nodes.forEach(n=>o.observe(n));setTimeout(()=>nodes.forEach(n=>n.classList.add('in')),6000)}
function revealItems(root,sel){if(!root)return;const items=[...root.querySelectorAll(sel)].filter(n=>!n.classList.contains('rv-i'));items.forEach((n,i)=>{n.classList.add('rv-i');n.style.setProperty('--i',Math.min(i,6))});observeRv(items)}

/* ---- Gráficas: se dibujan una sola vez por gráfica y periodo ---- */
const CHART_SEEN=new Set();
function markCharts(root,key){(root||document).querySelectorAll('.daychart-plot').forEach(pl=>{const id=(pl.closest('[data-live-chart]')||{}).dataset?.liveChart||key||'chart';const k=id+'|'+(key||chartRange);if(CHART_SEEN.has(k))pl.classList.add('no-anim');else CHART_SEEN.add(k)})}

/* =================== PORTADA =================== */
function showLanding(){document.body.classList.add('on-landing');$('loginScreen').style.display='';try{window.scrollTo(0,0)}catch{}safe(initLanding,'landing');ldStep=-1;ldOnScroll()}
function openLogin(){document.body.classList.remove('on-landing');$('loginScreen').style.display='flex';try{window.scrollTo(0,0)}catch{}safe(animateLoginPreview,'preview');setTimeout(()=>{const i=$('emailInput');if(i&&matchMedia('(hover:hover)').matches)i.focus({preventScroll:true})},350)}
function backToLanding(){magicBack();showLanding()}
let ldBound=false,ldTick=false,ldStep=-1;
function initLanding(){if(ldBound)return;ldBound=true;
  const mq=$('ldMarquee');if(mq&&!mq.children.length){const items=POOL_EXPANDIDO.map(a=>`<span>${logoHTML(a,true)}${escapeHTML(a.n)}<em class="${a.chg>=0?'up':'down'}">${a.chg>=0?'▲':'▼'} ${t4pct(a.chg)} %</em></span>`).join('');mq.innerHTML=items+items}
  const ft=$('ldFillTxt');if(ft&&!ft.dataset.split){ft.dataset.split='1';const hl=['explicamos','pasó,','tú.'];ft.innerHTML=ft.textContent.trim().split(/\s+/).map(w=>`<span class="fw${hl.includes(w)?' hl':''}">${escapeHTML(w)}</span>`).join(' ')}
  observeRv([...document.querySelectorAll('#landing .rv')]);
  document.querySelectorAll('.ld-card').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}));
  addEventListener('scroll',ldOnScroll,{passive:true});addEventListener('resize',ldOnScroll);
}
function ldProg(el){const r=el.getBoundingClientRect(),t=r.height-innerHeight;return t>0?Math.min(1,Math.max(0,-r.top/t)):0}
function ldOnScroll(){if(ldTick)return;ldTick=true;requestAnimationFrame(()=>{ldTick=false;if(!document.body.classList.contains('on-landing'))return;
  const y=scrollY;$('ldTop')?.classList.toggle('is-solid',y>40);
  document.querySelector('.ld-hero-in')?.style.setProperty('--hy',Math.min(y,700));
  const st=$('ldStory');
  if(st){const p=ldProg(st),step=Math.min(3,Math.floor(p*4.0001));
    if(step!==ldStep){ldStep=step;st.querySelectorAll('.ld-step').forEach((s,i)=>{s.classList.toggle('is-on',i===step);s.classList.toggle('is-past',i<step)});st.querySelectorAll('.ld-scr').forEach((s,i)=>s.classList.toggle('is-on',i===step));st.querySelectorAll('.ld-prog i').forEach((b,i)=>{b.classList.toggle('on',i===step);b.classList.toggle('done',i<step)});if(step===0)countIn(st.querySelector('[data-ld-count]'))}
    const ph=$('ldPhone');if(ph){const local=(p*4)%1;ph.style.setProperty('--rot',((p-.5)*-16).toFixed(2));ph.style.setProperty('--rx',(Math.sin(p*Math.PI)*5).toFixed(2));ph.style.setProperty('--py',((local-.5)*-12).toFixed(1));ph.style.setProperty('--glow',(.1+p*.22).toFixed(2))}}
  const z=$('ldZoom');if(z)z.style.setProperty('--z',Math.min(1,ldProg(z)*1.5).toFixed(3));
  const f=$('ldFill');if(f){const ws=f.querySelectorAll('.fw'),n=Math.round(Math.min(1,ldProg(f)*1.3)*ws.length);ws.forEach((w,i)=>w.classList.toggle('on',i<n))}
})}

/* =================== INICIO DE SESIÓN =================== */
function animateLoginPreview(){const pv=document.querySelector('#loginScreen .preview');if(!pv)return;
  pv.querySelectorAll('.preview-row').forEach((r,i)=>{r.classList.remove('pv-in');void r.offsetWidth;r.style.setProperty('--i',i);r.classList.add('pv-in')});
  const c=pv.querySelector('[data-ld-count]');if(c){delete c.dataset.counted;countIn(c)}
  const art=document.querySelector('.login-art');if(art&&!art.dataset.tilt){art.dataset.tilt='1';art.addEventListener('pointermove',e=>{const r=art.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;pv.style.setProperty('--tx',(x*10).toFixed(2)+'deg');pv.style.setProperty('--ty',(-y*8).toFixed(2)+'deg')});art.addEventListener('pointerleave',()=>{pv.style.setProperty('--tx','0deg');pv.style.setProperty('--ty','0deg')})}}

/* =================== INSIGHTS =================== */
const _renderTodayStory=renderTodayStory;
renderTodayStory=function(m){_renderTodayStory(m);document.body.dataset.day=m?m.dir:'flat';document.querySelectorAll('#todayModeStory .story-dot').forEach((d,i)=>d.classList.toggle('done',i<storySlide))};
const _storyGo=storyGo;
storyGo=function(dir){_storyGo(dir);document.querySelectorAll('#todayModeStory .story-dot').forEach((d,i)=>d.classList.toggle('done',i<storySlide))};

/* =================== HOY: CASCADA =================== */
/* Cada acción empieza donde terminó la anterior; al final, el total del día. */
function traceRows(m){
  let cum=0;const steps=m.sorted.map(r=>{const a=cum;cum+=r.d;return{r,a,b:cum}});
  const lo=Math.min(0,...steps.map(s=>Math.min(s.a,s.b))),hi=Math.max(0,...steps.map(s=>Math.max(s.a,s.b))),span=(hi-lo)||1;
  const pos=v=>(v-lo)/span*100,zero=pos(0).toFixed(2);
  const axis=`<li class="trace-row axis" aria-hidden="true"><span class="trace-name"></span><span class="trace-axis"><span>Restó</span><span>Sumó</span></span><span class="trace-val"></span></li>`;
  const body=steps.map((s,i)=>{const r=s.r,k=r.d>0.5?'up':r.d<-0.5?'down':'flat',ck=chgKey(r.chg),act=activeTraceTicker===r.p.t;const l=pos(Math.min(s.a,s.b)),w=Math.max(Math.abs(pos(s.b)-pos(s.a)),.8);const tk=escapeHTML(r.p.t);
    return `<li class="trace-row wf${act?' is-active':''}" style="--i:${i}" role="button" tabindex="0" onclick="setActiveTrace('${tk}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setActiveTrace('${tk}')}"><span class="trace-name">${logoHTML(r.p,true)}<span><strong>${escapeHTML(r.p.n)}</strong><small>${pctTxt(r.w)} de tu dinero</small></span></span><span class="trace-bar wf" style="--zero:${zero}%" aria-hidden="true"><span class="${k}" style="left:${l.toFixed(2)}%;width:${w.toFixed(2)}%"></span></span><span class="trace-val"><strong class="chg ${k}">${signedCOP(r.d)}</strong><small class="chg ${ck}">${t4chgTxt(r.chg)}</small></span></li>`}).join('');
  const tk=m.delta>0.5?'up':m.delta<-0.5?'down':'flat',tl=pos(Math.min(0,cum)),tw=Math.max(Math.abs(pos(cum)-pos(0)),.8);
  const total=`<li class="trace-row wf total" style="--i:${steps.length}"><span class="trace-name"><span class="wf-sum" aria-hidden="true">=</span><span><strong>Tu día</strong><small>La suma de todas tus acciones</small></span></span><span class="trace-bar wf" style="--zero:${zero}%" aria-hidden="true"><span class="${tk}" style="left:${tl.toFixed(2)}%;width:${tw.toFixed(2)}%"></span></span><span class="trace-val"><strong class="chg ${tk}">${signedCOP(m.delta)}</strong><small class="chg ${m.dir}">${dirArrow(m.dir)} ${t4pct(m.pct)} %</small></span></li>`;
  return axis+body+total}
let wfSeen=false;
const _renderTodayMain=renderTodayMain;
renderTodayMain=function(m){_renderTodayMain(m);const el=$('todayMain');if(!el||!m)return;
  const sub=el.querySelector('.trace-head .panel-sub');if(sub)sub.textContent='Cada barra empieza donde terminó la anterior. Toca una fila para resaltarla.';
  const tp=el.querySelector('.trace-panel');if(tp&&wfSeen)tp.classList.add('wf-done');wfSeen=true;
  markCharts(el);
  const sv=el.querySelector('.hero-stat .stat-value');if(sv&&!renderTodayMain._counted){renderTodayMain._counted=true;countUp(sv,m.delta,{fmt:signedCOP})}};

/* =================== PORTAFOLIO =================== */
let lastTotal=null;
const _renderHoldings=renderHoldings;
renderHoldings=function(){_renderHoldings();const c=calculatePortfolio();if(lastTotal!==null&&Math.round(lastTotal)!==Math.round(c.total))countUp($('heroTotal'),c.total,{from:lastTotal,dur:800});else if(lastTotal===null&&c.total)countUp($('heroTotal'),c.total,{dur:1100});lastTotal=c.total;markCharts($('pfHistory'))};

/* =================== NOTICIAS, MERCADO, LECTURA =================== */
const _renderRadar=renderRadar;renderRadar=function(){_renderRadar();revealItems($('briefList'),'.news-card')};
const _renderTodayNews=renderTodayNews;renderTodayNews=function(){_renderTodayNews();revealItems($('todayNewsList'),'.feature,.story-row')};
const _renderMarket=renderMarket;renderMarket=function(){_renderMarket();revealItems($('moversList'),'.market-row');revealItems($('marketHeatmap'),'.heat')};
const _renderInsights=renderInsights;renderInsights=function(){_renderInsights();revealItems($('insightSignals'),'.signal')};

/* =================== ESTUDIO =================== */
const _renderTodayStudio=renderTodayStudio;
renderTodayStudio=function(m){_renderTodayStudio(m);const hero=document.querySelector('#todayModeStudio .studio-hero');if(!hero||!m)return;
  const p=PHOTOS[SECTOR_PHOTO[m.top.p.sector]||'bogota'];
  hero.insertAdjacentHTML('afterbegin',`<div class="studio-hero-media" aria-hidden="true"><img src="${photoUrl(p,1600)}" alt="" onerror="this.remove()"></div>`);
  
  revealItems($('todayModeStudio'),'.studio-section,.studio-stat,.studio-card');studioScroll()};
let stTick=false;
function studioScroll(){if(stTick)return;stTick=true;requestAnimationFrame(()=>{stTick=false;if(!document.body.classList.contains('today-mode-studio'))return;const h=document.querySelector('#todayModeStudio .studio-hero');if(!h)return;const r=h.getBoundingClientRect();const p=Math.min(1,Math.max(0,-r.top/(r.height*.9)));h.style.setProperty('--sp',p.toFixed(3))})}
addEventListener('scroll',studioScroll,{passive:true});

/* =================== DETALLE DE ACCIÓN =================== */
const _openAssetDetail=openAssetDetail;
openAssetDetail=function(t,keep){_openAssetDetail(t,keep);const a=assetOf0(t);if(!a)return;const head=document.querySelector('#assetDrawer .drawer-head');
  let mini=$('drawerMini');if(!mini&&head){head.querySelector('.close-btn').insertAdjacentHTML('beforebegin','<div class="drawer-mini" id="drawerMini" aria-hidden="true"></div>');mini=$('drawerMini')}
  if(mini)mini.innerHTML=`<strong>${formatCOP(a.price)}</strong><span class="chg ${chgKey(a.chg)}">${dirArrow(chgKey(a.chg))} ${t4pct(a.chg)} %</span>`;
  const body=$('drawerBody');markCharts(body,'drawer|'+t+'|'+drawerRange);
  if(body&&!body.dataset.mini){body.dataset.mini='1';body.addEventListener('scroll',()=>{const y=body.scrollTop;$('drawerMini')?.classList.toggle('show',y>150);const hero=body.querySelector('.drawer-hero');if(hero)hero.style.setProperty('--dy',Math.min(y,300))},{passive:true})}
  if(!keep){mini&&mini.classList.remove('show')}};

/* =================== RECIBO DE COMPRA O VENTA =================== */
let TRADE_FORM_HTML=null;
function restoreTradeForm(){const m=document.querySelector('#addModal .modal');if(!m)return;if(TRADE_FORM_HTML===null)TRADE_FORM_HTML=m.innerHTML;else if(m.querySelector('.rc'))m.innerHTML=TRADE_FORM_HTML}
const _openTradeModal=openTradeModal;
openTradeModal=function(kind,t){restoreTradeForm();return _openTradeModal(kind,t)};
function submitTrade(){const t=$('addTickerSelect').value,v=tradeValue(),px=parseCOP($('tradePrice').value);
  const body={ticker:t,kind:TRADE.kind,day:$('tradeDay').value||null,price:px||null};
  if(TRADE.mode==='amount')body.amount=v;else body.quantity=v;
  const before=PORTFOLIO.find(x=>x.t===t);
  const res=API.addTransaction(body);
  if(!res.ok){const e=$('tradeErr');e.textContent=res.detail;e.hidden=false;return}
  const tx=res.data,gain=tx.kind==='sell'&&before?(tx.price-before.avg_cost)*tx.quantity:null;
  syncPortfolio();refreshAll();showReceipt(tx,gain)}
function showReceipt(tx,gain){const a=assetOf0(tx.ticker)||{t:tx.ticker,n:tx.ticker,sector:''},buy=tx.kind==='buy';const m=document.querySelector('#addModal .modal');
  m.innerHTML=`<div class="rc" role="status"><div class="rc-check" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div><p class="rc-k">${buy?'Compra registrada':'Venta registrada'}</p><h3 class="rc-h" id="addTitle">${buy?'Compraste':'Vendiste'} ${qtyTxt(tx.quantity)} acciones de ${escapeHTML(a.n)}</h3>
  <div class="rc-ticket"><div class="rc-row"><span>Acción</span><b>${logoHTML(a,true)}${escapeHTML(a.n)}</b></div><div class="rc-row"><span>Fecha</span><b>${escapeHTML(dayTxt(tx.day))}</b></div><div class="rc-row"><span>Cantidad</span><b>${qtyTxt(tx.quantity)} acciones</b></div><div class="rc-row"><span>Precio por acción</span><b>${formatCOP(tx.price)}</b></div><div class="rc-sep"></div><div class="rc-row rc-total"><span>${buy?'Pagaste':'Recibiste'}</span><b>${formatCOP(tx.quantity*tx.price)}</b></div>${gain!=null?`<div class="rc-row"><span>Frente a lo que pagaste</span><b>${gainHTML(gain)}</b></div>`:''}</div>
  <p class="rc-note">Es de práctica, sin dinero real.</p><div class="modal-actions"><button class="btn-primary" type="button" onclick="closeAddModal()">Listo</button><button class="btn-secondary" type="button" onclick="closeAddModal();switchView('portfolio');setTimeout(()=>$('txPanel').scrollIntoView({behavior:'smooth',block:'start'}),120)">Ver tus movimientos</button></div></div>`;
  setTimeout(()=>m.querySelector('.btn-primary')?.focus(),60)}

/* =================== ENTRAR Y SALIR =================== */
const _enterApp=enterApp;enterApp=function(u){document.body.classList.remove('on-landing');return _enterApp(u)};

/* =================== DONA SVG (portafolio y onboarding) =================== */
function arcPath(cx,cy,r0,r1,a0,a1){const p=(r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];const big=a1-a0>Math.PI?1:0;const [x0,y0]=p(r1,a0),[x1,y1]=p(r1,a1),[x2,y2]=p(r0,a1),[x3,y3]=p(r0,a0);return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r1} ${r1} 0 ${big} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${r0} ${r0} 0 ${big} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`}
/* items: [{key,label,value,color}] */
function donutSVG(items,{id='dn',center='',sub=''}={}){const tot=items.reduce((s,x)=>s+x.value,0)||1;let a=-Math.PI/2;const gap=items.length>1?0.018:0;
  const segs=items.map((it,i)=>{const sweep=it.value/tot*Math.PI*2;const a0=a+gap/2,a1=a+sweep-gap/2;const mid=a+sweep/2;a+=sweep;return `<path class="dn-seg" data-i="${i}" style="--c:${it.color};--dx:${(Math.cos(mid)*7).toFixed(1)}px;--dy:${(Math.sin(mid)*7).toFixed(1)}px;--d:${i*90}ms" d="${arcPath(100,100,62,92,a0,Math.max(a0+0.001,a1))}"/>`}).join('');
  return `<div class="dn" id="${id}"><svg viewBox="0 0 200 200" aria-hidden="true">${segs}</svg><div class="dn-center"><strong data-dn-c>${center}</strong><span data-dn-s>${sub}</span></div></div>`}
function bindDonut(root,items,fmt){const dn=root.querySelector('.dn');if(!dn)return;const c=dn.querySelector('[data-dn-c]'),s=dn.querySelector('[data-dn-s]'),c0=c.innerHTML,s0=s.innerHTML;const tot=items.reduce((a,x)=>a+x.value,0)||1;
  const show=i=>{dn.querySelectorAll('.dn-seg').forEach(p=>p.classList.toggle('on',+p.dataset.i===i));dn.classList.toggle('has-on',i!=null);if(i==null){c.innerHTML=c0;s.innerHTML=s0;return}const it=items[i];c.textContent=Math.round(it.value/tot*100)+' %';s.textContent=it.label+(fmt?' · '+fmt(it.value):'');if(it.key)root.dispatchEvent(new CustomEvent('dnpick',{detail:it.key}))};
  dn.querySelectorAll('.dn-seg').forEach(p=>{const i=+p.dataset.i;p.addEventListener('pointerenter',()=>show(i));p.addEventListener('click',e=>{e.stopPropagation();show(i)})});
  dn.addEventListener('pointerleave',()=>show(null));return show}

/* =================== MI PORTAFOLIO =================== */
let pfLast=null;
renderHoldings=function(){const c=calculatePortfolio();if(activeSectorFilter!=='all'&&!c.sectorTotals[activeSectorFilter])activeSectorFilter='all';
  $('heroAssets').textContent=PORTFOLIO.length?`${PORTFOLIO.length} ${PORTFOLIO.length===1?'acción':'acciones'} · ${freshShort()}`:'Aún no tienes acciones';
  $('colcapLine').textContent=COLCAP.proxy?`Como referencia, el COLCAP hoy ${COLCAP.chg>=0?'subió':'bajó'} ${t4pct(COLCAP.chg)} %.`:`Como referencia, el COLCAP está en ${NUM_FMT.format(COLCAP.valor)} puntos y hoy ${COLCAP.chg>=0?'subió':'bajó'} ${t4pct(COLCAP.chg)} %.`;
  renderConcNotice(c);renderPfHistory();renderPfDonut(c);renderSectorFilters(c);
  const list=PORTFOLIO.map((p,i)=>[p,i]).filter(([p])=>activeSectorFilter==='all'||p.sector===activeSectorFilter);
  $('holdingsBody').innerHTML=list.map(([p,i])=>pfCard(p,i)).join('')||`<div class="empty-state"><div class="empty-icon"><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></div><h3>Tu portafolio está vacío</h3><p>Compra una acción de práctica para empezar.</p><button class="btn-primary" type="button" onclick="openTradeModal('buy')">Comprar una acción</button></div>`;
  revealItems($('holdingsBody'),'.pfc');
  document.querySelectorAll('#holdingsBody .pfc').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--mx',(e.clientX-r.left)+'px');card.style.setProperty('--my',(e.clientY-r.top)+'px')}));
  renderTxList();renderInsights();miniBarUpdate()};
function pfCard(p,i){const tk=escapeHTML(p.t),k=chgKey(Math.round(p.gain)),col=sectorColor(p.sector),sel=selectedTicker===p.t,dim=selectedTicker&&!sel;
  return `<article class="pfc${sel?' is-sel':''}${dim?' is-dim':''}" style="--c:${col}" data-t="${tk}">
  <button class="pfc-hit" type="button" aria-label="Ver detalle de ${escapeHTML(p.n)}" onclick="pfOpen(this,${i})"></button>
  <div class="pfc-spark" aria-hidden="true">${sparkSVG(assetSeries(p),chgKey(p.chg),240,70).replace('width="240"','width="100%"').replace('height="70"','height="100%"')}</div>
  <div class="pfc-top">${logoHTML(p)}<div class="pfc-id"><strong>${escapeHTML(shortName(p.n))}</strong><span><i class="sec-dot" style="--c:${col}"></i>${escapeHTML(p.sector)}</span></div><span class="pill ${chgKey(p.chg)}">${dirArrow(chgKey(p.chg))} ${t4pct(p.chg)} %</span></div>
  <div class="pfc-val"><span>Vale hoy</span><strong>${formatCOP(p.value)}</strong></div>
  <div class="pfc-row"><span class="pill ${k} pill-lg">${escapeHTML(signedCOP(p.gain))} · ${fmtPct(p.gain_pct)}</span><span class="pfc-q">${qtyTxt(p.shares)} acciones · costo promedio ${formatCOP(p.avg_cost)}</span></div>
  <div class="pfc-w"><div class="pfc-w-top"><span>Qué parte de tu dinero</span><b>${pctTxt(p.weight_pct)}</b></div><div class="pfc-meter"><i style="--w:${Math.min(p.weight_pct,100)}%"></i></div></div>
  <div class="pfc-act"><button class="btn-secondary btn-sm" type="button" onclick="openTradeModal('buy','${tk}')">Comprar</button><button class="btn-secondary btn-sm" type="button" onclick="openTradeModal('sell','${tk}')">Vender</button></div></article>`}
function pfOpen(btn,i){const card=btn.closest('.pfc');if(card){card.classList.add('is-press');setTimeout(()=>card.classList.remove('is-press'),380)}const d=$('assetDrawer');if(d&&card){const r=card.getBoundingClientRect();d.style.setProperty('--ox',(r.left+r.width/2)+'px');d.style.setProperty('--oy',(r.top+r.height/2)+'px');d.classList.add('from-card');setTimeout(()=>d.classList.remove('from-card'),700)}openAssetDrawer(i)}
const shortName=n=>String(n||'').replace(/\s*\(.*\)\s*/,'');
let pfDonutShow=null;
function renderPfDonut(c){const el=$('pfDonut');if(!el)return;if(!PORTFOLIO.length){el.innerHTML='';$('sectorList').innerHTML='';return}
  const items=PORTFOLIO.map(p=>({key:p.t,label:shortName(p.n),value:p.value,color:sectorColor(p.sector)}));
  el.innerHTML=donutSVG(items,{id:'pfDn',center:formatCompactCOP(c.total),sub:'vale tu portafolio'});
  pfDonutShow=bindDonut(el,items,formatCompactCOP);
  $('sectorList').innerHTML=items.map((it,i)=>`<button type="button" class="pfl-item" style="--c:${it.color}" onpointerenter="pfDonutShow&&pfDonutShow(${i})" onpointerleave="pfDonutShow&&pfDonutShow(null)" onclick="highlightTicker('${escapeHTML(it.key)}')"><i></i><span>${escapeHTML(it.label)}</span><b>${pctTxt(it.value/c.total*100)}</b></button>`).join('')}
renderConcNotice=function(c){const el=$('concNotice'),top=c.sectors[0],w=top&&c.total?top[1]/c.total*100:0;if(w<40){el.hidden=true;return}el.hidden=false;el.style.setProperty('--w',Math.round(w)+'%');el.innerHTML=`<div class="cn-txt"><b>${Math.round(w)} % de tu dinero está en ${escapeHTML(top[0])}.</b><span>Si a ese sector le va mal, tu portafolio lo sentirá más.</span></div><div class="cn-bar"><i></i></div>`};
/* El historial como portada del portafolio */
renderPfHistory=function(){const el=$('pfHistory');if(!el)return;const c=calculatePortfolio();const g=Math.round(c.gain),k=chgKey(g),dk=chgKey(Math.round(c.delta));
  if(!PORTFOLIO.length&&!TX.length){el.innerHTML='';return}
  el.innerHTML=liveDayChartHTML('pfHistChart',portfolioSeriesForRange(),{label:'Cuánto vale hoy tu portafolio',value:formatCOP(c.total),meta:'',k:k,cls:'pf-hero-chart',aria:'Cómo ha ido tu portafolio frente a lo que pagaste'});
  const top=el.querySelector('.daychart-top');if(top)top.insertAdjacentHTML('afterend',`<div class="pfh-line"><p class="pfh-sent">Desde que empezaste, ${g>=0?'ganas':'pierdes'} <b class="chg ${k}">${formatCOP(Math.abs(c.gain))}</b>${c.invested?` <span class="chg ${k}">(${fmtPct(c.gain_pct)})</span>`:''}.</p><span class="pill ${dk}">Hoy ${dirArrow(dk)} ${formatCOP(Math.abs(c.delta))}</span><span class="pfh-paid">Pagaste ${formatCOP(c.invested)}${Math.round(c.realized)?` · con lo vendido ${escapeHTML(signedCOP(c.realized))}`:''}</span></div>`);
  const v=el.querySelector('.daychart-val');if(v){v.dataset.final=formatCOP(c.total);if(pfLast===null)countUp(v,c.total,{dur:1100});else if(Math.round(pfLast)!==Math.round(c.total))countUp(v,c.total,{from:pfLast,dur:800});}
  pfLast=c.total;markCharts(el);requestAnimationFrame(bindLiveCharts)};
/* Tus movimientos como línea de tiempo, con «Deshacer» */
renderTxList=function(){const el=$('txList');if(!el)return;const txs=API.transactions();if(!txs.length){el.innerHTML='<p class="t-empty tx-empty">Aún no tienes movimientos. Tu primera compra aparecerá aquí.</p>';return}
  const groups=[];txs.forEach(m=>{const g=groups[groups.length-1];if(g&&g.day===m.day)g.items.push(m);else groups.push({day:m.day,items:[m]})});
  el.innerHTML=groups.map(g=>`<div class="tl-g"><p class="tl-day">${escapeHTML(g.day===HOY_ISO?'Hoy':dayTxt(g.day))}</p>${g.items.map(m=>{const a=assetOf0(m.ticker)||{t:m.ticker,n:m.ticker,sector:''},buy=m.kind==='buy';return `<div class="tl-item ${buy?'buy':'sell'}"><span class="tl-dot" aria-hidden="true"></span>${logoHTML(a,true)}<div class="tl-main"><strong>${buy?'Compraste':'Vendiste'} ${escapeHTML(shortName(a.n))}</strong><span>${qtyTxt(m.quantity)} acciones a ${formatCOP(m.price)}</span></div><strong class="tl-total ${buy?'':'chg up'}">${buy?'−':'+'}${formatCOP(m.quantity*m.price)}</strong><button class="tl-del" type="button" aria-label="Borrar ${buy?'la compra':'la venta'} de ${escapeHTML(a.n)}" onclick="deleteTx(${m.id})"><svg class="ico" aria-hidden="true"><use href="#i-x"/></svg></button></div>`}).join('')}</div>`).join('');
  revealItems(el,'.tl-item')};
let undoTimer=null,undoTx=null;
deleteTx=function(id){const tx=TX.find(x=>x.id===id);const res=API.deleteTransaction(id);if(!res.ok){showToast(res.detail);return}syncPortfolio();refreshAll();undoTx=tx;showUndo('Borraste el movimiento')};
function showUndo(msg){let u=$('undoBar');if(!u){document.body.insertAdjacentHTML('beforeend','<div class="undo" id="undoBar" role="status"><span></span><button type="button" onclick="doUndo()">Deshacer</button><i></i></div>');u=$('undoBar')}u.querySelector('span').textContent=msg;u.classList.remove('show');void u.offsetWidth;u.classList.add('show');clearTimeout(undoTimer);undoTimer=setTimeout(()=>u.classList.remove('show'),5000)}
function doUndo(){const u=$('undoBar');u&&u.classList.remove('show');if(!undoTx)return;const t=undoTx;undoTx=null;const r=API.addTransaction({ticker:t.ticker,kind:t.kind,quantity:t.quantity,price:t.price,day:t.day});if(!r.ok){showToast(r.detail);return}syncPortfolio();refreshAll();showToast('Listo: el movimiento volvió')}
/* Lectura vive dentro del portafolio */
const _switchView3=switchView;
switchView=function(name,opts={}){if(name==='insights'){_switchView3('portfolio',opts);setTimeout(()=>$('pfLectura')?.scrollIntoView({behavior:'smooth',block:'start'}),120);return}return _switchView3(name,opts)};
const _runPortfolioAI=runPortfolioAI;
runPortfolioAI=async function(q){const out=$('insightSummary');await _runPortfolioAI(q);if(out)typeIn(out)};

/* =================== BARRA MINI FIJA =================== */
function miniBarUpdate(){let b=$('miniBar');if(!b){document.body.insertAdjacentHTML('beforeend','<div class="minibar" id="miniBar" aria-hidden="true"><div class="mb-in"><span class="mb-k"></span><strong class="mb-v"></strong><span class="mb-c"></span><button class="btn-primary btn-sm mb-btn" type="button" tabindex="-1" onclick="openTradeModal(\'buy\')">Comprar o vender</button></div></div>');b=$('miniBar')}
  const v=document.body.dataset.currentView;const tech=v==='today'&&document.body.classList.contains('today-mode-tech');const c=calculatePortfolio();
  if(v==='portfolio'){b.querySelector('.mb-k').textContent='Tu portafolio';b.querySelector('.mb-v').textContent=formatCOP(c.total);const k=chgKey(Math.round(c.gain));b.querySelector('.mb-c').innerHTML=`<span class="chg ${k}">${escapeHTML(signedCOP(c.gain))}</span>`;b.querySelector('.mb-btn').hidden=false}
  else if(tech&&PORTFOLIO.length){const m=todayModel();b.querySelector('.mb-k').textContent='Hoy';b.querySelector('.mb-v').innerHTML=`<span class="chg ${m.dir}">${dirArrow(m.dir)} ${t4pct(m.pct)} %</span>`;b.querySelector('.mb-c').innerHTML=`<span class="chg ${m.dir}">${escapeHTML(signedCOP(m.delta))}</span>`;b.querySelector('.mb-btn').hidden=true}
  miniBarScroll()}
function miniBarScroll(){const b=$('miniBar');if(!b)return;const v=document.body.dataset.currentView;const on=(v==='portfolio'||(v==='today'&&document.body.classList.contains('today-mode-tech')))&&scrollY>360&&$('appShell').classList.contains('app-shell-active');b.classList.toggle('show',on)}
addEventListener('scroll',()=>requestAnimationFrame(miniBarScroll),{passive:true});
const _switchViewMB=switchView;switchView=function(n,o){const r=_switchViewMB(n,o);miniBarUpdate();return r};

/* =================== TEXTO QUE SE ESCRIBE =================== */
function typeIn(el){if(!el)return;const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);let k=0;
  nodes.forEach(n=>{if(!n.textContent.trim())return;const frag=document.createDocumentFragment();n.textContent.split(/(\s+)/).forEach(w=>{if(/^\s+$/.test(w)||!w){frag.appendChild(document.createTextNode(w));return}const s=document.createElement('span');s.className='tw';s.style.setProperty('--d',Math.min(k++,140)*28+'ms');s.textContent=w;frag.appendChild(s)});n.parentNode.replaceChild(frag,n)})}

/* =================== ONBOARDING =================== */
/* Paso 1: elegir empresas. Paso 2: total y reparto libre. Al final, una compra por empresa
   (POST /v1/portfolio/transactions {ticker, kind:'buy', amount}) con el monto que le diste. */
const OB_MIN=0.02,OB_MAXN=5;
Object.assign(OB,{w:[],locks:[]});
function obAmounts(){const n=OB.picked.length;if(!n)return[];const raw=OB.w.map(f=>Math.floor(OB.amount*f));const diff=OB.amount-raw.reduce((s,x)=>s+x,0);raw[raw.indexOf(Math.max(...raw))]+=diff;return raw}
function obEqual(){const n=OB.picked.length;OB.w=Array(n).fill(n?1/n:0);OB.locks=Array(n).fill(false)}
function obSetShare(i,f){const n=OB.w.length;if(n<2){OB.w=[1];return}
  const free=[...Array(n).keys()].filter(j=>j!==i&&!OB.locks[j]);if(!free.length)return;
  const lockedSum=OB.w.reduce((s,x,j)=>j!==i&&OB.locks[j]?s+x:s,0);
  f=Math.min(Math.max(f,OB_MIN),1-lockedSum-OB_MIN*free.length);
  const rest=1-lockedSum-f,cur=free.reduce((s,j)=>s+OB.w[j],0);
  free.forEach(j=>OB.w[j]=cur>0?OB.w[j]/cur*rest:rest/free.length);OB.w[i]=f}
startOnboarding=function(){OB.step=1;OB.picked=[];OB.amount=5000000;OB.w=[];OB.locks=[];$('appShell').classList.remove('app-shell-active');$('loginScreen').style.display='none';document.body.classList.remove('on-landing');$('onboarding').classList.add('active');renderOnboarding()};
renderOnboarding=function(){const hint=$('obTopHint');if(hint)hint.textContent=OB.step===1?'Paso 1 de 2 · Elige tus empresas':'Paso 2 de 2 · Tu dinero de práctica';
  if(OB.step===1){
    $('obBody').innerHTML=`<h1 class="ob-h" id="obTitle" tabindex="-1">Elige las empresas con las que quieres practicar</h1><p class="ob-p">Toca las que te llamen la atención. Puedes elegir hasta 5.</p>
    <div class="ob-meter" id="obMeter" aria-live="polite"><b id="obN">0</b><span>de 5 empresas</span><span class="ob-dots">${'<i></i>'.repeat(5)}</span></div>
    <div class="obc-grid">${POOL_EXPANDIDO.map(a=>{const k=chgKey(a.chg),tk=escapeHTML(a.t);return `<button type="button" class="obc" data-t="${tk}" style="--c:${sectorColor(a.sector)}" aria-pressed="false" onclick="obToggle('${tk}')">
      <span class="obc-spark" aria-hidden="true">${sparkSVG(assetSeries(a),k,200,64).replace('width="200"','width="100%"').replace('height="64"','height="100%"')}</span>
      <span class="obc-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></span>
      <span class="obc-top">${logoHTML(a)}</span>
      <span class="obc-name">${escapeHTML(shortName(a.n))}</span><span class="obc-sec"><i></i>${escapeHTML(a.sector)}</span>
      <span class="obc-foot"><span class="obc-price">${formatCOP(a.price)}</span><span class="pill ${k}">${dirArrow(k)} ${t4pct(a.chg)} %</span></span></button>`}).join('')}</div>`;
    $('obFoot').innerHTML=`<div class="ob-tray" id="obTray" aria-label="Empresas elegidas"><span class="ob-tray-k">Tu portafolio</span><span class="ob-tray-logos" id="obTrayLogos"></span></div><p class="ob-next-hint" id="obNextHint">Luego decides cuántos pesos de práctica repartir entre ellas.</p><div class="ob-foot-btns"><button class="btn-ghost" type="button" onclick="obUseSeed()">Ver un portafolio de ejemplo</button><button class="btn-primary" type="button" id="obNext" onclick="obGo(2)" disabled>Continuar</button></div>`;
    document.querySelectorAll('.obc').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}));
    revealItems($('obBody'),'.obc');obUpdate()}
  else obRenderAmount();
  $('onboarding').scrollTop=0;$('obTitle')?.focus({preventScroll:true})};
obUpdate=function(){const n=OB.picked.length;$('obN')&&($('obN').textContent=n);document.querySelectorAll('.ob-dots i').forEach((d,i)=>d.classList.toggle('on',i<n));
  document.querySelectorAll('.obc').forEach(b=>{const on=OB.picked.includes(b.dataset.t);b.setAttribute('aria-pressed',String(on));b.classList.toggle('is-max',!on&&n>=OB_MAXN)});
  $('obMeter')?.classList.toggle('is-full',n>=OB_MAXN);
  const tray=$('obTrayLogos');if(tray){const have=[...tray.children].map(x=>x.dataset.t);OB.picked.forEach(t=>{if(!have.includes(t)){const a=assetOf0(t);tray.insertAdjacentHTML('beforeend',`<span class="ob-tl" data-t="${escapeHTML(t)}" title="${escapeHTML(a.n)}">${logoHTML(a,true)}</span>`)}});[...tray.children].forEach(x=>{if(!OB.picked.includes(x.dataset.t)){x.classList.add('out');setTimeout(()=>x.remove(),260)}})}
  $('obTray')?.classList.toggle('has',n>0);
  const b=$('obNext');if(b){b.disabled=!n;b.textContent=n?`Continuar con ${n} ${n===1?'empresa':'empresas'}`:'Continuar'}};
obToggle=function(tk){const i=OB.picked.indexOf(tk);if(i>=0){OB.picked.splice(i,1);obUpdate();return}
  if(OB.picked.length>=OB_MAXN){showToast('Ya tienes 5 empresas. Quita una para elegir otra.');return}
  OB.picked.push(tk);try{navigator.vibrate&&navigator.vibrate(12)}catch{}
  const card=document.querySelector(`.obc[data-t="${tk}"]`),src=card?.querySelector('.obc-top .logo');obUpdate();
  const dst=document.querySelector(`#obTrayLogos .ob-tl[data-t="${tk}"]`);
  if(src&&dst&&dst.animate){const r0=src.getBoundingClientRect(),r1=dst.getBoundingClientRect();const fly=src.cloneNode(true);fly.className=src.className+' ob-fly';Object.assign(fly.style,{position:'fixed',left:r0.left+'px',top:r0.top+'px',width:r0.width+'px',height:r0.height+'px',zIndex:200,margin:0});document.body.appendChild(fly);dst.style.opacity='0';
    fly.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${(r1.left-r0.left)*.5}px,${(r1.top-r0.top)*.5-60}px) scale(.9)`,offset:.55},{transform:`translate(${r1.left-r0.left}px,${r1.top-r0.top}px) scale(${r1.width/r0.width})`}],{duration:620,easing:'cubic-bezier(.22,1,.36,1)'}).onfinish=()=>{fly.remove();dst.style.opacity=''}}};
obGo=function(s){if(s===2){if(!OB.picked.length)return;if(OB.w.length!==OB.picked.length)obEqual()}OB.step=s;renderOnboarding()};
const OB_STOPS=[500000,1000000,2000000,5000000,10000000,15000000,20000000];
function obRenderAmount(){const n=OB.picked.length;
  $('obBody').innerHTML=`<div class="oba"><div class="oba-l">
    <button class="btn-ghost ob-back" type="button" onclick="obGo(1)"><svg class="ico" aria-hidden="true"><use href="#i-back"/></svg>Cambiar empresas</button>
    <h1 class="ob-h" id="obTitle" tabindex="-1">¿Cuántos pesos quieres practicar?</h1><p class="ob-p">Elige el total y repártelo como quieras. Compras hoy, al precio de la Bolsa.</p>
    <div class="oba-big"><span id="obBig">${formatCOP(OB.amount)}</span><button class="oba-edit" type="button" onclick="obEditTotal()">Escribir otro monto</button></div>
    <input class="oba-total-in" id="obAmount" inputmode="numeric" autocomplete="off" hidden oninput="obTotalInput(this.value)" onblur="this.hidden=true" aria-label="Monto total en pesos">
    <div class="oba-range"><input type="range" id="obRange" min="0" max="${OB_STOPS.length-1}" step="0.01" value="${obStopIdx(OB.amount)}" oninput="obRangeInput(this.value)" aria-label="Monto total"><div class="oba-ticks">${OB_STOPS.map(v=>`<button type="button" onclick="obSetAmount(${v})">${formatCompactCOP(v)}</button>`).join('')}</div></div>
    <div class="oba-split-h"><h2>Cómo lo repartes</h2><button class="btn-ghost btn-sm" type="button" onclick="obEqual();obAllocUI(true)">Partes iguales</button></div>
    <p class="ob-p oba-tip">Arrastra las divisiones de la barra o mueve cada empresa. El total siempre cuadra.</p>
    <div class="oba-bar" id="obBar"></div>
    <div class="oba-rows" id="obRows"></div>
  </div>
  <aside class="oba-r" aria-label="Así quedaría tu portafolio"><div class="oba-card"><p class="oba-card-k">${escapeHTML(new Date().toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'}))} · Tu portafolio</p><div id="obDonut"></div><div class="oba-legend" id="obLegend"></div><p class="oba-ex" id="obEx"></p></div></aside></div>`;
  $('obFoot').innerHTML=`<p class="ob-next-hint">Puedes comprar y vender más acciones cuando quieras.</p><div class="ob-foot-btns"><button class="btn-ghost" type="button" onclick="obGo(1)">Atrás</button><button class="btn-primary" type="button" id="obNext" onclick="obFinish()">Crear mi portafolio</button></div>`;
  obAllocUI(true)}
function obStopIdx(v){for(let i=0;i<OB_STOPS.length-1;i++){if(v<=OB_STOPS[i+1])return i+(v-OB_STOPS[i])/(OB_STOPS[i+1]-OB_STOPS[i])}return OB_STOPS.length-1}
function obFromIdx(x){const i=Math.min(Math.floor(x),OB_STOPS.length-2),f=x-i;let v=OB_STOPS[i]+(OB_STOPS[i+1]-OB_STOPS[i])*f;const near=OB_STOPS.find(s=>Math.abs(s-v)<(OB_STOPS[i+1]-OB_STOPS[i])*.06);if(near)v=near;return Math.round(v/50000)*50000}
let obLastStop=null;
function obRangeInput(x){const v=obFromIdx(+x);if(OB_STOPS.includes(v)&&v!==obLastStop){obLastStop=v;try{navigator.vibrate&&navigator.vibrate(8)}catch{}}obSetAmount(v,true)}
obSetAmount=function(v,fromRange){const prev=OB.amount;OB.amount=Math.max(0,Math.round(v));const big=$('obBig');if(big)countUp(big,OB.amount,{from:prev,dur:350});if(!fromRange&&$('obRange'))$('obRange').value=obStopIdx(OB.amount);obAllocUI(false)};
function obEditTotal(){const i=$('obAmount');i.hidden=false;i.value=dots(OB.amount);i.focus();i.select()}
function obTotalInput(v){const n=parseCOP(v);$('obAmount').value=n?dots(n):'';OB.amount=n;$('obBig').textContent=formatCOP(n);$('obRange').value=obStopIdx(n);obAllocUI(false)}
function obAllocUI(rebuild){const n=OB.picked.length,amts=obAmounts(),assets=OB.picked.map(assetOf0);
  const bar=$('obBar'),rows=$('obRows');if(!bar)return;
  if(rebuild||bar.querySelectorAll('.oba-seg').length!==n){
    bar.innerHTML=assets.map((a,i)=>`<div class="oba-seg" data-i="${i}" style="--c:${sectorColor(a.sector)}">${logoHTML(a,true)}<span class="oba-pct">${Math.round(OB.w[i]*100)} %</span></div>${i<n-1?`<button type="button" class="oba-hd" data-i="${i}" aria-label="Mover la división entre ${escapeHTML(shortName(a.n))} y ${escapeHTML(shortName(assets[i+1].n))}"><i></i></button>`:''}`).join('');
    bar.querySelectorAll('.oba-hd').forEach(h=>obBindHandle(h));
    rows.innerHTML=assets.map((a,i)=>`<div class="oba-row" data-i="${i}" style="--c:${sectorColor(a.sector)}">${logoHTML(a,true)}<div class="oba-row-id"><strong>${escapeHTML(shortName(a.n))}</strong><span class="oba-qty"></span></div><input type="range" min="0" max="100" step="0.5" aria-label="Parte de ${escapeHTML(a.n)}" oninput="obSetShare(${i},this.value/100);obAllocUI(false)"><button type="button" class="oba-amt" onclick="obEditRow(${i})"></button><button type="button" class="oba-lock" aria-pressed="false" aria-label="Fijar el monto de ${escapeHTML(a.n)}" onclick="obLock(${i})"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path class="sh" d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></button><button type="button" class="oba-rm" aria-label="Quitar ${escapeHTML(a.n)}" onclick="obRemove(${i})"><svg class="ico" aria-hidden="true"><use href="#i-x"/></svg></button></div>`).join('')}
  let left=0;bar.querySelectorAll('.oba-seg').forEach((s,i)=>{s.style.flexBasis=(OB.w[i]*100)+'%';s.querySelector('.oba-pct').textContent=Math.round(OB.w[i]*100)+' %';s.classList.toggle('narrow',OB.w[i]<.12)});
  bar.querySelectorAll('.oba-hd').forEach(h=>{const i=+h.dataset.i;h.disabled=!!(OB.locks[i]||OB.locks[i+1])});
  rows.querySelectorAll('.oba-row').forEach(r=>{const i=+r.dataset.i,a=assets[i];r.querySelector('input').value=(OB.w[i]*100).toFixed(1);r.querySelector('input').disabled=OB.locks[i]||n<2;r.querySelector('.oba-amt').textContent=formatCOP(amts[i]);r.querySelector('.oba-qty').textContent=`${Math.round(OB.w[i]*100)} % · unas ${qtyTxt(Math.floor(amts[i]/a.price*100)/100)} acciones`;const lk=r.querySelector('.oba-lock');lk.setAttribute('aria-pressed',String(!!OB.locks[i]));lk.classList.toggle('on',!!OB.locks[i]);r.querySelector('.oba-rm').hidden=n<2;r.style.setProperty('--w',(OB.w[i]*100)+'%')});
  const items=assets.map((a,i)=>({key:a.t,label:shortName(a.n),value:amts[i]||0.0001,color:sectorColor(a.sector)}));
  const dn=$('obDonut');if(dn){dn.innerHTML=donutSVG(items,{id:'obDn',center:formatCompactCOP(OB.amount),sub:'para practicar'});bindDonut(dn,items,formatCompactCOP);if(!rebuild)dn.querySelector('.dn')?.classList.add('no-anim')}
  const lg=$('obLegend');if(lg)lg.innerHTML=assets.map((a,i)=>`<div class="oba-lg" style="--c:${sectorColor(a.sector)}"><i></i><span>${escapeHTML(shortName(a.n))}</span><b>${formatCOP(amts[i])}</b></div>`).join('');
  const big=OB.w.indexOf(Math.max(...OB.w)),ex=$('obEx');if(ex&&assets[big])ex.innerHTML=`Si <b>${escapeHTML(shortName(assets[big].n))}</b> sube 1 %, tu portafolio sube unos <b class="chg up">${formatCOP(Math.round(amts[big]*.01/100)*100)}</b>. Así se mueve tu dinero.`;
  const nb=$('obNext');if(nb)nb.disabled=!(OB.amount>0&&n)}
function obBindHandle(h){h.addEventListener('pointerdown',e=>{if(h.disabled)return;e.preventDefault();const i=+h.dataset.i,bar=$('obBar'),r=bar.getBoundingClientRect();h.setPointerCapture(e.pointerId);h.classList.add('drag');
  const before=OB.w.slice(0,i).reduce((s,x)=>s+x,0),pair=OB.w[i]+OB.w[i+1];
  const mv=ev=>{let x=(ev.clientX-r.left)/r.width;x=Math.min(Math.max(x,before+OB_MIN),before+pair-OB_MIN);OB.w[i]=x-before;OB.w[i+1]=pair-OB.w[i];obAllocUI(false)};
  const up=()=>{h.classList.remove('drag');h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up);h.removeEventListener('pointercancel',up)};
  h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up)});
  h.addEventListener('keydown',e=>{const i=+h.dataset.i;if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();const d=(e.key==='ArrowRight'?1:-1)*.02,pair=OB.w[i]+OB.w[i+1];OB.w[i]=Math.min(Math.max(OB.w[i]+d,OB_MIN),pair-OB_MIN);OB.w[i+1]=pair-OB.w[i];obAllocUI(false)})}
function obLock(i){OB.locks[i]=!OB.locks[i];obAllocUI(false)}
function obRemove(i){if(OB.picked.length<2)return;OB.picked.splice(i,1);const w=OB.w.splice(i,1)[0];OB.locks.splice(i,1);const s=OB.w.reduce((a,x)=>a+x,0)||1;OB.w=OB.w.map(x=>x/s);obAllocUI(true)}
function obEditRow(i){const r=document.querySelector(`.oba-row[data-i="${i}"] .oba-amt`);if(!r)return;const inp=document.createElement('input');inp.className='oba-amt-in';inp.inputMode='numeric';inp.value=dots(obAmounts()[i]);r.replaceWith(inp);inp.focus();inp.select();
  const done=()=>{const v=parseCOP(inp.value);if(v>0&&OB.amount>0)obSetShare(i,v/OB.amount);obAllocUI(true)};inp.addEventListener('blur',done);inp.addEventListener('keydown',e=>{if(e.key==='Enter')inp.blur()});inp.addEventListener('input',()=>{inp.value=inp.value?dots(parseCOP(inp.value)):''})}
obFinish=function(){const n=OB.picked.length;if(!n||OB.amount<=0)return;const amts=obAmounts();for(let i=0;i<n;i++){const r=API.addTransaction({ticker:OB.picked[i],kind:'buy',amount:amts[i]});if(!r.ok){showToast(r.detail);return}}obDone()};

/* =================== CORRECCIONES DE LA REVISIÓN =================== */
/* El color de Petróleo y energía casi no se veía sobre el fondo oscuro */
SECTOR_COLORS['Petróleo y energía']='#8FA3CF';
/* Precios: solo la hora del dato, sin hablar de retraso */
/* La Bolsa cierra a las 4:00 p. m. (hora de Colombia). Después de esa hora el precio es el de cierre: no se muestra la hora en que se guardó. */
const horaBogota=iso=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Bogota',hour:'2-digit',hour12:false}).format(new Date(iso)));
const mercadoCerro=()=>horaBogota(MARKET_UPDATED_AT)>=16;
freshTxt=function(){const d=new Date(MARKET_UPDATED_AT);if(ISO(d)!==HOY_ISO)return `Precios del cierre del ${d.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}`;return mercadoCerro()?'Precios del cierre de hoy':`Precios de las ${timeTxt(MARKET_UPDATED_AT)}`};
freshShort=function(){const d=new Date(MARKET_UPDATED_AT);if(ISO(d)!==HOY_ISO)return 'Precios del último cierre';return mercadoCerro()?'Precios del cierre de hoy':'Precios de las '+timeTxt(MARKET_UPDATED_AT)};

/* Hoy: «Datos | Reportaje» en lugar de las pestañas ocultas */
function hoySwitchHTML(){return `<div class="hoy-switch" role="group" aria-label="Cómo ver tu día"><button type="button" data-hs="tech" onclick="setTodayMode('tech')">Datos</button><button type="button" data-hs="studio" onclick="setTodayMode('studio')">Reportaje</button><i></i></div>`}
const _setTodayMode3=setTodayMode;
setTodayMode=function(mode){_setTodayMode3(mode);document.querySelectorAll('.hoy-switch').forEach(sw=>{sw.dataset.on=todayMode;sw.querySelectorAll('[data-hs]').forEach(b=>{const on=b.dataset.hs===todayMode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))})});miniBarUpdate()};
const _renderTodayStudio3=renderTodayStudio;
renderTodayStudio=function(m){_renderTodayStudio3(m);const w=document.querySelector('#todayModeStudio .studio-wrap');if(w&&!w.querySelector('.hoy-switch')){w.insertAdjacentHTML('afterbegin',`<div class="studio-switch">${hoySwitchHTML()}</div>`)}document.querySelectorAll('#todayModeStudio .hoy-switch').forEach(sw=>{sw.dataset.on='studio';sw.querySelector('[data-hs="studio"]').classList.add('active')})};

/* Hoy (Datos): frase que entra palabra por palabra, marcas de noticias en la gráfica,
   tarjetas de cifras vivas, cascada que arranca al llegar y explicación con IA escribiéndose */
const NEWS_AGE={1:0,2:4,3:2,4:7,5:0,6:9,7:3,8:12,9:5,10:1,11:6};
const NEWS_DAY={};
function applyServerNews(list){if(!LIVE||!list||!list.length)return;NEWS_DATABASE.length=0;for(const k of Object.keys(LOCAL_RADAR))delete LOCAL_RADAR[k];list.forEach(n=>{NEWS_DATABASE.push({id:n.id,t:n.ticker,direccion:n.direction,magnitud:n.magnitude,titulo:n.title,fuente:n.source,dek:n.summary,url:n.url});LOCAL_RADAR[n.id]={via:n.why,metric:n.watch};NEWS_DAY[n.id]=n.day})}
const _renderTodayMain3=renderTodayMain;
renderTodayMain=function(m){_renderTodayMain3(m);const el=$('todayMain');if(!el||!m)return;
  const hs=el.querySelector('.hero-sentence');if(hs){if(!renderTodayMain._tw){renderTodayMain._tw=1;typeIn(hs)}hs.insertAdjacentHTML('beforeend',`<svg class="hs-pulse ${m.dir}" viewBox="0 0 600 24" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M0 14 H230 L248 14 L262 3 L280 22 L296 9 L308 14 H600"/></svg>`)}
  const stats=el.querySelectorAll('.hero-stat');
  if(stats[1]){const s=sparkSVG(assetSeries(m.top.p),chgKey(m.top.chg),140,30);stats[1].insertAdjacentHTML('beforeend',`<span class="hs-spark">${s}</span>`)}
  if(stats[2]){const mx=Math.max(Math.abs(m.pct),Math.abs(COLCAP.chg),.1);const bar=(l,v)=>`<div class="race-r"><span>${l}</span><span class="race-t"><i class="${chgKey(v)}" style="--w:${(Math.abs(v)/mx*100).toFixed(1)}%"></i></span><b class="chg ${chgKey(v)}">${dirArrow(chgKey(v))} ${t4pct(v)} %</b></div>`;stats[2].querySelector('.stat-note')?.insertAdjacentHTML('beforebegin',`<div class="race">${bar('Tú',m.pct)}${bar('COLCAP',COLCAP.chg)}</div>`)}
  el.querySelectorAll('.hero-stat').forEach((s,i)=>{s.classList.add('rv-i');s.style.setProperty('--i',i)});observeRv([...el.querySelectorAll('.hero-stat')]);
  const tp=el.querySelector('.trace-panel');if(tp&&!tp.classList.contains('wf-done')){tp.classList.add('wf-wait');const o=new IntersectionObserver(es=>{if(es[0].isIntersecting){tp.classList.add('wf-go');o.disconnect()}},{threshold:.15});o.observe(tp);setTimeout(()=>tp.classList.add('wf-go'),6000)}
  el.querySelectorAll('.trace-row.is-active').forEach(r=>{const t=(r.getAttribute('onclick')||'').match(/'([^']+)'/)?.[1];const row=m.rows.find(x=>x.p.t===t);if(!row)return;const cz=todayCause(row.p,row.chg);r.insertAdjacentHTML('beforeend',`<span class="trace-why">${cz?`Por qué: ${escapeHTML(cz.text)}.`:'Hoy no hay una noticia clara que lo explique.'}</span>`)});
  const foot=el.querySelector('.trace-foot');if(foot&&!foot.querySelector('.ai-chip'))$('todayExplainBtn')?.insertAdjacentHTML('afterend',`<span class="ai-chip">Te quedan ${aiLeft('today')} hoy</span>`);
  todayMarkers(el)};
function todayMarkers(el){const root=el.querySelector('[data-live-chart="todayPortChart"]');if(!root)return;const plot=root.querySelector('.daychart-plot');const pts=portfolioSeriesForRange();if(!plot||pts.length<2)return;
  const s=pts.map(p=>p.value),inv=pts.map(p=>p.invested),{min,rg}=scaleOf([...s,...inv],0.008),h=150,pad=10,Y=v=>pad+(h-2*pad)*(1-(v-min)/rg);
  const news=localRadarResults(true);const byDay={};API.news({mine:true}).forEach(n=>{(byDay[n.day]=byDay[n.day]||[]).push(n)});
  let html='';Object.entries(byDay).forEach(([d,list])=>{const idx=pts.findIndex(p=>p.day===d);if(idx<0)return;const n=list[0],k=n.direction==='Positivo'?'up':n.direction==='Negativo'?'down':'flat';html+=`<button type="button" class="ch-mark ${k}" style="left:${(idx/(pts.length-1)*100).toFixed(2)}%;top:${(Y(s[idx])/h*100).toFixed(2)}%" aria-label="Noticia del ${escapeHTML(dayTxt(d))}: ${escapeHTML(n.title)}" onclick="event.stopPropagation();chPop(this,${n.id})"><i></i></button>`});
  plot.insertAdjacentHTML('beforeend',html+'<div class="ch-pop" hidden></div>');}
function chPop(btn,id){const plot=btn.closest('.daychart-plot'),pop=plot.querySelector('.ch-pop');const n=API.news({mine:false}).find(x=>x.id===id);if(!n)return;if(!pop.hidden&&pop.dataset.id==id){pop.hidden=true;return}pop.dataset.id=id;
  pop.innerHTML=`<span class="tag ${dirKey(n.direction)}">${dirArrow(dirKey(n.direction))} ${escapeHTML(labelDir(n.direction))}</span><b>${escapeHTML(n.title)}</b><span class="ch-pop-d">${escapeHTML(n.asset_name)} · ${escapeHTML(dayTxt(n.day))}</span><button type="button" class="btn-ghost btn-sm" onclick="switchView('radar')">Ver la noticia</button>`;
  pop.style.left=btn.style.left;pop.style.top=btn.style.top;pop.hidden=false}
document.addEventListener('click',e=>{if(!e.target.closest('.ch-pop,.ch-mark'))document.querySelectorAll('.ch-pop').forEach(p=>p.hidden=true)});
const _explainToday3=explainTodayWithAI;
explainTodayWithAI=async function(){await _explainToday3();const out=$('todayExplainOut');const ai=out&&out.querySelector('.explain-ai');if(ai)typeIn(ai);const ch=document.querySelector('#todayMain .ai-chip');if(ch)ch.textContent=`Te quedan ${aiLeft('today')} hoy`};

/* Insights: «Sigue por aquí» con adelantos animados */
function storyRoutesHTML(m){let pts=API.portfolioHistory('1m');const c=calculatePortfolio();if(pts.length<2)pts=API.assetHistory(m.top.p.t,'1m').map(x=>({value:x.price}));
  let line='';if(pts.length>1){const v=pts.map(p=>p.value),lo=Math.min(...v),hi=Math.max(...v),rg=(hi-lo)||1;line=v.map((x,i)=>`${i?'L':'M'}${(i/(v.length-1)*200).toFixed(1)} ${(52-(x-lo)/rg*44).toFixed(1)}`).join('')}
  const wf=m.sorted.slice(0,3).map(r=>`<i class="${r.d>=0?'up':'down'}" style="--w:${Math.max(8,Math.min(100,Math.abs(r.d)/Math.max(...m.sorted.map(x=>Math.abs(x.d)),1)*100)).toFixed(0)}%"></i>`).join('');
  const items=PORTFOLIO.map(p=>({label:p.n,value:p.value,color:sectorColor(p.sector)}));const top=c.sectors[0],tw=top&&c.total?Math.round(top[1]/c.total*100):0;
  const nw=localRadarResults(true)[0];const art=nw?photoUrl(photoFor(nw)):'/img/sectores/seguros-1.webp';
  return `<div class="story-routes sr">
  <button type="button" class="story-route sr-card" onclick="event.stopPropagation();openTodayDetail('tech')"><span class="sr-prev sr-chart"><svg viewBox="0 0 200 56" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="${line}"/></svg><span class="sr-wf">${wf}</span></span><b>Tu día en detalle</b><span>Gráficas y lo que sumó o restó cada acción.</span><em>Abrir →</em></button>
  <button type="button" class="story-route sr-card" onclick="event.stopPropagation();switchView('portfolio')"><span class="sr-prev sr-dn">${donutSVG(items,{id:'srDn',center:tw+' %',sub:''})}<span class="sr-dn-t">en ${escapeHTML(top?top[0]:'—')}</span></span><b>Tu portafolio</b><span>Lo que tienes, cuánto vale y de qué depende.</span><em>Abrir →</em></button>
  <button type="button" class="story-route sr-card" onclick="event.stopPropagation();switchView('radar')"><span class="sr-prev sr-news"><img src="${art}" alt=""><span class="sr-news-t">${nw?`<span class="tag ${dirKey(nw.direccion)}">${dirArrow(dirKey(nw.direccion))} ${escapeHTML(labelDir(nw.direccion))}</span>${escapeHTML(nw.titulo)}`:'Las noticias de tus acciones'}</span></span><b>Noticias que te afectan</b><span>Qué pasó y por qué te afecta.</span><em>Abrir →</em></button></div>`}
document.addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.sr-card');if(!c)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.setProperty('--rx',(-y*6).toFixed(2)+'deg');c.style.setProperty('--ry',(x*8).toFixed(2)+'deg')},{passive:true});
document.addEventListener('pointerout',e=>{const c=e.target.closest&&e.target.closest('.sr-card');if(c&&!c.contains(e.relatedTarget)){c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg')}});

/* =================== PORTADA: fondo que reacciona =================== */
const LD={x:.5,y:.4,tx:.5,ty:.4,on:false,raf:0,heroIn:true,idle:0};
function ldBg(){const hero=document.querySelector('.ld-hero');if(!hero||hero.dataset.bg)return;hero.dataset.bg='1';
  hero.insertAdjacentHTML('afterbegin','<canvas class="ld-dots" id="ldDots" aria-hidden="true"></canvas>');hero.classList.add('has-canvas');
  const io=new IntersectionObserver(es=>{LD.heroIn=es[0].isIntersecting;if(LD.heroIn)ldLoop()});io.observe(hero);
  const set=(cx,cy)=>{const r=hero.getBoundingClientRect();LD.tx=Math.min(1,Math.max(0,(cx-r.left)/r.width));LD.ty=Math.min(1,Math.max(0,(cy-r.top)/r.height))};
  hero.addEventListener('pointermove',e=>set(e.clientX,e.clientY),{passive:true});hero.addEventListener('touchmove',e=>{const t=e.touches[0];if(t)set(t.clientX,t.clientY)},{passive:true});
  hero.addEventListener('pointerleave',()=>{LD.tx=.5;LD.ty=.4});
  document.body.insertAdjacentHTML('beforeend','<div class="ld-progress" id="ldProgress" aria-hidden="true"></div><div class="ld-hint" id="ldHint" aria-hidden="true"><span>Sigue bajando</span><i></i></div>');
  ldLoop()}
function ldLoop(){cancelAnimationFrame(LD.raf);const c=$('ldDots');if(!c)return;const ctx=c.getContext('2d');
  const fit=()=>{const d=Math.min(devicePixelRatio||1,2);c.width=c.clientWidth*d;c.height=c.clientHeight*d};fit();if(!ldLoop.bound){ldLoop.bound=1;addEventListener('resize',fit)}
  const step=()=>{if(!document.body.classList.contains('on-landing')||!LD.heroIn)return;LD.x+=(LD.tx-LD.x)*.06;LD.y+=(LD.ty-LD.y)*.06;
    const hero=document.querySelector('.ld-hero');hero.style.setProperty('--ax',((LD.x-.5)*90).toFixed(1));hero.style.setProperty('--ay',((LD.y-.4)*70).toFixed(1));
    const w=c.width,h=c.height,s=w/Math.max(c.clientWidth,1),gap=26*s,px=LD.x*w,py=LD.y*h,R=190*s;ctx.clearRect(0,0,w,h);
    for(let y=gap*.5;y<h;y+=gap)for(let x=gap*.5;x<w;x+=gap){const dx=x-px,dy=y-py,d=Math.hypot(dx,dy),near=Math.max(0,1-d/R);const fx=x/w-.5,fy=y/h-.45,vig=Math.max(0,1-Math.hypot(fx*1.2,fy*1.6)*1.5);const a=.05*vig+near*.55;if(a<.01)continue;
      ctx.fillStyle=near>.05?`rgba(${Math.round(180+near*20)},${Math.round(235)},${Math.round(210)},${a.toFixed(3)})`:`rgba(255,255,255,${a.toFixed(3)})`;ctx.beginPath();ctx.arc(x-dx*near*.12,y-dy*near*.12,(0.8+near*1.7)*s,0,6.2832);ctx.fill()}
    LD.raf=requestAnimationFrame(step)};step()}
function ldExtra(){requestAnimationFrame(()=>{if(!document.body.classList.contains('on-landing'))return;const y=scrollY,H=document.documentElement.scrollHeight-innerHeight;
  $('ldProgress')&&($('ldProgress').style.transform=`scaleX(${H>0?(y/H).toFixed(4):0})`);
  document.querySelector('.ld-hero')?.style.setProperty('--sy',(y*.35).toFixed(1));
  const st=$('ldStory');if(st){const p=ldProg(st),out=Math.min(1,Math.max(0,(p-.86)/.14));st.querySelector('.ld-sticky').style.setProperty('--out',out.toFixed(3))}
  const f=$('ldFill');if(f){const p=ldProg(f),ws=f.querySelectorAll('.fw'),N=ws.length;ws.forEach((w,i)=>{const o=Math.min(1,Math.max(0,p*1.3*N-i));w.style.setProperty('--o',o.toFixed(3));w.classList.toggle('on',o>=1)});f.style.setProperty('--fp',Math.min(1,p*1.3).toFixed(3));f.classList.toggle('done',p*1.3>=1)}
  const hint=$('ldHint');if(hint){hint.classList.remove('show');clearTimeout(LD.idle);LD.idle=setTimeout(()=>{const yy=scrollY,HH=document.documentElement.scrollHeight;const fin=document.querySelector('.ld-final');const finTop=fin?fin.getBoundingClientRect().top:9e9;if(document.body.classList.contains('on-landing')&&yy>innerHeight*.5&&finTop>innerHeight*.6)hint.classList.add('show')},1500)}})}
addEventListener('scroll',ldExtra,{passive:true});addEventListener('resize',ldExtra);
const _showLanding3=showLanding;showLanding=function(){_showLanding3();safe(ldBg,'ldbg');document.body.classList.add('ld-ready');ldExtra()};
const _openLogin3=openLogin;openLogin=function(){_openLogin3();$('ldHint')?.classList.remove('show');const d=document.querySelector('#loginScreen .pv-date');if(d)d.textContent=new Date().toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})};

/* =================== REVISIÓN 3 =================== */
/* ---- Color de marca para el brillo al pasar el mouse (aproximados; se confirman con los logos oficiales) ---- */
const BRAND_COLORS={ECOPETROL:'#3DB54A',PFBCOLOM:'#FDDA24',ISA:'#1FB6A6',GRUPOSURA:'#4D7CFE',GRUPOARGOS:'#2E9BD6',CEMARGOS:'#2E9BD6',GEB:'#F28C28',CELSIA:'#F37021',PFDAVVNDA:'#ED1C24',MINEROS:'#D4A72C'};
document.head.insertAdjacentHTML('beforeend',`<style>${Object.entries(BRAND_COLORS).map(([t,c])=>`[data-t="${t}"]{--b:${c}}`).join('')}</style>`);

/* ---- Deshacer genérico ---- */
let undoFn=null;
showUndo=function(msg,fn){undoFn=fn||null;let u=$('undoBar');if(!u){document.body.insertAdjacentHTML('beforeend','<div class="undo" id="undoBar" role="status"><span></span><button type="button" onclick="doUndo()">Deshacer</button><i></i></div>');u=$('undoBar')}u.querySelector('span').textContent=msg;u.classList.remove('show');void u.offsetWidth;u.classList.add('show');clearTimeout(undoTimer);undoTimer=setTimeout(()=>{u.classList.remove('show');undoFn=null},5000)};
doUndo=function(){const u=$('undoBar');u&&u.classList.remove('show');const f=undoFn;undoFn=null;if(f)f()};
deleteTx=function(id){const t=TX.find(x=>x.id===id);const res=API.deleteTransaction(id);if(!res.ok){showToast(res.detail);return}syncPortfolio();refreshAll();
  showUndo('Borraste el movimiento',()=>{const r=API.addTransaction({ticker:t.ticker,kind:t.kind,quantity:t.quantity,price:t.price,day:t.day});if(!r.ok){showToast(r.detail);return}syncPortfolio();refreshAll();showToast('Listo: el movimiento volvió')})};

/* ---- Sacar una acción del portafolio = vender todas sus acciones ---- */
function pfMore(btn,t){const old=document.querySelector('.pfc-menu');if(old){const same=old.dataset.t===t;old.remove();if(same)return}
  btn.insertAdjacentHTML('afterend',`<div class="pfc-menu" data-t="${escapeHTML(t)}" role="menu"><button type="button" role="menuitem" onclick="openAssetDetail('${escapeHTML(t)}');this.parentNode.remove()">Ver detalle</button><button type="button" role="menuitem" class="danger" onclick="this.parentNode.remove();askRemove('${escapeHTML(t)}')">Sacar de mi portafolio</button></div>`)}
document.addEventListener('click',e=>{if(!e.target.closest('.pfc-menu,.pfc-more'))document.querySelector('.pfc-menu')?.remove()});
function askRemove(t){const p=PORTFOLIO.find(x=>x.t===t);if(!p)return;const total=p.shares*p.price,g=(p.price-p.avg_cost)*p.shares;
  let m=$('rmModal');if(!m){document.body.insertAdjacentHTML('beforeend','<div class="modal-overlay" id="rmModal"><div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="rmTitle"></div></div>');m=$('rmModal');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('active')})}
  m.querySelector('.modal').innerHTML=`<div class="rm-head">${logoHTML(p,'lg')}<div><p class="modal-kicker">Vender todas tus acciones</p><h3 class="modal-title" id="rmTitle">¿Sacar ${escapeHTML(shortName(p.n))} de tu portafolio?</h3></div></div>
  <div class="rc-ticket rm-ticket"><div class="rc-row"><span>Venderías</span><b>${qtyTxt(p.shares)} acciones</b></div><div class="rc-row"><span>A</span><b>${formatCOP(p.price)} cada una</b></div><div class="rc-sep"></div><div class="rc-row rc-total"><span>Recibirías</span><b>${formatCOP(total)}</b></div><div class="rc-row"><span>Frente a lo que pagaste</span><b>${gainHTML(g)}</b></div></div>
  <p class="modal-text">La venta queda en tus movimientos. Puedes deshacerla en los próximos segundos.</p><div class="modal-actions"><button class="btn-primary" type="button" onclick="doRemove('${escapeHTML(t)}')">Sí, sacarla</button><button class="btn-secondary" type="button" onclick="$('rmModal').classList.remove('active')">Cancelar</button></div>`;
  m.classList.add('active');setTimeout(()=>m.querySelector('.btn-secondary').focus(),40)}
function doRemove(t){$('rmModal')?.classList.remove('active');closeAssetDrawer();const p=PORTFOLIO.find(x=>x.t===t);if(!p)return;const card=document.querySelector(`.pfc[data-t="${t}"]`);if(card)card.classList.add('is-out');
  setTimeout(()=>{const r=API.addTransaction({ticker:t,kind:'sell',quantity:p.shares});if(!r.ok){showToast(r.detail);card&&card.classList.remove('is-out');return}syncPortfolio();refreshAll();
    showUndo(`Sacaste ${shortName(p.n)} de tu portafolio`,()=>{const d=API.deleteTransaction(r.data.id);if(!d.ok){showToast(d.detail);return}syncPortfolio();refreshAll();showToast(`${shortName(p.n)} volvió a tu portafolio`)})},320)}
const _pfCard4=pfCard;
pfCard=function(p,i){return _pfCard4(p,i).replace(/(<span class="pill [^"]*">[^<]*<\/span><\/div>)/,`$1`).replace('</span></div>\n  <div class="pfc-val">',`</span><button class="pfc-more" type="button" aria-label="Más opciones para ${escapeHTML(shortName(p.n))}" onclick="event.stopPropagation();pfMore(this,'${escapeHTML(p.t)}')"><i></i><i></i><i></i></button></div>\n  <div class="pfc-val">`)};
/* «Vender todo» en la ventana de vender */
function tradeSellAll(){const p=PORTFOLIO.find(x=>x.t===$('addTickerSelect').value);if(!p)return;TRADE.mode='quantity';$('addAmountInput').value=String(+p.shares.toFixed(6)).replace('.',',');tradeUI()}
const _tradeUI4=tradeUI;tradeUI=function(){_tradeUI4();const b=$('tradeAll');if(b)b.hidden=!(TRADE.kind==='sell'&&PORTFOLIO.some(x=>x.t===$('addTickerSelect').value))};
/* En el detalle: «Sacar de mi portafolio» al final */
const _openAssetDetail4=openAssetDetail;
openAssetDetail=function(t,keep){_openAssetDetail4(t,keep);const p=PORTFOLIO.find(x=>x.t===t),body=$('drawerBody');if(p&&body&&!body.querySelector('.drawer-rm'))body.insertAdjacentHTML('beforeend',`<button class="btn-ghost drawer-rm" type="button" onclick="askRemove('${escapeHTML(t)}')">Sacar de mi portafolio</button>`)};

/* =================== MERCADO =================== */
const MK={f:'all',v:'list'};
function mkSet(k,v){MK[k]=v;renderMarket()}
renderMarket=function(){const all=[...POOL_EXPANDIDO].sort((a,b)=>Math.abs(b.chg)-Math.abs(a.chg)),n=all.length,up=all.filter(a=>a.chg>0).length,dn=all.filter(a=>a.chg<0).length;
  const ck=chgKey(COLCAP.chg),mf=$('marketFresh');if(mf)mf.textContent=freshTxt();
  const s=$('mkSent');if(s)s.innerHTML=`Hoy el mercado <span class="chg ${ck}">${COLCAP.chg>0?'subió':COLCAP.chg<0?'bajó':'casi no cambió'} ${t4pct(COLCAP.chg)} %</span>.`;
  const b=$('mkBreadth');if(b)b.innerHTML=`<div class="mk-br"><i class="up" style="--w:${up/n*100}%"></i><i class="down" style="--w:${dn/n*100}%"></i></div><p><b class="chg up">${up} subieron</b> · <b class="chg down">${dn} bajaron</b>${n-up-dn?` · ${n-up-dn} sin cambio`:''}</p>`;
  document.querySelectorAll('#mkFilters [data-f]').forEach(x=>{const on=x.dataset.f===MK.f;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on))});
  const sw=document.querySelector('.mk-switch');if(sw){sw.dataset.on=MK.v;sw.querySelectorAll('[data-mk]').forEach(x=>x.classList.toggle('active',x.dataset.mk===MK.v))}
  const list=all.filter(a=>MK.f==='all'||(MK.f==='up'&&a.chg>0)||(MK.f==='down'&&a.chg<0)||(MK.f==='mine'&&PORTFOLIO.some(p=>p.t===a.t)));
  const L=$('moversList'),T=$('marketHeatmap');L.hidden=MK.v!=='list';T.hidden=MK.v!=='tiles';
  const own=t=>PORTFOLIO.find(p=>p.t===t);
  if(!list.length){L.innerHTML=T.innerHTML=`<div class="empty-state"><h3>${MK.f==='mine'?'Aún no tienes acciones':'Nada con este filtro'}</h3><p>${MK.f==='mine'?'Compra una acción de práctica para verla aquí.':'Prueba otro filtro.'}</p></div>`;return}
  L.innerHTML=list.map(a=>{const k=chgKey(a.chg),tk=escapeHTML(a.t),o=own(a.t);return `<div class="mk-row" data-t="${tk}" role="button" tabindex="0" aria-label="Ver ${escapeHTML(a.n)}" onclick="openMarketAsset('${tk}')" onkeydown="if(event.key==='Enter'){openMarketAsset('${tk}')}">${logoHTML(a)}<div class="mk-id"><strong>${escapeHTML(shortName(a.n))}${o?`<span class="mk-own">Tienes · ${pctTxt(o.weight_pct)}</span>`:''}</strong><span>${escapeHTML(a.t)} · <i class="sec-dot" style="--c:${sectorColor(a.sector)}"></i>${escapeHTML(a.sector)}</span></div><span class="mk-spark">${sparkSVG(assetSeries(a),k,120,34)}</span><strong class="mk-price">${formatCOP(a.price)}</strong><span class="pill ${k}">${dirArrow(k)} ${t4pct(a.chg)} %</span><button class="btn-secondary btn-sm mk-buy" type="button" onclick="event.stopPropagation();openTradeModal('buy','${tk}')">Comprar</button></div>`}).join('');
  const mx=Math.max(...list.map(a=>Math.abs(a.chg)),.1);
  T.innerHTML=list.map(a=>{const k=chgKey(a.chg),tk=escapeHTML(a.t),o=own(a.t),al=(.08+Math.abs(a.chg)/mx*.32).toFixed(3);return `<button type="button" class="mk-tile ${k}" data-t="${tk}" style="--al:${al}" onclick="openMarketAsset('${tk}')"><span class="mk-tile-top">${logoHTML(a,true)}${o?'<span class="mk-own">Tienes</span>':''}</span><b>${escapeHTML(shortName(a.n))}</b><span class="mk-tile-v">${dirArrow(k)} ${t4pct(a.chg)} %</span><span class="mk-tile-p">${formatCOP(a.price)}</span></button>`}).join('');
  revealItems(L,'.mk-row');revealItems(T,'.mk-tile');
  document.querySelectorAll('.mk-row,.mk-tile').forEach(el=>el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px')}))};

/* =================== IA SOBRE TEXTO SELECCIONADO =================== */
/* La web solo manda la pregunta; el servidor arma el contexto y las reglas (sin nombre ni correo). */
selectionAsk=function(raw){const text=raw.replace(/\s+/g,' ').trim().slice(0,700);const place=($('askAI')&&$('askAI').dataset.place)||'la app';const short=text.length>140?text.slice(0,137)+'…':text;return{display:'Consulta: «'+short+'»',question:`Explícame esto que leí en ${place}: «${text}»`}};
askFromSelection=function(){const bar=$('askAI');const text=((bar&&bar.dataset.text)||'').trim();const sel=window.getSelection();let r=null;try{if(sel&&sel.rangeCount)r=sel.getRangeAt(0).getBoundingClientRect()}catch{}
  hideAskAI();if(sel)sel.removeAllRanges();if(text.length<2)return;const built=selectionAsk(text);
  let c=$('askCard');if(!c){document.body.insertAdjacentHTML('beforeend','<div class="ask-card" id="askCard" role="dialog" aria-label="Trace AI explica" hidden></div>');c=$('askCard')}
  const short=text.length>90?text.slice(0,87)+'…':text;
  c.innerHTML=`<div class="akc-head"><span class="akc-wave" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3.5 15.5c2.4-4.2 4.1-6 6.2-6 2.2 0 2.5 5.2 4.6 5.2 1.8 0 2.4-3.2 4.2-5.2 1.5-1.6 3.2-2 5.5-1.6"/></svg></span><b>Trace AI</b><button class="akc-x" type="button" aria-label="Cerrar" onclick="$('askCard').hidden=true"><svg class="ico"><use href="#i-x"/></svg></button></div><p class="akc-q">«${escapeHTML(short)}»</p><div class="akc-a"><span class="typing"><span></span><span></span><span></span></span></div><div class="akc-foot"><span class="akc-left"></span><button class="btn-ghost btn-sm" type="button" onclick="askContinue()">Seguir en Trace AI →</button></div>`;
  const W=Math.min(360,innerWidth-24);c.style.width=W+'px';const x=r?Math.min(innerWidth-W-12,Math.max(12,r.left+r.width/2-W/2)):(innerWidth-W)/2;let y=r?r.bottom+12:120;if(y+260>innerHeight)y=Math.max(76,(r?r.top:innerHeight)-272);c.style.left=x+'px';c.style.top=y+'px';c.hidden=false;c.classList.remove('in');void c.offsetWidth;c.classList.add('in');
  c.dataset.q=built.question;c.dataset.d=built.display;
  callAI('chat',()=>localChatFallback(built.question),built.question,'explain').then(res=>{const a=c.querySelector('.akc-a');if(res.error){a.textContent=`Ya usaste tus ${AI_QUOTA} preguntas de hoy. Mañana tienes ${AI_QUOTA} más.`;return}a.innerHTML=parseMarkdown(res.text);typeIn(a);c.dataset.a=res.text;c.querySelector('.akc-left').textContent=`Te quedan ${res.remaining} hoy`})};
function askContinue(){const c=$('askCard');if(!c)return;c.hidden=true;switchView('chat');startChat();if(c.dataset.a){pushMsg('user',c.dataset.d);pushMsg('bot',c.dataset.a);CHAT_HISTORY.push({q:c.dataset.q,a:c.dataset.a})}}
document.addEventListener('mousedown',e=>{const c=$('askCard');if(c&&!c.hidden&&!e.target.closest('#askCard,#askAI'))c.hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const c=$('askCard');if(c)c.hidden=true}});

/* =================== PORTADA =================== */
/* Fondo fijo para toda la portada: puntos que se iluminan y manchas de color que siguen el cursor */
ldBg=function(){const ld=$('landing');if(!ld||ld.dataset.bg)return;ld.dataset.bg='1';
  ld.insertAdjacentHTML('afterbegin','<div class="ld-bgfix" aria-hidden="true"><div class="ld-aurora ld-aurora-fix"><i></i><i></i><i></i></div><canvas class="ld-dots" id="ldDots"></canvas></div>');
  document.querySelector('.ld-hero')?.classList.add('has-canvas');
  const set=(cx,cy)=>{LD.tx=cx/innerWidth;LD.ty=cy/innerHeight;LD.px=cx;LD.py=cy};LD.px=innerWidth/2;LD.py=innerHeight*.4;
  addEventListener('pointermove',e=>{if(document.body.classList.contains('on-landing'))set(e.clientX,e.clientY)},{passive:true});
  addEventListener('touchmove',e=>{const t=e.touches[0];if(t&&document.body.classList.contains('on-landing'))set(t.clientX,t.clientY)},{passive:true});
  document.body.insertAdjacentHTML('beforeend','<div class="ld-progress" id="ldProgress" aria-hidden="true"></div><div class="ld-hint" id="ldHint" aria-hidden="true"><span>Sigue bajando</span><i></i></div>');
  const hero=document.querySelector('.ld-hero');hero.querySelector('.ld-pulse')?.remove();hero.insertAdjacentHTML('afterbegin','<canvas class="ld-pulse-c" aria-hidden="true"></canvas>');
  ldOrbit();ldLoop()};
/* Línea de mercado con la forma real del COLCAP del último mes: avanza despacio, como una gráfica en vivo */
const PULSE=(()=>{const s=closesFor('COLCAP').filter(c=>c.day>=sinceFor('3m')).map(c=>c.price);const lo=Math.min(...s),hi=Math.max(...s),rg=(hi-lo)||1;return s.map(v=>(v-lo)/rg*2-1)})();
function pulseY(u){const n=PULSE.length,f=((u%n)+n)%n,i=Math.floor(f),t=f-i;const p0=PULSE[(i-1+n)%n],p1=PULSE[i],p2=PULSE[(i+1)%n],p3=PULSE[(i+2)%n];return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)}
ldLoop=function(){cancelAnimationFrame(LD.raf);const c=$('ldDots');if(!c)return;const ctx=c.getContext('2d');const pulses=[...document.querySelectorAll('.ld-pulse-c')];
  const fit=()=>{const d=PERF.dpr(1.5);c.width=innerWidth*d;c.height=innerHeight*d;pulses.forEach(p=>{p.width=p.clientWidth*d;p.height=p.clientHeight*d})};fit();if(!ldLoop.b){ldLoop.b=1;addEventListener('resize',fit)}
  let t0=performance.now(),lastY=scrollY,speed=0;
  const st={};const step=now=>{if(!document.body.classList.contains('on-landing')||document.hidden||perfSkip(st,now)){LD.raf=requestAnimationFrame(step);return}
    const dt=Math.min(.05,(now-t0)/1000);t0=now;speed+=((Math.abs(scrollY-lastY)/Math.max(dt,.001))/900-speed)*.1;lastY=scrollY;
    LD.x+=(LD.tx-LD.x)*.06;LD.y+=(LD.ty-LD.y)*.06;const ld=$('landing');setVar(ld,'--ax',((LD.x-.5)*120).toFixed(1));setVar(ld,'--ay',((LD.y-.45)*90).toFixed(1));
    /* puntos */
    const w=c.width,h=c.height,s=w/innerWidth,gap=26*s,px=LD.x*w,py=LD.y*h,R=200*s,oy=-(scrollY*.15*s)%gap;ctx.clearRect(0,0,w,h);
    /* Los puntos lejos del cursor son todos iguales: se dibujan juntos en un solo trazo (mucho más liviano). */
    const r0=.75*s;ctx.beginPath();
    for(let y=gap*.5+oy;y<h+gap;y+=gap)for(let x=gap*.5;x<w;x+=gap){const dx=x-px,dy=y-py;if(dx*dx+dy*dy>=R*R){ctx.moveTo(x+r0,y);ctx.arc(x,y,r0,0,6.2832)}}
    ctx.fillStyle='rgba(255,255,255,.045)';ctx.fill();
    const x0=Math.max(gap*.5,gap*.5+Math.floor((px-R-gap*.5)/gap)*gap),y0=gap*.5+oy+Math.max(0,Math.floor((py-R-gap*.5-oy)/gap))*gap;
    for(let y=y0;y<Math.min(h+gap,py+R+gap);y+=gap)for(let x=x0;x<Math.min(w,px+R+gap);x+=gap){const dx=x-px,dy=y-py,dd=Math.hypot(dx,dy);if(dd>=R)continue;const near=1-dd/R,a=.045+near*.55;
      ctx.fillStyle=near>.04?`rgba(190,240,220,${a.toFixed(3)})`:`rgba(255,255,255,${a.toFixed(3)})`;ctx.beginPath();ctx.arc(x-dx*near*.12,y-dy*near*.12,(0.75+near*1.7)*s,0,6.2832);ctx.fill()}
    /* línea de mercado en vivo: cada fracción de segundo llega un precio nuevo; la línea corre hacia la izquierda */
    if(!LD.tk){LD.tk=[];let v=0,ci=0;for(let i=0;i<90;i++){v=v*.94+(Math.random()-.5)*.36+(PULSE[ci++%PULSE.length]-v)*.05;LD.tk.push(v)}LD.ci=ci;LD.acc=0;LD.dir=1}
    const tickEvery=.16/(1+Math.min(speed,3)*.8);LD.acc+=dt;
    while(LD.acc>=tickEvery){LD.acc-=tickEvery;const last=LD.tk[LD.tk.length-1];let v=last*.94+(Math.random()-.5)*.36+(PULSE[LD.ci++%PULSE.length]-last)*.05;v=Math.max(-1.2,Math.min(1.2,v));LD.dir=v>=last?1:-1;LD.flash=1;LD.tk.push(v);if(LD.tk.length>140)LD.tk.shift()}
    LD.flash=Math.max(0,(LD.flash||0)-dt*2.2);const frac=LD.acc/tickEvery;
    pulses.forEach(pc=>{const r=pc.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;const g=pc.getContext('2d'),W=pc.width,H=pc.height,k=W/Math.max(r.width,1);g.clearRect(0,0,W,H);
      const end=W*.86,base=H*.5,amp=H*.32,cx=(LD.px-r.left)*k,cy=(LD.py-r.top)*k,n=LD.tk.length,stepX=end/(n-2);const pts=[];
      for(let i=0;i<n;i++){const x=(i-frac)*stepX;if(x<-stepX)continue;const near=Math.exp(-Math.pow(x-cx,2)/(2*Math.pow(150*k,2)))*Math.max(0,1-Math.abs(cy-base)/(H*1.6));pts.push([x,base-LD.tk[i]*amp*(1+near*.6)])}
      const [ex,ey]=pts[pts.length-1];
      g.save();g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.lineTo(ex,H);g.lineTo(pts[0][0],H);g.closePath();const fill=g.createLinearGradient(0,base-amp,0,H);fill.addColorStop(0,'rgba(61,204,142,.18)');fill.addColorStop(1,'rgba(61,204,142,0)');g.fillStyle=fill;g.fill();
      g.globalCompositeOperation='destination-in';const mask=g.createLinearGradient(0,0,end,0);mask.addColorStop(0,'rgba(0,0,0,0)');mask.addColorStop(.35,'rgba(0,0,0,1)');g.fillStyle=mask;g.fillRect(0,0,W,H);g.restore();
      const fade=g.createLinearGradient(0,0,end,0);fade.addColorStop(0,'rgba(61,204,142,0)');fade.addColorStop(.3,'rgba(61,204,142,.6)');fade.addColorStop(1,'rgba(140,235,200,1)');
      g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=fade;g.lineWidth=2*k;g.lineJoin='round';g.lineCap='round';g.stroke();
      g.setLineDash([3*k,5*k]);g.strokeStyle='rgba(255,255,255,.16)';g.lineWidth=1*k;g.beginPath();g.moveTo(ex,ey);g.lineTo(W,ey);g.stroke();g.setLineDash([]);
      const col=LD.dir>0?'61,204,142':'240,113,103';const gr=g.createRadialGradient(ex,ey,0,ex,ey,(16+LD.flash*14)*k);gr.addColorStop(0,`rgba(${col},${(.35+LD.flash*.4).toFixed(2)})`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;g.beginPath();g.arc(ex,ey,(16+LD.flash*14)*k,0,6.2832);g.fill();
      g.fillStyle=LD.dir>0?'#eafff5':'#ffe9e6';g.beginPath();g.arc(ex,ey,3.4*k,0,6.2832);g.fill()});
    /* celular y foto siguen el cursor */
    const ph=$('ldPhone');if(ph){setVar(ph,'--ptx',((LD.x-.5)*12).toFixed(2));setVar(ph,'--pty',((.5-LD.y)*8).toFixed(2))}
    const z=$('ldZoom');if(z){setVar(z,'--mx2',((LD.x-.5)*-30).toFixed(1));setVar(z,'--my2',((LD.y-.5)*-20).toFixed(1))}
    ldOrbitStep();
    LD.raf=requestAnimationFrame(step)};LD.raf=requestAnimationFrame(step)};
/* Final: logos que flotan y se apartan del cursor, botón magnético, cifra que cuenta */
function ldOrbit(){const o=$('ldOrbit');if(!o||o.children.length)return;const pos=[[8,18],[18,72],[30,10],[70,12],[84,24],[90,70],[76,86],[22,88],[50,6],[60,90]];
  o.innerHTML=POOL_EXPANDIDO.map((a,i)=>`<span class="ld-orb" style="left:${pos[i][0]}%;top:${pos[i][1]}%;--d:${(i*0.7).toFixed(1)}s">${logoHTML(a)}</span>`).join('')}
function ldOrbitStep(){const f=$('ldFinal');if(!f)return;const r=f.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;f.classList.toggle('lit',r.top<innerHeight*.5);
  f.querySelectorAll('.ld-orb').forEach(o=>{const b=o.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2,dx=cx-LD.px,dy=cy-LD.py,d=Math.hypot(dx,dy),p=Math.max(0,1-d/220)*40;o.style.setProperty('--rx',(dx/(d||1)*p).toFixed(1)+'px');o.style.setProperty('--ry',(dy/(d||1)*p).toFixed(1)+'px')});
  const btn=f.querySelector('.ld-mag');if(btn){const b=btn.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2,dx=LD.px-cx,dy=LD.py-cy,d=Math.hypot(dx,dy),p=d<160?(1-d/160):0;btn.style.setProperty('--mgx',(dx*p*.18).toFixed(1)+'px');btn.style.setProperty('--mgy',(dy*p*.25).toFixed(1)+'px')}
  const n=f.querySelector('[data-ld-count]');if(n&&r.top<innerHeight*.75)countIn(n)}
/* Tres pasos: cada escena arranca al aparecer y se repite al pasar el mouse; la línea se dibuja con el scroll */
function ldScenes(){document.querySelectorAll('.ld-card[data-scene]').forEach(c=>{if(c.dataset.sb)return;c.dataset.sb='1';
  const play=()=>{c.classList.remove('play');void c.offsetWidth;c.classList.add('play');const n=c.querySelector('[data-sc-count]');if(n){const v=+n.dataset.scCount;countUp(n,v,{fmt:x=>'+'+formatCOP(x).replace(/\s/g,''),dur:1200})}};
  new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){setTimeout(play,250+(+getComputedStyle(c).getPropertyValue('--i')||0)*250);o.disconnect()}},{threshold:.3}).observe(c);c.addEventListener('mouseenter',play)})}
function ldHowLine(){const h=$('ldHow');if(!h)return;const r=h.getBoundingClientRect(),p=Math.min(1,Math.max(0,(innerHeight*.85-r.top)/(r.height*.8)));h.style.setProperty('--hp',p.toFixed(3))}
addEventListener('scroll',()=>{if(document.body.classList.contains('on-landing'))requestAnimationFrame(ldHowLine)},{passive:true});
const _showLanding4=showLanding;showLanding=function(){_showLanding4();safe(ldScenes,'scenes');ldHowLine()};


/* =================== CONEXIÓN CON EL BACKEND =================== */
function hideBootSplash(){const b=document.getElementById('bootSplash');if(b){b.classList.add('out');setTimeout(()=>b.remove(),400)}}
function setLoginBusy(on){document.querySelectorAll('#loginScreen button, .ld-final-ctas button').forEach(b=>b.disabled=on);const s=document.querySelector('#loginForm button[type=submit]');if(s)s.textContent=on?'Entrando…':'Entrar'}
/* Trae lo de la persona (movimientos y noticias) y abre la app. */
async function liveEnter(p){currentUser=p.isGuest?'Invitado':p.email;
  try{TRACE.user=await TRACE.cargarPersona()}catch(err){showToast(err.message||'No pudimos traer tu portafolio.');return}
  applyServerNews(TRACE.user.news);syncQuota(TRACE.user.quota);enterApp(currentUser)}
/* La cuota de IA la lleva el servidor; aquí solo se guarda lo que respondió para mostrarlo. */
function setAiLeft(kind,n){localStorage.setItem(aiKey(kind),String(Math.max(0,AI_QUOTA-n)))}
function syncQuota(q){if(!q||!q.used)return;if(q.limit)AI_QUOTA=q.limit;Object.keys(AI_KINDS).forEach(k=>localStorage.setItem(aiKey(k),String(q.used[k]||0)))}
async function loginGuest(){if(!LIVE){enterApp('Invitado');return}setLoginBusy(true);try{const p=await TRACE.auth.invitado();await liveEnter(p)}catch(err){showToast(err.message)}finally{setLoginBusy(false)}}
if(LIVE){
  /* Cada cambio se calcula aquí al instante (mismas reglas que la API) y se guarda en el servidor en orden. */
  const _add=API.addTransaction;API.addTransaction=function(body){const r=_add(body);if(r.ok)TRACE.sync.agregar(r.data).then(()=>{try{renderTxList()}catch(e){}});return r};
  const _del=API.deleteTransaction;API.deleteTransaction=function(id){const mov=TX.find(x=>x.id===id);const r=_del(id);if(r.ok&&mov)TRACE.sync.borrar(mov);return r};
  const _reset=API.reset;API.reset=function(){const r=_reset();TRACE.sync.reiniciar();return r};
  API.waitlist=function(){localStorage.setItem('trace_waitlist_'+userSlug(),new Date().toISOString());TRACE.sync.listaDeEspera();return{ok:true,status:201}};
  API.me=function(){const p=TRACE.persona;return{id:p?p.id:'',email:p&&!p.isGuest?p.email:null,is_guest:!p||p.isGuest}};
  obUseSeed=function(){API.reset();seedTransactions().forEach(t=>{const r=API.addTransaction({ticker:t.ticker,kind:t.kind,quantity:t.quantity,price:t.price,day:t.day});if(!r.ok)showToast(r.detail)});obDone()};
  const _logout=logout;logout=function(){TRACE.auth.salir();_logout()};
  /* Si el servidor rechaza un cambio, se vuelve a lo que de verdad quedó guardado. */
  /* Trace AI de verdad: POST /v1/ai/{tipo}. Si el servidor no responde, la explicación local de siempre. */
  callAI=async function(kind,makeText,question,route){
    try{const r=await TRACE.ia(route||kind,question,kind==='chat'&&!route?CHAT_HISTORY.slice(-3):[]);setAiLeft(kind,r.remaining);updateApiStatus();return{text:r.text,error:null,remaining:r.remaining,source:r.source}}
    catch(e){if(e&&e.status===429&&e.code==='AI_QUOTA'){setAiLeft(kind,0);updateApiStatus();return{text:'',error:'QUOTA',remaining:0}}
      if(e&&e.status===429)showToast(e.message);
      return{text:String(makeText()||''),error:null,remaining:aiLeft(kind),source:'respaldo'}}};
  window.addEventListener('trace:error',async e=>{showToast(e.detail);try{TRACE.user=await TRACE.cargarPersona();TX=TRACE.user.tx;refreshAll();renderTxList()}catch(err){}});
}

updateApiStatus();
renderLoginPreview();
/* Al recargar, la sesión sigue abierta (Supabase la guarda en el navegador). */
if(LIVE){TRACE.auth.actual().then(p=>p?liveEnter(p).then(()=>{if(!$('appShell').classList.contains('app-shell-active')&&!$('onboarding').classList.contains('active'))showLanding()}):showLanding()).catch(()=>showLanding()).finally(hideBootSplash)}
else{try{const ses=localStorage.getItem('trace_session');if(ses)enterApp(ses);else showLanding()}catch(e){showLanding()}hideBootSplash()}

/* Insights: cuando la persona avanza o retrocede una vez, la flecha deja de latir (se recuerda en este navegador). */
try{if(localStorage.getItem('trace_story_used'))document.body.classList.add('story-used')}catch{}
['storyGo'].forEach(k=>{const f=window[k];if(typeof f!=='function')return;
  window[k]=function(){document.body.classList.add('story-used');try{localStorage.setItem('trace_story_used','1')}catch{}return f.apply(this,arguments)}});
