import React from 'react';
import { Player } from '@/engine/types';
import { getPlayerOverall } from '@/engine/generator';

interface PlayerDetailProps {
  player: Player;
  onBack: () => void;
}

const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, onBack }) => {
  const ovr = getPlayerOverall(player);

  const attrBar = (label: string, value: number) => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            value >= 80 ? 'gradient-pitch' : value >= 60 ? 'bg-accent' : 'bg-muted-foreground'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-6 text-right ${
        value >= 80 ? 'text-primary' : value >= 60 ? 'text-accent' : 'text-muted-foreground'
      }`}>
        {value}
      </span>
    </div>
  );

  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-lg gradient-pitch flex items-center justify-center text-primary-foreground font-display text-2xl">
          {ovr}
        </div>
        <div>
          <h2 className="font-display text-3xl">{player.firstName} {player.lastName}</h2>
          <p className="text-muted-foreground">
            {player.position} · {player.nationality} · {player.age} years old
          </p>
          <div className="flex gap-3 mt-1 text-xs">
            <span>💰 €{player.value}M</span>
            <span>📝 {player.contractYears}yr</span>
            {player.injured && <span className="text-destructive">🏥 Injured ({player.injuryWeeks}w)</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg p-4">
          <h3 className="font-display text-lg mb-3 text-muted-foreground">ATTRIBUTES</h3>
          <div className="space-y-2">
            {attrBar('Shooting', player.attributes.shooting)}
            {attrBar('Passing', player.attributes.passing)}
            {attrBar('Dribbling', player.attributes.dribbling)}
            {attrBar('Pace', player.attributes.pace)}
            {attrBar('Defense', player.attributes.defense)}
            {attrBar('Physical', player.attributes.physicality)}
            {attrBar('Vision', player.attributes.vision)}
            {attrBar('Stamina', player.attributes.stamina)}
            {attrBar('Positioning', player.attributes.positioning)}
          </div>
        </div>

        <div className="bg-card rounded-lg p-4">
          <h3 className="font-display text-lg mb-3 text-muted-foreground">SEASON STATS</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Appearances', value: player.appearances },
              { label: 'Goals', value: player.goals },
              { label: 'Assists', value: player.assists },
              { label: 'Yellow Cards', value: player.yellowCards },
              { label: 'Red Cards', value: player.redCards },
              { label: 'Morale', value: `${player.morale}%` },
              { label: 'Form', value: `${player.form}%` },
              { label: 'Potential', value: player.potential },
            ].map(stat => (
              <div key={stat.label} className="bg-secondary/50 rounded p-2">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="font-display text-xl">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
