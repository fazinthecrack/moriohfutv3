export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type Position = 'GK' | 'DC' | 'DG' | 'DD' | 'MDC' | 'MC' | 'MOC' | 'MG' | 'MD' | 'AG' | 'AD' | 'BU' | 'SC';

export interface CardStats {
  rap: number;
  tir: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  stats: CardStats;
  emoji: string;
  position: Position;
  overall: number;
  image_url?: string | null;
}

// Position compatibility map: which positions can play in which slots
// Position compatibility: card position → which formation slots it can fill
// More generous than before — defenders can flex, midfielders flex, attackers flex
export const POSITION_COMPAT: Record<Position, Position[]> = {
  GK: ['GK'],
  DC: ['DC', 'DG', 'DD'],
  DG: ['DG', 'DC', 'MG'],
  DD: ['DD', 'DC', 'MD'],
  MDC: ['MDC', 'MC', 'DC'],
  MC: ['MC', 'MDC', 'MOC', 'MG', 'MD'],
  MOC: ['MOC', 'MC', 'SC', 'MG', 'MD'],
  MG: ['MG', 'AG', 'MC', 'MD'],
  MD: ['MD', 'AD', 'MC', 'MG'],
  AG: ['AG', 'MG', 'AD', 'BU'],
  AD: ['AD', 'MD', 'AG', 'BU'],
  BU: ['BU', 'SC', 'AG', 'AD'],
  SC: ['SC', 'BU', 'MOC', 'AG', 'AD'],
};

export const POSITION_LABELS: Record<Position, string> = {
  GK: 'Gardien',
  DC: 'Déf. Central',
  DG: 'Déf. Gauche',
  DD: 'Déf. Droit',
  MDC: 'Mil. Déf.',
  MC: 'Milieu',
  MOC: 'Mil. Off.',
  MG: 'Mil. Gauche',
  MD: 'Mil. Droit',
  AG: 'Ailier G.',
  AD: 'Ailier D.',
  BU: 'Buteur',
  SC: 'Sec. Att.',
};

export interface FormationSlot {
  pos: Position;
  label: string;
  x: number; // % from left
  y: number; // % from top
}

export interface Formation {
  name: string;
  slots: FormationSlot[];
}

export const FORMATIONS: Record<string, Formation> = {
  '4-4-2': {
    name: '4-4-2',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 15, y: 70 },
      { pos: 'DC', label: 'DC', x: 38, y: 72 },
      { pos: 'DC', label: 'DC', x: 62, y: 72 },
      { pos: 'DD', label: 'DD', x: 85, y: 70 },
      { pos: 'MG', label: 'MG', x: 15, y: 45 },
      { pos: 'MC', label: 'MC', x: 38, y: 48 },
      { pos: 'MC', label: 'MC', x: 62, y: 48 },
      { pos: 'MD', label: 'MD', x: 85, y: 45 },
      { pos: 'BU', label: 'BU', x: 35, y: 20 },
      { pos: 'BU', label: 'BU', x: 65, y: 20 },
    ],
  },
  '4-3-3': {
    name: '4-3-3',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 15, y: 70 },
      { pos: 'DC', label: 'DC', x: 38, y: 72 },
      { pos: 'DC', label: 'DC', x: 62, y: 72 },
      { pos: 'DD', label: 'DD', x: 85, y: 70 },
      { pos: 'MC', label: 'MC', x: 25, y: 48 },
      { pos: 'MC', label: 'MC', x: 50, y: 45 },
      { pos: 'MC', label: 'MC', x: 75, y: 48 },
      { pos: 'AG', label: 'AG', x: 18, y: 22 },
      { pos: 'BU', label: 'BU', x: 50, y: 18 },
      { pos: 'AD', label: 'AD', x: 82, y: 22 },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 15, y: 70 },
      { pos: 'DC', label: 'DC', x: 38, y: 72 },
      { pos: 'DC', label: 'DC', x: 62, y: 72 },
      { pos: 'DD', label: 'DD', x: 85, y: 70 },
      { pos: 'MDC', label: 'MDC', x: 38, y: 52 },
      { pos: 'MDC', label: 'MDC', x: 62, y: 52 },
      { pos: 'MG', label: 'MG', x: 18, y: 35 },
      { pos: 'MOC', label: 'MOC', x: 50, y: 33 },
      { pos: 'MD', label: 'MD', x: 82, y: 35 },
      { pos: 'BU', label: 'BU', x: 50, y: 15 },
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DC', label: 'DC', x: 28, y: 72 },
      { pos: 'DC', label: 'DC', x: 50, y: 74 },
      { pos: 'DC', label: 'DC', x: 72, y: 72 },
      { pos: 'MG', label: 'MG', x: 10, y: 45 },
      { pos: 'MC', label: 'MC', x: 35, y: 48 },
      { pos: 'MOC', label: 'MOC', x: 50, y: 40 },
      { pos: 'MC', label: 'MC', x: 65, y: 48 },
      { pos: 'MD', label: 'MD', x: 90, y: 45 },
      { pos: 'BU', label: 'BU', x: 35, y: 18 },
      { pos: 'BU', label: 'BU', x: 65, y: 18 },
    ],
  },
  '4-1-2-1-2': {
    name: '4-1-2-1-2',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 15, y: 70 },
      { pos: 'DC', label: 'DC', x: 38, y: 72 },
      { pos: 'DC', label: 'DC', x: 62, y: 72 },
      { pos: 'DD', label: 'DD', x: 85, y: 70 },
      { pos: 'MDC', label: 'MDC', x: 50, y: 55 },
      { pos: 'MC', label: 'MC', x: 30, y: 42 },
      { pos: 'MC', label: 'MC', x: 70, y: 42 },
      { pos: 'MOC', label: 'MOC', x: 50, y: 32 },
      { pos: 'BU', label: 'BU', x: 35, y: 18 },
      { pos: 'BU', label: 'BU', x: 65, y: 18 },
    ],
  },
  '4-3-2-1': {
    name: '4-3-2-1',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 15, y: 70 },
      { pos: 'DC', label: 'DC', x: 38, y: 72 },
      { pos: 'DC', label: 'DC', x: 62, y: 72 },
      { pos: 'DD', label: 'DD', x: 85, y: 70 },
      { pos: 'MC', label: 'MC', x: 25, y: 48 },
      { pos: 'MC', label: 'MC', x: 50, y: 48 },
      { pos: 'MC', label: 'MC', x: 75, y: 48 },
      { pos: 'AG', label: 'AG', x: 30, y: 28 },
      { pos: 'AD', label: 'AD', x: 70, y: 28 },
      { pos: 'BU', label: 'BU', x: 50, y: 15 },
    ],
  },
  '4-4-1-1': {
    name: '4-4-1-1',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 15, y: 70 },
      { pos: 'DC', label: 'DC', x: 38, y: 72 },
      { pos: 'DC', label: 'DC', x: 62, y: 72 },
      { pos: 'DD', label: 'DD', x: 85, y: 70 },
      { pos: 'MG', label: 'MG', x: 15, y: 45 },
      { pos: 'MC', label: 'MC', x: 38, y: 48 },
      { pos: 'MC', label: 'MC', x: 62, y: 48 },
      { pos: 'MD', label: 'MD', x: 85, y: 45 },
      { pos: 'SC', label: 'SC', x: 50, y: 28 },
      { pos: 'BU', label: 'BU', x: 50, y: 15 },
    ],
  },
  '4-5-1': {
    name: '4-5-1',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 15, y: 70 },
      { pos: 'DC', label: 'DC', x: 38, y: 72 },
      { pos: 'DC', label: 'DC', x: 62, y: 72 },
      { pos: 'DD', label: 'DD', x: 85, y: 70 },
      { pos: 'MG', label: 'MG', x: 12, y: 45 },
      { pos: 'MC', label: 'MC', x: 32, y: 42 },
      { pos: 'MOC', label: 'MOC', x: 50, y: 38 },
      { pos: 'MC', label: 'MC', x: 68, y: 42 },
      { pos: 'MD', label: 'MD', x: 88, y: 45 },
      { pos: 'BU', label: 'BU', x: 50, y: 15 },
    ],
  },
  '5-3-2': {
    name: '5-3-2',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 10, y: 65 },
      { pos: 'DC', label: 'DC', x: 30, y: 72 },
      { pos: 'DC', label: 'DC', x: 50, y: 74 },
      { pos: 'DC', label: 'DC', x: 70, y: 72 },
      { pos: 'DD', label: 'DD', x: 90, y: 65 },
      { pos: 'MC', label: 'MC', x: 30, y: 45 },
      { pos: 'MC', label: 'MC', x: 50, y: 43 },
      { pos: 'MC', label: 'MC', x: 70, y: 45 },
      { pos: 'BU', label: 'BU', x: 35, y: 18 },
      { pos: 'BU', label: 'BU', x: 65, y: 18 },
    ],
  },
  '4-2-4': {
    name: '4-2-4',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 15, y: 70 },
      { pos: 'DC', label: 'DC', x: 38, y: 72 },
      { pos: 'DC', label: 'DC', x: 62, y: 72 },
      { pos: 'DD', label: 'DD', x: 85, y: 70 },
      { pos: 'MC', label: 'MC', x: 38, y: 48 },
      { pos: 'MC', label: 'MC', x: 62, y: 48 },
      { pos: 'AG', label: 'AG', x: 15, y: 22 },
      { pos: 'BU', label: 'BU', x: 38, y: 18 },
      { pos: 'BU', label: 'BU', x: 62, y: 18 },
      { pos: 'AD', label: 'AD', x: 85, y: 22 },
    ],
  },
  '3-4-3': {
    name: '3-4-3',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DC', label: 'DC', x: 28, y: 72 },
      { pos: 'DC', label: 'DC', x: 50, y: 74 },
      { pos: 'DC', label: 'DC', x: 72, y: 72 },
      { pos: 'MG', label: 'MG', x: 12, y: 45 },
      { pos: 'MC', label: 'MC', x: 38, y: 48 },
      { pos: 'MC', label: 'MC', x: 62, y: 48 },
      { pos: 'MD', label: 'MD', x: 88, y: 45 },
      { pos: 'AG', label: 'AG', x: 18, y: 22 },
      { pos: 'BU', label: 'BU', x: 50, y: 18 },
      { pos: 'AD', label: 'AD', x: 82, y: 22 },
    ],
  },
  '4-1-4-1': {
    name: '4-1-4-1',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 15, y: 70 },
      { pos: 'DC', label: 'DC', x: 38, y: 72 },
      { pos: 'DC', label: 'DC', x: 62, y: 72 },
      { pos: 'DD', label: 'DD', x: 85, y: 70 },
      { pos: 'MDC', label: 'MDC', x: 50, y: 55 },
      { pos: 'MG', label: 'MG', x: 15, y: 38 },
      { pos: 'MC', label: 'MC', x: 38, y: 40 },
      { pos: 'MC', label: 'MC', x: 62, y: 40 },
      { pos: 'MD', label: 'MD', x: 85, y: 38 },
      { pos: 'BU', label: 'BU', x: 50, y: 15 },
    ],
  },
  '4-3-1-2': {
    name: '4-3-1-2',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 15, y: 70 },
      { pos: 'DC', label: 'DC', x: 38, y: 72 },
      { pos: 'DC', label: 'DC', x: 62, y: 72 },
      { pos: 'DD', label: 'DD', x: 85, y: 70 },
      { pos: 'MC', label: 'MC', x: 25, y: 48 },
      { pos: 'MC', label: 'MC', x: 50, y: 50 },
      { pos: 'MC', label: 'MC', x: 75, y: 48 },
      { pos: 'MOC', label: 'MOC', x: 50, y: 32 },
      { pos: 'BU', label: 'BU', x: 35, y: 18 },
      { pos: 'BU', label: 'BU', x: 65, y: 18 },
    ],
  },
  '5-2-1-2': {
    name: '5-2-1-2',
    slots: [
      { pos: 'GK', label: 'GK', x: 50, y: 90 },
      { pos: 'DG', label: 'DG', x: 10, y: 65 },
      { pos: 'DC', label: 'DC', x: 30, y: 72 },
      { pos: 'DC', label: 'DC', x: 50, y: 74 },
      { pos: 'DC', label: 'DC', x: 70, y: 72 },
      { pos: 'DD', label: 'DD', x: 90, y: 65 },
      { pos: 'MC', label: 'MC', x: 35, y: 48 },
      { pos: 'MC', label: 'MC', x: 65, y: 48 },
      { pos: 'MOC', label: 'MOC', x: 50, y: 32 },
      { pos: 'BU', label: 'BU', x: 35, y: 18 },
      { pos: 'BU', label: 'BU', x: 65, y: 18 },
    ],
  },
};

// Check if a card's position is compatible with a formation slot
export function isPositionCompatible(cardPosition: Position, slotPosition: Position): boolean {
  const compat = POSITION_COMPAT[cardPosition];
  return compat ? compat.includes(slotPosition) : false;
}

// Card pool - fixed set of cards
import sedairiaImg from '@/assets/cards/Sedairia.png';
import lAnthoenImg from '@/assets/cards/L_Anthoen.png';
import ribeiroImg from '@/assets/cards/Ribeiro.png';
import guillaumeImg from '@/assets/cards/Guillaume.png';
import ripponImg from '@/assets/cards/Rippon.png';
import blotImg from '@/assets/cards/Blot.png';
import innocentiImg from '@/assets/cards/Innocenti.png';
import deSieterImg from '@/assets/cards/De_Sieter.png';
import bourderiouxImg from '@/assets/cards/Bourderioux.png';
import garciaImg from '@/assets/cards/Garcia.png';
import allaireGoldImg from '@/assets/cards/Allaire_Gold.png';
import allaireEOEImg from '@/assets/cards/Allaire_EOE.png';
import delahayeImg from '@/assets/cards/Delahaye.png';
import vanelleImg from '@/assets/cards/Vanelle.png';

export interface CardExtra {
  altPositions: string[];
  nationality: string;
  league: string;
  club: string;
  strongFoot: string;
  skillStars: number;
  weakFoot: number;
  futbinValue: number;
}

export interface CardTemplate {
  name: string;
  rarity: Rarity;
  emoji: string;
  position: Position;
  overall: number;
  stats: CardStats;
  image_url: string;
  extra: CardExtra;
}

export const CARD_POOL: CardTemplate[] = [
  {
    name: 'Guillaume',
    rarity: 'rare',
    emoji: '👑',
    position: 'AD',
    overall: 88,
    stats: { rap: 87, tir: 92, pas: 88, dri: 91, def: 38, phy: 67 },
    image_url: guillaumeImg,
    extra: {
      altPositions: ['AG', 'BU'],
      nationality: 'Norvège',
      league: 'LaLiga',
      club: 'Real Madrid',
      strongFoot: 'Droit',
      skillStars: 5,
      weakFoot: 4,
      futbinValue: 90,
    },
  },
  {
    name: 'Ribeiro',
    rarity: 'rare',
    emoji: '🎯',
    position: 'MOC',
    overall: 85,
    stats: { rap: 91, tir: 83, pas: 80, dri: 93, def: 40, phy: 75 },
    image_url: ribeiroImg,
    extra: {
      altPositions: ['BU'],
      nationality: 'Portugal',
      league: 'Ligue 1',
      club: 'Paris Saint-Germain',
      strongFoot: 'Droit',
      skillStars: 4,
      weakFoot: 3,
      futbinValue: 86,
    },
  },
  {
    name: "L'Anthoen",
    rarity: 'rare',
    emoji: '💪',
    position: 'DD',
    overall: 86,
    stats: { rap: 90, tir: 75, pas: 82, dri: 78, def: 87, phy: 87 },
    image_url: lAnthoenImg,
    extra: {
      altPositions: ['DG'],
      nationality: 'France',
      league: 'Ligue 1',
      club: 'Paris Saint-Germain',
      strongFoot: 'Droit',
      skillStars: 3,
      weakFoot: 4,
      futbinValue: 88,
    },
  },
  {
    name: 'Sedairia',
    rarity: 'rare',
    emoji: '⚡',
    position: 'MG',
    overall: 86,
    stats: { rap: 88, tir: 81, pas: 89, dri: 87, def: 48, phy: 75 },
    image_url: sedairiaImg,
    extra: {
      altPositions: ['MOC'],
      nationality: 'Algérie',
      league: 'Ligue 1',
      club: 'Paris Saint-Germain',
      strongFoot: 'Droit',
      skillStars: 4,
      weakFoot: 4,
      futbinValue: 90,
    },
  },
  {
    name: 'Rippon',
    rarity: 'rare',
    emoji: '⚽',
    position: 'AD',
    overall: 84,
    stats: { rap: 82, tir: 87, pas: 86, dri: 91, def: 39, phy: 73 },
    image_url: ripponImg,
    extra: {
      altPositions: [],
      nationality: 'Jamaïque',
      league: 'Ligue 1',
      club: 'Paris Saint-Germain',
      strongFoot: 'Droit',
      skillStars: 4,
      weakFoot: 4,
      futbinValue: 88,
    },
  },
  {
    name: 'Blot',
    rarity: 'rare',
    emoji: '🔄',
    position: 'DG',
    overall: 82,
    stats: { rap: 85, tir: 70, pas: 85, dri: 82, def: 80, phy: 85 },
    image_url: blotImg,
    extra: {
      altPositions: ['MDC'],
      nationality: 'France',
      league: 'Ligue 1',
      club: 'Paris Saint-Germain',
      strongFoot: 'Droit',
      skillStars: 3,
      weakFoot: 2,
      futbinValue: 84,
    },
  },
  {
    name: 'Innocenti',
    rarity: 'rare',
    emoji: '💪',
    position: 'DC',
    overall: 86,
    stats: { rap: 82, tir: 65, pas: 84, dri: 82, def: 87, phy: 89 },
    image_url: innocentiImg,
    extra: {
      altPositions: ['MDC'],
      nationality: 'Laos',
      league: 'MLS',
      club: 'Inter Miami CF',
      strongFoot: 'Droit',
      skillStars: 3,
      weakFoot: 2,
      futbinValue: 87,
    },
  },
  {
    name: 'De Sieter',
    rarity: 'legendary',
    emoji: '🧤',
    position: 'GK',
    overall: 90,
    stats: { rap: 87, tir: 90, pas: 78, dri: 91, def: 81, phy: 89 },
    image_url: deSieterImg,
    extra: {
      altPositions: [],
      nationality: 'France',
      league: 'Ligue 2',
      club: 'Girondins de Bordeaux',
      strongFoot: 'Droit',
      skillStars: 1,
      weakFoot: 2,
      futbinValue: 92,
    },
  },
  {
    name: 'Bourderioux',
    rarity: 'epic',
    emoji: '🔥',
    position: 'DC',
    overall: 87,
    stats: { rap: 94, tir: 52, pas: 85, dri: 75, def: 85, phy: 89 },
    image_url: bourderiouxImg,
    extra: {
      altPositions: [],
      nationality: 'France',
      league: 'Ligue 1',
      club: 'Olympique Lyonnais',
      strongFoot: 'Gauche',
      skillStars: 3,
      weakFoot: 3,
      futbinValue: 88,
    },
  },
  {
    name: 'Garcia',
    rarity: 'rare',
    emoji: '⚽',
    position: 'MC',
    overall: 83,
    stats: { rap: 87, tir: 75, pas: 84, dri: 85, def: 72, phy: 80 },
    image_url: garciaImg,
    extra: {
      altPositions: ['MOC'],
      nationality: 'France',
      league: 'LaLiga',
      club: 'FC Barcelone',
      strongFoot: 'Droit',
      skillStars: 4,
      weakFoot: 3,
      futbinValue: 85,
    },
  },
  {
    name: 'Allaire',
    rarity: 'common',
    emoji: '🛡️',
    position: 'MC',
    overall: 77,
    stats: { rap: 89, tir: 50, pas: 80, dri: 59, def: 79, phy: 89 },
    image_url: allaireGoldImg,
    extra: {
      altPositions: ['MDC'],
      nationality: 'France',
      league: 'Premier League',
      club: 'Arsenal',
      strongFoot: 'Droit',
      skillStars: 2,
      weakFoot: 2,
      futbinValue: 80,
    },
  },
  {
    name: 'Allaire',
    rarity: 'epic',
    emoji: '💎',
    position: 'MC',
    overall: 88,
    stats: { rap: 92, tir: 65, pas: 86, dri: 72, def: 89, phy: 92 },
    image_url: allaireEOEImg,
    extra: {
      altPositions: ['MDC'],
      nationality: 'France',
      league: 'Premier League',
      club: 'Arsenal',
      strongFoot: 'Droit',
      skillStars: 2,
      weakFoot: 4,
      futbinValue: 88,
    },
  },
  {
    name: 'Delahaye',
    rarity: 'common',
    emoji: '🛡️',
    position: 'DC',
    overall: 79,
    stats: { rap: 84, tir: 41, pas: 82, dri: 77, def: 82, phy: 75 },
    image_url: delahayeImg,
    extra: {
      altPositions: [],
      nationality: 'France',
      league: 'Premier League',
      club: 'Tottenham Hotspur',
      strongFoot: 'Droit',
      skillStars: 2,
      weakFoot: 3,
      futbinValue: 79,
    },
  },
  {
    name: 'Vanelle',
    rarity: 'common',
    emoji: '⚡',
    position: 'AD',
    overall: 74,
    stats: { rap: 78, tir: 73, pas: 77, dri: 70, def: 27, phy: 65 },
    image_url: vanelleImg,
    extra: {
      altPositions: [],
      nationality: 'France',
      league: 'Ligue 2',
      club: 'AS Saint-Étienne',
      strongFoot: 'Droit',
      skillStars: 2,
      weakFoot: 1,
      futbinValue: 75,
    },
  },
];


function cardFromTemplate(template: CardTemplate): Card {
  return {
    id: crypto.randomUUID(),
    name: template.name,
    rarity: template.rarity,
    emoji: template.emoji,
    position: template.position,
    overall: template.overall,
    image_url: template.image_url,
    stats: { ...template.stats },
  };
}

export function generatePack(): Card[] {
  // Shuffle pool and pick each card only once (no duplicates)
  const shuffled = [...CARD_POOL].sort(() => Math.random() - 0.5);
  return shuffled.map(cardFromTemplate);
}

export function canOpenPack(): boolean {
  const lastOpen = localStorage.getItem('lastPackOpen');
  if (!lastOpen) return true;
  const last = new Date(lastOpen);
  const now = new Date();
  const frOpts: Intl.DateTimeFormatOptions = { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false };
  const frFormatter = new Intl.DateTimeFormat('fr-FR', frOpts);
  const getVal = (parts: Intl.DateTimeFormatPart[], type: string) => parts.find(p => p.type === type)?.value || '';
  const lastParts = frFormatter.formatToParts(last);
  const nowParts = frFormatter.formatToParts(now);
  const lastDay = `${getVal(lastParts, 'year')}-${getVal(lastParts, 'month')}-${getVal(lastParts, 'day')}`;
  const nowDay = `${getVal(nowParts, 'year')}-${getVal(nowParts, 'month')}-${getVal(nowParts, 'day')}`;
  const nowHour = parseInt(getVal(nowParts, 'hour'));
  if (lastDay === nowDay) return false;
  if (lastDay !== nowDay && nowHour >= 23) return true;
  const lastDate = new Date(`${getVal(lastParts, 'year')}-${getVal(lastParts, 'month')}-${getVal(lastParts, 'day')}`);
  const nowDate = new Date(`${getVal(nowParts, 'year')}-${getVal(nowParts, 'month')}-${getVal(nowParts, 'day')}`);
  const diffDays = (nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 2 || (diffDays >= 1 && nowHour >= 23);
}

export function markPackOpened(): void {
  localStorage.setItem('lastPackOpen', new Date().toISOString());
}

export function getInventory(): Card[] {
  const data = localStorage.getItem('inventory');
  return data ? JSON.parse(data) : [];
}

export function saveInventory(cards: Card[]): void {
  localStorage.setItem('inventory', JSON.stringify(cards));
}

export function getNextOpenTime(): Date {
  const now = new Date();
  const fr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
  const today = fr.format(now);
  const nowInParis = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const todayAt23 = new Date(nowInParis);
  todayAt23.setHours(23, 0, 0, 0);
  if (nowInParis >= todayAt23) {
    todayAt23.setDate(todayAt23.getDate() + 1);
  }
  const diff = todayAt23.getTime() - nowInParis.getTime();
  return new Date(now.getTime() + diff);
}

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Commun',
  rare: 'Or Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

export const STAT_LABELS = {
  rap: 'RAP',
  tir: 'TIR',
  pas: 'PAS',
  dri: 'DRI',
  def: 'DEF',
  phy: 'PHY',
};
