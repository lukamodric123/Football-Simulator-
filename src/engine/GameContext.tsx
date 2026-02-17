import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameState, League, Standing, Team, Player } from './types';
import { LEAGUES } from './data';
import { generateTeam, getPlayerOverall } from './generator';
import { generateFixtures, simulateMatch } from './simulation';
import { generateWeeklyNews } from './news';

interface GameContextType {
  state: GameState;
  initializeGame: () => void;
  simulateWeek: () => void;
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
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);

  const initializeGame = useCallback(() => {
    const teams: Record<string, Team> = {};
    const players: Record<string, Player> = {};
    const leagues: League[] = [];

    for (const leagueDef of LEAGUES) {
      const teamIds: string[] = [];

      for (const teamDef of leagueDef.teams) {
        const team = generateTeam(
          teamDef.name,
          teamDef.shortName,
          leagueDef.id,
          teamDef.reputation,
          teamDef.color
        );
        teams[team.id] = team;
        teamIds.push(team.id);

        for (const player of team.squad) {
          players[player.id] = player;
        }
      }

      const fixtures = generateFixtures(teamIds);
      const standings: Standing[] = teamIds.map(id => ({
        teamId: id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      }));

      leagues.push({
        id: leagueDef.id,
        name: leagueDef.name,
        country: leagueDef.country,
        teams: teamIds,
        standings,
        fixtures,
        currentMatchday: 1,
        totalMatchdays: fixtures.reduce((max, f) => Math.max(max, f.matchday), 0),
      });
    }

    const initialNews = [{
      id: 'n0',
      headline: 'A new season begins! Clubs finalize their squads as excitement builds.',
      body: '',
      category: 'match' as const,
      week: 0,
      season: 1,
      importance: 5,
    }];

    setState({
      season: 1,
      week: 0,
      phase: 'in_season',
      leagues,
      teams,
      players,
      news: initialNews,
      topScorers: [],
      awards: [],
      initialized: true,
    });
  }, []);

  const simulateWeek = useCallback(() => {
    setState(prev => {
      if (!prev.initialized) return prev;

      const newState = { ...prev };
      newState.week = prev.week + 1;
      let updatedPlayers = { ...prev.players };

      // Simulate matches for each league
      const newLeagues = prev.leagues.map(league => {
        const matchdayFixtures = league.fixtures.filter(
          f => f.matchday === league.currentMatchday && !f.played
        );

        if (matchdayFixtures.length === 0) {
          return league;
        }

        let newFixtures = [...league.fixtures];
        let newStandings = [...league.standings];

        for (const fixture of matchdayFixtures) {
          const homeTeam = prev.teams[fixture.homeTeamId];
          const awayTeam = prev.teams[fixture.awayTeamId];
          if (!homeTeam || !awayTeam) continue;

          const result = simulateMatch(fixture, homeTeam, awayTeam, updatedPlayers);
          updatedPlayers = result.updatedPlayers;

          // Update fixture
          const fIdx = newFixtures.findIndex(f => f.id === fixture.id);
          if (fIdx !== -1) newFixtures[fIdx] = result.fixture;

          // Update standings
          const homeStanding = newStandings.find(s => s.teamId === fixture.homeTeamId);
          const awayStanding = newStandings.find(s => s.teamId === fixture.awayTeamId);

          if (homeStanding && awayStanding) {
            homeStanding.played++;
            awayStanding.played++;
            homeStanding.goalsFor += result.fixture.homeGoals;
            homeStanding.goalsAgainst += result.fixture.awayGoals;
            awayStanding.goalsFor += result.fixture.awayGoals;
            awayStanding.goalsAgainst += result.fixture.homeGoals;

            if (result.fixture.homeGoals > result.fixture.awayGoals) {
              homeStanding.won++;
              homeStanding.points += 3;
              awayStanding.lost++;
            } else if (result.fixture.homeGoals < result.fixture.awayGoals) {
              awayStanding.won++;
              awayStanding.points += 3;
              homeStanding.lost++;
            } else {
              homeStanding.drawn++;
              awayStanding.drawn++;
              homeStanding.points += 1;
              awayStanding.points += 1;
            }
          }
        }

        return {
          ...league,
          fixtures: newFixtures,
          standings: newStandings,
          currentMatchday: league.currentMatchday + 1,
        };
      });

      // Handle injury recovery
      for (const pid of Object.keys(updatedPlayers)) {
        const p = updatedPlayers[pid];
        if (p.injured && p.injuryWeeks > 0) {
          const updated = { ...p, injuryWeeks: p.injuryWeeks - 1 };
          if (updated.injuryWeeks <= 0) {
            updated.injured = false;
          }
          updatedPlayers[pid] = updated;
        }
      }

      // Generate news
      const weekNews = generateWeeklyNews({ ...newState, leagues: newLeagues });

      // Check if season ended
      const allDone = newLeagues.every(l => l.currentMatchday > l.totalMatchdays);

      return {
        ...newState,
        leagues: newLeagues,
        players: updatedPlayers,
        teams: prev.teams,
        news: [...weekNews, ...prev.news].slice(0, 100),
        phase: allDone ? 'end_season' : 'in_season',
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
    <GameContext.Provider
      value={{ state, initializeGame, simulateWeek, getTeam, getPlayer, getLeagueStandings, getTopScorers }}
    >
      {children}
    </GameContext.Provider>
  );
}
