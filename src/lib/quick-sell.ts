// Quick sell value ranges per card (by name + overall for uniqueness)
export interface QuickSellRange {
  min: number;
  max: number;
}

export const QUICK_SELL_VALUES: Record<string, QuickSellRange> = {
  'Delahaye_79': { min: 1200, max: 2000 },
  'Guillaume_88': { min: 18000, max: 28000 },
  'Garcia_83': { min: 2500, max: 4500 },
  'Innocenti_86': { min: 7000, max: 11000 },
  'Rippon_84': { min: 12000, max: 20000 },
  'Allaire_88': { min: 14000, max: 22000 },
  'Allaire_77': { min: 1200, max: 2000 },
  "L'Anthoen_86": { min: 8000, max: 14000 },
  'Vanelle_74': { min: 600, max: 1200 },
  'Ribeiro_85': { min: 9000, max: 15000 },
  'De Sieter_90': { min: 30000, max: 45000 },
  'Sedairia_86': { min: 15000, max: 25000 },
  'Blot_82': { min: 3500, max: 6000 },
  'Bourderioux_87': { min: 11000, max: 19000 },
};

export function getQuickSellKey(name: string, overall: number): string {
  return `${name}_${overall}`;
}

export function getQuickSellRange(name: string, overall: number): QuickSellRange {
  const key = getQuickSellKey(name, overall);
  return QUICK_SELL_VALUES[key] || { min: 500, max: 1000 };
}

export function getRandomQuickSellPrice(name: string, overall: number): number {
  const range = getQuickSellRange(name, overall);
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

export function formatCoins(value: number): string {
  return value.toLocaleString('fr-FR');
}
