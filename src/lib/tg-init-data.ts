// Verifies Telegram Mini App init data with Telegram's Ed25519 signature
// (third-party validation), which needs only the bot id, not the bot token.
// https://core.telegram.org/bots/webapps#validating-data-for-third-party-use

export const TELEGRAM_PUBLIC_KEY_HEX =
  "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d";

export type InitUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function dataCheckString(params: URLSearchParams, botId: number): string {
  const pairs: string[] = [];
  params.forEach((v, k) => {
    if (k !== "hash" && k !== "signature") pairs.push(`${k}=${v}`);
  });
  pairs.sort();
  return `${botId}:WebAppData\n${pairs.join("\n")}`;
}

export async function verifyInitData(
  initData: string,
  botId: number,
  opts: { publicKeyHex?: string; maxAgeSec?: number; now?: number } = {},
): Promise<InitUser> {
  const params = new URLSearchParams(initData);
  const signature = params.get("signature");
  if (!signature) throw new Error("signature missing");

  const authDate = Number(params.get("auth_date"));
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const maxAge = opts.maxAgeSec ?? 60 * 60 * 24;
  if (!authDate || now - authDate > maxAge) throw new Error("init data expired");

  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(opts.publicKeyHex ?? TELEGRAM_PUBLIC_KEY_HEX),
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    { name: "Ed25519" },
    key,
    b64urlToBytes(signature),
    new TextEncoder().encode(dataCheckString(params, botId)),
  );
  if (!ok) throw new Error("bad signature");

  const user = JSON.parse(params.get("user") ?? "null") as InitUser | null;
  if (!user?.id) throw new Error("user missing");
  return user;
}
