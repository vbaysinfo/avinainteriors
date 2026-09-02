// XP/level math shared by the student dashboard, progress charts and the
// lab-completion celebration modal.

export function levelFromXp(xp: number) {
  // Level N requires N*100 additional XP (triangular curve): lvl 1 @ 0xp,
  // lvl 2 @ 100xp, lvl 3 @ 300xp, lvl 4 @ 600xp, etc.
  let level = 1;
  let threshold = 0;
  let step = 100;
  while (xp >= threshold + step) {
    threshold += step;
    step += 100;
    level += 1;
  }
  const next = threshold + step;
  const progressPct = Math.round(((xp - threshold) / (next - threshold)) * 100);
  return { level, xpIntoLevel: xp - threshold, xpForNextLevel: next - threshold, progressPct };
}

export function xpToday(xp: number) {
  // Demo-only: derive a plausible "today" delta from total XP so the
  // dashboard has something to show without a real event log.
  return Math.max(0, Math.round((xp % 47) + 10));
}
