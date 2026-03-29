export const EVOLUTION_THRESHOLDS = [
  { level: 1, xpNeeded: 50, label: 'Bronze', color: 'hsl(25, 60%, 50%)', glow: '0 0 12px hsl(25, 60%, 50%, 0.5)' },
  { level: 2, xpNeeded: 150, label: 'Argent', color: 'hsl(220, 15%, 70%)', glow: '0 0 16px hsl(220, 15%, 70%, 0.5)' },
  { level: 3, xpNeeded: 300, label: 'Or', color: 'hsl(45, 95%, 55%)', glow: '0 0 20px hsl(45, 95%, 55%, 0.6)' },
];

export function getEvolutionInfo(level: number, xp: number) {
  const current = EVOLUTION_THRESHOLDS[level - 1] || null;
  const next = EVOLUTION_THRESHOLDS[level] || null;
  const canEvolve = next ? xp >= next.xpNeeded : false;
  const maxLevel = level >= 3;
  const progress = next ? Math.min(100, (xp / next.xpNeeded) * 100) : 100;
  return { current, next, canEvolve, maxLevel, progress };
}
