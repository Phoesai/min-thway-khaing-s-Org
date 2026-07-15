export interface GroceryItem {
  id: string;
  name: string;
  note?: string;
  quantity: number;
  unit: string;
  category: string;
  completed: boolean;
  createdAt: number;
  user_email?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string; // Tailwind color class prefix (e.g. 'emerald', 'sky')
  bgColor: string; // Tailwind background color class
  borderColor: string;
}

export const CATEGORIES: Category[] = [
  { id: 'produce', name: 'Fruits & Veggies', icon: '🥦', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  { id: 'dairy', name: 'Dairy & Eggs', icon: '🥛', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  { id: 'bakery', name: 'Bakery', icon: '🍞', color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  { id: 'meat', name: 'Meat & Seafood', icon: '🥩', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  { id: 'frozen', name: 'Frozen Foods', icon: '❄️', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
  { id: 'pantry', name: 'Pantry & Cans', icon: '🥫', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
  { id: 'beverages', name: 'Beverages', icon: '🥤', color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
  { id: 'household', name: 'Household & Care', icon: '🧼', color: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  { id: 'other', name: 'Other', icon: '🛒', color: 'text-slate-500', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
];

export const POPULAR_ITEMS = [
  { name: 'Milk', category: 'dairy', icon: '🥛' },
  { name: 'Eggs', category: 'dairy', icon: '🥚' },
  { name: 'Bread', category: 'bakery', icon: '🍞' },
  { name: 'Bananas', category: 'produce', icon: '🍌' },
  { name: 'Apples', category: 'produce', icon: '🍎' },
  { name: 'Spinach', category: 'produce', icon: '🥬' },
  { name: 'Chicken', category: 'meat', icon: '🍗' },
  { name: 'Water', category: 'beverages', icon: '💧' },
  { name: 'Toilet Paper', category: 'household', icon: '🧻' },
];

export const UNITS = [
  'pcs',
  'bag',
  'bottle',
  'box',
  'can',
  'carton',
  'g',
  'kg',
  'lb',
  'oz',
  'pack',
];
