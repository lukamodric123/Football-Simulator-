import React from 'react';
import { WorldCup } from '@/engine/types';

interface WorldCupViewProps {
  worldCup: WorldCup;
  worldCupHistory: { season: number; winner: string; goldenBoot?: string; goldenBall?: string }[];
}

const WorldCupView: React.FC<WorldCupViewProps> = ({ worldCup, worldCupHistory }) => {
  return (
    <div className="space-y-6">
      {/* Current/Latest World Cup */}
      {worldCup && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">🌍</span>
            <h3 className="font-display text-2xl">WORLD CUP · Season {worldCup.season}</h3>
            {worldCup.winner && (
              <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-display">
                🏆 {worldCup.winner}
              </span>
            )}
          </div>

          {/* Awards */}
          {worldCup.knockoutRound === 'complete' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {worldCup.winner && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">🏆</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Champion</p>
                  <p className="font-display text-lg text-accent">{worldCup.winner}</p>
                </div>
              )}
              {worldCup.goldenBoot && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">👟</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Golden Boot</p>
                  <p className="font-display text-sm text-primary">{worldCup.goldenBoot.playerName}</p>
                  <p className="text-xs text-muted-foreground">{worldCup.goldenBoot.goals} goals</p>
                </div>
              )}
              {worldCup.goldenBall && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">⭐</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Golden Ball</p>
                  <p className="font-display text-sm text-accent">{worldCup.goldenBall.playerName}</p>
                </div>
              )}
            </div>
          )}

          {/* Group Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {worldCup.groups.map(group => (
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
                        const team = group.teams.find(t => t.id === s.teamId);
                        const gd = s.goalsFor - s.goalsAgainst;
                        return (
                          <tr key={s.teamId} className={`border-b border-border/30 ${i < 2 ? 'bg-primary/5' : ''}`}>
                            <td className="py-1.5 px-1 font-medium">{team?.country || s.teamId}</td>
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

      {/* World Cup History */}
      {worldCupHistory.length > 0 && (
        <div>
          <h4 className="font-display text-lg text-accent mb-3">🌍 WORLD CUP HISTORY</h4>
          <div className="space-y-2">
            {[...worldCupHistory].reverse().map((wc, i) => (
              <div key={wc.season} className="flex items-center gap-3 bg-card/50 rounded-lg px-4 py-3">
                <span className="font-display text-sm text-muted-foreground w-16">S{wc.season}</span>
                <div className="flex-1">
                  <span className="font-display text-lg text-accent">🏆 {wc.winner}</span>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  {wc.goldenBoot && <p>👟 {wc.goldenBoot}</p>}
                  {wc.goldenBall && <p>⭐ {wc.goldenBall}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!worldCup && worldCupHistory.length === 0 && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">🌍</p>
          <p className="text-muted-foreground">The World Cup takes place every 4 seasons.</p>
          <p className="text-sm text-muted-foreground">Keep simulating to see the first tournament!</p>
        </div>
      )}
    </div>
  );
};

export default WorldCupView;
