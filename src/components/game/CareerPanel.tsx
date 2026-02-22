import React from 'react';
import { CareerPlayer, Player, Team, StoryArc } from '@/engine/types';
import { getPlayerOverall } from '@/engine/generator';

interface CareerPanelProps {
  careerPlayer: CareerPlayer;
  player: Player;
  team: Team | undefined;
  storyArcs: StoryArc[];
  ballonDorHistory: { season: number; playerId: string; playerName: string; teamName: string }[];
  onPlayerClick: (id: string) => void;
}

const arcColors: Record<StoryArc['type'], { bg: string; text: string; icon: string }> = {
  rise: { bg: 'bg-primary/10', text: 'text-primary', icon: '📈' },
  fall: { bg: 'bg-destructive/10', text: 'text-destructive', icon: '📉' },
  comeback: { bg: 'bg-accent/10', text: 'text-accent', icon: '💪' },
  rivalry: { bg: 'bg-destructive/10', text: 'text-destructive', icon: '⚔️' },
  dynasty: { bg: 'bg-accent/10', text: 'text-accent', icon: '👑' },
  underdog: { bg: 'bg-primary/10', text: 'text-primary', icon: '🐺' },
  betrayal: { bg: 'bg-destructive/10', text: 'text-destructive', icon: '🗡️' },
  redemption: { bg: 'bg-accent/10', text: 'text-accent', icon: '🌅' },
};

const CareerPanel: React.FC<CareerPanelProps> = ({ careerPlayer, player, team, storyArcs, ballonDorHistory, onPlayerClick }) => {
  const ovr = getPlayerOverall(player);
  const careerArcs = careerPlayer.storyArcs.slice().reverse();
  const worldArcs = storyArcs.filter(a => !careerPlayer.storyArcs.some(ca => ca.id === a.id)).slice(-10).reverse();

  return (
    <div className="space-y-4">
      {/* Career Header */}
      <div className="bg-secondary/30 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center font-display text-2xl text-primary">{ovr}</div>
          <div className="flex-1">
            <h2 className="font-display text-2xl">{careerPlayer.customName}</h2>
            <p className="text-sm text-muted-foreground">
              {player.position} · {player.age}y · {player.nationality} · POT {player.potential}
            </p>
            <p className="text-xs text-muted-foreground">
              {team?.name || 'Free Agent'} · {careerPlayer.isCaptain ? '©️ Captain · ' : ''}Season {careerPlayer.seasonNumber}
            </p>
          </div>
          <button onClick={() => onPlayerClick(player.id)} className="text-xs text-primary hover:underline">Full Profile →</button>
        </div>
      </div>

      {/* Career Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Fame', value: `${careerPlayer.fame}/100`, icon: '⭐' },
          { label: 'Ballon d\'Or', value: careerPlayer.ballonDorCount, icon: '🏆' },
          { label: 'Career Goals', value: player.careerGoals, icon: '⚽' },
          { label: 'Trophies', value: player.trophies, icon: '🏅' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-lg p-3 text-center">
            <span className="text-lg">{s.icon}</span>
            <p className="font-display text-xl mt-1">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Season Stats */}
      <div className="bg-card rounded-lg p-4">
        <h3 className="font-display text-sm text-muted-foreground mb-2">THIS SEASON</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: 'Goals', value: player.goals },
            { label: 'Assists', value: player.assists },
            { label: 'Apps', value: player.appearances },
            { label: 'Form', value: player.form },
            { label: 'Morale', value: player.morale },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display text-lg">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Career Highlight */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
        <p className="text-xs text-accent font-medium">✨ CAREER HIGHLIGHT</p>
        <p className="text-sm mt-1">{careerPlayer.careerHighlight}</p>
      </div>

      {/* Your Story Arcs */}
      {careerArcs.length > 0 && (
        <div className="bg-card rounded-lg p-4">
          <h3 className="font-display text-sm text-muted-foreground mb-2">🎬 YOUR STORY</h3>
          <div className="space-y-2">
            {careerArcs.slice(0, 5).map(arc => {
              const cfg = arcColors[arc.type];
              return (
                <div key={arc.id} className={`${cfg.bg} rounded-md px-3 py-2`}>
                  <div className="flex items-center gap-2">
                    <span>{cfg.icon}</span>
                    <span className={`text-sm font-medium ${cfg.text}`}>{arc.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">S{arc.season}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{arc.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* World Story Arcs */}
      {worldArcs.length > 0 && (
        <div className="bg-card rounded-lg p-4">
          <h3 className="font-display text-sm text-muted-foreground mb-2">🌍 WORLD STORYLINES</h3>
          <div className="space-y-1.5">
            {worldArcs.slice(0, 6).map(arc => {
              const cfg = arcColors[arc.type];
              return (
                <div key={arc.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-secondary/30">
                  <span className="text-sm">{cfg.icon}</span>
                  <span className="text-xs font-medium flex-1">{arc.title}</span>
                  <span className="text-xs text-muted-foreground">S{arc.season}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ballon d'Or History */}
      {ballonDorHistory.length > 0 && (
        <div className="bg-card rounded-lg p-4">
          <h3 className="font-display text-sm text-muted-foreground mb-2">🎭 BALLON D'OR HISTORY</h3>
          <div className="space-y-1">
            {ballonDorHistory.slice().reverse().slice(0, 5).map(b => (
              <div key={b.season} className="flex items-center gap-2 text-sm">
                <span className="text-accent font-display">S{b.season}</span>
                <span className={`font-medium ${b.playerId === careerPlayer.playerId ? 'text-primary' : ''}`}>{b.playerName}</span>
                <span className="text-xs text-muted-foreground">({b.teamName})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerPanel;
