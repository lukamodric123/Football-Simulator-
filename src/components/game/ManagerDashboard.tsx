import React from 'react';
import { ManagerStatus, BoardExpectation, PersonalityTrait, generatePersonalityTraits } from '@/engine/managerExpanded';
import { Team, Player } from '@/engine/types';
import { getPlayerOverall } from '@/engine/generator';

interface ManagerDashboardProps {
  team: Team;
  managerStatus: ManagerStatus;
  players: Record<string, Player>;
}

const TRAIT_BADGES: Record<PersonalityTrait, { emoji: string; color: string }> = {
  leader: { emoji: '👑', color: 'bg-accent/20 text-accent' },
  loyal: { emoji: '💙', color: 'bg-blue-500/20 text-blue-400' },
  aggressive: { emoji: '🔥', color: 'bg-destructive/20 text-destructive' },
  clutch: { emoji: '⭐', color: 'bg-yellow-500/20 text-yellow-400' },
  showboat: { emoji: '✨', color: 'bg-purple-500/20 text-purple-400' },
  professional: { emoji: '📋', color: 'bg-primary/20 text-primary' },
  mercenary: { emoji: '💰', color: 'bg-green-500/20 text-green-400' },
  introvert: { emoji: '🤫', color: 'bg-muted text-muted-foreground' },
};

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ team, managerStatus, players }) => {
  const approvalColor = managerStatus.approval >= 70 ? 'text-primary' : managerStatus.approval >= 40 ? 'text-accent' : 'text-destructive';
  const confidenceColor = managerStatus.boardConfidence >= 60 ? 'text-primary' : managerStatus.boardConfidence >= 30 ? 'text-accent' : 'text-destructive';

  // Get player personality traits for squad
  const squadTraits = team.squad
    .filter(p => !p.retired && players[p.id])
    .map(p => ({ player: players[p.id], traits: generatePersonalityTraits(players[p.id]) }))
    .sort((a, b) => getPlayerOverall(b.player) - getPlayerOverall(a.player))
    .slice(0, 8);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-muted-foreground">👔 MANAGER DASHBOARD</h3>

      {managerStatus.sacked && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
          <p className="font-display text-xl text-destructive">🔴 YOU HAVE BEEN SACKED!</p>
          <p className="text-sm text-muted-foreground mt-1">The board lost confidence after a disappointing run.</p>
        </div>
      )}

      {/* Approval meters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">❤️ FAN APPROVAL</p>
          <p className={`font-display text-3xl ${approvalColor}`}>{managerStatus.approval}%</p>
          <div className="w-full bg-secondary rounded-full h-2 mt-2">
            <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${managerStatus.approval}%` }} />
          </div>
        </div>
        <div className="bg-card/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">📊 BOARD CONFIDENCE</p>
          <p className={`font-display text-3xl ${confidenceColor}`}>{managerStatus.boardConfidence}%</p>
          <div className="w-full bg-secondary rounded-full h-2 mt-2">
            <div className="bg-accent rounded-full h-2 transition-all" style={{ width: `${managerStatus.boardConfidence}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-card/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">Seasons in charge: {managerStatus.seasonsInCharge}</p>
        {managerStatus.warningIssued && (
          <p className="text-xs text-destructive mt-1">⚠️ Board warning issued — improve results or face the sack!</p>
        )}
      </div>

      {/* Board Expectations */}
      <div className="bg-card/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-2 font-medium">📋 BOARD EXPECTATIONS</p>
        <div className="space-y-1.5">
          {managerStatus.boardExpectations.map((exp, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className={exp.met ? 'text-primary' : 'text-muted-foreground'}>
                {exp.met ? '✅' : '⬜'}
              </span>
              <span className={exp.met ? 'text-foreground' : 'text-muted-foreground'}>{exp.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Player Personality Traits */}
      <div className="bg-card/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-2 font-medium">🧠 SQUAD PERSONALITIES</p>
        <div className="space-y-1.5">
          {squadTraits.map(({ player, traits }) => (
            <div key={player.id} className="flex items-center gap-2 text-sm">
              <span className="font-medium w-28 truncate">{player.firstName[0]}. {player.lastName}</span>
              <div className="flex gap-1 flex-wrap">
                {traits.map(t => (
                  <span key={t} className={`text-xs px-1.5 py-0.5 rounded ${TRAIT_BADGES[t].color}`}>
                    {TRAIT_BADGES[t].emoji} {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
