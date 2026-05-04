import React from 'react';
import { useGame } from '@/engine/GameContext';

const DomesticCupView: React.FC<{ onTeamClick?: (id: string) => void }> = ({ onTeamClick }) => {
  const { state } = useGame();
  const cups = state.domesticCups;

  if (cups.length === 0) {
    return <p className="text-muted-foreground text-sm py-6 text-center">No active cups. Cups generate at season start.</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg text-muted-foreground">🏆 DOMESTIC CUPS — SEASON {state.season}</h3>

      {cups.map(cup => {
        const recentFixtures = cup.fixtures.slice(-8).reverse();
        return (
          <div key={cup.id} className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-display text-xl">{cup.name}</h4>
                <p className="text-xs text-muted-foreground capitalize">
                  Round: {cup.round === 'complete' ? '✅ Complete' : cup.round === 'r32' ? 'Round of 32' : cup.round === 'r16' ? 'Round of 16' : cup.round === 'qf' ? 'Quarter-finals' : cup.round === 'sf' ? 'Semi-finals' : 'Final'}
                  {' · '}{cup.remainingTeamIds.length} teams remaining
                </p>
              </div>
              {cup.winnerTeamId && state.teams[cup.winnerTeamId] && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Winner</p>
                  <p className="font-display text-accent">{state.teams[cup.winnerTeamId].name}</p>
                </div>
              )}
            </div>

            {recentFixtures.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recent Results</p>
                {recentFixtures.map(f => {
                  const home = state.teams[f.homeTeamId];
                  const away = state.teams[f.awayTeamId];
                  if (!home || !away) return null;
                  const upset = (f.homeGoals < f.awayGoals && away.reputation < home.reputation - 12) ||
                                (f.homeGoals > f.awayGoals && home.reputation < away.reputation - 12);
                  return (
                    <div key={f.id} className="flex items-center gap-2 text-sm py-1.5 px-2 bg-card/50 rounded">
                      <button onClick={() => onTeamClick?.(home.id)} className="flex-1 text-right hover:text-primary truncate">{home.name}</button>
                      <span className="font-display px-2 text-foreground">{f.homeGoals} - {f.awayGoals}</span>
                      <button onClick={() => onTeamClick?.(away.id)} className="flex-1 hover:text-primary truncate">{away.name}</button>
                      {upset && <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">UPSET</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {state.domesticCupHistory.length > 0 && (
        <div>
          <h4 className="font-display text-base text-muted-foreground mb-2">📜 CUP HISTORY</h4>
          <div className="space-y-1">
            {[...state.domesticCupHistory].reverse().slice(0, 15).map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1.5 px-2 bg-card/30 rounded">
                <span className="text-xs text-muted-foreground w-16">S{h.season}</span>
                <span className="flex-1 truncate">{h.cupName}</span>
                <span className="font-display text-accent text-sm">🏆 {h.winnerName}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">vs {h.runnerUpName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DomesticCupView;
