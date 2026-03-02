import { Team, Player, NewsItem } from './types';
import { getPlayerOverall } from './generator';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Agent names
const AGENTS = [
  'Jorge Mendes', 'Mino Raiola Jr', 'Pini Zahavi', 'Fali Ramadani', 'Jonathan Barnett',
  'Volker Struth', 'Kia Joorabchian', 'Federico Pastorello', 'Giuliano Bertolucci', 'Stellar Group',
];

export interface AgentInfo {
  name: string;
  greed: number; // 0-100, affects wage demands
  difficulty: number; // 0-100, affects negotiation difficulty
}

export interface ReleaseClause {
  playerId: string;
  amount: number;
  active: boolean;
}

export interface BoardExpectation {
  type: 'title' | 'top4' | 'avoid_relegation' | 'develop_youth' | 'profit';
  description: string;
  met: boolean;
}

export interface ManagerStatus {
  approval: number; // 0-100 fan approval meter
  boardConfidence: number; // 0-100
  seasonsInCharge: number;
  sacked: boolean;
  boardExpectations: BoardExpectation[];
  warningIssued: boolean;
}

export function generateAgent(): AgentInfo {
  return {
    name: pick(AGENTS),
    greed: rand(30, 90),
    difficulty: rand(20, 80),
  };
}

export function generateBoardExpectations(team: Team, season: number): BoardExpectation[] {
  const expectations: BoardExpectation[] = [];

  if (team.reputation >= 88) {
    expectations.push({ type: 'title', description: 'Win the league title', met: false });
  } else if (team.reputation >= 75) {
    expectations.push({ type: 'top4', description: 'Finish in the top 4', met: false });
  } else {
    expectations.push({ type: 'avoid_relegation', description: 'Avoid relegation', met: false });
  }

  if (team.personality === 'youth_developer') {
    expectations.push({ type: 'develop_youth', description: 'Develop young talent (play U23 players)', met: false });
  }

  if (team.ffpWarning) {
    expectations.push({ type: 'profit', description: 'Reduce wage bill and balance finances', met: false });
  }

  return expectations;
}

export function evaluateManagerPerformance(
  team: Team,
  leaguePosition: number,
  totalTeams: number,
  managerStatus: ManagerStatus,
  season: number
): { status: ManagerStatus; news: NewsItem[] } {
  const updated = { ...managerStatus };
  const news: NewsItem[] = [];

  // Evaluate board expectations
  for (const exp of updated.boardExpectations) {
    switch (exp.type) {
      case 'title':
        exp.met = leaguePosition === 1;
        break;
      case 'top4':
        exp.met = leaguePosition <= 4;
        break;
      case 'avoid_relegation':
        exp.met = leaguePosition <= totalTeams - 3;
        break;
      case 'develop_youth':
        exp.met = team.squad.filter(p => !p.retired && p.age <= 22).length >= 3;
        break;
      case 'profit':
        exp.met = !team.ffpWarning;
        break;
    }
  }

  const metCount = updated.boardExpectations.filter(e => e.met).length;
  const totalExp = updated.boardExpectations.length;
  const metRatio = totalExp > 0 ? metCount / totalExp : 0.5;

  // Update fan approval based on league position
  const positionRatio = leaguePosition / totalTeams;
  if (positionRatio <= 0.1) updated.approval = Math.min(100, updated.approval + 15);
  else if (positionRatio <= 0.25) updated.approval = Math.min(100, updated.approval + 8);
  else if (positionRatio <= 0.5) updated.approval = Math.max(0, updated.approval - 3);
  else if (positionRatio <= 0.75) updated.approval = Math.max(0, updated.approval - 10);
  else updated.approval = Math.max(0, updated.approval - 20);

  // Board confidence
  if (metRatio >= 0.8) updated.boardConfidence = Math.min(100, updated.boardConfidence + 12);
  else if (metRatio >= 0.5) updated.boardConfidence = Math.min(100, updated.boardConfidence + 3);
  else if (metRatio < 0.3) updated.boardConfidence = Math.max(0, updated.boardConfidence - 20);
  else updated.boardConfidence = Math.max(0, updated.boardConfidence - 8);

  updated.seasonsInCharge += 1;

  // Sacking logic
  if (updated.boardConfidence < 20 && updated.seasonsInCharge >= 2) {
    updated.sacked = true;
    news.push({
      id: `sacked_${season}`,
      headline: `🔴 SACKED! ${team.name} have parted ways with their manager after disappointing results.`,
      body: `Board confidence dropped to ${updated.boardConfidence}%. Fan approval: ${updated.approval}%.`,
      category: 'manager',
      week: 0,
      season,
      importance: 5,
    });
  } else if (updated.boardConfidence < 35 && !updated.warningIssued) {
    updated.warningIssued = true;
    news.push({
      id: `warning_${season}`,
      headline: `⚠️ ${team.name} board issues official WARNING to manager. Improve or face the sack!`,
      body: '',
      category: 'manager',
      week: 0,
      season,
      importance: 4,
    });
  } else if (updated.approval >= 80) {
    news.push({
      id: `fan_love_${season}`,
      headline: `❤️ ${team.name} fans chant manager's name! Approval at ${updated.approval}%.`,
      body: '',
      category: 'drama',
      week: 0,
      season,
      importance: 3,
    });
  }

  return { status: updated, news };
}

// Enhanced transfer negotiation with agents
export function calculateAgentDemands(
  player: Player,
  agent: AgentInfo,
  buyingTeamRep: number
): { signingBonus: number; wageMultiplier: number; releaseClause: number } {
  const ovr = getPlayerOverall(player);
  const greedFactor = agent.greed / 100;

  const signingBonus = Math.round(player.value * 0.1 * (1 + greedFactor));
  const wageMultiplier = 1.0 + greedFactor * 0.5 + (ovr > 85 ? 0.3 : 0);
  const releaseClause = Math.round(player.value * (2 + greedFactor * 2));

  return { signingBonus, wageMultiplier, releaseClause };
}

// Transfer hijack system
export function checkTransferHijack(
  player: Player,
  buyingTeam: Team,
  allTeams: Record<string, Team>,
  fee: number
): { hijacked: boolean; hijacker?: Team; hijackFee?: number } {
  if (Math.random() > 0.15) return { hijacked: false }; // 15% chance

  const rivals = Object.values(allTeams).filter(t =>
    t.id !== buyingTeam.id &&
    t.reputation >= buyingTeam.reputation - 5 &&
    t.budget > fee * 1.2 &&
    t.squad.filter(p => !p.retired).length < 28
  );

  if (rivals.length === 0) return { hijacked: false };

  const hijacker = pick(rivals);
  const hijackFee = Math.round(fee * (1.1 + Math.random() * 0.3));

  return { hijacked: true, hijacker, hijackFee };
}

// Realistic signing prices
export function calculateTransferFee(
  player: Player,
  sellingTeam: Team | null,
  buyingTeam: Team
): number {
  const ovr = getPlayerOverall(player);
  const age = player.age;
  const potential = player.potential;
  const contractYears = player.contractYears;

  // Base value tiers
  let base: number;
  if (ovr >= 88) base = rand(100, 200); // Prime superstar
  else if (ovr >= 82) base = rand(40, 90); // Elite
  else if (ovr >= 75) base = rand(15, 45); // Good
  else if (ovr >= 68) base = rand(5, 20); // Rotation
  else base = rand(1, 8); // Squad player

  // Age adjustments
  if (age <= 21) base = Math.round(base * 1.4); // Young premium
  else if (age <= 25) base = Math.round(base * 1.2);
  else if (age >= 31) base = Math.round(base * 0.5);
  else if (age >= 33) base = Math.round(base * 0.25);

  // Potential premium for young players
  if (age <= 23 && potential >= 90) base = Math.round(base * 1.3);

  // Contract leverage
  if (contractYears <= 1) base = Math.round(base * 0.6);
  else if (contractYears >= 4) base = Math.round(base * 1.15);

  // Selling club premium
  if (sellingTeam && sellingTeam.reputation >= 85) base = Math.round(base * 1.2);

  // Position premium
  if (['ST', 'CAM', 'LW', 'RW'].includes(player.position)) base = Math.round(base * 1.1);

  return Math.max(1, base);
}

// Player personality traits
export type PersonalityTrait = 'leader' | 'loyal' | 'aggressive' | 'clutch' | 'showboat' | 'professional' | 'mercenary' | 'introvert';

export function generatePersonalityTraits(player: Player): PersonalityTrait[] {
  const traits: PersonalityTrait[] = [];

  if (player.hiddenTraits.leadership >= 80) traits.push('leader');
  if (player.hiddenTraits.bigMatch >= 85) traits.push('clutch');
  if (player.hiddenTraits.consistency >= 85) traits.push('professional');
  if (player.personalGoal === 'loyalty') traits.push('loyal');
  if (player.personalGoal === 'money') traits.push('mercenary');
  if (player.hiddenTraits.workRate < 40) traits.push('introvert');
  if (player.attributes.physicality >= 85 && player.hiddenTraits.workRate >= 80) traits.push('aggressive');
  if (player.attributes.dribbling >= 90 && player.hiddenTraits.consistency < 70) traits.push('showboat');

  // Ensure at least one trait
  if (traits.length === 0) {
    const defaults: PersonalityTrait[] = ['professional', 'introvert'];
    traits.push(pick(defaults));
  }

  return traits.slice(0, 3);
}
