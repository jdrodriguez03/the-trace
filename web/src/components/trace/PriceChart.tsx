import { useMemo, useRef, useState, type PointerEvent } from "react";

import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

import { cop } from "./format-provisional";
import type { PricePoint, PriceRange } from "./types";

// Gráfica dibujada con SVG, sin librerías: es una sola línea con su área.
// Si después el equipo instala el chart de shadcn, se puede cambiar sin tocar las pantallas,
// porque recibe lo mismo por props.

const RANGES: PriceRange[] = ["1m", "3m", "1y"];
const DAYS: Record<PriceRange, number> = { "1m": 31, "3m": 92, "1y": 366 };
const W = 600;
const H = 180;
const PAD_Y = 10;

type PriceChartProps = {
  /** Cierres diarios, del más viejo al más nuevo. */
  points: PricePoint[];
  /** Rango inicial. Por defecto, 1M. */
  defaultRange?: PriceRange;
  /** Se llama al cambiar de rango, por si la pantalla pide los datos de ese rango a la API. */
  onRangeChange?: (range: PriceRange) => void;
  /** Para lectores de pantalla, por ejemplo «Precio de Ecopetrol». */
  label?: string;
  className?: string;
};

function parseDate(d: string) {
  return new Date(`${d}T12:00:00`);
}

const shortDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });
const monthYear = new Intl.DateTimeFormat("es-CO", { month: "short", year: "numeric" });
const longDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" });

/** Puntos del rango, contando hacia atrás desde el último cierre. */
function filterRange(points: PricePoint[], range: PriceRange) {
  if (!points.length) return [];
  const last = parseDate(points[points.length - 1].date).getTime();
  const from = last - DAYS[range] * 86_400_000;
  return points.filter((p) => parseDate(p.date).getTime() >= from);
}

/** Gráfica de línea del precio, con botones 1M, 3M y 1A. Verde si el periodo subió y coral si bajó. */
export function PriceChart({ points, defaultRange = "1m", onRangeChange, label, className }: PriceChartProps) {
  const [range, setRange] = useState<PriceRange>(defaultRange);
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const data = useMemo(() => filterRange(points, range), [points, range]);

  const prices = data.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const x = (i: number) => (data.length > 1 ? (i / (data.length - 1)) * W : 0);
  const y = (v: number) => PAD_Y + (1 - (v - min) / span) * (H - PAD_Y * 2);

  const up = (data[data.length - 1]?.price ?? 0) >= (data[0]?.price ?? 0);
  const color = up ? "var(--up)" : "var(--down)";
  const line = data.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const gradientId = up ? "trace-price-up" : "trace-price-down";
  const point = active !== null ? data[active] : null;

  function choose(r: PriceRange) {
    setRange(r);
    setActive(null);
    onRangeChange?.(r);
  }

  function onPointer(e: PointerEvent<SVGSVGElement>) {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box || data.length < 2) return;
    const ratio = Math.min(Math.max((e.clientX - box.left) / box.width, 0), 1);
    setActive(Math.round(ratio * (data.length - 1)));
  }

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex gap-1" role="group" aria-label={label ?? copy.priceChart.priceLabel}>
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={range === r}
            aria-label={copy.priceChart.rangeLabels[r]}
            onClick={() => choose(r)}
            className={cn(
              "min-h-11 min-w-11 rounded-md px-3 text-sm font-semibold transition-colors",
              range === r ? "bg-ink text-white" : "text-ink-2 hover:bg-hover",
            )}
          >
            {copy.priceChart.ranges[r]}
          </button>
        ))}
      </div>

      {data.length < 2 ? (
        <p className="grid h-48 place-items-center rounded-md bg-sunken text-sm text-muted-foreground">
          {copy.priceChart.empty}
        </p>
      ) : (
        <div className="grid gap-1">
          {/* Fecha y precio del punto tocado; si no hay ninguno, el último cierre. */}
          <p className="tnum text-sm" aria-live="polite">
            <strong className="font-semibold">{cop((point ?? data[data.length - 1]).price)}</strong>
            <span className="ml-2 text-muted-foreground">
              {longDate.format(parseDate((point ?? data[data.length - 1]).date))}
            </span>
          </p>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-44 w-full touch-none select-none"
            role="img"
            aria-label={label ?? copy.priceChart.priceLabel}
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={() => setActive(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {point && active !== null ? (
              <line
                x1={x(active)}
                x2={x(active)}
                y1={0}
                y2={H}
                stroke="var(--line-2)"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </svg>
          <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
            {/* En 1A se muestra el año, porque las dos puntas caen en el mismo mes. */}
            <span>{(range === "1y" ? monthYear : shortDate).format(parseDate(data[0].date))}</span>
            <span>{(range === "1y" ? monthYear : shortDate).format(parseDate(data[data.length - 1].date))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
