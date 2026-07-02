import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  light = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  light?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-2xl",
        align === "center" ? "text-center" : "text-left ml-0 mr-auto",
        className
      )}
    >
      {eyebrow && (
        <Reveal>
          <p
            className={cn(
              "mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em]",
              align === "center" && "justify-center",
              light ? "text-gold-light" : "text-gold-deep"
            )}
          >
            <span className="h-px w-8 bg-current opacity-70" />
            {eyebrow}
            <span
              className={cn(
                "h-px w-8 bg-current opacity-70",
                align === "left" && "hidden"
              )}
            />
          </p>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2
          className={cn(
            "font-display text-balance text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl",
            light ? "text-cream" : "text-ink"
          )}
        >
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.1}>
          <p
            className={cn(
              "mt-4 text-balance text-base leading-relaxed sm:text-lg",
              light ? "text-cream/75" : "text-ink-soft/75"
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
