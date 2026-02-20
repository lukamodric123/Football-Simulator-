import React from 'react';
import { useGame } from '@/engine/GameContext';
import { getPlayerOverall } from '@/engine/generator';

const HallOfFame: React.FC = () => {
  const { state } = useGame();

  // Greatest teams — clubs with most league titles
  const topClubs = Object.values(state.teams)
    .sort((a, b) => b.titles - a.titles)
    .slice(0, 10);

  // All time records
  const records = state.allTimeRecords;

  // Legend players
  const legends = [...Object.values(state.players), ...state.retiredPlayers]
    .filter(p => p.isLegend)
    .sort((a, b) => b.trophies - a.trophies)
    .slice(0, 15);

  // Top assist leaders (career)
  const topAssists = [...Object.values(state.players), ...state.retiredPlayers]
    .filter(p => p.careerAssists + p.assists > 0)
    .sort((a, b) => (b.careerAssists + b.assists) - (a.careerAssists + a.assists))
    .slice(0, 8);

  // Top appearance makers
  const topAppearances = [...Object.values(state.players), ...state.retiredPlayers]
    .filter(p => p.careerAppearances + p.appearances > 10)
    .sort((a, b) => (b.careerAppearances + b.appearances) - (a.careerAppearances + a.appearances))
    .slice(0, 8);

  // UCL dynasty (most UCL wins)
  const uclWinners: Record<string, number> = {};
  for (const h of state.uclHistory) {
    uclWinners[h.winner] = (uclWinners[h.winner] || 0) + 1;
  }
  const topUCLClubs = Object.entries(uclWinners).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // WC dynasty
  const wcWinners: Record<string, number> = {};
  for (const h of state.worldCupHistory) {
    wcWinners[h.winner] = (wcWinners[h.winner] || 0) + 1;
  }
  const topWCNations = Object.entries(wcWinners).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* All-Time Records */}
      {records.length > 0 && (
        <div>
          <h3 className="font-display text-lg text-muted-foreground mb-3">📜 ALL-TIME RECORDS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {records.map(r => (
              <div key={r.type} className="bg-card/50 rounded-lg p-3 border border-accent/20">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                  {r.type === 'clean_sheets' ? 'Most Clean Sheets' : `Most Career ${r.type.charAt(0).toUpperCase() + r.type.slice(1)}`}
                </p>
                <p className="font-display text-2xl text-accent">{r.value}</p>
                <p className="text-sm font-medium">{r.playerName}</p>
                <p className="text-xs text-muted-foreground">Set in Season {r.season}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Greatest clubs */}
        <div>
          <h3 className="font-display text-base text-muted-foreground mb-2">🏆 GREATEST CLUBS (LEAGUE TITLES)</h3>
          {topClubs.filter(t => t.titles > 0).length === 0
            ? <p className="text-muted-foreground text-sm">Simulate more seasons to build dynasties.</p>
            : (
            <div className="space-y-1">
              {topClubs.filter(t => t.titles > 0).map((t, i) => (
                <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 bg-card/30 rounded text-sm">
                  <span className={`w-5 text-center text-xs font-bold ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="flex-1 font-medium truncate">{t.name}</span>
                  <span className="font-display text-accent">{t.titles} 🏆</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UCL Winners */}
        {topUCLClubs.length > 0 && (
          <div>
            <h3 className="font-display text-base text-muted-foreground mb-2">⭐ UCL DYNASTY</h3>
            <div className="space-y-1">
              {topUCLClubs.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-2 py-1.5 px-2 bg-card/30 rounded text-sm">
                  <span className={`w-5 text-center text-xs font-bold ${i === 0 ? 'text-blue-300' : 'text-muted-foreground'}`}>{i + 1}</span>
                  <span className="flex-1 font-medium">{name}</span>
                  <span className="font-display text-blue-300">{count}x ⭐</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Assists */}
        {topAssists.length > 0 && (
          <div>
            <h3 className="font-display text-base text-muted-foreground mb-2">🅰️ ALL-TIME ASSIST LEADERS</h3>
            <div className="space-y-1">
              {topAssists.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 bg-card/30 rounded text-sm">
                  <span className={`w-5 text-center text-xs font-bold ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{p.firstName} {p.lastName}</span>
                    {p.retired && <span className="text-xs text-muted-foreground ml-1">(Ret.)</span>}
                  </div>
                  <span className="font-display text-accent">{p.careerAssists + p.assists}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* World Cup Winners */}
        {topWCNations.length > 0 && (
          <div>
            <h3 className="font-display text-base text-muted-foreground mb-2">🌍 WORLD CUP NATIONS</h3>
            <div className="space-y-1">
              {topWCNations.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-2 py-1.5 px-2 bg-card/30 rounded text-sm">
                  <span className={`w-5 text-center text-xs font-bold ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
                  <span className="flex-1 font-medium">{name}</span>
                  <span className="font-display text-accent">{count}x 🌍</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legends */}
      {legends.length > 0 && (
        <div>
          <h3 className="font-display text-lg text-muted-foreground mb-3">⭐ LEGENDS OF THE GAME</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {legends.map(p => {
              const ovr = getPlayerOverall(p);
              return (
                <div key={p.id} className="bg-card/50 rounded-lg p-3 flex items-start gap-3 border border-accent/10">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center font-display text-lg flex-shrink-0" style={{ color: 'hsl(var(--accent))' }}>
                  {ovr}
                </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.firstName} {p.lastName}</span>
                      {p.retired && <span className="text-xs text-muted-foreground">(Retired)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.position} · {p.nationality} · {p.legendType}</p>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="text-primary">{p.careerGoals + p.goals}G</span>
                      <span className="text-accent">{p.careerAssists + p.assists}A</span>
                      <span>🏆 {p.trophies}</span>
                      <span>🥇 {p.individualAwards.length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HallOfFame;
