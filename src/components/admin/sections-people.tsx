import { useMemo, useState } from "react";
import { BookOpen, CalendarCheck, Copy, GraduationCap, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, Stat, fieldCls } from "@/components/app/kit";
import { Field, NoItems, Panel, Row } from "./parts";
import { useAdminAction, useAdminData, userName } from "./useAdmin";
import { BOT_USERNAME } from "@/lib/config";

export function OverviewSection() {
  const d = useAdminData();
  const registered = d.users.filter((u) => u.step === "done");
  const todayAtt = d.attendance.filter((a) => a.att_date === d.today);
  const present = todayAtt.filter((a) => a.status !== "absent").length;
  const totalPoints = d.scores.reduce((s, x) => s + x.points, 0);
  const top = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of d.scores) m.set(s.telegram_id, (m.get(s.telegram_id) ?? 0) + s.points);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [d.scores]);
  const byId = new Map(d.users.map((u) => [u.telegram_id, u]));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<Users />} label="Ro'yxatdan o'tgan" value={registered.length} hint={`Jami: ${d.users.length}`} />
        <Stat icon={<GraduationCap />} label="Guruhlar" value={d.groups.length} tone="accent" />
        <Stat icon={<BookOpen />} label="Darslar" value={d.lessons.length} tone="warning" />
        <Stat icon={<CalendarCheck />} label="Bugun qatnashdi" value={`${present}/${todayAtt.length}`} tone="success" />
        <Stat icon={<Trophy />} label="Jami ball" value={totalPoints} />
        <Stat icon={<GraduationCap />} label="Sertifikatlar" value={d.certificates.length} tone="accent" />
      </div>
      <Panel title="Eng yaxshi 5 o'quvchi">
        {top.length === 0 ? (
          <NoItems text="Hali ball qo'yilmagan." />
        ) : (
          <ol className="space-y-2">
            {top.map(([id, pts], i) => {
              const u = byId.get(id);
              return (
                <li key={id} className="flex items-center gap-3 rounded-2xl bg-muted p-3">
                  <span className="font-display text-lg font-bold text-primary">{i + 1}</span>
                  <span className="flex-1 truncate text-sm font-semibold">{u ? userName(u) : id}</span>
                  <span className="text-sm font-bold">{pts} ball</span>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </>
  );
}

export function StudentsSection() {
  const d = useAdminData();
  const act = useAdminAction();
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const groupName = new Map(d.groups.map((g) => [g.id, g.name]));
  const list = d.users.filter((u) => {
    const text = `${u.full_name ?? ""} ${u.username ?? ""} ${u.region ?? ""} ${u.district ?? ""}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (groupFilter === "none" && u.group_id) return false;
    if (groupFilter !== "all" && groupFilter !== "none" && u.group_id !== groupFilter) return false;
    return true;
  });

  return (
    <Panel title={`O'quvchilar (${list.length})`}>
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <Input className={fieldCls} placeholder="Ism, username yoki hudud…" value={q} onChange={(e) => setQ(e.target.value)} />
        <NativeSelect value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option value="all">Barcha guruhlar</option>
          <option value="none">Guruhsiz</option>
          {d.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </NativeSelect>
      </div>
      {list.length === 0 ? (
        <NoItems text="O'quvchi topilmadi. Botda /start bosgan foydalanuvchilar shu yerda chiqadi." />
      ) : (
        <ul className="space-y-2">
          {list.map((u) => (
            <Row key={u.telegram_id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{userName(u)}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {u.step === "done" ? [u.role, u.region, u.district].filter(Boolean).join(" · ") : "⏳ Ro'yxatdan o'tmoqda"}
                    {u.username ? ` · @${u.username}` : ""}
                  </div>
                  {u.goal && <div className="truncate text-xs text-muted-foreground">🎯 {u.goal}</div>}
                </div>
                <NativeSelect
                  className="sm:w-48"
                  value={u.group_id ?? ""}
                  disabled={act.isPending}
                  onChange={(e) => act.mutate({ type: "student.setGroup", telegram_id: u.telegram_id, group_id: e.target.value || null })}
                  aria-label="Guruh"
                >
                  <option value="">— Guruhsiz —</option>
                  {d.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </NativeSelect>
              </div>
              {u.group_id && !groupName.has(u.group_id) && <div className="text-xs text-destructive">Guruh o'chirilgan</div>}
            </Row>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function GroupsSection() {
  const d = useAdminData();
  const act = useAdminAction();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [teacher, setTeacher] = useState("");
  const teacherName = new Map(d.teachers.map((t) => [t.id, t.full_name]));
  const counts = new Map<string, number>();
  for (const u of d.users) if (u.group_id) counts.set(u.group_id, (counts.get(u.group_id) ?? 0) + 1);

  return (
    <>
      <Panel title="Yangi guruh">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            act.mutate(
              { type: "group.create", name, description: desc, teacher_id: teacher || null },
              { onSuccess: () => { setName(""); setDesc(""); } },
            );
          }}
        >
          <Field label="Nomi"><Input className={fieldCls} required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Matematika 9-A" /></Field>
          <Field label="Tavsif"><Textarea className="rounded-2xl bg-card" maxLength={300} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
          <Field label="O'qituvchi">
            <NativeSelect value={teacher} onChange={(e) => setTeacher(e.target.value)}>
              <option value="">— Tanlanmagan —</option>
              {d.teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </NativeSelect>
          </Field>
          <Button variant="brand" size="lg" className="w-full" disabled={act.isPending}>Guruh yaratish</Button>
        </form>
      </Panel>
      <Panel title={`Guruhlar (${d.groups.length})`}>
        {d.groups.length === 0 ? <NoItems text="Hali guruh yo'q." /> : (
          <ul className="space-y-2">
            {d.groups.map((g) => (
              <Row key={g.id} busy={act.isPending} onDelete={() => act.mutate({ type: "group.delete", id: g.id })}>
                <div className="text-sm font-semibold">{g.name}</div>
                <div className="text-xs text-muted-foreground">
                  👥 {counts.get(g.id) ?? 0} o'quvchi{g.teacher_id && teacherName.get(g.teacher_id) ? ` · 👨‍🏫 ${teacherName.get(g.teacher_id)}` : ""}
                </div>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1 rounded-xl bg-secondary px-2 py-1 font-mono text-xs font-bold text-secondary-foreground"
                  onClick={() => {
                    navigator.clipboard?.writeText(`/guruh ${g.join_code}`).then(() => toast.success("Nusxa olindi"), () => {});
                  }}
                >
                  Kod: {g.join_code} <Copy className="size-3" />
                </button>
              </Row>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">O'quvchilar @{BOT_USERNAME} botida <code>/guruh KOD</code> yozib yoki Profil bo'limida kodni kiritib qo'shiladi.</p>
      </Panel>
    </>
  );
}

export function TeachersSection() {
  const d = useAdminData();
  const act = useAdminAction();
  const [f, setF] = useState({ full_name: "", subject: "", telegram_username: "" });
  return (
    <>
      <Panel title="Yangi o'qituvchi">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            act.mutate({ type: "teacher.create", ...f }, { onSuccess: () => setF({ full_name: "", subject: "", telegram_username: "" }) });
          }}
        >
          <Field label="Ism-familiya"><Input className={fieldCls} required minLength={3} maxLength={80} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
          <Field label="Fan"><Input className={fieldCls} maxLength={80} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Masalan: Matematika" /></Field>
          <Field label="Telegram username"><Input className={fieldCls} maxLength={40} value={f.telegram_username} onChange={(e) => setF({ ...f, telegram_username: e.target.value })} placeholder="@username" /></Field>
          <Button variant="brand" size="lg" className="w-full" disabled={act.isPending}>Qo'shish</Button>
        </form>
      </Panel>
      <Panel title={`O'qituvchilar (${d.teachers.length})`}>
        {d.teachers.length === 0 ? <NoItems text="Hali o'qituvchi yo'q." /> : (
          <ul className="space-y-2">
            {d.teachers.map((t) => (
              <Row key={t.id} busy={act.isPending} onDelete={() => act.mutate({ type: "teacher.delete", id: t.id })}>
                <div className="text-sm font-semibold">{t.full_name}</div>
                <div className="text-xs text-muted-foreground">{[t.subject, t.telegram_username && `@${t.telegram_username}`].filter(Boolean).join(" · ") || "—"}</div>
              </Row>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

export function ChannelsSection() {
  const d = useAdminData();
  const act = useAdminAction();
  const [f, setF] = useState({ title: "", url: "", description: "" });
  return (
    <>
      <Panel title="Yangi kanal">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            act.mutate({ type: "channel.create", ...f }, { onSuccess: () => setF({ title: "", url: "", description: "" }) });
          }}
        >
          <Field label="Nomi"><Input className={fieldCls} required minLength={2} maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Havola"><Input className={fieldCls} type="url" required value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://t.me/kanal" /></Field>
          <Field label="Tavsif"><Input className={fieldCls} maxLength={300} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Button variant="brand" size="lg" className="w-full" disabled={act.isPending}>Qo'shish</Button>
        </form>
      </Panel>
      <Panel title={`Kanallar (${d.channels.length})`}>
        {d.channels.length === 0 ? <NoItems text="Hali kanal yo'q." /> : (
          <ul className="space-y-2">
            {d.channels.map((c) => (
              <Row key={c.id} busy={act.isPending} onDelete={() => act.mutate({ type: "channel.delete", id: c.id })}>
                <div className="text-sm font-semibold">{c.title}</div>
                <div className="truncate text-xs text-primary">{c.url}</div>
                {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
              </Row>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
