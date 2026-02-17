import React from 'react';
import { Award, AllTimeRecord } from '@/engine/types';

interface AwardsHistoryProps {
  awards: Award[];
  allTimeRecords: AllTimeRecord[];
  seasonAwards: { season: number; awards: Award[] }[];
}

const AwardsHistory: React.FC<AwardsHistoryProps> = ({ awards, allTimeRecords, seasonAwards }) => {
  return (
    <div className="space-y-6">
      {/* All-Time Records */}
      {allTimeRecords.length > 0 && (
        <div>
          <h4 className="font-display text-lg text-accent mb-3">🏅 ALL-TIME RECORDS</h4>
          <div className="grid grid-cols-2 gap-2">
            {allTimeRecords.map(record => (
              <div key={record.type} className="bg-card/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Most {record.type}
                </p>
                <p className="font-display text-xl mt-1">{record.value}</p>
                <p className="text-sm text-foreground">{record.playerName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Season-by-Season Awards */}
      {seasonAwards.length > 0 && (
        <div>
          <h4 className="font-display text-lg text-accent mb-3">🏆 SEASON AWARDS</h4>
          <div className="space-y-3">
            {[...seasonAwards].reverse().slice(0, 5).map(sa => (
              <div key={sa.season} className="bg-card/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Season {sa.season}</p>
                <div className="space-y-1">
                  {sa.awards.map((award, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{award.name}</span>
                      <span className="font-medium">
                        {award.playerName || award.teamName}
                        {award.value ? ` (${award.value})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {awards.length === 0 && allTimeRecords.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">Complete a season to see awards</p>
      )}
    </div>
  );
};

export default AwardsHistory;
