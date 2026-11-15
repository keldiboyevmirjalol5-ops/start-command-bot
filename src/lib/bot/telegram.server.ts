// Server-only Telegram helpers. Calls go through the Lovable connector gateway.
import { createHash, timingSafeEqual } from "crypto";
import { OPEN_APP, type Reply } from "./flow";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function keys() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const tg = process.env["TELEGRAM_API_KEY"];
  if (!lovable) throw new Error("LOVABLE_API_KEY is not configured");
  if (!tg) throw new Error("TELEGRAM_API_KEY is not configured");
  return { lovable, tg };
}

export async function tg(method: string, body: Record<string, unknown>) {
  const { lovable, tg: key } = keys();
  const res = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Telegram ${method} failed [${res.status}]: ${text}`);
    throw new Error(`Telegram ${method} failed [${res.status}]: ${text}`);
  }
  return JSON.parse(text);
}

export function webhookSecret(): string {
  const { tg: key } = keys();
  return createHash("sha256").update(`telegram-webhook:${key}`).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const l = Buffer.from(a);
  const r = Buffer.from(b);
  return l.length === r.length && timingSafeEqual(l, r);
}

export async function sendReply(chatId: number, reply: Reply, appUrl: string) {
  let reply_markup: unknown = undefined;
  if (reply.openApp) {
    reply_markup = {
      inline_keyboard: [[{ text: reply.buttonText ?? OPEN_APP, web_app: { url: appUrl + (reply.appPath ?? "") } }]],
    };
  } else if (reply.keyboard) {
    reply_markup = {
      keyboard: reply.keyboard.map((row) => row.map((text) => ({ text }))),
      resize_keyboard: true,
      is_persistent: true,
    };
  } else if (reply.removeKeyboard) {
    reply_markup = { remove_keyboard: true };
  }
  await tg("sendMessage", {
    chat_id: chatId,
    text: reply.text,
    parse_mode: "HTML",
    ...(reply_markup ? { reply_markup } : {}),
  });
}
