import React from 'react';
import { UCLTournament, Team } from '@/engine/types';

interface UCLViewProps {
  ucl: UCLTournament | null;
  uclHistory: { season: number; winner: string; topScorer?: string; bestPlayer?: string }[];
  teams: Record<string, Team>;
  onTeamClick?: (teamId: string) => void;
}

const UCLView: React.FC<UCLViewProps> = ({ ucl, uclHistory, teams, onTeamClick }) => {
  return (
    <div className="space-y-6">
      {ucl && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">⭐</span>
            <h3 className="font-display text-2xl">CHAMPIONS LEAGUE · Season {ucl.season}</h3>
            {ucl.winner && (
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-display">
                🏆 {ucl.winner}
              </span>
            )}
          </div>

          {/* Awards */}
          {ucl.knockoutRound === 'complete' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {ucl.winner && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">🏆</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Champion</p>
                  <p className="font-display text-lg text-primary">{ucl.winner}</p>
                </div>
              )}
              {ucl.topScorer && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">👟</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Top Scorer</p>
                  <p className="font-display text-sm text-accent">{ucl.topScorer.playerName}</p>
                  <p className="text-xs text-muted-foreground">{ucl.topScorer.goals} goals</p>
                </div>
              )}
              {ucl.bestPlayer && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">⭐</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Best Player</p>
                  <p className="font-display text-sm text-primary">{ucl.bestPlayer.playerName}</p>
                </div>
              )}
            </div>
          )}

          {/* Knockout bracket */}
          {ucl.knockoutFixtures.length > 0 && (
            <div className="mb-6">
              <h4 className="font-display text-sm text-muted-foreground mb-3">KNOCKOUT RESULTS</h4>
              <div className="space-y-1.5">
                {ucl.knockoutFixtures.map(f => {
                  const home = teams[f.homeTeamId];
                  const away = teams[f.awayTeamId];
                  return (
                    <div key={f.id} className="flex items-center gap-2 bg-card/50 rounded-md px-3 py-2 text-sm">
                      <div className="flex-1 text-right flex items-center justify-end gap-2">
                        <span
                          className={`font-medium truncate cursor-pointer hover:text-primary ${f.homeGoals > f.awayGoals ? 'text-foreground' : 'text-muted-foreground'}`}
                          onClick={() => onTeamClick?.(f.homeTeamId)}
                        >
                          {home?.shortName || f.homeTeamId}
                        </span>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: home?.color || '#666' }} />
                      </div>
                      <div className="w-16 text-center font-display text-lg">
                        <span className={f.homeGoals > f.awayGoals ? 'text-foreground' : 'text-muted-foreground'}>{f.homeGoals}</span>
                        <span className="text-muted-foreground mx-1">-</span>
                        <span className={f.awayGoals > f.homeGoals ? 'text-foreground' : 'text-muted-foreground'}>{f.awayGoals}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: away?.color || '#666' }} />
                        <span
                          className={`font-medium truncate cursor-pointer hover:text-primary ${f.awayGoals > f.homeGoals ? 'text-foreground' : 'text-muted-foreground'}`}
                          onClick={() => onTeamClick?.(f.awayTeamId)}
                        >
                          {away?.shortName || f.awayTeamId}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ucl.groups.map(group => (
              <div key={group.name} className="bg-card/50 rounded-lg p-3">
                <h4 className="font-display text-sm text-muted-foreground mb-2">GROUP {group.name}</h4>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border/50">
                      <th className="text-left py-1 px-1">Team</th>
                      <th className="text-center py-1 w-6">P</th>
                      <th className="text-center py-1 w-6">W</th>
                      <th className="text-center py-1 w-6">D</th>
                      <th className="text-center py-1 w-6">L</th>
                      <th className="text-center py-1 w-8">GD</th>
                      <th className="text-center py-1 w-8 font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...group.standings]
                      .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst))
                      .map((s, i) => {
                        const team = teams[s.teamId];
                        const gd = s.goalsFor - s.goalsAgainst;
                        return (
                          <tr
                            key={s.teamId}
                            className={`border-b border-border/30 cursor-pointer hover:bg-secondary/30 ${i < 2 ? 'bg-primary/5' : ''}`}
                            onClick={() => onTeamClick?.(s.teamId)}
                          >
                            <td className="py-1.5 px-1 font-medium">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team?.color || '#666' }} />
                                {team?.shortName || s.teamId}
                              </div>
                            </td>
                            <td className="text-center text-muted-foreground">{s.played}</td>
                            <td className="text-center">{s.won}</td>
                            <td className="text-center text-muted-foreground">{s.drawn}</td>
                            <td className="text-center text-muted-foreground">{s.lost}</td>
                            <td className={`text-center ${gd > 0 ? 'text-win' : gd < 0 ? 'text-loss' : 'text-muted-foreground'}`}>
                              {gd > 0 ? `+${gd}` : gd}
                            </td>
                            <td className="text-center font-bold text-accent">{s.points}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UCL History */}
      {uclHistory.length > 0 && (
        <div>
          <h4 className="font-display text-lg text-primary mb-3">⭐ UCL HISTORY</h4>
          <div className="space-y-2">
            {[...uclHistory].reverse().map((ucl) => (
              <div key={ucl.season} className="flex items-center gap-3 bg-card/50 rounded-lg px-4 py-3">
                <span className="font-display text-sm text-muted-foreground w-16">S{ucl.season}</span>
                <div className="flex-1">
                  <span className="font-display text-lg text-primary">🏆 {ucl.winner}</span>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  {ucl.topScorer && <p>👟 {ucl.topScorer}</p>}
                  {ucl.bestPlayer && <p>⭐ {ucl.bestPlayer}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!ucl && uclHistory.length === 0 && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">⭐</p>
          <p className="text-muted-foreground">Champions League runs at the end of each season.</p>
          <p className="text-sm text-muted-foreground">Complete a season to see the first UCL tournament!</p>
        </div>
      )}
    </div>
  );
};

export default UCLView;
