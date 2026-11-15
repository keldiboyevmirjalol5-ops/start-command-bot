// All "today" logic uses Tashkent time so days match what students see.
export const TZ = "Asia/Tashkent";

export function todayISO(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing `iso`. */
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -dow);
}

export function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export const UZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];
export const UZ_WEEKDAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

export function formatUz(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${UZ_MONTHS[(m ?? 1) - 1]?.toLowerCase()} ${y}`;
}
