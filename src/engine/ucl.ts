import { UCLTournament, UCLGroup, Standing, Fixture, Award, Team, Player } from './types';
import { getPlayerOverall, getTeamOverall } from './generator';
import { simulateMatch } from './simulation';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function generateUCL(
  season: number,
  leagues: { id: string; standings: Standing[]; tier: number }[],
  teams: Record<string, Team>
): UCLTournament {
  // Top 4 from each tier-1 league qualify (up to 32 teams)
  const qualifiedTeams: string[] = [];
  const tier1Leagues = leagues.filter(l => l.tier === 1);

  for (const league of tier1Leagues) {
    const sorted = [...league.standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
    // Top 4 qualify, or fewer if league has fewer teams
    const count = Math.min(4, sorted.length);
    for (let i = 0; i < count; i++) {
      if (teams[sorted[i].teamId]) {
        qualifiedTeams.push(sorted[i].teamId);
      }
    }
  }

  // Fill to 32 with next best teams by reputation
  if (qualifiedTeams.length < 32) {
    const remaining = Object.values(teams)
      .filter(t => !qualifiedTeams.includes(t.id) && leagues.some(l => l.tier === 1 && l.standings.some(s => s.teamId === t.id)))
      .sort((a, b) => b.reputation - a.reputation);
    for (const t of remaining) {
      if (qualifiedTeams.length >= 32) break;
      qualifiedTeams.push(t.id);
    }
  }

  // Pot-based draw: seed by reputation
  const seeded = [...qualifiedTeams]
    .map(id => ({ id, rep: teams[id]?.reputation || 50 }))
    .sort((a, b) => b.rep - a.rep);

  const pot1 = seeded.slice(0, 8).map(s => s.id);
  const pot2 = seeded.slice(8, 16).map(s => s.id);
  const pot3 = seeded.slice(16, 24).map(s => s.id);
  const pot4 = seeded.slice(24, 32).map(s => s.id);

  // Shuffle each pot
  const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
  const s1 = shuffle(pot1), s2 = shuffle(pot2), s3 = shuffle(pot3), s4 = shuffle(pot4);

  const groups: UCLGroup[] = [];
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  for (let g = 0; g < 8; g++) {
    const groupTeamIds = [
      s1[g] || '',
      s2[g] || '',
      s3[g] || '',
      s4[g] || '',
    ].filter(Boolean);

    const fixtures: Fixture[] = [];
    let fid = 0;

    // Round-robin (home + away = 12 matches per group)
    for (let i = 0; i < groupTeamIds.length; i++) {
      for (let j = i + 1; j < groupTeamIds.length; j++) {
        fixtures.push({
          id: `ucl-g${g}-f${fid++}`,
          homeTeamId: groupTeamIds[i],
          awayTeamId: groupTeamIds[j],
          matchday: fid,
          played: false, homeGoals: 0, awayGoals: 0, events: [],
        });
        fixtures.push({
          id: `ucl-g${g}-f${fid++}`,
          homeTeamId: groupTeamIds[j],
          awayTeamId: groupTeamIds[i],
          matchday: fid,
          played: false, homeGoals: 0, awayGoals: 0, events: [],
        });
      }
    }

    const standings: Standing[] = groupTeamIds.map(id => ({
      teamId: id, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
    }));

    groups.push({ name: groupNames[g], teamIds: groupTeamIds, fixtures, standings });
  }

  return {
    season,
    groups,
    knockoutRound: 'group',
    knockoutFixtures: [],
    awards: [],
    qualifiedTeams,
  };
}

export function simulateUCLGroupStage(
  ucl: UCLTournament,
  teams: Record<string, Team>,
  allPlayers: Record<string, Player>
): { ucl: UCLTournament; updatedPlayers: Record<string, Player> } {
  let updatedPlayers = { ...allPlayers };

  const updatedGroups = ucl.groups.map(group => {
    let fixtures = [...group.fixtures];
    let standings = group.standings.map(s => ({ ...s }));

    for (let i = 0; i < fixtures.length; i++) {
      if (fixtures[i].played) continue;
      const homeTeam = teams[fixtures[i].homeTeamId];
      const awayTeam = teams[fixtures[i].awayTeamId];
      if (!homeTeam || !awayTeam) continue;

      const result = simulateMatch(fixtures[i], homeTeam, awayTeam, updatedPlayers);
      fixtures[i] = result.fixture;
      updatedPlayers = result.updatedPlayers;

      const hs = standings.find(s => s.teamId === fixtures[i].homeTeamId)!;
      const as_ = standings.find(s => s.teamId === fixtures[i].awayTeamId)!;
      if (hs && as_) {
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
    }

    standings.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
    return { ...group, fixtures, standings };
  });

  return {
    ucl: { ...ucl, groups: updatedGroups, knockoutRound: 'r16' },
    updatedPlayers,
  };
}

export function simulateUCLKnockouts(
  ucl: UCLTournament,
  teams: Record<string, Team>,
  allPlayers: Record<string, Player>
): { ucl: UCLTournament; updatedPlayers: Record<string, Player> } {
  let updatedPlayers = { ...allPlayers };

  // Get top 2 from each group
  const qualified: string[] = [];
  for (const group of ucl.groups) {
    const sorted = [...group.standings].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
    qualified.push(...sorted.slice(0, 2).map(s => s.teamId));
  }

  const knockoutFixtures: Fixture[] = [];
  let fid = 0;

  const simulateRound = (teamIds: string[]): string[] => {
    const winners: string[] = [];
    for (let i = 0; i < teamIds.length; i += 2) {
      if (i + 1 >= teamIds.length) { winners.push(teamIds[i]); continue; }
      const homeTeam = teams[teamIds[i]];
      const awayTeam = teams[teamIds[i + 1]];
      if (!homeTeam || !awayTeam) { winners.push(teamIds[i]); continue; }

      const fixture: Fixture = {
        id: `ucl-ko-${fid++}`,
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[i + 1],
        matchday: fid, played: false, homeGoals: 0, awayGoals: 0, events: [],
      };

      const result = simulateMatch(fixture, homeTeam, awayTeam, updatedPlayers);
      updatedPlayers = result.updatedPlayers;
      knockoutFixtures.push(result.fixture);

      if (result.fixture.homeGoals === result.fixture.awayGoals) {
        winners.push(Math.random() > 0.5 ? teamIds[i] : teamIds[i + 1]);
      } else {
        winners.push(result.fixture.homeGoals > result.fixture.awayGoals ? teamIds[i] : teamIds[i + 1]);
      }
    }
    return winners;
  };

  const r16Winners = simulateRound(qualified);
  const qfWinners = simulateRound(r16Winners);
  const sfWinners = simulateRound(qfWinners);
  const finalWinners = simulateRound(sfWinners);
  const championId = finalWinners[0];
  const championTeam = teams[championId];

  // Calculate top scorer
  const goalScorers: Record<string, { name: string; goals: number }> = {};
  const allFixtures = [...ucl.groups.flatMap(g => g.fixtures), ...knockoutFixtures];
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
    awards.push({ name: 'UCL Top Scorer', playerId: topScorer[0], playerName: topScorer[1].name, season: ucl.season, value: topScorer[1].goals });
  }

  if (championTeam) {
    const bestPlayer = championTeam.squad
      .filter(p => !p.retired)
      .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a))[0];
    if (bestPlayer) {
      const name = `${bestPlayer.firstName} ${bestPlayer.lastName}`;
      awards.push({ name: 'UCL Best Player', playerId: bestPlayer.id, playerName: name, season: ucl.season });
    }
  }

  return {
    ucl: {
      ...ucl,
      knockoutRound: 'complete',
      knockoutFixtures,
      winner: championTeam?.name,
      winnerTeamId: championId,
      topScorer: topScorer ? { playerId: topScorer[0], playerName: topScorer[1].name, goals: topScorer[1].goals } : undefined,
      bestPlayer: championTeam?.squad[0] ? { playerId: championTeam.squad[0].id, playerName: `${championTeam.squad[0].firstName} ${championTeam.squad[0].lastName}` } : undefined,
      awards,
    },
    updatedPlayers,
  };
}
