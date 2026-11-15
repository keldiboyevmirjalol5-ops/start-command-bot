import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Star, Users } from "lucide-react";
import { useDash } from "@/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import { Card, Empty, Hero, Page, SectionTitle, Stars } from "@/components/app/kit";
import { averageRating } from "@/lib/stats";
import { formatUz } from "@/lib/dates";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_tabs/baholash")({
  head: () => pageHead("Baholash", "Darslar ro'yxati, darslar bo'yicha baholar va o'rtacha baho."),
  component: BaholashPage,
});

function BaholashPage() {
  const d = useDash();
  const avg = averageRating(d.ratings);
  const byLesson = new Map(d.ratings.map((r) => [r.lesson_id, r]));
  const lessonById = new Map(d.lessons.map((l) => [l.id, l]));
  const dist = [5, 4, 3, 2, 1].map((v) => ({ v, n: d.ratings.filter((r) => r.rating === v).length }));

  return (
    <Page>
      <Hero>
        <p className="text-sm opacity-85">O'rtacha baho</p>
        <div className="flex items-end gap-3">
          <h1 className="font-display text-4xl font-bold">{avg || "—"}</h1>
          <span className="mb-1 text-sm opacity-85">/ 5 · {d.ratings.length} ta baho</span>
        </div>
        <div className="mt-3 space-y-1">
          {dist.map(({ v, n }) => (
            <div key={v} className="flex items-center gap-2 text-xs">
              <span className="w-3">{v}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-foreground/20">
                <div className="h-full rounded-full bg-primary-foreground" style={{ width: `${d.ratings.length ? (n / d.ratings.length) * 100 : 0}%` }} />
              </div>
              <span className="w-5 text-right opacity-85">{n}</span>
            </div>
          ))}
        </div>
      </Hero>

      {!d.group ? (
        <Empty
          icon={<Users />}
          title="Siz hali guruhga qo'shilmagansiz"
          text="Darslar va baholar ko'rinishi uchun o'qituvchingiz bergan kod orqali guruhga qo'shiling."
          action={<Button variant="brand" asChild><Link to="/profil">Guruhga qo'shilish</Link></Button>}
        />
      ) : (
        <Card>
          <SectionTitle action={<span className="text-xs text-muted-foreground">{d.lessons.length} ta</span>}>Darslar</SectionTitle>
          {d.lessons.length === 0 ? (
            <Empty icon={<BookOpen />} title="Hali darslar yo'q" text="O'qituvchi dars qo'shgach, shu yerda paydo bo'ladi." />
          ) : (
            <ul className="space-y-2">
              {d.lessons.map((l) => {
                const r = byLesson.get(l.id);
                return (
                  <li key={l.id} className="flex items-center gap-3 rounded-2xl bg-muted p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"><BookOpen className="size-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{l.title}</div>
                      <div className="text-[11px] text-muted-foreground">{formatUz(l.lesson_date)}</div>
                    </div>
                    {r ? (
                      <div className="text-right"><Stars value={r.rating} /><div className="text-[11px] font-semibold">{r.rating}/5</div></div>
                    ) : (
                      <span className="rounded-full bg-card px-2.5 py-1 text-[11px] text-muted-foreground">Baholanmagan</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      <Card>
        <SectionTitle>Baholar tarixi</SectionTitle>
        {d.ratings.length === 0 ? (
          <Empty icon={<Star />} title="Hali baho yo'q" text="Darslardagi faolligingiz uchun baholar shu yerda chiqadi." />
        ) : (
          <ul className="space-y-2">
            {d.ratings.map((r) => (
              <li key={r.lesson_id} className="rounded-2xl bg-muted p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{lessonById.get(r.lesson_id)?.title ?? "Dars"}</span>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="mt-1 text-xs text-muted-foreground">💬 {r.comment}</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("uz-UZ", { timeZone: "Asia/Tashkent" })}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
