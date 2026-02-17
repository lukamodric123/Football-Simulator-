import React, { useState } from 'react';
import { useGame } from '@/engine/GameContext';
import StandingsTable from '@/components/game/StandingsTable';
import SquadView from '@/components/game/SquadView';
import MatchResults from '@/components/game/MatchResults';
import NewsFeed from '@/components/game/NewsFeed';
import PlayerDetail from '@/components/game/PlayerDetail';
import { LEAGUES } from '@/engine/data';

type View = 'dashboard' | 'team' | 'player' | 'topscorers';

const Dashboard: React.FC = () => {
  const { state, simulateWeek, getLeagueStandings, getTeam, getTopScorers } = useGame();
  const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0].id);
  const [view, setView] = useState<View>('dashboard');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [tab, setTab] = useState<'standings' | 'results' | 'scorers'>('standings');

  const league = state.leagues.find(l => l.id === selectedLeague);
  const standings = getLeagueStandings(selectedLeague);

  const handleTeamClick = (teamId: string) => {
    setSelectedTeamId(teamId);
    setView('team');
  };

  const handlePlayerClick = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setView('player');
  };

  if (view === 'player' && selectedPlayerId) {
    const player = state.players[selectedPlayerId];
    if (player) {
      return (
        <div className="max-w-4xl mx-auto p-4">
          <PlayerDetail player={player} onBack={() => setView(selectedTeamId ? 'team' : 'dashboard')} />
        </div>
      );
    }
  }

  if (view === 'team' && selectedTeamId) {
    const team = getTeam(selectedTeamId);
    if (team) {
      return (
        <div className="max-w-4xl mx-auto p-4">
          <button
            onClick={() => setView('dashboard')}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
          >
            ← Back to League
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-foreground font-display text-xl"
              style={{ backgroundColor: team.color + '33', borderLeft: `3px solid ${team.color}` }}
            >
              {team.shortName}
            </div>
            <div>
              <h2 className="font-display text-3xl">{team.name}</h2>
              <p className="text-sm text-muted-foreground">
                {team.tactic} · Rep: {team.reputation} · Budget: €{team.budget}M
              </p>
            </div>
          </div>
          <SquadView team={team} players={state.players} onPlayerClick={handlePlayerClick} />
        </div>
      );
    }
  }

  const topScorers = getTopScorers(selectedLeague);

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground">
            ULTIMATE SOCCER<span className="text-primary"> SIM</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Season {state.season} · Week {state.week}
            {state.phase === 'end_season' && <span className="text-accent ml-2">— Season Complete!</span>}
          </p>
        </div>
        <button
          onClick={simulateWeek}
          disabled={state.phase === 'end_season'}
          className="gradient-pitch text-primary-foreground px-6 py-3 rounded-lg font-display text-xl tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 glow-pitch"
        >
          {state.phase === 'end_season' ? 'SEASON OVER' : 'SIMULATE WEEK ▶'}
        </button>
      </div>

      {/* League Selector */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {LEAGUES.map(l => (
          <button
            key={l.id}
            onClick={() => setSelectedLeague(l.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              selectedLeague === l.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Table & Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit">
            {(['standings', 'results', 'scorers'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  tab === t ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'scorers' ? 'Top Scorers' : t}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-lg p-4">
            {tab === 'standings' && (
              <StandingsTable standings={standings} onTeamClick={handleTeamClick} />
            )}
            {tab === 'results' && league && (
              <div>
                <h3 className="font-display text-lg text-muted-foreground mb-3">
                  MATCHDAY {Math.max(1, league.currentMatchday - 1)}
                </h3>
                <MatchResults
                  fixtures={league.fixtures}
                  teams={state.teams}
                  matchday={Math.max(1, league.currentMatchday - 1)}
                />
              </div>
            )}
            {tab === 'scorers' && (
              <div>
                <h3 className="font-display text-lg text-muted-foreground mb-3">TOP SCORERS</h3>
                <div className="space-y-1">
                  {topScorers.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">No goals scored yet</p>
                  )}
                  {topScorers.map((s, i) => (
                    <div
                      key={s.player.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-md card-hover cursor-pointer bg-card/50"
                      onClick={() => handlePlayerClick(s.player.id)}
                    >
                      <span className={`w-6 text-center font-bold text-sm ${i < 3 ? 'text-accent' : 'text-muted-foreground'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">
                          {s.player.firstName} {s.player.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">{s.team.shortName}</span>
                      </div>
                      <span className="font-display text-xl text-primary">{s.goals}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: News */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4">
            <h3 className="font-display text-lg text-muted-foreground mb-3">📰 NEWS FEED</h3>
            <NewsFeed news={state.news} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
