// Pure registration flow for the Telegram bot. No I/O here so it stays testable.

export const REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon",
  "Farg'ona",
  "Namangan",
  "Samarqand",
  "Buxoro",
  "Navoiy",
  "Qashqadaryo",
  "Surxondaryo",
  "Jizzax",
  "Sirdaryo",
  "Xorazm",
  "Qoraqalpog'iston",
] as const;

export const ROLES = { student: "🎓 O'quvchi", teacher: "👨‍🏫 O'qituvchi" } as const;

export const GOALS = [
  "🏛 Milliy Sertifikatga tayyorlanish",
  "📜 Attestatsiyaga tayyorlanish",
  "🏆 Fan olimpiadasiga tayyorlanish",
] as const;

export const BACK = "⬅️ Orqaga";
export const OPEN_APP = "📱 Ilovani ochish";

export type Step = "full_name" | "region" | "district" | "role" | "goal" | "done";

export type BotUser = {
  step: Step;
  full_name: string | null;
  region: string | null;
  district: string | null;
  role: string | null;
  goal: string | null;
};

export type Reply = {
  text: string;
  keyboard?: string[][]; // reply keyboard rows
  removeKeyboard?: boolean;
  openApp?: boolean; // attach inline "open mini app" button
  appPath?: string; // path inside the mini app, e.g. "admin"
  buttonText?: string;
};

export type FlowResult = { patch: Partial<BotUser> & { registered?: boolean }; replies: Reply[] };

const ORDER: Step[] = ["full_name", "region", "district", "role", "goal"];

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function promptFor(step: Step): Reply {
  switch (step) {
    case "full_name":
      return {
        text: "1/5 · Ism va familiyangizni yozing.\nMasalan: <i>Ali Valiyev</i>",
        removeKeyboard: true,
      };
    case "region":
      return {
        text: "2/5 · Qaysi viloyatdansiz? Pastdagi tugmalardan tanlang 👇",
        keyboard: [...chunk(REGIONS, 2), [BACK]],
      };
    case "district":
      return {
        text: "3/5 · Tumaningizni (yoki shahringizni) yozing.\nMasalan: <i>Urganch</i>",
        keyboard: [[BACK]],
      };
    case "role":
      return {
        text: "4/5 · Siz o'quvchimisiz yoki o'qituvchimisiz? 👇",
        keyboard: [[ROLES.student, ROLES.teacher], [BACK]],
      };
    case "goal":
      return {
        text: "5/5 · 🎯 Sizning maqsadingiz nima? 👇",
        keyboard: [...GOALS.map((g) => [g]), [BACK]],
      };
    case "done":
      return { text: "", removeKeyboard: true };
  }
}

function prev(step: Step): Step {
  const i = ORDER.indexOf(step);
  return i > 0 ? (ORDER[i - 1] ?? "full_name") : "full_name";
}

export function summary(u: BotUser): string {
  return [
    "✅ <b>Ro'yxatdan muvaffaqiyatli o'tdingiz!</b>",
    "",
    `👤 Ism-familiya: <b>${esc(u.full_name)}</b>`,
    `📍 Viloyat: <b>${esc(u.region)}</b>`,
    `🏘 Tuman: <b>${esc(u.district)}</b>`,
    `🧑‍🎓 Rol: <b>${esc(u.role)}</b>`,
    `🎯 Maqsad: <b>${esc(u.goal)}</b>`,
    "",
    "Quyidagi tugma orqali ilovani oching 👇",
  ].join("\n");
}

export function esc(s: string | null | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const WELCOME =
  "👋 Assalomu alaykum! Botimizga xush kelibsiz.\n\nRo'yxatdan o'tish uchun 5 ta qisqa savolga javob bering.";

export function handleText(user: BotUser | null, rawText: string): FlowResult {
  const text = rawText.trim();
  const cmd = (text.split(/[\s@]/)[0] ?? "").toLowerCase();

  if (cmd === "/start") {
    if (user && user.step === "done") {
      return {
        patch: {},
        replies: [
          { text: "Siz allaqachon ro'yxatdan o'tgansiz ✅", removeKeyboard: true },
          { text: summary(user) + "\n\nMa'lumotlarni o'zgartirish uchun: /qayta", openApp: true },
        ],
      };
    }
    return {
      patch: { step: "full_name" },
      replies: [{ text: WELCOME }, promptFor("full_name")],
    };
  }

  if (cmd === "/qayta") {
    return {
      patch: { step: "full_name", registered: false },
      replies: [{ text: "🔄 Ro'yxatdan qayta o'tamiz." }, promptFor("full_name")],
    };
  }

  if (cmd === "/app") {
    return { patch: {}, replies: [{ text: "Ilovani ochish uchun tugmani bosing 👇", openApp: true }] };
  }

  const step: Step = user?.step ?? "full_name";

  if (step === "done") {
    return {
      patch: {},
      replies: [{ text: "Ilovani ochish uchun tugmani bosing 👇", openApp: true }],
    };
  }

  if (text === BACK) {
    const p = prev(step);
    return { patch: { step: p }, replies: [promptFor(p)] };
  }

  switch (step) {
    case "full_name": {
      if (text.startsWith("/") || text.length < 3 || text.length > 80) {
        return { patch: {}, replies: [{ text: "❗ Iltimos, ism va familiyangizni to'g'ri yozing." }, promptFor("full_name")] };
      }
      return { patch: { full_name: text, step: "region" }, replies: [promptFor("region")] };
    }
    case "region": {
      if (!(REGIONS as readonly string[]).includes(text)) {
        return { patch: {}, replies: [{ text: "❗ Iltimos, viloyatni tugmalardan tanlang." }, promptFor("region")] };
      }
      return { patch: { region: text, step: "district" }, replies: [promptFor("district")] };
    }
    case "district": {
      if (text.startsWith("/") || text.length < 2 || text.length > 60) {
        return { patch: {}, replies: [{ text: "❗ Iltimos, tuman nomini to'g'ri yozing." }, promptFor("district")] };
      }
      return { patch: { district: text, step: "role" }, replies: [promptFor("role")] };
    }
    case "role": {
      if (text !== ROLES.student && text !== ROLES.teacher) {
        return { patch: {}, replies: [{ text: "❗ Iltimos, tugmalardan birini tanlang." }, promptFor("role")] };
      }
      return { patch: { role: text, step: "goal" }, replies: [promptFor("goal")] };
    }
    case "goal": {
      if (!(GOALS as readonly string[]).includes(text)) {
        return { patch: {}, replies: [{ text: "❗ Iltimos, maqsadingizni tugmalardan tanlang." }, promptFor("goal")] };
      }
      const done: BotUser = { ...(user as BotUser), goal: text, step: "done" };
      return {
        patch: { goal: text, step: "done", registered: true },
        replies: [
          { text: "🎉 Tabriklaymiz!", removeKeyboard: true },
          { text: summary(done), openApp: true },
        ],
      };
    }
  }
}
