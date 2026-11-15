import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const auth = z.object({ initData: z.string().min(10).max(8192) });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const uuid = z.string().uuid();
const tid = z.number().int();

export const adminGetAll = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./auth.server");
    const { todayISO, addDays } = await import("@/lib/dates");
    const { db } = await requireAdmin(data.initData);
    const today = todayISO();

    const [users, groups, teachers, channels, lessons, scores, attendance, ratings, certs, notifs] = await Promise.all([
      db.from("tg_users").select("telegram_id,username,full_name,region,district,role,goal,step,group_id,registered_at,created_at").order("created_at", { ascending: false }),
      db.from("groups").select("id,name,description,join_code,teacher_id,created_at").order("created_at", { ascending: false }),
      db.from("teachers").select("id,full_name,subject,telegram_username").order("full_name"),
      db.from("channels").select("id,title,url,description").order("created_at"),
      db.from("lessons").select("id,group_id,title,description,lesson_date").order("lesson_date", { ascending: false }).limit(500),
      db.from("scores").select("id,telegram_id,lesson_id,points,answers_total,answers_correct,note,scored_on").order("created_at", { ascending: false }).limit(1000),
      db.from("attendance").select("telegram_id,att_date,status").gte("att_date", addDays(today, -90)),
      db.from("ratings").select("telegram_id,lesson_id,rating,comment"),
      db.from("certificates").select("id,telegram_id,title,score,issued_on").order("issued_on", { ascending: false }),
      db.from("notifications").select("id,text,group_id,sent_count,created_at").order("created_at", { ascending: false }).limit(50),
    ]);

    return {
      today,
      users: users.data ?? [],
      groups: groups.data ?? [],
      teachers: teachers.data ?? [],
      channels: channels.data ?? [],
      lessons: lessons.data ?? [],
      scores: scores.data ?? [],
      attendance: attendance.data ?? [],
      ratings: ratings.data ?? [],
      certificates: certs.data ?? [],
      notifications: notifs.data ?? [],
    };
  });

export type AdminData = Awaited<ReturnType<typeof adminGetAll>>;

const action = z.discriminatedUnion("type", [
  z.object({ type: z.literal("group.create"), name: z.string().trim().min(2).max(80), description: z.string().max(300).optional(), teacher_id: uuid.nullable().optional() }),
  z.object({ type: z.literal("group.update"), id: uuid, name: z.string().trim().min(2).max(80), description: z.string().max(300).optional(), teacher_id: uuid.nullable().optional() }),
  z.object({ type: z.literal("group.delete"), id: uuid }),
  z.object({ type: z.literal("teacher.create"), full_name: z.string().trim().min(3).max(80), subject: z.string().max(80).optional(), telegram_username: z.string().max(40).optional() }),
  z.object({ type: z.literal("teacher.delete"), id: uuid }),
  z.object({ type: z.literal("channel.create"), title: z.string().trim().min(2).max(80), url: z.string().url().max(300), description: z.string().max(300).optional() }),
  z.object({ type: z.literal("channel.delete"), id: uuid }),
  z.object({ type: z.literal("lesson.create"), group_id: uuid, title: z.string().trim().min(2).max(120), description: z.string().max(500).optional(), lesson_date: isoDate }),
  z.object({ type: z.literal("lesson.delete"), id: uuid }),
  z.object({ type: z.literal("student.setGroup"), telegram_id: tid, group_id: uuid.nullable() }),
  z.object({ type: z.literal("attendance.set"), att_date: isoDate, entries: z.array(z.object({ telegram_id: tid, status: z.enum(["present", "late", "absent"]).nullable() })).max(500) }),
  z.object({ type: z.literal("score.add"), telegram_id: tid, points: z.number().int().min(-1000).max(1000), answers_total: z.number().int().min(0).max(1000), answers_correct: z.number().int().min(0).max(1000), lesson_id: uuid.nullable().optional(), note: z.string().max(200).optional(), scored_on: isoDate }),
  z.object({ type: z.literal("score.delete"), id: uuid }),
  z.object({ type: z.literal("rating.set"), telegram_id: tid, lesson_id: uuid, rating: z.number().int().min(1).max(5), comment: z.string().max(300).optional() }),
  z.object({ type: z.literal("certificate.create"), telegram_id: tid, title: z.string().trim().min(2).max(120), score: z.string().max(40).optional(), issued_on: isoDate }),
  z.object({ type: z.literal("certificate.delete"), id: uuid }),
  z.object({ type: z.literal("notify"), text: z.string().trim().min(1).max(3500), group_id: uuid.nullable() }),
]);

export type AdminAction = z.infer<typeof action>;

function code6() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

export const adminAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.extend({ action }).parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin, notifyUser } = await import("./auth.server");
    const { esc } = await import("@/lib/bot/flow");
    const { db } = await requireAdmin(data.initData);
    const a = data.action;
    const must = (r: { error: { message: string } | null }) => {
      if (r.error) throw new Error(r.error.message);
    };

    switch (a.type) {
      case "group.create":
        must(await db.from("groups").insert({ name: a.name, description: a.description || null, teacher_id: a.teacher_id ?? null, join_code: code6() }));
        break;
      case "group.update":
        must(await db.from("groups").update({ name: a.name, description: a.description || null, teacher_id: a.teacher_id ?? null }).eq("id", a.id));
        break;
      case "group.delete":
        must(await db.from("groups").delete().eq("id", a.id));
        break;
      case "teacher.create":
        must(await db.from("teachers").insert({ full_name: a.full_name, subject: a.subject || null, telegram_username: a.telegram_username?.replace(/^@/, "") || null }));
        break;
      case "teacher.delete":
        must(await db.from("teachers").delete().eq("id", a.id));
        break;
      case "channel.create":
        must(await db.from("channels").insert({ title: a.title, url: a.url, description: a.description || null }));
        break;
      case "channel.delete":
        must(await db.from("channels").delete().eq("id", a.id));
        break;
      case "lesson.create":
        must(await db.from("lessons").insert({ group_id: a.group_id, title: a.title, description: a.description || null, lesson_date: a.lesson_date }));
        break;
      case "lesson.delete":
        must(await db.from("lessons").delete().eq("id", a.id));
        break;
      case "student.setGroup":
        must(await db.from("tg_users").update({ group_id: a.group_id }).eq("telegram_id", a.telegram_id));
        break;
      case "attendance.set": {
        const set = a.entries.filter((e) => e.status).map((e) => ({ telegram_id: e.telegram_id, att_date: a.att_date, status: e.status as string }));
        const clear = a.entries.filter((e) => !e.status).map((e) => e.telegram_id);
        if (set.length) must(await db.from("attendance").upsert(set, { onConflict: "telegram_id,att_date" }));
        if (clear.length) must(await db.from("attendance").delete().eq("att_date", a.att_date).in("telegram_id", clear));
        break;
      }
      case "score.add": {
        must(await db.from("scores").insert({ telegram_id: a.telegram_id, points: a.points, answers_total: a.answers_total, answers_correct: Math.min(a.answers_correct, a.answers_total), lesson_id: a.lesson_id ?? null, note: a.note || null, scored_on: a.scored_on }));
        const { data: u } = await db.from("tg_users").select("chat_id").eq("telegram_id", a.telegram_id).maybeSingle();
        if (u) await notifyUser(u.chat_id, `✅ Sizga <b>${a.points > 0 ? "+" : ""}${a.points} ball</b> qo'shildi.${a.note ? `\n📝 ${esc(a.note)}` : ""}`);
        break;
      }
      case "score.delete":
        must(await db.from("scores").delete().eq("id", a.id));
        break;
      case "rating.set":
        must(await db.from("ratings").upsert({ telegram_id: a.telegram_id, lesson_id: a.lesson_id, rating: a.rating, comment: a.comment || null }, { onConflict: "telegram_id,lesson_id" }));
        break;
      case "certificate.create": {
        must(await db.from("certificates").insert({ telegram_id: a.telegram_id, title: a.title, score: a.score || null, issued_on: a.issued_on }));
        const { data: u } = await db.from("tg_users").select("chat_id").eq("telegram_id", a.telegram_id).maybeSingle();
        if (u) await notifyUser(u.chat_id, `🎓 Tabriklaymiz! Sizga <b>${esc(a.title)}</b> sertifikati berildi.`);
        break;
      }
      case "certificate.delete":
        must(await db.from("certificates").delete().eq("id", a.id));
        break;
      case "notify": {
        let q = db.from("tg_users").select("chat_id").eq("step", "done");
        if (a.group_id) q = q.eq("group_id", a.group_id);
        const { data: targets } = await q;
        let sent = 0;
        for (const t of targets ?? []) if (await notifyUser(t.chat_id, `🔔 ${esc(a.text)}`)) sent++;
        must(await db.from("notifications").insert({ text: a.text, group_id: a.group_id, sent_count: sent }));
        return { ok: true, sent, total: targets?.length ?? 0 };
      }
    }
    return { ok: true };
  });
