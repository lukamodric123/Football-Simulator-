import React, { useState } from 'react';
import { useGame } from '@/engine/GameContext';
import { LEAGUES } from '@/engine/data';
import { GameMode, Position } from '@/engine/types';
import { NATIONALITIES } from '@/engine/data';

const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

const Index: React.FC = () => {
  const { state, initializeGame, initializeCareerMode } = useGame();
  const [step, setStep] = useState<'menu' | 'mode' | 'team_select' | 'career_create'>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('universe');
  const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0].id);

  // Career mode state
  const [careerName, setCareerName] = useState('');
  const [careerPosition, setCareerPosition] = useState<Position>('CM');
  const [careerNationality, setCareerNationality] = useState('England');
  const [careerStart, setCareerStart] = useState<'youth' | 'small_club' | 'big_club'>('youth');

  if (state.initialized) {
    const Dashboard = React.lazy(() => import('./Dashboard'));
    return (
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="font-display text-2xl text-muted-foreground animate-pulse">Generating universe...</div>
        </div>
      }>
        <Dashboard />
      </React.Suspense>
    );
  }

  // Career Mode: Team Selection
  if (step === 'career_create') {
    const allLeagues = LEAGUES;
    const leagueDef = allLeagues.find(l => l.id === selectedLeague)!;
    const filteredTeams = leagueDef.teams.filter(t => {
      if (careerStart === 'big_club') return t.reputation >= 80;
      if (careerStart === 'small_club') return t.reputation >= 55 && t.reputation < 80;
      return true; // youth = any
    });

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <h1 className="font-display text-4xl mb-2">CREATE YOUR CAREER</h1>
        <p className="text-muted-foreground mb-6">Build your legend from scratch</p>

        <div className="max-w-lg w-full space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Player Name</label>
              <input value={careerName} onChange={e => setCareerName(e.target.value)} placeholder="Alex Player"
                className="w-full bg-secondary rounded-md px-3 py-2 text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Position</label>
              <select value={careerPosition} onChange={e => setCareerPosition(e.target.value as Position)}
                className="w-full bg-secondary rounded-md px-3 py-2 text-foreground">
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nationality</label>
              <select value={careerNationality} onChange={e => setCareerNationality(e.target.value)}
                className="w-full bg-secondary rounded-md px-3 py-2 text-foreground">
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start From</label>
              <select value={careerStart} onChange={e => setCareerStart(e.target.value as any)}
                className="w-full bg-secondary rounded-md px-3 py-2 text-foreground">
                <option value="youth">🌱 Youth Academy (Age 17)</option>
                <option value="small_club">🏟️ Small Club (Age 20)</option>
                <option value="big_club">⭐ Big Club (Age 20)</option>
              </select>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">Select your starting club:</p>
        <div className="flex gap-1 overflow-x-auto pb-1 mb-3">
          {allLeagues.filter(l => l.tier === 1).map(l => (
            <button key={l.id} onClick={() => setSelectedLeague(l.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                selectedLeague === l.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}>{l.name}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full max-h-[300px] overflow-y-auto pr-2">
          {filteredTeams.map(t => (
            <button key={t.shortName}
              onClick={() => {
                const teamId = `${leagueDef.id}-${t.shortName.toLowerCase()}`;
                initializeCareerMode(careerName || 'Alex Player', careerPosition, careerNationality, careerStart, teamId);
              }}
              className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 card-hover text-left transition-all hover:scale-[1.02]">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">Rep: {t.reputation}</p>
              </div>
            </button>
          ))}
          {filteredTeams.length === 0 && <p className="text-sm text-muted-foreground col-span-2 text-center py-4">No clubs match this start type in this league.</p>}
        </div>

        <button onClick={() => setStep('mode')} className="mt-6 text-sm text-muted-foreground hover:text-foreground">← Back</button>
      </div>
    );
  }

  if (step === 'team_select') {
    const allLeagues = LEAGUES;
    const leagueDef = allLeagues.find(l => l.id === selectedLeague)!;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <h1 className="font-display text-4xl mb-2">CHOOSE YOUR CLUB</h1>
        <p className="text-muted-foreground mb-6">Select a league, then pick your team</p>

        <div className="flex flex-col gap-1 mb-6 w-full max-w-2xl">
          <div className="flex gap-1 overflow-x-auto pb-1">
            <span className="text-xs text-muted-foreground self-center px-1">T1</span>
            {allLeagues.filter(l => l.tier === 1).map(l => (
              <button key={l.id} onClick={() => setSelectedLeague(l.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedLeague === l.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}>{l.name}</button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            <span className="text-xs text-muted-foreground self-center px-1">T2</span>
            {allLeagues.filter(l => l.tier === 2).map(l => (
              <button key={l.id} onClick={() => setSelectedLeague(l.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedLeague === l.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-secondary-foreground hover:bg-secondary/80'
                }`}>{l.name}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full max-h-[400px] overflow-y-auto pr-2">
          {leagueDef.teams.map(t => (
            <button key={t.shortName}
              onClick={() => initializeGame(selectedMode, `${leagueDef.id}-${t.shortName.toLowerCase()}`)}
              className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 card-hover text-left transition-all hover:scale-[1.02]">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">Rep: {t.reputation} · {leagueDef.tier === 2 ? 'Div 2' : 'Div 1'}</p>
              </div>
            </button>
          ))}
        </div>

        <button onClick={() => setStep('mode')} className="mt-6 text-sm text-muted-foreground hover:text-foreground">← Back</button>
      </div>
    );
  }

  if (step === 'mode') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <h1 className="font-display text-4xl mb-2">CHOOSE YOUR MODE</h1>
        <p className="text-muted-foreground mb-8">How do you want to experience the football universe?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl w-full">
          <button onClick={() => { setSelectedMode('manager'); setStep('team_select'); }}
            className="bg-card rounded-xl p-5 text-left card-hover transition-all hover:scale-[1.02] border border-border hover:border-primary">
            <span className="text-3xl">🎯</span>
            <h3 className="font-display text-xl mt-2">MANAGER</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Control a club. Tactics, transfers, board expectations, sacking.</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['Agents', 'Sacking', 'Fan Meter'].map(f => (
                <span key={f} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{f}</span>
              ))}
            </div>
          </button>

          <button onClick={() => { setStep('career_create'); }}
            className="bg-card rounded-xl p-5 text-left card-hover transition-all hover:scale-[1.02] border border-border hover:border-primary">
            <span className="text-3xl">🌟</span>
            <h3 className="font-display text-xl mt-2">CAREER</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Create a player. Rise to legend. Win Ballon d'Or.</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['Create', 'Story', 'Legacy'].map(f => (
                <span key={f} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{f}</span>
              ))}
            </div>
          </button>

          <button onClick={() => initializeGame('ultimate_team')}
            className="bg-card rounded-xl p-5 text-left card-hover transition-all hover:scale-[1.02] border border-border hover:border-accent">
            <span className="text-3xl">🏆</span>
            <h3 className="font-display text-xl mt-2">ULTIMATE TEAM</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Build dream squad. Cards, chemistry, packs, leaderboard.</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['Cards', 'Packs', 'Chemistry'].map(f => (
                <span key={f} className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">{f}</span>
              ))}
            </div>
          </button>

          <button onClick={() => initializeGame('universe')}
            className="bg-card rounded-xl p-5 text-left card-hover transition-all hover:scale-[1.02] border border-border hover:border-accent">
            <span className="text-3xl">🌍</span>
            <h3 className="font-display text-xl mt-2">UNIVERSE</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Watch dynasties unfold. GOAT rankings. History tracker.</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['Dynasty', 'GOAT', 'Records'].map(f => (
                <span key={f} className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">{f}</span>
              ))}
            </div>
          </button>

          <button onClick={() => initializeGame('survival')}
            className="bg-card rounded-xl p-5 text-left card-hover transition-all hover:scale-[1.02] border border-border hover:border-destructive">
            <span className="text-3xl">⚔️</span>
            <h3 className="font-display text-xl mt-2">SURVIVAL</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Teams eliminated each season. Last standing wins.</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['Elimination', 'Last Man', 'Drama'].map(f => (
                <span key={f} className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">{f}</span>
              ))}
            </div>
          </button>
        </div>

        <button onClick={() => setStep('menu')} className="mt-6 text-sm text-muted-foreground hover:text-foreground">← Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] border-2 border-primary rounded-full" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 translate-y-[200px] w-[600px] h-px bg-primary" />
      </div>

      <div className="text-center z-10 px-4">
        <h1 className="font-display text-6xl sm:text-8xl mb-2 tracking-wider">ULTIMATE SOCCER</h1>
        <h2 className="font-display text-4xl sm:text-6xl text-primary mb-4 tracking-wider">SIMULATOR</h2>
        <p className="text-xs text-accent font-display tracking-widest mb-2">ULTIMATE EXPANSION · V9</p>
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded font-medium">⭐ MESSI · RONALDO · MBAPPÉ · HAALAND · 30+ ICONS</span>
        </div>
        <p className="text-muted-foreground max-w-lg mx-auto mb-12 leading-relaxed">
          A living football universe with 5 game modes, Ultimate Team cards, expanded manager with agents & sacking, dynasty tracker, and the ultimate GOAT debate.
        </p>

        <button onClick={() => setStep('mode')}
          className="gradient-pitch text-primary-foreground px-10 py-4 rounded-lg font-display text-2xl tracking-widest hover:opacity-90 transition-all glow-pitch hover:scale-105 active:scale-95">
          START ⚽
        </button>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-5 gap-6 max-w-3xl mx-auto text-center">
          {[
            { icon: '⭐', label: 'Superstars', sub: '30 Icons Seeded' },
            { icon: '🏆', label: 'Ultimate Team', sub: 'Cards & Packs' },
            { icon: '👔', label: 'Manager+', sub: 'Agents & Sacking' },
            { icon: '🎬', label: 'Dynasty', sub: 'Club Tracker' },
            { icon: '👑', label: 'GOAT Debate', sub: 'Living History' },
          ].map(f => (
            <div key={f.label}>
              <span className="text-3xl">{f.icon}</span>
              <p className="font-display text-lg mt-2">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
