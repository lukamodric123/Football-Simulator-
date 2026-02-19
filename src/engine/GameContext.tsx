import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameState, League, Standing, Team, Player, Award, GOATEntry, AllTimeRecord, GameMode, SeasonRecord, Transfer, UCLTournament } from './types';
import { LEAGUES } from './data';
import { generateTeam, getPlayerOverall, agePlayer, shouldRetire, generateYouthPlayer, calculateGOATScore, generatePlayer, uid } from './generator';
import { generateFixtures, simulateMatch } from './simulation';
import { generateWeeklyNews, generateGOATNews, generateRetirementNews, generateSeasonAwardNews, generateNewSeasonNews, generatePromotionNews, generateWorldCupNews, generateUCLNews } from './news';
import { generateWorldCup, simulateWorldCupGroupStage, simulateWorldCupKnockouts } from './worldcup';
import { generateUCL, simulateUCLGroupStage, simulateUCLKnockouts } from './ucl';
import { simulateTransfers } from './transfers';

interface GameContextType {
  state: GameState;
  initializeGame: (mode: GameMode, managedTeamId?: string) => void;
  simulateWeek: () => void;
  simulateMultipleWeeks: (count: number) => void;
  advanceToNextSeason: () => void;
  getTeam: (id: string) => Team | undefined;
  getPlayer: (id: string) => Player | undefined;
  getLeagueStandings: (leagueId: string) => (Standing & { team: Team })[];
  getTopScorers: (leagueId: string) => { player: Player; team: Team; goals: number }[];
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
};

const initialState: GameState = {
  season: 1,
  week: 0,
  phase: 'pre_season',
  leagues: [],
  teams: {},
  players: {},
  news: [],
  topScorers: [],
  awards: [],
  initialized: false,
  gameMode: 'universe',
  managedTeamId: null,
  goatRankings: [],
  allTimeRecords: [],
  retiredPlayers: [],
  seasonAwards: [],
  totalSeasonsPlayed: 0,
  worldCup: null,
  worldCupHistory: [],
  promotionLog: [],
  ucl: null,
  uclHistory: [],
  transfers: [],
  transferHistory: [],
  survivalTeams: [],
  eliminatedTeams: [],
};

function buildLeague(leagueDef: typeof LEAGUES[0], teams: Record<string, Team>, players: Record<string, Player>) {
  const teamIds: string[] = [];
  for (const teamDef of leagueDef.teams) {
    const team = generateTeam(teamDef.name, teamDef.shortName, leagueDef.id, teamDef.reputation, teamDef.color);
    teams[team.id] = team;
    teamIds.push(team.id);
    for (const player of team.squad) {
      players[player.id] = player;
    }
  }
  const fixtures = generateFixtures(teamIds);
  const standings: Standing[] = teamIds.map(id => ({
    teamId: id, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
  }));
  return {
    id: leagueDef.id,
    name: leagueDef.name,
    country: leagueDef.country,
    tier: leagueDef.tier,
    linkedLeagueId: leagueDef.linkedLeagueId,
    teams: teamIds,
    standings,
    fixtures,
    currentMatchday: 1,
    totalMatchdays: fixtures.reduce((max, f) => Math.max(max, f.matchday), 0),
    champions: [],
  } as League;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);

  const initializeGame = useCallback((mode: GameMode, managedTeamId?: string) => {
    const teams: Record<string, Team> = {};
    const players: Record<string, Player> = {};
    const leagues: League[] = [];
    for (const leagueDef of LEAGUES) {
      leagues.push(buildLeague(leagueDef, teams, players));
    }
    setState({
      ...initialState,
      season: 1,
      week: 0,
      phase: 'in_season',
      leagues,
      teams,
      players,
      news: [{ id: 'n0', headline: '⚽ A new football universe is born! Season 1 begins.', body: '', category: 'match', week: 0, season: 1, importance: 5 }],
      initialized: true,
      gameMode: mode,
      managedTeamId: managedTeamId || null,
      goatRankings: [],
      allTimeRecords: [],
      retiredPlayers: [],
      seasonAwards: [],
      totalSeasonsPlayed: 0,
      worldCup: null,
      worldCupHistory: [],
      promotionLog: [],
      ucl: null,
      uclHistory: [],
      transfers: [],
      transferHistory: [],
      survivalTeams: mode === 'survival' ? Object.keys(teams) : [],
      eliminatedTeams: [],
    });
  }, []);

  const doSimulateWeek = (prev: GameState): GameState => {
    if (!prev.initialized || prev.phase === 'end_season') return prev;

    const newWeek = prev.week + 1;
    let updatedPlayers = { ...prev.players };

    const newLeagues = prev.leagues.map(league => {
      const matchdayFixtures = league.fixtures.filter(f => f.matchday === league.currentMatchday && !f.played);
      if (matchdayFixtures.length === 0) return league;

      let newFixtures = [...league.fixtures];
      let newStandings = league.standings.map(s => ({ ...s }));

      for (const fixture of matchdayFixtures) {
        const homeTeam = prev.teams[fixture.homeTeamId];
        const awayTeam = prev.teams[fixture.awayTeamId];
        if (!homeTeam || !awayTeam) continue;

        const result = simulateMatch(fixture, homeTeam, awayTeam, updatedPlayers);
        updatedPlayers = result.updatedPlayers;

        const fIdx = newFixtures.findIndex(f => f.id === fixture.id);
        if (fIdx !== -1) newFixtures[fIdx] = result.fixture;

        const hs = newStandings.find(s => s.teamId === fixture.homeTeamId);
        const as_ = newStandings.find(s => s.teamId === fixture.awayTeamId);
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
            hs.drawn++; as_.drawn++; hs.points += 1; as_.points += 1;
          }
        }
      }

      return { ...league, fixtures: newFixtures, standings: newStandings, currentMatchday: league.currentMatchday + 1 };
    });

    // Injury recovery
    for (const pid of Object.keys(updatedPlayers)) {
      const p = updatedPlayers[pid];
      if (p.injured && p.injuryWeeks > 0) {
        const u = { ...p, injuryWeeks: p.injuryWeeks - 1 };
        if (u.injuryWeeks <= 0) u.injured = false;
        updatedPlayers[pid] = u;
      }
    }

    const weekNews = generateWeeklyNews({ ...prev, week: newWeek, leagues: newLeagues });
    const allDone = newLeagues.every(l => l.currentMatchday > l.totalMatchdays);

    return {
      ...prev,
      week: newWeek,
      leagues: newLeagues,
      players: updatedPlayers,
      news: [...weekNews, ...prev.news].slice(0, 200),
      phase: allDone ? 'end_season' : 'in_season',
    };
  };

  const simulateWeek = useCallback(() => {
    setState(prev => doSimulateWeek(prev));
  }, []);

  const simulateMultipleWeeks = useCallback((count: number) => {
    setState(prev => {
      let s = prev;
      for (let i = 0; i < count; i++) {
        if (s.phase === 'end_season') break;
        s = doSimulateWeek(s);
      }
      return s;
    });
  }, []);

  const advanceToNextSeason = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'end_season') return prev;

      const newSeason = prev.season + 1;
      let updatedPlayers = { ...prev.players };
      let updatedTeams = { ...prev.teams };
      const retiredList = [...prev.retiredPlayers];
      const retirementNews: any[] = [];
      const awardNews: any[] = [];

      // --- End of season awards ---
      const seasonAwards: Award[] = [];
      let topScorerPlayer: Player | null = null;
      let topScorerTeam: Team | null = null;
      for (const team of Object.values(updatedTeams)) {
        for (const p of team.squad) {
          const player = updatedPlayers[p.id] || p;
          if (!topScorerPlayer || player.goals > topScorerPlayer.goals) {
            topScorerPlayer = player;
            topScorerTeam = team;
          }
        }
      }
      if (topScorerPlayer && topScorerPlayer.goals > 0) {
        const name = `${topScorerPlayer.firstName} ${topScorerPlayer.lastName}`;
        seasonAwards.push({ name: 'Golden Boot', playerId: topScorerPlayer.id, playerName: name, teamName: topScorerTeam?.name, season: prev.season, value: topScorerPlayer.goals });
        awardNews.push(generateSeasonAwardNews('Golden Boot', name, prev.season));
        if (updatedPlayers[topScorerPlayer.id]) {
          updatedPlayers[topScorerPlayer.id] = { ...updatedPlayers[topScorerPlayer.id], individualAwards: [...updatedPlayers[topScorerPlayer.id].individualAwards, 'Golden Boot'] };
        }
      }

      // Ballon d'Or
      let bestPlayer: Player | null = null;
      let bestScore = 0;
      for (const p of Object.values(updatedPlayers)) {
        if (p.retired) continue;
        const score = p.goals * 3 + p.assists * 2 + getPlayerOverall(p) + (p.appearances * 0.5);
        if (score > bestScore) {
          bestScore = score;
          bestPlayer = p;
        }
      }
      if (bestPlayer) {
        const name = `${bestPlayer.firstName} ${bestPlayer.lastName}`;
        seasonAwards.push({ name: 'Ballon d\'Or', playerId: bestPlayer.id, playerName: name, season: prev.season });
        awardNews.push(generateSeasonAwardNews('Ballon d\'Or', name, prev.season));
        if (updatedPlayers[bestPlayer.id]) {
          updatedPlayers[bestPlayer.id] = { ...updatedPlayers[bestPlayer.id], individualAwards: [...updatedPlayers[bestPlayer.id].individualAwards, 'Ballon d\'Or'] };
        }
      }

      // Young Player Award
      let bestYoung: Player | null = null;
      let bestYoungScore = 0;
      for (const p of Object.values(updatedPlayers)) {
        if (p.retired || p.age > 23) continue;
        const score = p.goals * 3 + p.assists * 2 + getPlayerOverall(p);
        if (score > bestYoungScore) {
          bestYoungScore = score;
          bestYoung = p;
        }
      }
      if (bestYoung) {
        const name = `${bestYoung.firstName} ${bestYoung.lastName}`;
        seasonAwards.push({ name: 'Young Player Award', playerId: bestYoung.id, playerName: name, season: prev.season });
        awardNews.push(generateSeasonAwardNews('Young Player of the Year', name, prev.season));
      }

      // --- League champions ---
      const newLeagues = prev.leagues.map(league => {
        const sorted = [...league.standings].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
        });
        const champId = sorted[0]?.teamId;
        if (champId && updatedTeams[champId]) {
          updatedTeams[champId] = { ...updatedTeams[champId], titles: updatedTeams[champId].titles + 1, reputation: Math.min(99, updatedTeams[champId].reputation + 2) };
          const champTeam = updatedTeams[champId];
          for (const p of champTeam.squad) {
            if (updatedPlayers[p.id]) {
              updatedPlayers[p.id] = { ...updatedPlayers[p.id], trophies: updatedPlayers[p.id].trophies + 1 };
            }
          }
          awardNews.push(generateSeasonAwardNews(`${league.name} Champions`, champTeam.name, prev.season));
        }

        const bottom3 = sorted.slice(-3);
        for (const s of bottom3) {
          if (updatedTeams[s.teamId]) {
            updatedTeams[s.teamId] = { ...updatedTeams[s.teamId], reputation: Math.max(40, updatedTeams[s.teamId].reputation - 1) };
          }
        }

        return {
          ...league,
          champions: [...league.champions, { season: prev.season, teamId: champId || '' }],
        };
      });

      // --- PROMOTION / RELEGATION ---
      const promotionNews: any[] = [];
      const promotionLogEntry: { promoted: { teamId: string; fromLeague: string; toLeague: string }[]; relegated: { teamId: string; fromLeague: string; toLeague: string }[] } = {
        promoted: [], relegated: [],
      };
      const PROMO_RELEGATE_COUNT = 3;

      // Group leagues by country pair
      const tier1Leagues = newLeagues.filter(l => l.tier === 1 && l.linkedLeagueId);
      for (const topLeague of tier1Leagues) {
        const botLeague = newLeagues.find(l => l.id === topLeague.linkedLeagueId);
        if (!botLeague) continue;

        const topSorted = [...topLeague.standings].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
        const botSorted = [...botLeague.standings].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));

        const relegatedIds = topSorted.slice(-PROMO_RELEGATE_COUNT).map(s => s.teamId);
        const promotedIds = botSorted.slice(0, PROMO_RELEGATE_COUNT).map(s => s.teamId);

        // Swap teams between leagues
        for (const rid of relegatedIds) {
          const team = updatedTeams[rid];
          if (team) {
            updatedTeams[rid] = { ...team, leagueId: botLeague.id, reputation: Math.max(35, team.reputation - 3) };
            promotionLogEntry.relegated.push({ teamId: rid, fromLeague: topLeague.id, toLeague: botLeague.id });
            promotionNews.push(generatePromotionNews(team.name, topLeague.name, botLeague.name, false, prev.season));
          }
        }
        for (const pid of promotedIds) {
          const team = updatedTeams[pid];
          if (team) {
            updatedTeams[pid] = { ...team, leagueId: topLeague.id, reputation: Math.min(90, team.reputation + 3) };
            promotionLogEntry.promoted.push({ teamId: pid, fromLeague: botLeague.id, toLeague: topLeague.id });
            promotionNews.push(generatePromotionNews(team.name, botLeague.name, topLeague.name, true, prev.season));
          }
        }

        // Update league team lists
        topLeague.teams = [...topLeague.teams.filter(id => !relegatedIds.includes(id)), ...promotedIds];
        botLeague.teams = [...botLeague.teams.filter(id => !promotedIds.includes(id)), ...relegatedIds];
      }

      // --- Player aging, retirement, career records ---
      for (const pid of Object.keys(updatedPlayers)) {
        const p = updatedPlayers[pid];
        if (p.retired) continue;

        const teamId = Object.values(updatedTeams).find(t => t.squad.some(sq => sq.id === pid))?.id || '';
        const seasonRec: SeasonRecord = {
          season: prev.season,
          teamId,
          goals: p.goals,
          assists: p.assists,
          appearances: p.appearances,
          rating: getPlayerOverall(p),
          cleanSheets: p.cleanSheets,
        };

        let updated = { ...p, seasonHistory: [...p.seasonHistory, seasonRec] };
        updated.careerGoals += updated.goals;
        updated.careerAssists += updated.assists;
        updated.careerAppearances += updated.appearances;
        updated.careerCleanSheets += updated.cleanSheets;

        updated = agePlayer(updated);

        if (shouldRetire(updated)) {
          updated.retired = true;
          updated.retiredSeason = prev.season;
          retiredList.push(updated);
          retirementNews.push(generateRetirementNews(updated, newSeason));
        }

        updatedPlayers[pid] = updated;
      }

      // --- Remove retired players from squads, replace with youth ---
      for (const teamId of Object.keys(updatedTeams)) {
        const team = updatedTeams[teamId];
        const retiredIds = team.squad.filter(p => updatedPlayers[p.id]?.retired).map(p => p.id);
        if (retiredIds.length > 0) {
          let newSquad = team.squad.filter(p => !updatedPlayers[p.id]?.retired);
          for (const rid of retiredIds) {
            const retiredP = updatedPlayers[rid];
            const youth = generateYouthPlayer(retiredP.position, team.reputation);
            updatedPlayers[youth.id] = youth;
            newSquad.push(youth);
          }
          updatedTeams[teamId] = { ...team, squad: newSquad };
        }
      }

      // --- Random events ---
      for (const teamId of Object.keys(updatedTeams)) {
        const team = updatedTeams[teamId];
        if (Math.random() < 0.05) {
          const change = Math.random() > 0.5 ? Math.round(team.budget * 0.5) : -Math.round(team.budget * 0.3);
          updatedTeams[teamId] = { ...team, budget: Math.max(10, team.budget + change) };
        }
        const league = newLeagues.find(l => l.teams.includes(teamId));
        if (league) {
          const sorted = [...league.standings].sort((a, b) => b.points - a.points);
          const pos = sorted.findIndex(s => s.teamId === teamId);
          const total = sorted.length;
          const fanMood = pos < total * 0.2 ? 'happy' : pos < total * 0.4 ? 'neutral' : pos < total * 0.7 ? 'frustrated' : 'angry';
          updatedTeams[teamId] = { ...updatedTeams[teamId], fanMood: fanMood as any };
        }
      }

      // --- UCL (Champions League) ---
      let uclResult: UCLTournament | null = null;
      const uclHistory = [...prev.uclHistory];
      const uclNews: any[] = [];

      // Generate UCL from previous season standings
      let ucl = generateUCL(prev.season, prev.leagues, updatedTeams);
      const uclGroupResult = simulateUCLGroupStage(ucl, updatedTeams, updatedPlayers);
      ucl = uclGroupResult.ucl;
      updatedPlayers = uclGroupResult.updatedPlayers;

      const uclKOResult = simulateUCLKnockouts(ucl, updatedTeams, updatedPlayers);
      ucl = uclKOResult.ucl;
      updatedPlayers = uclKOResult.updatedPlayers;
      uclResult = ucl;

      if (ucl.winner) {
        uclHistory.push({
          season: prev.season,
          winner: ucl.winner,
          topScorer: ucl.topScorer?.playerName,
          bestPlayer: ucl.bestPlayer?.playerName,
        });
        uclNews.push(...generateUCLNews(ucl, prev.season));

        // UCL winner trophies
        if (ucl.winnerTeamId && updatedTeams[ucl.winnerTeamId]) {
          updatedTeams[ucl.winnerTeamId] = {
            ...updatedTeams[ucl.winnerTeamId],
            titles: updatedTeams[ucl.winnerTeamId].titles + 1,
            reputation: Math.min(99, updatedTeams[ucl.winnerTeamId].reputation + 3),
          };
          for (const p of updatedTeams[ucl.winnerTeamId].squad) {
            if (updatedPlayers[p.id]) {
              updatedPlayers[p.id] = { ...updatedPlayers[p.id], trophies: updatedPlayers[p.id].trophies + 1 };
            }
          }
        }

        // Add UCL awards to player records
        for (const award of ucl.awards) {
          if (updatedPlayers[award.playerId]) {
            updatedPlayers[award.playerId] = {
              ...updatedPlayers[award.playerId],
              individualAwards: [...updatedPlayers[award.playerId].individualAwards, award.name],
            };
          }
        }
      }

      // --- TRANSFERS ---
      const transferResult = simulateTransfers(updatedTeams, updatedPlayers, prev.season);
      updatedTeams = transferResult.teams;
      updatedPlayers = transferResult.players;
      const seasonTransfers = transferResult.transfers;
      const transferNews = transferResult.news;

      // --- WORLD CUP every 4 seasons ---
      let worldCup = prev.worldCup;
      const worldCupHistory = [...prev.worldCupHistory];
      const wcNews: any[] = [];

      if (newSeason % 4 === 0) {
        let wc = generateWorldCup(prev.season, updatedPlayers);
        const groupResult = simulateWorldCupGroupStage(wc, updatedPlayers);
        wc = groupResult.worldCup;
        updatedPlayers = groupResult.updatedPlayers;

        const koResult = simulateWorldCupKnockouts(wc, updatedPlayers);
        wc = koResult.worldCup;
        updatedPlayers = koResult.updatedPlayers;

        worldCup = wc;
        if (wc.winner) {
          worldCupHistory.push({
            season: prev.season,
            winner: wc.winner,
            goldenBoot: wc.goldenBoot?.playerName,
            goldenBall: wc.goldenBall?.playerName,
          });
          wcNews.push(...generateWorldCupNews(wc, prev.season));

          for (const award of wc.awards) {
            if (updatedPlayers[award.playerId]) {
              updatedPlayers[award.playerId] = {
                ...updatedPlayers[award.playerId],
                individualAwards: [...updatedPlayers[award.playerId].individualAwards, award.name],
                trophies: updatedPlayers[award.playerId].trophies + (award.name === 'WC Golden Ball' ? 1 : 0),
              };
            }
          }
        }
      } else {
        worldCup = null;
      }

      // --- SURVIVAL MODE: eliminate bottom teams ---
      let survivalTeams = [...prev.survivalTeams];
      let eliminatedTeams = [...prev.eliminatedTeams];
      if (prev.gameMode === 'survival' && survivalTeams.length > 1) {
        // Eliminate worst performing teams from each league
        for (const league of newLeagues) {
          const sorted = [...league.standings].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
          const eliminateCount = Math.max(1, Math.floor(sorted.length * 0.1));
          const toEliminate = sorted.slice(-eliminateCount).map(s => s.teamId).filter(id => survivalTeams.includes(id));
          survivalTeams = survivalTeams.filter(id => !toEliminate.includes(id));
          eliminatedTeams = [...eliminatedTeams, ...toEliminate];
        }
      }

      // --- GOAT Rankings ---
      const goatEntries: GOATEntry[] = [];
      const allPlayers = [...Object.values(updatedPlayers), ...retiredList];
      const seen = new Set<string>();
      for (const p of allPlayers) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        if (p.careerGoals > 0 || p.careerAppearances > 20 || p.isLegend) {
          goatEntries.push({
            playerId: p.id,
            playerName: `${p.firstName} ${p.lastName}`,
            score: calculateGOATScore(p),
            careerGoals: p.careerGoals,
            careerAssists: p.careerAssists,
            trophies: p.trophies,
            awards: p.individualAwards.length,
            peakOverall: getPlayerOverall(p),
            seasonsPlayed: p.seasonHistory.length,
            retired: p.retired,
          });
        }
      }
      goatEntries.sort((a, b) => b.score - a.score);
      const goatRankings = goatEntries.slice(0, 50);

      // All-time records
      const allTimeRecords: AllTimeRecord[] = [...prev.allTimeRecords];
      const checkRecord = (type: AllTimeRecord['type'], pid: string, name: string, value: number) => {
        const existing = allTimeRecords.find(r => r.type === type);
        if (!existing || value > existing.value) {
          const idx = allTimeRecords.findIndex(r => r.type === type);
          const record: AllTimeRecord = { type, playerId: pid, playerName: name, value, season: prev.season };
          if (idx >= 0) allTimeRecords[idx] = record;
          else allTimeRecords.push(record);
        }
      };
      for (const p of Object.values(updatedPlayers)) {
        const name = `${p.firstName} ${p.lastName}`;
        checkRecord('goals', p.id, name, p.careerGoals);
        checkRecord('assists', p.id, name, p.careerAssists);
        checkRecord('appearances', p.id, name, p.careerAppearances);
        checkRecord('trophies', p.id, name, p.trophies);
        checkRecord('clean_sheets', p.id, name, p.careerCleanSheets);
      }

      // Generate new season fixtures
      const readyLeagues = newLeagues.map(league => {
        const fixtures = generateFixtures(league.teams);
        const standings: Standing[] = league.teams.map(id => ({
          teamId: id, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
        }));
        return {
          ...league,
          fixtures,
          standings,
          currentMatchday: 1,
          totalMatchdays: fixtures.reduce((max, f) => Math.max(max, f.matchday), 0),
        };
      });

      const goatNews = generateGOATNews(goatRankings, newSeason);
      const newSeasonNews = generateNewSeasonNews(newSeason);

      return {
        ...prev,
        season: newSeason,
        week: 0,
        phase: 'in_season' as const,
        leagues: readyLeagues,
        teams: updatedTeams,
        players: updatedPlayers,
        news: [newSeasonNews, ...uclNews, ...transferNews, ...wcNews, ...promotionNews, ...goatNews, ...awardNews, ...retirementNews, ...prev.news].slice(0, 300),
        awards: [...seasonAwards, ...(ucl.awards || []), ...(worldCup?.awards || []), ...prev.awards],
        goatRankings,
        allTimeRecords,
        retiredPlayers: retiredList,
        seasonAwards: [...prev.seasonAwards, { season: prev.season, awards: seasonAwards }],
        totalSeasonsPlayed: prev.totalSeasonsPlayed + 1,
        worldCup,
        worldCupHistory,
        promotionLog: [...prev.promotionLog, { season: prev.season, ...promotionLogEntry }],
        ucl: uclResult,
        uclHistory,
        transfers: seasonTransfers,
        transferHistory: [...prev.transferHistory, ...seasonTransfers],
        survivalTeams,
        eliminatedTeams,
      };
    });
  }, []);

  const getTeam = useCallback((id: string) => state.teams[id], [state.teams]);
  const getPlayer = useCallback((id: string) => state.players[id], [state.players]);

  const getLeagueStandings = useCallback((leagueId: string) => {
    const league = state.leagues.find(l => l.id === leagueId);
    if (!league) return [];
    return [...league.standings]
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        return b.goalsFor - a.goalsFor;
      })
      .map(s => ({ ...s, team: state.teams[s.teamId] }));
  }, [state.leagues, state.teams]);

  const getTopScorers = useCallback((leagueId: string) => {
    const league = state.leagues.find(l => l.id === leagueId);
    if (!league) return [];
    const scorers: { player: Player; team: Team; goals: number }[] = [];
    for (const teamId of league.teams) {
      const team = state.teams[teamId];
      if (!team) continue;
      for (const p of team.squad) {
        const player = state.players[p.id] || p;
        if (player.goals > 0) {
          scorers.push({ player, team, goals: player.goals });
        }
      }
    }
    return scorers.sort((a, b) => b.goals - a.goals).slice(0, 20);
  }, [state.leagues, state.teams, state.players]);

  return (
    <GameContext.Provider value={{ state, initializeGame, simulateWeek, simulateMultipleWeeks, advanceToNextSeason, getTeam, getPlayer, getLeagueStandings, getTopScorers }}>
      {children}
    </GameContext.Provider>
  );
}
