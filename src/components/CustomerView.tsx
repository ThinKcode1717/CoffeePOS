/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MenuItem, Table, Banner, Order, Review, User, CartItem, LoyaltyRule, OrderItem, OrderStatus, Ingredient } from '../types';
import { 
  ShoppingBag, 
  User as UserIcon, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Check, 
  ChevronRight, 
  QrCode, 
  Star, 
  Flame, 
  Clock, 
  MapPin, 
  Percent, 
  X, 
  MessageSquare, 
  PhoneCall, 
  Wallet, 
  CircleDollarSign,
  Smartphone,
  Sparkles,
  Search
} from 'lucide-react';

interface CustomerViewProps {
  menuItems: MenuItem[];
  tables: Table[];
  banners: Banner[];
  orders: Order[];
  currentUser: User | null;
  onSetCurrentUser: (user: User | null) => void;
  onAddOrder: (order: Order) => void;
  loyaltyRule: LoyaltyRule;
  onAddReview: (review: Review) => void;
  onUpdateUserPoints: (userId: string, points: number) => void;
  onRegisterMember: (user: User) => void;
  selectedTableId: string;
  onSelectTable: (tableId: string) => void;
  ingredients?: Ingredient[];
}

export default function CustomerView({
  menuItems,
  tables,
  banners,
  orders,
  currentUser,
  onSetCurrentUser,
  onAddOrder,
  loyaltyRule,
  onAddReview,
  onUpdateUserPoints,
  onRegisterMember,
  selectedTableId,
  onSelectTable,
  ingredients = []
}: CustomerViewProps) {
  // Navigation states: 'home' | 'cart' | 'auth' | 'checkout' | 'tracking' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'cart' | 'checkout' | 'tracking' | 'profile'>('home');
  
  // Menu filtering & search
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'beverage' | 'snack'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Shopping Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [usePoints, setUsePoints] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'midtrans' | 'cash'>('midtrans');
  
  // Auth Form State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  
  // Active tracking order state
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  
  // Order continuation checker
  const [showAppendModal, setShowAppendModal] = useState(false);
  const [existingOrderToAppend, setExistingOrderToAppend] = useState<Order | null>(null);
  
  // Midtrans overlay simulated state
  const [showMidtransOverlay, setShowMidtransOverlay] = useState(false);
  const [midtransType, setMidtransType] = useState<'qris' | 'card'>('qris');
  const [newlyCreatedOrder, setNewlyCreatedOrder] = useState<Order | null>(null);

  // Ratings form state
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);

  // Message broadcast state
  const [activePromoBroadcast, setActivePromoBroadcast] = useState<string | null>(null);

  // Cart expiry simulation
  useEffect(() => {
    // Save/load cart bound to session
    const storedCart = localStorage.getItem(`caffepos_cart_${selectedTableId}`);
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, [selectedTableId]);

  useEffect(() => {
    localStorage.setItem(`caffepos_cart_${selectedTableId}`, JSON.stringify(cart));
  }, [cart, selectedTableId]);

  // Check for existing active orders upon table changes
  useEffect(() => {
    const activeOrderOnTable = orders.find(
      o => o.tableId === selectedTableId && 
      !['served', 'cancelled'].includes(o.orderStatus)
    );
    if (activeOrderOnTable) {
      setExistingOrderToAppend(activeOrderOnTable);
      // Only show append popup if the customer is browsing home and hasn't started checkout
      if (activeTab === 'home') {
        setShowAppendModal(true);
      }
    } else {
      setExistingOrderToAppend(null);
    }
  }, [selectedTableId, orders]);

  // Handle promotional broadcasts
  useEffect(() => {
    const handleBroadcast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.message) {
        setActivePromoBroadcast(customEvent.detail.message);
      }
    };
    window.addEventListener('caffepos_promo_broadcast', handleBroadcast);
    return () => window.removeEventListener('caffepos_promo_broadcast', handleBroadcast);
  }, []);

  const currentTable = tables.find(t => t.id === selectedTableId);

  // Cart Handlers
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    // Create animated toast notification
    showToast(`Ditambahkan ke keranjang: ${item.name}`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter(i => i.menuItem.id !== itemId);
      }
      return prev.map(i => i.menuItem.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(`caffepos_cart_${selectedTableId}`);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Pricing calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
  const discountPercent = currentUser ? 10 : 0; // 10% auto discount for registered members F6-04
  const discountFromPromo = Math.round((cartSubtotal * discountPercent) / 100);
  
  // Points calculation as discount: 1 point = Rp1,000 (F2-04)
  const maxRedeemablePoints = currentUser ? Math.min(currentUser.points, Math.floor((cartSubtotal - discountFromPromo) / 1000)) : 0;
  const discountFromPoints = usePoints ? maxRedeemablePoints * 1000 : 0;
  
  const finalTotal = Math.max(0, cartSubtotal - discountFromPromo - discountFromPoints);

  // Auto-join loyalty points earned: Rp10,000 = 1 loyalty point (F2-01)
  const earnedPoints = Math.floor(finalTotal / 10000);

  // Handle WhatsApp OTP simulation
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPhone || !authName) return;
    setOtpSent(true);
    setOtpError('');
    showToast('Simulasi Kode OTP WhatsApp dikirim: 2901');
  };

  const handleVerifyOtp = () => {
    if (otpCode !== '2901') {
      setOtpError('Kode OTP salah! Gunakan kode: 2901');
      return;
    }
    
    // Login or sign up
    const mockUser: User = {
      id: 'member_' + Date.now(),
      phone: authPhone,
      name: authName,
      role: 'member',
      points: 20, // free starter points for registration F2-02
      createdAt: new Date().toISOString()
    };
    
    onRegisterMember(mockUser);
    onSetCurrentUser(mockUser);
    setShowAuthModal(false);
    setOtpSent(false);
    setOtpCode('');
    setOtpError('');
    showToast(`Registrasi Berhasil! Selamat datang ${authName}. Poin Bonus +20 dimasukkan.`);
  };

  // Order Submission flow
  const handleProceedToCheckout = () => {
    if (!currentUser) {
      setShowAuthModal(true);
    } else {
      setActiveTab('checkout');
    }
  };

  const handlePlaceOrder = () => {
    if (!currentUser) return;

    const code = 'ORD-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(100 + Math.random() * 900);
    
    const transformedItems: OrderItem[] = cart.map((i, index) => ({
      id: `oi_${Date.now()}_${index}`,
      menuId: i.menuItem.id,
      menuName: i.menuItem.name,
      quantity: i.quantity,
      price: i.menuItem.price,
      subtotal: i.menuItem.price * i.quantity,
    }));

    const orderData: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: code,
      tableId: selectedTableId,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      totalPrice: finalTotal,
      discount: discountFromPromo + discountFromPoints,
      pointsUsed: usePoints ? maxRedeemablePoints : 0,
      pointsEarned: earnedPoints,
      paymentMethod: selectedPayment,
      paymentStatus: selectedPayment === 'midtrans' ? 'paid' : 'pending',
      orderStatus: 'new',
      createdAt: new Date().toISOString(),
      items: transformedItems,
    };

    if (selectedPayment === 'midtrans') {
      setNewlyCreatedOrder(orderData);
      setShowMidtransOverlay(true);
    } else {
      // Cash payment processed instantly as pending
      onAddOrder(orderData);
      // Deduct used points & apply earned points
      const pointDiff = (usePoints ? -maxRedeemablePoints : 0);
      onUpdateUserPoints(currentUser.id, currentUser.points + pointDiff);
      
      clearCart();
      setTrackingOrderId(orderData.id);
      setActiveTab('tracking');
      showToast('Pesanan berhasil dibuat! Serahkan uang cash ke Kasir.');
      triggerPusherSoundEffect();
    }
  };

  const handleAppendToExistingOrder = () => {
    if (!existingOrderToAppend || cart.length === 0) return;

    // Append items to the existing order
    const updatedOrder = { ...existingOrderToAppend };
    const additionalItems: OrderItem[] = cart.map((i, index) => ({
      id: `oi_append_${Date.now()}_${index}`,
      menuId: i.menuItem.id,
      menuName: i.menuItem.name,
      quantity: i.quantity,
      price: i.menuItem.price,
      subtotal: i.menuItem.price * i.quantity,
    }));

    const additionalTotal = cartSubtotal;
    const additionalEarnedPoints = Math.floor(additionalTotal / 10000);

    updatedOrder.items = [...updatedOrder.items, ...additionalItems];
    updatedOrder.totalPrice += additionalTotal;
    updatedOrder.pointsEarned += additionalEarnedPoints;

    // Save updated order
    // In our simplified database, we trigger an append through state
    const updatedOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    localStorage.setItem('caffepos_orders', JSON.stringify(updatedOrders));
    
    // Add additional loyalty points
    if (currentUser) {
      onUpdateUserPoints(currentUser.id, currentUser.points + additionalEarnedPoints);
    }

    clearCart();
    setTrackingOrderId(updatedOrder.id);
    setActiveTab('tracking');
    setShowAppendModal(false);
    showToast('Item berhasil ditambahkan ke Pesanan mejamu yang sedang aktif!');
    triggerPusherSoundEffect();
  };

  const triggerPusherSoundEffect = () => {
    // Sound alert as required in PRD (Notifikasi Real-time: Suara alert + visual)
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, context.currentTime); // D5
      gain.gain.setValueAtTime(0.2, context.currentTime);
      osc.start();
      osc.stop(context.currentTime + 0.15);

      setTimeout(() => {
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        osc2.connect(gain2);
        gain2.connect(context.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, context.currentTime); // A5
        gain2.gain.setValueAtTime(0.2, context.currentTime);
        osc2.start();
        osc2.stop(context.currentTime + 0.3);
      }, 150);

      // Trigger custom React storage sync event for Realtime updates!
      const event = new CustomEvent('caffepos_order_alert', { detail: { info: 'New order has arrived!' } });
      window.dispatchEvent(event);
    } catch (e) {
      console.warn("Audio Context blocked by browser permission.", e);
    }
  };

  const handleFinishMidtransPayment = () => {
    if (!newlyCreatedOrder || !currentUser) return;
    onAddOrder(newlyCreatedOrder);
    
    const pointDiff = (usePoints ? -maxRedeemablePoints : 0) + earnedPoints;
    onUpdateUserPoints(currentUser.id, currentUser.points + pointDiff);
    
    clearCart();
    setTrackingOrderId(newlyCreatedOrder.id);
    setActiveTab('tracking');
    setShowMidtransOverlay(false);
    setNewlyCreatedOrder(null);
    showToast('Pembayaran Midtrans Sukses! Pesanan dikirim langsung ke dapur.');
    triggerPusherSoundEffect();
  };

  const handleSubmitReview = (order: Order) => {
    if (!ratingComment.trim()) return;
    
    const newRatingReview: Review = {
      id: `r_${Date.now()}`,
      orderId: order.id,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || order.userName || 'Pelanggan Misterius',
      orderNumber: order.orderNumber,
      rating: ratingStars,
      comment: ratingComment,
      isHidden: false,
      createdAt: new Date().toISOString()
    };

    onAddReview(newRatingReview);
    
    // Member who leaves a review gets +5 bonus points F5-03
    if (currentUser) {
      onUpdateUserPoints(currentUser.id, currentUser.points + 5);
      showToast('Ulasan berhasil disubmit! Bonus +5 Poin ditambahkan ke membershipmu.');
    } else {
      showToast('Ulasan berhasil disubmit! Terima kasih atas feedback Anda.');
    }
    
    setHasSubmittedRating(true);
    setRatingComment('');
  };

  // Filter items based on search and category
  const filteredMenuItems = menuItems.map(item => {
    // Check if any recipe ingredient has insufficient stock
    const isOutOfStock = item.recipe && item.recipe.some(rec => {
      const matched = ingredients.find(i => i.id === rec.ingredientId);
      return matched ? matched.stock < rec.quantity : false;
    });
    return {
      ...item,
      isAvailable: isOutOfStock ? false : item.isAvailable
    };
  }).filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Track the selected order details
  const activeTrackingOrder = orders.find(o => o.id === trackingOrderId);

  // Status mapping
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'Menunggu Konfirmasi';
      case 'accepted': return 'Diterima Kasir';
      case 'preparing': return 'Dapur (Sedang Diproses)';
      case 'done': return 'Pesanan Selesai';
      case 'served': return 'Telah Disajikan';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Sedang Diproses';
    }
  };

  const getStatusStepIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    switch (status) {
      case 'new': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'done': return 3;
      case 'served': return 4;
      default: return 0;
    }
  };

  return (
    <div id="customer-phone" className="relative w-full max-w-[430px] min-h-[740px] max-h-[880px] bg-[#FFFFFF] rounded-[36px] shadow-2xl border-8 border-slate-900 overflow-y-auto flex flex-col font-sans text-slate-700">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#2563EB] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Broadcast Banner Drop-in */}
      {activePromoBroadcast && (
        <div className="bg-[#8B5CF6] text-white px-4 py-2 text-xs font-semibold flex items-center justify-between z-40 animate-slide-down">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 animate-spin" />
            <span>Promo Hari Ini: {activePromoBroadcast}</span>
          </div>
          <button onClick={() => setActivePromoBroadcast(null)} className="text-white hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Phone Bar Representation */}
      <div className="sticky top-0 bg-[#FFFFFF] z-30 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-[#2563EB]" />
          <div>
            <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider leading-none">Meja Aktif</span>
            <select 
              value={selectedTableId} 
              onChange={(e) => onSelectTable(e.target.value)}
              className="font-bold text-slate-900 bg-transparent text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#2563EB] rounded cursor-pointer"
            >
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  Meja {t.tableNumber} ({t.area})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-1 bg-[#EFF6FF] text-[#2563EB] px-3 py-1.5 rounded-full text-xs font-medium border border-[#DBEAFE] hover:bg-[#DBEAFE] transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{currentUser.name.split(' ')[0]} ({currentUser.points} Pts)</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="text-[#2563EB] border border-[#2563EB] bg-white px-3 py-1 rounded-full text-xs font-bold hover:bg-[#EFF6FF] transition-all"
            >
              Gabung Member
            </button>
          )}
        </div>
      </div>

      {/* Primary views router */}
      {activeTab === 'home' && (
        <div className="flex-1 flex flex-col p-4 pb-28">
          
          {/* Promo Slider Carousel F6-01 */}
          <div className="mb-5 overflow-hidden rounded-2xl relative shadow-sm h-36 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="absolute inset-0 bg-black/25 z-10" />
            <img 
              src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400"} 
              alt="Promo Banner" 
              className="w-full h-full object-cover absolute inset-0"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-3 left-3 right-3 z-20">
              <span className="bg-[#8B5CF6] text-white text-[9px] font-bold uppercase rounded px-2 py-0.5 mb-1.5 inline-block">PROMO BULANAN</span>
              <h4 className="font-bold text-sm tracking-tight leading-tight line-clamp-1">{banners[0]?.title}</h4>
              <p className="text-[10px] text-slate-100 line-clamp-1">{banners[0]?.description}</p>
            </div>
            <div className="absolute top-2 right-2 z-20 flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white bg-opacity-100" />
              <div className="w-1.5 h-1.5 rounded-full bg-white bg-opacity-40" />
            </div>
          </div>

          {/* Quick Stats bar if Logged in */}
          {currentUser && (
            <div className="mb-4 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border border-[#DBEAFE] rounded-xl p-3 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="text-slate-800 font-medium">Promo: Diskon 10% Member Aktif</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">AUTO-APPLIED</span>
            </div>
          )}

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-[#94A3B8] absolute top-1/2 left-3 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Cari menu nikmat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Categories Selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none">
            {[
              { id: 'all', label: 'Semua Menu' },
              { id: 'food', label: 'Makanan 🍲' },
              { id: 'beverage', label: 'Minuman ☕' },
              { id: 'snack', label: 'Cemilan 🥨' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`text-xs whitespace-nowrap px-3.5 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === cat.id 
                    ? 'bg-[#2563EB] text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Menu Grid F1-02 */}
          <div className="mt-2 grid grid-cols-2 gap-3.5">
            {filteredMenuItems.map(item => {
              const cartItem = cart.find(i => i.menuItem.id === item.id);
              return (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                  {/* Aspect ratio 4:3 image wrapper */}
                  <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden relative">
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-red-500 rounded-md">Habis</span>
                      </div>
                    )}
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">{item.category}</span>
                      <h5 className="font-bold font-sans text-xs text-[#0F172A] leading-tight line-clamp-2 mt-0.5">{item.name}</h5>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-sm text-[#0F172A] font-mono">Rp {item.price.toLocaleString('id-ID')}</span>
                      
                      {item.isAvailable && (
                        <div>
                          {cartItem ? (
                            <div className="flex items-center bg-[#2563EB] text-white rounded-full p-0.5">
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-[#1D4ED8] transition-all text-sm font-semibold"
                              >
                                -
                              </button>
                              <span className="text-[11px] font-bold px-1.5 min-w-[14px] text-center">{cartItem.quantity}</span>
                              <button 
                                onClick={() => addToCart(item)}
                                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-[#1D4ED8] transition-all text-sm font-semibold"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 bg-[#EFF6FF] hover:bg-[#2563EB] text-[#2563EB] hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-slate-400 font-mono">Menu tidak ditemukan.</p>
            </div>
          )}

          {/* Sticky Bottom Cart F1-06 */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[414px] px-4 py-3 bg-[#FFFFFF]/90 backdrop-blur-md border-t border-slate-100 z-40 rounded-t-2xl shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative p-2.5 bg-[#EFF6FF] rounded-xl text-[#2563EB] bounce-bounce">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#2563EB] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Keranjang</span>
                  <span className="font-bold text-xs text-[#0F172A] font-mono">Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('cart')}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <span>Maju Checkout</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cart' && (
        <div className="flex-1 flex flex-col p-4">
          <div className="flex items-center mb-5">
            <button onClick={() => setActiveTab('home')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 mr-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base font-sans text-slate-900">Ringkasan Pesanan</h2>
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">Keranjang belanja kosong.</p>
              <button 
                onClick={() => setActiveTab('home')}
                className="mt-4 bg-[#2563EB] text-white text-xs px-4 py-2 rounded-xl font-bold uppercase tracking-wider"
              >
                Pesan Menu Sekarang
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase mb-2">Item Terpilih</span>
                
                {/* List cart items */}
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.menuItem.id} className="flex gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <img 
                        src={item.menuItem.imageUrl} 
                        alt={item.menuItem.name} 
                        className="w-12 h-12 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h6 className="font-bold text-xs text-slate-800 leading-tight line-clamp-1">{item.menuItem.name}</h6>
                          <span className="text-[10px] text-slate-400 font-mono">Rp {item.menuItem.price.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 font-mono">Sub: Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}</span>
                          
                          <div className="flex items-center bg-white border border-slate-200 rounded-full p-0.5">
                            <button 
                              onClick={() => removeFromCart(item.menuItem.id)}
                              className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-150 text-xs font-semibold"
                            >
                              -
                            </button>
                            <span className="text-xs px-2 font-bold min-w-[12px] text-center">{item.quantity}</span>
                            <button 
                              onClick={() => addToCart(item.menuItem)}
                              className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-150 text-xs font-semibold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Info and coupons discount */}
                <div className="mt-5 p-3 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-between text-xs text-[#8B5CF6]">
                  <div className="flex items-center gap-1.5">
                    <Percent className="w-4 h-4" />
                    <div>
                      <span className="font-bold block">Pemberian Poin Member</span>
                      <span className="text-[10px] text-violet-600">Dapatkan +1 Poin tiap transaksi kelipatan Rp 10.000</span>
                    </div>
                  </div>
                  <span className="font-bold font-mono">+{earnedPoints} Poin</span>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>Subtotal Item</span>
                  <span className="font-semibold font-mono text-slate-800">Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                </div>

                {currentUser && (
                  <div className="flex items-center justify-between text-xs text-emerald-600 mb-2 font-medium">
                    <span>Diskon Member Aktif (10%)</span>
                    <span className="font-mono">-Rp {discountFromPromo.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold text-sm text-[#0F172A]">Jumlah Tagihan</span>
                  <span className="font-extrabold text-base text-[#0F172A] font-mono">Rp {(cartSubtotal - discountFromPromo).toLocaleString('id-ID')}</span>
                </div>

                {/* Continue button */}
                <div className="mt-5 flex gap-2">
                  <button 
                    onClick={clearCart}
                    className="flex-1 py-3 text-xs font-semibold border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 active:scale-95 transition-all uppercase"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleProceedToCheckout}
                    className="flex-[2] py-3 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl active:scale-95 transition-all shadow-md uppercase"
                  >
                    Lanjut Ke Pembayaran
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'checkout' && (
        <div className="flex-1 flex flex-col p-4">
          <div className="flex items-center mb-5">
            <button onClick={() => setActiveTab('cart')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 mr-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base font-sans text-slate-900">Pembayaran & Konfirmasi</h2>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Member Details */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1">Identitas Member</span>
                <h5 className="font-bold text-xs text-slate-800">{currentUser?.name}</h5>
                <p className="text-[11px] text-slate-500">{currentUser?.phone}</p>
                <div className="mt-2 text-[10px] font-mono text-[#2563EB] flex items-center gap-1.5 pt-2 border-t border-slate-200/50">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Kredit Keanggotaan: <strong>{currentUser?.points} Poin</strong></span>
                </div>
              </div>

              {/* Redeem points selector F2-04 */}
              {currentUser && currentUser.points > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <input 
                      type="checkbox" 
                      id="redeemPoints" 
                      checked={usePoints} 
                      onChange={(e) => setUsePoints(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="redeemPoints" className="text-xs font-bold text-amber-800 cursor-pointer">Pakai Poin Potong Harga</label>
                      <span className="text-[10px] text-amber-600 block">Dukungan: {maxRedeemablePoints} Poin = Potong Rp {(maxRedeemablePoints*1000).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-700">-Rp {(maxRedeemablePoints * 1000).toLocaleString('id-ID')}</span>
                </div>
              )}

              {/* Payment Method Selector F1-09, F1-10 */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase mb-2">Pilih Cara Bayar</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setSelectedPayment('midtrans')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold leading-none ${
                      selectedPayment === 'midtrans'
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-[#2563EB]" />
                    <span>Midtrans (QRIS)</span>
                  </button>

                  <button 
                    onClick={() => setSelectedPayment('cash')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold leading-none ${
                      selectedPayment === 'cash'
                        ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#F59E0B]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CircleDollarSign className="w-5 h-5 text-[#F59E0B]" />
                    <span>Tunai (KASIR)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Price breakdown final */}
            <div className="mt-8 border-t border-slate-100 pt-4">
              <div className="space-y-1.5 text-xs text-slate-500 mb-3.5">
                <div className="flex justify-between">
                  <span>Subtotal Makanan & Minuman</span>
                  <span className="font-mono text-slate-800 font-semibold">Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                </div>
                {currentUser && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon Member Aktif (10%)</span>
                    <span className="font-mono">-Rp {discountFromPromo.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {usePoints && (
                  <div className="flex justify-between text-amber-600">
                    <span>Pemotongan Saldo Poin ({maxRedeemablePoints} Poin)</span>
                    <span className="font-mono">-Rp {discountFromPoints.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#8B5CF6] font-medium">
                  <span>Poin Diperoleh</span>
                  <span className="font-mono font-bold">+{earnedPoints} Poin</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mb-4">
                <span className="font-extrabold text-sm text-[#0F172A] uppercase">Total Bayar</span>
                <span className="font-extrabold text-lg text-[#0F172A] font-mono">Rp {finalTotal.toLocaleString('id-ID')}</span>
              </div>

              <button 
                onClick={handlePlaceOrder}
                className="w-full py-3 bg-[#10B981] hover:bg-[#0D9488] text-white text-xs font-extrabold rounded-xl active:scale-95 transition-all shadow-md uppercase tracking-wider"
              >
                Kirim Pesanan Sekarang (Rp {finalTotal.toLocaleString('id-ID')})
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="flex-1 flex flex-col p-4">
          <div className="flex items-center mb-5 justify-between">
            <h2 className="font-bold text-base font-sans text-slate-900 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-[#2563EB] animate-pulse" />
              <span>Status Pesanan</span>
            </h2>
            <button 
              onClick={() => {
                setActiveTab('home');
                setTrackingOrderId(null);
                setHasSubmittedRating(false);
              }}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg font-bold"
            >
              Order Baru
            </button>
          </div>

          {!activeTrackingOrder ? (
            <div className="text-center py-20">
              <p className="text-xs text-slate-400">Tidak ada pesanan aktif yang dipantau.</p>
              <button onClick={() => setActiveTab('home')} className="mt-4 bg-[#2563EB] text-white text-xs px-4 py-2 rounded-xl font-bold">Buka Menu</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Header detail */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#2563EB]/5 rounded-bl-full flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-[#2563EB]/40" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">ID Order</span>
                  <h4 className="font-bold text-xs text-slate-900 font-mono tracking-tight">{activeTrackingOrder.orderNumber}</h4>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Meja Pelanggan</span>
                      <strong className="text-slate-800 text-sm font-sans block">Meja {activeTrackingOrder.tableId}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Metode Pembayaran</span>
                      <strong className="text-slate-800 capitalize font-mono block">
                        {activeTrackingOrder.paymentMethod} ({activeTrackingOrder.paymentStatus === 'paid' ? 'Lunas' : 'Menunggu'})
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Animated progress step indicator F1-12 */}
                <div className="mb-6">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase mb-3">Langkah Pengerjaan</span>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'new', label: 'Pesanan Diterima', desc: 'Pesanan terkirim secara real-time ke kasir' },
                      { key: 'accepted', label: 'Dikonfirmasi Kasir', desc: 'Pesanan disetujui staf dapur' },
                      { key: 'preparing', label: 'Dapur (Sedang Memasak)', desc: 'Makanan & minuman Anda disiapkan barista/koki' },
                      { key: 'done', label: 'Selesai Diproses', desc: 'Makanan telah matang dan siap disajikan' },
                      { key: 'served', label: 'Disajikan di Meja', desc: 'Staf mengantar pesanan ke meja Anda' }
                    ].map((step, idx) => {
                      const currentIdx = getStatusStepIndex(activeTrackingOrder.orderStatus);
                      const isCompleted = idx < currentIdx;
                      const isActive = idx === currentIdx;
                      
                      return (
                        <div key={step.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCompleted 
                                ? 'bg-emerald-500 text-white' 
                                : isActive 
                                  ? 'bg-[#2563EB] text-white ring-4 ring-blue-100 animate-pulse' 
                                  : 'bg-slate-200 text-slate-500'
                            }`}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            {idx < 4 && (
                              <div className={`w-0.5 h-6 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            )}
                          </div>
                          <div>
                            <h6 className={`text-xs font-bold leading-none ${isActive ? 'text-[#2563EB]' : 'text-slate-800'}`}>
                              {step.label}
                            </h6>
                            <p className="text-[10px] text-slate-400 mt-1">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items in order */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1.5">Makanan & Minuman Anda</span>
                  <div className="divide-y divide-slate-200/50 max-h-36 overflow-y-auto">
                    {activeTrackingOrder.items.map(it => (
                      <div key={it.id} className="py-1.5 flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{it.menuName} <strong className="text-slate-900">x{it.quantity}</strong></span>
                        <span className="font-mono text-slate-500">Rp {it.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center text-xs font-bold text-[#0F172A] font-mono">
                    <span>Total Pembelian</span>
                    <span>Rp {activeTrackingOrder.totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* High-fidelity feedback & Rating Widget if served or done F5-01, F5-02 */}
              {['done', 'served'].includes(activeTrackingOrder.orderStatus) && (
                <div className="border-t border-slate-200 pt-4 mt-4 bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100">
                  <h5 className="font-extrabold text-xs text-[#0F172A] flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Tinggalkan Feedback & Rating</span>
                  </h5>
                  <p className="text-[10px] text-slate-500 mt-1">Dapatkan bonus <strong>+5 Poin Keanggotaan</strong> untuk ulasan Anda.</p>
                  
                  {hasSubmittedRating ? (
                    <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                      <p className="text-xs text-emerald-800 font-bold">Terima Kasih! Ulasan Anda telah disimpan.</p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button 
                            key={s} 
                            type="button" 
                            onClick={() => setRatingStars(s)}
                            className="p-1 focus:outline-none"
                          >
                            <Star className={`w-6 h-6 ${s <= ratingStars ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>

                      <textarea
                        placeholder="Rasa kopi mantap, masakan bergizi..."
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 h-16 resize-none"
                      />

                      <button
                        onClick={() => handleSubmitReview(activeTrackingOrder)}
                        disabled={!ratingComment.trim()}
                        className="w-full py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl disabled:bg-slate-200 disabled:text-slate-400 active:scale-95 transition-all"
                      >
                        Kirim Feedback Bintang
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="flex-1 flex flex-col p-4">
          <div className="flex items-center mb-5">
            <button onClick={() => setActiveTab('home')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 mr-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base font-sans text-slate-900">Profil Membership</h2>
          </div>

          {currentUser ? (
            <div className="space-y-5">
              
              {/* Profile Card */}
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-35">
                  <Sparkles className="w-8 h-8 text-white rotate-12" />
                </div>
                
                <h4 className="font-bold text-sm">{currentUser.name}</h4>
                <p className="text-xs text-indigo-100 font-mono mt-0.5">{currentUser.phone}</p>
                
                <div className="mt-5 pt-3 border-t border-indigo-400/30 flex justify-between items-end">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-indigo-100 font-mono block">Akumulasi Saldo Poin</span>
                    <span className="text-2xl font-black font-mono leading-none">{currentUser.points} <span className="text-xs font-semibold">Poin</span></span>
                  </div>
                  <span className="bg-white/20 text-[9px] font-bold uppercase rounded-full px-2.5 py-1 text-white border border-white/20">
                    MEMBER AKTIF
                  </span>
                </div>
              </div>

              {/* Transactions History list F2-03 */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase mb-2">Riwayat Transaksi</span>
                
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
                  {orders.filter(o => o.userPhone === currentUser.phone).reverse().map(ord => (
                    <div 
                      key={ord.id} 
                      onClick={() => {
                        setTrackingOrderId(ord.id);
                        setActiveTab('tracking');
                      }}
                      className="border border-slate-150 p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer bg-white"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700 font-mono">{ord.orderNumber.slice(-7)}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                            ord.orderStatus === 'served' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : ord.orderStatus === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.orderStatus}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{new Date(ord.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xs text-slate-800 block font-mono">Rp {ord.totalPrice.toLocaleString('id-ID')}</span>
                        <span className="text-[9px] text-[#2563EB] font-bold">+{ord.pointsEarned} Poin</span>
                      </div>
                    </div>
                  ))}

                  {orders.filter(o => o.userPhone === currentUser.phone).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-slate-400 font-mono">Belum ada transaksi.</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => {
                  onSetCurrentUser(null);
                  clearCart();
                  setActiveTab('home');
                  showToast('Keluar dari keanggotaan berhasil.');
                }}
                className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                Keluar Akun (Logout)
              </button>

            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
              <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Anda belum masuk sebagai member.</p>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="mt-4 bg-[#2563EB] text-white text-xs px-4 py-2 rounded-xl font-bold"
              >
                Gabung Sekarang
              </button>
            </div>
          )}
        </div>
      )}

      {/* Append Order Suggestion Modal F1-08 */}
      {showAppendModal && existingOrderToAppend && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl border border-slate-100 modal-appear">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <button onClick={() => setShowAppendModal(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h4 className="font-extrabold text-[#0F172A] font-sans text-sm mt-3">Deteksi Pemesanan Aktif!</h4>
            <p className="text-xs text-slate-500 mt-1">
              Ada pesanan Anda di <strong>Meja {existingOrderToAppend.tableId}</strong> dengan ID <strong>{existingOrderToAppend.orderNumber.slice(-7)}</strong> yang sedang dikerjakan koki.
            </p>

            <div className="mt-4 bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[11px] text-slate-600 max-h-24 overflow-y-auto">
              <strong className="block mb-1 text-slate-700">Daftar item saat ini:</strong>
              {existingOrderToAppend.items.map(it => (
                <div key={it.id}>{it.menuName} x{it.quantity}</div>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => {
                  if (cart.length === 0) {
                    showToast('Tambahkan makanan/minuman ke keranjang Anda terlebih dahulu!');
                  } else {
                    handleAppendToExistingOrder();
                  }
                }}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md"
              >
                Tambah Pesanan Baru ke Pembelian Aktif
              </button>
              
              <button
                onClick={() => setShowAppendModal(false)}
                className="w-full py-2 text-xs font-bold border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 active:scale-95 transition-all"
              >
                Tutup (Buat Pembelian Baru Saja)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Register Modal with simulation WhatsApp OTP F1-03, F1-04 */}
      {showAuthModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl border border-slate-100 modal-appear font-sans text-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h4 className="font-extrabold text-[#0F172A] font-sans text-sm">Masuk / Daftar Member</h4>
              </div>
              <button 
                onClick={() => {
                  setShowAuthModal(false);
                  setOtpSent(false);
                  setOtpCode('');
                  setOtpError('');
                }} 
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <p className="text-[11px] text-slate-500">
                  Daftarkan nomor WhatsApp aktif Anda untuk mengumpulkan poin reward setiap kunjungan di CaffePOS!
                </p>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: Andi Wijaya" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2563EB] h-11"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Nomor WhatsApp</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="Contoh: 0812345678" 
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2563EB] h-11"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md uppercase tracking-wider"
                >
                  Dapatkan Kode OTP WhatsApp
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500">
                  Simulasi pengiriman OTP berhasil! Silakan masukkan kode OTP yang kami kirim: <strong className="text-slate-900 font-mono bg-slate-100 px-1 py-0.5 rounded">2901</strong> untuk memverifikasi.
                </p>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1 font-sans">Kode Verifikasi (OTP)</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan 4 angka OTP" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={4}
                    className="w-full text-center tracking-[12px] font-mono font-bold text-lg p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none h-11"
                  />
                  {otpError && <p className="text-[10px] text-red-500 mt-1 font-mono font-bold">{otpError}</p>}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setOtpSent(false)}
                    className="flex-1 py-2.5 text-xs font-bold border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    className="flex-[2] py-2.5 bg-[#10B981] hover:bg-[#0D9488] text-white text-xs font-extrabold rounded-xl active:scale-95 transition-all shadow-md"
                  >
                    Verifikasi Akun
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulated Midtrans Overlay payment gateway popover F1-09 */}
      {showMidtransOverlay && newlyCreatedOrder && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl w-full modal-slide-up text-slate-705">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1">
                <span className="font-black text-rose-500 tracking-tight skew-x-3 text-sm">MIDTRANS</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 rounded px-1">GATEWAY</span>
              </div>
              <button 
                onClick={() => {
                  setShowMidtransOverlay(false);
                  setNewlyCreatedOrder(null);
                  showToast('Transaksi Midtrans dibatalkan pelanggan.');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-4 space-y-4">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">No Rekening Tujuan / Rincian Tagihan</span>
              <strong className="text-lg font-mono text-slate-900 block leading-none">Rp {newlyCreatedOrder.totalPrice.toLocaleString('id-ID')}</strong>
              
              <div className="flex justify-center gap-2 mb-3">
                <button 
                  onClick={() => setMidtransType('qris')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${midtransType === 'qris' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  SIMULASI QRIS BARCODE
                </button>
                <button 
                  onClick={() => setMidtransType('card')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${midtransType === 'card' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  VIRTUAL BANK TRANSFER
                </button>
              </div>

              {midtransType === 'qris' ? (
                <div className="my-4 inline-block bg-white p-3 border-2 border-[#2563EB] rounded-2xl">
                  {/* Styled QR placeholder */}
                  <div className="w-36 h-36 bg-slate-100 flex flex-col items-center justify-center border border-dashed border-slate-300 relative">
                    <QrCode className="w-24 h-24 text-slate-900" />
                    <span className="absolute bottom-1 bg-rose-500 text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded">QRIS GAN</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">Scan barkode di atas menggunakan uang digital.</p>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl text-left text-xs font-mono border border-slate-150 space-y-2">
                  <div className="flex justify-between">
                    <span>Virtual Account:</span>
                    <strong className="text-slate-900 font-bold">1198539001-BCA</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Diskon Keanggotaan:</span>
                    <strong className="text-emerald-600">-Rp {newlyCreatedOrder.discount.toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleFinishMidtransPayment}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl active:scale-95 transition-all shadow-md uppercase tracking-wider mt-3"
            >
              Simulasikan Status Lunas Sukses ★
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
