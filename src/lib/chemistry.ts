// Chemistry & Coach system for lineup
import { CARD_POOL, POSITION_COMPAT, type Position, type CardExtra } from './cards';

// Lookup card extra data from pool by name + overall
export function getCardExtra(name: string, overall: number): CardExtra | null {
  const tpl = CARD_POOL.find(c => c.name === name && c.overall === overall);
  return tpl?.extra || null;
}

// Check if card position fits slot, including alt positions from template
export function isPositionCompatibleWithAlt(
  cardPosition: Position,
  cardName: string,
  cardOverall: number,
  slotPosition: Position
): boolean {
  if (cardPosition === slotPosition) return true;
  const compat = POSITION_COMPAT[cardPosition];
  if (compat?.includes(slotPosition)) return true;
  const extra = getCardExtra(cardName, cardOverall);
  if (extra) {
    for (const alt of extra.altPositions) {
      if (alt === slotPosition) return true;
      const altCompat = POSITION_COMPAT[alt as Position];
      if (altCompat?.includes(slotPosition)) return true;
    }
  }
  return false;
}

// Chemistry link between two adjacent cards
export interface ChemLink {
  score: number;
  reasons: string[];
}

export function getChemistryLink(
  card1Name: string, card1Overall: number,
  card2Name: string, card2Overall: number
): ChemLink {
  const e1 = getCardExtra(card1Name, card1Overall);
  const e2 = getCardExtra(card2Name, card2Overall);
  if (!e1 || !e2) return { score: 0, reasons: [] };
  let score = 0;
  const reasons: string[] = [];
  if (e1.club === e2.club) { score += 1; reasons.push('Club'); }
  if (e1.league === e2.league) { score += 1; reasons.push('Ligue'); }
  if (e1.nationality === e2.nationality) { score += 1; reasons.push('Nation'); }
  return { score: Math.min(3, score), reasons };
}

export function getFormationLinks(slotCount: number, positions: { x: number; y: number }[]): [number, number][] {
  const links: [number, number][] = [];
  const MAX_DIST = 35;
  for (let i = 0; i < slotCount; i++) {
    for (let j = i + 1; j < slotCount; j++) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DIST) links.push([i, j]);
    }
  }
  return links;
}

export interface TeamChemistry {
  total: number;
  playerChem: number[];
  links: { from: number; to: number; score: number; reasons: string[] }[];
}

interface LineupCard {
  name: string;
  overall: number;
  position: string;
}

export function calculateTeamChemistry(
  lineup: (LineupCard | null)[],
  slotPositions: { pos: string; x: number; y: number }[]
): TeamChemistry {
  const links = getFormationLinks(slotPositions.length, slotPositions);
  const playerChem: number[] = Array(slotPositions.length).fill(0);
  const chemLinks: TeamChemistry['links'] = [];

  for (const [i, j] of links) {
    const c1 = lineup[i];
    const c2 = lineup[j];
    if (!c1 || !c2) continue;
    const link = getChemistryLink(c1.name, c1.overall, c2.name, c2.overall);
    chemLinks.push({ from: i, to: j, score: link.score, reasons: link.reasons });
    playerChem[i] = Math.min(10, playerChem[i] + link.score);
    playerChem[j] = Math.min(10, playerChem[j] + link.score);
  }

  for (let i = 0; i < slotPositions.length; i++) {
    const card = lineup[i];
    if (!card) continue;
    if (card.position === slotPositions[i].pos) {
      playerChem[i] = Math.min(10, playerChem[i] + 3);
    } else {
      playerChem[i] = Math.min(10, playerChem[i] + 1);
    }
  }

  const filledCount = lineup.filter(Boolean).length;
  const total = filledCount > 0
    ? Math.round(playerChem.reduce((s, v) => s + v, 0) / filledCount * 10)
    : 0;

  return { total: Math.min(100, total), playerChem, links: chemLinks };
}

// Coach system — single coach: Pascal Pedie
export interface Coach {
  id: string;
  name: string;
  nationality: string;
  league: string;
  bonus: string;
  chemBoost: number;
}

export const COACHES: Coach[] = [
  { id: 'coach_pascal', name: 'Pascal Pedie', nationality: 'France', league: 'Ligue 1', bonus: '+5 Chimie globale', chemBoost: 5 },
];

export function getCoachChemBoost(coach: Coach, lineup: (LineupCard | null)[]): number {
  let boost = 0;
  for (const card of lineup) {
    if (!card) continue;
    const extra = getCardExtra(card.name, card.overall);
    if (!extra) continue;
    if (extra.league === coach.league) boost += 1;
    if (extra.nationality === coach.nationality) boost += 1;
  }
  return Math.min(coach.chemBoost, boost);
}
