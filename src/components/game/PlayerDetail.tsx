import React from 'react';
import { Player } from '@/engine/types';
import { getPlayerOverall } from '@/engine/generator';

interface PlayerDetailProps {
  player: Player;
  onBack: () => void;
}

const personalGoalLabels: Record<string, string> = {
  money: '💰 Money First',
  fame: '⭐ Fame & Big Clubs',
  legacy: '🏆 Legacy & Trophies',
  loyalty: '❤️ Loyalty to Club',
  playing_time: '⏱️ Playing Time',
  international: '🌍 International Glory',
};

const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, onBack }) => {
  const ovr = getPlayerOverall(player);

  const attrBar = (label: string, value: number) => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${value >= 80 ? 'gradient-pitch' : value >= 60 ? 'bg-accent' : 'bg-muted-foreground'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-6 text-right ${value >= 80 ? 'text-primary' : value >= 60 ? 'text-accent' : 'text-muted-foreground'}`}>{value}</span>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back</button>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-lg gradient-pitch flex items-center justify-center text-primary-foreground font-display text-2xl">{ovr}</div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-3xl">{player.firstName} {player.lastName}</h2>
            {player.isLegend && <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded font-medium">⭐ LEGEND</span>}
            {player.retired && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Retired</span>}
          </div>
          <p className="text-muted-foreground">{player.position} · {player.nationality} · {player.age} years old · {player.preferredFoot === 'both' ? 'Both feet' : `${player.preferredFoot.charAt(0).toUpperCase() + player.preferredFoot.slice(1)} foot`}</p>
          <div className="flex gap-3 mt-1 text-xs flex-wrap">
            <span>💰 €{player.value}M</span>
            <span>📝 {player.contractYears}yr</span>
            <span>⭐ POT: {player.potential}</span>
            <span>{personalGoalLabels[player.personalGoal] || player.personalGoal}</span>
            {player.injured && <span className="text-destructive">🏥 Injured ({player.injuryWeeks}w)</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4">
            <h3 className="font-display text-lg mb-3 text-muted-foreground">SEASON STATS</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Apps', value: player.appearances },
                { label: 'Goals', value: player.goals },
                { label: 'Assists', value: player.assists },
                { label: 'Yellow', value: player.yellowCards },
                { label: 'Red', value: player.redCards },
                { label: 'Clean Sheets', value: player.cleanSheets },
                { label: 'Morale', value: `${player.morale}%` },
                { label: 'Form', value: `${player.form}%` },
                { label: 'Fatigue', value: `${player.fatigue}%` },
              ].map(stat => (
                <div key={stat.label} className="bg-secondary/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-lg">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg p-4">
            <h3 className="font-display text-lg mb-3 text-muted-foreground">CAREER TOTALS</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Career Goals', value: player.careerGoals + player.goals },
                { label: 'Career Assists', value: player.careerAssists + player.assists },
                { label: 'Career Apps', value: player.careerAppearances + player.appearances },
                { label: 'Clean Sheets', value: player.careerCleanSheets + player.cleanSheets },
                { label: 'Trophies', value: player.trophies },
                { label: 'Awards', value: player.individualAwards.length },
              ].map(stat => (
                <div key={stat.label} className="bg-secondary/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-lg">{stat.value}</p>
                </div>
              ))}
            </div>
            {player.individualAwards.length > 0 && (
              <div className="mt-3 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Awards:</p>
                <div className="flex flex-wrap gap-1">
                  {player.individualAwards.map((a, i) => (
                    <span key={i} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">🏆 {a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Season History */}
      {player.seasonHistory.length > 0 && (
        <div className="bg-card rounded-lg p-4 mt-4">
          <h3 className="font-display text-lg mb-3 text-muted-foreground">SEASON HISTORY</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="py-2 px-2 text-left">Season</th>
                  <th className="py-2 px-2 text-center">Apps</th>
                  <th className="py-2 px-2 text-center">Goals</th>
                  <th className="py-2 px-2 text-center">Assists</th>
                  <th className="py-2 px-2 text-center">Rating</th>
                </tr>
              </thead>
              <tbody>
                {player.seasonHistory.map((sh, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1.5 px-2">{sh.season}</td>
                    <td className="py-1.5 px-2 text-center">{sh.appearances}</td>
                    <td className="py-1.5 px-2 text-center text-primary">{sh.goals}</td>
                    <td className="py-1.5 px-2 text-center text-accent">{sh.assists}</td>
                    <td className="py-1.5 px-2 text-center">{sh.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDetail;
