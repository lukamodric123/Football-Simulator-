import React from 'react';
import { useGame } from '@/engine/GameContext';

const Index: React.FC = () => {
  const { state, initializeGame } = useGame();

  if (state.initialized) {
    // Dynamic import to avoid circular — we redirect via state
    const Dashboard = React.lazy(() => import('./Dashboard'));
    return (
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="font-display text-2xl text-muted-foreground animate-pulse">Loading...</div>
        </div>
      }>
        <Dashboard />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] border-2 border-primary rounded-full" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 translate-y-[200px] w-[600px] h-px bg-primary" />
      </div>

      <div className="text-center z-10 px-4">
        <h1 className="font-display text-6xl sm:text-8xl mb-2 tracking-wider">
          ULTIMATE SOCCER
        </h1>
        <h2 className="font-display text-4xl sm:text-6xl text-primary mb-8 tracking-wider">
          SIMULATOR
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-12 leading-relaxed">
          Manage your way through the Top 5 European leagues. Watch dynasties rise,
          wonderkids emerge, and legends retire in a living football universe.
        </p>

        <button
          onClick={initializeGame}
          className="gradient-pitch text-primary-foreground px-10 py-4 rounded-lg font-display text-2xl tracking-widest hover:opacity-90 transition-all glow-pitch hover:scale-105 active:scale-95"
        >
          NEW GAME ⚽
        </button>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
          {[
            { icon: '🏟️', label: '5 Leagues', sub: '96 Teams' },
            { icon: '⚽', label: 'Full Sim', sub: 'Every Match' },
            { icon: '📰', label: 'Live News', sub: 'Stories Emerge' },
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
