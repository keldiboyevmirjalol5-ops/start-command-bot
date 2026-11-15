import { verifyInitData, type InitUser } from "@/lib/tg-init-data";
import { tg } from "@/lib/bot/telegram.server";

let botIdPromise: Promise<number> | null = null;

export function getBotId(): Promise<number> {
  if (!botIdPromise) {
    botIdPromise = tg("getMe", {}).then((r: { result: { id: number } }) => r.result.id);
    botIdPromise.catch(() => {
      botIdPromise = null;
    });
  }
  return botIdPromise;
}

export async function authenticate(initData: string) {
  let tgUser: InitUser;
  try {
    tgUser = await verifyInitData(initData, await getBotId());
  } catch (e) {
    console.warn("init data rejected:", String(e));
    throw new Error("UNAUTHORIZED");
  }
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const [{ data: me }, { data: adm }] = await Promise.all([
    db.from("tg_users").select("*").eq("telegram_id", tgUser.id).maybeSingle(),
    db.from("tg_admins").select("telegram_id").eq("telegram_id", tgUser.id).maybeSingle(),
  ]);
  return { tgUser, me, isAdmin: !!adm, db };
}

export async function requireAdmin(initData: string) {
  const ctx = await authenticate(initData);
  if (!ctx.isAdmin) throw new Error("FORBIDDEN");
  return ctx;
}

export async function notifyUser(chatId: number, text: string) {
  try {
    await tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
    return true;
  } catch {
    return false;
  }
}
