/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MenuCategory = 'food' | 'beverage' | 'snack';
export type TableStatus = 'available' | 'occupied' | 'reserved';
export type UserRole = 'admin' | 'cashier' | 'kitchen' | 'member' | 'stock_keeper';
export type PaymentMethod = 'midtrans' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'done' | 'served' | 'cancelled';

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
}

export interface MenuItemRecipeItem {
  ingredientId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  recipe?: MenuItemRecipeItem[];
}

export interface Table {
  id: string; // T01, T02 etc.
  tableNumber: string;
  area: 'Indoor' | 'Outdoor';
  status: TableStatus;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  points: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  menuId: string;
  menuName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string; // Table ID
  userId: string; // Customer Member ID (if logged in)
  userName: string; // Guest or Member name
  userPhone: string; // Guest or Member phone
  totalPrice: number;
  discount: number;
  pointsUsed: number;
  pointsEarned: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  rating?: number;
  comment?: string;
}

export interface Review {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  orderNumber: string;
  rating: number; // 1 to 5
  comment: string;
  isHidden: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  discountPercent?: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
}

export interface LoyaltyRule {
  pointsPerTenThousand: number; // 1 point per 10k by default
  rewardPointsThreshold: number; // threshold for direct discount
  rewardDiscountValue: number; // value of points in Rp (e.g. 1 point = Rp1,000)
}

export interface CartItem {
  id: string; // same as menuId
  menuItem: MenuItem;
  quantity: number;
}
