import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Row({ children, onDelete, busy }: { children: ReactNode; onDelete?: () => void; busy?: boolean }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-muted p-3">
      <div className="min-w-0 flex-1">{children}</div>
      {onDelete && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="text-destructive"
          disabled={busy}
          aria-label="O'chirish"
          onClick={() => { if (confirm("O'chirishni tasdiqlaysizmi?")) onDelete(); }}
        >
          <Trash2 />
        </Button>
      )}
    </li>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function NoItems({ text }: { text: string }) {
  return <p className="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">{text}</p>;
}
