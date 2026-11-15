import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Bell, CalendarCheck, Flame, Medal, Star, Target, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useDash } from "@/hooks/use-dashboard";
import { AvatarCircle, Card, Empty, Hero, Page, Progress, SectionTitle, Stat } from "@/components/app/kit";
import { CertificateCard } from "@/components/app/CertificateCard";
import { attendanceRate, attendanceStreak, averageRating, badges, sumScores } from "@/lib/stats";
import { weekStart } from "@/lib/dates";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_tabs/")({
  head: () => pageHead("Natijam", "Bugungi natijalar, haftalik maqsad, yutuqlar va sertifikatlar."),
  component: NatijamPage,
});

function greeting() {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tashkent" }));
  if (h < 5) return "Xayrli tun";
  if (h < 12) return "Xayrli tong";
  if (h < 18) return "Xayrli kun";
  return "Xayrli kech";
}

function NatijamPage() {
  const d = useDash();
  const firstName = d.me.full_name.split(" ")[0] || d.me.full_name;
  const all = sumScores(d.scores, "0000-01-01", "9999-12-31");
  const today = sumScores(d.scores, d.today, d.today);
  const week = sumScores(d.scores, weekStart(d.today), d.today);
  const weekPct = d.me.weekly_goal ? Math.round((week.points / d.me.weekly_goal) * 100) : 0;
  const attPct = attendanceRate(d.attendance);
  const streak = attendanceStreak(d.attendance);
  const avg = averageRating(d.ratings);
  const rank = d.ranking.group ?? d.ranking.global;
  const list = badges({
    totalPoints: all.points,
    totalAnswers: all.answers,
    accuracy: all.accuracy,
    streak,
    certificates: d.certificates.length,
    topRating: d.ratings.some((r) => r.rating === 5),
    weeklyGoalReached: week.points >= d.me.weekly_goal,
  });
  const earned = list.filter((b) => b.earned).length;

  return (
    <Page>
      <Hero>
        <div className="flex items-center gap-3">
          <AvatarCircle src={d.me.avatar} name={d.me.full_name} className="h-14 w-14 border-2 border-primary-foreground/40 text-lg" />
          <div className="min-w-0">
            <p className="text-sm opacity-85">{greeting()} 👋</p>
            <h1 className="truncate font-display text-xl font-bold">{firstName}</h1>
            <p className="truncate text-xs opacity-85">
              {d.me.role.replace(/^\S+\s/, "")} · {d.group?.name ?? "Guruhsiz"} · {d.me.region}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { v: today.points, l: "Bugun ball" },
            { v: today.answers, l: "Bugun javob" },
            { v: `#${rank.rank}`, l: d.ranking.group ? "Guruhda" : "Umumiy" },
          ].map((x) => (
            <div key={x.l} className="rounded-2xl bg-primary-foreground/15 py-2.5">
              <div className="font-display text-lg font-bold">{x.v}</div>
              <div className="text-[11px] opacity-85">{x.l}</div>
            </div>
          ))}
        </div>
      </Hero>

      <Card>
        <SectionTitle action={<span className="text-xs text-muted-foreground">{week.points} / {d.me.weekly_goal} ball</span>}>
          <span className="inline-flex items-center gap-2"><Target className="size-4 text-primary" /> Haftalik maqsad</span>
        </SectionTitle>
        <Progress value={weekPct} />
        <p className="mt-2 text-xs text-muted-foreground">
          {week.points >= d.me.weekly_goal
            ? "🎉 Bu haftalik maqsad bajarildi!"
            : `Maqsadgacha ${d.me.weekly_goal - week.points} ball qoldi (${Math.min(weekPct, 100)}%).`}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Trophy />} label="Jami ball" value={all.points} hint={`${all.answers} ta javob`} />
        <Stat icon={<CalendarCheck />} label="Davomat" value={`${attPct}%`} hint={`${streak} dars ketma-ket`} tone="success" />
        <Stat icon={<Star />} label="O'rtacha baho" value={avg || "—"} hint={`${d.ratings.length} ta baho`} tone="warning" />
        <Stat icon={<Medal />} label="Reyting" value={`#${rank.rank}`} hint={`${rank.total} kishi ichida`} tone="accent" />
      </div>

      <Card>
        <SectionTitle action={<span className="text-xs text-muted-foreground">{earned}/{list.length}</span>}>
          <span className="inline-flex items-center gap-2"><Award className="size-4 text-primary" /> Yutuqlar</span>
        </SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {list.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-2xl p-2.5 text-center ${b.earned ? "bg-secondary" : "bg-muted opacity-50 grayscale"}`}
              title={b.desc}
            >
              <div className="text-2xl">{b.icon}</div>
              <div className="mt-1 text-[11px] font-semibold leading-tight">{b.title}</div>
              <div className="text-[10px] leading-tight text-muted-foreground">{b.desc}</div>
            </motion.div>
          ))}
        </div>
      </Card>

      <div>
        <SectionTitle action={d.certificates.length > 1 ? <Link to="/profil" className="text-xs font-semibold text-primary">Hammasi</Link> : undefined}>
          Sertifikat
        </SectionTitle>
        {d.certificates[0] ? (
          <CertificateCard cert={d.certificates[0]} name={d.me.full_name} />
        ) : (
          <Empty icon={<Award />} title="Hali sertifikat yo'q" text="Natijalaringiz yaxshi bo'lsa, o'qituvchingiz sertifikat beradi." />
        )}
      </div>

      {d.notifications.length > 0 && (
        <Card>
          <SectionTitle>
            <span className="inline-flex items-center gap-2"><Bell className="size-4 text-primary" /> Xabarlar</span>
          </SectionTitle>
          <ul className="space-y-2">
            {d.notifications.map((n) => (
              <li key={n.id} className="rounded-2xl bg-muted p-3 text-sm">
                <p className="whitespace-pre-wrap">{n.text}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {streak >= 3 && (
        <div className="flex items-center gap-3 rounded-3xl bg-warning/25 p-4 text-sm text-warning-foreground">
          <Flame className="size-5" /> Ajoyib! {streak} dars ketma-ket qatnashdingiz.
        </div>
      )}
    </Page>
  );
}
