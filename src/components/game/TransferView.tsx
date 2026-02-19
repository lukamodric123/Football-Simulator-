import React from 'react';
import { Transfer, Team } from '@/engine/types';

interface TransferViewProps {
  transfers: Transfer[];
  transferHistory: Transfer[];
  teams: Record<string, Team>;
  onTeamClick?: (teamId: string) => void;
}

const TransferView: React.FC<TransferViewProps> = ({ transfers, transferHistory, teams, onTeamClick }) => {
  const currentTransfers = transfers.length > 0 ? transfers : [];
  const allTransfers = transferHistory.length > 0 ? [...transferHistory].reverse() : [];

  return (
    <div className="space-y-6">
      {/* Current Season Transfers */}
      <div>
        <h4 className="font-display text-lg text-accent mb-3">💰 LATEST TRANSFERS</h4>
        {currentTransfers.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No transfers yet. Complete a season to see transfer activity.</p>
        ) : (
          <div className="space-y-1.5">
            {currentTransfers.slice(0, 20).map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-card/50 rounded-md px-3 py-2 text-sm">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  t.fee > 50 ? 'bg-accent/20 text-accent' : t.fee > 20 ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                }`}>
                  €{t.fee}M
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.playerName}</p>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => onTeamClick?.(t.fromTeamId)}
                    >
                      {t.fromTeamName}
                    </span>
                    {' → '}
                    <span
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => onTeamClick?.(t.toTeamId)}
                    >
                      {t.toTeamName}
                    </span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">S{t.season}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Transfer Records */}
      {allTransfers.length > 0 && (
        <div>
          <h4 className="font-display text-lg text-accent mb-3">🔥 BIGGEST DEALS ALL-TIME</h4>
          <div className="space-y-1.5">
            {[...allTransfers]
              .sort((a, b) => b.fee - a.fee)
              .slice(0, 10)
              .map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 bg-card/50 rounded-md px-3 py-2 text-sm">
                  <span className={`font-display text-lg w-6 text-center ${
                    i < 3 ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-bold text-accent text-sm w-16">€{t.fee}M</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.playerName}</p>
                    <p className="text-xs text-muted-foreground">{t.fromTeamName} → {t.toTeamName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">S{t.season}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Transfer Volume by Season */}
      {allTransfers.length > 0 && (
        <div>
          <h4 className="font-display text-lg text-accent mb-3">📊 TRANSFER STATS</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Transfers</p>
              <p className="font-display text-xl">{allTransfers.length}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="font-display text-xl">€{allTransfers.reduce((s, t) => s + t.fee, 0)}M</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Record Fee</p>
              <p className="font-display text-xl">€{Math.max(...allTransfers.map(t => t.fee))}M</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Avg Fee</p>
              <p className="font-display text-xl">€{Math.round(allTransfers.reduce((s, t) => s + t.fee, 0) / allTransfers.length)}M</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferView;
