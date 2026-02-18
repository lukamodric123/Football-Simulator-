import { WorldCup, WorldCupGroup, WorldCupTeam, Player, Standing, Fixture, Award } from './types';
import { WORLD_CUP_NATIONS } from './data';
import { generatePlayer, getPlayerOverall, uid } from './generator';
import { simulateMatch } from './simulation';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function buildNationalTeam(country: string, reputation: number, allPlayers: Record<string, Player>): WorldCupTeam {
  // Select best players from that nationality
  const nationals = Object.values(allPlayers)
    .filter(p => p.nationality === country && !p.retired && !p.injured)
    .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));

  let squad: Player[] = [];
  if (nationals.length >= 23) {
    squad = nationals.slice(0, 23);
  } else {
    squad = [...nationals];
    // Fill remaining with generated players
    const positions: Array<'GK' | 'CB' | 'CM' | 'ST'> = ['GK', 'CB', 'CM', 'ST'];
    while (squad.length < 23) {
      const pos = positions[squad.length % positions.length];
      const p = generatePlayer(pos, reputation, [22, 30]);
      p.nationality = country;
      squad.push(p);
    }
  }

  const rating = squad.length > 0
    ? Math.round(squad.slice(0, 11).reduce((s, p) => s + getPlayerOverall(p), 0) / 11)
    : reputation;

  return {
    id: `wc-${country.toLowerCase().replace(/\s/g, '-')}`,
    country,
    squad,
    rating,
  };
}

function createWCTeamAsTeam(wt: WorldCupTeam) {
  return {
    id: wt.id,
    name: wt.country,
    shortName: wt.country.slice(0, 3).toUpperCase(),
    leagueId: 'world-cup',
    reputation: wt.rating,
    budget: 0,
    squad: wt.squad,
    tactic: 'balanced' as const,
    fanMood: 'neutral' as const,
    personality: 'balanced' as const,
    color: '#FFD700',
    titles: 0,
    managerName: '',
    managerStyle: 'tactical_genius' as const,
  };
}

export function generateWorldCup(season: number, allPlayers: Record<string, Player>): WorldCup {
  // Build 32 national teams
  const nations = WORLD_CUP_NATIONS.map(n => buildNationalTeam(n.country, n.reputation, allPlayers));

  // Shuffle and create 8 groups of 4
  const shuffled = [...nations].sort(() => Math.random() - 0.5);
  const groups: WorldCupGroup[] = [];
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  for (let g = 0; g < 8; g++) {
    const groupTeams = shuffled.slice(g * 4, g * 4 + 4);
    const fixtures: Fixture[] = [];
    let fid = 0;

    // Round-robin within group (6 matches)
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        fixtures.push({
          id: `wc-g${g}-f${fid++}`,
          homeTeamId: groupTeams[i].id,
          awayTeamId: groupTeams[j].id,
          matchday: fid,
          played: false,
          homeGoals: 0,
          awayGoals: 0,
          events: [],
        });
      }
    }

    const standings: Standing[] = groupTeams.map(t => ({
      teamId: t.id,
      played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
    }));

    groups.push({ name: groupNames[g], teams: groupTeams, fixtures, standings });
  }

  return {
    season,
    groups,
    knockoutRound: 'group',
    knockoutFixtures: [],
    awards: [],
  };
}

export function simulateWorldCupGroupStage(wc: WorldCup, allPlayers: Record<string, Player>): { worldCup: WorldCup; updatedPlayers: Record<string, Player> } {
  let updatedPlayers = { ...allPlayers };

  const updatedGroups = wc.groups.map(group => {
    let fixtures = [...group.fixtures];
    let standings = group.standings.map(s => ({ ...s }));

    for (let i = 0; i < fixtures.length; i++) {
      if (fixtures[i].played) continue;
      const homeWT = group.teams.find(t => t.id === fixtures[i].homeTeamId)!;
      const awayWT = group.teams.find(t => t.id === fixtures[i].awayTeamId)!;
      const homeTeam = createWCTeamAsTeam(homeWT);
      const awayTeam = createWCTeamAsTeam(awayWT);

      const result = simulateMatch(fixtures[i], homeTeam, awayTeam, updatedPlayers);
      fixtures[i] = result.fixture;
      updatedPlayers = result.updatedPlayers;

      const hs = standings.find(s => s.teamId === homeWT.id)!;
      const as_ = standings.find(s => s.teamId === awayWT.id)!;
      hs.played++; as_.played++;
      hs.goalsFor += result.fixture.homeGoals;
      hs.goalsAgainst += result.fixture.awayGoals;
      as_.goalsFor += result.fixture.awayGoals;
      as_.goalsAgainst += result.fixture.homeGoals;
      if (result.fixture.homeGoals > result.fixture.awayGoals) {
        hs.won++; hs.points += 3; as_.lost++;
      } else if (result.fixture.homeGoals < result.fixture.awayGoals) {
        as_.won++; as_.points += 3; hs.lost++;
      } else {
        hs.drawn++; as_.drawn++; hs.points++; as_.points++;
      }
    }

    standings.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
    return { ...group, fixtures, standings };
  });

  return {
    worldCup: { ...wc, groups: updatedGroups, knockoutRound: 'r16' },
    updatedPlayers,
  };
}

export function simulateWorldCupKnockouts(wc: WorldCup, allPlayers: Record<string, Player>): { worldCup: WorldCup; updatedPlayers: Record<string, Player> } {
  let updatedPlayers = { ...allPlayers };
  const allTeams = wc.groups.flatMap(g => g.teams);

  // Get top 2 from each group
  const qualified: WorldCupTeam[] = [];
  for (const group of wc.groups) {
    const sorted = [...group.standings].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
    const top2 = sorted.slice(0, 2).map(s => allTeams.find(t => t.id === s.teamId)!);
    qualified.push(...top2);
  }

  const knockoutFixtures: Fixture[] = [];
  let fid = 0;

  // Simulate knockout rounds
  const simulateRound = (teams: WorldCupTeam[]): WorldCupTeam[] => {
    const winners: WorldCupTeam[] = [];
    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 >= teams.length) { winners.push(teams[i]); continue; }
      const home = teams[i];
      const away = teams[i + 1];
      const fixture: Fixture = {
        id: `wc-ko-${fid++}`,
        homeTeamId: home.id,
        awayTeamId: away.id,
        matchday: fid,
        played: false,
        homeGoals: 0,
        awayGoals: 0,
        events: [],
      };
      const result = simulateMatch(fixture, createWCTeamAsTeam(home), createWCTeamAsTeam(away), updatedPlayers);
      updatedPlayers = result.updatedPlayers;
      knockoutFixtures.push(result.fixture);

      // Handle draws with penalty shootout
      if (result.fixture.homeGoals === result.fixture.awayGoals) {
        winners.push(Math.random() > 0.5 ? home : away);
      } else {
        winners.push(result.fixture.homeGoals > result.fixture.awayGoals ? home : away);
      }
    }
    return winners;
  };

  // R16 → QF → SF → Final
  const r16Winners = simulateRound(qualified);
  const qfWinners = simulateRound(r16Winners);
  const sfWinners = simulateRound(qfWinners);
  const finalWinners = simulateRound(sfWinners);
  const champion = finalWinners[0];

  // Calculate awards
  const goalScorers: Record<string, { name: string; goals: number }> = {};
  const allFixtures = [...wc.groups.flatMap(g => g.fixtures), ...knockoutFixtures];
  for (const f of allFixtures) {
    for (const e of f.events) {
      if (e.type === 'goal') {
        const p = updatedPlayers[e.playerId];
        if (p) {
          const name = `${p.firstName} ${p.lastName}`;
          if (!goalScorers[e.playerId]) goalScorers[e.playerId] = { name, goals: 0 };
          goalScorers[e.playerId].goals++;
        }
      }
    }
  }

  const topScorer = Object.entries(goalScorers).sort((a, b) => b[1].goals - a[1].goals)[0];
  const awards: Award[] = [];
  
  if (topScorer) {
    awards.push({ name: 'WC Golden Boot', playerId: topScorer[0], playerName: topScorer[1].name, season: wc.season, value: topScorer[1].goals });
  }

  // Golden Ball - best player (pick from champion team)
  if (champion) {
    const bestPlayer = champion.squad.sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a))[0];
    if (bestPlayer) {
      const name = `${bestPlayer.firstName} ${bestPlayer.lastName}`;
      awards.push({ name: 'WC Golden Ball', playerId: bestPlayer.id, playerName: name, season: wc.season });
    }
  }

  return {
    worldCup: {
      ...wc,
      knockoutRound: 'complete',
      knockoutFixtures,
      winner: champion?.country,
      goldenBoot: topScorer ? { playerId: topScorer[0], playerName: topScorer[1].name, goals: topScorer[1].goals } : undefined,
      goldenBall: champion?.squad[0] ? { playerId: champion.squad[0].id, playerName: `${champion.squad[0].firstName} ${champion.squad[0].lastName}` } : undefined,
      awards,
    },
    updatedPlayers,
  };
}
