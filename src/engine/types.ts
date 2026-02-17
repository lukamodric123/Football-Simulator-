// ===== Core Game Types =====

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  position: Position;
  attributes: PlayerAttributes;
  hiddenTraits: HiddenTraits;
  morale: number; // 0-100
  form: number; // 0-100
  fatigue: number; // 0-100 (100 = exhausted)
  injured: boolean;
  injuryWeeks: number;
  value: number; // in millions
  wage: number; // weekly wage in thousands
  goals: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
  rating: number; // average match rating
  potential: number; // max overall
  contractYears: number;
}

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';

export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'FWD';

export const positionToCategory = (pos: Position): PositionCategory => {
  if (pos === 'GK') return 'GK';
  if (['CB', 'LB', 'RB'].includes(pos)) return 'DEF';
  if (['CDM', 'CM', 'CAM'].includes(pos)) return 'MID';
  return 'FWD';
};

export interface PlayerAttributes {
  shooting: number;
  passing: number;
  dribbling: number;
  pace: number;
  defense: number;
  physicality: number;
  vision: number;
  stamina: number;
  positioning: number;
}

export interface HiddenTraits {
  leadership: number;
  consistency: number;
  bigMatch: number;
  injuryRisk: number;
  workRate: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  reputation: number; // 1-100
  budget: number; // in millions
  squad: Player[];
  tactic: Tactic;
  fanMood: FanMood;
  personality: ClubPersonality;
  color: string; // hex color
}

export type Tactic = 'possession' | 'counter' | 'pressing' | 'defensive' | 'balanced';
export type FanMood = 'ecstatic' | 'happy' | 'neutral' | 'frustrated' | 'angry';
export type ClubPersonality = 'big_spender' | 'youth_developer' | 'defensive' | 'attacking' | 'balanced';

export interface League {
  id: string;
  name: string;
  country: string;
  teams: string[]; // team IDs
  standings: Standing[];
  fixtures: Fixture[];
  currentMatchday: number;
  totalMatchdays: number;
}

export interface Standing {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface Fixture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  matchday: number;
  played: boolean;
  homeGoals: number;
  awayGoals: number;
  events: MatchEvent[];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'injury' | 'substitution';
  playerId: string;
  teamId: string;
  detail?: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  body: string;
  category: 'transfer' | 'match' | 'injury' | 'award' | 'drama' | 'youth' | 'manager';
  week: number;
  season: number;
  importance: number; // 1-5
}

export interface GameState {
  season: number;
  week: number;
  phase: GamePhase;
  leagues: League[];
  teams: Record<string, Team>;
  players: Record<string, Player>;
  news: NewsItem[];
  topScorers: { playerId: string; goals: number; leagueId: string }[];
  awards: Award[];
  initialized: boolean;
}

export type GamePhase = 'pre_season' | 'in_season' | 'transfer_window' | 'end_season';

export interface Award {
  name: string;
  playerId: string;
  season: number;
}

// League data definitions
export interface LeagueDefinition {
  id: string;
  name: string;
  country: string;
  teams: { name: string; shortName: string; reputation: number; color: string }[];
}
