import * as icons from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "gold" | "forest" | "terracotta" | "ink" | "sand";

const toneStyles: Record<Tone, string> = {
  gold: "from-[#7a6852] via-[#9a8570] to-[#c4b39e]",
  forest: "from-[#1c2b2a] via-[#2e4443] to-[#5a716f]",
  terracotta: "from-[#4a332a] via-[#6b4a3a] to-[#a08470]",
  ink: "from-[#242020] via-[#443c37] to-[#7a6f65]",
  sand: "from-[#a0948a] via-[#d3c9bd] to-[#efe9e1]",
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
