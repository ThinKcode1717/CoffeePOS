/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ingredient, MenuItem, Order } from '../types';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Clock, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Info,
  Layers,
  Archive,
  RefreshCcw,
  X
} from 'lucide-react';

interface RestockLog {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  totalCost: number;
  createdAt: string;
}

interface StockKeeperViewProps {
  ingredients: Ingredient[];
  onSetIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  menuItems: MenuItem[];
  orders: Order[];
}

export default function StockKeeperView({
  ingredients,
  onSetIngredients,
  menuItems,
  orders
}: StockKeeperViewProps) {
  // Tabs: 'inventory' | 'analysis' | 'finance'
  const [activeTab, setActiveTab] = useState<'inventory' | 'analysis' | 'finance'>('inventory');

  // Local Restock Logs state with simulated historical default records
  const [restockLogs, setRestockLogs] = useState<RestockLog[]>(() => {
    const saved = localStorage.getItem('caffepos_restock_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'rl1',
        ingredientId: 'ing_kopi',
        ingredientName: 'Biji Kopi Arabika',
        quantity: 2000,
        unit: 'gram',
        totalCost: 500000,
        createdAt: '2026-06-05T09:00:00Z',
      },
      {
        id: 'rl2',
        ingredientId: 'ing_susu',
        ingredientName: 'Susu Full Cream Liquid',
        quantity: 10000,
        unit: 'ml',
        totalCost: 200000,
        createdAt: '2026-06-07T14:30:00Z',
      },
      {
        id: 'rl3',
        ingredientId: 'ing_bun',
        ingredientName: 'Brioche Burger Bun',
        quantity: 20,
        unit: 'pcs',
        totalCost: 60000,
        createdAt: '2026-06-09T10:15:00Z',
      }
    ];
  });

  // Save restock logs
  const saveRestockLogs = (updated: RestockLog[]) => {
    setRestockLogs(updated);
    localStorage.setItem('caffepos_restock_logs', JSON.stringify(updated));
  };

  // CRUD state for Ingredients
  const [showFormModal, setShowFormModal] = useState(false);
  const [ingredientEditId, setIngredientEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formStock, setFormStock] = useState<number>(1000);
  const [formUnit, setFormUnit] = useState('gram');
  const [formMinStock, setFormMinStock] = useState<number>(300);
  const [formCost, setFormCost] = useState<number>(100);

  // Quick purchase/restock state
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockIngredientId, setRestockIngredientId] = useState('');
  const [restockQty, setRestockQty] = useState<number>(10);

  // Filter lists & counts
  const criticalItems = ingredients.filter(i => i.stock <= i.minStock);
  const criticalCount = criticalItems.length;

  // Calculators
  const totalAssetValue = ingredients.reduce((sum, ing) => sum + (ing.stock * ing.costPerUnit), 0);

  // Calculate COGS/HPP of paid orders
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  const totalSalesRevenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const totalCOGS = paidOrders.reduce((sumCOGS, order) => {
    let orderHPP = 0;
    order.items.forEach(orderItem => {
      const originalMenu = menuItems.find(m => m.id === orderItem.menuId);
      if (originalMenu && originalMenu.recipe) {
        originalMenu.recipe.forEach(recipeItem => {
          const ing = ingredients.find(i => i.id === recipeItem.ingredientId);
          if (ing) {
            orderHPP += (recipeItem.quantity * ing.costPerUnit) * orderItem.quantity;
          }
        });
      }
    });
    return sumCOGS + orderHPP;
  }, 0);

  const totalRestockExpenses = restockLogs.reduce((sum, log) => sum + log.totalCost, 0);
  const estimatedGrossProfit = Math.max(0, totalSalesRevenue - totalCOGS);
  const cashFlowBalance = totalSalesRevenue - totalRestockExpenses;

  // Save/Edit Ingredient handlers
  const handleOpenAdd = () => {
    setIngredientEditId(null);
    setFormName('');
    setFormStock(1000);
    setFormUnit('gram');
    setFormMinStock(300);
    setFormCost(100);
    setShowFormModal(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setIngredientEditId(ing.id);
    setFormName(ing.name);
    setFormStock(ing.stock);
    setFormUnit(ing.unit);
    setFormMinStock(ing.minStock);
    setFormCost(ing.costPerUnit);
    setShowFormModal(true);
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (ingredientEditId) {
      onSetIngredients(prev => prev.map(i => i.id === ingredientEditId ? {
        ...i,
        name: formName,
        stock: formStock,
        unit: formUnit,
        minStock: formMinStock,
        costPerUnit: formCost
      } : i));
    } else {
      const newIng: Ingredient = {
        id: 'ing_' + Date.now(),
        name: formName,
        stock: formStock,
        unit: formUnit,
        minStock: formMinStock,
        costPerUnit: formCost
      };
      onSetIngredients(prev => [...prev, newIng]);
    }
    setShowFormModal(false);
  };

  const handleDeleteIngredient = (id: string) => {
    // Check if ingredient is referenced by recipes
    const references = menuItems.filter(m => m.recipe?.some(r => r.ingredientId === id));
    if (references.length > 0) {
      alert(`Bahan ini tidak bisa dihapus karena masih digunakan di recipe menu berikut: ${references.map(m => m.name).join(', ')}. Silakan hapus recipe terlebih dahulu.`);
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus bahan baku ini?')) {
      onSetIngredients(prev => prev.filter(i => i.id !== id));
    }
  };

  // Perform quick purchase restocking
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ing = ingredients.find(i => i.id === restockIngredientId);
    if (!ing) return;

    const totalCost = ing.costPerUnit * restockQty;

    // Up ingredient stock
    onSetIngredients(prev => prev.map(i => i.id === restockIngredientId ? {
      ...i,
      stock: i.stock + restockQty
    } : i));

    // Register log
    const newLog: RestockLog = {
      id: 'rl_' + Date.now(),
      ingredientId: restockIngredientId,
      ingredientName: ing.name,
      quantity: restockQty,
      unit: ing.unit,
      totalCost,
      createdAt: new Date().toISOString()
    };
    saveRestockLogs([newLog, ...restockLogs]);

    setShowRestockModal(false);
    alert(`Transaksi restock tercatat! Menambahkan ${restockQty} ${ing.unit} ke ${ing.name} senilai Rp ${totalCost.toLocaleString('id-ID')}`);
  };

  return (
    <div className="w-full min-h-[750px] bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl flex flex-col md:flex-row text-slate-700 dark:text-slate-200">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-650 text-white rounded-2xl shadow-lg shadow-indigo-650/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">Stock Keeper</h1>
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mt-1 block">Inventory Office</span>
            </div>
          </div>

          <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 font-sans">
            {[
              { id: 'inventory', label: 'Daftar Bahan Baku', icon: Archive, desc: 'Kelola data master bahan' },
              { id: 'analysis', label: 'Analisis Stok Kritis', icon: AlertTriangle, desc: 'Lihat menu terdampak stok' },
              { id: 'finance', label: 'Keuangan & Restock', icon: DollarSign, desc: 'Ledger pengeluaran belanja' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-4 py-3 rounded-2xl transition-all flex items-center gap-3 active:scale-98 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-bold' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="text-left hidden md:block">
                    <p className="text-xs leading-tight">{tab.label}</p>
                    <p className={`text-[9px] mt-0.5 font-normal ${isActive ? 'text-white/70' : 'text-slate-450'}`}>{tab.desc}</p>
                  </div>
                  <span className="md:hidden text-xs font-semibold">{tab.label.split(' ')[1]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dashboard Quick Summary */}
        <div className="hidden md:block pt-6 border-t border-slate-150 dark:border-slate-800 space-y-3 font-mono text-[11px] text-slate-450 text-xs">
          <div className="flex justify-between">
            <span>Level Kesehatan:</span>
            <span className={`font-bold ${criticalCount === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {criticalCount === 0 ? 'Sempurna' : `${criticalCount} Krisis`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Aset Stok:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">Rp {totalAssetValue.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </aside>

      {/* Main Console Content */}
      <main className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[850px] bg-slate-50 dark:bg-slate-950">
        <div>
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-200 dark:border-slate-800 mb-6 gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 uppercase tracking-widest block font-bold leading-none">Petugas Gudang / Stock Keeper</span>
              <h2 className="text-xl font-extrabold font-sans text-slate-900 dark:text-white mt-1">
                {activeTab === 'inventory' && 'Master Bahan Baku Makanan'}
                {activeTab === 'analysis' && 'Analisis Kesehatan Stok Kafe'}
                {activeTab === 'finance' && 'Buku Ledger Keuangan Bahan'}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRestockQty(10);
                  setRestockIngredientId(ingredients[0]?.id || '');
                  setShowRestockModal(true);
                }}
                className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-indigo-600/10"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Restock / Tambah Stok</span>
              </button>

              {activeTab === 'inventory' && (
                <button
                  onClick={handleOpenAdd}
                  className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-600/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Bahan Baru</span>
                </button>
              )}
            </div>
          </header>

          {/* Sub Tab ViewRouter */}

          {/* Tab 1: Inventory Master List CRUD */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              
              {/* Alert Warning for critical stocks */}
              {criticalCount > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-3xl flex items-start gap-3.5 shadow-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <h5 className="font-extrabold text-xs">Peringatan: {criticalCount} Bahan Mengalami Batas Kritis!</h5>
                    <p className="text-[11px] mt-1 line-clamp-1">Beberapa bahan baku berada di bawah tingkat kecukupan minimum. Ini dapat membatasi ketersediaan menu di halaman pembeli!</p>
                  </div>
                </div>
              )}

              {/* Grid or Table list */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-mono text-[10px] uppercase bg-slate-50/50 dark:bg-slate-900">
                        <th className="py-3 px-5">ID Bahan</th>
                        <th className="py-3">Nama Bahan</th>
                        <th className="py-3">Stok Saat Ini</th>
                        <th className="py-3">Nilai Minimum Keamanan</th>
                        <th className="py-3">Harga Satuan Beli (HPP)</th>
                        <th className="py-3 text-right pr-5">Aksi Navigasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                      {ingredients.map(ing => {
                        const isCritical = ing.stock <= ing.minStock;
                        return (
                          <tr key={ing.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                            <td className="py-4 px-5 font-mono text-[10px] text-slate-400 dark:text-slate-400 font-bold">
                              {ing.id}
                            </td>
                            <td>
                              <strong className="text-slate-900 dark:text-white font-sans text-xs flex items-center gap-1.5">
                                {ing.name}
                                {isCritical && (
                                  <span className="px-1.5 py-0.5 text-[9px] bg-rose-100 text-rose-800 font-extrabold uppercase rounded font-mono">KRITIS</span>
                                )}
                              </strong>
                            </td>
                            <td>
                              <span className={`font-mono text-xs font-bold ${isCritical ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>
                                {ing.stock.toLocaleString('id-ID')} {ing.unit}
                              </span>
                            </td>
                            <td>
                              <span className="font-mono text-slate-450 dark:text-slate-400">
                                {ing.minStock.toLocaleString('id-ID')} {ing.unit}
                              </span>
                            </td>
                            <td className="font-mono text-slate-800 dark:text-slate-100 font-semibold">
                              Rp {ing.costPerUnit.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400">/ {ing.unit}</span>
                            </td>
                            <td className="text-right pr-5 space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenEdit(ing)}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-[10px] uppercase inline-flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteIngredient(ing.id)}
                                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-650 dark:bg-rose-950/20 dark:hover:bg-rose-950/50 dark:text-rose-450 font-bold rounded-xl text-[10px] uppercase inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {ingredients.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400">
                            Belum ada master bahan makanan yang dicatat.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Stock Analysis, Low stock effects */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Visual Circle Meter */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs uppercase text-slate-400 font-mono tracking-wider">Indikator Kuantitas Kesehatan Bahan</h4>
                    <span className="text-[10px] text-slate-400 block mt-1">Nilai stock saat ini terhadap rasio keamanan aman</span>
                  </div>

                  <div className="py-6 flex flex-col items-center">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      {/* Circle progress mockup pure tailwind style */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="72" cy="72" r="62" stroke="#E2E8F0" strokeWidth="12" fill="transparent" className="text-slate-200 dark:stroke-slate-800" />
                        <circle cx="72" cy="72" r="62" stroke="#4F46E5" strokeWidth="12" fill="transparent" strokeDasharray="390" strokeDashoffset={Math.max(0, 390 - (390 * ((ingredients.length - criticalCount) / (ingredients.length || 1))))} className="transition-all duration-1000" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black font-mono leading-none">
                          {Math.round(((ingredients.length - criticalCount) / (ingredients.length || 1)) * 100)}%
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 mt-1">Aman Bersih</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-4 text-xs font-mono">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Aman ({ingredients.length - criticalCount})</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Krisis ({criticalCount})</span>
                    </div>
                  </div>
                </div>

                {/* Stock predictive low status alerts and immediate action plan */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs uppercase text-slate-400 font-mono tracking-wider">Saran Tindakan Restok Gudang</h4>
                    <span className="text-[10px] text-slate-400 block mt-1">Saran restok otomatis demi membuka ketersediaan menu</span>
                  </div>

                  <div className="space-y-3.5 mt-4 overflow-y-auto max-h-[220px] scrollbar-none pr-1">
                    {criticalItems.map(ing => {
                      // Find which menu items depend on this ingredient
                      const connectedMenu = menuItems.filter(m => m.recipe?.some(r => r.ingredientId === ing.id));
                      return (
                        <div key={ing.id} className="p-3 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-2xl flex flex-col gap-2 transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-xs text-rose-500 block font-bold leading-none">{ing.name}</strong>
                              <span className="text-[10px] text-slate-400 block mt-1 font-mono">Stok: {ing.stock} {ing.unit} | Batas Min: {ing.minStock} {ing.unit}</span>
                            </div>
                            <span className="text-[9px] uppercase font-bold font-mono text-rose-500 bg-rose-100 dark:bg-rose-950/40 px-2 py-0.5 rounded">Terdampak</span>
                          </div>
                          
                          {connectedMenu.length > 0 && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                              Mengakibatkan Menu Mati/Stok Habis: <strong className="text-indigo-650 dark:text-indigo-400">{connectedMenu.map(m => m.name).join(', ')}</strong>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {criticalCount === 0 && (
                      <div className="text-center py-12 flex flex-col items-center justify-center">
                        <Check className="w-10 h-10 text-emerald-500 bg-emerald-500/10 p-2 rounded-full animate-bounce mb-2" />
                        <p className="text-xs font-semibold text-emerald-600">Semua bahan baku tercukupi, aman terkendali!</p>
                        <p className="text-[10px] text-slate-400 mt-1">Dapur dapat mengolah seluruh menu pesanan pelanggan secara penuh.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comprehensive Grid of Menu Status & Recipes Connection */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h4 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white font-sans tracking-wide mb-4">Relasi Dan Status Menu Berdasarkan Stok Bahan Baku</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {menuItems.map(item => {
                    // Check if missing any ingredient
                    const isMissing = item.recipe && item.recipe.some(rec => {
                      const ing = ingredients.find(i => i.id === rec.ingredientId);
                      return ing ? ing.stock < rec.quantity : true;
                    });
                    
                    return (
                      <div key={item.id} className={`p-4 border rounded-3xl flex flex-col justify-between ${
                        isMissing 
                          ? 'border-rose-200 bg-rose-50/5' 
                          : 'border-slate-150 bg-slate-50/10 dark:bg-slate-950/20'
                      }`}>
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{item.category}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full font-mono ${
                              isMissing ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-805'
                            }`}>
                              {isMissing ? 'CLOSED/STOK HABIS' : 'READY/AKTIF'}
                            </span>
                          </div>

                          <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 leading-snug">{item.name}</h5>
                          
                          {/* Recipe display */}
                          <div className="mt-3 space-y-1">
                            <span className="text-[10px] font-mono text-slate-400 block uppercase">Formula Resep:</span>
                            {item.recipe?.map(rec => {
                              const ing = ingredients.find(i => i.id === rec.ingredientId);
                              const ok = ing ? ing.stock >= rec.quantity : false;
                              return (
                                <div key={rec.ingredientId} className="flex justify-between text-[11px] font-mono pr-1">
                                  <span className="text-slate-550 leading-tight block line-clamp-1">{ing?.name || 'Bahan Tehapus'}</span>
                                  <span className={`font-bold ${ok ? 'text-indigo-600' : 'text-rose-500 animate-pulse'}`}>
                                    {rec.quantity} / {ing ? ing.stock : 0} {ing?.unit}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800 flex justify-between items-center">
                          <span className="font-bold text-xs font-mono text-slate-905 dark:text-slate-105">Rp {item.price.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Financial Management Ledger & Logs */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              
              {/* Financial Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Nilai Total Aset Stok', val: `Rp ${totalAssetValue.toLocaleString('id-ID')}`, desc: 'Total nilai bahan di pantry', icon: Layers, trendColor: 'text-indigo-500 bg-indigo-500/10' },
                  { title: 'Omset Penjualan Jual', val: `Rp ${totalSalesRevenue.toLocaleString('id-ID')}`, desc: 'Pesanan lunas terbayar', icon: ArrowUpRight, trendColor: 'text-emerald-500 bg-emerald-500/10' },
                  { title: 'Est. Biaya Bahan Baku (HPP)', val: `Rp ${totalCOGS.toLocaleString('id-ID')}`, desc: 'Total modal bahan dari menu terjual', icon: ArrowDownRight, trendColor: 'text-amber-500 bg-amber-500/10' },
                  { title: 'Belanja Restok (Pengeluaran)', val: `Rp ${totalRestockExpenses.toLocaleString('id-ID')}`, desc: 'Total log restok dibelanjakan', icon: TrendingDown, trendColor: 'text-rose-500 bg-rose-500/10' },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wide">{stat.title}</span>
                        <div className={`p-2 rounded-lg ${stat.trendColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-1.5">{stat.val}</h3>
                      <p className="text-[10px] text-slate-450 mt-1">{stat.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Complex Profit Breakdown Analysis Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Profit visual ledger */}
                <div className="lg:col-span-1 p-5 bg-gradient-to-br from-indigo-700 to-violet-850 text-white rounded-3xl shadow-lg shadow-indigo-700/20 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] opacity-70 font-mono block uppercase tracking-widest">Buku Laba Rugi Kafe</span>
                    <h4 className="text-lg font-bold mt-1">Estimasi Margin Keuntungan</h4>
                  </div>

                  <div className="py-6 border-t border-b border-white/10 my-4 space-y-4 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-80">Total Omset Penjualan:</span>
                      <span className="font-bold">Rp {totalSalesRevenue.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-amber-300">
                      <span className="opacity-80">Harga Pokok (HPP):</span>
                      <span className="font-bold">-Rp {totalCOGS.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between text-emerald-300 text-base font-bold">
                      <span>Laba Kotor Perkiraan:</span>
                      <span>Rp {estimatedGrossProfit.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span className="opacity-80">Arus Kas (Nett):</span>
                      <span className={`font-bold ${cashFlowBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        Rp {cashFlowBalance.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/10 text-[11px] rounded-2xl flex items-start gap-1.5 leading-relaxed text-white/90">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-white/80" />
                    <p>Margin keuntungan kotor berkisar di angka {totalSalesRevenue > 0 ? Math.round((estimatedGrossProfit / totalSalesRevenue) * 100) : 0}% berdasarkan formula pemetaan resep bahan makanan.</p>
                  </div>
                </div>

                {/* Restoking list operations logs ledger */}
                <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                  <h4 className="font-extrabold text-xs uppercase text-slate-400 font-mono tracking-wider mb-4">Riwayat Pengeluaran Belanja Stok (CapEx)</h4>
                  
                  <div className="overflow-y-auto max-h-[290px] scrollbar-none pr-1">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-400 font-mono text-[10px] uppercase">
                          <th className="py-2.5">Waktu Belanja</th>
                          <th>Bahan</th>
                          <th>Kuantitas Masuk</th>
                          <th>Total Pengeluaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {restockLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-805">
                            <td className="py-2.5 font-mono text-slate-400">
                              {new Date(log.createdAt).toLocaleString('id-ID')}
                            </td>
                            <td className="font-bold text-slate-900 dark:text-white">
                              {log.ingredientName}
                            </td>
                            <td className="font-mono">
                              +{log.quantity.toLocaleString('id-ID')} {log.unit}
                            </td>
                            <td className="font-mono text-rose-500 font-bold">
                              -Rp {log.totalCost.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                        {restockLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-10 text-slate-400">
                              Belum ada pengeluaran restok tercatat.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* CRUD Ingredient Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 modal-appear font-sans text-slate-700 dark:text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-[#0F172A] dark:text-white text-sm">
                {ingredientEditId ? 'Edit Komponen Bahan Baku' : 'Tambahkan Komponen Gudang'}
              </h4>
              <button onClick={() => setShowFormModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Nama Bahan Baku</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Susu Full Cream Liquid" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Stok Saat Ini</label>
                  <input 
                    type="number" 
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Batas Kritis Minimum</label>
                  <input 
                    type="number" 
                    required
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Satuan Ukur</label>
                  <select 
                    value={formUnit} 
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl focus:outline-none"
                  >
                    <option value="gram">gram (g)</option>
                    <option value="ml">mililiter (ml)</option>
                    <option value="pcs">pieces (pcs)</option>
                    <option value="kg">kilogram (kg)</option>
                    <option value="liter">liter (l)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Harga Beli Satuan (Rp)</label>
                  <input 
                    type="number" 
                    required
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-md shadow-indigo-650/10 uppercase tracking-wide"
              >
                Simpan & Update Gudang
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Restock Transaction Records Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 modal-appear font-sans text-slate-700 dark:text-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-[#0F172A] dark:text-white text-sm">Pencatatan Belanja Restok Bahan</h4>
              <button onClick={() => setShowRestockModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-805 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Pilih Komponen Bahan Baku</label>
                <select 
                  value={restockIngredientId}
                  onChange={(e) => setRestockIngredientId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl focus:outline-none"
                >
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (HPP: Rp {ing.costPerUnit.toLocaleString('id-ID')}/{ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Kuantitas Restok Baru</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="flex-1 text-xs p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl focus:outline-none"
                  />
                  <span className="font-mono text-slate-450 uppercase font-bold text-xs">
                    {ingredients.find(i => i.id === restockIngredientId)?.unit || 'satuan'}
                  </span>
                </div>
              </div>

              {/* Estimate Cost indicator */}
              {(() => {
                const ing = ingredients.find(i => i.id === restockIngredientId);
                if (!ing) return null;
                const estCost = ing.costPerUnit * restockQty;
                return (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <span className="text-[9px] uppercase tracking-wider block font-mono">Estimasi Total Pengeluaran:</span>
                    <strong className="text-sm font-mono mt-0.5 block">Rp {estCost.toLocaleString('id-ID')}</strong>
                  </div>
                );
              })()}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-md shadow-indigo-600/10 uppercase tracking-wide"
              >
                Konfirmasi Belanja & Tambah Stok
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
