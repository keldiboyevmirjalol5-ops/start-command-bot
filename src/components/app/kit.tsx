import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("mx-auto w-full max-w-md space-y-4 px-4 pt-4", className)}
    >
      {children}
    </motion.main>
  );
}

export function Hero({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("relative overflow-hidden rounded-3xl bg-brand-gradient p-5 text-primary-foreground shadow-card", className)}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary-foreground/10" />
      <div className="pointer-events-none absolute -bottom-14 right-10 h-28 w-28 rounded-full bg-primary-foreground/10" />
      <div className="relative">{children}</div>
    </section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-3xl bg-card p-4 text-card-foreground shadow-card", className)}>{children}</section>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-base font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function Stat({ icon, label, value, hint, tone = "brand" }: { icon: ReactNode; label: string; value: ReactNode; hint?: string; tone?: "brand" | "success" | "warning" | "accent" }) {
  const toneCls = {
    brand: "bg-secondary text-secondary-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/25 text-warning-foreground",
    accent: "bg-accent text-accent-foreground",
  }[tone];
  return (
    <div className="rounded-3xl bg-card p-4 shadow-card">
      <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-2xl [&_svg]:size-5", toneCls)}>{icon}</div>
      <div className="font-display text-xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground [&_svg]:size-6">{icon}</div>
      <div className="font-semibold">{title}</div>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <motion.div className="h-full rounded-full bg-brand-gradient" initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.6 }} />
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex rounded-2xl bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-xl py-2 text-sm font-semibold transition-colors",
            value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  return (
    <span className={cn("inline-flex", size === "md" ? "text-lg" : "text-sm")} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "text-warning" : "text-muted-foreground/30"}>★</span>
      ))}
    </span>
  );
}

export function AvatarCircle({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-display font-bold text-secondary-foreground", className)}>
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials}
    </div>
  );
}

export function NativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn("h-11 w-full rounded-2xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring", props.className)}
    />
  );
}

export const fieldCls = "h-11 rounded-2xl bg-card";
