import React from 'react';
import { NewsItem } from '@/engine/types';

interface NewsFeedProps {
  news: NewsItem[];
  limit?: number;
}

const categoryIcons: Record<string, string> = {
  transfer: '💰',
  match: '⚽',
  injury: '🏥',
  award: '🏆',
  drama: '🔥',
  youth: '⭐',
  manager: '👔',
  goat: '👑',
  legend: '🌟',
  retirement: '👋',
  takeover: '🏦',
};

const categoryColors: Record<string, string> = {
  transfer: 'border-l-accent',
  match: 'border-l-primary',
  injury: 'border-l-destructive',
  award: 'border-l-accent',
  drama: 'border-l-destructive',
  youth: 'border-l-primary',
  manager: 'border-l-muted-foreground',
  goat: 'border-l-accent',
  legend: 'border-l-accent',
  retirement: 'border-l-muted-foreground',
  takeover: 'border-l-accent',
};

const NewsFeed: React.FC<NewsFeedProps> = ({ news, limit = 20 }) => {
  const items = news.slice(0, limit);
  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
      {items.map(item => (
        <div key={item.id} className={`border-l-2 ${categoryColors[item.category] || 'border-l-border'} bg-card/50 rounded-r-md px-3 py-2`}>
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">{categoryIcons[item.category] || '📰'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{item.headline}</p>
              <p className="text-xs text-muted-foreground mt-0.5">S{item.season} · W{item.week}</p>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No news yet...</p>}
    </div>
  );
};

export default NewsFeed;
