import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ShoppingBag,
  Share2,
  Trash2,
  CheckCircle2,
  Search,
  Layers,
  ArrowUpDown,
  Sun,
  Moon,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  LogOut,
  Mail,
  Lock,
  User,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { GroceryItem, CATEGORIES } from './types';
import AddGroceryForm from './components/AddGroceryForm';
import QuickAddPopular from './components/QuickAddPopular';
import GroceryItemCard from './components/GroceryItemCard';
import { supabase } from './supabaseClient';

export default function App() {
  // --- Auth State ---
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // --- List State ---
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // --- Theme State ---
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('grocery_dark_mode');
    return saved ? saved === 'true' : true; // default to dark mode
  });

  // --- Filtering & Sorting State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped'); // 'grouped' (aisles) or 'list' (chronological)
  const [showCompleted, setShowCompleted] = useState(true);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // --- Accordion states for aisles ---
  const [collapsedAisles, setCollapsedAisles] = useState<Record<string, boolean>>({});

  // --- Confirm modals state ---
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmClearCompleted, setConfirmClearCompleted] = useState(false);

  // --- 1. Auth Subscription & Active Session Effect ---
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    }).catch((err) => {
      console.error('Error getting initial session:', err);
      setAuthLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- 2. Load Items & Subscribe to Changes when Logged In ---
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    // Initial load
    fetchItems();

    // Subscribe to real-time public.grocery_items updates
    const channel = supabase
      .channel('grocery_list_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grocery_items' },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // --- 3. Save Theme Preference ---
  useEffect(() => {
    localStorage.setItem('grocery_dark_mode', String(darkMode));
  }, [darkMode]);

  // --- Helper: Fetch Items from Supabase ---
  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSchemaError(null);

      if (data) {
        const mapped: GroceryItem[] = data.map((i: any) => ({
          id: i.id,
          name: i.name,
          note: i.note || undefined,
          quantity: i.quantity,
          unit: i.unit,
          category: i.category,
          completed: i.completed,
          createdAt: new Date(i.created_at).getTime(),
          user_email: i.user_email || undefined,
        }));
        setItems(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching grocery items:', err.message);
      if (err.message && (
        err.message.includes('created_at') || 
        err.message.includes('category') || 
        err.message.includes('relation "grocery_items" does not exist') ||
        err.message.includes('column')
      )) {
        setSchemaError(err.message);
      }
      triggerToast('Could not load list from server.');
    } finally {
      setItemsLoading(false);
    }
  };

  // --- Notification Toast Helper ---
  const triggerToast = (message: string) => {
    setShowNotification(message);
    setTimeout(() => {
      setShowNotification(null);
    }, 2500);
  };

  // --- Auth Handlers ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        triggerToast('Registration successful! Try logging in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        triggerToast('Logged in successfully!');
      }
    } catch (err: any) {
      console.error('Authentication Error:', err.message);
      setAuthError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      triggerToast('Logged out!');
    } catch (err: any) {
      console.error('Logout error:', err.message);
    }
  };

  // --- Grocery Item Action Handlers ---
  const handleAddItem = async (newItem: {
    name: string;
    note: string;
    quantity: number;
    unit: string;
    category: string;
  }) => {
    if (!user) return;

    // Optimistic Update
    const tempId = crypto.randomUUID();
    const tempItem: GroceryItem = {
      id: tempId,
      name: newItem.name,
      note: newItem.note || undefined,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: newItem.category,
      completed: false,
      createdAt: Date.now(),
      user_email: user.email,
    };

    setItems((prev) => [tempItem, ...prev]);
    triggerToast(`Added "${newItem.name}" to the list!`);

    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .insert([
          {
            name: newItem.name,
            note: newItem.note || null,
            quantity: newItem.quantity,
            unit: newItem.unit,
            category: newItem.category,
            completed: false,
            user_id: user.id,
            user_email: user.email,
          }
        ])
        .select();

      if (error) throw error;

      // Swap temp ID with real database UUID
      if (data && data[0]) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  id: data[0].id,
                  createdAt: new Date(data[0].created_at).getTime(),
                }
              : item
          )
        );
      }
    } catch (err: any) {
      console.error('Add item error:', err.message);
      if (err.message && (
        err.message.includes('created_at') || 
        err.message.includes('category') || 
        err.message.includes('relation "grocery_items" does not exist') ||
        err.message.includes('column')
      )) {
        setSchemaError(err.message);
      }
      triggerToast('Error saving item to Supabase.');
      // Revert optimistic update
      setItems((prev) => prev.filter((item) => item.id !== tempId));
    }
  };

  const handleAddPopularItem = async (name: string, category: string) => {
    if (!user) return;

    // Check if item already exists and is active -> increment quantity
    const existingIndex = items.findIndex((i) => i.name.toLowerCase() === name.toLowerCase() && !i.completed);
    
    if (existingIndex > -1) {
      const existingItem = items[existingIndex];
      const newQty = existingItem.quantity + 1;

      // Optimistic
      setItems((prev) => {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      });
      triggerToast(`Increased quantity of "${name}"!`);

      try {
        const { error } = await supabase
          .from('grocery_items')
          .update({ quantity: newQty })
          .eq('id', existingItem.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Update qty error:', err.message);
        // Revert
        setItems((prev) => {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], quantity: existingItem.quantity };
          return updated;
        });
      }
    } else {
      // Create new
      const tempId = crypto.randomUUID();
      const tempItem: GroceryItem = {
        id: tempId,
        name,
        quantity: 1,
        unit: 'pcs',
        category,
        completed: false,
        createdAt: Date.now(),
        user_email: user.email,
      };

      setItems((prev) => [tempItem, ...prev]);
      triggerToast(`Added "${name}"!`);

      try {
        const { data, error } = await supabase
          .from('grocery_items')
          .insert([
            {
              name,
              quantity: 1,
              unit: 'pcs',
              category,
              completed: false,
              user_id: user.id,
              user_email: user.email,
            }
          ])
          .select();

        if (error) throw error;

        if (data && data[0]) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    id: data[0].id,
                    createdAt: new Date(data[0].created_at).getTime(),
                  }
                : item
            )
          );
        }
      } catch (err: any) {
        console.error('Insert popular error:', err.message);
        if (err.message && (
          err.message.includes('created_at') || 
          err.message.includes('category') || 
          err.message.includes('relation "grocery_items" does not exist') ||
          err.message.includes('column')
        )) {
          setSchemaError(err.message);
        }
        setItems((prev) => prev.filter((item) => item.id !== tempId));
      }
    }
  };

  const handleToggleComplete = async (id: string) => {
    const originalItem = items.find((i) => i.id === id);
    if (!originalItem) return;

    const nextCompleted = !originalItem.completed;

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: nextCompleted } : item))
    );
    triggerToast(nextCompleted ? `Bought "${originalItem.name}"!` : `Moved "${originalItem.name}" back to list.`);

    try {
      const { error } = await supabase
        .from('grocery_items')
        .update({ completed: nextCompleted })
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Toggle complete error:', err.message);
      triggerToast('Error saving changes to server.');
      // Revert
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, completed: !nextCompleted } : item))
      );
    }
  };

  const handleDeleteItem = async (id: string) => {
    const deletedItem = items.find((i) => i.id === id);
    if (!deletedItem) return;

    // Optimistic
    setItems((prev) => prev.filter((item) => item.id !== id));
    triggerToast(`Removed "${deletedItem.name}"`);

    try {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Delete error:', err.message);
      triggerToast('Error deleting item from server.');
      // Revert
      setItems((prev) => [...prev, deletedItem]);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<GroceryItem>) => {
    const originalItem = items.find((i) => i.id === id);
    if (!originalItem) return;

    // Optimistic
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.note !== undefined) dbUpdates.note = updates.note || null;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.category !== undefined) dbUpdates.category = updates.category;

      const { error } = await supabase
        .from('grocery_items')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Update item error:', err.message);
      triggerToast('Error saving changes to server.');
      setItems((prev) =>
        prev.map((item) => (item.id === id ? originalItem : item))
      );
    }
  };

  const handleClearCompleted = async () => {
    const completedIds = completedItems.map((i) => i.id);
    if (completedIds.length === 0) return;

    // Optimistic
    setItems((prev) => prev.filter((i) => !i.completed));
    setConfirmClearCompleted(false);
    triggerToast('Completed items cleared!');

    try {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .in('id', completedIds);

      if (error) throw error;
    } catch (err: any) {
      console.error('Clear completed error:', err.message);
      triggerToast('Error syncing list reset with server.');
      fetchItems();
    }
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;

    // Optimistic
    setItems([]);
    setConfirmClearAll(false);
    triggerToast('All items cleared!');

    try {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything in table

      if (error) throw error;
    } catch (err: any) {
      console.error('Clear all error:', err.message);
      triggerToast('Error resetting list from server.');
      fetchItems();
    }
  };

  const handleShareList = () => {
    const active = items.filter((i) => !i.completed);
    const completed = items.filter((i) => i.completed);

    if (items.length === 0) {
      triggerToast('Your list is empty! Add items before sharing.');
      return;
    }

    let text = `🛒 FAMILY GROCERY LIST (${active.length} to buy, ${completed.length} bought)\n\n`;

    if (active.length > 0) {
      text += `📌 TO BUY:\n`;
      CATEGORIES.forEach((cat) => {
        const catItems = active.filter((i) => i.category === cat.id);
        if (catItems.length > 0) {
          text += `\n${cat.icon} ${cat.name}:\n`;
          catItems.forEach((i) => {
            text += `  - [ ] ${i.name} (${i.quantity} ${i.unit})${i.note ? ` - ${i.note}` : ''}${i.user_email ? ` (Added by ${i.user_email.split('@')[0]})` : ''}\n`;
          });
        }
      });
      text += `\n`;
    }

    if (completed.length > 0) {
      text += `✅ BOUGHT:\n`;
      completed.forEach((i) => {
        text += `  - [x] ${i.name} (${i.quantity} ${i.unit})${i.note ? ` - ${i.note}` : ''}\n`;
      });
      text += `\n`;
    }

    text += `Shared from our Family Grocery List App.`;

    navigator.clipboard.writeText(text)
      .then(() => triggerToast('List copied to clipboard! Share with anyone.'))
      .catch(() => triggerToast('Failed to copy. Please copy manually.'));
  };

  const toggleAisleCollapse = (aisleId: string) => {
    setCollapsedAisles((prev) => ({
      ...prev,
      [aisleId]: !prev[aisleId],
    }));
  };

  // --- Derived Calculations ---
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const activeItems = filteredItems.filter((item) => !item.completed);
  const completedItems = filteredItems.filter((item) => item.completed);

  const totalCount = items.length;
  const completedCount = items.filter((item) => item.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // --- Render Loading State ---
  if (authLoading) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center font-sans py-4 px-3">
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/20">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide">
              Loading family kitchen...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Login / Signup Screen ---
  if (!user) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans flex flex-col items-center justify-center py-6 px-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            
            {/* Logo Header */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-14 w-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">MTK Grocery List</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-xs">
                Synchronized grocery shopping. Add, check, and edit items together in real-time.
              </p>
            </div>

            {/* Selector Tabs */}
            <div className="grid grid-cols-2 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setAuthError(null); }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  !isSignUp
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setAuthError(null); }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  isSignUp
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-xs font-semibold text-rose-600 dark:text-rose-450">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-550 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="mom@family.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 pl-9 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-550 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-9 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-extrabold text-sm rounded-xl transition-colors shadow-lg active:scale-98 duration-100 flex items-center justify-center gap-1.5"
              >
                {authSubmitting && <RefreshCw className="w-4 h-4 animate-spin mr-1" />}
                <span>{isSignUp ? 'Create Family Account' : 'Sign In to Family Kitchen'}</span>
              </button>
            </form>

            {/* Quick Family Setup Instructions */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Family Accounts Setup</h4>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                To create accounts for your family, click the <strong>Sign Up</strong> tab above, enter their email and a secure password, then click Sign Up. Do this for each member so they can log in!
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- Render Logged In Main Application ---
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans flex flex-col items-center py-4 px-3 sm:px-6">
        
        {/* Main Phone-Styled Viewport Container */}
        <div className="w-full max-w-md flex flex-col gap-4 sm:gap-5 pb-16">
          
          {/* Header Bar */}
          <header className="flex justify-between items-center py-1.5 px-1 bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-zinc-200/50 dark:border-zinc-800/30 p-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShoppingBag className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <h1 id="app-title" className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
                  Grocery List
                </h1>
                {user && (
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    Hi, {user.email.split('@')[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Dark Mode, Share, and Logout */}
            <div className="flex items-center gap-1">
              <button
                id="share-list-btn"
                onClick={handleShareList}
                title="Share text list"
                className="h-9 w-9 flex items-center justify-center text-zinc-500 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
              >
                <Share2 className="w-4.5 h-4.5" />
              </button>
              <button
                id="toggle-theme-btn"
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="h-9 w-9 flex items-center justify-center text-zinc-500 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
              >
                {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-zinc-650" />}
              </button>
              <button
                id="logout-btn"
                onClick={handleLogout}
                title="Log Out"
                className="h-9 w-9 flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </header>

          {/* Database Schema Troubleshooting card */}
          {schemaError && (
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4.5 space-y-4 shadow-sm text-xs text-rose-850 dark:text-rose-300">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-rose-600 dark:text-rose-400">Supabase Schema Out of Sync</h3>
                  <p className="font-semibold text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    We detected a mismatch between your database table columns and the application. This happens when columns like <code className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded font-bold">created_at</code> or <code className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded font-bold">category</code> are missing from your table.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[10px] text-zinc-500 uppercase tracking-wider">How to Fix This:</span>
                  <button
                    onClick={() => {
                      const sql = `-- Option A: Add missing columns to existing table
ALTER TABLE public.grocery_items ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';
ALTER TABLE public.grocery_items ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.grocery_items ADD COLUMN IF NOT EXISTS user_email text;

-- Option B: Recreate from scratch (if starting clean)
CREATE TABLE IF NOT EXISTS public.grocery_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text,
  name text NOT NULL,
  note text,
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'pcs',
  category text NOT NULL DEFAULT 'other',
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and setup policies for shared family access
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.grocery_items;
CREATE POLICY "Allow authenticated users full access"
  ON public.grocery_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);`;
                      navigator.clipboard.writeText(sql);
                      triggerToast("SQL copied! Paste it in Supabase.");
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer"
                  >
                    Copy SQL Fix Script
                  </button>
                </div>
                
                <ol className="list-decimal pl-4.5 space-y-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
                  <li>Click <strong>Copy SQL Fix Script</strong> above.</li>
                  <li>Go to your <strong>Supabase Dashboard</strong>.</li>
                  <li>Click <strong>SQL Editor</strong> on the left sidebar, then click <strong>New Query</strong>.</li>
                  <li>Paste the script, click <strong>Run</strong>, and then refresh this app!</li>
                </ol>
              </div>

              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => fetchItems()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Retry Connection</span>
                </button>
              </div>
            </div>
          )}

          {/* Progress Tracker Card */}
          {totalCount > 0 && (
            <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-end mb-2.5">
                <div>
                  <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Shopping Trip Progress</h2>
                  <p className="text-xl font-black mt-0.5 tracking-tight">
                    {completedCount} <span className="text-zinc-400 dark:text-zinc-500 text-sm font-normal">of</span> {totalCount} <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full ml-1.5">{progressPercent}% Bought</span>
                  </p>
                </div>
                {progressPercent === 100 && (
                  <div className="animate-bounce">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                )}
              </div>
              <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-450 rounded-full"
                />
              </div>
            </section>
          )}

          {/* New Item Form */}
          <AddGroceryForm onAddItem={handleAddItem} />

          {/* Popular Items Row */}
          <QuickAddPopular onAddPopularItem={handleAddPopularItem} />

          {/* Search, Filter, and View Controls */}
          <section className="space-y-3">
            <div className="flex flex-col gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search item on your list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-9 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-550 shadow-sm"
                />
                {searchQuery && (
                  <button
                    id="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Control Filters */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex bg-zinc-200/60 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-850">
                    <button
                      id="view-grouped-btn"
                      onClick={() => setViewMode('grouped')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        viewMode === 'grouped'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>By Aisle</span>
                    </button>
                    <button
                      id="view-list-btn"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
                      }`}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Recent</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {completedCount > 0 && (
                      <button
                        id="clear-completed-trigger"
                        onClick={() => setConfirmClearCompleted(true)}
                        className="text-[11px] font-bold text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 py-1.5 px-2.5 hover:bg-rose-500/10 dark:hover:bg-rose-500/5 rounded-lg transition-colors border border-transparent hover:border-rose-500/25"
                      >
                        Clear Bought
                      </button>
                    )}
                    <button
                      id="clear-all-trigger"
                      onClick={() => setConfirmClearAll(true)}
                      className="text-[11px] font-bold text-zinc-400 hover:text-rose-500 py-1.5 px-2.5 hover:bg-rose-500/10 dark:hover:bg-rose-500/5 rounded-lg transition-colors border border-transparent hover:border-rose-500/25"
                    >
                      Reset All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* MAIN ACTIVE GROCERY LISTS */}
          <main className="space-y-4">
            {itemsLoading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="text-xs text-zinc-400 mt-2">Syncing with family cabinet...</span>
              </div>
            ) : totalCount === 0 ? (
              /* EMPTY STATE */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-center shadow-sm space-y-4"
              >
                <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-950 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-650 border border-zinc-200 dark:border-zinc-850">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5px]" />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="font-extrabold text-base tracking-tight text-zinc-800 dark:text-zinc-200">Your List is Empty</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Add custom items using the form above or pick popular staples from the suggestions!
                  </p>
                </div>
              </motion.div>
            ) : filteredItems.length === 0 ? (
              /* NO SEARCH RESULTS STATE */
              <div className="text-center py-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl">
                <p className="text-zinc-500 text-sm">No items match "{searchQuery}"</p>
              </div>
            ) : (
              /* RENDER LISTS */
              <div className="space-y-4">
                
                {/* Active Items Section */}
                {activeItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider">
                        To Buy ({activeItems.length})
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {viewMode === 'list' ? (
                          // 1. Chronological list
                          activeItems.map((item) => (
                            <GroceryItemCard
                              key={item.id}
                              item={item}
                              onToggleComplete={handleToggleComplete}
                              onDelete={handleDeleteItem}
                              onUpdate={handleUpdateItem}
                            />
                          ))
                        ) : (
                          // 2. Grouped by Category/Aisle
                          CATEGORIES.map((category) => {
                            const catItems = activeItems.filter((i) => i.category === category.id);
                            if (catItems.length === 0) return null;

                            const isCollapsed = collapsedAisles[category.id] || false;

                            return (
                              <div
                                key={category.id}
                                className="bg-white/40 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden p-1.5 shadow-sm space-y-1.5"
                              >
                                {/* Category/Aisle Header */}
                                <button
                                  id={`collapse-aisle-${category.id}`}
                                  onClick={() => toggleAisleCollapse(category.id)}
                                  className="w-full flex items-center justify-between p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 rounded-xl transition-colors cursor-pointer text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{category.icon}</span>
                                    <span className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
                                      {category.name}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full">
                                      {catItems.length}
                                    </span>
                                  </div>
                                  <div className="text-zinc-400">
                                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                  </div>
                                </button>

                                {/* Category Items List */}
                                <AnimatePresence initial={false}>
                                  {!isCollapsed && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="space-y-1.5 overflow-hidden"
                                    >
                                      {catItems.map((item) => (
                                        <GroceryItemCard
                                          key={item.id}
                                          item={item}
                                          onToggleComplete={handleToggleComplete}
                                          onDelete={handleDeleteItem}
                                          onUpdate={handleUpdateItem}
                                        />
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Collapsible Completed Section */}
                {completedItems.length > 0 && (
                  <div className="space-y-2 border-t border-zinc-200/40 dark:border-zinc-850/40 pt-4">
                    <button
                      id="toggle-completed-visibility-btn"
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350 transition-colors cursor-pointer"
                    >
                      <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        <span>Bought & Completed ({completedItems.length})</span>
                      </h3>
                      <div>
                        {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {showCompleted && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          {completedItems.map((item) => (
                            <GroceryItemCard
                              key={item.id}
                              item={item}
                              onToggleComplete={handleToggleComplete}
                              onDelete={handleDeleteItem}
                              onUpdate={handleUpdateItem}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Quick Info Tip */}
          <footer className="text-center px-4 pt-4 pb-2 border-t border-zinc-200 dark:border-zinc-850/60 mt-4">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-550 flex items-center justify-center gap-1 font-medium">
              <Info className="w-3 h-3 text-emerald-500" />
              <span>Real-time connected to Supabase for the entire family.</span>
            </p>
          </footer>
        </div>

        {/* --- Global Interactive Toasts / Notifications --- */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-zinc-100 border border-zinc-800 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 max-w-sm w-[90%] text-xs font-bold justify-between"
            >
              <span>{showNotification}</span>
              <button
                onClick={() => setShowNotification(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Confirmation Dialog Modal: RESET ALL --- */}
        <AnimatePresence>
          {confirmClearAll && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xs w-full p-5 space-y-4 shadow-2xl"
              >
                <div className="space-y-1.5 text-center">
                  <h4 className="font-extrabold text-base tracking-tight text-zinc-800 dark:text-zinc-150">Reset shopping list?</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    This will permanently delete all {items.length} items on the shared family list. This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    id="cancel-clear-all-btn"
                    onClick={() => setConfirmClearAll(false)}
                    className="flex-1 h-10 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-clear-all-btn"
                    onClick={handleClearAll}
                    className="flex-1 h-10 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
                  >
                    Yes, Reset List
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Confirmation Dialog Modal: CLEAR COMPLETED --- */}
        <AnimatePresence>
          {confirmClearCompleted && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xs w-full p-5 space-y-4 shadow-2xl"
              >
                <div className="space-y-1.5 text-center">
                  <h4 className="font-extrabold text-base tracking-tight text-zinc-800 dark:text-zinc-150">Clear bought items?</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    This will permanently delete your {completedItems.length} purchased items. Keep active items on your list.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    id="cancel-clear-completed-btn"
                    onClick={() => setConfirmClearCompleted(false)}
                    className="flex-1 h-10 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-clear-completed-btn"
                    onClick={handleClearCompleted}
                    className="flex-1 h-10 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
                  >
                    Clear Bought
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
