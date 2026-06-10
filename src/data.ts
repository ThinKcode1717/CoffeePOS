/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, Table, Banner, Order, Review, User, Ingredient } from './types';

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing_kopi', name: 'Biji Kopi Arabika', stock: 2500, unit: 'gram', minStock: 500, costPerUnit: 250 },
  { id: 'ing_susu', name: 'Susu Full Cream Liquid', stock: 6000, unit: 'ml', minStock: 1000, costPerUnit: 20 },
  { id: 'ing_caramel', name: 'Sirup Caramel Premium', stock: 1000, unit: 'ml', minStock: 200, costPerUnit: 120 },
  { id: 'ing_matcha', name: 'Uji Matcha Powder', stock: 500, unit: 'gram', minStock: 100, costPerUnit: 1500 },
  { id: 'ing_patty', name: 'Premium Beef Patty', stock: 20, unit: 'pcs', minStock: 5, costPerUnit: 14000 },
  { id: 'ing_bun', name: 'Brioche Burger Bun', stock: 0, unit: 'pcs', minStock: 5, costPerUnit: 3000 }, // Started at 0 for out-of-stock demo!
  { id: 'ing_croissant', name: 'Butter Croissant Roll', stock: 1, unit: 'pcs', minStock: 4, costPerUnit: 8000 }, // Only 1 left!
  { id: 'ing_fries', name: 'French Fries Cut', stock: 3000, unit: 'gram', minStock: 1000, costPerUnit: 15 },
  { id: 'ing_truffle', name: 'Parmesan Truffle Oil', stock: 200, unit: 'ml', minStock: 50, costPerUnit: 400 },
  { id: 'ing_spaghetti', name: 'Pasta Spaghetti Dry', stock: 2000, unit: 'gram', minStock: 500, costPerUnit: 12 },
  { id: 'ing_cream', name: 'Carbonara Cream Sauce', stock: 1500, unit: 'ml', minStock: 500, costPerUnit: 25 },
  { id: 'ing_tea', name: 'Premium Jasmine Tea Bag', stock: 60, unit: 'pcs', minStock: 15, costPerUnit: 1000 },
  { id: 'ing_peach', name: 'Peach Concentrate Syrup', stock: 800, unit: 'ml', minStock: 200, costPerUnit: 100 }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Espresso Latte Macchiato',
    category: 'beverage',
    price: 32000,
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    recipe: [
      { ingredientId: 'ing_kopi', quantity: 15 },
      { ingredientId: 'ing_susu', quantity: 200 }
    ]
  },
  {
    id: 'm2',
    name: 'Ice Salted Caramel Latte',
    category: 'beverage',
    price: 36000,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    recipe: [
      { ingredientId: 'ing_kopi', quantity: 15 },
      { ingredientId: 'ing_susu', quantity: 200 },
      { ingredientId: 'ing_caramel', quantity: 20 }
    ]
  },
  {
    id: 'm3',
    name: 'Dirty Matcha Espresso',
    category: 'beverage',
    price: 38000,
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    recipe: [
      { ingredientId: 'ing_kopi', quantity: 15 },
      { ingredientId: 'ing_susu', quantity: 150 },
      { ingredientId: 'ing_matcha', quantity: 10 }
    ]
  },
  {
    id: 'm4',
    name: 'Signature Beef Burger Trio',
    category: 'food',
    price: 58000,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    recipe: [
      { ingredientId: 'ing_patty', quantity: 1 },
      { ingredientId: 'ing_bun', quantity: 1 }
    ]
  },
  {
    id: 'm5',
    name: 'Truffle Fries with Parmesan',
    category: 'snack',
    price: 28000,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    recipe: [
      { ingredientId: 'ing_fries', quantity: 150 },
      { ingredientId: 'ing_truffle', quantity: 5 }
    ]
  },
  {
    id: 'm6',
    name: 'Nutella Croissant Toast',
    category: 'snack',
    price: 26000,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    recipe: [
      { ingredientId: 'ing_croissant', quantity: 1 }
    ]
  },
  {
    id: 'm7',
    name: 'Carbonara Cream Spaghetti',
    category: 'food',
    price: 48000,
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    recipe: [
      { ingredientId: 'ing_spaghetti', quantity: 100 },
      { ingredientId: 'ing_cream', quantity: 100 }
    ]
  },
  {
    id: 'm8',
    name: 'Peach Blossom Iced Tea',
    category: 'beverage',
    price: 22000,
    imageUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    recipe: [
      { ingredientId: 'ing_tea', quantity: 1 },
      { ingredientId: 'ing_peach', quantity: 20 }
    ]
  }
];

export const INITIAL_TABLES: Table[] = [
  { id: 'T01', tableNumber: 'T01', area: 'Indoor', status: 'available' },
  { id: 'T02', tableNumber: 'T02', area: 'Indoor', status: 'available' },
  { id: 'T03', tableNumber: 'T03', area: 'Indoor', status: 'occupied' },
  { id: 'T04', tableNumber: 'T04', area: 'Outdoor', status: 'available' },
  { id: 'T05', tableNumber: 'T05', area: 'Outdoor', status: 'available' },
  { id: 'T06', tableNumber: 'T06', area: 'Outdoor', status: 'reserved' },
];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'b1',
    title: 'Diskon Member Baru 15%',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
    description: 'Dapatkan potongan harga khusus transaksi pertamamu setelah login WhatsApp OTP.',
    discountPercent: 15,
    active: true,
  },
  {
    id: 'b2',
    title: 'Matcha Blossom Fever',
    imageUrl: 'https://images.unsplash.com/photo-1515694590185-73647ba02c10?auto=format&fit=crop&q=80&w=800',
    description: 'Rasakan kesegaran Dirty Matcha Espresso kami, beli 2 diskon 10.000.',
    active: true,
  },
];

export const INITIAL_MEMBERS: User[] = [
  {
    id: 'u1',
    phone: '081234567890',
    name: 'Andi Wijaya',
    role: 'member',
    points: 45,
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'u2',
    phone: '085712345678',
    name: 'Siti Rahma',
    role: 'member',
    points: 120,
    createdAt: '2026-05-15T14:30:00Z',
  },
  {
    id: 'u3',
    phone: '081987654321',
    name: 'Budi Santoso',
    role: 'member',
    points: 18,
    createdAt: '2026-05-20T08:15:00Z',
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord1',
    orderNumber: 'ORD-20260610-001',
    tableId: 'T03',
    userId: 'u1',
    userName: 'Andi Wijaya',
    userPhone: '081234567890',
    totalPrice: 124000,
    discount: 15000,
    pointsUsed: 0,
    pointsEarned: 12,
    paymentMethod: 'midtrans',
    paymentStatus: 'paid',
    orderStatus: 'preparing',
    createdAt: '2026-06-10T05:15:00Z',
    items: [
      {
        id: 'oi1',
        menuId: 'm4',
        menuName: 'Signature Beef Burger Trio',
        quantity: 1,
        price: 58000,
        subtotal: 58000,
      },
      {
        id: 'oi2',
        menuId: 'm1',
        menuName: 'Espresso Latte Macchiato',
        quantity: 1,
        price: 32000,
        subtotal: 32000,
      },
      {
        id: 'oi3',
        menuId: 'm3',
        menuName: 'Dirty Matcha Espresso',
        quantity: 1,
        price: 38000,
        subtotal: 38000,
      },
    ],
  },
  {
    id: 'ord2',
    orderNumber: 'ORD-20260610-002',
    tableId: 'T01',
    userId: 'u2',
    userName: 'Siti Rahma',
    userPhone: '085712345678',
    totalPrice: 58000,
    discount: 0,
    pointsUsed: 30, // 30k discount
    pointsEarned: 5,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    orderStatus: 'new',
    createdAt: '2026-06-10T05:32:00Z',
    items: [
      {
        id: 'oi4',
        menuId: 'm7',
        menuName: 'Carbonara Cream Spaghetti',
        quantity: 1,
        price: 48000,
        subtotal: 48000,
      },
      {
        id: 'oi5',
        menuId: 'm8',
        menuName: 'Peach Blossom Iced Tea',
        quantity: 1,
        price: 22000,
        subtotal: 22000,
      },
    ],
  },
  {
    id: 'ord3',
    orderNumber: 'ORD-20260609-020',
    tableId: 'T02',
    userId: 'u3',
    userName: 'Budi Santoso',
    userPhone: '081987654321',
    totalPrice: 54000,
    discount: 0,
    pointsUsed: 0,
    pointsEarned: 5,
    paymentMethod: 'midtrans',
    paymentStatus: 'paid',
    orderStatus: 'served',
    createdAt: '2026-06-09T18:45:00Z',
    items: [
      {
        id: 'oi6',
        menuId: 'm5',
        menuName: 'Truffle Fries with Parmesan',
        quantity: 1,
        price: 28000,
        subtotal: 28000,
      },
      {
        id: 'oi7',
        menuId: 'm6',
        menuName: 'Nutella Croissant Toast',
        quantity: 1,
        price: 26000,
        subtotal: 26000,
      },
    ],
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r1',
    orderId: 'ord3',
    userId: 'u3',
    userName: 'Budi Santoso',
    orderNumber: 'ORD-20260609-020',
    rating: 5,
    comment: 'Croissant Nutella-nya renyah banget, truffle fries gurih mantap! Kopinya top, pelayanan cepat sekali.',
    isHidden: false,
    createdAt: '2026-06-09T19:15:00Z',
  },
];

// Historical sales metrics to populate the line chart for last 7 days
export const HISTORICAL_SALES = [
  { date: '04 Juni', sales: 1200000, transactions: 24, average: 50000 },
  { date: '05 Juni', sales: 1450000, transactions: 28, average: 51785 },
  { date: '06 Juni', sales: 1890000, transactions: 35, average: 54000 },
  { date: '07 Juni', sales: 2100000, transactions: 42, average: 50000 },
  { date: '08 Juni', sales: 1650000, transactions: 30, average: 55000 },
  { date: '09 Juni', sales: 2400000, transactions: 49, average: 48979 },
  { date: '10 Juni', sales: 785000, transactions: 15, average: 52333 },
];
