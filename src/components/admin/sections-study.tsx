import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, Stars, fieldCls } from "@/components/app/kit";
import { formatUz } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Field, NoItems, Panel, Row } from "./parts";
import { useAdminAction, useAdminData, userName } from "./useAdmin";

function useStudents() {
  const d = useAdminData();
  return useMemo(() => d.users.filter((u) => u.step === "done"), [d.users]);
}

function StudentSelect({ value, onChange, groupId }: { value: string; onChange: (v: string) => void; groupId?: string }) {
  const students = useStudents();
  const list = groupId ? students.filter((s) => s.group_id === groupId) : students;
  return (
    <NativeSelect required value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— O'quvchini tanlang —</option>
      {list.map((s) => <option key={s.telegram_id} value={s.telegram_id}>{userName(s)}</option>)}
    </NativeSelect>
  );
}

function GroupSelect({ value, onChange, allLabel, required }: { value: string; onChange: (v: string) => void; allLabel?: string; required?: boolean }) {
  const d = useAdminData();
  return (
    <NativeSelect required={required} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{allLabel ?? "— Guruhni tanlang —"}</option>
      {d.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
    </NativeSelect>
  );
}

export function LessonsSection() {
  const d = useAdminData();
  const act = useAdminAction();
  const [f, setF] = useState({ group_id: "", title: "", description: "", lesson_date: d.today });
  const [filter, setFilter] = useState("");
  const groupName = new Map(d.groups.map((g) => [g.id, g.name]));
  const list = filter ? d.lessons.filter((l) => l.group_id === filter) : d.lessons;

  if (d.groups.length === 0) return <Panel title="Darslar"><NoItems text="Avval Guruhlar bo'limida guruh yarating." /></Panel>;

  return (
    <>
      <Panel title="Yangi dars">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            act.mutate({ type: "lesson.create", ...f }, { onSuccess: () => setF({ ...f, title: "", description: "" }) });
          }}
        >
          <Field label="Guruh"><GroupSelect required value={f.group_id} onChange={(v) => setF({ ...f, group_id: v })} /></Field>
          <Field label="Mavzu"><Input className={fieldCls} required minLength={2} maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Tavsif"><Textarea className="rounded-2xl bg-card" maxLength={500} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Sana"><Input className={fieldCls} type="date" required value={f.lesson_date} onChange={(e) => setF({ ...f, lesson_date: e.target.value })} /></Field>
          <Button variant="brand" size="lg" className="w-full" disabled={act.isPending}>Dars qo'shish</Button>
        </form>
      </Panel>
      <Panel title={`Darslar (${list.length})`} action={<div className="w-44"><GroupSelect value={filter} onChange={setFilter} allLabel="Barcha guruhlar" /></div>}>
        {list.length === 0 ? <NoItems text="Hali dars yo'q." /> : (
          <ul className="space-y-2">
            {list.map((l) => (
              <Row key={l.id} busy={act.isPending} onDelete={() => act.mutate({ type: "lesson.delete", id: l.id })}>
                <div className="text-sm font-semibold">{l.title}</div>
                <div className="text-xs text-muted-foreground">{formatUz(l.lesson_date)} · {groupName.get(l.group_id) ?? "—"}</div>
              </Row>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

type Status = "present" | "late" | "absent" | null;
const ST: { v: Exclude<Status, null>; label: string; cls: string }[] = [
  { v: "present", label: "Keldi", cls: "bg-success text-success-foreground" },
  { v: "late", label: "Kechikdi", cls: "bg-warning text-warning-foreground" },
  { v: "absent", label: "Kelmadi", cls: "bg-destructive text-destructive-foreground" },
];

export function AttendanceSection() {
  const d = useAdminData();
  const act = useAdminAction("Davomat saqlandi");
  const students = useStudents();
  const [groupId, setGroupId] = useState(d.groups[0]?.id ?? "");
  const [date, setDate] = useState(d.today);
  const list = groupId ? students.filter((s) => s.group_id === groupId) : students.filter((s) => !s.group_id);
  const saved = useMemo(() => {
    const m = new Map<number, Status>();
    for (const a of d.attendance) if (a.att_date === date) m.set(a.telegram_id, a.status as Status);
    return m;
  }, [d.attendance, date]);
  const [marks, setMarks] = useState<Map<number, Status>>(new Map());
  useEffect(() => setMarks(new Map(saved)), [saved, groupId]);

  const setAll = (s: Status) => setMarks(new Map(list.map((u) => [u.telegram_id, s])));

  return (
    <Panel title="Davomat">
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <GroupSelect value={groupId} onChange={setGroupId} allLabel="— Guruhsiz o'quvchilar —" />
        <Input className={fieldCls} type="date" value={date} max={d.today} onChange={(e) => setDate(e.target.value)} />
      </div>
      {list.length === 0 ? <NoItems text="Bu guruhda o'quvchi yo'q." /> : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button size="sm" variant="soft" type="button" onClick={() => setAll("present")}>Hammasi keldi</Button>
            <Button size="sm" variant="soft" type="button" onClick={() => setAll(null)}>Tozalash</Button>
          </div>
          <ul className="space-y-2">
            {list.map((u) => {
              const cur = marks.get(u.telegram_id) ?? null;
              return (
                <li key={u.telegram_id} className="rounded-2xl bg-muted p-3">
                  <div className="mb-2 truncate text-sm font-semibold">{userName(u)}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {ST.map((s) => (
                      <button
                        key={s.v}
                        type="button"
                        onClick={() => setMarks(new Map(marks).set(u.telegram_id, cur === s.v ? null : s.v))}
                        className={cn("rounded-xl py-2 text-xs font-semibold transition-colors", cur === s.v ? s.cls : "bg-card text-muted-foreground")}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          <Button
            variant="brand"
            size="lg"
            className="mt-4 w-full"
            disabled={act.isPending}
            onClick={() => act.mutate({ type: "attendance.set", att_date: date, entries: list.map((u) => ({ telegram_id: u.telegram_id, status: marks.get(u.telegram_id) ?? null })) })}
          >
            Saqlash ({formatUz(date)})
          </Button>
        </>
      )}
    </Panel>
  );
}

export function ScoresSection() {
  const d = useAdminData();
  const act = useAdminAction("Ball qo'shildi");
  const empty = { student: "", points: "10", total: "0", correct: "0", lesson: "", note: "", date: d.today };
  const [f, setF] = useState(empty);
  const byId = new Map(d.users.map((u) => [u.telegram_id, u]));
  const student = f.student ? byId.get(Number(f.student)) : undefined;
  const lessons = student?.group_id ? d.lessons.filter((l) => l.group_id === student.group_id) : [];

  return (
    <>
      <Panel title="Ball qo'shish">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            act.mutate(
              { type: "score.add", telegram_id: Number(f.student), points: Number(f.points), answers_total: Number(f.total), answers_correct: Number(f.correct), lesson_id: f.lesson || null, note: f.note, scored_on: f.date },
              { onSuccess: () => setF({ ...empty, student: f.student, date: f.date }) },
            );
          }}
        >
          <Field label="O'quvchi"><StudentSelect value={f.student} onChange={(v) => setF({ ...f, student: v, lesson: "" })} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Ball"><Input className={fieldCls} type="number" required min={-1000} max={1000} value={f.points} onChange={(e) => setF({ ...f, points: e.target.value })} /></Field>
            <Field label="Savollar"><Input className={fieldCls} type="number" min={0} max={1000} value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} /></Field>
            <Field label="To'g'ri"><Input className={fieldCls} type="number" min={0} max={Number(f.total) || 0} value={f.correct} onChange={(e) => setF({ ...f, correct: e.target.value })} /></Field>
          </div>
          <Field label="Dars (ixtiyoriy)">
            <NativeSelect value={f.lesson} onChange={(e) => setF({ ...f, lesson: e.target.value })} disabled={!lessons.length}>
              <option value="">— Darssiz —</option>
              {lessons.map((l) => <option key={l.id} value={l.id}>{l.title} · {formatUz(l.lesson_date)}</option>)}
            </NativeSelect>
          </Field>
          <Field label="Izoh"><Input className={fieldCls} maxLength={200} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Masalan: Test uchun" /></Field>
          <Field label="Sana"><Input className={fieldCls} type="date" required max={d.today} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Button variant="brand" size="lg" className="w-full" disabled={act.isPending || !f.student}>Ball qo'shish</Button>
          <p className="text-xs text-muted-foreground">O'quvchiga botda xabar boradi.</p>
        </form>
      </Panel>
      <Panel title="Oxirgi ballar">
        {d.scores.length === 0 ? <NoItems text="Hali ball qo'yilmagan." /> : (
          <ul className="space-y-2">
            {d.scores.slice(0, 50).map((s) => {
              const u = byId.get(s.telegram_id);
              return (
                <Row key={s.id} busy={act.isPending} onDelete={() => act.mutate({ type: "score.delete", id: s.id })}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{u ? userName(u) : s.telegram_id}</span>
                    <span className={cn("text-sm font-bold", s.points < 0 ? "text-destructive" : "text-success")}>{s.points > 0 ? "+" : ""}{s.points}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatUz(s.scored_on)}{s.answers_total ? ` · ${s.answers_correct}/${s.answers_total} to'g'ri` : ""}{s.note ? ` · ${s.note}` : ""}
                  </div>
                </Row>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}

export function RatingsSection() {
  const d = useAdminData();
  const act = useAdminAction("Baho qo'yildi");
  const [student, setStudent] = useState("");
  const [lesson, setLesson] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const byId = new Map(d.users.map((u) => [u.telegram_id, u]));
  const lessonById = new Map(d.lessons.map((l) => [l.id, l]));
  const u = student ? byId.get(Number(student)) : undefined;
  const lessons = u?.group_id ? d.lessons.filter((l) => l.group_id === u.group_id) : [];
  const existing = d.ratings.find((r) => r.telegram_id === Number(student) && r.lesson_id === lesson);

  useEffect(() => {
    if (existing) { setRating(existing.rating); setComment(existing.comment ?? ""); }
  }, [existing]);

  return (
    <>
      <Panel title="Darsga baho qo'yish">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            act.mutate({ type: "rating.set", telegram_id: Number(student), lesson_id: lesson, rating, comment }, { onSuccess: () => setComment("") });
          }}
        >
          <Field label="O'quvchi"><StudentSelect value={student} onChange={(v) => { setStudent(v); setLesson(""); }} /></Field>
          <Field label="Dars">
            <NativeSelect required value={lesson} onChange={(e) => setLesson(e.target.value)} disabled={!lessons.length}>
              <option value="">{u && !u.group_id ? "O'quvchi guruhga qo'shilmagan" : u && !lessons.length ? "Guruhda dars yo'q" : "— Darsni tanlang —"}</option>
              {lessons.map((l) => <option key={l.id} value={l.id}>{l.title} · {formatUz(l.lesson_date)}</option>)}
            </NativeSelect>
          </Field>
          <Field label="Baho">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} baho`}
                  className={cn("h-11 flex-1 rounded-2xl text-xl transition-colors", i <= rating ? "bg-warning/25 text-warning" : "bg-muted text-muted-foreground/40")}>★</button>
              ))}
            </div>
          </Field>
          <Field label="Izoh"><Input className={fieldCls} maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
          <Button variant="brand" size="lg" className="w-full" disabled={act.isPending || !student || !lesson}>{existing ? "Bahoni yangilash" : "Baho qo'yish"}</Button>
        </form>
      </Panel>
      <Panel title={`Baholar (${d.ratings.length})`}>
        {d.ratings.length === 0 ? <NoItems text="Hali baho qo'yilmagan." /> : (
          <ul className="space-y-2">
            {d.ratings.slice(0, 50).map((r) => {
              const su = byId.get(r.telegram_id);
              const l = lessonById.get(r.lesson_id);
              return (
                <Row key={`${r.telegram_id}-${r.lesson_id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{su ? userName(su) : r.telegram_id}</span>
                    <Stars value={r.rating} />
                  </div>
                  <div className="text-xs text-muted-foreground">{l ? `${l.title} · ${formatUz(l.lesson_date)}` : "—"}{r.comment ? ` · ${r.comment}` : ""}</div>
                </Row>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}

export function CertificatesSection() {
  const d = useAdminData();
  const act = useAdminAction("Sertifikat berildi");
  const [f, setF] = useState({ student: "", title: "", score: "", date: d.today });
  const byId = new Map(d.users.map((u) => [u.telegram_id, u]));
  return (
    <>
      <Panel title="Sertifikat berish">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            act.mutate({ type: "certificate.create", telegram_id: Number(f.student), title: f.title, score: f.score, issued_on: f.date }, { onSuccess: () => setF({ ...f, title: "", score: "" }) });
          }}
        >
          <Field label="O'quvchi"><StudentSelect value={f.student} onChange={(v) => setF({ ...f, student: v })} /></Field>
          <Field label="Nomi"><Input className={fieldCls} required minLength={2} maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Masalan: Milliy sertifikat — Matematika" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Daraja / ball"><Input className={fieldCls} maxLength={40} value={f.score} onChange={(e) => setF({ ...f, score: e.target.value })} placeholder="A+" /></Field>
            <Field label="Sana"><Input className={fieldCls} type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          </div>
          <Button variant="brand" size="lg" className="w-full" disabled={act.isPending || !f.student}>Sertifikat berish</Button>
        </form>
      </Panel>
      <Panel title={`Sertifikatlar (${d.certificates.length})`}>
        {d.certificates.length === 0 ? <NoItems text="Hali sertifikat berilmagan." /> : (
          <ul className="space-y-2">
            {d.certificates.map((c) => {
              const u = byId.get(c.telegram_id);
              return (
                <Row key={c.id} busy={act.isPending} onDelete={() => act.mutate({ type: "certificate.delete", id: c.id })}>
                  <div className="text-sm font-semibold">🎓 {c.title}{c.score ? ` · ${c.score}` : ""}</div>
                  <div className="text-xs text-muted-foreground">{u ? userName(u) : c.telegram_id} · {formatUz(c.issued_on)}</div>
                </Row>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}

export function NotifySection() {
  const d = useAdminData();
  const act = useAdminAction();
  const [text, setText] = useState("");
  const [group, setGroup] = useState("");
  const groupName = new Map(d.groups.map((g) => [g.id, g.name]));
  return (
    <>
      <Panel title="Xabar yuborish">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!confirm(group ? `"${groupName.get(group)}" guruhiga yuborilsinmi?` : "Barcha o'quvchilarga yuborilsinmi?")) return;
            act.mutate({ type: "notify", text, group_id: group || null }, { onSuccess: () => setText("") });
          }}
        >
          <Field label="Kimga"><GroupSelect value={group} onChange={setGroup} allLabel="Barcha o'quvchilar" /></Field>
          <Field label="Matn"><Textarea className="min-h-28 rounded-2xl bg-card" required maxLength={3500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ertaga dars soat 15:00 da…" /></Field>
          <Button variant="brand" size="lg" className="w-full" disabled={act.isPending || !text.trim()}>{act.isPending ? "Yuborilmoqda…" : "Yuborish"}</Button>
        </form>
      </Panel>
      <Panel title="Yuborilgan xabarlar">
        {d.notifications.length === 0 ? <NoItems text="Hali xabar yuborilmagan." /> : (
          <ul className="space-y-2">
            {d.notifications.map((n) => (
              <Row key={n.id}>
                <div className="whitespace-pre-wrap text-sm">{n.text}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", dateStyle: "short", timeStyle: "short" })} · {n.group_id ? groupName.get(n.group_id) ?? "Guruh" : "Hammaga"} · ✅ {n.sent_count}
                </div>
              </Row>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
