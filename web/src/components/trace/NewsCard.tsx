import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

import type { NewsDirection, NewsImpact, NewsItem } from "./types";
import { WeightBar } from "./WeightBar";

const DIR_STYLE: Record<NewsDirection, { icon: string; className: string }> = {
  Positivo: { icon: "▲", className: "bg-up-soft text-up" },
  Negativo: { icon: "▼", className: "bg-down-soft text-down" },
  Neutro: { icon: "●", className: "bg-flat-soft text-ink-2" },
};
const IMPACT_LEVEL: Record<NewsImpact, number> = { Alta: 3, Media: 2, Baja: 1 };

/** Etiqueta del tipo de noticia: «▲ Buena noticia», «▼ Mala noticia» o «● Neutra». */
export function NewsTypeTag({ direction }: { direction: NewsDirection }) {
  const s = DIR_STYLE[direction];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-[5px] px-2 text-[12.5px] font-bold whitespace-nowrap",
        s.className,
      )}
    >
      <span aria-hidden="true">{s.icon}</span>
      {copy.news.direction[direction]}
    </span>
  );
}

/** Impacto con 3 barritas: «Impacto grande», «mediano» o «pequeño». */
export function ImpactLabel({ impact }: { impact: NewsImpact }) {
  const level = IMPACT_LEVEL[impact];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground">
      <span className="inline-flex h-3 items-end gap-0.5" aria-hidden="true">
        {[5, 8, 12].map((h, i) => (
          <i
            key={h}
            className={cn("block w-[3px] rounded-[1px]", i < level ? "bg-ink-2" : "bg-line-2")}
            style={{ height: h }}
          />
        ))}
      </span>
      {copy.news.impact[impact]}
    </span>
  );
}

type NewsCardProps = {
  news: NewsItem;
  /** Versión corta para la pantalla Hoy. */
  compact?: boolean;
  /** Se llama al tocar «Ver acción». Sin esto, el botón no aparece. */
  onSeeAsset?: (ticker: string) => void;
  className?: string;
};

/** Tarjeta de noticia, igual al prototipo. Con `compact`, la versión para Hoy. */
export function NewsCard({ news, compact = false, onSeeAsset, className }: NewsCardProps) {
  const [open, setOpen] = useState(false);
  const moreId = useId();

  if (compact) {
    return (
      <article className={cn("grid gap-1.5 border-t border-border py-3 first:border-t-0", className)}>
        <div className="flex flex-wrap items-center gap-2">
          <NewsTypeTag direction={news.direction} />
          <ImpactLabel impact={news.impact} />
        </div>
        <h3 className="text-[15px] leading-snug font-semibold">{news.title}</h3>
        <p className="text-sm text-muted-foreground">{news.summary}</p>
        {onSeeAsset ? (
          <div>
            <Button variant="link" className="px-0" onClick={() => onSeeAsset(news.ticker)}>
              {copy.news.seeAsset}
            </Button>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article className={cn("grid gap-3 rounded-lg border border-border bg-card p-4 sm:p-5", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <NewsTypeTag direction={news.direction} />
        <ImpactLabel impact={news.impact} />
        <span className="text-[13px] text-faint">{news.source || copy.news.defaultSource}</span>
      </div>

      <h3 className="text-[17px] leading-snug font-bold tracking-tight">{news.title}</h3>
      <p className="text-[15px] text-ink-2">{news.summary}</p>

      {news.whyItAffects || news.whatToWatch ? (
        <div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-ink"
            aria-expanded={open}
            aria-controls={moreId}
            onClick={() => setOpen((v) => !v)}
          >
            {copy.news.moreToggle}
            <span aria-hidden="true" className={cn("transition-transform", open && "rotate-180")}>
              ⌄
            </span>
          </button>
          <div id={moreId} hidden={!open} className="mt-1 grid gap-2">
            {news.whyItAffects ? (
              <p className="rounded-md border border-border bg-sunken px-3 py-2.5 text-sm text-ink-2">
                <b className="block text-[13.5px] font-semibold text-foreground">{copy.news.whyItAffects}</b>
                {news.whyItAffects}
              </p>
            ) : null}
            {news.whatToWatch ? (
              <p className="rounded-md border border-border bg-sunken px-3 py-2.5 text-sm text-ink-2">
                <b className="block text-[13.5px] font-semibold text-foreground">{copy.news.whatToWatch}</b>
                {news.whatToWatch}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-2">
          <strong className="text-sm font-semibold">{news.assetName}</strong>
          {typeof news.weightPct === "number" ? <WeightBar percent={news.weightPct} /> : null}
        </div>
        {onSeeAsset ? (
          <Button variant="secondary" size="sm" onClick={() => onSeeAsset(news.ticker)}>
            {copy.news.seeAsset}
          </Button>
        ) : null}
      </div>

      <p className="text-[13px] text-muted-foreground">
        {copy.news.aiNote} <strong className="font-semibold text-foreground">{copy.news.notAdvice}</strong>
      </p>
    </article>
  );
}
