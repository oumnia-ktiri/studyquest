import { describe, it, expect } from "vitest";
import { xpForMinutes, xpForLevel, levelFromXp } from "./xp";

describe("xpForMinutes", () => {
  it("gives 2 XP per minute", () => {
    expect(xpForMinutes(25)).toBe(50);
  });

  it("ignores partial minutes", () => {
    expect(xpForMinutes(10.9)).toBe(20);
  });
});

describe("xpForLevel", () => {
  it("level 1 needs 0 XP", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("level 2 needs 100 XP", () => {
    expect(xpForLevel(2)).toBe(100);
  });

  it("each level needs more XP than the last", () => {
    expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(4));
  });
});

describe("levelFromXp", () => {
  it("starts at level 1", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
  });

  it("reaches level 2 at exactly 100 XP", () => {
    expect(levelFromXp(100)).toBe(2);
  });

  it("matches the thresholds", () => {
    expect(levelFromXp(xpForLevel(4))).toBe(4);
    expect(levelFromXp(xpForLevel(4) - 1)).toBe(3);
  });
});