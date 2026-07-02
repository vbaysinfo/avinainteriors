import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ButtonProps = {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "whatsapp";
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  target?: string;
  rel?: string;
};

const variants = {
  primary:
    "bg-ink text-cream hover:bg-gold-deep border border-ink hover:border-gold-deep",
  secondary:
    "bg-transparent text-ink border border-ink/30 hover:border-gold hover:text-gold-deep",
  ghost: "bg-transparent text-cream border border-cream/40 hover:bg-cream/10",
  whatsapp:
    "bg-[#25D366] text-white hover:bg-[#1ebe57] border border-[#25D366]",
};

const sizes = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  icon,
  onClick,
  type = "button",
  target,
  rel,
}: ButtonProps) {
  const classes = cn(
    "group inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase tracking-wider transition-all duration-300",
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} target={target} rel={rel}>
        {children}
        {icon}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
      {icon}
    </button>
  );
}
