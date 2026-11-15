import { createFileRoute } from "@tanstack/react-router";
import { handleText, type BotUser, type Step } from "@/lib/bot/flow";
import { safeEqual, sendReply, webhookSecret } from "@/lib/bot/telegram.server";

type TgMessage = {
  chat?: { id: number; type?: string };
  from?: { id: number; username?: string; first_name?: string };
  text?: string;
};

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(actual, webhookSecret())) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = (await request.json()) as { update_id?: number; message?: TgMessage };
        const msg = update.message;
        if (typeof update.update_id !== "number" || !msg?.chat?.id || !msg.from?.id) {
          return Response.json({ ok: true, ignored: true });
        }
        if (msg.chat.type && msg.chat.type !== "private") {
          return Response.json({ ok: true, ignored: true });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Telegram retries deliveries: process each update only once.
        const { error: dupErr } = await supabaseAdmin
          .from("tg_processed_updates")
          .insert({ update_id: update.update_id });
        if (dupErr) {
          if (dupErr.code === "23505") return Response.json({ ok: true, duplicate: true });
          console.error("dedupe insert failed", dupErr);
          return Response.json({ error: dupErr.message }, { status: 500 });
        }

        const chatId = msg.chat.id;
        const appUrl = `${new URL(request.url).origin}/`;

        if (typeof msg.text !== "string") {
          await sendReply(chatId, { text: "Iltimos, matn yuboring yoki tugmalardan foydalaning." }, appUrl).catch(() => {});
          return Response.json({ ok: true });
        }

        const { data: row } = await supabaseAdmin
          .from("tg_users")
          .select("*")
          .eq("telegram_id", msg.from.id)
          .maybeSingle();

        const user: BotUser | null = row
          ? {
              step: row.step as Step,
              full_name: row.full_name,
              region: row.region,
              district: row.district,
              role: row.role,
              goal: row.goal,
            }
          : null;

        const { patch, replies } = handleText(user, msg.text);
        const { registered, ...fields } = patch;

        const { error: upErr } = await supabaseAdmin.from("tg_users").upsert(
          {
            telegram_id: msg.from.id,
            chat_id: chatId,
            username: msg.from.username ?? null,
            tg_first_name: msg.from.first_name ?? null,
            ...(row ? {} : { step: "full_name" }),
            ...fields,
            ...(registered === true ? { registered_at: new Date().toISOString() } : {}),
            ...(registered === false ? { registered_at: null } : {}),
          },
          { onConflict: "telegram_id" },
        );
        if (upErr) {
          console.error("user upsert failed", upErr);
          return Response.json({ error: upErr.message }, { status: 500 });
        }

        try {
          for (const r of replies) await sendReply(chatId, r, appUrl);
        } catch (e) {
          // Already logged; acknowledge so Telegram does not retry an update we already processed.
          return Response.json({ ok: false, error: String(e) });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
