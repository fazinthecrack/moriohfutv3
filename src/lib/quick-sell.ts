// Quick sell value ranges per card (by name + overall for uniqueness)
export interface QuickSellRange {
  min: number;
  max: number;
}

export const QUICK_SELL_VALUES: Record<string, QuickSellRange> = {
  'Delahaye_79': { min: 1500, max: 2500 },
  'Vanelle_74': { min: 700, max: 1300 },
  'Allaire_77': { min: 1800, max: 3200 },
  'Garcia_83': { min: 9000, max: 15000 },
  "L'Anthoen_86": { min: 22000, max: 34000 },
  'Innocenti_86': { min: 19000, max: 31000 },
  'De Sieter_90': { min: 42000, max: 68000 },
  'Rippon_84': { min: 14000, max: 22000 },
  'Guillaume_88': { min: 27000, max: 43000 },
  'Ribeiro_85': { min: 17000, max: 27000 },
  'Blot_82': { min: 7500, max: 12500 },
  'Sedairia_86': { min: 18000, max: 30000 },
  'Bourderioux_87': { min: 23000, max: 37000 },
  'Allaire_88': { min: 29000, max: 47000 },
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
