import { describe, expect, it } from "vitest";
import { attendanceRate, attendanceStreak, averageRating, dailySeries, sumScores } from "./stats";
import { weekStart } from "./dates";

const s = (scored_on: string, points: number, answers_total = 0, answers_correct = 0) => ({ scored_on, points, answers_total, answers_correct });

describe("stats", () => {
  it("sums only scores inside the period", () => {
    const r = sumScores([s("2026-11-10", 10, 10, 8), s("2026-11-15", 5, 10, 2), s("2026-10-01", 99)], "2026-11-10", "2026-11-15");
    expect(r).toMatchObject({ points: 15, answers: 20, correct: 10, accuracy: 50 });
  });

  it("week starts on Monday", () => {
    expect(weekStart("2026-11-15")).toBe("2026-11-09"); // Sunday -> Monday
    expect(weekStart("2026-11-09")).toBe("2026-11-09");
  });

  it("daily series fills empty days with zero", () => {
    const d = dailySeries([s("2026-11-14", 7)], "2026-11-15", 3);
    expect(d.map((x) => x.points)).toEqual([0, 7, 0]);
  });

  it("late counts as attended, absent does not", () => {
    expect(attendanceRate([{ att_date: "a", status: "present" }, { att_date: "b", status: "late" }, { att_date: "c", status: "absent" }, { att_date: "d", status: "absent" }])).toBe(50);
  });

  it("streak stops at the most recent absence", () => {
    const rows = [
      { att_date: "2026-11-15", status: "present" },
      { att_date: "2026-11-14", status: "late" },
      { att_date: "2026-11-13", status: "absent" },
      { att_date: "2026-11-12", status: "present" },
    ];
    expect(attendanceStreak(rows)).toBe(2);
  });

  it("average rating rounds to one decimal", () => {
    expect(averageRating([{ rating: 5 }, { rating: 4 }, { rating: 4 }])).toBe(4.3);
  });
});
