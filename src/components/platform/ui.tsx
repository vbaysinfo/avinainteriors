"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function PCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--p-radius)] border border-[var(--p-border)] bg-[var(--p-surface)] p-5 shadow-[var(--p-shadow)] ${className}`}
    >
      {children}
    </div>
  );
}

export function PStatCard({
  label,
  value,
  emoji,
  tone = "primary",
  sub,
}: {
  label: string;
  value: string | number;
  emoji: string;
  tone?: "primary" | "secondary" | "accent" | "pink";
  sub?: string;
}) {
  const toneMap: Record<string, string> = {
    primary: "var(--p-primary)",
    secondary: "var(--p-secondary)",
    accent: "var(--p-accent)",
    pink: "var(--p-pink)",
  };
  return (
    <PCard className="flex items-center gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
        style={{ background: `${toneMap[tone]}22` }}
      >
        {emoji}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-[var(--p-ink)]">{value}</p>
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--p-muted)]">
          {label}
        </p>
        {sub && <p className="mt-0.5 text-xs text-[var(--p-ink-soft)]">{sub}</p>}
      </div>
    </PCard>
  );
}

export function PBadgePill({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "primary" | "secondary" | "accent" | "success" | "warn" | "danger" | "pink" | "muted";
}) {
  const map: Record<string, string> = {
    primary: "bg-[var(--p-primary-soft)] text-[var(--p-primary-dark)]",
    secondary: "bg-[var(--p-secondary-soft)] text-[var(--p-secondary)]",
    accent: "bg-[var(--p-accent-soft)] text-[var(--p-accent)]",
    success: "bg-[var(--p-success-soft)] text-[var(--p-success)]",
    warn: "bg-[var(--p-warn-soft)] text-[#946200]",
    danger: "bg-[var(--p-danger-soft)] text-[var(--p-danger)]",
    pink: "bg-[var(--p-pink-soft)] text-[var(--p-pink)]",
    muted: "bg-[var(--p-bg-soft)] text-[var(--p-muted)]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${map[tone]}`}>
      {children}
    </span>
  );
}

export function PButton({
  children,
  onClick,
  href,
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-[var(--p-primary)] text-white hover:bg-[var(--p-primary-dark)] shadow-[0_8px_20px_-8px_var(--p-primary)]",
    secondary: "bg-[var(--p-bg-soft)] text-[var(--p-ink)] hover:bg-[var(--p-border)]",
    ghost: "bg-transparent text-[var(--p-ink)] border border-[var(--p-border)] hover:bg-[var(--p-bg-soft)]",
    success: "bg-[var(--p-success)] text-white hover:brightness-95",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function PSectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--p-ink)] sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--p-ink-soft)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PEmptyState({ emoji, title, body }: { emoji: string; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--p-radius)] border border-dashed border-[var(--p-border)] p-10 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="mt-3 font-bold text-[var(--p-ink)]">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-[var(--p-muted)]">{body}</p>}
    </div>
  );
}
