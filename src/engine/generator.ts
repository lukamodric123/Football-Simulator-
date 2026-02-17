import { Player, Team, Position, Tactic, ClubPersonality, PlayerAttributes, HiddenTraits } from './types';
import { FIRST_NAMES, LAST_NAMES, NATIONALITIES } from './data';

let nextId = 1;
const uid = () => `p${nextId++}`;

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const positionWeights: { pos: Position; count: number }[] = [
  { pos: 'GK', count: 2 },
  { pos: 'CB', count: 4 },
  { pos: 'LB', count: 2 },
  { pos: 'RB', count: 2 },
  { pos: 'CDM', count: 2 },
  { pos: 'CM', count: 3 },
  { pos: 'CAM', count: 2 },
  { pos: 'LW', count: 2 },
  { pos: 'RW', count: 2 },
  { pos: 'ST', count: 3 },
];

function generateAttributes(position: Position, reputation: number): PlayerAttributes {
  const base = Math.max(40, reputation - 25 + rand(-10, 10));
  const vary = () => Math.min(99, Math.max(30, base + rand(-15, 15)));

  const attrs: PlayerAttributes = {
    shooting: vary(),
    passing: vary(),
    dribbling: vary(),
    pace: vary(),
    defense: vary(),
    physicality: vary(),
    vision: vary(),
    stamina: vary(),
    positioning: vary(),
  };

  // Position-specific boosts
  if (position === 'GK') {
    attrs.positioning = Math.min(99, attrs.positioning + 15);
    attrs.physicality = Math.min(99, attrs.physicality + 10);
    attrs.shooting = Math.max(20, attrs.shooting - 20);
  } else if (['CB', 'LB', 'RB'].includes(position)) {
    attrs.defense = Math.min(99, attrs.defense + 15);
    attrs.physicality = Math.min(99, attrs.physicality + 8);
  } else if (['CDM', 'CM'].includes(position)) {
    attrs.passing = Math.min(99, attrs.passing + 10);
    attrs.vision = Math.min(99, attrs.vision + 10);
  } else if (position === 'CAM') {
    attrs.vision = Math.min(99, attrs.vision + 15);
    attrs.dribbling = Math.min(99, attrs.dribbling + 10);
  } else if (['LW', 'RW'].includes(position)) {
    attrs.pace = Math.min(99, attrs.pace + 15);
    attrs.dribbling = Math.min(99, attrs.dribbling + 10);
  } else if (position === 'ST') {
    attrs.shooting = Math.min(99, attrs.shooting + 18);
    attrs.positioning = Math.min(99, attrs.positioning + 10);
  }

  return attrs;
}

function generateHiddenTraits(): HiddenTraits {
  return {
    leadership: rand(20, 95),
    consistency: rand(30, 95),
    bigMatch: rand(20, 95),
    injuryRisk: rand(5, 60),
    workRate: rand(30, 99),
  };
}

export function generatePlayer(position: Position, reputation: number, ageRange?: [number, number]): Player {
  const age = ageRange ? rand(ageRange[0], ageRange[1]) : rand(18, 35);
  const attrs = generateAttributes(position, reputation);
  const overall = Math.round(Object.values(attrs).reduce((a, b) => a + b, 0) / 9);
  const potential = Math.min(99, overall + rand(0, Math.max(0, 30 - (age - 18))));

  return {
    id: uid(),
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    age,
    nationality: pick(NATIONALITIES),
    position,
    attributes: attrs,
    hiddenTraits: generateHiddenTraits(),
    morale: rand(60, 90),
    form: rand(50, 85),
    fatigue: rand(0, 30),
    injured: false,
    injuryWeeks: 0,
    value: Math.round((overall / 10) * (potential / 10) * (1 - (age - 22) * 0.03) * rand(5, 15)),
    wage: Math.round(overall * rand(1, 4)),
    goals: 0,
    assists: 0,
    appearances: 0,
    yellowCards: 0,
    redCards: 0,
    rating: 0,
    potential,
    contractYears: rand(1, 5),
  };
}

export function generateSquad(reputation: number): Player[] {
  const squad: Player[] = [];
  for (const pw of positionWeights) {
    for (let i = 0; i < pw.count; i++) {
      const ageRange: [number, number] = i === 0 ? [22, 30] : [18, 34];
      squad.push(generatePlayer(pw.pos, reputation, ageRange));
    }
  }
  return squad;
}

const tactics: Tactic[] = ['possession', 'counter', 'pressing', 'defensive', 'balanced'];
const personalities: ClubPersonality[] = ['big_spender', 'youth_developer', 'defensive', 'attacking', 'balanced'];

export function generateTeam(
  name: string,
  shortName: string,
  leagueId: string,
  reputation: number,
  color: string
): Team {
  const squad = generateSquad(reputation);
  return {
    id: `${leagueId}-${shortName.toLowerCase()}`,
    name,
    shortName,
    leagueId,
    reputation,
    budget: Math.round(reputation * rand(1, 5)),
    squad,
    tactic: reputation > 80 ? pick(['possession', 'pressing']) : pick(tactics),
    fanMood: 'neutral',
    personality: reputation > 85 ? pick(['big_spender', 'attacking']) : pick(personalities),
    color,
  };
}

export function getPlayerOverall(player: Player): number {
  const attrs = player.attributes;
  return Math.round(Object.values(attrs).reduce((a, b) => a + b, 0) / 9);
}

export function getTeamOverall(team: Team): number {
  if (team.squad.length === 0) return 50;
  const best11 = [...team.squad]
    .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a))
    .slice(0, 11);
  return Math.round(best11.reduce((s, p) => s + getPlayerOverall(p), 0) / 11);
}
