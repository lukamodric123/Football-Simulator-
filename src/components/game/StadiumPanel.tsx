import React from 'react';
import { Team, TrainingIntensity } from '@/engine/types';

interface StadiumPanelProps {
  team: Team;
  onUpgradeStadium?: () => void;
  onSetTraining?: (intensity: TrainingIntensity) => void;
}

const StadiumPanel: React.FC<StadiumPanelProps> = ({ team, onUpgradeStadium, onSetTraining }) => {
  const stadium = team.stadium;
  const levelStars = '⭐'.repeat(stadium.level);
  const trainingLabels: Record<TrainingIntensity, { emoji: string; color: string; desc: string }> = {
    low: { emoji: '🧘', color: 'text-muted-foreground', desc: 'Less injuries, slower development' },
    medium: { emoji: '⚽', color: 'text-foreground', desc: 'Balanced approach' },
    high: { emoji: '🔥', color: 'text-primary', desc: 'Faster growth, more injury risk' },
    extreme: { emoji: '💀', color: 'text-destructive', desc: 'Maximum development, high injury risk' },
  };

  return (
    <div className="space-y-4">
      {/* Stadium */}
      <div>
        <h4 className="font-display text-sm text-muted-foreground mb-2">🏟️ STADIUM</h4>
        <div className="bg-card/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-display text-lg">{stadium.name}</p>
              <p className="text-xs text-muted-foreground">Level {stadium.level}/5 {levelStars}</p>
            </div>
            {stadium.level < 5 && onUpgradeStadium && (
              <button
                onClick={onUpgradeStadium}
                disabled={team.budget < stadium.upgradeCost}
                className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-md font-display hover:bg-primary/30 disabled:opacity-40 transition-colors"
              >
                UPGRADE (€{stadium.upgradeCost}M)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-secondary/50 rounded p-2">
              <p className="text-xs text-muted-foreground">Capacity</p>
              <p className="font-display">{stadium.capacity.toLocaleString()}</p>
            </div>
            <div className="bg-secondary/50 rounded p-2">
              <p className="text-xs text-muted-foreground">Atmosphere</p>
              <div className="flex items-center gap-1">
                <p className="font-display">{stadium.atmosphere}</p>
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div className="bg-accent rounded-full h-1.5 transition-all" style={{ width: `${stadium.atmosphere}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FFP */}
      <div>
        <h4 className="font-display text-sm text-muted-foreground mb-2">💰 FINANCIAL FAIR PLAY</h4>
        <div className={`rounded-lg p-4 ${team.ffpWarning ? 'bg-destructive/10 border border-destructive/30' : 'bg-card/50'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{team.ffpWarning ? '⚠️ FFP WARNING' : '✅ FFP Compliant'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-secondary/50 rounded p-2">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="font-display">€{team.budget}M</p>
            </div>
            <div className="bg-secondary/50 rounded p-2">
              <p className="text-xs text-muted-foreground">Wage Bill</p>
              <p className="font-display">€{Math.round(team.wageTotal / 1000)}K/w</p>
            </div>
          </div>
          {team.ffpWarning && (
            <p className="text-xs text-destructive mt-2">⚠️ Wages exceed sustainable levels. Budget penalty applied!</p>
          )}
        </div>
      </div>

      {/* Training */}
      <div>
        <h4 className="font-display text-sm text-muted-foreground mb-2">🏋️ TRAINING INTENSITY</h4>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(trainingLabels) as TrainingIntensity[]).map(ti => {
            const label = trainingLabels[ti];
            const isActive = team.trainingIntensity === ti;
            return (
              <button
                key={ti}
                onClick={() => onSetTraining?.(ti)}
                className={`rounded-lg p-3 text-left transition-all border ${
                  isActive ? 'border-primary bg-primary/10' : 'border-border bg-card/50 hover:border-primary/50'
                }`}
              >
                <p className="text-lg">{label.emoji}</p>
                <p className={`font-display text-sm capitalize ${isActive ? 'text-primary' : 'text-foreground'}`}>{ti}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Injury Risk Summary */}
      <div>
        <h4 className="font-display text-sm text-muted-foreground mb-2">🏥 INJURY RISK</h4>
        <div className="bg-card/50 rounded-lg p-3">
          {(() => {
            const injured = team.squad.filter(p => p.injured);
            const highRisk = team.squad.filter(p => !p.injured && p.hiddenTraits.injuryRisk > 40);
            return (
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-destructive font-medium">{injured.length}</span> injured · {' '}
                  <span className="text-primary font-medium">{highRisk.length}</span> high risk
                </p>
                {injured.slice(0, 3).map(p => (
                  <p key={p.id} className="text-xs text-muted-foreground">
                    🏥 {p.firstName} {p.lastName} ({p.position}) — {p.injuryWeeks}w remaining
                  </p>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default StadiumPanel;
