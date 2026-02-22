import React, { useState, useMemo } from 'react';
import { Player, Team, Position } from '@/engine/types';
import { getPlayerOverall } from '@/engine/generator';

interface TransferHubProps {
  managedTeamId: string;
  teams: Record<string, Team>;
  players: Record<string, Player>;
  onSign: (playerId: string, fee: number, wage: number, contractYears: number) => { success: boolean; message: string };
  onPlayerClick: (playerId: string) => void;
}

type NegotiationStep = 'search' | 'offer' | 'negotiate_salary' | 'result';

interface NegotiationState {
  playerId: string;
  askingPrice: number;
  offeredFee: number;
  offeredWage: number;
  offeredYears: number;
  clubResponse: 'pending' | 'accepted' | 'negotiating' | 'rejected';
  playerResponse: 'pending' | 'accepted' | 'rejected';
  boardApproval: 'pending' | 'approved' | 'warned' | 'blocked';
  message: string;
}

const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

const TransferHub: React.FC<TransferHubProps> = ({ managedTeamId, teams, players, onSign, onPlayerClick }) => {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL');
  const [ageMin, setAgeMin] = useState(16);
  const [ageMax, setAgeMax] = useState(40);
  const [ratingMin, setRatingMin] = useState(40);
  const [freeAgentsOnly, setFreeAgentsOnly] = useState(false);
  const [step, setStep] = useState<NegotiationStep>('search');
  const [negotiation, setNegotiation] = useState<NegotiationState | null>(null);
  const [sortBy, setSortBy] = useState<'ovr' | 'age' | 'value' | 'potential'>('ovr');

  const managedTeam = teams[managedTeamId];

  // Build searchable player list (exclude own squad)
  const ownPlayerIds = new Set(managedTeam?.squad.map(p => p.id) || []);

  const availablePlayers = useMemo(() => {
    return Object.values(players).filter(p => {
      if (p.retired || ownPlayerIds.has(p.id)) return false;
      if (posFilter !== 'ALL' && p.position !== posFilter) return false;
      if (p.age < ageMin || p.age > ageMax) return false;
      if (getPlayerOverall(p) < ratingMin) return false;
      if (search) {
        const name = `${p.firstName} ${p.lastName}`.toLowerCase();
        if (!name.includes(search.toLowerCase())) return false;
      }
      if (freeAgentsOnly && p.contractYears > 0) return false;
      return true;
    });
  }, [players, posFilter, ageMin, ageMax, ratingMin, search, freeAgentsOnly, ownPlayerIds]);

  const sorted = useMemo(() => {
    const list = [...availablePlayers];
    switch (sortBy) {
      case 'ovr': return list.sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
      case 'age': return list.sort((a, b) => a.age - b.age);
      case 'value': return list.sort((a, b) => b.value - a.value);
      case 'potential': return list.sort((a, b) => b.potential - a.potential);
    }
    return list;
  }, [availablePlayers, sortBy]);

  const displayPlayers = sorted.slice(0, 50);

  // Find which team a player belongs to
  const getPlayerTeam = (playerId: string): Team | null => {
    for (const team of Object.values(teams)) {
      if (team.squad.some(p => p.id === playerId)) return team;
    }
    return null;
  };

  const startNegotiation = (playerId: string) => {
    const player = players[playerId];
    if (!player) return;

    const ovr = getPlayerOverall(player);
    const sourceTeam = getPlayerTeam(playerId);
    const isFreeAgent = !sourceTeam || player.contractYears <= 0;

    // Asking price with markup
    const markup = sourceTeam ? (sourceTeam.reputation > managedTeam.reputation ? 1.4 : 1.1) : 0;
    const askingPrice = isFreeAgent ? 0 : Math.max(1, Math.round(player.value * markup));

    // Board pre-check
    let boardApproval: NegotiationState['boardApproval'] = 'approved';
    if (askingPrice > managedTeam.budget * 0.8) boardApproval = 'warned';
    if (askingPrice > managedTeam.budget * 1.2) boardApproval = 'blocked';
    if (player.age > 32 && player.value > 30) boardApproval = 'warned';

    setNegotiation({
      playerId,
      askingPrice,
      offeredFee: askingPrice,
      offeredWage: Math.round(player.wage * 1.1),
      offeredYears: 3,
      clubResponse: 'pending',
      playerResponse: 'pending',
      boardApproval,
      message: '',
    });
    setStep('offer');
  };

  const submitOffer = () => {
    if (!negotiation) return;
    const player = players[negotiation.playerId];
    if (!player) return;

    const sourceTeam = getPlayerTeam(negotiation.playerId);
    const isFreeAgent = !sourceTeam || player.contractYears <= 0;

    if (isFreeAgent) {
      // Free agent - skip to salary
      setNegotiation({ ...negotiation, clubResponse: 'accepted' });
      setStep('negotiate_salary');
      return;
    }

    // Club acceptance logic
    const offerRatio = negotiation.offeredFee / Math.max(1, negotiation.askingPrice);
    let clubResponse: NegotiationState['clubResponse'] = 'rejected';

    if (offerRatio >= 0.95) clubResponse = 'accepted';
    else if (offerRatio >= 0.75) clubResponse = Math.random() > 0.3 ? 'accepted' : 'negotiating';
    else if (offerRatio >= 0.5) clubResponse = Math.random() > 0.6 ? 'negotiating' : 'rejected';

    // Squad depth check - selling club won't sell if too few players
    if (sourceTeam && sourceTeam.squad.filter(p => !p.retired).length <= 18) {
      clubResponse = 'rejected';
    }

    let message = '';
    if (clubResponse === 'accepted') message = `${sourceTeam?.name} accepted your €${negotiation.offeredFee}M bid!`;
    else if (clubResponse === 'negotiating') {
      const counter = Math.round(negotiation.askingPrice * (0.9 + Math.random() * 0.15));
      message = `${sourceTeam?.name} countered with €${counter}M. Adjust your offer.`;
      setNegotiation({ ...negotiation, clubResponse, askingPrice: counter, message });
      return;
    } else {
      message = `${sourceTeam?.name} rejected your offer. The bid was too low.`;
    }

    setNegotiation({ ...negotiation, clubResponse, message });
    if (clubResponse === 'accepted') setStep('negotiate_salary');
  };

  const submitSalary = () => {
    if (!negotiation) return;
    const player = players[negotiation.playerId];
    if (!player) return;

    // Player acceptance based on wage vs expectation, club rep, and personal goals
    const expectedWage = player.wage;
    const wageRatio = negotiation.offeredWage / Math.max(1, expectedWage);
    const repDiff = managedTeam.reputation - (getPlayerTeam(negotiation.playerId)?.reputation || 50);

    let acceptChance = 0.3;
    if (wageRatio >= 1.2) acceptChance += 0.3;
    else if (wageRatio >= 1.0) acceptChance += 0.15;
    else if (wageRatio < 0.7) acceptChance -= 0.3;

    if (repDiff > 10) acceptChance += 0.25;
    else if (repDiff > 0) acceptChance += 0.1;
    else if (repDiff < -15) acceptChance -= 0.3;

    if (player.personalGoal === 'money' && wageRatio >= 1.3) acceptChance += 0.2;
    if (player.personalGoal === 'fame' && managedTeam.reputation >= 85) acceptChance += 0.2;
    if (player.morale < 50) acceptChance += 0.15; // unhappy at current club

    acceptChance = Math.max(0.05, Math.min(0.95, acceptChance));
    const playerAccepted = Math.random() < acceptChance;

    if (playerAccepted) {
      const result = onSign(negotiation.playerId, negotiation.offeredFee, negotiation.offeredWage, negotiation.offeredYears);
      setNegotiation({
        ...negotiation,
        playerResponse: 'accepted',
        message: result.success
          ? `✅ ${player.firstName} ${player.lastName} has signed for ${managedTeam.name}!`
          : `❌ ${result.message}`,
      });
    } else {
      let reason = 'The player rejected your offer.';
      if (wageRatio < 0.8) reason = 'Wage offer too low.';
      else if (repDiff < -10) reason = `${player.firstName} prefers a more prestigious club.`;
      else if (player.personalGoal === 'playing_time') reason = `${player.firstName} is unsure about playing time.`;
      setNegotiation({ ...negotiation, playerResponse: 'rejected', message: `❌ ${reason}` });
    }
    setStep('result');
  };

  const resetNegotiation = () => {
    setNegotiation(null);
    setStep('search');
  };

  // Render negotiation flow
  if (step !== 'search' && negotiation) {
    const player = players[negotiation.playerId];
    if (!player) { resetNegotiation(); return null; }
    const ovr = getPlayerOverall(player);
    const sourceTeam = getPlayerTeam(negotiation.playerId);

    return (
      <div className="space-y-4">
        <button onClick={resetNegotiation} className="text-sm text-muted-foreground hover:text-foreground">← Back to Search</button>

        {/* Player card */}
        <div className="bg-secondary/30 rounded-lg p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center font-display text-xl text-primary">{ovr}</div>
          <div className="flex-1">
            <h3 className="font-display text-xl">{player.firstName} {player.lastName}</h3>
            <p className="text-sm text-muted-foreground">
              {player.position} · {player.age}y · {player.nationality} · POT {player.potential}
            </p>
            <p className="text-xs text-muted-foreground">
              {sourceTeam ? sourceTeam.name : 'Free Agent'} · Value: €{player.value}M · Wage: €{player.wage}K/w
            </p>
          </div>
        </div>

        {/* Board approval warning */}
        {negotiation.boardApproval === 'warned' && (
          <div className="bg-accent/10 text-accent text-sm p-3 rounded-lg">
            ⚠️ Board Warning: This signing may strain the budget. Proceed with caution.
          </div>
        )}
        {negotiation.boardApproval === 'blocked' && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            🚫 Board BLOCKED: Transfer fee exceeds budget limits. Reduce your offer or find another target.
          </div>
        )}

        {/* Step: Offer fee */}
        {step === 'offer' && (
          <div className="space-y-3">
            <h4 className="font-display text-lg">TRANSFER OFFER</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Asking Price</label>
                <p className="font-display text-lg">€{negotiation.askingPrice}M</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Your Budget</label>
                <p className="font-display text-lg text-primary">€{managedTeam.budget}M</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Your Offer (€M)</label>
              <input
                type="number"
                value={negotiation.offeredFee}
                onChange={e => setNegotiation({ ...negotiation, offeredFee: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-secondary rounded-md px-3 py-2 text-foreground font-display text-lg"
                min={0}
                max={managedTeam.budget * 1.5}
              />
            </div>
            {negotiation.message && (
              <p className="text-sm text-accent">{negotiation.message}</p>
            )}
            <button
              onClick={submitOffer}
              disabled={negotiation.boardApproval === 'blocked'}
              className="w-full gradient-pitch text-primary-foreground py-2.5 rounded-lg font-display text-base tracking-wider hover:opacity-90 disabled:opacity-40"
            >
              SUBMIT OFFER 📨
            </button>
          </div>
        )}

        {/* Step: Salary negotiation */}
        {step === 'negotiate_salary' && (
          <div className="space-y-3">
            <h4 className="font-display text-lg">CONTRACT NEGOTIATION</h4>
            <p className="text-sm text-primary">{negotiation.message}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Wage Offer (€K/week)</label>
                <input
                  type="number"
                  value={negotiation.offeredWage}
                  onChange={e => setNegotiation({ ...negotiation, offeredWage: Math.max(1, Number(e.target.value)) })}
                  className="w-full bg-secondary rounded-md px-3 py-2 text-foreground"
                  min={1}
                />
                <p className="text-xs text-muted-foreground mt-1">Current: €{player.wage}K/w</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Contract Length (years)</label>
                <select
                  value={negotiation.offeredYears}
                  onChange={e => setNegotiation({ ...negotiation, offeredYears: Number(e.target.value) })}
                  className="w-full bg-secondary rounded-md px-3 py-2 text-foreground"
                >
                  {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              💡 Tip: {player.personalGoal === 'money' ? 'This player values high wages.' 
                : player.personalGoal === 'fame' ? 'This player wants a prestigious club.' 
                : player.personalGoal === 'playing_time' ? 'This player wants guaranteed minutes.'
                : player.personalGoal === 'loyalty' ? 'This player values long-term commitment.'
                : player.personalGoal === 'legacy' ? 'This player wants to win trophies.'
                : 'This player has international ambitions.'}
            </div>
            <button
              onClick={submitSalary}
              className="w-full gradient-gold text-accent-foreground py-2.5 rounded-lg font-display text-base tracking-wider hover:opacity-90"
            >
              PROPOSE CONTRACT ✍️
            </button>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && (
          <div className="space-y-3 text-center py-4">
            <p className={`font-display text-xl ${negotiation.playerResponse === 'accepted' ? 'text-primary' : 'text-destructive'}`}>
              {negotiation.playerResponse === 'accepted' ? '🎉 DEAL COMPLETE!' : '💔 DEAL FAILED'}
            </p>
            <p className="text-sm">{negotiation.message}</p>
            {negotiation.playerResponse === 'accepted' && (
              <div className="bg-primary/10 rounded-lg p-4 mt-3">
                <p className="text-xs text-muted-foreground">📢 TRANSFER ANNOUNCEMENT</p>
                <p className="font-display text-lg mt-1">{player.firstName} {player.lastName}</p>
                <p className="text-sm text-muted-foreground">has joined {managedTeam.name}</p>
                <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Fee: €{negotiation.offeredFee}M</span>
                  <span>Wage: €{negotiation.offeredWage}K/w</span>
                  <span>{negotiation.offeredYears}yr deal</span>
                </div>
              </div>
            )}
            <button onClick={resetNegotiation} className="mt-4 bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-display hover:bg-secondary/80">
              BACK TO SEARCH
            </button>
          </div>
        )}
      </div>
    );
  }

  // Search view
  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg text-muted-foreground">🔎 PLAYER SEARCH & SCOUT HUB</h3>
      <p className="text-xs text-muted-foreground">Budget: <span className="text-primary font-display">€{managedTeam?.budget || 0}M</span> · Squad: {managedTeam?.squad.filter(p => !p.retired).length || 0} players</p>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input
          placeholder="Search player name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="col-span-2 bg-secondary rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <select value={posFilter} onChange={e => setPosFilter(e.target.value as any)} className="bg-secondary rounded-md px-2 py-2 text-sm text-foreground">
          <option value="ALL">All Positions</option>
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-secondary rounded-md px-2 py-2 text-sm text-foreground">
          <option value="ovr">Sort: OVR</option>
          <option value="potential">Sort: Potential</option>
          <option value="value">Sort: Value</option>
          <option value="age">Sort: Age</option>
        </select>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-xs text-muted-foreground">Min OVR:</label>
          <input type="number" value={ratingMin} onChange={e => setRatingMin(Number(e.target.value))} className="w-14 bg-secondary rounded px-2 py-1 text-sm text-foreground" min={30} max={99} />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-muted-foreground">Age:</label>
          <input type="number" value={ageMin} onChange={e => setAgeMin(Number(e.target.value))} className="w-12 bg-secondary rounded px-2 py-1 text-sm text-foreground" min={15} max={45} />
          <span className="text-xs text-muted-foreground">-</span>
          <input type="number" value={ageMax} onChange={e => setAgeMax(Number(e.target.value))} className="w-12 bg-secondary rounded px-2 py-1 text-sm text-foreground" min={15} max={45} />
        </div>
        <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={freeAgentsOnly} onChange={e => setFreeAgentsOnly(e.target.checked)} className="rounded" />
          Free Agents Only
        </label>
      </div>

      <p className="text-xs text-muted-foreground">{availablePlayers.length} players found (showing top 50)</p>

      {/* Player list */}
      <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
        {displayPlayers.map(p => {
          const ovr = getPlayerOverall(p);
          const team = getPlayerTeam(p.id);
          return (
            <div key={p.id} className="flex items-center gap-2 py-2 px-3 rounded-md bg-card/50 hover:bg-card/80 transition-colors group">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-display flex-shrink-0 ${
                ovr >= 85 ? 'bg-accent/20 text-accent' : ovr >= 75 ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
              }`}>{ovr}</span>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlayerClick(p.id)}>
                <p className="font-medium text-sm truncate">{p.firstName} {p.lastName} {p.isLegend && '⭐'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {p.position} · {p.age}y · {p.nationality} · POT {p.potential} · {team?.shortName || 'Free Agent'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-display text-primary">€{p.value}M</p>
                <p className="text-xs text-muted-foreground">€{p.wage}K/w</p>
              </div>
              <button
                onClick={() => startNegotiation(p.id)}
                className="ml-1 px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-display hover:bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                SIGN
              </button>
            </div>
          );
        })}
        {displayPlayers.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No players match your filters.</p>
        )}
      </div>
    </div>
  );
};

export default TransferHub;
