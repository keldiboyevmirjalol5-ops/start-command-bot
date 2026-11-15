import { describe, expect, it } from "vitest";
import { dataCheckString, verifyInitData } from "./tg-init-data";

const BOT_ID = 8016808590;

async function makeSigned(fields: Record<string, string>) {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  const hex = Array.from(raw, (b) => b.toString(16).padStart(2, "0")).join("");
  const params = new URLSearchParams(fields);
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "Ed25519" }, kp.privateKey, new TextEncoder().encode(dataCheckString(params, BOT_ID))),
  );
  const b64 = btoa(String.fromCharCode(...sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  params.set("signature", b64);
  params.set("hash", "ignored");
  return { initData: params.toString(), hex };
}

describe("Telegram init data", () => {
  const now = 1_800_000_000;
  const user = JSON.stringify({ id: 42, first_name: "Ali" });

  it("accepts a correctly signed payload", async () => {
    const { initData, hex } = await makeSigned({ auth_date: String(now - 10), user });
    const u = await verifyInitData(initData, BOT_ID, { publicKeyHex: hex, now });
    expect(u.id).toBe(42);
  });

  it("rejects a tampered user", async () => {
    const { initData, hex } = await makeSigned({ auth_date: String(now - 10), user });
    const tampered = initData.replace("42", "43");
    await expect(verifyInitData(tampered, BOT_ID, { publicKeyHex: hex, now })).rejects.toThrow();
  });

  it("rejects data older than 24 hours", async () => {
    const { initData, hex } = await makeSigned({ auth_date: String(now - 90_000), user });
    await expect(verifyInitData(initData, BOT_ID, { publicKeyHex: hex, now })).rejects.toThrow("expired");
  });

  it("rejects a signature for another bot", async () => {
    const { initData, hex } = await makeSigned({ auth_date: String(now - 10), user });
    await expect(verifyInitData(initData, 123, { publicKeyHex: hex, now })).rejects.toThrow();
  });
});
