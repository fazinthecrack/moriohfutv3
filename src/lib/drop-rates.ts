// Drop rate configuration per card per pack type
// Odds are "1 in X" — lower X = more common

import { CARD_POOL, type CardTemplate } from './cards';

export type PackType = 'free' | 'premium';

interface DropEntry {
  name: string;
  overall: number;
  freeOdds: number;   // 1 in X
  premiumOdds: number; // 1 in X
}

const DROP_TABLE: DropEntry[] = [
  { name: 'Delahaye', overall: 79, freeOdds: 420, premiumOdds: 180 },
  { name: 'Vanelle', overall: 74, freeOdds: 320, premiumOdds: 140 },
  { name: 'Garcia', overall: 83, freeOdds: 950, premiumOdds: 420 },
  { name: 'Blot', overall: 82, freeOdds: 1650, premiumOdds: 750 },
  { name: 'Ribeiro', overall: 85, freeOdds: 1800, premiumOdds: 820 },
  { name: 'Rippon', overall: 84, freeOdds: 2000, premiumOdds: 920 },
  { name: 'Sedairia', overall: 86, freeOdds: 2150, premiumOdds: 980 },
  { name: "L'Anthoen", overall: 86, freeOdds: 2250, premiumOdds: 1020 },
  { name: 'Innocenti', overall: 86, freeOdds: 2300, premiumOdds: 1050 },
  { name: 'Guillaume', overall: 88, freeOdds: 2600, premiumOdds: 1200 },
  { name: 'Bourderioux', overall: 87, freeOdds: 3100, premiumOdds: 1450 },
  { name: 'Allaire', overall: 88, freeOdds: 3300, premiumOdds: 1550 },
  { name: 'De Sieter', overall: 90, freeOdds: 4000, premiumOdds: 1900 },
];

// Allaire 77 is the filler card (most common)
const FILLER_TEMPLATE = CARD_POOL.find(c => c.name === 'Allaire' && c.overall === 77)!;

function findTemplate(name: string, overall: number): CardTemplate | undefined {
  return CARD_POOL.find(c => c.name === name && c.overall === overall);
}

function rollCard(packType: PackType): CardTemplate {
  const roll = Math.random();
  let cumulative = 0;

  for (const entry of DROP_TABLE) {
    const odds = packType === 'free' ? entry.freeOdds : entry.premiumOdds;
    const prob = 1 / odds;
    cumulative += prob;
    if (roll < cumulative) {
      const tpl = findTemplate(entry.name, entry.overall);
      if (tpl) return tpl;
    }
  }

  // Filler: Allaire 77
  return FILLER_TEMPLATE;
}

export function generatePackWithRates(packType: PackType) {
  const cards: CardTemplate[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < 3; i++) {
    let attempts = 0;
    let card: CardTemplate;
    do {
      card = rollCard(packType);
      attempts++;
    } while (usedNames.has(`${card.name}_${card.overall}`) && attempts < 50);
    
    usedNames.add(`${card.name}_${card.overall}`);
    cards.push(card);
  }

  return cards.map(tpl => ({
    id: crypto.randomUUID(),
    name: tpl.name,
    rarity: tpl.rarity,
    emoji: tpl.emoji,
    position: tpl.position,
    overall: tpl.overall,
    image_url: tpl.image_url,
    stats: { ...tpl.stats },
  }));
}

export const PREMIUM_PACK_COST = 20000;
