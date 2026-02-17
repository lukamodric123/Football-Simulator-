import React from 'react';
import { GOATEntry } from '@/engine/types';

interface GOATRankingsProps {
  rankings: GOATEntry[];
  onPlayerClick?: (playerId: string) => void;
}

const GOATRankings: React.FC<GOATRankingsProps> = ({ rankings, onPlayerClick }) => {
  if (rankings.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-8">Complete a season to see GOAT rankings</p>;
  }

  return (
    <div className="space-y-2">
      {rankings.slice(0, 25).map((entry, i) => (
        <div
          key={entry.playerId}
          className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer card-hover ${
            i === 0 ? 'bg-accent/10 border border-accent/30' : i < 3 ? 'bg-card/80' : 'bg-card/40'
          }`}
          onClick={() => onPlayerClick?.(entry.playerId)}
        >
          <span className={`font-display text-2xl w-8 text-center ${
            i === 0 ? 'text-accent' : i < 3 ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{entry.playerName}</span>
              {entry.retired && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Retired</span>}
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
              <span>⚽ {entry.careerGoals}</span>
              <span>🅰️ {entry.careerAssists}</span>
              <span>🏆 {entry.trophies}</span>
              <span>⭐ {entry.awards}</span>
              <span>{entry.seasonsPlayed}S</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`font-display text-xl ${i === 0 ? 'text-accent' : 'text-foreground'}`}>
              {entry.score}
            </span>
            <p className="text-xs text-muted-foreground">GOAT pts</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GOATRankings;
