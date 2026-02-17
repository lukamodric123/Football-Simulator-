import React from 'react';
import { Fixture, Team } from '@/engine/types';

interface MatchResultsProps {
  fixtures: Fixture[];
  teams: Record<string, Team>;
  matchday: number;
}

const MatchResults: React.FC<MatchResultsProps> = ({ fixtures, teams, matchday }) => {
  const dayFixtures = fixtures.filter(f => f.matchday === matchday);

  return (
    <div className="space-y-1.5">
      {dayFixtures.map(f => {
        const home = teams[f.homeTeamId];
        const away = teams[f.awayTeamId];
        if (!home || !away) return null;

        return (
          <div
            key={f.id}
            className="flex items-center gap-2 bg-card/50 rounded-md px-3 py-2 text-sm"
          >
            <div className="flex-1 text-right flex items-center justify-end gap-2">
              <span className="font-medium truncate">{home.shortName}</span>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: home.color }} />
            </div>
            <div className="w-16 text-center">
              {f.played ? (
                <span className="font-display text-lg">
                  <span className={f.homeGoals > f.awayGoals ? 'text-foreground' : 'text-muted-foreground'}>
                    {f.homeGoals}
                  </span>
                  <span className="text-muted-foreground mx-1">-</span>
                  <span className={f.awayGoals > f.homeGoals ? 'text-foreground' : 'text-muted-foreground'}>
                    {f.awayGoals}
                  </span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">vs</span>
              )}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: away.color }} />
              <span className="font-medium truncate">{away.shortName}</span>
            </div>
          </div>
        );
      })}
      {dayFixtures.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-4">No matches this matchday</p>
      )}
    </div>
  );
};

export default MatchResults;
