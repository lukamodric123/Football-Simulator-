import { DomesticCup, Fixture, Team, Player, League, NewsItem } from './types';
import { simulateMatch } from './simulation';

const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const CUP_NAMES: Record<string, string> = {
  'eng-1': 'FA Cup',
  'esp-1': 'Copa del Rey',
  'ger-1': 'DFB-Pokal',
  'ita-1': 'Coppa Italia',
  'fra-1': 'Coupe de France',
};

let fid = 0;
const nextId = () => `cup-${fid++}`;

export function generateDomesticCups(season: number, leagues: League[], teams: Record<string, Team>): DomesticCup[] {
  const cups: DomesticCup[] = [];
  const tier1 = leagues.filter(l => l.tier === 1);
  for (const top of tier1) {
    const linkedId = top.linkedLeagueId;
    const allCountryTeams = [...top.teams];
    if (linkedId) {
      const tier2 = leagues.find(l => l.id === linkedId);
      if (tier2) allCountryTeams.push(...tier2.teams);
    }
    // pick up to 32 teams
    const shuffled = allCountryTeams.sort(() => Math.random() - 0.5).slice(0, 32);
    if (shuffled.length < 4) continue;
    cups.push({
      id: `${top.id}-cup-${season}`,
      name: CUP_NAMES[top.id] || `${top.country} Cup`,
      leagueId: top.id,
      season,
      round: 'r32',
      fixtures: [],
      remainingTeamIds: shuffled,
    });
  }
  return cups;
}

function nextRound(round: DomesticCup['round']): DomesticCup['round'] {
  if (round === 'r32') return 'r16';
  if (round === 'r16') return 'qf';
  if (round === 'qf') return 'sf';
  if (round === 'sf') return 'final';
  return 'complete';
}

export function simulateCupRound(
  cup: DomesticCup,
  teams: Record<string, Team>,
  players: Record<string, Player>
): { cup: DomesticCup; players: Record<string, Player>; news: NewsItem[] } {
  if (cup.round === 'complete') return { cup, players, news: [] };
  let updatedPlayers = { ...players };
  const news: NewsItem[] = [];
  const remaining = [...cup.remainingTeamIds].sort(() => Math.random() - 0.5);
  const winners: string[] = [];
  const newFixtures: Fixture[] = [];

  for (let i = 0; i < remaining.length; i += 2) {
    if (i + 1 >= remaining.length) { winners.push(remaining[i]); continue; }
    const homeId = remaining[i];
    const awayId = remaining[i + 1];
    const home = teams[homeId];
    const away = teams[awayId];
    if (!home || !away) { winners.push(homeId); continue; }
    const fixture: Fixture = {
      id: nextId(), homeTeamId: homeId, awayTeamId: awayId, matchday: 0,
      played: false, homeGoals: 0, awayGoals: 0, events: [],
    };
    const result = simulateMatch(fixture, home, away, updatedPlayers);
    updatedPlayers = result.updatedPlayers;
    newFixtures.push(result.fixture);
    let winner = homeId;
    if (result.fixture.homeGoals > result.fixture.awayGoals) winner = homeId;
    else if (result.fixture.awayGoals > result.fixture.homeGoals) winner = awayId;
    else winner = Math.random() > 0.5 ? homeId : awayId; // pens
    // Upset news
    if ((winner === awayId && away.reputation < home.reputation - 12) ||
        (winner === homeId && home.reputation < away.reputation - 12)) {
      news.push({
        id: `cup-news-${Date.now()}-${i}`,
        headline: `🤯 CUP UPSET: ${teams[winner].name} stun ${teams[winner === homeId ? awayId : homeId].name} ${result.fixture.homeGoals}-${result.fixture.awayGoals} in the ${cup.name}!`,
        body: '', category: 'match', week: 0, season: cup.season, importance: 4,
      });
    }
    winners.push(winner);
  }

  const newRound = nextRound(cup.round);
  const updatedCup: DomesticCup = {
    ...cup,
    round: newRound === 'complete' ? 'complete' : newRound,
    fixtures: [...cup.fixtures, ...newFixtures],
    remainingTeamIds: winners,
  };

  if (cup.round === 'final') {
    updatedCup.round = 'complete';
    updatedCup.winnerTeamId = winners[0];
    const loser = newFixtures[0];
    updatedCup.runnerUpTeamId = loser.homeTeamId === winners[0] ? loser.awayTeamId : loser.homeTeamId;
    const winTeam = teams[winners[0]];
    if (winTeam) {
      news.push({
        id: `cup-final-${cup.id}`,
        headline: `🏆 ${cup.name} CHAMPIONS: ${winTeam.name} lift the trophy!`,
        body: '', category: 'award', week: 0, season: cup.season, importance: 5,
      });
    }
  }

  return { cup: updatedCup, players: updatedPlayers, news };
}
