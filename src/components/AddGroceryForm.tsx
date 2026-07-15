import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { GroceryItem, CATEGORIES, UNITS } from '../types';

interface AddGroceryFormProps {
  onAddItem: (item: {
    name: string;
    note: string;
    quantity: number;
    unit: string;
    category: string;
  }) => void;
}

export default function AddGroceryForm({ onAddItem }: AddGroceryFormProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('other');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddItem({
      name: name.trim(),
      note: note.trim(),
      quantity,
      unit,
      category,
    });

    // Reset fields
    setName('');
    setNote('');
    setQuantity(1);
    // Keep unit and category as sticky defaults for rapid entry if preferred,
    // or reset them. Let's reset quantity/note and keep the others or reset.
    // Let's reset to defaults.
    setUnit('pcs');
    setCategory('other');
    setIsExpanded(false);
  };

  const incrementQty = () => setQuantity((q) => q + 1);
  const decrementQty = () => setQuantity((q) => Math.max(1, q - 1));

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Primary Input Row */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            id="item-name-input"
            type="text"
            placeholder="Add grocery item... (e.g., Bananas)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-base placeholder-zinc-500"
            required
            autoComplete="off"
          />
        </div>
        <button
          id="add-item-submit-btn"
          type="submit"
          disabled={!name.trim()}
          className="h-12 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium rounded-xl flex items-center justify-center transition-colors shadow-lg active:scale-95 duration-100"
        >
          <Plus className="w-5 h-5 mr-1" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Toggle Options (Notes, Category, Quantity) */}
      <div className="flex justify-between items-center px-1">
        <button
          id="toggle-options-btn"
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 flex items-center gap-1 py-1 px-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 transition-colors"
        >
          <span>{isExpanded ? 'Fewer Options' : 'More Options (Note, Category, Qty)'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {name.trim() && !isExpanded && (
          <span className="text-xs text-zinc-500 animate-pulse">
            Press enter or tap Add
          </span>
        )}
      </div>

      {/* Expanded Options Grid */}
      {isExpanded && (
        <div className="space-y-4 border-t border-zinc-800/60 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Note Input */}
          <div className="space-y-1.5">
            <label htmlFor="item-note-input" className="text-xs font-medium text-zinc-400">
              Optional Note
            </label>
            <input
              id="item-note-input"
              type="text"
              placeholder="e.g. Organic, brand name, specific size..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 text-zinc-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm placeholder-zinc-650"
              autoComplete="off"
            />
          </div>

          {/* Quantity & Unit Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Quantity Counter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Quantity</label>
              <div className="flex items-center bg-zinc-950 border border-zinc-850 rounded-lg h-10 p-1">
                <button
                  id="qty-decrement-btn"
                  type="button"
                  onClick={decrementQty}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-transform"
                >
                  -
                </button>
                <span className="flex-1 text-center font-medium text-zinc-200 text-sm">
                  {quantity}
                </span>
                <button
                  id="qty-increment-btn"
                  type="button"
                  onClick={incrementQty}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>
            </div>

            {/* Unit Picker */}
            <div className="space-y-1.5">
              <label htmlFor="item-unit-select" className="text-xs font-medium text-zinc-400">Unit</label>
              <select
                id="item-unit-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-2 bg-zinc-950 border border-zinc-850 text-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Visual Grid Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Category / Aisle
            </label>
            <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? `${cat.bgColor} border-emerald-500 text-zinc-100 ring-1 ring-emerald-500/20`
                        : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-lg mb-0.5">{cat.icon}</span>
                    <span className="text-[10px] font-medium leading-none truncate w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
