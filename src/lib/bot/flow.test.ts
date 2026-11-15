import { describe, expect, it } from "vitest";
import { BACK, GOALS, REGIONS, ROLES, handleText, type BotUser } from "./flow";

const base: BotUser = { step: "full_name", full_name: null, region: null, district: null, role: null, goal: null };

describe("bot registration flow", () => {
  it("/start for a new user asks question 1/5", () => {
    const r = handleText(null, "/start");
    expect(r.patch.step).toBe("full_name");
    expect(r.replies.at(-1)?.text).toContain("1/5");
  });

  it("name moves to region step with region buttons", () => {
    const r = handleText(base, "Ali Valiyev");
    expect(r.patch).toMatchObject({ full_name: "Ali Valiyev", step: "region" });
    expect(r.replies[0]?.keyboard?.flat()).toContain("Farg'ona");
  });

  it("region must be picked from the list", () => {
    const u = { ...base, step: "region" as const };
    expect(handleText(u, "Moskva").patch.step).toBeUndefined();
    expect(handleText(u, REGIONS[3]).patch.step).toBe("district");
  });

  it("back button returns to previous step", () => {
    expect(handleText({ ...base, step: "role" }, BACK).patch.step).toBe("district");
  });

  it("role then goal completes registration with open-app button", () => {
    expect(handleText({ ...base, step: "role" }, ROLES.student).patch.step).toBe("goal");
    const done = handleText({ ...base, step: "goal", full_name: "A B", region: "Xorazm", district: "Urganch", role: ROLES.student }, GOALS[0]);
    expect(done.patch).toMatchObject({ step: "done", registered: true, goal: GOALS[0] });
    expect(done.replies.some((x) => x.openApp)).toBe(true);
  });

  it("/start for registered user does not restart the survey", () => {
    const r = handleText({ ...base, step: "done" }, "/start");
    expect(r.patch.step).toBeUndefined();
  });
});
