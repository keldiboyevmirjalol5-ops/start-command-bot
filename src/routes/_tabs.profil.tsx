import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Award, Camera, ChevronRight, LogOut, Megaphone, Pencil, Users, GraduationCap, Loader2 } from "lucide-react";
import { useDash } from "@/hooks/use-dashboard";
import { haptic, openExternal, useTelegram } from "@/hooks/use-telegram";
import { joinGroup, leaveGroup, updateProfile, uploadAvatar } from "@/lib/api/student.functions";
import { REGIONS } from "@/lib/bot/flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AvatarCircle, Card, Empty, NativeSelect, Page, SectionTitle, fieldCls } from "@/components/app/kit";
import { CertificateCard } from "@/components/app/CertificateCard";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_tabs/profil")({
  head: () => pageHead("Profil", "Profil, rasm, guruh, o'qituvchilar, kanallar va sertifikatlar."),
  component: ProfilPage,
});

async function resizeToDataUrl(file: File, max = 512): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ProfilPage() {
  const d = useDash();
  const { initData, webApp } = useTelegram();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["dashboard"] });
  const fileRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [code, setCode] = useState("");

  const uploadFn = useServerFn(uploadAvatar);
  const joinFn = useServerFn(joinGroup);
  const leaveFn = useServerFn(leaveGroup);

  const upload = useMutation({
    mutationFn: async (file: File) => uploadFn({ data: { initData, dataUrl: await resizeToDataUrl(file) } }),
    onSuccess: () => { toast.success("Rasm yangilandi"); haptic(webApp, "success"); refresh(); },
    onError: () => toast.error("Rasmni yuklab bo'lmadi"),
  });
  const join = useMutation({
    mutationFn: () => joinFn({ data: { initData, code: code.trim() } }),
    onSuccess: (r) => {
      if (r.ok) { toast.success(`"${r.name}" guruhiga qo'shildingiz`); haptic(webApp, "success"); setCode(""); refresh(); }
      else { toast.error(r.error); haptic(webApp, "error"); }
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });
  const leave = useMutation({
    mutationFn: () => leaveFn({ data: { initData } }),
    onSuccess: () => { toast.success("Guruhdan chiqdingiz"); refresh(); },
  });

  return (
    <Page>
      <Card className="text-center">
        <div className="relative mx-auto w-fit">
          <AvatarCircle src={d.me.avatar} name={d.me.full_name} className="h-24 w-24 text-2xl" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-primary-foreground shadow-card"
            aria-label="Rasmni o'zgartirish"
          >
            {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }}
          />
        </div>
        <h1 className="mt-3 font-display text-xl font-bold">{d.me.full_name}</h1>
        {d.me.username && <p className="text-sm text-muted-foreground">@{d.me.username}</p>}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
          <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">{d.me.role}</span>
          <span className="rounded-full bg-muted px-3 py-1">📍 {d.me.region}, {d.me.district}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{d.me.goal}</p>
        <Button variant="soft" className="mt-4 w-full" onClick={() => setEditOpen(true)}>
          <Pencil /> Profilni tahrirlash
        </Button>
      </Card>


      <Card>
        <SectionTitle>
          <span className="inline-flex items-center gap-2"><Users className="size-4 text-primary" /> Guruh</span>
        </SectionTitle>
        {d.group ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-secondary p-4">
              <div className="font-display text-lg font-bold text-secondary-foreground">{d.group.name}</div>
              {d.group.description && <p className="mt-1 text-sm text-muted-foreground">{d.group.description}</p>}
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                <span>👥 {d.group.size} o'quvchi</span>
                {d.groupTeacher && <span>👨‍🏫 {d.groupTeacher.full_name}</span>}
              </div>
            </div>
            <Button variant="ghost" className="w-full text-destructive" disabled={leave.isPending} onClick={() => { if (confirm("Guruhdan chiqasizmi?")) leave.mutate(); }}>
              <LogOut /> Guruhdan chiqish
            </Button>
          </div>
        ) : (
          <form
            className="space-y-2"
            onSubmit={(e) => { e.preventDefault(); if (code.trim().length >= 4) join.mutate(); }}
          >
            <p className="text-sm text-muted-foreground">O'qituvchingiz bergan guruh kodini kiriting:</p>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Masalan: AB12CD" maxLength={12} className={`${fieldCls} font-mono uppercase tracking-widest`} />
              <Button type="submit" variant="brand" className="h-11" disabled={join.isPending || code.trim().length < 4}>
                {join.isPending ? <Loader2 className="animate-spin" /> : "Qo'shilish"}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <div>
        <SectionTitle>Sertifikatlar</SectionTitle>
        {d.certificates.length ? (
          <div className="space-y-3">
            {d.certificates.map((c) => <CertificateCard key={c.id} cert={c} name={d.me.full_name} />)}
          </div>
        ) : (
          <Empty icon={<Award />} title="Hali sertifikat yo'q" />
        )}
      </div>

      <Card>
        <SectionTitle>
          <span className="inline-flex items-center gap-2"><GraduationCap className="size-4 text-primary" /> O'qituvchilar</span>
        </SectionTitle>
        {d.teachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali o'qituvchilar qo'shilmagan.</p>
        ) : (
          <ul className="space-y-2">
            {d.teachers.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={!t.telegram_username}
                  onClick={() => t.telegram_username && openExternal(webApp, `https://t.me/${t.telegram_username}`)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-muted p-3 text-left"
                >
                  <AvatarCircle name={t.full_name} className="h-10 w-10 text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.full_name}{d.groupTeacher?.id === t.id ? " · sizning ustozingiz" : ""}</div>
                    <div className="truncate text-xs text-muted-foreground">{t.subject ?? ""}{t.telegram_username ? ` · @${t.telegram_username}` : ""}</div>
                  </div>
                  {t.telegram_username && <ChevronRight className="size-4 text-muted-foreground" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle>
          <span className="inline-flex items-center gap-2"><Megaphone className="size-4 text-primary" /> Kanallar</span>
        </SectionTitle>
        {d.channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali kanallar qo'shilmagan.</p>
        ) : (
          <ul className="space-y-2">
            {d.channels.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => openExternal(webApp, c.url)} className="flex w-full items-center gap-3 rounded-2xl bg-muted p-3 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground"><Megaphone className="size-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{c.title}</div>
                    {c.description && <div className="truncate text-xs text-muted-foreground">{c.description}</div>}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <EditProfile open={editOpen} onOpenChange={setEditOpen} onSaved={refresh} />
    </Page>
  );
}

function EditProfile({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const d = useDash();
  const { initData } = useTelegram();
  const fn = useServerFn(updateProfile);
  const [form, setForm] = useState({ full_name: d.me.full_name, region: d.me.region, district: d.me.district, weekly_goal: String(d.me.weekly_goal) });
  const save = useMutation({
    mutationFn: () =>
      fn({ data: { initData, full_name: form.full_name, region: form.region as (typeof REGIONS)[number], district: form.district, weekly_goal: Number(form.weekly_goal) } }),
    onSuccess: () => { toast.success("Saqlandi"); onOpenChange(false); onSaved(); },
    onError: () => toast.error("Ma'lumotlarni tekshiring (ism kamida 3, tuman kamida 2 harf, maqsad 10+)"),
  });
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader><DrawerTitle>Profilni tahrirlash</DrawerTitle></DrawerHeader>
          <form className="space-y-3 px-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <div className="space-y-1.5"><Label>Ism-familiya</Label><Input className={fieldCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Viloyat</Label>
              <NativeSelect value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5"><Label>Tuman / shahar</Label><Input className={fieldCls} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Haftalik maqsad (ball)</Label><Input className={fieldCls} type="number" min={10} value={form.weekly_goal} onChange={(e) => setForm({ ...form, weekly_goal: e.target.value })} /></div>
            <DrawerFooter className="px-0">
              <Button type="submit" variant="brand" size="lg" disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin" /> : "Saqlash"}</Button>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
