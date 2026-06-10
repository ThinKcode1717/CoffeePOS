/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { ChefHat, Clock, AlertCircle, Check, Play, CheckCircle2, User } from 'lucide-react';

interface KitchenViewProps {
  orders: Order[];
  onUpdateOrderStatus: (id: string, nextStatus: OrderStatus) => void;
}

export default function KitchenView({ orders, onUpdateOrderStatus }: KitchenViewProps) {
  // Kitchen is highly interested in 'new', 'accepted', and 'preparing' orders
  const activeOrders = orders.filter(o => ['new', 'accepted', 'preparing', 'done'].includes(o.orderStatus));
  
  // Checking list items in each order to let kitchen staff cross them off
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  const toggleItemComplete = (itemId: string) => {
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getOrderStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'bg-rose-100 text-rose-700 font-bold border border-rose-200';
      case 'accepted': return 'bg-blue-100 text-blue-700 font-bold border border-blue-200';
      case 'preparing': return 'bg-amber-100 text-amber-700 font-bold border border-amber-200';
      case 'done': return 'bg-emerald-100 text-emerald-700 font-bold border border-emerald-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getNextAction = (status: OrderStatus) => {
    switch (status) {
      case 'new': return { label: 'Terima Pesanan', next: 'accepted' as OrderStatus, icon: Play, color: 'bg-indigo-600 hover:bg-indigo-700 text-white' };
      case 'accepted': return { label: 'Mulai Masak', next: 'preparing' as OrderStatus, icon: ChefHat, color: 'bg-amber-500 hover:bg-amber-600 text-white' };
      case 'preparing': return { label: 'Selesai Masak', next: 'done' as OrderStatus, icon: CheckCircle2, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' };
      case 'done': return { label: 'Sajikan Ke Meja', next: 'served' as OrderStatus, icon: Check, color: 'bg-slate-700 hover:bg-slate-800 text-white' };
      default: return null;
    }
  };

  return (
    <div id="kitchen-display" className="w-full bg-[#0F172A] text-slate-100 rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col font-sans max-h-[880px] overflow-y-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
            <ChefHat className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Dapur / Kitchen Display System</h2>
            <p className="text-xs text-slate-400 font-mono">Real-time order ticket monitoring</p>
          </div>
        </div>

        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block animate-ping" />
            <span>{activeOrders.length} Antrian Aktif</span>
          </div>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <Check className="w-12 h-12 text-slate-600 mb-2" />
          <h4 className="text-sm font-bold text-slate-400 font-sans">Semua Pesanan Bersih!</h4>
          <p className="text-xs text-slate-500 mt-0.5">Tidak ada makanan atau minuman dalam antrian dapur sekarang.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeOrders.map(order => {
            const actionInfo = getNextAction(order.orderStatus);
            const totalRemaining = order.items.filter(item => !completedItems[item.id]).length;

            return (
              <div 
                key={order.id} 
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md relative"
              >
                {/* Visual side highlights */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl ${
                  order.orderStatus === 'new' 
                    ? 'bg-rose-500 animate-pulse' 
                    : order.orderStatus === 'accepted'
                      ? 'bg-blue-500'
                      : order.orderStatus === 'preparing'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                }`} />

                <div className="pl-2">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-3">
                    <div>
                      <span className="text-[32px] font-black font-sans leading-none text-[#FFFFFFA8] block">Meja {order.tableId}</span>
                      <span className="text-[10px] text-slate-400 block font-mono mt-1">{order.orderNumber.slice(-7)} • {new Date(order.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${getOrderStatusBadgeColor(order.orderStatus)}`}>
                      {order.orderStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {order.items.map(item => {
                      const isChecked = !!completedItems[item.id];
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => toggleItemComplete(item.id)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                            isChecked 
                              ? 'bg-emerald-950/25 border border-emerald-900/40 text-slate-500 line-through' 
                              : 'bg-slate-850 hover:bg-slate-800 text-slate-100 border border-slate-800/80'
                          }`}
                        >
                          <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                            isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600 bg-transparent'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 text-xs">
                            <span className="font-bold text-slate-300">[{item.quantity}x]</span> {item.menuName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer buttons for Kitchen */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between pl-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Timer: {Math.max(1, Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000))} m</span>
                  </div>

                  {actionInfo && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, actionInfo.next)}
                      className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${actionInfo.color}`}
                    >
                      <actionInfo.icon className="w-3.5 h-3.5" />
                      <span>{actionInfo.label}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
