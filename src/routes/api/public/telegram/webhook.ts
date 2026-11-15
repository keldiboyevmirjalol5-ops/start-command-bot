import { createFileRoute } from "@tanstack/react-router";
import { esc, handleText, type BotUser, type Step } from "@/lib/bot/flow";
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

        const cmd = (msg.text.trim().split(/[\s@]/)[0] ?? "").toLowerCase();

        if (cmd === "/admin") {
          const { data: adm } = await supabaseAdmin.from("tg_admins").select("telegram_id").eq("telegram_id", msg.from.id).maybeSingle();
          await sendReply(
            chatId,
            adm
              ? { text: "🛠 Admin panelni ochish uchun tugmani bosing 👇", openApp: true, appPath: "admin", buttonText: "🛠 Admin panel" }
              : { text: "⛔ Bu buyruq faqat adminlar uchun." },
            appUrl,
          ).catch(() => {});
          return Response.json({ ok: true });
        }

        if (cmd === "/guruh") {
          const code = msg.text.trim().split(/\s+/)[1]?.toUpperCase();
          let text: string;
          if (!row || row.step !== "done") text = "Avval ro'yxatdan o'ting: /start";
          else if (!code) text = "Guruhga qo'shilish uchun: <code>/guruh KOD</code>\nKodni o'qituvchingizdan oling.";
          else {
            const { data: g } = await supabaseAdmin.from("groups").select("id,name").eq("join_code", code).maybeSingle();
            if (!g) text = "❌ Bunday kodli guruh topilmadi.";
            else {
              await supabaseAdmin.from("tg_users").update({ group_id: g.id }).eq("telegram_id", msg.from.id);
              text = `✅ Siz <b>${esc(g.name)}</b> guruhiga qo'shildingiz!`;
            }
          }
          await sendReply(chatId, { text }, appUrl).catch(() => {});
          return Response.json({ ok: true });
        }

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
