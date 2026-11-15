import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, Flame, Percent } from "lucide-react";
import { useDash } from "@/hooks/use-dashboard";
import { Card, Empty, Hero, Page, SectionTitle, Stat } from "@/components/app/kit";
import { attendanceRate, attendanceStreak } from "@/lib/stats";
import { UZ_MONTHS, UZ_WEEKDAYS_SHORT, formatUz } from "@/lib/dates";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_tabs/davomat")({
  head: () => pageHead("Davomat", "Davomat kalendari, foizi, ketma-ket qatnashish va tarix."),
  component: DavomatPage,
});

const STATUS = {
  present: { label: "Keldi", cls: "bg-success text-success-foreground", dot: "bg-success" },
  late: { label: "Kechikdi", cls: "bg-warning text-warning-foreground", dot: "bg-warning" },
  absent: { label: "Kelmadi", cls: "bg-destructive text-destructive-foreground", dot: "bg-destructive" },
} as const;

function DavomatPage() {
  const d = useDash();
  const [ym, setYm] = useState(() => d.today.slice(0, 7));
  const byDate = useMemo(() => new Map(d.attendance.map((a) => [a.att_date, a.status as keyof typeof STATUS])), [d.attendance]);
  const pct = attendanceRate(d.attendance);
  const streak = attendanceStreak(d.attendance);
  const todayStatus = byDate.get(d.today);

  const [y, m] = ym.split("-").map(Number) as [number, number];
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`)];
  const shift = (delta: number) => {
    const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
    setYm(dt.toISOString().slice(0, 7));
  };
  const monthRows = d.attendance.filter((a) => a.att_date.startsWith(ym));

  return (
    <Page>
      <Hero>
        <p className="text-sm opacity-85">Bugungi holat</p>
        <h1 className="font-display text-2xl font-bold">
          {todayStatus ? `${STATUS[todayStatus].label} ${todayStatus === "present" ? "✅" : todayStatus === "late" ? "⏰" : "❌"}` : "Belgilanmagan"}
        </h1>
        <p className="mt-1 text-xs opacity-85">{formatUz(d.today)}</p>
      </Hero>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Percent />} label="Davomat" value={`${pct}%`} tone="success" />
        <Stat icon={<Flame />} label="Ketma-ket" value={streak} tone="warning" />
        <Stat icon={<CalendarCheck />} label="Jami dars" value={d.attendance.length} />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} className="rounded-xl p-2 hover:bg-muted" aria-label="Oldingi oy"><ChevronLeft className="size-5" /></button>
          <h2 className="font-display text-base font-bold">{UZ_MONTHS[m - 1]} {y}</h2>
          <button type="button" onClick={() => shift(1)} className="rounded-xl p-2 hover:bg-muted" aria-label="Keyingi oy"><ChevronRight className="size-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {UZ_WEEKDAYS_SHORT.map((w) => (
            <div key={w} className="text-[11px] font-semibold text-muted-foreground">{w}</div>
          ))}
          {cells.map((c, i) => {
            if (!c) return <div key={`e${i}`} />;
            const st = byDate.get(c);
            return (
              <div
                key={c}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl text-xs font-semibold",
                  st ? STATUS[st].cls : "bg-muted text-muted-foreground",
                  c === d.today && "ring-2 ring-primary ring-offset-1 ring-offset-card",
                )}
              >
                {Number(c.slice(8))}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-center gap-4 text-[11px] text-muted-foreground">
          {Object.values(STATUS).map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5"><span className={cn("h-2.5 w-2.5 rounded-full", s.dot)} />{s.label}</span>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Davomat tarixi</SectionTitle>
        {d.attendance.length === 0 ? (
          <Empty icon={<Clock />} title="Hali davomat yo'q" text="O'qituvchi davomatni belgilagach, shu yerda ko'rinadi." />
        ) : (
          <ul className="space-y-2">
            {(monthRows.length ? monthRows : d.attendance.slice(0, 20)).map((a) => {
              const s = STATUS[a.status as keyof typeof STATUS];
              return (
                <li key={a.att_date} className="flex items-center justify-between rounded-2xl bg-muted px-3 py-2.5 text-sm">
                  <span>{formatUz(a.att_date)}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", s?.cls)}>{s?.label ?? a.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Page>
  );
}
