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
  morale: number;
  form: number;
  fatigue: number;
  injured: boolean;
  injuryWeeks: number;
  value: number;
  wage: number;
  goals: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
  rating: number;
  potential: number;
  contractYears: number;
  // V2 additions
  careerGoals: number;
  careerAssists: number;
  careerAppearances: number;
  trophies: number;
  individualAwards: string[];
  isLegend: boolean;
  legendType?: LegendType;
  retired: boolean;
  retiredSeason?: number;
  personalGoal: PersonalGoal;
  seasonHistory: SeasonRecord[];
}

export type LegendType = 'playmaker' | 'scorer' | 'defender' | 'midfielder' | 'goalkeeper';
export type PersonalGoal = 'money' | 'fame' | 'legacy' | 'loyalty' | 'playing_time' | 'international';

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

export interface SeasonRecord {
  season: number;
  teamId: string;
  goals: number;
  assists: number;
  appearances: number;
  rating: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  reputation: number;
  budget: number;
  squad: Player[];
  tactic: Tactic;
  fanMood: FanMood;
  personality: ClubPersonality;
  color: string;
  // V2 additions
  titles: number;
  managerName: string;
  managerStyle: ManagerStyle;
}

export type Tactic = 'possession' | 'counter' | 'pressing' | 'defensive' | 'balanced';
export type FanMood = 'ecstatic' | 'happy' | 'neutral' | 'frustrated' | 'angry';
export type ClubPersonality = 'big_spender' | 'youth_developer' | 'defensive' | 'attacking' | 'balanced';
export type ManagerStyle = 'tactical_genius' | 'youth_developer' | 'defensive_master' | 'attacking_visionary' | 'motivator';

export interface League {
  id: string;
  name: string;
  country: string;
  teams: string[];
  standings: Standing[];
  fixtures: Fixture[];
  currentMatchday: number;
  totalMatchdays: number;
  champions: { season: number; teamId: string }[];
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
  category: 'transfer' | 'match' | 'injury' | 'award' | 'drama' | 'youth' | 'manager' | 'goat' | 'legend' | 'retirement' | 'takeover';
  week: number;
  season: number;
  importance: number;
}

export interface GOATEntry {
  playerId: string;
  playerName: string;
  score: number;
  careerGoals: number;
  careerAssists: number;
  trophies: number;
  awards: number;
  peakOverall: number;
  seasonsPlayed: number;
  retired: boolean;
}

export interface AllTimeRecord {
  type: 'goals' | 'assists' | 'appearances' | 'trophies';
  playerId: string;
  playerName: string;
  value: number;
  season: number;
}

export type GameMode = 'universe' | 'manager';

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
  // V2 additions
  gameMode: GameMode;
  managedTeamId: string | null;
  goatRankings: GOATEntry[];
  allTimeRecords: AllTimeRecord[];
  retiredPlayers: Player[];
  seasonAwards: { season: number; awards: Award[] }[];
  totalSeasonsPlayed: number;
}

export type GamePhase = 'pre_season' | 'in_season' | 'transfer_window' | 'end_season';

export interface Award {
  name: string;
  playerId: string;
  playerName?: string;
  teamName?: string;
  season: number;
  value?: number;
}

export interface LeagueDefinition {
  id: string;
  name: string;
  country: string;
  teams: { name: string; shortName: string; reputation: number; color: string }[];
}
