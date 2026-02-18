import React, { useState } from 'react';
import { useGame } from '@/engine/GameContext';
import StandingsTable from '@/components/game/StandingsTable';
import SquadView from '@/components/game/SquadView';
import MatchResults from '@/components/game/MatchResults';
import NewsFeed from '@/components/game/NewsFeed';
import PlayerDetail from '@/components/game/PlayerDetail';
import GOATRankings from '@/components/game/GOATRankings';
import AwardsHistory from '@/components/game/AwardsHistory';
import WorldCupView from '@/components/game/WorldCupView';
import { LEAGUES } from '@/engine/data';

type View = 'dashboard' | 'team' | 'player';

const Dashboard: React.FC = () => {
  const { state, simulateWeek, simulateMultipleWeeks, advanceToNextSeason, getLeagueStandings, getTeam, getTopScorers } = useGame();
  const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0].id);
  const [view, setView] = useState<View>('dashboard');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [tab, setTab] = useState<'standings' | 'results' | 'scorers' | 'goat' | 'awards' | 'worldcup'>('standings');
  const [simming, setSimming] = useState(false);

  const league = state.leagues.find(l => l.id === selectedLeague);
  const standings = getLeagueStandings(selectedLeague);
  const managedTeam = state.managedTeamId ? getTeam(state.managedTeamId) : null;

  // Separate tier 1 and tier 2 leagues
  const tier1Leagues = state.leagues.filter(l => l.tier === 1);
  const tier2Leagues = state.leagues.filter(l => l.tier === 2);

  const handleTeamClick = (teamId: string) => { setSelectedTeamId(teamId); setView('team'); };
  const handlePlayerClick = (playerId: string) => { setSelectedPlayerId(playerId); setView('player'); };

  const handleFastSim = (weeks: number) => {
    setSimming(true);
    setTimeout(() => {
      simulateMultipleWeeks(weeks);
      setSimming(false);
    }, 50);
  };

  if (view === 'player' && selectedPlayerId) {
    const player = state.players[selectedPlayerId] || state.retiredPlayers.find(p => p.id === selectedPlayerId);
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
          <button onClick={() => setView('dashboard')} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to League</button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-foreground font-display text-xl" style={{ backgroundColor: team.color + '33', borderLeft: `3px solid ${team.color}` }}>
              {team.shortName}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-3xl">{team.name}</h2>
                {state.managedTeamId === team.id && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">YOUR CLUB</span>}
              </div>
              <p className="text-sm text-muted-foreground">
                {team.tactic} · Rep: {team.reputation} · Budget: €{team.budget}M · 🏆 {team.titles}
              </p>
              <p className="text-xs text-muted-foreground">
                Manager: {team.managerName} ({team.managerStyle.replace(/_/g, ' ')}) · Fan Mood: {team.fanMood}
                {' · '}{state.leagues.find(l => l.teams.includes(team.id))?.name || ''}
              </p>
            </div>
          </div>
          <SquadView team={team} players={state.players} onPlayerClick={handlePlayerClick} />
        </div>
      );
    }
  }

  const topScorers = getTopScorers(selectedLeague);
  const nextWorldCup = 4 - (state.season % 4);

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-foreground">
            ULTIMATE SOCCER<span className="text-primary"> SIM</span>
          </h1>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-muted-foreground">Season {state.season} · Week {state.week}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${state.gameMode === 'manager' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
              {state.gameMode === 'manager' ? `🎯 Manager: ${managedTeam?.shortName || ''}` : '🌍 Universe Mode'}
            </span>
            {state.phase === 'end_season' && <span className="text-accent text-xs">✨ Season Complete!</span>}
            {nextWorldCup <= 4 && nextWorldCup > 0 && state.season % 4 !== 0 && (
              <span className="text-xs text-muted-foreground">🌍 WC in {nextWorldCup}S</span>
            )}
            {state.season % 4 === 0 && state.worldCup && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">🌍 WORLD CUP YEAR</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {state.phase === 'end_season' ? (
            <button
              onClick={advanceToNextSeason}
              className="gradient-gold text-accent-foreground px-5 py-2.5 rounded-lg font-display text-lg tracking-wider hover:opacity-90 transition-opacity glow-gold"
            >
              NEXT SEASON ▶
            </button>
          ) : (
            <>
              <button
                onClick={simulateWeek}
                disabled={simming}
                className="gradient-pitch text-primary-foreground px-4 py-2 rounded-lg font-display text-base tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 glow-pitch"
              >
                +1 WEEK
              </button>
              <button
                onClick={() => handleFastSim(5)}
                disabled={simming}
                className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg font-display text-sm tracking-wider hover:bg-secondary/80 disabled:opacity-40"
              >
                +5
              </button>
              <button
                onClick={() => handleFastSim(10)}
                disabled={simming}
                className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg font-display text-sm tracking-wider hover:bg-secondary/80 disabled:opacity-40"
              >
                +10
              </button>
              <button
                onClick={() => handleFastSim(999)}
                disabled={simming}
                className="bg-accent/20 text-accent px-3 py-2 rounded-lg font-display text-sm tracking-wider hover:bg-accent/30 disabled:opacity-40"
              >
                END SEASON ⏩
              </button>
            </>
          )}
        </div>
      </div>

      {simming && (
        <div className="mb-4 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm animate-pulse font-medium">
          ⚡ Simulating matches...
        </div>
      )}

      {/* League Selector with Tiers */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-1 overflow-x-auto pb-1">
          <span className="text-xs text-muted-foreground self-center px-1 whitespace-nowrap">T1</span>
          {tier1Leagues.map(l => (
            <button
              key={l.id}
              onClick={() => { setSelectedLeague(l.id); if (tab === 'worldcup') setTab('standings'); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                selectedLeague === l.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          <span className="text-xs text-muted-foreground self-center px-1 whitespace-nowrap">T2</span>
          {tier2Leagues.map(l => (
            <button
              key={l.id}
              onClick={() => { setSelectedLeague(l.id); if (tab === 'worldcup') setTab('standings'); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedLeague === l.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg overflow-x-auto">
            {(['standings', 'results', 'scorers', 'goat', 'awards', 'worldcup'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                  tab === t ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'scorers' ? '⚽ Scorers' : t === 'goat' ? '👑 GOAT' : t === 'awards' ? '🏆 Awards' : t === 'results' ? '📋 Results' : t === 'worldcup' ? '🌍 World Cup' : '📊 Table'}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-lg p-4">
            {tab === 'standings' && (
              <div>
                {league && league.tier === 1 && (
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-display text-lg text-muted-foreground">{league.name}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Top 4 qualify</span>
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">Bottom 3 relegated</span>
                  </div>
                )}
                {league && league.tier === 2 && (
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-display text-lg text-muted-foreground">{league.name}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Top 3 promoted</span>
                  </div>
                )}
                <StandingsTable standings={standings} onTeamClick={handleTeamClick} leagueTier={league?.tier} />
              </div>
            )}

            {tab === 'results' && league && (
              <div>
                <h3 className="font-display text-lg text-muted-foreground mb-3">MATCHDAY {Math.max(1, league.currentMatchday - 1)}</h3>
                <MatchResults fixtures={league.fixtures} teams={state.teams} matchday={Math.max(1, league.currentMatchday - 1)} />
              </div>
            )}

            {tab === 'scorers' && (
              <div>
                <h3 className="font-display text-lg text-muted-foreground mb-3">TOP SCORERS</h3>
                <div className="space-y-1">
                  {topScorers.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No goals scored yet</p>}
                  {topScorers.map((s, i) => (
                    <div key={s.player.id} className="flex items-center gap-3 py-2 px-3 rounded-md card-hover cursor-pointer bg-card/50" onClick={() => handlePlayerClick(s.player.id)}>
                      <span className={`w-6 text-center font-bold text-sm ${i < 3 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{s.player.firstName} {s.player.lastName}</span>
                        <span className="text-xs text-muted-foreground">{s.team.shortName}</span>
                      </div>
                      <span className="font-display text-xl text-primary">{s.goals}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'goat' && <GOATRankings rankings={state.goatRankings} onPlayerClick={handlePlayerClick} />}

            {tab === 'awards' && (
              <AwardsHistory awards={state.awards} allTimeRecords={state.allTimeRecords} seasonAwards={state.seasonAwards} />
            )}

            {tab === 'worldcup' && (
              <WorldCupView worldCup={state.worldCup!} worldCupHistory={state.worldCupHistory} />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Season Info Card */}
          <div className="bg-card rounded-lg p-4">
            <h3 className="font-display text-lg text-muted-foreground mb-3">📊 UNIVERSE STATUS</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-secondary/50 rounded p-2">
                <p className="text-xs text-muted-foreground">Seasons</p>
                <p className="font-display text-xl">{state.season}</p>
              </div>
              <div className="bg-secondary/50 rounded p-2">
                <p className="text-xs text-muted-foreground">Week</p>
                <p className="font-display text-xl">{state.week}</p>
              </div>
              <div className="bg-secondary/50 rounded p-2">
                <p className="text-xs text-muted-foreground">Retired</p>
                <p className="font-display text-xl">{state.retiredPlayers.length}</p>
              </div>
              <div className="bg-secondary/50 rounded p-2">
                <p className="text-xs text-muted-foreground">Legends</p>
                <p className="font-display text-xl">{Object.values(state.players).filter(p => p.isLegend && !p.retired).length}</p>
              </div>
            </div>

            {/* World Cup info */}
            {state.worldCupHistory.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">🌍 LAST WORLD CUP</p>
                <p className="text-sm font-medium text-accent">🏆 {state.worldCupHistory[state.worldCupHistory.length - 1].winner}</p>
              </div>
            )}

            {/* Promotion/Relegation log */}
            {state.promotionLog.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">↕️ LATEST MOVEMENTS</p>
                {state.promotionLog[state.promotionLog.length - 1].promoted.slice(0, 3).map(p => (
                  <p key={p.teamId} className="text-xs text-primary">⬆ {state.teams[p.teamId]?.name || p.teamId}</p>
                ))}
                {state.promotionLog[state.promotionLog.length - 1].relegated.slice(0, 3).map(r => (
                  <p key={r.teamId} className="text-xs text-destructive">⬇ {state.teams[r.teamId]?.name || r.teamId}</p>
                ))}
              </div>
            )}

            {/* GOAT preview */}
            {state.goatRankings.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">👑 CURRENT GOAT</p>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg text-accent">1.</span>
                  <div>
                    <p className="font-medium text-sm">{state.goatRankings[0].playerName}</p>
                    <p className="text-xs text-muted-foreground">
                      Score: {state.goatRankings[0].score} · ⚽{state.goatRankings[0].careerGoals} · 🏆{state.goatRankings[0].trophies}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* News Feed */}
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
