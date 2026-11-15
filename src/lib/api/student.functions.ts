import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { REGIONS } from "@/lib/bot/flow";

const auth = z.object({ initData: z.string().min(10).max(8192) });

export const getDashboard = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.parse(d))
  .handler(async ({ data }) => {
    const { authenticate } = await import("./auth.server");
    const { todayISO, addDays } = await import("@/lib/dates");
    const { tgUser, me, isAdmin, db } = await authenticate(data.initData);

    if (!me || me.step !== "done") {
      return { status: "unregistered" as const, isAdmin, firstName: tgUser.first_name ?? "" };
    }

    const today = todayISO();
    const since = addDays(today, -400);
    const gid = me.group_id;

    const [groupQ, teachersQ, channelsQ, scoresQ, attQ, lessonsQ, ratingsQ, certsQ, notifQ, allScoresQ, usersQ] =
      await Promise.all([
        gid ? db.from("groups").select("id,name,description,join_code,teacher_id").eq("id", gid).maybeSingle() : Promise.resolve({ data: null }),
        db.from("teachers").select("id,full_name,subject,telegram_username").order("full_name"),
        db.from("channels").select("id,title,url,description").order("created_at"),
        db.from("scores").select("id,points,answers_total,answers_correct,note,scored_on,lesson_id").eq("telegram_id", me.telegram_id).gte("scored_on", since).order("scored_on", { ascending: false }),
        db.from("attendance").select("att_date,status").eq("telegram_id", me.telegram_id).gte("att_date", since).order("att_date", { ascending: false }),
        gid ? db.from("lessons").select("id,title,description,lesson_date").eq("group_id", gid).order("lesson_date", { ascending: false }).limit(200) : Promise.resolve({ data: [] }),
        db.from("ratings").select("lesson_id,rating,comment,created_at").eq("telegram_id", me.telegram_id).order("created_at", { ascending: false }),
        db.from("certificates").select("id,title,score,issued_on").eq("telegram_id", me.telegram_id).order("issued_on", { ascending: false }),
        gid
          ? db.from("notifications").select("id,text,created_at").or(`group_id.is.null,group_id.eq.${gid}`).order("created_at", { ascending: false }).limit(5)
          : db.from("notifications").select("id,text,created_at").is("group_id", null).order("created_at", { ascending: false }).limit(5),
        db.from("scores").select("telegram_id,points"),
        db.from("tg_users").select("telegram_id,full_name,group_id").eq("step", "done"),
      ]);

    // Rankings from real totals.
    const totals = new Map<number, number>();
    for (const u of usersQ.data ?? []) totals.set(u.telegram_id, 0);
    for (const s of allScoresQ.data ?? []) {
      if (totals.has(s.telegram_id)) totals.set(s.telegram_id, (totals.get(s.telegram_id) ?? 0) + s.points);
    }
    const rankOf = (ids: number[]) => {
      const sorted = ids.map((id) => ({ id, pts: totals.get(id) ?? 0 })).sort((a, b) => b.pts - a.pts);
      const mine = totals.get(me.telegram_id) ?? 0;
      return { rank: sorted.filter((x) => x.pts > mine).length + 1, total: sorted.length, sorted };
    };
    const users = usersQ.data ?? [];
    const global = rankOf(users.map((u) => u.telegram_id));
    const groupUsers = gid ? users.filter((u) => u.group_id === gid) : [];
    const group = gid ? rankOf(groupUsers.map((u) => u.telegram_id)) : null;
    const nameOf = new Map(users.map((u) => [u.telegram_id, u.full_name ?? "—"]));
    const leaderboard = (group ?? global).sorted.slice(0, 5).map((x) => ({
      name: nameOf.get(x.id) ?? "—",
      points: x.pts,
      isMe: x.id === me.telegram_id,
    }));

    let avatar: string | null = tgUser.photo_url ?? null;
    if (me.avatar_url) {
      const { data: signed } = await db.storage.from("avatars").createSignedUrl(me.avatar_url, 60 * 60 * 6);
      if (signed?.signedUrl) avatar = signed.signedUrl;
    }

    const groupRow = groupQ.data;
    const teachers = teachersQ.data ?? [];
    const groupTeacher = groupRow?.teacher_id ? teachers.find((t) => t.id === groupRow.teacher_id) ?? null : null;
    const groupSize = groupUsers.length;

    return {
      status: "ok" as const,
      isAdmin,
      today,
      me: {
        telegram_id: me.telegram_id,
        full_name: me.full_name ?? "",
        username: me.username,
        region: me.region ?? "",
        district: me.district ?? "",
        role: me.role ?? "",
        goal: me.goal ?? "",
        weekly_goal: me.weekly_goal,
        registered_at: me.registered_at,
        avatar,
      },
      group: groupRow ? { id: groupRow.id, name: groupRow.name, description: groupRow.description, size: groupSize } : null,
      groupTeacher,
      teachers,
      channels: channelsQ.data ?? [],
      scores: scoresQ.data ?? [],
      attendance: attQ.data ?? [],
      lessons: lessonsQ.data ?? [],
      ratings: ratingsQ.data ?? [],
      certificates: certsQ.data ?? [],
      notifications: notifQ.data ?? [],
      ranking: {
        global: { rank: global.rank, total: global.total },
        group: group ? { rank: group.rank, total: group.total } : null,
        leaderboard,
      },
    };
  });

export type Dashboard = Extract<Awaited<ReturnType<typeof getDashboard>>, { status: "ok" }>;

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    auth
      .extend({
        full_name: z.string().trim().min(3).max(80),
        region: z.enum(REGIONS),
        district: z.string().trim().min(2).max(60),
        weekly_goal: z.number().int().min(10).max(10000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { authenticate } = await import("./auth.server");
    const { tgUser, me, db } = await authenticate(data.initData);
    if (!me) throw new Error("NOT_REGISTERED");
    const { error } = await db
      .from("tg_users")
      .update({ full_name: data.full_name, region: data.region, district: data.district, weekly_goal: data.weekly_goal })
      .eq("telegram_id", tgUser.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadAvatar = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    auth.extend({ dataUrl: z.string().max(2_000_000).regex(/^data:image\/(jpeg|png|webp);base64,/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { authenticate } = await import("./auth.server");
    const { tgUser, me, db } = await authenticate(data.initData);
    if (!me) throw new Error("NOT_REGISTERED");
    const [head, b64] = data.dataUrl.split(",");
    const mime = head?.match(/data:(image\/\w+)/)?.[1] ?? "image/jpeg";
    const bin = atob(b64 ?? "");
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const path = `${tgUser.id}/${Date.now()}.${mime.split("/")[1]}`;
    const { error } = await db.storage.from("avatars").upload(path, bytes, { contentType: mime, upsert: true });
    if (error) throw new Error(error.message);
    if (me.avatar_url) await db.storage.from("avatars").remove([me.avatar_url]);
    await db.from("tg_users").update({ avatar_url: path }).eq("telegram_id", tgUser.id);
    return { ok: true };
  });

export const joinGroup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.extend({ code: z.string().trim().min(4).max(12) }).parse(d))
  .handler(async ({ data }) => {
    const { authenticate } = await import("./auth.server");
    const { tgUser, me, db } = await authenticate(data.initData);
    if (!me || me.step !== "done") throw new Error("NOT_REGISTERED");
    const { data: g } = await db.from("groups").select("id,name").eq("join_code", data.code.toUpperCase()).maybeSingle();
    if (!g) return { ok: false as const, error: "Bunday kodli guruh topilmadi" };
    await db.from("tg_users").update({ group_id: g.id }).eq("telegram_id", tgUser.id);
    return { ok: true as const, name: g.name };
  });

export const leaveGroup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.parse(d))
  .handler(async ({ data }) => {
    const { authenticate } = await import("./auth.server");
    const { tgUser, db } = await authenticate(data.initData);
    await db.from("tg_users").update({ group_id: null }).eq("telegram_id", tgUser.id);
    return { ok: true };
  });
