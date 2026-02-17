import React from 'react';
import { Standing, Team } from '@/engine/types';

interface StandingsTableProps {
  standings: (Standing & { team: Team })[];
  onTeamClick?: (teamId: string) => void;
  compact?: boolean;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ standings, onTeamClick, compact }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
            <th className="py-2 px-2 text-left w-8">#</th>
            <th className="py-2 px-2 text-left">Team</th>
            <th className="py-2 px-2 text-center">P</th>
            <th className="py-2 px-2 text-center">W</th>
            {!compact && <th className="py-2 px-2 text-center">D</th>}
            {!compact && <th className="py-2 px-2 text-center">L</th>}
            {!compact && <th className="py-2 px-2 text-center">GF</th>}
            {!compact && <th className="py-2 px-2 text-center">GA</th>}
            <th className="py-2 px-2 text-center">GD</th>
            <th className="py-2 px-2 text-center font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const gd = s.goalsFor - s.goalsAgainst;
            return (
              <tr
                key={s.teamId}
                className="border-b border-border/50 card-hover cursor-pointer"
                onClick={() => onTeamClick?.(s.teamId)}
              >
                <td className="py-2 px-2 text-muted-foreground">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${
                      i < 4
                        ? 'bg-primary/20 text-primary'
                        : i >= standings.length - 3
                        ? 'bg-destructive/20 text-destructive'
                        : ''
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="py-2 px-2 font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.team?.color || '#666' }}
                    />
                    <span className="truncate">{s.team?.name || s.teamId}</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center text-muted-foreground">{s.played}</td>
                <td className="py-2 px-2 text-center">{s.won}</td>
                {!compact && <td className="py-2 px-2 text-center text-muted-foreground">{s.drawn}</td>}
                {!compact && <td className="py-2 px-2 text-center text-muted-foreground">{s.lost}</td>}
                {!compact && <td className="py-2 px-2 text-center">{s.goalsFor}</td>}
                {!compact && <td className="py-2 px-2 text-center">{s.goalsAgainst}</td>}
                <td className={`py-2 px-2 text-center ${gd > 0 ? 'text-win' : gd < 0 ? 'text-loss' : 'text-muted-foreground'}`}>
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td className="py-2 px-2 text-center font-bold text-accent">{s.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsTable;
