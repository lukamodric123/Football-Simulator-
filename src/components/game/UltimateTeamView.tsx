import React, { useState, useMemo } from 'react';
import { useGame } from '@/engine/GameContext';
import { getPlayerOverall } from '@/engine/generator';
import {
  UTCard, UTSquad, CardTier, UTLeaderboardEntry, UTEvent,
  playerToCard, calculateChemistry, buildUTSquad, generatePack,
  generateLeaderboard, generateUTEvents, upgradeCard, simulateUTMatch,
} from '@/engine/ultimateTeam';

const TIER_COLORS: Record<CardTier, string> = {
  bronze: 'from-amber-900/30 to-amber-700/20',
  silver: 'from-gray-400/30 to-gray-300/20',
  gold: 'from-yellow-500/30 to-yellow-300/20',
  inform: 'from-blue-500/30 to-blue-300/20',
  toty: 'from-indigo-500/30 to-purple-400/20',
  prime: 'from-purple-600/30 to-pink-400/20',
  icon: 'from-yellow-400/40 to-amber-200/30',
};

const TIER_LABELS: Record<CardTier, string> = {
  bronze: '🟤', silver: '⚪', gold: '🟡', inform: '🔵', toty: '💜', prime: '🟣', icon: '⭐',
};

const CardDisplay: React.FC<{ card: UTCard; small?: boolean; onUpgrade?: () => void }> = ({ card, small, onUpgrade }) => (
  <div className={`bg-gradient-to-b ${TIER_COLORS[card.tier]} rounded-lg border border-border/50 ${small ? 'p-2' : 'p-3'} flex flex-col items-center relative`}>
    <span className="absolute top-1 left-1 text-xs">{TIER_LABELS[card.tier]}</span>
    <div className={`font-display ${small ? 'text-2xl' : 'text-3xl'} text-foreground`}>{card.boostedRating}</div>
    <p className={`font-medium ${small ? 'text-xs' : 'text-sm'} truncate w-full text-center`}>{card.playerName}</p>
    <p className="text-xs text-muted-foreground">{card.position} · {card.nationality}</p>
    {!small && (
      <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 mt-2 text-xs">
        <span><span className="text-muted-foreground">PAC</span> <span className="font-display">{card.attributes.pac}</span></span>
        <span><span className="text-muted-foreground">SHO</span> <span className="font-display">{card.attributes.sho}</span></span>
        <span><span className="text-muted-foreground">PAS</span> <span className="font-display">{card.attributes.pas}</span></span>
        <span><span className="text-muted-foreground">DRI</span> <span className="font-display">{card.attributes.dri}</span></span>
        <span><span className="text-muted-foreground">DEF</span> <span className="font-display">{card.attributes.def}</span></span>
        <span><span className="text-muted-foreground">PHY</span> <span className="font-display">{card.attributes.phy}</span></span>
      </div>
    )}
    {card.specialAbility && (
      <span className="mt-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">{card.specialAbility}</span>
    )}
    {onUpgrade && card.tier !== 'icon' && (
      <button onClick={onUpgrade} className="mt-2 text-xs bg-accent/20 text-accent px-2 py-1 rounded hover:bg-accent/30">⬆ Upgrade</button>
    )}
  </div>
);

const UltimateTeamView: React.FC = () => {
  const { state } = useGame();
  const [tab, setTab] = useState<'collection' | 'squad' | 'packs' | 'leaderboard' | 'events'>('collection');
  const [collection, setCollection] = useState<UTCard[]>([]);
  const [squad, setSquad] = useState<UTSquad | null>(null);
  const [squadName, setSquadName] = useState('My Ultimate XI');
  const [matchResult, setMatchResult] = useState<string | null>(null);

  // Initialize collection from game players on first open
  const initCollection = () => {
    if (collection.length > 0) return;
    const playerList = Object.values(state.players).filter(p => !p.retired);
    const topPlayers = [...playerList].sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a)).slice(0, 30);
    const cards = topPlayers.map(p => playerToCard(p));
    setCollection(cards);
    setSquad(buildUTSquad(cards, squadName));
  };

  React.useEffect(() => { initCollection(); }, [state.players]);

  const openPack = (tier: 'bronze' | 'silver' | 'gold' | 'special') => {
    const newCards = generatePack(tier, state.players);
    const updated = [...collection, ...newCards];
    setCollection(updated);
    if (squad) setSquad(buildUTSquad(updated, squadName));
  };

  const handleUpgrade = (cardId: string) => {
    setCollection(prev => {
      const updated = prev.map(c => c.id === cardId ? upgradeCard(c) : c);
      if (squad) setSquad(buildUTSquad(updated, squadName));
      return updated;
    });
  };

  const leaderboard = useMemo(() => generateLeaderboard(state.players, squad || undefined), [state.players, squad]);
  const events = useMemo(() => generateUTEvents(state.season), [state.season]);

  const playMatch = () => {
    if (!squad) return;
    const opponentCards = generatePack('gold', state.players);
    const opponent = buildUTSquad(opponentCards, 'AI Opponent');
    const result = simulateUTMatch(squad, opponent);
    setMatchResult(`${squad.name} ${result.score1} - ${result.score2} ${opponent.name} ${result.winner === 1 ? '✅ WIN!' : result.winner === 2 ? '❌ LOSS' : '🤝 DRAW'}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="font-display text-xl text-foreground">🏆 ULTIMATE TEAM</h3>
        {squad && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            OVR: {squad.overallRating} · CHEM: {squad.chemistry}
          </span>
        )}
      </div>

      <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
        {(['collection', 'squad', 'packs', 'leaderboard', 'events'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'collection' ? '📦 Cards' : t === 'squad' ? '⚽ Squad' : t === 'packs' ? '🎁 Packs' : t === 'leaderboard' ? '🏅 Board' : '🎉 Events'}
          </button>
        ))}
      </div>

      {tab === 'collection' && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">{collection.length} cards in collection</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto">
            {[...collection].sort((a, b) => b.boostedRating - a.boostedRating).map(card => (
              <CardDisplay key={card.id} card={card} onUpgrade={() => handleUpgrade(card.id)} />
            ))}
          </div>
        </div>
      )}

      {tab === 'squad' && squad && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input value={squadName} onChange={e => { setSquadName(e.target.value); if (squad) setSquad({ ...squad, name: e.target.value }); }}
              className="bg-secondary rounded-md px-3 py-2 text-foreground font-display" placeholder="Squad Name" />
            <span className="text-sm text-muted-foreground">Formation: {squad.formation}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-secondary/20 rounded-lg p-4">
            <div className="col-span-full flex justify-between items-center mb-2">
              <div>
                <span className="font-display text-2xl text-primary">{squad.overallRating}</span>
                <span className="text-xs text-muted-foreground ml-1">OVR</span>
              </div>
              <div>
                <span className="font-display text-2xl text-accent">{squad.chemistry}</span>
                <span className="text-xs text-muted-foreground ml-1">CHEM</span>
              </div>
            </div>
            {squad.cards.map(card => (
              <CardDisplay key={card.id} card={card} small />
            ))}
          </div>
          <button onClick={playMatch} className="w-full gradient-pitch text-primary-foreground py-2.5 rounded-lg font-display tracking-wider hover:opacity-90">
            ⚽ PLAY MATCH
          </button>
          {matchResult && (
            <div className="bg-card rounded-lg p-4 text-center">
              <p className="font-display text-lg">{matchResult}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'packs' && (
        <div className="space-y-3">
          <h4 className="font-display text-lg text-muted-foreground">OPEN PACKS</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { tier: 'bronze' as const, name: 'Bronze Pack', desc: '5 bronze cards', emoji: '🟤' },
              { tier: 'silver' as const, name: 'Silver Pack', desc: '5 silver+ cards', emoji: '⚪' },
              { tier: 'gold' as const, name: 'Gold Pack', desc: '5 gold+ cards', emoji: '🟡' },
              { tier: 'special' as const, name: 'Special Pack', desc: '3 special cards!', emoji: '💎' },
            ].map(pack => (
              <button key={pack.tier} onClick={() => openPack(pack.tier)}
                className={`bg-gradient-to-b ${TIER_COLORS[pack.tier === 'special' ? 'icon' : pack.tier]} rounded-lg p-4 text-center hover:opacity-80 transition-opacity border border-border/30`}>
                <span className="text-3xl">{pack.emoji}</span>
                <p className="font-display text-sm mt-2">{pack.name}</p>
                <p className="text-xs text-muted-foreground">{pack.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="space-y-1">
          <h4 className="font-display text-lg text-muted-foreground mb-3">🏅 GLOBAL LEADERBOARD</h4>
          {leaderboard.map((entry, i) => (
            <div key={entry.squadName} className={`flex items-center gap-3 py-2 px-3 rounded-md ${entry.ownerName === 'YOU' ? 'bg-primary/10 border border-primary/30' : 'bg-card/40'}`}>
              <span className={`w-6 text-center font-bold text-sm ${i < 3 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">{entry.squadName}</span>
                <p className="text-xs text-muted-foreground">OVR {entry.rating} · CHEM {entry.chemistry} · W{entry.wins}/L{entry.losses}</p>
              </div>
              <span className="font-display text-lg text-primary">{entry.points}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-3">
          <h4 className="font-display text-lg text-muted-foreground">🎉 SPECIAL EVENTS</h4>
          {events.map(evt => (
            <div key={evt.id} className={`rounded-lg p-4 border ${evt.active ? 'bg-accent/5 border-accent/30' : 'bg-card/30 border-border/30 opacity-50'}`}>
              <div className="flex items-center justify-between">
                <h5 className="font-display text-base">{evt.name}</h5>
                <span className={`text-xs px-2 py-0.5 rounded ${evt.active ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  {evt.active ? 'LIVE' : 'ENDED'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{evt.description}</p>
              {evt.active && (
                <button onClick={() => openPack('special')} className="mt-2 text-xs bg-primary/20 text-primary px-3 py-1.5 rounded hover:bg-primary/30">
                  Claim Reward Pack
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UltimateTeamView;
