// ===== Core Game Types =====

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  position: Position;
  preferredFoot: 'left' | 'right' | 'both';
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
  cleanSheets: number;
  rating: number;
  potential: number;
  contractYears: number;
  // Career
  careerGoals: number;
  careerAssists: number;
  careerAppearances: number;
  careerCleanSheets: number;
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
  cleanSheets: number;
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
  titles: number;
  managerName: string;
  managerStyle: ManagerStyle;
  // V7 additions
  stadium: Stadium;
  ffpWarning: boolean;
  trainingIntensity: TrainingIntensity;
  wageTotal: number;
}

export interface Stadium {
  name: string;
  capacity: number;
  level: number; // 1-5
  atmosphere: number; // 0-100
  upgradeCost: number;
}

export type TrainingIntensity = 'low' | 'medium' | 'high' | 'extreme';

export type Tactic = 'possession' | 'counter' | 'pressing' | 'defensive' | 'balanced';
export type FanMood = 'ecstatic' | 'happy' | 'neutral' | 'frustrated' | 'angry';
export type ClubPersonality = 'big_spender' | 'youth_developer' | 'defensive' | 'attacking' | 'balanced';
export type ManagerStyle = 'tactical_genius' | 'youth_developer' | 'defensive_master' | 'attacking_visionary' | 'motivator';

export interface League {
  id: string;
  name: string;
  country: string;
  tier: number;
  linkedLeagueId?: string;
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
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'injury' | 'substitution' | 'clean_sheet';
  playerId: string;
  teamId: string;
  detail?: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  body: string;
  category: 'transfer' | 'match' | 'injury' | 'award' | 'drama' | 'youth' | 'manager' | 'goat' | 'legend' | 'retirement' | 'takeover' | 'ucl';
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
  type: 'goals' | 'assists' | 'appearances' | 'trophies' | 'clean_sheets';
  playerId: string;
  playerName: string;
  value: number;
  season: number;
}

export type GameMode = 'universe' | 'manager' | 'survival' | 'career' | 'ultimate_team';

// Player Career Mode types
export interface CareerPlayer {
  playerId: string;
  customName: string;
  startType: 'youth' | 'small_club' | 'big_club';
  currentTeamId: string;
  seasonNumber: number; // career seasons played
  isCaptain: boolean;
  fame: number; // 0-100
  ballonDorCount: number;
  careerHighlight: string;
  storyArcs: StoryArc[];
}

export interface StoryArc {
  id: string;
  type: 'rise' | 'fall' | 'comeback' | 'rivalry' | 'dynasty' | 'underdog' | 'betrayal' | 'redemption';
  title: string;
  description: string;
  season: number;
  resolved: boolean;
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
  gameMode: GameMode;
  managedTeamId: string | null;
  goatRankings: GOATEntry[];
  allTimeRecords: AllTimeRecord[];
  retiredPlayers: Player[];
  seasonAwards: { season: number; awards: Award[] }[];
  totalSeasonsPlayed: number;
  worldCup: WorldCup | null;
  worldCupHistory: { season: number; winner: string; goldenBoot?: string; goldenBall?: string; goldenGlove?: string; runnerUp?: string; thirdPlace?: string }[];
  promotionLog: { season: number; promoted: { teamId: string; fromLeague: string; toLeague: string }[]; relegated: { teamId: string; fromLeague: string; toLeague: string }[] }[];
  ucl: UCLTournament | null;
  uclHistory: { season: number; winner: string; topScorer?: string; bestPlayer?: string }[];
  transfers: Transfer[];
  transferHistory: Transfer[];
  survivalTeams: string[];
  eliminatedTeams: string[];
  careerPlayer: CareerPlayer | null;
  storyArcs: StoryArc[];
  ballonDorHistory: { season: number; playerId: string; playerName: string; teamName: string }[];
  // V8: Manager expanded
  managerStatus: ManagerStatus | null;
  // V9: Greatest team tracker
  greatestTeamHistory: { season: number; teamId: string; teamName: string; rating: number; titles: number }[];
  clubDynastyTracker: Record<string, { titles: number; uclTitles: number; consecutiveTitles: number }>;
  managerLegacy: { teamId: string; teamName: string; managerName: string; seasonsInCharge: number; titles: number; sacked: boolean }[];
}

export interface ManagerStatus {
  approval: number;
  boardConfidence: number;
  seasonsInCharge: number;
  sacked: boolean;
  boardExpectations: BoardExpectation[];
  warningIssued: boolean;
}

export interface BoardExpectation {
  type: 'title' | 'top4' | 'avoid_relegation' | 'develop_youth' | 'profit';
  description: string;
  met: boolean;
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
  tier: number;
  linkedLeagueId?: string;
  teams: { name: string; shortName: string; reputation: number; color: string }[];
}

// World Cup types
export interface WorldCup {
  season: number;
  groups: WorldCupGroup[];
  knockoutRound: 'group' | 'r16' | 'quarter' | 'semi' | 'final' | 'complete';
  knockoutFixtures: Fixture[];
  goldenBoot?: { playerId: string; playerName: string; goals: number };
  goldenBall?: { playerId: string; playerName: string };
  goldenGlove?: { playerId: string; playerName: string; cleanSheets: number };
  teamOfTournament?: { playerId: string; playerName: string; position: Position; country: string }[];
  winner?: string;
  runnerUp?: string;
  thirdPlace?: string;
  awards: Award[];
}

export interface WorldCupGroup {
  name: string;
  teams: WorldCupTeam[];
  fixtures: Fixture[];
  standings: Standing[];
}

export interface WorldCupTeam {
  id: string;
  country: string;
  squad: Player[];
  rating: number;
}

// UCL types
export interface UCLTournament {
  season: number;
  groups: UCLGroup[];
  knockoutRound: 'group' | 'r16' | 'quarter' | 'semi' | 'final' | 'complete';
  knockoutFixtures: Fixture[];
  topScorer?: { playerId: string; playerName: string; goals: number };
  bestPlayer?: { playerId: string; playerName: string };
  winner?: string; // team name
  winnerTeamId?: string;
  awards: Award[];
  qualifiedTeams: string[]; // team IDs that qualified
}

export interface UCLGroup {
  name: string;
  teamIds: string[];
  fixtures: Fixture[];
  standings: Standing[];
}

// Transfer types
export interface Transfer {
  id: string;
  playerId: string;
  playerName: string;
  fromTeamId: string;
  fromTeamName: string;
  toTeamId: string;
  toTeamName: string;
  fee: number;
  season: number;
  type: 'buy' | 'free' | 'loan';
}
