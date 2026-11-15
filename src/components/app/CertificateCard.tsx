import { Award } from "lucide-react";
import { formatUz } from "@/lib/dates";

export function CertificateCard({ cert, name }: { cert: { title: string; score: string | null; issued_on: string }; name: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-warning/60 bg-card p-5 shadow-card">
      <div className="pointer-events-none absolute inset-2 rounded-2xl border border-dashed border-warning/50" />
      <div className="relative text-center">
        <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-warning/30 text-warning-foreground">
          <Award className="size-6" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sertifikat</p>
        <h3 className="mt-1 font-display text-lg font-bold">{cert.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">Ushbu sertifikat egasi</p>
        <p className="font-display text-base font-bold text-primary">{name}</p>
        <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
          {cert.score && <span>Natija: <b className="text-foreground">{cert.score}</b></span>}
          <span>Sana: <b className="text-foreground">{formatUz(cert.issued_on)}</b></span>
        </div>
      </div>
    </div>
  );
}
