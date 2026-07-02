import * as icons from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "gold" | "forest" | "terracotta" | "ink" | "sand";

const toneStyles: Record<Tone, string> = {
  gold: "from-[#8a6a30] via-[#a9803f] to-[#d9bd8a]",
  forest: "from-[#232b23] via-[#3a4636] to-[#6b7a5e]",
  terracotta: "from-[#7a3a24] via-[#b1613f] to-[#e0a878]",
  ink: "from-[#0d0b08] via-[#2b261e] to-[#5c5142]",
  sand: "from-[#c9b688] via-[#efe7d8] to-[#f8f4ec]",
};

const toneText: Record<Tone, string> = {
  gold: "text-cream",
  forest: "text-cream",
  terracotta: "text-cream",
  ink: "text-cream",
  sand: "text-ink",
};

type IconName = keyof typeof icons;

export function PlaceholderImage({
  tone = "gold",
  label,
  icon = "Sparkles",
  className,
  labelClassName,
  showLabel = true,
}: {
  tone?: Tone;
  label: string;
  icon?: IconName;
  className?: string;
  labelClassName?: string;
  showLabel?: boolean;
}) {
  const Icon = (icons[icon] ?? icons.Sparkles) as icons.LucideIcon;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative flex h-full w-full items-end overflow-hidden bg-gradient-to-br",
        toneStyles[tone],
        className
      )}
    >
      <div className="bg-noise absolute inset-0" />
      <Icon
        className={cn(
          "absolute -right-4 -top-4 h-28 w-28 rotate-12 opacity-15 sm:h-36 sm:w-36",
          toneText[tone]
        )}
        strokeWidth={1}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      {showLabel && (
        <div
          className={cn(
            "relative z-10 flex w-full items-center gap-3 p-4 sm:p-5",
            toneText[tone],
            labelClassName
          )}
        >
          <span className="h-px w-6 bg-current opacity-60" />
          <span className="font-display text-sm tracking-wide sm:text-base">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
