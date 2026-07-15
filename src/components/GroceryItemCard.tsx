import { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, Edit2, Check, X, Tag } from 'lucide-react';
import { GroceryItem, CATEGORIES } from '../types';

interface GroceryItemCardProps {
  key?: string;
  item: GroceryItem;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<GroceryItem>) => void;
}

export default function GroceryItemCard({
  item,
  onToggleComplete,
  onDelete,
  onUpdate,
}: GroceryItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editNote, setEditNote] = useState(item.note || '');
  const [editCategory, setEditCategory] = useState(item.category);

  const cat = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[CATEGORIES.length - 1];

  const handleSave = () => {
    if (!editName.trim()) return;
    onUpdate(item.id, {
      name: editName.trim(),
      note: editNote.trim() || undefined,
      category: editCategory,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(item.name);
    setEditNote(item.note || '');
    setEditCategory(item.category);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative group bg-zinc-900/90 border rounded-2xl p-3.5 sm:p-4 shadow-md transition-all ${
        item.completed
          ? 'border-zinc-900 opacity-55'
          : 'border-zinc-850 hover:border-zinc-800'
      }`}
    >
      {isEditing ? (
        <div className="space-y-3" id={`edit-form-${item.id}`}>
          {/* Edit Inputs */}
          <div className="space-y-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              placeholder="Item Name"
              required
            />
            <input
              type="text"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs placeholder-zinc-650"
              placeholder="Optional Note"
            />
          </div>

          {/* Edit Category selection */}
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] text-zinc-500 mr-1 flex items-center gap-0.5">
              <Tag className="w-3 h-3" /> Aisle:
            </span>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setEditCategory(c.id)}
                className={`text-[10px] px-2 py-1 rounded-md transition-all border ${
                  editCategory === c.id
                    ? `${c.bgColor} border-emerald-500 text-zinc-100`
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                }`}
              >
                {c.icon} {c.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Edit Controls */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={handleCancel}
              className="px-3 h-8 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-350 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editName.trim()}
              className="px-3 h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Checkbox Tap Target - Extra large for cold or shaky supermarket fingers! */}
          <button
            id={`toggle-${item.id}`}
            onClick={() => onToggleComplete(item.id)}
            aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
            className="h-12 w-12 flex items-center justify-center -ml-2 -my-2 rounded-xl active:bg-zinc-800/30 transition-colors cursor-pointer"
          >
            <div
              className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                item.completed
                  ? 'bg-emerald-600 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {item.completed && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check className="w-4 h-4 text-white stroke-[3px]" />
                </motion.div>
              )}
            </div>
          </button>

          {/* Item Content Area (clickable to toggle as well, for superior UX) */}
          <div
            id={`content-${item.id}`}
            onClick={() => onToggleComplete(item.id)}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span
                className={`text-base font-semibold tracking-wide truncate transition-all duration-200 ${
                  item.completed
                    ? 'text-zinc-500 line-through decoration-zinc-600 decoration-2'
                    : 'text-zinc-100'
                }`}
              >
                {item.name}
              </span>

              {/* Quantity / Unit label */}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  item.completed
                    ? 'bg-zinc-850 text-zinc-550'
                    : `${cat.bgColor} ${cat.color}`
                }`}
              >
                {item.quantity} {item.unit}
              </span>
            </div>

            {/* Note Display */}
            {item.note && (
              <p
                className={`text-xs mt-0.5 truncate max-w-full font-medium transition-all ${
                  item.completed ? 'text-zinc-600 line-through' : 'text-zinc-400'
                }`}
              >
                {item.note}
              </p>
            )}

            {/* Category Indicator Badge */}
            <div className="flex items-center justify-between flex-wrap gap-1.5 mt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] leading-none">{cat.icon}</span>
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  {cat.name}
                </span>
              </div>
              {item.user_email && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                  Added by {item.user_email.split('@')[0]}
                </span>
              )}
            </div>
          </div>

          {/* Action Row: Quantity adjustments, Edit, Trash */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Inline Quantity adjust (only if not completed) */}
            {!item.completed && (
              <div className="hidden xs:flex items-center bg-zinc-950 border border-zinc-850 rounded-xl h-8 p-0.5 mr-1">
                <button
                  id={`dec-${item.id}`}
                  onClick={() =>
                    onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })
                  }
                  className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 active:scale-90 transition-all font-bold text-sm"
                >
                  -
                </button>
                <span className="w-5 text-center text-xs font-semibold text-zinc-300">
                  {item.quantity}
                </span>
                <button
                  id={`inc-${item.id}`}
                  onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 active:scale-90 transition-all font-bold text-sm"
                >
                  +
                </button>
              </div>
            )}

            {/* Edit button */}
            {!item.completed && (
              <button
                id={`edit-btn-${item.id}`}
                onClick={() => setIsEditing(true)}
                title="Edit item"
                className="p-2 text-zinc-500 hover:text-amber-500 hover:bg-zinc-800/50 rounded-xl transition-colors active:scale-95 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {/* Delete button */}
            <button
              id={`delete-btn-${item.id}`}
              onClick={() => onDelete(item.id)}
              title="Delete item"
              className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
