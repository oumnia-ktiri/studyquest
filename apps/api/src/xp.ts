// XP earned = 2 per minute actually studied
export function xpForMinutes(minutes: number) {
  return Math.floor(minutes) * 2;
}

// Total XP needed to reach a level: 100 * (level - 1)^1.5
export function xpForLevel(level: number) {
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}