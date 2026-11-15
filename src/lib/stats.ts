// Pure statistics helpers used by the Mini App. Everything is derived from real rows.
import { addDays, monthStart, weekStart } from "./dates";

export type ScoreRow = { points: number; answers_total: number; answers_correct: number; scored_on: string };
export type AttRow = { att_date: string; status: string };

export type Period = "day" | "week" | "month";

export function periodStart(period: Period, today: string): string {
  return period === "day" ? today : period === "week" ? weekStart(today) : monthStart(today);
}

export function sumScores(rows: ScoreRow[], from: string, to: string) {
  let points = 0, answers = 0, correct = 0, entries = 0;
  for (const r of rows) {
    if (r.scored_on < from || r.scored_on > to) continue;
    points += r.points;
    answers += r.answers_total;
    correct += r.answers_correct;
    entries++;
  }
  return { points, answers, correct, entries, accuracy: answers ? Math.round((correct / answers) * 100) : 0 };
}

/** Points per day for the last `days` days ending today (oldest first). */
export function dailySeries(rows: ScoreRow[], today: string, days: number) {
  const map = new Map<string, { points: number; answers: number; correct: number }>();
  for (const r of rows) {
    const m = map.get(r.scored_on) ?? { points: 0, answers: 0, correct: 0 };
    m.points += r.points;
    m.answers += r.answers_total;
    m.correct += r.answers_correct;
    map.set(r.scored_on, m);
  }
  const out: { date: string; points: number; answers: number; accuracy: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const m = map.get(d);
    out.push({ date: d, points: m?.points ?? 0, answers: m?.answers ?? 0, accuracy: m?.answers ? Math.round((m.correct / m.answers) * 100) : 0 });
  }
  return out;
}

/** Share of recorded days the student attended (present or late). */
export function attendanceRate(rows: AttRow[]): number {
  if (!rows.length) return 0;
  const attended = rows.filter((r) => r.status === "present" || r.status === "late").length;
  return Math.round((attended / rows.length) * 100);
}

/** Consecutive attended lesson records, counting back from the most recent record. */
export function attendanceStreak(rows: AttRow[]): number {
  const sorted = [...rows].sort((a, b) => (a.att_date < b.att_date ? 1 : -1));
  let n = 0;
  for (const r of sorted) {
    if (r.status === "absent") break;
    n++;
  }
  return n;
}

export function averageRating(ratings: { rating: number }[]): number {
  if (!ratings.length) return 0;
  return Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10;
}

export type Badge = { id: string; icon: string; title: string; desc: string; earned: boolean };

export function badges(input: {
  totalPoints: number;
  totalAnswers: number;
  accuracy: number;
  streak: number;
  certificates: number;
  topRating: boolean;
  weeklyGoalReached: boolean;
}): Badge[] {
  return [
    { id: "first", icon: "🌱", title: "Ilk qadam", desc: "Birinchi ball", earned: input.totalPoints > 0 },
    { id: "p100", icon: "💯", title: "100 ball", desc: "Jami 100 ball", earned: input.totalPoints >= 100 },
    { id: "p500", icon: "🚀", title: "500 ball", desc: "Jami 500 ball", earned: input.totalPoints >= 500 },
    { id: "a100", icon: "🧠", title: "100 javob", desc: "100 ta savolga javob", earned: input.totalAnswers >= 100 },
    { id: "acc", icon: "🎯", title: "Mergan", desc: "80%+ aniqlik (50+ javob)", earned: input.totalAnswers >= 50 && input.accuracy >= 80 },
    { id: "streak", icon: "🔥", title: "Intizomli", desc: "5 dars ketma-ket", earned: input.streak >= 5 },
    { id: "goal", icon: "🏁", title: "Maqsadga yetdi", desc: "Haftalik maqsad bajarildi", earned: input.weeklyGoalReached },
    { id: "five", icon: "⭐", title: "A'lochi", desc: "5 baho olgan", earned: input.topRating },
    { id: "cert", icon: "🎓", title: "Sertifikat", desc: "Sertifikat olgan", earned: input.certificates > 0 },
  ];
}
