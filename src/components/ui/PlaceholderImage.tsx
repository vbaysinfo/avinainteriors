import * as icons from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "gold" | "forest" | "terracotta" | "ink" | "sand";

const toneStyles: Record<Tone, string> = {
  gold: "from-[#8a6a3f] via-[#b8935f] to-[#dcb888]",
  forest: "from-[#0f231a] via-[#1f3d2e] to-[#3f6552]",
  terracotta: "from-[#6b3a1f] via-[#a85c32] to-[#c98a5e]",
  ink: "from-[#0d0d0d] via-[#1a1a1a] to-[#4a4238]",
  sand: "from-[#d6c9ad] via-[#e8e1d5] to-[#faf8f5]",
};

const toneText: Record<Tone, string> = {
  gold: "text-cream",
  forest: "text-cream",
  terracotta: "text-cream",
  ink: "text-cream",
  sand: "text-ink",
};

type IconName = keyof typeof icons;

// NOTE: This renders a stylised gradient placeholder (not a real photo) so
// the layout works without stock imagery. Swap for <Image src="..." fill />
// with real project photos — see README.md "Replace placeholder imagery".
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
      {/* soft directional light, like window light hitting a room */}
      <div
        className="absolute inset-0 opacity-70 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, rgba(255,255,255,0.85), transparent 55%)",
        }}
      />
      <div className="bg-noise absolute inset-0" />
      <Icon
        className={cn(
          "absolute -right-4 -top-4 h-28 w-28 rotate-12 opacity-15 sm:h-36 sm:w-36",
          toneText[tone]
        )}
        strokeWidth={1}
      />
      {/* photographic vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.35)]" />
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
