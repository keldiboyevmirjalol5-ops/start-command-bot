import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { CheckCircle2, MessageSquare, Percent, Trophy } from "lucide-react";
import { useDash } from "@/hooks/use-dashboard";
import { Card, Empty, Hero, Page, Progress, SectionTitle, Segmented, Stat } from "@/components/app/kit";
import { dailySeries, periodStart, sumScores, type Period } from "@/lib/stats";
import { UZ_WEEKDAYS_SHORT } from "@/lib/dates";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_tabs/statistika")({
  head: () => pageHead("Statistika", "Kunlik, haftalik va oylik ballar, javoblar, reyting va faollik grafigi."),
  component: StatistikaPage,
});

const PERIOD_LABEL: Record<Period, string> = { day: "Bugun", week: "Shu hafta", month: "Shu oy" };

function StatistikaPage() {
  const d = useDash();
  const [period, setPeriod] = useState<Period>("week");
  const s = sumScores(d.scores, periodStart(period, d.today), d.today);
  const series = dailySeries(d.scores, d.today, 14).map((x) => ({
    ...x,
    label: UZ_WEEKDAYS_SHORT[(new Date(`${x.date}T00:00:00Z`).getUTCDay() + 6) % 7],
  }));
  const last7 = series.slice(-7).reverse();
  const hasActivity = series.some((x) => x.points || x.answers);
  const rank = d.ranking;

  return (
    <Page>
      <Hero>
        <p className="text-sm opacity-85">Statistika</p>
        <h1 className="font-display text-2xl font-bold">{PERIOD_LABEL[period]}: {s.points} ball</h1>
        <p className="mt-1 text-xs opacity-85">{s.answers} ta javob · {s.accuracy}% aniqlik</p>
      </Hero>

      <Segmented value={period} onChange={setPeriod} options={[{ value: "day", label: "Kunlik" }, { value: "week", label: "Haftalik" }, { value: "month", label: "Oylik" }]} />

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Trophy />} label="Ball" value={s.points} />
        <Stat icon={<MessageSquare />} label="Javoblar soni" value={s.answers} tone="accent" />
        <Stat icon={<CheckCircle2 />} label="To'g'ri javoblar" value={s.correct} tone="success" />
        <Stat icon={<Percent />} label="Aniqlik" value={`${s.accuracy}%`} tone="warning" />
      </div>

      <Card>
        <SectionTitle>Reyting</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-secondary p-3 text-center">
            <div className="font-display text-2xl font-bold text-secondary-foreground">{rank.group ? `#${rank.group.rank}` : "—"}</div>
            <div className="text-xs text-muted-foreground">{rank.group ? `Guruhda (${rank.group.total})` : "Guruh yo'q"}</div>
          </div>
          <div className="rounded-2xl bg-accent p-3 text-center">
            <div className="font-display text-2xl font-bold text-accent-foreground">#{rank.global.rank}</div>
            <div className="text-xs text-muted-foreground">Umumiy ({rank.global.total})</div>
          </div>
        </div>
        {rank.leaderboard.length > 0 && (
          <ol className="mt-3 space-y-1.5">
            {rank.leaderboard.map((x, i) => (
              <li key={i} className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm ${x.isMe ? "bg-secondary font-semibold" : "bg-muted"}`}>
                <span className="w-6 text-center font-display font-bold">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                <span className="flex-1 truncate">{x.name}{x.isMe ? " (siz)" : ""}</span>
                <span className="font-semibold">{x.points}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card>
        <SectionTitle>Faollik (14 kun)</SectionTitle>
        {hasActivity ? (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip
                  cursor={{ fill: "var(--secondary)" }}
                  contentStyle={{ borderRadius: 16, border: "1px solid var(--border)", fontSize: 12 }}
                  formatter={(v: number) => [`${v} ball`, ""]}
                  labelFormatter={(_, p) => (p?.[0]?.payload as { date?: string })?.date ?? ""}
                />
                <Bar dataKey="points" fill="var(--brand)" radius={[8, 8, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty icon={<Trophy />} title="Hali faollik yo'q" text="Ball olganingizdan so'ng grafik shu yerda ko'rinadi." />
        )}
      </Card>

      <Card>
        <SectionTitle>Kunlik natija</SectionTitle>
        <ul className="space-y-2.5">
          {last7.map((x) => (
            <li key={x.date}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold">{x.date === d.today ? "Bugun" : `${x.label}, ${x.date.slice(8)}.${x.date.slice(5, 7)}`}</span>
                <span className="text-muted-foreground">{x.points} ball · {x.answers} javob · {x.accuracy}%</span>
              </div>
              <Progress value={x.accuracy} />
            </li>
          ))}
        </ul>
      </Card>
    </Page>
  );
}
