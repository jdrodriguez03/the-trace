// Galería: página /galeria, solo para el equipo y solo en desarrollo. Dueña: Isabela.
// Muestra cada componente suelto con datos de prueba. Los títulos de esta página son
// internos: el usuario de la app nunca la ve.

import { useState, type ReactNode } from "react";

import { DirectionChip } from "@/components/trace/DirectionChip";
import { GainLoss } from "@/components/trace/GainLoss";
import { NewsCard } from "@/components/trace/NewsCard";
import { PracticeTag } from "@/components/trace/PracticeTag";
import { PriceChart } from "@/components/trace/PriceChart";
import { PriceFreshness } from "@/components/trace/PriceFreshness";
import { SectorLegend } from "@/components/trace/SectorLegend";
import { sectorColor } from "@/components/trace/sector-colors";
import { WeightBar } from "@/components/trace/WeightBar";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/features/account/AccountMenu";
import { MarketView } from "@/features/market/MarketView";
import { AdSlot } from "@/features/monetization/AdSlot";
import { PlanStrip } from "@/features/monetization/PlanStrip";
import { NewsRadarView } from "@/features/news-radar/NewsRadarView";

import { EXAMPLE, MARKET_SAMPLE, NEWS_SAMPLE, samplePrices } from "./datos-galeria";

const TOTAL = EXAMPLE.reduce((sum, a) => sum + a.shares * a.price, 0);
const SECTORS = EXAMPLE.map((a) => ({ sector: a.sector, percent: ((a.shares * a.price) / TOTAL) * 100 }));
const PRICES_UP = samplePrices(21800, 0.18);
const PRICES_DOWN = samplePrices(2350, -0.22, 11);
// Horas fijas para ver los dos textos de PriceFreshness.
const OPEN_NOW = new Date("2026-10-23T15:20:00-05:00");
const OPEN_UPDATED = "2026-10-23T15:12:00-05:00";
const CLOSED_NOW = new Date("2026-10-24T10:00:00-05:00");
const CLOSED_UPDATED = "2026-10-23T17:00:00-05:00";

const SWATCHES = [
  ["Lienzo", "var(--canvas)"],
  ["Superficie", "var(--surface)"],
  ["Tinta", "var(--ink)"],
  ["Texto suave", "var(--muted-ink)"],
  ["Borde", "var(--line-2)"],
  ["Marca", "var(--brand)"],
  ["Sube", "var(--up)"],
  ["Baja", "var(--down)"],
  ["Franja de práctica", "var(--strip)"],
];

/** Simula una llamada a la API que tarda medio segundo. */
const fakeSave = () => new Promise((resolve) => setTimeout(resolve, 500));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-border pt-6">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function GaleriaPage() {
  const [selectedSector, setSelectedSector] = useState("all");
  const [lastAction, setLastAction] = useState("");
  const log = (text: string) => () => setLastAction(text);

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">Solo para el equipo</p>
          <h1 className="text-[28px] font-extrabold tracking-tight">Galería de componentes</h1>
          <p className="text-muted-foreground">Cada pieza suelta, con los colores y la letra del prototipo.</p>
        </div>
        <AccountMenu
          email={null}
          onGoPortfolio={log("Ir a Mi portafolio")}
          onReset={async () => {
            await fakeSave();
            setLastAction("Portafolio borrado: ahora iría al onboarding");
          }}
          onLogout={log("Cerrar sesión: ahora iría al login")}
          onNotifyPlan={fakeSave}
        />
      </header>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Última acción: {lastAction || "ninguna"}
      </p>

      <Section title="Colores del tema">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {SWATCHES.map(([name, color]) => (
            <li key={name} className="flex items-center gap-3 text-sm">
              <span className="size-8 flex-none rounded-md border border-border" style={{ background: color }} />
              {name}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Botones (44 px de alto como mínimo)">
        <div className="flex flex-wrap gap-3">
          <Button>Entrar y practicar</Button>
          <Button variant="secondary">Probar sin correo</Button>
          <Button variant="outline">Ver portafolio</Button>
          <Button variant="ghost">Mostrar todo</Button>
          <Button variant="link">Ver todas</Button>
          <Button variant="destructive">Vender todo</Button>
          <Button size="sm">Pequeño</Button>
          <Button size="lg">Crear mi portafolio de práctica</Button>
          <Button disabled>Elige al menos 1 acción</Button>
        </div>
      </Section>

      <Section title="Componentes propios, con el portafolio de ejemplo">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">PracticeTag</p>
            <div>
              <PracticeTag />
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">DirectionChip</p>
            <div className="flex flex-wrap gap-2">
              <DirectionChip change={0.8} />
              <DirectionChip change={-1.4} />
              <DirectionChip change={0} />
              <DirectionChip change={1.9} showPercent={false} />
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">GainLoss</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <GainLoss amount={20000} percent={10} />
              <GainLoss amount={-15000} percent={-5} />
              <GainLoss amount={5774} percent={0.07} decimals={2} />
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">WeightBar</p>
            <ul className="grid gap-4 rounded-lg border border-border bg-card p-4">
              {EXAMPLE.map((a) => (
                <li key={a.ticker} className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="font-semibold">{a.name}</strong>
                    <DirectionChip change={a.change} />
                  </div>
                  <WeightBar percent={((a.shares * a.price) / TOTAL) * 100} color={sectorColor(a.sector)} />
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">SectorLegend (toca un sector)</p>
            <div className="max-w-sm rounded-lg border border-border bg-card p-2">
              <SectorLegend sectors={SECTORS} selected={selectedSector} onSelect={setSelectedSector} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Noticias (NewsCard)">
        <p className="text-sm text-muted-foreground">Versión completa</p>
        <NewsCard news={NEWS_SAMPLE[0]} onSeeAsset={(t) => setLastAction(`Ver acción ${t}`)} />
        <p className="text-sm text-muted-foreground">Versión compacta, para Hoy</p>
        <div className="rounded-lg border border-border bg-card px-4">
          {NEWS_SAMPLE.slice(0, 3).map((n) => (
            <NewsCard key={n.id} news={n} compact />
          ))}
        </div>
      </Section>

      <Section title="Gráfica de precio (PriceChart)">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 font-semibold">ISA, periodo que subió</p>
            <PriceChart points={PRICES_UP} label="Precio de ISA" />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 font-semibold">Ecopetrol, periodo que bajó</p>
            <PriceChart points={PRICES_DOWN} label="Precio de Ecopetrol" defaultRange="1y" />
          </div>
        </div>
      </Section>

      <Section title="Hora del precio (PriceFreshness)">
        <PriceFreshness updatedAt={OPEN_UPDATED} now={OPEN_NOW} />
        <PriceFreshness updatedAt={CLOSED_UPDATED} now={CLOSED_NOW} />
      </Section>

      <Section title="Anuncio y Trace+ (toca «Quitar anuncios»)">
        <div className="grid max-w-sm gap-3">
          <AdSlot offset={0} onNotifyPlan={fakeSave} />
          <AdSlot offset={1} onNotifyPlan={fakeSave} />
          <PlanStrip onNotifyPlan={fakeSave} />
        </div>
      </Section>

      <Section title="Pantalla Mercado colombiano (datos de prueba)">
        <MarketView
          assets={MARKET_SAMPLE}
          updatedAt={OPEN_UPDATED}
          now={OPEN_NOW}
          onOpenAsset={(t) => setLastAction(`Abrir detalle de ${t}`)}
        />
      </Section>

      <Section title="Pantalla Noticias que te afectan (datos de prueba)">
        <NewsRadarView news={NEWS_SAMPLE} onSeeAsset={(t) => setLastAction(`Ver acción ${t}`)} />
      </Section>
    </main>
  );
}

export default GaleriaPage;
