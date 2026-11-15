import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ta'lim Mini App — Bosh sahifa" },
      { name: "description", content: "Telegram bot orqali ro'yxatdan o'ting va o'quv natijalaringizni kuzating." },
      { property: "og:title", content: "Ta'lim Mini App" },
      { property: "og:description", content: "Telegram bot orqali ro'yxatdan o'ting va o'quv natijalaringizni kuzating." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type TgUser = { first_name?: string; last_name?: string; username?: string };

function useTelegramUser() {
  const [user, setUser] = useState<TgUser | null>(null);
  useEffect(() => {
    const wa = (window as unknown as { Telegram?: { WebApp?: { ready: () => void; expand: () => void; initDataUnsafe?: { user?: TgUser } } } }).Telegram?.WebApp;
    if (!wa) return;
    wa.ready();
    wa.expand();
    setUser(wa.initDataUnsafe?.user ?? null);
  }, []);
  return user;
}

function Index() {
  const user = useTelegramUser();
  const name = user?.first_name ?? "o'quvchi";

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-10 pt-8">
      <section className="bg-brand-gradient shadow-card rounded-3xl p-6 text-primary-foreground">
        <p className="text-sm opacity-80">Assalomu alaykum 👋</p>
        <h1 className="mt-1 font-display text-2xl font-bold">{name}</h1>
        <p className="mt-3 text-sm opacity-90">
          Ro'yxatdan o'tganingiz uchun rahmat! Natijalaringiz, davomat va baholar shu yerda paydo bo'ladi.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        {[
          { icon: "📊", title: "Natijam" },
          { icon: "📈", title: "Statistika" },
          { icon: "⭐", title: "Baholash" },
          { icon: "📅", title: "Davomat" },
        ].map((c) => (
          <div key={c.title} className="shadow-card rounded-2xl bg-card p-4">
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-2 font-semibold text-card-foreground">{c.title}</div>
            <div className="text-xs text-muted-foreground">Tez kunda</div>
          </div>
        ))}
      </section>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Botda ma'lumotlarni o'zgartirish uchun /qayta buyrug'ini yuboring.
      </p>
    </main>
  );
}
