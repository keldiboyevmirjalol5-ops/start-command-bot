import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type WebApp = {
  initData: string;
  initDataUnsafe?: { user?: { first_name?: string; photo_url?: string } };
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  openLink?: (url: string) => void;
  openTelegramLink?: (url: string) => void;
  HapticFeedback?: { impactOccurred: (s: "light" | "medium") => void; notificationOccurred: (t: "success" | "error") => void };
};

type Ctx = { ready: boolean; initData: string; webApp: WebApp | null };

const TelegramCtx = createContext<Ctx>({ ready: false, initData: "", webApp: null });

function getWebApp(): WebApp | null {
  return (window as unknown as { Telegram?: { WebApp?: WebApp } }).Telegram?.WebApp ?? null;
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ ready: false, initData: "", webApp: null });
  useEffect(() => {
    const wa = getWebApp();
    if (wa) {
      try {
        wa.ready();
        wa.expand();
        wa.setHeaderColor?.("#f4f2f9");
        wa.setBackgroundColor?.("#f4f2f9");
      } catch {
        /* older clients */
      }
    }
    setState({ ready: true, initData: wa?.initData ?? "", webApp: wa });
  }, []);
  return <TelegramCtx.Provider value={state}>{children}</TelegramCtx.Provider>;
}

export function useTelegram() {
  return useContext(TelegramCtx);
}

export function openExternal(webApp: WebApp | null, url: string) {
  if (webApp && url.startsWith("https://t.me/") && webApp.openTelegramLink) return webApp.openTelegramLink(url);
  if (webApp?.openLink) return webApp.openLink(url);
  window.open(url, "_blank", "noopener");
}

export function haptic(webApp: WebApp | null, kind: "success" | "error" | "light" = "light") {
  try {
    if (kind === "light") webApp?.HapticFeedback?.impactOccurred("light");
    else webApp?.HapticFeedback?.notificationOccurred(kind);
  } catch {
    /* ignore */
  }
}
