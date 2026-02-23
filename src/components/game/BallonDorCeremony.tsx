import React from 'react';

interface BallonDorCeremonyProps {
  ballonDorHistory: { season: number; playerId: string; playerName: string; teamName: string }[];
  onPlayerClick?: (playerId: string) => void;
}

const BallonDorCeremony: React.FC<BallonDorCeremonyProps> = ({ ballonDorHistory, onPlayerClick }) => {
  if (ballonDorHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">🎭</p>
        <p className="text-muted-foreground">No Ballon d'Or ceremonies yet.</p>
        <p className="text-sm text-muted-foreground">Complete a season to see the first winner!</p>
      </div>
    );
  }

  const latest = ballonDorHistory[ballonDorHistory.length - 1];
  const winCounts: Record<string, { name: string; count: number; playerId: string }> = {};
  for (const entry of ballonDorHistory) {
    if (!winCounts[entry.playerId]) winCounts[entry.playerId] = { name: entry.playerName, count: 0, playerId: entry.playerId };
    winCounts[entry.playerId].count++;
  }
  const topWinners = Object.values(winCounts).sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Latest Winner Spotlight */}
      <div className="bg-gradient-to-br from-accent/20 to-primary/10 rounded-xl p-6 text-center border border-accent/30">
        <p className="text-4xl mb-2">🎭✨</p>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Season {latest.season} · Ballon d'Or</p>
        <h3
          className="font-display text-3xl text-accent cursor-pointer hover:underline"
          onClick={() => onPlayerClick?.(latest.playerId)}
        >
          {latest.playerName}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{latest.teamName}</p>
        <p className="text-xs text-muted-foreground mt-3">
          "{latest.playerName} is the best player in the world" — standing ovation at the gala.
        </p>
      </div>

      {/* All-Time Leaderboard */}
      <div>
        <h4 className="font-display text-lg text-accent mb-3">🏆 ALL-TIME BALLON D'OR WINNERS</h4>
        <div className="space-y-1.5">
          {topWinners.map((w, i) => (
            <div
              key={w.playerId}
              onClick={() => onPlayerClick?.(w.playerId)}
              className="flex items-center gap-3 bg-card/50 rounded-lg px-4 py-3 cursor-pointer hover:bg-card/80 transition-colors"
            >
              <span className={`font-display text-lg w-8 text-center ${i < 3 ? 'text-accent' : 'text-muted-foreground'}`}>
                {i === 0 ? '👑' : i + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium">{w.name}</p>
              </div>
              <div className="font-display text-xl text-primary">{w.count}×</div>
            </div>
          ))}
        </div>
      </div>

      {/* Full History */}
      <div>
        <h4 className="font-display text-sm text-muted-foreground mb-2">📜 CEREMONY HISTORY</h4>
        <div className="space-y-1">
          {[...ballonDorHistory].reverse().map(entry => (
            <div
              key={`${entry.season}-${entry.playerId}`}
              onClick={() => onPlayerClick?.(entry.playerId)}
              className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-md hover:bg-card/50 cursor-pointer"
            >
              <span className="text-xs text-muted-foreground font-display w-12">S{entry.season}</span>
              <span className="flex-1 font-medium">{entry.playerName}</span>
              <span className="text-xs text-muted-foreground">{entry.teamName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BallonDorCeremony;
