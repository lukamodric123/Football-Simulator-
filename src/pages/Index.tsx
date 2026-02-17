import React, { useState } from 'react';
import { useGame } from '@/engine/GameContext';
import { LEAGUES } from '@/engine/data';
import { GameMode } from '@/engine/types';

const Index: React.FC = () => {
  const { state, initializeGame } = useGame();
  const [step, setStep] = useState<'menu' | 'mode' | 'team_select'>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('universe');
  const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0].id);

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

  if (step === 'team_select') {
    const leagueDef = LEAGUES.find(l => l.id === selectedLeague)!;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <h1 className="font-display text-4xl mb-2">CHOOSE YOUR CLUB</h1>
        <p className="text-muted-foreground mb-6">Select a league, then pick your team</p>

        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {LEAGUES.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLeague(l.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                selectedLeague === l.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full max-h-[400px] overflow-y-auto pr-2">
          {leagueDef.teams.map(t => (
            <button
              key={t.shortName}
              onClick={() => initializeGame('manager', `${leagueDef.id}-${t.shortName.toLowerCase()}`)}
              className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 card-hover text-left transition-all hover:scale-[1.02]"
            >
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">Rep: {t.reputation}</p>
              </div>
            </button>
          ))}
        </div>

        <button onClick={() => setStep('mode')} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
      </div>
    );
  }

  if (step === 'mode') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <h1 className="font-display text-4xl mb-2">CHOOSE YOUR MODE</h1>
        <p className="text-muted-foreground mb-8">How do you want to experience the football universe?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
          <button
            onClick={() => { setSelectedMode('manager'); setStep('team_select'); }}
            className="bg-card rounded-xl p-6 text-left card-hover transition-all hover:scale-[1.02] border border-border hover:border-primary"
          >
            <span className="text-4xl">🎯</span>
            <h3 className="font-display text-2xl mt-3">MANAGER MODE</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Take control of a club. Set tactics, approve transfers, choose lineups,
              and lead your team to glory while AI manages the rest.
            </p>
            <div className="mt-4 flex flex-wrap gap-1">
              {['Set Tactics', 'Manage Squad', 'Control Budget'].map(f => (
                <span key={f} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{f}</span>
              ))}
            </div>
          </button>

          <button
            onClick={() => initializeGame('universe')}
            className="bg-card rounded-xl p-6 text-left card-hover transition-all hover:scale-[1.02] border border-border hover:border-accent"
          >
            <span className="text-4xl">🌍</span>
            <h3 className="font-display text-2xl mt-3">UNIVERSE MODE</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Sit back and watch the football world evolve. Observe dynasties rise,
              legends emerge, and stories unfold across generations.
            </p>
            <div className="mt-4 flex flex-wrap gap-1">
              {['Auto Sim', 'Watch History', 'Track Legends'].map(f => (
                <span key={f} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">{f}</span>
              ))}
            </div>
          </button>
        </div>

        <button onClick={() => setStep('menu')} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
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
        <p className="text-xs text-accent font-display tracking-widest mb-8">EXPANDED EDITION · V2</p>
        <p className="text-muted-foreground max-w-lg mx-auto mb-12 leading-relaxed">
          A living football universe. Manage a club or watch history unfold across generations.
          Legends emerge, dynasties rise, GOAT debates rage, and stories write themselves.
        </p>

        <button
          onClick={() => setStep('mode')}
          className="gradient-pitch text-primary-foreground px-10 py-4 rounded-lg font-display text-2xl tracking-widest hover:opacity-90 transition-all glow-pitch hover:scale-105 active:scale-95"
        >
          START ⚽
        </button>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto text-center">
          {[
            { icon: '🏟️', label: '5 Leagues', sub: '96 Teams' },
            { icon: '🏆', label: 'GOAT Debate', sub: 'All-Time Greats' },
            { icon: '⭐', label: 'Legends', sub: 'Born Naturally' },
            { icon: '📰', label: 'Live Drama', sub: 'Stories Emerge' },
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
