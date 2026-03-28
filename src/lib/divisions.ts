// Division configuration
export const DIVISIONS = [
  { div: 1, name: 'Élite', minPoints: 2000, color: 'hsl(45, 95%, 55%)', reward: 5000 },
  { div: 2, name: 'Champion', minPoints: 1600, color: 'hsl(280, 70%, 55%)', reward: 4000 },
  { div: 3, name: 'Diamant', minPoints: 1300, color: 'hsl(200, 80%, 60%)', reward: 3200 },
  { div: 4, name: 'Platine', minPoints: 1050, color: 'hsl(210, 50%, 60%)', reward: 2600 },
  { div: 5, name: 'Or', minPoints: 850, color: 'hsl(45, 70%, 50%)', reward: 2000 },
  { div: 6, name: 'Argent', minPoints: 650, color: 'hsl(220, 15%, 60%)', reward: 1500 },
  { div: 7, name: 'Bronze III', minPoints: 480, color: 'hsl(25, 60%, 45%)', reward: 1200 },
  { div: 8, name: 'Bronze II', minPoints: 320, color: 'hsl(25, 50%, 40%)', reward: 900 },
  { div: 9, name: 'Bronze I', minPoints: 160, color: 'hsl(25, 40%, 35%)', reward: 600 },
  { div: 10, name: 'Débutant', minPoints: 0, color: 'hsl(220, 10%, 40%)', reward: 400 },
];

export function getDivisionFromPoints(points: number) {
  for (const div of DIVISIONS) {
    if (points >= div.minPoints) return div;
  }
  return DIVISIONS[DIVISIONS.length - 1];
}

export function getPointsForNextDivision(points: number): number | null {
  const current = getDivisionFromPoints(points);
  const idx = DIVISIONS.indexOf(current);
  if (idx <= 0) return null; // Already at top
  return DIVISIONS[idx - 1].minPoints;
}

// Match outcome calculation
// Higher overall = higher win chance, but not guaranteed
export function calculateMatchOutcome(playerOverall: number, opponentOverall: number): {
  playerWon: boolean;
  dominance: number; // 0-1, how dominant the win/loss was
} {
  const diff = playerOverall - opponentOverall;
  // Win probability: sigmoid function centered at 0 diff
  // At +10 diff: ~73% win chance, at +20: ~88%, at -10: ~27%
  const winProb = 1 / (1 + Math.exp(-diff / 8));
  const roll = Math.random();
  const playerWon = roll < winProb;
  const dominance = playerWon ? Math.min(1, (winProb - 0.3) / 0.7) : Math.min(1, ((1 - winProb) - 0.3) / 0.7);
  
  return { playerWon, dominance: Math.max(0.1, dominance) };
}

// Credits earned based on division and dominance
export function calculateCreditsEarned(division: number, won: boolean, dominance: number): number {
  const divConfig = DIVISIONS.find(d => d.div === division) || DIVISIONS[DIVISIONS.length - 1];
  if (!won) return Math.floor(divConfig.reward * 0.1); // Small consolation
  return Math.floor(divConfig.reward * (0.5 + dominance * 0.5));
}

// Points change
export function calculatePointsChange(won: boolean, dominance: number): number {
  if (won) return Math.floor(25 + dominance * 15); // +25 to +40
  return -Math.floor(15 + (1 - dominance) * 10); // -15 to -25
}
