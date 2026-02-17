import React from 'react';
import { Team, Player, positionToCategory } from '@/engine/types';
import { getPlayerOverall } from '@/engine/generator';

interface SquadViewProps {
  team: Team;
  players: Record<string, Player>;
  onPlayerClick?: (playerId: string) => void;
}

const posOrder = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

const SquadView: React.FC<SquadViewProps> = ({ team, players, onPlayerClick }) => {
  const squadWithStats = team.squad
    .map(p => players[p.id] || p)
    .sort((a, b) => {
      const ca = positionToCategory(a.position);
      const cb = positionToCategory(b.position);
      if (posOrder[ca] !== posOrder[cb]) return posOrder[ca] - posOrder[cb];
      return getPlayerOverall(b) - getPlayerOverall(a);
    });

  const grouped = {
    GK: squadWithStats.filter(p => positionToCategory(p.position) === 'GK'),
    DEF: squadWithStats.filter(p => positionToCategory(p.position) === 'DEF'),
    MID: squadWithStats.filter(p => positionToCategory(p.position) === 'MID'),
    FWD: squadWithStats.filter(p => positionToCategory(p.position) === 'FWD'),
  };

  const posColors: Record<string, string> = {
    GK: 'bg-amber-500/20 text-amber-400',
    DEF: 'bg-blue-500/20 text-blue-400',
    MID: 'bg-emerald-500/20 text-emerald-400',
    FWD: 'bg-red-500/20 text-red-400',
  };

  const renderSection = (label: string, playerList: Player[]) => (
    <div key={label} className="mb-4">
      <h4 className="font-display text-lg text-muted-foreground mb-2 uppercase tracking-widest">
        {label === 'GK' ? 'Goalkeepers' : label === 'DEF' ? 'Defenders' : label === 'MID' ? 'Midfielders' : 'Forwards'}
      </h4>
      <div className="space-y-1">
        {playerList.map(player => {
          const ovr = getPlayerOverall(player);
          const ovrColor = ovr >= 80 ? 'text-primary' : ovr >= 65 ? 'text-accent' : 'text-muted-foreground';
          return (
            <div
              key={player.id}
              className="flex items-center gap-3 py-2 px-3 rounded-md card-hover cursor-pointer bg-card/50"
              onClick={() => onPlayerClick?.(player.id)}
            >
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${posColors[label]}`}>
                {player.position}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate block">
                  {player.firstName} {player.lastName}
                </span>
                <span className="text-xs text-muted-foreground">{player.nationality} · {player.age}y</span>
              </div>
              {player.injured && (
                <span className="text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">INJ</span>
              )}
              <div className="text-right">
                <span className={`font-bold text-sm ${ovrColor}`}>{ovr}</span>
              </div>
              <div className="text-right text-xs text-muted-foreground w-16 hidden sm:block">
                {player.goals > 0 && <span className="text-primary">{player.goals}G </span>}
                {player.assists > 0 && <span className="text-accent">{player.assists}A</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {Object.entries(grouped).map(([cat, list]) => renderSection(cat, list))}
    </div>
  );
};

export default SquadView;
