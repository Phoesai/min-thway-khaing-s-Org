import { POPULAR_ITEMS, CATEGORIES } from '../types';
import { Sparkles } from 'lucide-react';

interface QuickAddPopularProps {
  onAddPopularItem: (name: string, category: string) => void;
}

export default function QuickAddPopular({ onAddPopularItem }: QuickAddPopularProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Tap to Quick Add
        </h3>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none snap-x">
        {POPULAR_ITEMS.map((item) => {
          const cat = CATEGORIES.find((c) => c.id === item.category);
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onAddPopularItem(item.name, item.category)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-200 rounded-xl text-xs font-medium whitespace-nowrap snap-align-start transition-all active:scale-95 shadow-sm"
            >
              <span className="text-sm leading-none">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
