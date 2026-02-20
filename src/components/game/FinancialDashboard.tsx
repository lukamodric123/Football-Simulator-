import React from 'react';
import { useGame } from '@/engine/GameContext';
import { getPlayerOverall } from '@/engine/generator';

const FinancialDashboard: React.FC = () => {
  const { state } = useGame();

  // Top clubs by budget
  const topBudgetTeams = Object.values(state.teams)
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 10);

  // Top clubs by squad value
  const topValueTeams = Object.values(state.teams)
    .map(team => {
      const value = team.squad.reduce((sum, p) => {
        const player = state.players[p.id] || p;
        return sum + player.value;
      }, 0);
      return { team, value };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Transfer market summary
  const totalSpent = state.transferHistory.reduce((sum, t) => sum + t.fee, 0);
  const biggestDeal = state.transferHistory.sort((a, b) => b.fee - a.fee)[0];
  const totalTransfers = state.transferHistory.length;

  // Most valuable players
  const topValuePlayers = Object.values(state.players)
    .filter(p => !p.retired)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
        {[
          { label: 'Total Transfers', value: totalTransfers, icon: '💰' },
          { label: 'Total Spent', value: `€${totalSpent}M`, icon: '📊' },
          { label: 'Biggest Deal', value: biggestDeal ? `€${biggestDeal.fee}M` : '—', icon: '🔥' },
          { label: 'Top Club Value', value: topValueTeams[0] ? `€${topValueTeams[0].value}M` : '—', icon: '🏆' },
        ].map(s => (
          <div key={s.label} className="bg-secondary/50 rounded-lg p-3">
            <p className="text-lg">{s.icon}</p>
            <p className="font-display text-xl mt-1">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Most valuable players */}
        <div>
          <h3 className="font-display text-base text-muted-foreground mb-2">💎 MOST VALUABLE PLAYERS</h3>
          <div className="space-y-1">
            {topValuePlayers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 bg-card/30 rounded text-sm">
                <span className={`w-5 text-center text-xs font-bold ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="truncate font-medium">{p.firstName} {p.lastName}</span>
                  <span className="text-xs text-muted-foreground ml-2">{p.position} · {p.age}y</span>
                </div>
                <span className="font-display text-accent text-sm">€{p.value}M</span>
                <span className="text-xs text-muted-foreground">{getPlayerOverall(p)} OVR</span>
              </div>
            ))}
          </div>
        </div>

        {/* Richest clubs */}
        <div>
          <h3 className="font-display text-base text-muted-foreground mb-2">🏦 RICHEST CLUBS</h3>
          <div className="space-y-1">
            {topBudgetTeams.map((t, i) => (
              <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 bg-card/30 rounded text-sm">
                <span className={`w-5 text-center text-xs font-bold ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                <span className="flex-1 font-medium truncate">{t.name}</span>
                <span className="font-display text-primary text-sm">€{t.budget}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Biggest deals */}
      {state.transferHistory.length > 0 && (
        <div>
          <h3 className="font-display text-base text-muted-foreground mb-2">🔥 BIGGEST TRANSFERS EVER</h3>
          <div className="space-y-1">
            {[...state.transferHistory].sort((a, b) => b.fee - a.fee).slice(0, 8).map((t, i) => (
              <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 bg-card/30 rounded text-sm">
                <span className={`w-5 text-center text-xs font-bold ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{t.playerName}</span>
                  <span className="text-xs text-muted-foreground ml-2">{t.fromTeamName} → {t.toTeamName}</span>
                </div>
                <span className={`font-display text-sm ${t.fee >= 100 ? 'text-accent' : 'text-primary'}`}>€{t.fee}M</span>
                <span className="text-xs text-muted-foreground">S{t.season}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;
