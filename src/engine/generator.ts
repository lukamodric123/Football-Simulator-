import { Player, Team, Position, Tactic, ClubPersonality, PlayerAttributes, HiddenTraits, PersonalGoal, ManagerStyle, LegendType } from './types';
import { FIRST_NAMES, LAST_NAMES, NATIONALITIES, MANAGER_FIRST_NAMES, MANAGER_LAST_NAMES } from './data';

let nextId = 1;
export const uid = () => `p${nextId++}`;

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
    shooting: vary(), passing: vary(), dribbling: vary(), pace: vary(),
    defense: vary(), physicality: vary(), vision: vary(), stamina: vary(), positioning: vary(),
  };

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

const personalGoals: PersonalGoal[] = ['money', 'fame', 'legacy', 'loyalty', 'playing_time', 'international'];

export function generatePlayer(position: Position, reputation: number, ageRange?: [number, number], isLegend?: boolean): Player {
  const age = ageRange ? rand(ageRange[0], ageRange[1]) : rand(18, 35);
  let attrs = generateAttributes(position, reputation);

  // Legends get boosted attributes
  if (isLegend) {
    const keys = Object.keys(attrs) as (keyof PlayerAttributes)[];
    for (const key of keys) {
      attrs[key] = Math.min(99, attrs[key] + rand(8, 18));
    }
  }

  const overall = Math.round(Object.values(attrs).reduce((a, b) => a + b, 0) / 9);
  const potential = isLegend
    ? Math.min(99, overall + rand(5, 15))
    : Math.min(99, overall + rand(0, Math.max(0, 30 - (age - 18))));

  const legendTypes: LegendType[] = ['playmaker', 'scorer', 'defender', 'midfielder', 'goalkeeper'];
  const legendType: LegendType | undefined = isLegend
    ? position === 'GK' ? 'goalkeeper'
    : ['CB', 'LB', 'RB'].includes(position) ? 'defender'
    : ['LW', 'RW', 'ST'].includes(position) ? (Math.random() > 0.5 ? 'scorer' : 'playmaker')
    : 'midfielder'
    : undefined;

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
    careerGoals: 0,
    careerAssists: 0,
    careerAppearances: 0,
    trophies: 0,
    individualAwards: [],
    isLegend: isLegend || false,
    legendType,
    retired: false,
    personalGoal: pick(personalGoals),
    seasonHistory: [],
  };
}

export function generateSquad(reputation: number): Player[] {
  const squad: Player[] = [];
  // Small chance of a legend appearing
  const legendChance = reputation > 85 ? 0.08 : 0.02;

  for (const pw of positionWeights) {
    for (let i = 0; i < pw.count; i++) {
      const ageRange: [number, number] = i === 0 ? [22, 30] : [18, 34];
      const isLegend = Math.random() < legendChance && i === 0;
      squad.push(generatePlayer(pw.pos, reputation, ageRange, isLegend));
    }
  }
  return squad;
}

const tactics: Tactic[] = ['possession', 'counter', 'pressing', 'defensive', 'balanced'];
const personalities: ClubPersonality[] = ['big_spender', 'youth_developer', 'defensive', 'attacking', 'balanced'];
const managerStyles: ManagerStyle[] = ['tactical_genius', 'youth_developer', 'defensive_master', 'attacking_visionary', 'motivator'];

export function generateManagerName(): string {
  return `${pick(MANAGER_FIRST_NAMES)} ${pick(MANAGER_LAST_NAMES)}`;
}

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
    titles: 0,
    managerName: generateManagerName(),
    managerStyle: pick(managerStyles),
  };
}

export function getPlayerOverall(player: Player): number {
  const attrs = player.attributes;
  return Math.round(Object.values(attrs).reduce((a, b) => a + b, 0) / 9);
}

export function getTeamOverall(team: Team): number {
  if (team.squad.length === 0) return 50;
  const best11 = [...team.squad]
    .filter(p => !p.retired)
    .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a))
    .slice(0, 11);
  if (best11.length === 0) return 50;
  return Math.round(best11.reduce((s, p) => s + getPlayerOverall(p), 0) / best11.length);
}

// Age players, develop young ones, decline old ones
export function agePlayer(player: Player): Player {
  const updated = { ...player };
  updated.age += 1;
  updated.contractYears = Math.max(0, updated.contractYears - 1);

  const attrs = { ...updated.attributes };
  const keys = Object.keys(attrs) as (keyof typeof attrs)[];

  if (updated.age <= 24) {
    // Young player development
    const growthRate = Math.random() * 3 + 1;
    for (const key of keys) {
      if (attrs[key] < updated.potential) {
        attrs[key] = Math.min(99, attrs[key] + Math.round(growthRate));
      }
    }
  } else if (updated.age >= 30) {
    // Decline
    const declineRate = (updated.age - 29) * 0.8;
    for (const key of keys) {
      attrs[key] = Math.max(25, Math.round(attrs[key] - declineRate + Math.random() * 2));
    }
    // Pace and stamina decline faster
    attrs.pace = Math.max(25, Math.round(attrs.pace - declineRate * 0.5));
    attrs.stamina = Math.max(25, Math.round(attrs.stamina - declineRate * 0.5));
  }

  updated.attributes = attrs;

  // Reset season stats
  updated.goals = 0;
  updated.assists = 0;
  updated.appearances = 0;
  updated.yellowCards = 0;
  updated.redCards = 0;
  updated.form = rand(50, 85);
  updated.fatigue = 0;
  updated.injured = false;
  updated.injuryWeeks = 0;
  updated.morale = rand(55, 85);

  return updated;
}

// Check if player should retire
export function shouldRetire(player: Player): boolean {
  if (player.age < 33) return false;
  if (player.age >= 40) return true;
  const overall = getPlayerOverall(player);
  const retireChance = (player.age - 32) * 0.15 + (overall < 55 ? 0.3 : 0);
  return Math.random() < retireChance;
}

// Generate a replacement youth player
export function generateYouthPlayer(position: Position, teamReputation: number): Player {
  return generatePlayer(position, Math.max(40, teamReputation - 20), [16, 19]);
}

// Calculate GOAT score
export function calculateGOATScore(player: Player): number {
  const overall = getPlayerOverall(player);
  return Math.round(
    player.careerGoals * 1.5 +
    player.careerAssists * 1.0 +
    player.trophies * 25 +
    player.individualAwards.length * 40 +
    (player.careerAppearances / 10) * 2 +
    overall * 2 +
    (player.isLegend ? 50 : 0) +
    player.hiddenTraits.bigMatch * 0.5
  );
}
