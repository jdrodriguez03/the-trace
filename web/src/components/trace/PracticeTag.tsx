import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

type PracticeTagProps = {
  className?: string;
};

/** Etiqueta «De práctica · sin dinero real». */
export function PracticeTag({ className }: PracticeTagProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[5px] border border-strip-line bg-strip px-2 text-[12.5px] font-semibold whitespace-nowrap text-strip-ink",
        className,
      )}
    >
      {copy.practice.tag}
    </span>
  );
}
