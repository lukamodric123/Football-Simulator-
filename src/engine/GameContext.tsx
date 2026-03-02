import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameState, League, Standing, Team, Player, Award, GOATEntry, AllTimeRecord, GameMode, SeasonRecord, Transfer, UCLTournament, CareerPlayer, StoryArc, TrainingIntensity, ManagerStatus } from './types';
import { LEAGUES } from './data';
import { generateTeam, getPlayerOverall, agePlayer, shouldRetire, generateYouthPlayer, calculateGOATScore, generatePlayer, uid } from './generator';
import { generateFixtures, simulateMatch } from './simulation';
import { generateWeeklyNews, generateGOATNews, generateRetirementNews, generateSeasonAwardNews, generateNewSeasonNews, generatePromotionNews, generateWorldCupNews, generateUCLNews } from './news';
import { generateWorldCup, simulateWorldCupGroupStage, simulateWorldCupKnockouts } from './worldcup';
import { generateUCL, simulateUCLGroupStage, simulateUCLKnockouts } from './ucl';
import { simulateTransfers } from './transfers';
import { generateSuperstars, getSuperstarsForTeam } from './superstars';
import { generateBoardExpectations, evaluateManagerPerformance } from './managerExpanded';

interface GameContextType {
  state: GameState;
  initializeGame: (mode: GameMode, managedTeamId?: string) => void;
  initializeCareerMode: (playerName: string, position: string, nationality: string, startType: 'youth' | 'small_club' | 'big_club', teamId: string) => void;
  simulateWeek: () => void;
  simulateMultipleWeeks: (count: number) => void;
  advanceToNextSeason: () => void;
  getTeam: (id: string) => Team | undefined;
  getPlayer: (id: string) => Player | undefined;
  getLeagueStandings: (leagueId: string) => (Standing & { team: Team })[];
  getTopScorers: (leagueId: string) => { player: Player; team: Team; goals: number }[];
  makeManagerTransfer: (playerId: string, fee: number, wage: number, contractYears: number) => { success: boolean; message: string };
  upgradeStadium: (teamId: string) => { success: boolean; message: string };
  setTrainingIntensity: (teamId: string, intensity: TrainingIntensity) => void;
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
  careerPlayer: null,
  storyArcs: [],
  ballonDorHistory: [],
  managerStatus: null,
  greatestTeamHistory: [],
  clubDynastyTracker: {},
  managerLegacy: [],
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

    // Inject superstars into top-tier teams
    const allSuperstars = generateSuperstars();
    const usedSuperstarIds = new Set<string>();
    const tier1TeamIds = Object.values(teams)
      .filter(t => leagues.find(l => l.id === t.leagueId)?.tier === 1)
      .sort((a, b) => b.reputation - a.reputation);

    for (const team of tier1TeamIds) {
      const count = team.reputation >= 88 ? 3 : team.reputation >= 82 ? 2 : 1;
      const stars = getSuperstarsForTeam(team.reputation, count, allSuperstars, usedSuperstarIds);
      for (const star of stars) {
        players[star.id] = star;
        teams[team.id] = { ...teams[team.id], squad: [...teams[team.id].squad, star] };
      }
    }

    // Generate manager status for manager mode
    const managerStatus: ManagerStatus | null = (mode === 'manager' && managedTeamId && teams[managedTeamId]) ? {
      approval: 60,
      boardConfidence: 70,
      seasonsInCharge: 0,
      sacked: false,
      boardExpectations: generateBoardExpectations(teams[managedTeamId], 1),
      warningIssued: false,
    } : null;

    setState({
      ...initialState,
      season: 1,
      week: 0,
      phase: 'in_season',
      leagues,
      teams,
      players,
      news: [
        { id: 'n0', headline: '⚽ A new football universe is born! Season 1 begins.', body: '', category: 'match', week: 0, season: 1, importance: 5 },
        { id: 'n1', headline: '⭐ WORLD-CLASS STARS have arrived! Check squads for legendary talent.', body: '', category: 'legend', week: 0, season: 1, importance: 5 },
      ],
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
      careerPlayer: null,
      storyArcs: [],
      ballonDorHistory: [],
      managerStatus,
      greatestTeamHistory: [],
      clubDynastyTracker: {},
      managerLegacy: [],
    });
  }, []);

  const initializeCareerMode = useCallback((playerName: string, position: string, nationality: string, startType: 'youth' | 'small_club' | 'big_club', teamId: string) => {
    // First initialize a normal game
    const teams: Record<string, Team> = {};
    const players: Record<string, Player> = {};
    const leagues: League[] = [];
    for (const leagueDef of LEAGUES) {
      leagues.push(buildLeague(leagueDef, teams, players));
    }

    // Inject superstars
    const allSuperstars = generateSuperstars();
    const usedSuperstarIds = new Set<string>();
    const tier1TeamIds = Object.values(teams)
      .filter(t => leagues.find(l => l.id === t.leagueId)?.tier === 1)
      .sort((a, b) => b.reputation - a.reputation);
    for (const team of tier1TeamIds) {
      const count = team.reputation >= 88 ? 3 : team.reputation >= 82 ? 2 : 1;
      const stars = getSuperstarsForTeam(team.reputation, count, allSuperstars, usedSuperstarIds);
      for (const star of stars) {
        players[star.id] = star;
        teams[team.id] = { ...teams[team.id], squad: [...teams[team.id].squad, star] };
      }
    }

    // Create career player
    const pos = (position || 'CM') as any;
    const repBase = startType === 'big_club' ? 70 : startType === 'small_club' ? 55 : 40;
    const ageBase = startType === 'youth' ? 17 : 20;
    const careerPlayerData = generatePlayer(pos, repBase, [ageBase, ageBase + 1]);
    const nameParts = playerName.trim().split(' ');
    careerPlayerData.firstName = nameParts[0] || 'Alex';
    careerPlayerData.lastName = nameParts.slice(1).join(' ') || 'Player';
    careerPlayerData.nationality = nationality || 'England';
    careerPlayerData.potential = Math.min(99, careerPlayerData.potential + 15); // High potential
    players[careerPlayerData.id] = careerPlayerData;

    // Add to team
    if (teams[teamId]) {
      teams[teamId] = { ...teams[teamId], squad: [...teams[teamId].squad, careerPlayerData] };
    }

    const careerPlayer: CareerPlayer = {
      playerId: careerPlayerData.id,
      customName: playerName,
      startType,
      currentTeamId: teamId,
      seasonNumber: 0,
      isCaptain: false,
      fame: startType === 'big_club' ? 20 : 5,
      ballonDorCount: 0,
      careerHighlight: 'Career begins!',
      storyArcs: [{
        id: 'arc_0',
        type: startType === 'youth' ? 'rise' : startType === 'small_club' ? 'underdog' : 'rise',
        title: startType === 'youth' ? 'Academy Graduate' : startType === 'small_club' ? 'Small Town Hero' : 'The Chosen One',
        description: `${playerName} begins their professional career.`,
        season: 1,
        resolved: false,
      }],
    };

    setState({
      ...initialState,
      season: 1,
      week: 0,
      phase: 'in_season',
      leagues,
      teams,
      players,
      news: [
        { id: 'n0', headline: `⚽ A new football universe is born! Season 1 begins.`, body: '', category: 'match', week: 0, season: 1, importance: 5 },
        { id: 'n_career', headline: `🌟 NEW CAREER: ${playerName} joins ${teams[teamId]?.name || 'a club'} as a ${pos}!`, body: '', category: 'youth', week: 0, season: 1, importance: 5 },
      ],
      initialized: true,
      gameMode: 'career',
      managedTeamId: teamId,
      careerPlayer,
      storyArcs: careerPlayer.storyArcs,
      ballonDorHistory: [],
      survivalTeams: [],
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

      // --- Random events & Training/FFP ---
      for (const teamId of Object.keys(updatedTeams)) {
        const team = updatedTeams[teamId];
        
        // Budget changes
        if (Math.random() < 0.05) {
          const change = Math.random() > 0.5 ? Math.round(team.budget * 0.5) : -Math.round(team.budget * 0.3);
          updatedTeams[teamId] = { ...team, budget: Math.max(10, team.budget + change) };
        }

        // Training intensity effects
        const ti = team.trainingIntensity || 'medium';
        for (const p of team.squad) {
          if (!updatedPlayers[p.id] || updatedPlayers[p.id].retired) continue;
          const player = updatedPlayers[p.id];
          let injuryBonus = 0;
          let staminaBonus = 0;
          if (ti === 'extreme') { injuryBonus = 0.06; staminaBonus = 4; }
          else if (ti === 'high') { injuryBonus = 0.03; staminaBonus = 2; }
          else if (ti === 'low') { injuryBonus = -0.02; staminaBonus = -2; }
          // Apply training fatigue/development
          const newStamina = Math.min(99, Math.max(30, player.attributes.stamina + staminaBonus));
          const extraInjury = Math.random() < (player.hiddenTraits.injuryRisk / 100 + injuryBonus);
          updatedPlayers[p.id] = {
            ...player,
            attributes: { ...player.attributes, stamina: newStamina },
            injured: extraInjury ? true : player.injured,
            injuryWeeks: extraInjury ? Math.max(player.injuryWeeks, Math.floor(Math.random() * 6) + 1) : player.injuryWeeks,
          };
        }

        // Stadium revenue
        const stadiumRevenue = Math.round((team.stadium?.capacity || 30000) / 10000 * 3);
        
        // FFP: wage total check
        const wageTotal = team.squad.reduce((s, p) => s + (updatedPlayers[p.id]?.wage || 0), 0);
        const ffpWarning = wageTotal > team.budget * 8;
        
        // Atmosphere based on fan mood
        const atmosphereBonus = team.fanMood === 'ecstatic' ? 5 : team.fanMood === 'happy' ? 2 : team.fanMood === 'angry' ? -5 : 0;

        // Fan mood
        const league = newLeagues.find(l => l.teams.includes(teamId));
        let fanMood = team.fanMood;
        if (league) {
          const sorted = [...league.standings].sort((a, b) => b.points - a.points);
          const pos = sorted.findIndex(s => s.teamId === teamId);
          const total = sorted.length;
          fanMood = pos < total * 0.2 ? 'happy' : pos < total * 0.4 ? 'neutral' : pos < total * 0.7 ? 'frustrated' : 'angry';
        }

        updatedTeams[teamId] = {
          ...updatedTeams[teamId],
          budget: Math.max(5, (updatedTeams[teamId].budget || team.budget) + stadiumRevenue - (ffpWarning ? 10 : 0)),
          ffpWarning,
          wageTotal,
          fanMood: fanMood as any,
          stadium: {
            ...team.stadium,
            atmosphere: Math.min(100, Math.max(20, (team.stadium?.atmosphere || 60) + atmosphereBonus)),
          },
        };
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
            goldenGlove: wc.goldenGlove?.playerName,
            runnerUp: wc.runnerUp,
            thirdPlace: wc.thirdPlace,
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

      // --- Dynamic Ballon d'Or Ceremony ---
      const ballonDorHistory = [...prev.ballonDorHistory];
      const ballonDorNews: any[] = [];
      if (bestPlayer) {
        const bdName = `${bestPlayer.firstName} ${bestPlayer.lastName}`;
        const bdTeam = Object.values(updatedTeams).find(t => t.squad.some(p => p.id === bestPlayer!.id));
        ballonDorHistory.push({ season: prev.season, playerId: bestPlayer.id, playerName: bdName, teamName: bdTeam?.name || '' });
        ballonDorNews.push({
          id: `n_bdo_${prev.season}`,
          headline: `🎭✨ BALLON D'OR CEREMONY: ${bdName} wins the golden ball! "${bdName} is the best player in the world" — standing ovation at the gala.`,
          body: '',
          category: 'award' as const,
          week: 0,
          season: prev.season,
          importance: 5,
        });
      }

      // --- Story Arc Generation ---
      const newStoryArcs: StoryArc[] = [...prev.storyArcs];
      let updatedCareerPlayer = prev.careerPlayer ? { ...prev.careerPlayer } : null;

      // Generate story arcs for notable players
      for (const p of Object.values(updatedPlayers)) {
        if (p.retired) continue;
        const ovr = getPlayerOverall(p);
        const pName = `${p.firstName} ${p.lastName}`;
        const pTeam = Object.values(updatedTeams).find(t => t.squad.some(sq => sq.id === p.id));

        // Rise arc: young player with breakout season
        if (p.age <= 22 && p.goals >= 10 && Math.random() < 0.3) {
          newStoryArcs.push({ id: `arc_${prev.season}_${p.id}_rise`, type: 'rise', title: `The Rise of ${pName}`, description: `${pName} (${p.age}) is taking the football world by storm with ${p.goals} goals.`, season: prev.season, resolved: false });
        }
        // Fall arc: declining legend
        if (p.isLegend && ovr < 70 && p.age > 32 && Math.random() < 0.4) {
          newStoryArcs.push({ id: `arc_${prev.season}_${p.id}_fall`, type: 'fall', title: `${pName}'s Twilight`, description: `Legend ${pName} is struggling. Is this the end?`, season: prev.season, resolved: false });
        }
        // Comeback arc: injured player returns strong
        if (p.goals >= 8 && p.seasonHistory.length > 1 && p.seasonHistory[p.seasonHistory.length - 1]?.goals < 3 && Math.random() < 0.3) {
          newStoryArcs.push({ id: `arc_${prev.season}_${p.id}_comeback`, type: 'comeback', title: `${pName}'s Redemption`, description: `After a difficult season, ${pName} has bounced back with ${p.goals} goals!`, season: prev.season, resolved: true });
        }
        // Dynasty arc: team winning multiple titles
        if (pTeam && pTeam.titles >= 3 && Math.random() < 0.15) {
          newStoryArcs.push({ id: `arc_${prev.season}_dynasty_${pTeam.id}`, type: 'dynasty', title: `${pTeam.name} Dynasty`, description: `${pTeam.name} continue their dominance with ${pTeam.titles} titles.`, season: prev.season, resolved: false });
        }
      }

      // Career player story updates
      if (updatedCareerPlayer && updatedPlayers[updatedCareerPlayer.playerId]) {
        const cp = updatedPlayers[updatedCareerPlayer.playerId];
        updatedCareerPlayer.seasonNumber += 1;
        // Fame based on goals and awards
        updatedCareerPlayer.fame = Math.min(100, updatedCareerPlayer.fame + cp.goals * 2 + cp.assists + (cp.individualAwards.length > 0 ? 15 : 0));
        // Check if won Ballon d'Or
        if (bestPlayer && bestPlayer.id === cp.id) {
          updatedCareerPlayer.ballonDorCount += 1;
          updatedCareerPlayer.careerHighlight = `Won Ballon d'Or in Season ${prev.season}!`;
          updatedCareerPlayer.storyArcs.push({ id: `arc_bdo_${prev.season}`, type: 'rise', title: 'The Best in the World', description: `${updatedCareerPlayer.customName} wins the Ballon d'Or!`, season: prev.season, resolved: true });
        }
        // Career milestones
        if (cp.careerGoals >= 100 && !updatedCareerPlayer.storyArcs.some(a => a.title.includes('100 Goals'))) {
          updatedCareerPlayer.storyArcs.push({ id: `arc_100g_${prev.season}`, type: 'rise', title: '100 Goals Club', description: `${updatedCareerPlayer.customName} reaches 100 career goals!`, season: prev.season, resolved: true });
        }
        // Captaincy
        if (cp.age >= 24 && cp.hiddenTraits.leadership > 75 && !updatedCareerPlayer.isCaptain) {
          updatedCareerPlayer.isCaptain = true;
          updatedCareerPlayer.storyArcs.push({ id: `arc_capt_${prev.season}`, type: 'rise', title: 'Captain\'s Armband', description: `${updatedCareerPlayer.customName} is named team captain!`, season: prev.season, resolved: true });
        }
      }

      // Keep only last 30 story arcs
      const trimmedArcs = newStoryArcs.slice(-30);

      // --- Manager evaluation ---
      let managerStatus = prev.managerStatus ? { ...prev.managerStatus } : null;
      const managerNews: any[] = [];
      if (managerStatus && prev.managedTeamId && updatedTeams[prev.managedTeamId]) {
        const mTeam = updatedTeams[prev.managedTeamId];
        const mLeague = newLeagues.find(l => l.teams.includes(prev.managedTeamId!));
        if (mLeague) {
          const sorted = [...mLeague.standings].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
          const pos = sorted.findIndex(s => s.teamId === prev.managedTeamId) + 1;
          const evalResult = evaluateManagerPerformance(mTeam, pos, sorted.length, managerStatus, prev.season);
          managerStatus = evalResult.status;
          managerNews.push(...evalResult.news);
          // Generate new expectations for next season
          managerStatus.boardExpectations = generateBoardExpectations(mTeam, newSeason);
          managerStatus.warningIssued = false;
        }
      }

      // --- Greatest Team & Dynasty tracker ---
      const greatestTeamHistory = [...prev.greatestTeamHistory];
      const clubDynastyTracker = { ...prev.clubDynastyTracker };
      
      // Track greatest team each season
      const allTeamsList = Object.values(updatedTeams);
      const bestTeam = allTeamsList.reduce((best, t) => {
        const rating = t.reputation + t.titles * 5;
        const bestRating = best.reputation + best.titles * 5;
        return rating > bestRating ? t : best;
      }, allTeamsList[0]);
      if (bestTeam) {
        greatestTeamHistory.push({ season: prev.season, teamId: bestTeam.id, teamName: bestTeam.name, rating: bestTeam.reputation, titles: bestTeam.titles });
      }

      // Update dynasty tracker
      for (const league of newLeagues) {
        const sorted = [...league.standings].sort((a, b) => b.points - a.points);
        const champId = sorted[0]?.teamId;
        if (champId) {
          if (!clubDynastyTracker[champId]) {
            clubDynastyTracker[champId] = { titles: 0, uclTitles: 0, consecutiveTitles: 0 };
          }
          clubDynastyTracker[champId].titles += 1;
          // Check consecutive
          const prevChamp = league.champions[league.champions.length - 1]?.teamId;
          if (prevChamp === champId) {
            clubDynastyTracker[champId].consecutiveTitles += 1;
          } else {
            clubDynastyTracker[champId].consecutiveTitles = 1;
          }
        }
      }
      // UCL dynasty
      if (ucl.winnerTeamId) {
        if (!clubDynastyTracker[ucl.winnerTeamId]) {
          clubDynastyTracker[ucl.winnerTeamId] = { titles: 0, uclTitles: 0, consecutiveTitles: 0 };
        }
        clubDynastyTracker[ucl.winnerTeamId].uclTitles += 1;
      }

      // Manager legacy
      const managerLegacy = [...prev.managerLegacy];

      return {
        ...prev,
        season: newSeason,
        week: 0,
        phase: 'in_season' as const,
        leagues: readyLeagues,
        teams: updatedTeams,
        players: updatedPlayers,
        news: [newSeasonNews, ...managerNews, ...ballonDorNews, ...uclNews, ...transferNews, ...wcNews, ...promotionNews, ...goatNews, ...awardNews, ...retirementNews, ...prev.news].slice(0, 300),
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
        careerPlayer: updatedCareerPlayer,
        storyArcs: trimmedArcs,
        ballonDorHistory,
        managerStatus,
        greatestTeamHistory,
        clubDynastyTracker,
        managerLegacy,
      };
    });
  }, []);

  const getTeam = useCallback((id: string) => state.teams[id], [state.teams]);
  const getPlayer = useCallback((id: string) => state.players[id], [state.players]);

  const makeManagerTransfer = useCallback((playerId: string, fee: number, wage: number, contractYears: number): { success: boolean; message: string } => {
    const managedId = state.managedTeamId;
    if (!managedId) return { success: false, message: 'No managed team.' };
    const managedTeam = state.teams[managedId];
    if (!managedTeam) return { success: false, message: 'Team not found.' };
    if (fee > managedTeam.budget) return { success: false, message: 'Insufficient budget.' };
    if (managedTeam.squad.filter(p => !p.retired).length >= 30) return { success: false, message: 'Squad is full (30 max).' };

    const player = state.players[playerId];
    if (!player || player.retired) return { success: false, message: 'Player unavailable.' };

    // Find source team
    let sourceTeamId: string | null = null;
    for (const [tid, team] of Object.entries(state.teams)) {
      if (team.squad.some(p => p.id === playerId)) { sourceTeamId = tid; break; }
    }

    setState(prev => {
      const updatedTeams = { ...prev.teams };
      const updatedPlayers = { ...prev.players };
      const pName = `${player.firstName} ${player.lastName}`;

      // Remove from source team
      if (sourceTeamId && updatedTeams[sourceTeamId]) {
        updatedTeams[sourceTeamId] = {
          ...updatedTeams[sourceTeamId],
          squad: updatedTeams[sourceTeamId].squad.filter(p => p.id !== playerId),
          budget: updatedTeams[sourceTeamId].budget + fee,
        };
      }

      // Update player
      updatedPlayers[playerId] = { ...player, wage, contractYears, morale: Math.min(99, player.morale + 15) };

      // Add to managed team
      updatedTeams[managedId] = {
        ...updatedTeams[managedId],
        squad: [...updatedTeams[managedId].squad, updatedPlayers[playerId]],
        budget: Math.max(0, updatedTeams[managedId].budget - fee),
      };

      const transfer: Transfer = {
        id: `mt${Date.now()}`,
        playerId,
        playerName: pName,
        fromTeamId: sourceTeamId || 'free',
        fromTeamName: sourceTeamId ? prev.teams[sourceTeamId]?.name || 'Unknown' : 'Free Agent',
        toTeamId: managedId,
        toTeamName: managedTeam.name,
        fee,
        season: prev.season,
        type: fee > 0 ? 'buy' : 'free',
      };

      const newsItem = {
        id: `mn${Date.now()}`,
        headline: fee > 50
          ? `💥 BLOCKBUSTER: ${managedTeam.name} sign ${pName} for €${fee}M!`
          : fee > 0
          ? `📝 ${managedTeam.name} complete signing of ${pName} (€${fee}M).`
          : `📋 ${managedTeam.name} sign free agent ${pName}.`,
        body: '',
        category: 'transfer' as const,
        week: prev.week,
        season: prev.season,
        importance: fee > 50 ? 5 : 3,
      };

      return {
        ...prev,
        teams: updatedTeams,
        players: updatedPlayers,
        transfers: [...prev.transfers, transfer],
        transferHistory: [...prev.transferHistory, transfer],
        news: [newsItem, ...prev.news].slice(0, 300),
      };
    });

    return { success: true, message: 'Transfer complete!' };
  }, [state.managedTeamId, state.teams, state.players]);

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

  const upgradeStadium = useCallback((teamId: string): { success: boolean; message: string } => {
    const team = state.teams[teamId];
    if (!team) return { success: false, message: 'Team not found.' };
    if (team.stadium.level >= 5) return { success: false, message: 'Stadium is already max level.' };
    if (team.budget < team.stadium.upgradeCost) return { success: false, message: 'Insufficient budget.' };
    setState(prev => {
      const t = prev.teams[teamId];
      if (!t) return prev;
      const newLevel = t.stadium.level + 1;
      return {
        ...prev,
        teams: {
          ...prev.teams,
          [teamId]: {
            ...t,
            budget: t.budget - t.stadium.upgradeCost,
            stadium: {
              ...t.stadium,
              level: newLevel,
              capacity: t.stadium.capacity + 15000,
              atmosphere: Math.min(100, t.stadium.atmosphere + 10),
              upgradeCost: (6 - newLevel) * 50,
            },
          },
        },
        news: [{ id: `stadium_${Date.now()}`, headline: `🏟️ ${t.name} upgrade their stadium to Level ${newLevel}!`, body: '', category: 'drama' as const, week: prev.week, season: prev.season, importance: 3 }, ...prev.news].slice(0, 300),
      };
    });
    return { success: true, message: 'Stadium upgraded!' };
  }, [state.teams]);

  const setTrainingIntensity = useCallback((teamId: string, intensity: TrainingIntensity) => {
    setState(prev => ({
      ...prev,
      teams: {
        ...prev.teams,
        [teamId]: { ...prev.teams[teamId], trainingIntensity: intensity },
      },
    }));
  }, []);

  return (
    <GameContext.Provider value={{ state, initializeGame, initializeCareerMode, simulateWeek, simulateMultipleWeeks, advanceToNextSeason, getTeam, getPlayer, getLeagueStandings, getTopScorers, makeManagerTransfer, upgradeStadium, setTrainingIntensity }}>
      {children}
    </GameContext.Provider>
  );
}
