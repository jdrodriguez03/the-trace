import { useState } from "react";

import { NewsCard } from "@/components/trace/NewsCard";
import type { NewsDirection, NewsImpact, NewsItem } from "@/components/trace/types";
import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

type NewsRadarViewProps = {
  news: NewsItem[];
  onSeeAsset?: (ticker: string) => void;
};

const IMPACTS: NewsImpact[] = ["Alta", "Media", "Baja"];
const DIRECTIONS: NewsDirection[] = ["Positivo", "Negativo", "Neutro"];

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "border-ink bg-ink text-white" : "border-input bg-card text-ink-2 hover:bg-hover",
      )}
    >
      {children}
    </button>
  );
}

/** Pantalla Noticias que te afectan, sin pedir datos: los recibe por props. */
export function NewsRadarView({ news, onSeeAsset }: NewsRadarViewProps) {
  const [impact, setImpact] = useState<NewsImpact | "all">("all");
  const [direction, setDirection] = useState<NewsDirection | "all">("all");

  const filtered = news.filter(
    (n) => (impact === "all" || n.impact === impact) && (direction === "all" || n.direction === direction),
  );
  const hasFilter = impact !== "all" || direction !== "all";

  function resetFilters() {
    setImpact("all");
    setDirection("all");
  }

  return (
    <div className="grid gap-5">
      <header className="grid gap-1">
        <h1 className="text-[26px] font-extrabold tracking-tight">{copy.radar.title}</h1>
        <p className="text-muted-foreground">{copy.radar.subtitle}</p>
      </header>

      <section className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:p-5" aria-label={copy.radar.filtersLabel}>
        <div className="grid gap-1.5">
          <p className="text-[13px] font-semibold text-muted-foreground">{copy.radar.impactLabel}</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={impact === "all"} onClick={() => setImpact("all")}>
              {copy.radar.all}
            </FilterChip>
            {IMPACTS.map((i) => (
              <FilterChip key={i} active={impact === i} onClick={() => setImpact(i)}>
                {copy.news.impact[i]}
              </FilterChip>
            ))}
          </div>
        </div>
        <div className="grid gap-1.5">
          <p className="text-[13px] font-semibold text-muted-foreground">{copy.radar.typeLabel}</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={direction === "all"} onClick={() => setDirection("all")}>
              {copy.radar.all}
            </FilterChip>
            {DIRECTIONS.map((d) => (
              <FilterChip key={d} active={direction === d} onClick={() => setDirection(d)}>
                {copy.news.direction[d]}
              </FilterChip>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{copy.radar.listTitle}</h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {copy.radar.count(filtered.length)}
            </p>
          </div>
          <Button variant="ghost" onClick={resetFilters} disabled={!hasFilter}>
            {copy.radar.reset}
          </Button>
        </div>

        {filtered.length ? (
          filtered.map((n) => <NewsCard key={n.id} news={n} onSeeAsset={onSeeAsset} />)
        ) : (
          <div className="rounded-lg border border-border bg-card px-5 py-9 text-center">
            <h3 className="font-bold">{news.length ? copy.empty.newsFilterTitle : copy.empty.newsTitle}</h3>
            <p className="mx-auto mt-1 max-w-[42ch] text-sm text-muted-foreground">
              {news.length ? copy.empty.newsFilterText : copy.empty.newsText}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
