/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MenuItem, Table, Banner, Order, Review, User, LoyaltyRule, OrderStatus, PaymentStatus, Ingredient, TableStatus } from './types';
import { 
  INITIAL_MENU_ITEMS, 
  INITIAL_TABLES, 
  INITIAL_BANNERS, 
  INITIAL_MEMBERS, 
  INITIAL_ORDERS, 
  INITIAL_REVIEWS,
  HISTORICAL_SALES,
  INITIAL_INGREDIENTS
} from './data';
import CustomerView from './components/CustomerView';
import AdminView from './components/AdminView';
import KitchenView from './components/KitchenView';
import StockKeeperView from './components/StockKeeperView';
import { Smartphone, LayoutDashboard, ChefHat, Info, Sparkles, Coffee } from 'lucide-react';

export default function App() {
  // Simulator state: 'customer' | 'admin' | 'kitchen' | 'stock_keeper'
  const [simulationMode, setSimulationMode] = useState<'customer' | 'admin' | 'kitchen' | 'stock_keeper'>('customer');

  // Unified persistent database simulation in state & local storage
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('caffepos_ingredients');
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('caffepos_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem('caffepos_tables');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem('caffepos_banners');
    return saved ? JSON.parse(saved) : INITIAL_BANNERS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('caffepos_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('caffepos_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [members, setMembers] = useState<User[]>(() => {
    const saved = localStorage.getItem('caffepos_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('caffepos_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loyaltyRule, setLoyaltyRule] = useState<LoyaltyRule>({
    pointsPerTenThousand: 1,
    rewardPointsThreshold: 50,
    rewardDiscountValue: 1000,
  });

  const [selectedTableId, setSelectedTableId] = useState<string>('T01');

  // New Neon DB Connection Status State
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: 'Mengecek koneksi database...'
  });

  // Query Backend on Mount to sync with Neon (if active)
  useEffect(() => {
    fetch('/api/db-status')
      .then(res => res.json())
      .then(status => {
        setDbStatus(status);
        if (status.connected) {
          console.log('[Neon Sync] DB is connected. Loading actual tables...');
          fetch('/api/ingredients').then(res => res.json()).then(setIngredients).catch(console.error);
          fetch('/api/menu-items').then(res => res.json()).then(setMenuItems).catch(console.error);
          fetch('/api/tables').then(res => res.json()).then(setTables).catch(console.error);
          fetch('/api/users').then(res => res.json()).then(setMembers).catch(console.error);
          fetch('/api/orders').then(res => res.json()).then(setOrders).catch(console.error);
          fetch('/api/reviews').then(res => res.json()).then(setReviews).catch(console.error);
          fetch('/api/loyalty-rule').then(res => res.json()).then(setLoyaltyRule).catch(console.error);
        }
      })
      .catch(err => {
        console.warn('Backend is offline or running client-only. Falling back to local storage.');
        setDbStatus({ connected: false, message: 'Offline Demo (Local Storage)' });
      });
  }, []);

  // Sync state helpers to ensure stock_keeper or local changes also push to Neon DB
  const syncIngredientToDb = async (ing: Ingredient) => {
    if (dbStatus.connected) {
      await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ing)
      }).catch(err => console.error('Error syncing ingredient to Neon:', err));
    }
  };

  const handleSetIngredients = (updated: Ingredient[] | ((prev: Ingredient[]) => Ingredient[])) => {
    setIngredients(prev => {
      const next = typeof updated === 'function' ? updated(prev) : updated;
      if (dbStatus.connected) {
        for (const ing of next) {
          syncIngredientToDb(ing);
        }
      }
      return next;
    });
  };

  const handleSetMenuItems = (updated: MenuItem[] | ((prev: MenuItem[]) => MenuItem[])) => {
    setMenuItems(prev => {
      const next = typeof updated === 'function' ? updated(prev) : updated;
      if (dbStatus.connected) {
        for (const item of next) {
          fetch('/api/menu-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          }).catch(console.error);
        }
      }
      return next;
    });
  };

  const handleSetTables = (updated: Table[] | ((prev: Table[]) => Table[])) => {
    setTables(prev => {
      const next = typeof updated === 'function' ? updated(prev) : updated;
      if (dbStatus.connected) {
        for (const t of next) {
          fetch('/api/tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t)
          }).catch(console.error);
        }
      }
      return next;
    });
  };

  const handleSetReviews = (updated: Review[] | ((prev: Review[]) => Review[])) => {
    setReviews(prev => {
      const next = typeof updated === 'function' ? updated(prev) : updated;
      // In production, we can sync individual updates as needed.
      return next;
    });
  };

  const handleSetMembers = (updated: User[] | ((prev: User[]) => User[])) => {
    setMembers(prev => {
      const next = typeof updated === 'function' ? updated(prev) : updated;
      return next;
    });
  };

  // Push updates to localStorage as secondary backup
  useEffect(() => {
    localStorage.setItem('caffepos_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('caffepos_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('caffepos_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('caffepos_banners', JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem('caffepos_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('caffepos_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('caffepos_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('caffepos_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('caffepos_current_user');
    }
  }, [currentUser]);

  // Handle localStorage listener to synchronize simulation screens in real-time cross-tabs
  useEffect(() => {
    const onStorageChange = () => {
      const savedIngredients = localStorage.getItem('caffepos_ingredients');
      if (savedIngredients) {
        setIngredients(JSON.parse(savedIngredients));
      }
      const savedOrders = localStorage.getItem('caffepos_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
      const savedMembers = localStorage.getItem('caffepos_members');
      if (savedMembers) {
        setMembers(JSON.parse(savedMembers));
      }
      const savedReviews = localStorage.getItem('caffepos_reviews');
      if (savedReviews) {
        setReviews(JSON.parse(savedReviews));
      }
    };
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  // Shared status modifiers
  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id === orderId) {
          // If status transitions to occupied/served, change table flags
          if (nextStatus === 'accepted') {
            // Deduct recipe stock dynamically when order gets accepted by cashier
            setIngredients(prevIngs => {
              const copy = prevIngs.map(ing => ({ ...ing }));
              o.items.forEach(orderItem => {
                const menuItem = menuItems.find(m => m.id === orderItem.menuId);
                if (menuItem && menuItem.recipe) {
                  menuItem.recipe.forEach(recipeItem => {
                    const ingToDeduct = copy.find(i => i.id === recipeItem.ingredientId);
                    if (ingToDeduct) {
                      ingToDeduct.stock = Math.max(0, ingToDeduct.stock - (recipeItem.quantity * orderItem.quantity));
                      syncIngredientToDb(ingToDeduct);
                    }
                  });
                }
              });
              return copy;
            });

            setTables(ts => {
              const nextT = ts.map(t => t.id === o.tableId ? { ...t, status: 'occupied' as TableStatus } : t);
              const affected = nextT.find(t => t.id === o.tableId);
              if (dbStatus.connected && affected) {
                fetch('/api/tables', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(affected)
                }).catch(console.error);
              }
              return nextT;
            });
          } else if (nextStatus === 'served') {
            setTables(ts => {
              const nextT = ts.map(t => t.id === o.tableId ? { ...t, status: 'available' as TableStatus } : t);
              const affected = nextT.find(t => t.id === o.tableId);
              if (dbStatus.connected && affected) {
                fetch('/api/tables', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(affected)
                }).catch(console.error);
              }
              return nextT;
            });
          }
          return { ...o, orderStatus: nextStatus };
        }
        return o;
      });
      return updated;
    });

    if (dbStatus.connected) {
      fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: nextStatus })
      }).catch(console.error);
    }
  };

  const handleConfirmCashPayment = (orderId: string) => {
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id === orderId) {
          return { ...o, paymentStatus: 'paid' as PaymentStatus };
        }
        return o;
      });
      return updated;
    });

    if (dbStatus.connected) {
      fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: 'POST'
      }).catch(console.error);
    }
  };

  const handleAddOrder = (newOrder: Order) => {
    setOrders(prev => [...prev, newOrder]);
    if (dbStatus.connected) {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      }).catch(console.error);
    }
  };

  const handleAddReview = (newReview: Review) => {
    setReviews(prev => [...prev, newReview]);
    if (dbStatus.connected) {
      fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      }).catch(console.error);
    }
  };

  const handleUpdateUserPoints = (userId: string, points: number) => {
    let targetMember: User | undefined;
    setMembers(prev => prev.map(m => {
      if (m.id === userId) {
        const u = { ...m, points };
        targetMember = u;
        return u;
      }
      return m;
    }));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, points } : null);
    }

    if (dbStatus.connected && targetMember) {
      fetch('/api/users/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetMember)
      }).catch(console.error);
    }
  };

  const handleRegisterMember = (newUser: User) => {
    setMembers(prev => {
      const exists = prev.some(m => m.phone === newUser.phone);
      if (exists) return prev;
      if (dbStatus.connected) {
        fetch('/api/users/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        }).catch(console.error);
      }
      return [...prev, newUser];
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#F0F4F8] text-slate-800 flex flex-col p-4 md:p-6 select-none">
      
      {/* Simulation controller top bar */}
      <div className="w-full max-w-7xl mx-auto bg-white rounded-3xl p-4 md:p-5 shadow-md border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#EFF6FF] text-[#2563EB] rounded-2xl">
            <Coffee className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">CaffePOS Platform</h1>
              {dbStatus.connected ? (
                <span className="inline-flex items-center gap-1.5 px-2.1 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative" />
                  <span>Neon DB Connected</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.1 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100" title={dbStatus.message}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-50 rounded-full bg-amber-500" />
                  <span>Demo Mode</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Simulasi interaksi Kasir, Pelanggan, & Dapur secara real-time</p>
          </div>
        </div>

        {/* Mode Toggle Pills */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1.5 border border-slate-200">
          {[
            { id: 'customer', label: '📱 Pelanggan (Meja)', icon: Smartphone, color: 'hover:text-[#2563EB]' },
            { id: 'admin', label: '💻 Kasir/Admin Dashboard', icon: LayoutDashboard, color: 'hover:text-indigo-600' },
            { id: 'kitchen', label: '🍳 Kitchen Display (Dapur)', icon: ChefHat, color: 'hover:text-amber-600' },
            { id: 'stock_keeper', label: '📦 Stock Keeper Office', icon: LayoutDashboard, color: 'hover:text-emerald-600' }
          ].map(mode => {
            const Icon = mode.icon;
            const isSelected = simulationMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSimulationMode(mode.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : `text-slate-500 hover:bg-white/50 ${mode.color}`
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Mode Viewport */}
      <div className="w-full flex-1 max-w-7xl mx-auto flex flex-col items-center">
        
        {simulationMode === 'customer' && (
          <div className="w-full flex flex-col items-center py-6">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl max-w-lg text-xs leading-relaxed text-[#2563EB] flex gap-2 shadow-sm">
              <Info className="w-5 h-5 shrink-0 text-[#2563EB]" />
              <div>
                <strong>Simulasi Self-Ordering:</strong> Tampilan di bawah meniru layar HP smartphone pembeli setelah scan QR sticker meja. Tambahkan item ke keranjang dan bayar menggunakan simulator tunai/Midtrans. Pesanan langsung tersinkron dan memicu beeper suara di Mode Kasir/Dapur!
              </div>
            </div>

            <CustomerView 
              menuItems={menuItems}
              tables={tables}
              banners={banners}
              orders={orders}
              currentUser={currentUser}
              onSetCurrentUser={setCurrentUser}
              onAddOrder={handleAddOrder}
              loyaltyRule={loyaltyRule}
              onAddReview={handleAddReview}
              onUpdateUserPoints={handleUpdateUserPoints}
              onRegisterMember={handleRegisterMember}
              selectedTableId={selectedTableId}
              onSelectTable={setSelectedTableId}
              ingredients={ingredients}
            />
          </div>
        )}

        {simulationMode === 'admin' && (
          <div className="w-full py-4">
            <AdminView 
              menuItems={menuItems}
              onSetMenuItems={handleSetMenuItems}
              tables={tables}
              onSetTables={handleSetTables}
              banners={banners}
              onSetBanners={setBanners}
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onConfirmCashPayment={handleConfirmCashPayment}
              reviews={reviews}
              onSetReviews={handleSetReviews}
              members={members}
              onSetMembers={handleSetMembers}
              loyaltyRule={loyaltyRule}
              onSetLoyaltyRule={setLoyaltyRule}
              historicalSales={HISTORICAL_SALES}
              ingredients={ingredients}
            />
          </div>
        )}

        {simulationMode === 'kitchen' && (
          <div className="w-full py-4">
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs leading-relaxed text-amber-800 flex gap-2 shadow-sm">
              <Info className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <strong>Kitchen Display:</strong> Staf koki memantau daftar masakan yang baru dipesan oleh pelanggan. Klik 'Mulai Masak' atau coret item yang selesai untuk melakukan penyiapan bahan hidangan.
              </div>
            </div>

            <KitchenView 
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          </div>
        )}

        {simulationMode === 'stock_keeper' && (
          <div className="w-full py-4">
            <StockKeeperView 
              ingredients={ingredients}
              onSetIngredients={handleSetIngredients}
              menuItems={menuItems}
              orders={orders}
            />
          </div>
        )}

      </div>
      
      {/* Footer Branding info */}
      <footer className="mt-12 text-center text-[11px] font-mono text-slate-400 pb-4">
        <span>Confidential Product Spec | CaffePOS Terminal Suite 2026. Made as requested by CaffePOS PRD & UI Styleguide.</span>
      </footer>

    </div>
  );
}
