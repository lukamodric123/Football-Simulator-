import { Player, Position } from './types';
import { getPlayerOverall, generatePlayer, uid } from './generator';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Card types
export type CardTier = 'bronze' | 'silver' | 'gold' | 'inform' | 'toty' | 'prime' | 'icon';

export interface UTCard {
  id: string;
  playerId: string;
  playerName: string;
  position: Position;
  nationality: string;
  age: number;
  tier: CardTier;
  rating: number;
  boostedRating: number;
  chemistry: number; // 0-100
  attributes: {
    pac: number;
    sho: number;
    pas: number;
    dri: number;
    def: number;
    phy: number;
  };
  specialAbility?: string;
}

export interface UTSquad {
  cards: UTCard[];
  formation: string;
  chemistry: number;
  overallRating: number;
  name: string;
}

export interface UTLeaderboardEntry {
  squadName: string;
  ownerName: string;
  rating: number;
  chemistry: number;
  wins: number;
  losses: number;
  points: number;
}

export interface UTEvent {
  id: string;
  name: string;
  description: string;
  reward: CardTier;
  active: boolean;
  season: number;
}

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '4-1-4-1', '3-4-3', '5-3-2'];
const SPECIAL_ABILITIES = ['Finesse Shot', 'Power Header', 'Long Range', 'Speed Dribbler', 'Brick Wall', 'Playmaker', 'Fox in the Box', 'Engine', 'Shadow', 'Hawk'];

function getCardTier(overall: number, isLegend: boolean): CardTier {
  if (isLegend) return 'icon';
  if (overall >= 90) return 'gold';
  if (overall >= 80) return 'gold';
  if (overall >= 70) return 'silver';
  return 'bronze';
}

function getTierBoost(tier: CardTier): number {
  switch (tier) {
    case 'icon': return 8;
    case 'prime': return 6;
    case 'toty': return 5;
    case 'inform': return 3;
    case 'gold': return 0;
    case 'silver': return 0;
    case 'bronze': return 0;
  }
}

export function playerToCard(player: Player, tierOverride?: CardTier): UTCard {
  const ovr = getPlayerOverall(player);
  const tier = tierOverride || getCardTier(ovr, player.isLegend);
  const boost = getTierBoost(tier);

  return {
    id: `utc_${player.id}_${tier}`,
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    position: player.position,
    nationality: player.nationality,
    age: player.age,
    tier,
    rating: ovr,
    boostedRating: Math.min(99, ovr + boost),
    chemistry: 50,
    attributes: {
      pac: Math.min(99, player.attributes.pace + boost),
      sho: Math.min(99, player.attributes.shooting + boost),
      pas: Math.min(99, player.attributes.passing + boost),
      dri: Math.min(99, player.attributes.dribbling + boost),
      def: Math.min(99, player.attributes.defense + boost),
      phy: Math.min(99, player.attributes.physicality + boost),
    },
    specialAbility: ovr >= 80 || tier === 'icon' ? pick(SPECIAL_ABILITIES) : undefined,
  };
}

// Chemistry calculation
export function calculateChemistry(cards: UTCard[]): number {
  if (cards.length === 0) return 0;

  let totalChem = 0;

  // Nationality links
  const nationGroups: Record<string, number> = {};
  for (const c of cards) {
    nationGroups[c.nationality] = (nationGroups[c.nationality] || 0) + 1;
  }

  for (const c of cards) {
    let cardChem = 30; // Base

    // Same nationality links
    const sameNation = nationGroups[c.nationality] || 0;
    if (sameNation >= 3) cardChem += 30;
    else if (sameNation >= 2) cardChem += 15;

    // Tier bonus
    if (c.tier === 'icon') cardChem += 20;
    else if (c.tier === 'prime' || c.tier === 'toty') cardChem += 15;
    else if (c.tier === 'inform') cardChem += 10;

    // Rating bonus
    if (c.rating >= 85) cardChem += 10;
    else if (c.rating >= 80) cardChem += 5;

    totalChem += Math.min(100, cardChem);
  }

  return Math.round(totalChem / cards.length);
}

// Generate special packs
export function generatePack(
  tier: 'bronze' | 'silver' | 'gold' | 'special',
  allPlayers: Record<string, Player>
): UTCard[] {
  const playerList = Object.values(allPlayers).filter(p => !p.retired);
  const cards: UTCard[] = [];
  const count = tier === 'special' ? 3 : 5;

  for (let i = 0; i < count; i++) {
    const player = pick(playerList);
    const ovr = getPlayerOverall(player);

    let cardTier: CardTier;
    if (tier === 'special') {
      cardTier = pick(['inform', 'toty', 'prime', 'icon'] as CardTier[]);
    } else if (tier === 'gold') {
      cardTier = ovr >= 85 ? (Math.random() > 0.8 ? 'inform' : 'gold') : 'gold';
    } else if (tier === 'silver') {
      cardTier = ovr >= 75 ? 'gold' : 'silver';
    } else {
      cardTier = 'bronze';
    }

    cards.push(playerToCard(player, cardTier));
  }

  return cards;
}

// Squad builder
export function buildUTSquad(cards: UTCard[], name: string): UTSquad {
  const sorted = [...cards].sort((a, b) => b.boostedRating - a.boostedRating);
  const squad = sorted.slice(0, 11);
  const chemistry = calculateChemistry(squad);
  const overallRating = squad.length > 0
    ? Math.round(squad.reduce((s, c) => s + c.boostedRating, 0) / squad.length)
    : 0;

  return {
    cards: squad,
    formation: pick(FORMATIONS),
    chemistry,
    overallRating,
    name,
  };
}

// Simulate UT match
export function simulateUTMatch(
  squad1: UTSquad,
  squad2: UTSquad
): { winner: 1 | 2 | 0; score1: number; score2: number } {
  const power1 = squad1.overallRating * (squad1.chemistry / 100) + rand(-5, 5);
  const power2 = squad2.overallRating * (squad2.chemistry / 100) + rand(-5, 5);

  const score1 = Math.max(0, Math.round((power1 / 30) + rand(-1, 2)));
  const score2 = Math.max(0, Math.round((power2 / 30) + rand(-1, 2)));

  return {
    winner: score1 > score2 ? 1 : score2 > score1 ? 2 : 0,
    score1,
    score2,
  };
}

// Generate AI opponents for leaderboard
export function generateLeaderboard(
  allPlayers: Record<string, Player>,
  playerSquad?: UTSquad
): UTLeaderboardEntry[] {
  const entries: UTLeaderboardEntry[] = [];

  const aiNames = [
    'Shadow Elite', 'Golden Boys FC', 'Legends United', 'Prime Squad', 'Icon XI',
    'The Immortals', 'Rising Stars', 'Dynasty FC', 'All-Star XI', 'Ultimate Warriors',
    'Diamond FC', 'Platinum Squad', 'Mythical XI', 'Champions Club', 'Dream Team',
  ];

  for (const name of aiNames) {
    const rating = rand(75, 95);
    const chem = rand(50, 100);
    const wins = rand(5, 50);
    const losses = rand(2, 30);
    entries.push({
      squadName: name,
      ownerName: 'AI',
      rating,
      chemistry: chem,
      wins,
      losses,
      points: wins * 3,
    });
  }

  if (playerSquad) {
    entries.push({
      squadName: playerSquad.name,
      ownerName: 'YOU',
      rating: playerSquad.overallRating,
      chemistry: playerSquad.chemistry,
      wins: 0,
      losses: 0,
      points: 0,
    });
  }

  return entries.sort((a, b) => b.points - a.points);
}

// Special events
export function generateUTEvents(season: number): UTEvent[] {
  const events: UTEvent[] = [
    { id: `evt_toty_${season}`, name: 'Team of the Year', description: 'The best XI of the season! Special TOTY cards available.', reward: 'toty', active: true, season },
    { id: `evt_prime_${season}`, name: 'Prime Icons', description: 'Legendary players at their peak. Collect Prime Icon cards.', reward: 'prime', active: Math.random() > 0.5, season },
    { id: `evt_fut_${season}`, name: 'Future Stars', description: 'Young talents with boosted potential ratings.', reward: 'inform', active: Math.random() > 0.3, season },
  ];
  return events;
}

// Upgrade card
export function upgradeCard(card: UTCard): UTCard {
  const nextTier: Record<CardTier, CardTier> = {
    bronze: 'silver',
    silver: 'gold',
    gold: 'inform',
    inform: 'toty',
    toty: 'prime',
    prime: 'icon',
    icon: 'icon',
  };

  const newTier = nextTier[card.tier];
  const boost = getTierBoost(newTier) - getTierBoost(card.tier);

  return {
    ...card,
    tier: newTier,
    boostedRating: Math.min(99, card.boostedRating + boost),
    attributes: {
      pac: Math.min(99, card.attributes.pac + boost),
      sho: Math.min(99, card.attributes.sho + boost),
      pas: Math.min(99, card.attributes.pas + boost),
      dri: Math.min(99, card.attributes.dri + boost),
      def: Math.min(99, card.attributes.def + boost),
      phy: Math.min(99, card.attributes.phy + boost),
    },
    specialAbility: card.specialAbility || (newTier === 'icon' ? pick(SPECIAL_ABILITIES) : undefined),
  };
}
