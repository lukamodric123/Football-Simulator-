import React, { useState } from 'react';
import { Team, Player, positionToCategory } from '@/engine/types';
import { getPlayerOverall } from '@/engine/generator';

interface SquadViewProps {
  team: Team;
  players: Record<string, Player>;
  onPlayerClick?: (playerId: string) => void;
}

const posOrder = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

const posColors: Record<string, string> = {
  GK: 'bg-amber-500/20 text-amber-400',
  DEF: 'bg-blue-500/20 text-blue-400',
  MID: 'bg-emerald-500/20 text-emerald-400',
  FWD: 'bg-red-500/20 text-red-400',
};

function getOvrColor(ovr: number) {
  if (ovr >= 88) return 'text-accent font-bold';
  if (ovr >= 80) return 'text-primary font-semibold';
  if (ovr >= 65) return 'text-foreground';
  return 'text-muted-foreground';
}

function getMoraleIcon(morale: number) {
  if (morale >= 80) return '😊';
  if (morale >= 60) return '😐';
  return '😠';
}

function getFormBar(form: number) {
  const color = form >= 75 ? 'bg-primary' : form >= 55 ? 'bg-accent' : 'bg-destructive';
  return (
    <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${form}%` }} />
    </div>
  );
}

const SquadView: React.FC<SquadViewProps> = ({ team, players, onPlayerClick }) => {
  const [sortBy, setSortBy] = useState<'position' | 'overall' | 'value' | 'age'>('position');
  const [showStats, setShowStats] = useState<'season' | 'career'>('season');

  const squadWithStats = team.squad
    .map(p => players[p.id] || p)
    .filter(p => !p.retired);

  const sorted = [...squadWithStats].sort((a, b) => {
    if (sortBy === 'position') {
      const ca = positionToCategory(a.position);
      const cb = positionToCategory(b.position);
      if (posOrder[ca] !== posOrder[cb]) return posOrder[ca] - posOrder[cb];
      return getPlayerOverall(b) - getPlayerOverall(a);
    }
    if (sortBy === 'overall') return getPlayerOverall(b) - getPlayerOverall(a);
    if (sortBy === 'value') return b.value - a.value;
    if (sortBy === 'age') return a.age - b.age;
    return 0;
  });

  const grouped: Record<string, Player[]> = sortBy === 'position'
    ? {
        GK: sorted.filter(p => positionToCategory(p.position) === 'GK'),
        DEF: sorted.filter(p => positionToCategory(p.position) === 'DEF'),
        MID: sorted.filter(p => positionToCategory(p.position) === 'MID'),
        FWD: sorted.filter(p => positionToCategory(p.position) === 'FWD'),
      }
    : { ALL: sorted };

  const groupLabels: Record<string, string> = {
    GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards', ALL: 'Players',
  };

  const teamBudget = team.budget;
  const squadValue = squadWithStats.reduce((sum, p) => sum + p.value, 0);

  return (
    <div>
      {/* Squad overview bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex gap-3 text-sm">
          <span className="text-muted-foreground">Squad: <strong className="text-foreground">{squadWithStats.length}</strong></span>
          <span className="text-muted-foreground">Value: <strong className="text-accent">€{squadValue}M</strong></span>
          <span className="text-muted-foreground">Budget: <strong className="text-primary">€{teamBudget}M</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden border border-border text-xs">
            {(['position', 'overall', 'value', 'age'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-2 py-1 capitalize transition-colors ${sortBy === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                {s === 'overall' ? 'OVR' : s === 'position' ? 'POS' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex rounded-md overflow-hidden border border-border text-xs">
            {(['season', 'career'] as const).map(s => (
              <button key={s} onClick={() => setShowStats(s)}
                className={`px-2 py-1 capitalize transition-colors ${showStats === s ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                {s === 'season' ? 'Season' : 'Career'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([cat, list]) => list.length === 0 ? null : (
        <div key={cat} className="mb-4">
          <h4 className="font-display text-sm text-muted-foreground mb-2 uppercase tracking-widest">
            {groupLabels[cat]} ({list.length})
          </h4>
          <div className="space-y-1">
            {list.map(player => {
              const ovr = getPlayerOverall(player);
              const goals = showStats === 'season' ? player.goals : player.careerGoals + player.goals;
              const assists = showStats === 'season' ? player.assists : player.careerAssists + player.assists;
              const apps = showStats === 'season' ? player.appearances : player.careerAppearances + player.appearances;
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-2 py-2 px-3 rounded-md card-hover cursor-pointer bg-card/50 hover:bg-card transition-colors"
                  onClick={() => onPlayerClick?.(player.id)}
                >
                  {/* Position badge */}
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${posColors[positionToCategory(player.position)]}`}>
                    {player.position}
                  </span>

                  {/* Name + nationality */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">
                        {player.firstName} {player.lastName}
                      </span>
                      {player.isLegend && <span className="text-xs text-accent">⭐</span>}
                      {player.injured && <span className="text-xs bg-destructive/20 text-destructive px-1 py-0.5 rounded">INJ {player.injuryWeeks}w</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{player.nationality} · {player.age}y</span>
                      {getFormBar(player.form)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                    {apps > 0 && <span>{apps}P</span>}
                    {goals > 0 && <span className="text-primary font-medium">{goals}G</span>}
                    {assists > 0 && <span className="text-accent font-medium">{assists}A</span>}
                    <span className="text-muted-foreground">{getMoraleIcon(player.morale)}</span>
                  </div>

                  {/* OVR + Value */}
                  <div className="text-right flex-shrink-0">
                    <div className={`font-bold text-sm ${getOvrColor(ovr)}`}>{ovr}</div>
                    <div className="text-xs text-muted-foreground">€{player.value}M</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SquadView;
