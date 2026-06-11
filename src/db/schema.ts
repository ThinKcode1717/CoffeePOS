/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { pgTable, text, integer, boolean, doublePrecision, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const ingredients = pgTable('ingredients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  stock: doublePrecision('stock').notNull(),
  unit: text('unit').notNull(),
  minStock: doublePrecision('min_stock').notNull(),
  costPerUnit: doublePrecision('cost_per_unit').notNull(),
});

export const menuItems = pgTable('menu_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // food, beverage, snack
  price: doublePrecision('price').notNull(),
  imageUrl: text('image_url').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  recipe: jsonb('recipe'), // array of { ingredientId: string, quantity: number }
});

export const tables = pgTable('tables', {
  id: text('id').primaryKey(),
  tableNumber: text('table_number').notNull(),
  area: text('area').notNull(), // Indoor, Outdoor
  status: text('status').notNull(), // available, occupied, reserved
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // admin, cashier, kitchen, member, stock_keeper
  points: doublePrecision('points').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull(),
  tableId: text('table_id').notNull(),
  userId: text('user_id'),
  userName: text('user_name').notNull(),
  userPhone: text('user_phone').notNull(),
  totalPrice: doublePrecision('total_price').notNull(),
  discount: doublePrecision('discount').notNull().default(0),
  pointsUsed: doublePrecision('points_used').notNull().default(0),
  pointsEarned: doublePrecision('points_earned').notNull().default(0),
  paymentMethod: text('payment_method').notNull(), // midtrans, cash
  paymentStatus: text('payment_status').notNull(), // pending, paid, failed
  orderStatus: text('order_status').notNull(), // new, accepted, preparing, done, served, cancelled
  createdAt: timestamp('created_at').notNull().defaultNow(),
  items: jsonb('items').notNull(), // stores OrderItem[] array
  rating: integer('rating'),
  comment: text('comment'),
});

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  orderNumber: text('order_number').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  isHidden: boolean('is_hidden').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const banners = pgTable('banners', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  description: text('description').notNull(),
  discountPercent: integer('discount_percent'),
  active: boolean('active').notNull().default(true),
  startDate: text('start_date'),
  endDate: text('end_date'),
});

export const loyaltyRule = pgTable('loyalty_rule', {
  id: text('id').primaryKey(), // 'current'
  pointsPerTenThousand: doublePrecision('points_per_ten_thousand').notNull(),
  rewardPointsThreshold: doublePrecision('reward_points_threshold').notNull(),
  rewardDiscountValue: doublePrecision('reward_discount_value').notNull(),
});
