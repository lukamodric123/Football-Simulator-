import React from 'react';
import { useGame } from '@/engine/GameContext';

const RevenuePanel: React.FC = () => {
  const { state } = useGame();
  const teams = Object.values(state.teams);

  // sort by total revenue
  const ranked = [...teams]
    .map(t => ({ team: t, rev: t.lastSeasonRevenue?.total || 0 }))
    .sort((a, b) => b.rev - a.rev);

  const managed = state.managedTeamId ? state.teams[state.managedTeamId] : null;

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg text-muted-foreground">💸 SPONSORSHIP & REVENUE</h3>

      {managed && (
        <div className="bg-secondary/30 rounded-lg p-4">
          <h4 className="font-display text-xl mb-2">{managed.name} — Last Season Revenue</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Tickets', val: managed.lastSeasonRevenue?.ticketSales || 0, icon: '🎟️' },
              { label: 'Merch', val: managed.lastSeasonRevenue?.merchandise || 0, icon: '👕' },
              { label: 'Sponsors', val: managed.lastSeasonRevenue?.sponsorships || 0, icon: '🤝' },
              { label: 'Prize Money', val: managed.lastSeasonRevenue?.prizeMoney || 0, icon: '🏆' },
              { label: 'Total', val: managed.lastSeasonRevenue?.total || 0, icon: '💰' },
            ].map(s => (
              <div key={s.label} className="bg-card/50 rounded-lg p-3">
                <p className="text-lg">{s.icon}</p>
                <p className="font-display text-xl mt-1 text-primary">€{s.val}M</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <h5 className="text-sm text-muted-foreground mb-2">ACTIVE SPONSORS</h5>
          <div className="grid grid-cols-2 gap-2">
            {(managed.sponsors || []).map((sp, i) => (
              <div key={i} className="bg-card/50 rounded p-2 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{sp.name}</span>
                  <span className="text-xs text-muted-foreground ml-2 capitalize">{sp.type}</span>
                </div>
                <span className="font-display text-accent">€{sp.annualValue}M/yr</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-display text-base text-muted-foreground mb-2">🏦 TOP EARNING CLUBS (LAST SEASON)</h4>
        <div className="space-y-1">
          {ranked.slice(0, 12).map((r, i) => (
            <div key={r.team.id} className="flex items-center gap-2 py-1.5 px-2 bg-card/30 rounded text-sm">
              <span className={`w-5 text-center text-xs font-bold ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.team.color }} />
              <span className="flex-1 font-medium truncate">{r.team.name}</span>
              <span className="font-display text-primary">€{r.rev}M</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevenuePanel;
