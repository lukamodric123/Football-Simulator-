import React from 'react';
import { NewsItem } from '@/engine/types';

interface NewsFeedProps {
  news: NewsItem[];
  limit?: number;
}

const categoryConfig: Record<string, { icon: string; border: string; badge: string }> = {
  transfer: { icon: '💰', border: 'border-l-accent', badge: 'text-accent' },
  match: { icon: '⚽', border: 'border-l-primary', badge: 'text-primary' },
  injury: { icon: '🏥', border: 'border-l-destructive', badge: 'text-destructive' },
  award: { icon: '🏆', border: 'border-l-accent', badge: 'text-accent' },
  drama: { icon: '🔥', border: 'border-l-destructive', badge: 'text-destructive' },
  youth: { icon: '⚡', border: 'border-l-primary', badge: 'text-primary' },
  manager: { icon: '📋', border: 'border-l-muted-foreground', badge: 'text-muted-foreground' },
  goat: { icon: '👑', border: 'border-l-accent', badge: 'text-accent' },
  legend: { icon: '⭐', border: 'border-l-accent', badge: 'text-accent' },
  retirement: { icon: '🙏', border: 'border-l-muted-foreground', badge: 'text-muted-foreground' },
  takeover: { icon: '💼', border: 'border-l-accent', badge: 'text-accent' },
  ucl: { icon: '🌟', border: 'border-l-primary', badge: 'text-primary' },
};

const NewsFeed: React.FC<NewsFeedProps> = ({ news, limit = 30 }) => {
  const sorted = [...news]
    .sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return b.week - a.week;
    })
    .slice(0, limit);

  return (
    <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
      {sorted.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-4">No news yet. Start simulating!</p>
      )}
      {sorted.map(item => {
        const cfg = categoryConfig[item.category] || { icon: '📰', border: 'border-l-border', badge: 'text-muted-foreground' };
        const isBreaking = item.importance >= 5;
        return (
          <div
            key={item.id}
            className={`border-l-2 ${cfg.border} rounded-r-md px-3 py-2 transition-colors ${isBreaking ? 'bg-accent/5' : 'bg-card/40 hover:bg-card/60'}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm mt-0.5 flex-shrink-0">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${isBreaking ? 'font-semibold' : 'font-medium'}`}>
                  {item.headline}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs capitalize ${cfg.badge}`}>{item.category}</span>
                  <span className="text-xs text-muted-foreground">S{item.season} · W{item.week}</span>
                  {isBreaking && <span className="text-xs font-bold text-accent">🔴 BREAKING</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NewsFeed;
