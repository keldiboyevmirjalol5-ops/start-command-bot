import type { ReactNode } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOT_LINK, BOT_USERNAME } from "@/lib/config";
import { openExternal, useTelegram } from "@/hooks/use-telegram";

export function CenterScreen({ icon, title, text, children }: { icon: ReactNode; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-gradient text-3xl text-primary-foreground">{icon}</div>
        <h1 className="font-display text-xl font-bold">{title}</h1>
        {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
        {children && <div className="mt-6 space-y-2">{children}</div>}
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

export function OpenInTelegram() {
  return (
    <CenterScreen icon="📱" title="Telegram orqali oching" text={`Bu ilova Telegram ichida ishlaydi. @${BOT_USERNAME} botiga kiring va "Ilovani ochish" tugmasini bosing.`}>
      <Button variant="brand" size="lg" className="w-full" asChild>
        <a href={BOT_LINK} target="_blank" rel="noreferrer">
          <Send /> Botni ochish
        </a>
      </Button>
    </CenterScreen>
  );
}

export function NotRegistered({ name }: { name: string }) {
  const { webApp } = useTelegram();
  return (
    <CenterScreen icon="📝" title={`Salom${name ? `, ${name}` : ""}!`} text="Ilovadan foydalanish uchun avval botda ro'yxatdan o'ting: /start bosing va 5 ta savolga javob bering.">
      <Button variant="brand" size="lg" className="w-full" onClick={() => openExternal(webApp, BOT_LINK)}>
        <Send /> Botga o'tish
      </Button>
    </CenterScreen>
  );
}

export function ErrorScreen({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const msg = String((error as Error)?.message ?? error);
  const unauthorized = msg.includes("UNAUTHORIZED");
  return (
    <CenterScreen
      icon="⚠️"
      title={unauthorized ? "Sessiya eskirgan" : "Ma'lumot yuklanmadi"}
      text={unauthorized ? "Ilovani yopib, botdan qayta oching." : "Internet aloqasini tekshirib, qayta urinib ko'ring."}
    >
      <Button variant="brand" size="lg" className="w-full" onClick={onRetry}>
        Qayta urinish
      </Button>
    </CenterScreen>
  );
}
