import { Fixture, MatchEvent, Team, Player, GameState } from './types';
import { getTeamOverall, getPlayerOverall } from './generator';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function getAttackers(team: Team): Player[] {
  return team.squad.filter(p => ['ST', 'LW', 'RW', 'CAM'].includes(p.position) && !p.injured);
}

function getMidfielders(team: Team): Player[] {
  return team.squad.filter(p => ['CM', 'CDM', 'CAM'].includes(p.position) && !p.injured);
}

export function simulateMatch(
  fixture: Fixture,
  homeTeam: Team,
  awayTeam: Team,
  players: Record<string, Player>
): { fixture: Fixture; updatedPlayers: Record<string, Player> } {
  const homeRating = getTeamOverall(homeTeam);
  const awayRating = getTeamOverall(awayTeam);

  // Home advantage
  const homeStrength = homeRating + 5;
  const awayStrength = awayRating;

  // Tactic modifiers
  const tacticAttackBonus: Record<string, number> = {
    possession: 3, counter: 2, pressing: 4, defensive: -2, balanced: 0,
  };
  const tacticDefenseBonus: Record<string, number> = {
    possession: 1, counter: 3, pressing: -1, defensive: 5, balanced: 2,
  };

  const homeAttack = homeStrength + (tacticAttackBonus[homeTeam.tactic] || 0);
  const homeDefense = homeStrength + (tacticDefenseBonus[homeTeam.tactic] || 0);
  const awayAttack = awayStrength + (tacticAttackBonus[awayTeam.tactic] || 0);
  const awayDefense = awayStrength + (tacticDefenseBonus[awayTeam.tactic] || 0);

  // Goal calculation
  const homeXG = Math.max(0, (homeAttack - awayDefense + 50) / 30);
  const awayXG = Math.max(0, (awayAttack - homeDefense + 45) / 30);

  let homeGoals = 0;
  let awayGoals = 0;
  const events: MatchEvent[] = [];

  // Simulate scoring chances
  const homeChances = rand(3, 8);
  const awayChances = rand(2, 7);

  for (let i = 0; i < homeChances; i++) {
    if (Math.random() < homeXG / 5) {
      homeGoals++;
      const scorers = getAttackers(homeTeam);
      const midfielders = getMidfielders(homeTeam);
      const scorer = scorers.length > 0 ? pick(scorers) : pick(homeTeam.squad.filter(p => !p.injured));
      const minute = rand(1, 90);
      events.push({ minute, type: 'goal', playerId: scorer.id, teamId: homeTeam.id });
      if (Math.random() > 0.3 && midfielders.length > 0) {
        const assister = pick(midfielders);
        events.push({ minute, type: 'assist', playerId: assister.id, teamId: homeTeam.id });
      }
    }
  }

  for (let i = 0; i < awayChances; i++) {
    if (Math.random() < awayXG / 5) {
      awayGoals++;
      const scorers = getAttackers(awayTeam);
      const midfielders = getMidfielders(awayTeam);
      const scorer = scorers.length > 0 ? pick(scorers) : pick(awayTeam.squad.filter(p => !p.injured));
      const minute = rand(1, 90);
      events.push({ minute, type: 'goal', playerId: scorer.id, teamId: awayTeam.id });
      if (Math.random() > 0.3 && midfielders.length > 0) {
        const assister = pick(midfielders);
        events.push({ minute, type: 'assist', playerId: assister.id, teamId: awayTeam.id });
      }
    }
  }

  // Cards
  const allPlayers = [...homeTeam.squad, ...awayTeam.squad].filter(p => !p.injured);
  for (const p of allPlayers) {
    if (Math.random() < 0.08) {
      events.push({
        minute: rand(1, 90),
        type: 'yellow_card',
        playerId: p.id,
        teamId: homeTeam.squad.includes(p) ? homeTeam.id : awayTeam.id,
      });
    }
  }

  // Injuries
  for (const p of allPlayers) {
    if (Math.random() < 0.02) {
      events.push({
        minute: rand(1, 90),
        type: 'injury',
        playerId: p.id,
        teamId: homeTeam.squad.includes(p) ? homeTeam.id : awayTeam.id,
      });
    }
  }

  events.sort((a, b) => a.minute - b.minute);

  // Update player stats
  const updatedPlayers = { ...players };
  for (const event of events) {
    const player = updatedPlayers[event.playerId];
    if (!player) continue;
    const updated = { ...player };
    if (event.type === 'goal') updated.goals++;
    if (event.type === 'assist') updated.assists++;
    if (event.type === 'yellow_card') updated.yellowCards++;
    if (event.type === 'red_card') updated.redCards++;
    if (event.type === 'injury') {
      updated.injured = true;
      updated.injuryWeeks = rand(1, 8);
    }
    updatedPlayers[event.playerId] = updated;
  }

  // Update appearances for all non-injured players (best 11)
  const updateAppearances = (team: Team) => {
    const best11 = [...team.squad]
      .filter(p => !p.injured)
      .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a))
      .slice(0, 11);
    for (const p of best11) {
      if (updatedPlayers[p.id]) {
        updatedPlayers[p.id] = { ...updatedPlayers[p.id], appearances: updatedPlayers[p.id].appearances + 1 };
      }
    }
  };
  updateAppearances(homeTeam);
  updateAppearances(awayTeam);

  return {
    fixture: {
      ...fixture,
      played: true,
      homeGoals,
      awayGoals,
      events,
    },
    updatedPlayers,
  };
}

export function generateFixtures(teamIds: string[]): Fixture[] {
  const fixtures: Fixture[] = [];
  let fixtureId = 0;

  // Round-robin schedule
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push('BYE');

  const n = teams.length;
  const totalRounds = (n - 1) * 2;
  const matchesPerRound = n / 2;

  for (let round = 0; round < n - 1; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = match === 0 ? 0 : ((n - 2 - match + round) % (n - 1)) + 1;
      const away = ((match + round) % (n - 1)) + 1;

      const homeTeam = teams[home];
      const awayTeam = teams[away];

      if (homeTeam === 'BYE' || awayTeam === 'BYE') continue;

      // First leg
      fixtures.push({
        id: `f${fixtureId++}`,
        homeTeamId: homeTeam,
        awayTeamId: awayTeam,
        matchday: round + 1,
        played: false,
        homeGoals: 0,
        awayGoals: 0,
        events: [],
      });

      // Second leg (reverse)
      fixtures.push({
        id: `f${fixtureId++}`,
        homeTeamId: awayTeam,
        awayTeamId: homeTeam,
        matchday: round + 1 + (n - 1),
        played: false,
        homeGoals: 0,
        awayGoals: 0,
        events: [],
      });
    }
  }

  return fixtures;
}
