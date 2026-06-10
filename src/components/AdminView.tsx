/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MenuItem, Table, Banner, Order, Review, User, LoyaltyRule, OrderStatus, PaymentStatus, Ingredient } from '../types';
import { 
  ShoppingCart, 
  Receipt, 
  Menu as MenuIcon, 
  Grid, 
  Users, 
  Star, 
  FileSpreadsheet, 
  Megaphone, 
  Moon, 
  Sun, 
  TrendingUp, 
  Clock, 
  Check, 
  X, 
  Plus, 
  Printer, 
  QrCode, 
  AlertCircle,
  FileDown,
  Info,
  DollarSign,
  Briefcase,
  AlertTriangle
} from 'lucide-react';

interface AdminViewProps {
  menuItems: MenuItem[];
  onSetMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  tables: Table[];
  onSetTables: React.Dispatch<React.SetStateAction<Table[]>>;
  banners: Banner[];
  onSetBanners: React.Dispatch<React.SetStateAction<Banner[]>>;
  orders: Order[];
  onUpdateOrderStatus: (id: string, state: OrderStatus) => void;
  onConfirmCashPayment: (id: string) => void;
  reviews: Review[];
  onSetReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  members: User[];
  onSetMembers: React.Dispatch<React.SetStateAction<User[]>>;
  loyaltyRule: LoyaltyRule;
  onSetLoyaltyRule: (rule: LoyaltyRule) => void;
  historicalSales: any[];
  ingredients?: Ingredient[];
}

export default function AdminView({
  menuItems,
  onSetMenuItems,
  tables,
  onSetTables,
  banners,
  onSetBanners,
  orders,
  onUpdateOrderStatus,
  onConfirmCashPayment,
  reviews,
  onSetReviews,
  members,
  onSetMembers,
  loyaltyRule,
  onSetLoyaltyRule,
  historicalSales,
  ingredients = []
}: AdminViewProps) {
  // Navigation Sidebar states specifically aligned with Cashier Role (Dashboard, Transaksi, Menu, Meja, Member, Ulasan, Kupon, Laporan)
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'transaksi' | 'menu' | 'meja' | 'loyalty' | 'reviews' | 'laporan' | 'promo'>('dashboard');
  
  // Theme state for Admin Dashboard
  const [darkTheme, setDarkTheme] = useState<boolean>(() => {
    return localStorage.getItem('caffepos_admin_dark') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('caffepos_admin_dark', JSON.stringify(darkTheme));
  }, [darkTheme]);

  // Alert State for sound alert Chimes
  const [showLiveOrderAlert, setShowLiveOrderAlert] = useState(false);
  const [latestAlertText, setLatestAlertText] = useState('');

  // Drag and Drop active status & validation modal states
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);

  // Local state listeners for Pusher-like alerts
  useEffect(() => {
    const handleAlert = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setLatestAlertText(customEvent.detail.info || 'Pesanan baru masuk!');
        setShowLiveOrderAlert(true);
        // Play ring chime
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.2);
        } catch(err) {
          console.log(err);
        }
      }
    };
    window.addEventListener('caffepos_order_alert', handleAlert);
    return () => window.removeEventListener('caffepos_order_alert', handleAlert);
  }, []);

  // Invoice Printing modal state
  const [invoiceToPrint, setInvoiceToPrint] = useState<Order | null>(null);

  // Table QR modal preview state
  const [qrTableToView, setQrTableToView] = useState<Table | null>(null);

  // Menu edit & creation states
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [menuNameInput, setMenuNameInput] = useState('');
  const [menuCategoryInput, setMenuCategoryInput] = useState<'food' | 'beverage' | 'snack'>('food');
  const [menuPriceInput, setMenuPriceInput] = useState(30000);
  const [menuImageInput, setMenuImageInput] = useState('');
  const [menuEditId, setMenuEditId] = useState<string | null>(null);

  // Table edit state
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [tableAreaInput, setTableAreaInput] = useState<'Indoor' | 'Outdoor'>('Indoor');

  // Broadcast campaign state
  const [promoCampaignText, setPromoCampaignText] = useState('');

  // Laporan Date Range States
  const [filterDateRange, setFilterDateRange] = useState<'hari_ini' | '7_hari' | '30_hari'>('7_hari');

  // Metrics calculating
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  // Menu management handlers
  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuNameInput) return;

    const img = menuImageInput || "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400";
    
    if (menuEditId) {
      // Edit
      onSetMenuItems(prev => prev.map(m => m.id === menuEditId ? {
        ...m,
        name: menuNameInput,
        category: menuCategoryInput,
        price: menuPriceInput,
        imageUrl: img
      } : m));
    } else {
      // Create
      const newMenu: MenuItem = {
        id: 'm_' + Date.now(),
        name: menuNameInput,
        category: menuCategoryInput,
        price: menuPriceInput,
        imageUrl: img,
        isAvailable: true,
        recipe: [] // empty default recipe
      };
      onSetMenuItems(prev => [...prev, newMenu]);
    }

    // Reset Form
    setMenuNameInput('');
    setMenuImageInput('');
    setMenuEditId(null);
    setShowAddMenuModal(false);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setMenuEditId(item.id);
    setMenuNameInput(item.name);
    setMenuCategoryInput(item.category);
    setMenuPriceInput(item.price);
    setMenuImageInput(item.imageUrl);
    setShowAddMenuModal(true);
  };

  const handleDeleteMenuItem = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus menu ini?')) {
      onSetMenuItems(prev => prev.filter(m => m.id !== id));
    }
  };

  const toggleMenuAvailability = (id: string, current: boolean) => {
    onSetMenuItems(prev => prev.map(m => m.id === id ? { ...m, isAvailable: !current } : m));
  };

  // Table Management
  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumberInput) return;

    const exists = tables.some(t => t.tableNumber.toUpperCase() === tableNumberInput.toUpperCase());
    if (exists) {
      alert('Meja dengan nomor tersebut sudah terdaftar!');
      return;
    }

    const newT: Table = {
      id: tableNumberInput.toUpperCase(),
      tableNumber: tableNumberInput.toUpperCase(),
      area: tableAreaInput,
      status: 'available'
    };

    onSetTables(prev => [...prev, newT]);
    setTableNumberInput('');
    setShowAddTableModal(false);
  };

  // Broadcast campaign alert
  const handleBroadcastPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCampaignText.trim()) return;

    const event = new CustomEvent('caffepos_promo_broadcast', { detail: { message: promoCampaignText } });
    window.dispatchEvent(event);
    alert(`Promo Campaign Broadcasted: "${promoCampaignText}". Seluruh pelanggan yang tersambung akan menerima banner penawaran.`);
    setPromoCampaignText('');
  };

  // Moderation Hide review
  const toggleHideReview = (id: string) => {
    onSetReviews(prev => prev.map(r => r.id === id ? { ...r, isHidden: !r.isHidden } : r));
  };

  // Export functions simulation
  const exportToExcelCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID Transaksi,Meja,Pelanggan,Total Pembelian,Poin Diperoleh,Cara Bayar,Status Bayar,Tanggal"].join(",") + "\n"
      + orders.map(o => `${o.orderNumber},${o.tableId},${o.userName},${o.totalPrice},${o.pointsEarned},${o.paymentMethod},${o.paymentStatus},${o.createdAt}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_penjualan_caffepos_${filterDateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Drop event on Kanban Columns
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrderId(order.id);
  };

  const handleDragDrop = (e: React.DragEvent, colStatus: 'new' | 'accepted' | 'done') => {
    e.preventDefault();
    if (!draggedOrderId) return;
    
    const foundOrder = orders.find(o => o.id === draggedOrderId);
    if (!foundOrder) return;

    // Check if the order is already in this column or is served
    if (foundOrder.orderStatus === colStatus) {
      setDraggedOrderId(null);
      return;
    }

    // Set state to trigger confirmation modal validation
    setDraggedOrder(foundOrder);
    setTargetStatus(colStatus);
    setDraggedOrderId(null);
  };

  const confirmDragAction = () => {
    if (draggedOrder && targetStatus) {
      onUpdateOrderStatus(draggedOrder.id, targetStatus);
      setDraggedOrder(null);
      setTargetStatus(null);
    }
  };

  // Theme support styles variables
  const isDark = darkTheme;

  return (
    <div className={`w-full min-h-[850px] transition-colors duration-200 rounded-[24px] overflow-hidden shadow-2xl flex font-sans ${
      isDark ? 'bg-[#0F172A] text-slate-100' : 'bg-slate-50 text-slate-700'
    }`}>
      
      {/* Pusher-Like Sticky Real-time Alert */}
      {showLiveOrderAlert && (
        <div className="fixed top-8 right-8 z-50 bg-[#F59E0B] text-slate-950 p-4 rounded-2xl shadow-2xl flex items-start gap-3 w-80 animate-slide-down border border-amber-300">
          <AlertCircle className="w-6 h-6 shrink-0 text-slate-900 animate-bounce" />
          <div className="flex-1">
            <h5 className="font-extrabold text-sm leading-none text-slate-950">Sound Alert & Notifikasi!</h5>
            <p className="text-xs text-slate-800 mt-1">{latestAlertText}</p>
            <div className="mt-3 flex gap-2">
              <button 
                onClick={() => {
                  setShowLiveOrderAlert(false);
                  setActiveMenu('dashboard');
                }}
                className="bg-slate-950 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase"
              >
                Lihat Antrian
              </button>
              <button 
                onClick={() => setShowLiveOrderAlert(false)}
                className="border border-slate-950 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase hover:bg-amber-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar navigation specifically parsed for Cashier (No general settings or stock) */}
      <aside className={`w-64 px-4 py-6 border-r flex flex-col justify-between shrink-0 transition-colors ${
        isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="p-2.5 bg-[#2563EB] text-white rounded-xl shadow-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-[#0F172A] dark:text-white leading-none">CaffePOS Kasir</h1>
              <span className="text-[10px] font-mono text-slate-400 leading-none">CASHIER CONSOLE v1.2</span>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Monitor Antrian D&D 🔔', icon: ShoppingCart, desc: 'Posisikan alur pelanggan' },
              { id: 'transaksi', label: 'Transaksi & Struk 🧾', icon: Receipt, desc: 'Selesaikan kasir cash' },
              { id: 'menu', label: 'Daftar Menu Hidangan 🍲', icon: MenuIcon, desc: 'Pantau resep & stok' },
              { id: 'meja', label: 'Stiker QR Meja Cafe 📍', icon: Grid, desc: 'Cetak penanda scan' },
              { id: 'loyalty', label: 'Keanggotaan & Loyalty 👥', icon: Users, desc: 'Log member & whatsapp' },
              { id: 'reviews', label: 'Ulasan Moderasi ⭐', icon: Star, desc: 'Arsipkan bintang jelek' },
              { id: 'promo', label: 'Kupon & Banner Promo 📣', icon: Megaphone, desc: 'Broadcast campaign' },
              { id: 'laporan', label: 'Laporan Penjualan CSV 📊', icon: FileSpreadsheet, desc: 'Audit bookkeeping' },
            ].map(item => {
              const IconComp = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id as any)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    isActive 
                      ? 'bg-[#2563EB] text-white shadow-sm' 
                      : isDark 
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-white' 
                        : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <IconComp className="w-4 h-4 text-violet-500" />
                  <div>
                    <span className="block text-xs leading-none">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Outer theme toggler */}
        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Mode Tampilan</span>
          </div>
          <button 
            type="button"
            onClick={() => setDarkTheme(!darkTheme)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </aside>

      {/* Main Container Work Area */}
      <main className="flex-1 p-8 flex flex-col justify-between overflow-y-auto max-h-[850px]">
        <div>
          {/* Header */}
          <header className="flex justify-between items-center pb-6 border-b border-slate-200/50 dark:border-slate-800 mb-6">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold leading-none">Petugas Loket Kasir</span>
              <h2 className="text-xl font-bold font-sans text-slate-900 dark:text-white tracking-tight capitalize mt-1">
                {activeMenu === 'dashboard' && 'Live Board Antrian Pelanggan'}
                {activeMenu === 'transaksi' && 'Transaksi Penjualan & Pembayaran'}
                {activeMenu === 'menu' && 'Konfigurasi Produk & Rekayasa Nilai'}
                {activeMenu === 'meja' && 'Pemetaan Tabel & Generate QR'}
                {activeMenu === 'loyalty' && 'Anggota Cashback Loyalty'}
                {activeMenu === 'reviews' && 'Moderator Feedbacks Toko'}
                {activeMenu === 'promo' && 'Pengadaan Diskon Promo'}
                {activeMenu === 'laporan' && 'Laporan & Bookkeeping Sheet'}
              </h2>
            </div>
            <div className="text-xs text-slate-400 font-mono text-right">
              <span>Waktu Server: <strong>10 Jun 2026</strong></span>
            </div>
          </header>

          {/* Router Views */}

          {/* 1. Live Board Antrian (Kanban Drag n Drop) */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6">
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-3xl flex items-start gap-3 shadow-xs">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-xs">Papan Monitor Antrian Pintar:</h5>
                  <p className="text-[11px] mt-1">Gunakan fitur **Drag & Drop** (Seret dan Jatuhkan) untuk memindahkan status order pesanan pelanggan. Setiap pemindahan akan memicu dialog verifikasi/konfirmasi untuk mencegah kesalahan operasional!</p>
                </div>
              </div>

              {/* 3-Lane Kanban Board Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Lane 1: Antrian Masuk (Status 'new') */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDragDrop(e, 'new')}
                  className={`rounded-3xl p-4 border flex flex-col min-h-[500px] transition-all bg-rose-500/5 border-rose-500/10`}
                >
                  <div className="flex items-center justify-between border-b border-rose-500/15 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      <h4 className="font-extrabold text-xs text-[#0F172A] dark:text-white uppercase">Antrian Masuk 🔔</h4>
                    </div>
                    <span className="text-[10px] font-mono bg-rose-500 text-white font-bold px-2.5 py-0.5 rounded-full">
                      {orders.filter(o => o.orderStatus === 'new').length}
                    </span>
                  </div>

                  <div className="space-y-3.5 flex-1">
                    {orders.filter(o => o.orderStatus === 'new').reverse().map(order => (
                      <div 
                        key={order.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, order)}
                        onClick={() => setInvoiceToPrint(order)}
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:border-indigo-400 transition relative group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-sans font-extrabold text-lg text-rose-600">Meja {order.tableId}</span>
                          <span className="text-[9px] font-mono text-slate-400">#{order.orderNumber.slice(-5)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Nama: <strong className="text-slate-800 dark:text-slate-200">{order.userName}</strong></p>
                        
                        <div className="mt-2 space-y-1 border-t border-slate-100 dark:border-slate-800/50 pt-2 text-[11px]">
                          {order.items.map(it => (
                            <div key={it.id} className="text-slate-650 dark:text-slate-450 flex justify-between">
                              <span>{it.menuName}</span>
                              <strong className="font-mono">x{it.quantity}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-[11px] font-mono">
                          <strong className="text-slate-900 dark:text-slate-100">Rp {order.totalPrice.toLocaleString('id-ID')}</strong>
                          <span className="px-2 py-0.5 text-[9px] bg-red-100 dark:bg-red-950/40 text-red-850 dark:text-red-400 rounded font-bold uppercase">{order.paymentStatus}</span>
                        </div>
                        
                        {/* Manual action trigger */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDraggedOrder(order); setTargetStatus('accepted'); }}
                          className="mt-3.5 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] rounded-xl uppercase tracking-wider transition-all"
                        >
                          Terima Antrian
                        </button>
                      </div>
                    ))}
                    {orders.filter(o => o.orderStatus === 'new').length === 0 && (
                      <div className="text-center py-20 text-slate-400">
                        <span className="text-[10px] uppercase font-mono">Kosong</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lane 2: Sedang Disiapkan / Dapur (Status 'accepted' or 'preparing') */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDragDrop(e, 'accepted')}
                  className="rounded-3xl p-4 border flex flex-col min-h-[500px] bg-indigo-500/5 border-indigo-500/10"
                >
                  <div className="flex items-center justify-between border-b border-indigo-500/15 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-indigo-600" />
                      <h4 className="font-extrabold text-xs text-[#0F172A] dark:text-white uppercase font-sans">Sedang Dikerjakan ✨</h4>
                    </div>
                    <span className="text-[10px] font-mono bg-indigo-650 text-white font-bold px-2.5 py-0.5 rounded-full">
                      {orders.filter(o => ['accepted', 'preparing'].includes(o.orderStatus)).length}
                    </span>
                  </div>

                  <div className="space-y-3.5 flex-1">
                    {orders.filter(o => ['accepted', 'preparing'].includes(o.orderStatus)).reverse().map(order => (
                      <div 
                        key={order.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, order)}
                        onClick={() => setInvoiceToPrint(order)}
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:border-indigo-450 transition relative group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-sans font-extrabold text-lg text-indigo-600">Meja {order.tableId}</span>
                          <span className="text-[9px] font-mono text-slate-400">#{order.orderNumber.slice(-5)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Nama: <strong className="text-slate-800 dark:text-slate-200">{order.userName}</strong></p>
                        
                        <div className="mt-2 space-y-1 border-t border-slate-100 dark:border-slate-800/50 pt-2 text-[11px]">
                          {order.items.map(it => (
                            <div key={it.id} className="text-slate-650 dark:text-slate-450 flex justify-between">
                              <span>{it.menuName}</span>
                              <strong className="font-mono">x{it.quantity}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-[11px] font-mono">
                          <strong className="text-slate-900 dark:text-slate-100">Rp {order.totalPrice.toLocaleString('id-ID')}</strong>
                          <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase ${
                            order.orderStatus === 'preparing' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-850'
                          }`}>
                            {order.orderStatus === 'preparing' ? 'Dapur' : 'Konfirmasi'}
                          </span>
                        </div>

                        {/* Manual action trigger */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDraggedOrder(order); setTargetStatus('done'); }}
                          className="mt-3.5 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded-xl uppercase tracking-wider transition-all"
                        >
                          Selesai & Sajikan
                        </button>
                      </div>
                    ))}
                    {orders.filter(o => ['accepted', 'preparing'].includes(o.orderStatus)).length === 0 && (
                      <div className="text-center py-20 text-slate-400">
                        <span className="text-[10px] uppercase font-mono">Kosong</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lane 3: Siap Sajikan & Selesai (Status 'done') */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDragDrop(e, 'done')}
                  className="rounded-3xl p-4 border flex flex-col min-h-[500px] bg-emerald-500/5 border-emerald-500/10"
                >
                  <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <h4 className="font-extrabold text-xs text-[#0F172A] dark:text-white uppercase font-sans">Siap Sajikan 🍽️</h4>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full">
                      {orders.filter(o => o.orderStatus === 'done').length}
                    </span>
                  </div>

                  <div className="space-y-3.5 flex-1">
                    {orders.filter(o => o.orderStatus === 'done').reverse().map(order => (
                      <div 
                        key={order.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, order)}
                        onClick={() => setInvoiceToPrint(order)}
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:border-emerald-450 transition relative group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-sans font-extrabold text-lg text-emerald-600">Meja {order.tableId}</span>
                          <span className="text-[9px] font-mono text-slate-400">#{order.orderNumber.slice(-5)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Nama: <strong className="text-slate-800 dark:text-slate-200">{order.userName}</strong></p>
                        
                        <div className="mt-2 space-y-1 border-t border-slate-100 dark:border-slate-800/50 pt-2 text-[11px]">
                          {order.items.map(it => (
                            <div key={it.id} className="text-slate-650 dark:text-slate-450 flex justify-between">
                              <span>{it.menuName}</span>
                              <strong className="font-mono">x{it.quantity}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-[11px] font-mono">
                          <strong className="text-slate-900 dark:text-slate-100">Rp {order.totalPrice.toLocaleString('id-ID')}</strong>
                          <span className="px-2 py-0.5 text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-450 rounded font-bold uppercase">SIAP</span>
                        </div>

                        {/* Direct Served Action Button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); onUpdateOrderStatus(order.id, 'served'); }}
                          className="mt-3.5 w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[9px] rounded-xl uppercase tracking-wider transition-all"
                        >
                          Arsip / Sajikan Ke Meja
                        </button>
                      </div>
                    ))}
                    {orders.filter(o => o.orderStatus === 'done').length === 0 && (
                      <div className="text-center py-20 text-slate-400">
                        <span className="text-[10px] uppercase font-mono">Kosong</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 2. Transaksi & Struk */}
          {activeMenu === 'transaksi' && (
            <div className="space-y-6">
              <div className={`p-5 rounded-3xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150 shadow-sm'
              }`}>
                <h4 className="font-extrabold text-[#0F172A] dark:text-white text-sm font-sans uppercase tracking-wide mb-4">Kasir Pembayaran Tunai & Print Out</h4>
                
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-slate-800 text-slate-400 font-mono text-[10px]">
                        <th className="py-2.5">Nomor Struk</th>
                        <th>Tabel</th>
                        <th>Waktu Transaksi</th>
                        <th>Anggota</th>
                        <th>Total Pembayaran</th>
                        <th>Metode</th>
                        <th>Keadaan Lunas</th>
                        <th className="text-right">Aksi Kasir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800">
                      {orders.slice().reverse().map(ord => (
                        <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 font-mono font-bold text-[#2563EB]">{ord.orderNumber}</td>
                          <td className="font-bold text-sm">Meja {ord.tableId}</td>
                          <td className="font-mono text-[11px] text-slate-400">{new Date(ord.createdAt).toLocaleString('id-ID')}</td>
                          <td>
                            <strong className="block">{ord.userName}</strong>
                            <span className="text-[10px] text-slate-400">{ord.userPhone}</span>
                          </td>
                          <td className="font-mono font-bold">Rp {ord.totalPrice.toLocaleString('id-ID')}</td>
                          <td className="capitalize font-mono">{ord.paymentMethod}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                              ord.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#FEF3C7] text-[#D97706]'
                            }`}>
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="text-right space-x-1 whitespace-nowrap">
                            {ord.paymentMethod === 'cash' && ord.paymentStatus === 'pending' && (
                              <button
                                onClick={() => onConfirmCashPayment(ord.id)}
                                className="px-2.5 py-1.5 bg-[#F59E0B] hover:bg-amber-600 text-slate-950 text-[10px] font-bold rounded-lg uppercase transition-all"
                              >
                                Konfirmasi Tunai Lunas 💵
                              </button>
                            )}

                            <button
                              onClick={() => setInvoiceToPrint(ord)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1 inline-flex transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Struk</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. Kelola Menu (Linked to stock ingredients checking) */}
          {activeMenu === 'menu' && (
            <div className="space-y-6">
              
              <div className={`p-5 rounded-3xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150 shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <div>
                    <h4 className="font-extrabold text-[#0F172A] dark:text-white text-sm font-sans uppercase tracking-wide">Relasi & Kelayakan Hidangan Sesuai Bahan Baku</h4>
                    <span className="text-[10px] text-slate-400 block font-mono mt-1">Menu otomatis tertutup (SOLD OUT) bila stok bahan di gudang habis!</span>
                  </div>
                  <button
                    onClick={() => {
                      setMenuEditId(null);
                      setMenuNameInput('');
                      setMenuImageInput('');
                      setShowAddMenuModal(true);
                    }}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-blue-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan Menu Baru</span>
                  </button>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-slate-800 text-slate-400 font-mono text-[10px]">
                        <th className="py-2.5">Gambar</th>
                        <th>Nama Menu</th>
                        <th>Kategori</th>
                        <th>Harga Jual</th>
                        <th>Formula Komposisi</th>
                        <th>Kecukupan Stok</th>
                        <th className="text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                      {menuItems.map(m => {
                        // Real-time stock status checker
                        const hasRecipe = m.recipe && m.recipe.length > 0;
                        const hasSufficientStock = !m.recipe || m.recipe.every(recipeItem => {
                          const ing = ingredients.find(i => i.id === recipeItem.ingredientId);
                          return ing ? ing.stock >= recipeItem.quantity : false;
                        });
                        return (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5">
                              <img 
                                src={m.imageUrl} 
                                alt={m.name} 
                                className="w-12 h-10 object-cover rounded-lg border border-slate-200" 
                                referrerPolicy="no-referrer"
                              />
                            </td>
                            <td>
                              <strong className="font-sans text-xs text-slate-900 dark:text-white block">{m.name}</strong>
                              {!m.isAvailable && (
                                <span className="text-[9px] font-mono text-rose-500 font-bold block mt-0.5">Dinonaktifkan Manual</span>
                              )}
                            </td>
                            <td className="capitalize text-slate-400 font-mono font-bold">{m.category}</td>
                            <td className="font-mono font-bold">Rp {m.price.toLocaleString('id-ID')}</td>
                            <td>
                              <div className="max-w-[200px] overflow-hidden truncate whitespace-nowrap text-[10px] text-slate-400">
                                {hasRecipe ? (
                                  m.recipe?.map(r => {
                                    const matched = ingredients.find(i => i.id === r.ingredientId);
                                    return `${matched?.name} (${r.quantity})`;
                                  }).join(', ')
                                ) : 'Bahan Umum (Tanpa Recipe)'}
                              </div>
                            </td>
                            <td>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                hasSufficientStock && m.isAvailable ? 'bg-emerald-100 text-emerald-805' : 'bg-red-100 text-red-800'
                              }`}>
                                {hasSufficientStock && m.isAvailable ? 'AKTIF / TERSEDIA' : ' habis / closed'}
                              </span>
                            </td>
                            <td className="text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => handleEditMenuItem(m)}
                                className="px-2.5 py-1.5 bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] font-bold rounded-lg text-[10px] uppercase transition-all"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMenuItem(m.id)}
                                className="px-2.5 py-1.5 bg-red-50 text-red-650 hover:bg-red-100 font-bold rounded-lg text-[10px] uppercase transition-all"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. Meja Cafe & QR Code */}
          {activeMenu === 'meja' && (
            <div className="space-y-6">
              <div className={`p-5 rounded-3xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150 shadow-sm'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-extrabold text-[#0F172A] dark:text-white text-sm font-sans uppercase">Generate Sticker QR Code Meja Pembeli</h4>
                  <button
                    onClick={() => setShowAddTableModal(true)}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Daftarkan Meja Kafe</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {tables.map(t => (
                    <div key={t.id} className="p-4 border border-slate-150 dark:border-slate-800 rounded-2xl bg-slate-50/25 dark:bg-slate-900/50 flex flex-col justify-between">
                      <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-slate-800 pb-2 mb-3">
                        <div>
                          <h5 className="font-extrabold text-lg leading-tight text-slate-900 dark:text-white">Meja {t.tableNumber}</h5>
                          <span className="text-[10px] font-mono text-slate-400 capitalize">{t.area} Area</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs font-mono mb-4 text-slate-550 break-all leading-tight">
                        Link Meja: <strong className="text-blue-500">caffepos.com/order?table={t.id}</strong>
                      </div>

                      <button
                        onClick={() => setQrTableToView(t)}
                        className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Tampilkan QR Sticker</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. Keanggotaan & Loyalty */}
          {activeMenu === 'loyalty' && (
            <div className="space-y-6">
              
              {/* Broadcast campaign form */}
              <div className={`p-5 rounded-3xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150 shadow-sm'
              }`}>
                <h4 className="font-extrabold text-[#0F172A] dark:text-white text-sm font-sans uppercase mb-4 flex items-center gap-1.5">
                  <Megaphone className="w-5 h-5 text-indigo-600 animate-bounce" />
                  <span>Kirim Penawaran WhatsApp Broadcast ke Member</span>
                </h4>

                <form onSubmit={handleBroadcastPromo} className="space-y-3">
                  <textarea
                    placeholder="Contoh: 'HARI INI: Promo Beli 1 Gratis 1 Latte Macchiato khusus Member CaffePOS! Tunjukkan halaman Membership HP Anda ke kasir.'"
                    value={promoCampaignText}
                    onChange={(e) => setPromoCampaignText(e.target.value)}
                    required
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 h-20 resize-none text-slate-800 dark:text-white"
                  />
                  
                  <button
                    type="submit"
                    className="px-4.5 py-2.5 bg-indigo-655 hover:bg-indigo-700 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 uppercase transition-all"
                  >
                    Kirim & Broadcast Penawaran ★
                  </button>
                </form>
              </div>

              {/* Members listings tabular view */}
              <div className={`p-5 rounded-3xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150 shadow-sm'
              }`}>
                <h4 className="font-bold text-xs font-sans text-slate-900 dark:text-white uppercase mb-4 tracking-wider">Anggota Terdaftar (Loyalty Membership)</h4>
                
                <div className="overflow-x-auto text-xs font-sans">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono text-[10px]">
                        <th className="py-2">Nama Anggota</th>
                        <th>Nomor WhatsApp</th>
                        <th>Poin Terkumpul</th>
                        <th>Loyalty Level</th>
                        <th>Tanggal Bergabung</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {members.map(u => (
                        <tr key={u.id}>
                          <td className="py-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                          <td className="font-mono text-slate-500">{u.phone}</td>
                          <td className="font-bold font-mono text-[#2563EB]">{u.points} Pts</td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 font-mono">GOLD VIP</span>
                          </td>
                          <td className="font-mono text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. Ulasan Rating */}
          {activeMenu === 'reviews' && (
            <div className="space-y-6">
              <div className={`p-5 rounded-3xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150 shadow-sm'
              }`}>
                <h4 className="font-extrabold text-[#0F172A] dark:text-white text-sm font-sans uppercase mb-4">Moderasi Bintang & Ulasan Pelanggan</h4>
                
                <div className="divide-y divide-slate-150 dark:divide-slate-805">
                  {reviews.map(r => (
                    <div key={r.id} className="py-4 flex gap-4 items-start">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-2xl">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      </div>

                      <div className="flex-1 flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="font-bold text-xs text-slate-900 dark:text-white">{r.userName}</strong>
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(v => (
                                <Star key={v} className={`w-3 h-3 ${v <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">Order {r.orderNumber.slice(-5)}</span>
                          </div>
                          
                          <p className="text-xs text-slate-650 dark:text-slate-350 mt-1">{r.comment}</p>
                          <span className="text-[10px] text-slate-400 font-mono block mt-2">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>

                        <button
                          onClick={() => toggleHideReview(r.id)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all ${
                            r.isHidden 
                              ? 'bg-red-100 text-red-800 border-red-300' 
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {r.isHidden ? 'Review Hidden' : 'Tampilkan Public'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <div className="text-center py-10">
                      <span className="text-xs text-slate-400 font-mono">Belum ada rating & review dari pembeli.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 7. Laporan Penjualan */}
          {activeMenu === 'laporan' && (
            <div className="space-y-6">
              <div className={`p-5 rounded-3xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150 shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                  <div>
                    <h4 className="font-extrabold text-[#0F172A] dark:text-white text-sm font-sans uppercase">Unduh & Ekspor Laporan Excel / CSV</h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Format ledger: excel-compliant CSV sheet formatting</span>
                  </div>

                  <button 
                    onClick={exportToExcelCsv}
                    className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 uppercase"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Unduh CSV Excel</span>
                  </button>
                </div>

                <div className="overflow-x-auto text-xs font-sans">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-slate-800 text-slate-400 font-mono text-[10px]">
                        <th className="py-2.5">Tanggal Operasional</th>
                        <th>Total Transaksi</th>
                        <th>Omset Kotor Kafe</th>
                        <th>Penghancuran Promo Diskon</th>
                        <th>Metode Cash / QRIS Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800">
                      {historicalSales.map((day, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="py-3 font-semibold text-slate-900 dark:text-white">{day.date}</td>
                          <td className="font-mono text-slate-500">{day.transactions} Kali</td>
                          <td className="font-mono font-bold text-emerald-500">Rp {day.sales.toLocaleString('id-ID')}</td>
                          <td className="font-mono text-rose-500">-Rp {(day.sales * 0.05).toLocaleString('id-ID')}</td>
                          <td className="font-mono">50% Tunai / 50% QRIS</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. Kupon & Banner Promo */}
          {activeMenu === 'promo' && (
            <div className="space-y-6">
              <div className={`p-5 rounded-3xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150 shadow-sm'
              }`}>
                <h4 className="font-extrabold text-[#0F172A] dark:text-white text-sm font-sans uppercase mb-4">Pengaturan Banner Landing Pelanggan</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {banners.map(b => (
                    <div key={b.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50">
                      <div className="h-32 bg-slate-100 relative">
                        <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold font-mono uppercase ${
                          b.active ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-400 text-white'
                        }`}>
                          {b.active ? 'Aktif' : 'Draft'}
                        </span>
                      </div>
                      <div className="p-3.5">
                        <h6 className="font-bold text-xs text-slate-900 dark:text-white">{b.title}</h6>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL 1: Digital Invoice Receipt details F1-10 */}
      {invoiceToPrint && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 modal-appear font-sans text-slate-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono text-[#2563EB] font-bold uppercase block tracking-wider">Cetak Struk Transaksi</span>
              <button onClick={() => setInvoiceToPrint(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="print-area" className="border-t-2 border-b-2 border-dashed border-slate-300 py-4 font-mono text-[11px] text-slate-800">
              <div className="text-center font-bold font-sans text-xs uppercase text-slate-950 mb-1">CaffePOS Kedai</div>
              <div className="text-center text-[9px] text-slate-400 mb-4 font-mono">Jl. Raya Modern No. 17, Bandung</div>
              
              <div className="flex justify-between mb-1">
                <span>Struk No:</span>
                <span>{invoiceToPrint.orderNumber}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Operasional:</span>
                <span>{new Date(invoiceToPrint.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span>Meja / Customer:</span>
                <span className="font-bold">Meja {invoiceToPrint.tableId} ({invoiceToPrint.userName})</span>
              </div>

              <div className="border-t border-slate-200 my-2" />

              <div className="space-y-1.5">
                {invoiceToPrint.items.map(it => (
                  <div key={it.id} className="flex justify-between text-[10px]">
                    <span>{it.menuName.slice(0, 18)} x{it.quantity}</span>
                    <span>Rp {it.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 mt-3 my-2" />

              <div className="space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp {invoiceToPrint.items.reduce((sum, i) => sum + i.subtotal, 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-905">
                  <span>Total Tagihan:</span>
                  <span>Rp {invoiceToPrint.totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-indigo-600">
                  <span>Metode Bayar:</span>
                  <span className="uppercase font-bold">{invoiceToPrint.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Cashback Poin:</span>
                  <span>+{invoiceToPrint.pointsEarned} Poin</span>
                </div>
              </div>
              
              <div className="text-center text-[9px] text-[#2563EB] mt-5 uppercase">★ Thank you for dining with us ★</div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 uppercase tracking-wide shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Table sticker QR preview */}
      {qrTableToView && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 modal-appear font-sans text-slate-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Arsip Sticker Meja QR</span>
              <button onClick={() => setQrTableToView(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-4 border-[#2563EB] rounded-[32px] p-5 text-center bg-white shadow-inner flex flex-col items-center">
              <span className="font-extrabold text-slate-950 tracking-tight text-lg">CAFFEPOS MENU QR</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">Scan directly to place orders</span>

              <div className="my-5 p-4 bg-slate-50 rounded-2xl border-2 border-[#2563EB] inline-block shadow-md">
                <QrCode className="w-32 h-32 text-slate-950" />
              </div>

              <span className="text-[10px] text-slate-400 block font-mono leading-none">Meja QR Code</span>
              <strong className="text-sm tracking-tight text-[#2563EB] block font-extrabold mt-1">caffepos.com/order?table={qrTableToView.id}</strong>

              <div className="mt-5 w-24 h-24 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex flex-col items-center justify-center shadow-md">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-none">TABLE</span>
                <span className="text-3xl font-black text-[#2563EB] text-center mt-1 scale-y-115">{qrTableToView.tableNumber}</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Mengunduh QR sticker...');
                setQrTableToView(null);
              }}
              className="mt-4 w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl active:scale-95 transition-all text-center uppercase shadow-md"
            >
              Unduh Stiker QR
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Menu formulation setup add/edit */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 modal-appear font-sans text-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-[#0F172A] text-sm">{menuEditId ? 'Edit Hidangan Menu' : 'Tambahkan Hidangan Hidup'}</h4>
              <button onClick={() => setShowAddMenuModal(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Nama Masakan / Minuman</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Ice Salted Caramel Macchiato" 
                  value={menuNameInput}
                  onChange={(e) => setMenuNameInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Kategori Menu</label>
                  <select 
                    value={menuCategoryInput} 
                    onChange={(e) => setMenuCategoryInput(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="food">Makanan 🍲</option>
                    <option value="beverage">Minuman ☕</option>
                    <option value="snack">Cemilan 🥨</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Harga Menu (Rp)</label>
                  <input 
                    type="number" 
                    required
                    value={menuPriceInput}
                    onChange={(e) => setMenuPriceInput(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Unsplash JPG Image URL (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Paste URL foto menu..." 
                  value={menuImageInput}
                  onChange={(e) => setMenuImageInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md uppercase tracking-wide"
              >
                Simpan & Update Menu hidangan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Table register and QR sticker generator */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 modal-appear font-sans text-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-[#0F172A] text-sm">Tambahkan Meja Baru Kafe</h4>
              <button onClick={() => setShowAddTableModal(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1 font-sans">Nomor Meja Baru</label>
                <input 
                  type="text"
                  required 
                  placeholder="Contoh: T07, T08" 
                  value={tableNumberInput}
                  onChange={(e) => setTableNumberInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1 font-sans">Area Peletakan Meja</label>
                <select 
                  value={tableAreaInput}
                  onChange={(e) => setTableAreaInput(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Indoor">Indoor Area</option>
                  <option value="Outdoor">Outdoor Area</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md uppercase"
              >
                Daftarkan Meja & Generate QR
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Live Board Antrian Drag N Drop Validation Dialog popup */}
      {draggedOrder && targetStatus && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 modal-appear font-sans text-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-3.5 text-amber-500 mb-4">
              <AlertTriangle className="w-8 h-8 shrink-0 animate-bounce" />
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm">Validasi Alur Antrian Kafe</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Konfirmasi manual pemindahan status pengerjaan</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2.5 text-xs font-mono mb-5">
              <div className="flex justify-between">
                <span className="text-slate-450 text-[10px]">NOMOR ANTRIAN:</span>
                <span className="font-bold text-slate-900 dark:text-white">{draggedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 text-[10px]">MEJA PELANGGAN:</span>
                <span className="font-bold text-blue-500">Meja {draggedOrder.tableId} ({draggedOrder.userName})</span>
              </div>
              <div className="border-t border-slate-200/55 dark:border-slate-800 my-2" />
              <div className="flex justify-between items-center pt-1 font-bold">
                <span className="text-slate-400 uppercase text-[10px]">PINDAHKAN STATUS:</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-455 rounded block capitalize">
                    {draggedOrder.orderStatus}
                  </span>
                  <span>→</span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-808 dark:text-emerald-450 rounded block capitalize font-bold leading-none">
                    {targetStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setDraggedOrder(null); setTargetStatus(null); }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl transition"
              >
                Batal / Batalkan
              </button>
              <button
                type="button"
                onClick={confirmDragAction}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/10 transition"
              >
                Ya, Konfirmasi Validasi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
