import React, { useState, useMemo } from 'react';
import { useGame } from '@/engine/GameContext';
import { getPlayerOverall } from '@/engine/generator';

const LoanPanel: React.FC<{ onPlayerClick?: (id: string) => void }> = ({ onPlayerClick }) => {
  const { state, loanPlayerOut, loanPlayerIn } = useGame();
  const managedId = state.managedTeamId;
  const managed = managedId ? state.teams[managedId] : null;

  const [tab, setTab] = useState<'out' | 'in' | 'active'>('out');
  const [search, setSearch] = useState('');
  const [weeks, setWeeks] = useState(38);
  const [buyOption, setBuyOption] = useState(0);
  const [targetTeamId, setTargetTeamId] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  if (!managed) {
    return <p className="text-muted-foreground text-sm py-6 text-center">Loan system available in Manager Mode.</p>;
  }

  // Players to send out: own squad youth or fringe
  const outCandidates = managed.squad.filter(p => !p.retired && (p.age <= 22 || getPlayerOverall(p) < managed.reputation - 10));

  // Players to bring in: from other clubs, young, currently not on loan
  const inCandidates = useMemo(() => {
    const list: { player: typeof managed.squad[number]; teamName: string }[] = [];
    for (const team of Object.values(state.teams)) {
      if (team.id === managedId) continue;
      for (const p of team.squad) {
        if (p.retired || p.onLoanFromTeamId) continue;
        if (p.age <= 23 && getPlayerOverall(p) >= managed.reputation - 15) {
          if (search && !`${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())) continue;
          list.push({ player: p, teamName: team.name });
        }
      }
    }
    return list.sort((a, b) => getPlayerOverall(b.player) - getPlayerOverall(a.player)).slice(0, 40);
  }, [state.teams, managedId, search, managed.reputation]);

  const handleLoanOut = (playerId: string) => {
    if (!targetTeamId) { setMessage('Pick a destination club.'); return; }
    const r = loanPlayerOut(playerId, targetTeamId, weeks, buyOption);
    setMessage(r.message);
  };

  const handleLoanIn = (playerId: string) => {
    const r = loanPlayerIn(playerId, weeks, buyOption);
    setMessage(r.message);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg text-muted-foreground">🔄 LOAN MARKET — {managed.name}</h3>

      <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
        {(['out', 'in', 'active'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setMessage(''); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize ${tab === t ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'out' ? 'Loan Out' : t === 'in' ? 'Loan In' : 'Active Loans'}
          </button>
        ))}
      </div>

      {(tab === 'out' || tab === 'in') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-secondary/20 p-3 rounded-lg">
          <div>
            <label className="text-xs text-muted-foreground">Duration (weeks)</label>
            <input type="number" value={weeks} onChange={e => setWeeks(Math.max(4, Number(e.target.value)))}
              className="w-full bg-secondary rounded px-2 py-1 text-sm text-foreground" min={4} max={76} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Buy Option (€M, 0=none)</label>
            <input type="number" value={buyOption} onChange={e => setBuyOption(Math.max(0, Number(e.target.value)))}
              className="w-full bg-secondary rounded px-2 py-1 text-sm text-foreground" min={0} />
          </div>
          {tab === 'out' && (
            <div>
              <label className="text-xs text-muted-foreground">Destination</label>
              <select value={targetTeamId} onChange={e => setTargetTeamId(e.target.value)}
                className="w-full bg-secondary rounded px-2 py-1 text-sm text-foreground">
                <option value="">— pick club —</option>
                {Object.values(state.teams).filter(t => t.id !== managedId).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {message && <p className="text-sm text-accent">{message}</p>}

      {tab === 'out' && (
        <div className="space-y-1">
          {outCandidates.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No fringe players to loan out.</p>}
          {outCandidates.map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 bg-card/30 rounded text-sm">
              <span className="w-8 text-center font-display text-primary">{getPlayerOverall(p)}</span>
              <button onClick={() => onPlayerClick?.(p.id)} className="flex-1 text-left hover:text-primary truncate">
                {p.firstName} {p.lastName} <span className="text-xs text-muted-foreground">{p.position} · {p.age}y</span>
              </button>
              <button onClick={() => handleLoanOut(p.id)} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30">Loan Out</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'in' && (
        <>
          <input placeholder="Search name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary rounded px-3 py-2 text-sm text-foreground" />
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {inCandidates.map(({ player: p, teamName }) => (
              <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 bg-card/30 rounded text-sm">
                <span className="w-8 text-center font-display text-primary">{getPlayerOverall(p)}</span>
                <button onClick={() => onPlayerClick?.(p.id)} className="flex-1 text-left hover:text-primary truncate">
                  {p.firstName} {p.lastName} <span className="text-xs text-muted-foreground">{p.position} · {p.age}y · {teamName}</span>
                </button>
                <button onClick={() => handleLoanIn(p.id)} className="text-xs bg-accent/20 text-accent px-2 py-1 rounded hover:bg-accent/30">Loan In</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'active' && (
        <div className="space-y-1">
          {state.loanDeals.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No active loans.</p>}
          {state.loanDeals.map(l => (
            <div key={l.id} className="bg-card/30 rounded p-2 text-sm flex items-center gap-2">
              <button onClick={() => onPlayerClick?.(l.playerId)} className="flex-1 text-left hover:text-primary truncate">
                <span className="font-medium">{l.playerName}</span>
                <span className="text-xs text-muted-foreground ml-2">{l.fromTeamName} → {l.toTeamName}</span>
              </button>
              <span className="text-xs text-muted-foreground">{l.weeksRemaining}w left</span>
              {l.buyOption > 0 && <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">€{l.buyOption}M opt</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoanPanel;
