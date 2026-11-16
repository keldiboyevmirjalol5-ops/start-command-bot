import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTelegram } from "@/hooks/use-telegram";
import { useAdminQuery } from "@/components/admin/useAdmin";
import { CenterScreen, ErrorScreen, LoadingScreen, OpenInTelegram } from "@/components/app/Screens";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { ChannelsSection, GroupsSection, OverviewSection, StudentsSection, TeachersSection } from "@/components/admin/sections-people";
import { AttendanceSection, CertificatesSection, LessonsSection, NotifySection, RatingsSection, ScoresSection } from "@/components/admin/sections-study";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => pageHead("Admin panel", "O'quvchilar, guruhlar, darslar, davomat, ball va xabarnomalarni boshqarish."),
  component: AdminPage,
});

const SECTIONS = [
  { id: "stats", label: "📊 Statistika", C: OverviewSection },
  { id: "students", label: "👥 O'quvchilar", C: StudentsSection },
  { id: "groups", label: "🏫 Guruhlar", C: GroupsSection },
  { id: "teachers", label: "👨‍🏫 O'qituvchilar", C: TeachersSection },
  { id: "lessons", label: "📚 Darslar", C: LessonsSection },
  { id: "attendance", label: "📅 Davomat", C: AttendanceSection },
  { id: "scores", label: "🏆 Ball", C: ScoresSection },
  { id: "ratings", label: "⭐ Baholash", C: RatingsSection },
  { id: "certs", label: "🎓 Sertifikatlar", C: CertificatesSection },
  { id: "notify", label: "🔔 Xabarnoma", C: NotifySection },
  { id: "channels", label: "📢 Kanallar", C: ChannelsSection },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function AdminPage() {
  const { ready, initData } = useTelegram();
  const q = useAdminQuery();
  const [tab, setTab] = useState<SectionId>("stats");

  if (!ready) return <LoadingScreen />;
  if (!initData) return <OpenInTelegram />;
  if (q.isPending) return <LoadingScreen />;
  if (q.isError) {
    if (String(q.error?.message).includes("FORBIDDEN")) {
      return (
        <CenterScreen icon="⛔" title="Ruxsat yo'q" text="Admin panel faqat adminlar uchun.">
          <Button variant="brand" size="lg" className="w-full" asChild>
            <Link to="/">Ilovaga qaytish</Link>
          </Button>
        </CenterScreen>
      );
    }
    return <ErrorScreen error={q.error} onRetry={() => q.refetch()} />;
  }

  const Active = SECTIONS.find((s) => s.id === tab)!.C;

  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 pt-3">
          <Button variant="ghost" size="icon" asChild aria-label="Ilovaga qaytish">
            <Link to="/"><ArrowLeft /></Link>
          </Button>
          <h1 className="font-display text-lg font-bold">Admin panel</h1>
        </div>
        <nav className="mx-auto max-w-2xl overflow-x-auto px-4 py-3">
          <div className="flex w-max gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTab(s.id)}
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                  tab === s.id ? "bg-brand-gradient text-primary-foreground shadow-card" : "bg-card text-muted-foreground shadow-sm",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        <Active />
      </main>
    </div>
  );
}
