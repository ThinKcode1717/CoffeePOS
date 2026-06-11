/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

import { db } from './src/db/index.ts';
import { sql as drizzleSql } from 'drizzle-orm';
import {
  ingredients,
  menuItems,
  tables,
  users,
  orders,
  reviews,
  banners,
  loyaltyRule
} from './src/db/schema.ts';

import {
  INITIAL_INGREDIENTS,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_MEMBERS,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
  INITIAL_BANNERS
} from './src/data.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[CaffePOS Server] ${req.method} ${req.url}`);
  next();
});

// Initialize Schema dynamically
async function initializeSchema() {
  if (!db) {
    console.log('[Schema] Database connection is not available. Skipping schema creation.');
    return;
  }

  try {
    console.log('[Schema] Checking / creating tables dynamically...');

    // 1. ingredients
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        stock DOUBLE PRECISION NOT NULL,
        unit TEXT NOT NULL,
        min_stock DOUBLE PRECISION NOT NULL,
        cost_per_unit DOUBLE PRECISION NOT NULL
      )
    `);

    // 2. menu_items
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        image_url TEXT NOT NULL,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        recipe JSONB
      )
    `);

    // 3. tables
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        table_number TEXT NOT NULL,
        area TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `);

    // 4. users
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        points DOUBLE PRECISION NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 5. orders
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL,
        table_id TEXT NOT NULL,
        user_id TEXT,
        user_name TEXT NOT NULL,
        user_phone TEXT NOT NULL,
        total_price DOUBLE PRECISION NOT NULL,
        discount DOUBLE PRECISION NOT NULL DEFAULT 0,
        points_used DOUBLE PRECISION NOT NULL DEFAULT 0,
        points_earned DOUBLE PRECISION NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        order_status TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        items JSONB NOT NULL,
        rating INTEGER,
        comment TEXT
      )
    `);

    // 6. reviews
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        order_number TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 7. banners
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS banners (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        image_url TEXT NOT NULL,
        description TEXT NOT NULL,
        discount_percent INTEGER,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        start_date TEXT,
        end_date TEXT
      )
    `);

    // 8. loyalty_rule
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS loyalty_rule (
        id TEXT PRIMARY KEY,
        points_per_ten_thousand DOUBLE PRECISION NOT NULL,
        reward_points_threshold DOUBLE PRECISION NOT NULL,
        reward_discount_value DOUBLE PRECISION NOT NULL
      )
    `);

    console.log('[Schema] Tables verified/created successfully.');
  } catch (error) {
    console.error('[Schema] Error creating tables automatically:', error);
  }
}

// Seed database helper if connected and empty
async function seedDatabaseIfEmpty() {
  if (!db) {
    console.log('[Seed] Database connection is not available. Skipping seeding.');
    return;
  }

  try {
    console.log('[Seed] Checking if tables need seeding...');

    // 1. Ingredients
    const existingIngredients = await db.select().from(ingredients).limit(1);
    if (existingIngredients.length === 0) {
      console.log('[Seed] Seeding ingredients...');
      await db.insert(ingredients).values(INITIAL_INGREDIENTS);
    }

    // 2. Menu Items
    const existingMenuItems = await db.select().from(menuItems).limit(1);
    if (existingMenuItems.length === 0) {
      console.log('[Seed] Seeding menu items...');
      await db.insert(menuItems).values(
        INITIAL_MENU_ITEMS.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          imageUrl: item.imageUrl,
          isAvailable: item.isAvailable,
          recipe: item.recipe || [],
        }))
      );
    }

    // 3. Tables
    const existingTables = await db.select().from(tables).limit(1);
    if (existingTables.length === 0) {
      console.log('[Seed] Seeding tables...');
      await db.insert(tables).values(INITIAL_TABLES);
    }

    // 4. Users (Members)
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log('[Seed] Seeding users/members...');
      await db.insert(users).values(
        INITIAL_MEMBERS.map(m => ({
          id: m.id,
          phone: m.phone,
          name: m.name,
          role: m.role,
          points: m.points,
          createdAt: new Date(m.createdAt),
        }))
      );
    }

    // 5. Orders
    const existingOrders = await db.select().from(orders).limit(1);
    if (existingOrders.length === 0) {
      console.log('[Seed] Seeding orders...');
      await db.insert(orders).values(
        INITIAL_ORDERS.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          tableId: o.tableId,
          userId: o.userId || null,
          userName: o.userName,
          userPhone: o.userPhone,
          totalPrice: o.totalPrice,
          discount: o.discount,
          pointsUsed: o.pointsUsed,
          pointsEarned: o.pointsEarned,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          orderStatus: o.orderStatus,
          createdAt: new Date(o.createdAt),
          items: o.items,
          rating: o.rating || null,
          comment: o.comment || null,
        }))
      );
    }

    // 6. Reviews
    const existingReviews = await db.select().from(reviews).limit(1);
    if (existingReviews.length === 0) {
      console.log('[Seed] Seeding reviews...');
      await db.insert(reviews).values(
        INITIAL_REVIEWS.map(r => ({
          id: r.id,
          orderId: r.orderId,
          userId: r.userId,
          userName: r.userName,
          orderNumber: r.orderNumber,
          rating: r.rating,
          comment: r.comment,
          isHidden: r.isHidden,
          createdAt: new Date(r.createdAt),
        }))
      );
    }

    // 7. Banners
    const existingBanners = await db.select().from(banners).limit(1);
    if (existingBanners.length === 0) {
      console.log('[Seed] Seeding banners...');
      await db.insert(banners).values(INITIAL_BANNERS);
    }

    // 8. Loyalty Rule
    const existingLoyalty = await db.select().from(loyaltyRule).limit(1);
    if (existingLoyalty.length === 0) {
      console.log('[Seed] Seeding default loyalty rules...');
      await db.insert(loyaltyRule).values({
        id: 'current',
        pointsPerTenThousand: 1, // 1 point per Rp 10.000 spent
        rewardPointsThreshold: 10, // 10 points threshold
        rewardDiscountValue: 1000 // 1 point = 1000 Rp discount
      });
    }

    console.log('[Seed] Neon database seeded successfully!');
  } catch (error) {
    console.error('[Seed] Database seeding failed:', error);
  }
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// General Database Status Info
app.get('/api/db-status', (req, res) => {
  res.json({
    connected: !!db,
    provider: 'Neon Serverless PostgreSQL',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    message: db 
      ? 'Terhubung dengan database serverless Neon!' 
      : 'Berjalan dalam Mode Offline Demo (DATABASE_URL belum diatur).'
  });
});

// --- INGREDIENTS ARIS ---
app.get('/api/ingredients', async (req, res) => {
  try {
    if (!db) return res.json(INITIAL_INGREDIENTS);
    const result = await db.select().from(ingredients);
    res.json(result);
  } catch (error: any) {
    console.error('Failed to get ingredients:', error);
    res.json(INITIAL_INGREDIENTS); // Fallback so app doesn't crash
  }
});

app.post('/api/ingredients', async (req, res) => {
  try {
    if (!db) {
      return res.status(200).json({ success: true, message: 'Offline mode simulation' });
    }
    const { id, name, stock, unit, minStock, costPerUnit } = req.body;
    
    // Check if food ingredient exists
    const existing = await db.select().from(ingredients).where(eq(ingredients.id, id));
    if (existing.length > 0) {
      await db.update(ingredients)
        .set({ name, stock, unit, minStock, costPerUnit })
        .where(eq(ingredients.id, id));
    } else {
      await db.insert(ingredients).values({ id, name, stock, unit, minStock, costPerUnit });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MENU ITEMS ---
app.get('/api/menu-items', async (req, res) => {
  try {
    if (!db) return res.json(INITIAL_MENU_ITEMS);
    const result = await db.select().from(menuItems);
    res.json(result);
  } catch (error: any) {
    console.error('Failed to get menu-items:', error);
    res.json(INITIAL_MENU_ITEMS);
  }
});

app.post('/api/menu-items', async (req, res) => {
  try {
    if (!db) return res.json({ success: true });
    const { id, name, category, price, imageUrl, isAvailable, recipe } = req.body;
    const existing = await db.select().from(menuItems).where(eq(menuItems.id, id));
    if (existing.length > 0) {
      await db.update(menuItems)
        .set({ name, category, price, imageUrl, isAvailable, recipe })
        .where(eq(menuItems.id, id));
    } else {
      await db.insert(menuItems).values({ id, name, category, price, imageUrl, isAvailable, recipe });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menu-items/:id', async (req, res) => {
  try {
    if (!db) return res.json({ success: true });
    await db.delete(menuItems).where(eq(menuItems.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TABLES ---
app.get('/api/tables', async (req, res) => {
  try {
    if (!db) return res.json(INITIAL_TABLES);
    const result = await db.select().from(tables);
    res.json(result);
  } catch (err) {
    res.json(INITIAL_TABLES);
  }
});

app.post('/api/tables', async (req, res) => {
  try {
    if (!db) return res.json({ success: true });
    const { id, tableNumber, area, status } = req.body;
    const existing = await db.select().from(tables).where(eq(tables.id, id));
    if (existing.length > 0) {
      await db.update(tables)
        .set({ tableNumber, area, status })
        .where(eq(tables.id, id));
    } else {
      await db.insert(tables).values({ id, tableNumber, area, status });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MEMBERS (USERS) ---
app.get('/api/users', async (req, res) => {
  try {
    if (!db) return res.json(INITIAL_MEMBERS);
    const result = await db.select().from(users);
    res.json(result);
  } catch (err) {
    res.json(INITIAL_MEMBERS);
  }
});

app.post('/api/users/upsert', async (req, res) => {
  try {
    if (!db) return res.json({ success: true });
    const { id, name, phone, role, points } = req.body;
    const existing = await db.select().from(users).where(eq(users.id, id));
    if (existing.length > 0) {
      await db.update(users)
        .set({ name, phone, role, points })
        .where(eq(users.id, id));
    } else {
      await db.insert(users).values({
        id,
        name,
        phone,
        role: role || 'member',
        points: points || 0,
        createdAt: new Date(),
      });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ORDERS ---
app.get('/api/orders', async (req, res) => {
  try {
    if (!db) return res.json(INITIAL_ORDERS);
    const result = await db.select().from(orders);
    const formatted = result.map(o => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      items: o.items as any[],
    }));
    res.json(formatted);
  } catch (err) {
    res.json(INITIAL_ORDERS);
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    if (!db) return res.json({ success: true, id: req.body.id });
    const o = req.body;
    await db.insert(orders).values({
      id: o.id,
      orderNumber: o.orderNumber,
      tableId: o.tableId,
      userId: o.userId || null,
      userName: o.userName,
      userPhone: o.userPhone,
      totalPrice: o.totalPrice,
      discount: o.discount,
      pointsUsed: o.pointsUsed,
      pointsEarned: o.pointsEarned,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      createdAt: new Date(o.createdAt),
      items: o.items,
      rating: o.rating || null,
      comment: o.comment || null,
    });
    res.json({ success: true, id: o.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    if (db) {
      await db.update(orders).set({ orderStatus }).where(eq(orders.id, id));
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders/:id/confirm-payment', async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.update(orders).set({ paymentStatus: 'paid' }).where(eq(orders.id, id));
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- REVIEWS ---
app.get('/api/reviews', async (req, res) => {
  try {
    if (!db) return res.json(INITIAL_REVIEWS);
    const result = await db.select().from(reviews);
    const formatted = result.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
    res.json(formatted);
  } catch (err) {
    res.json(INITIAL_REVIEWS);
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    if (!db) return res.json({ success: true });
    const r = req.body;
    await db.insert(reviews).values({
      id: r.id,
      orderId: r.orderId,
      userId: r.userId,
      userName: r.userName,
      orderNumber: r.orderNumber,
      rating: r.rating,
      comment: r.comment,
      isHidden: r.isHidden || false,
      createdAt: new Date(r.createdAt),
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews/:id/toggle-hide', async (req, res) => {
  try {
    const { id } = req.params;
    const { isHidden } = req.body;
    if (db) {
      await db.update(reviews).set({ isHidden }).where(eq(reviews.id, id));
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- BANNERS ---
app.get('/api/banners', async (req, res) => {
  try {
    if (!db) return res.json(INITIAL_BANNERS);
    const result = await db.select().from(banners);
    res.json(result);
  } catch (err) {
    res.json(INITIAL_BANNERS);
  }
});

// --- LOYALTY RULE ---
app.get('/api/loyalty-rule', async (req, res) => {
  try {
    if (!db) return res.json({
      pointsPerTenThousand: 1,
      rewardPointsThreshold: 10,
      rewardDiscountValue: 1000
    });
    const result = await db.select().from(loyaltyRule).limit(1);
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json({
        pointsPerTenThousand: 1,
        rewardPointsThreshold: 10,
        rewardDiscountValue: 1000
      });
    }
  } catch (err) {
    res.json({
      pointsPerTenThousand: 1,
      rewardPointsThreshold: 10,
      rewardDiscountValue: 1000
    });
  }
});

// -------------------------------------------------------------
// VITE OR STATIC ASSETS SERVING MIDDLEWARE
// -------------------------------------------------------------
async function bootstrapServer() {
  await initializeSchema();
  await seedDatabaseIfEmpty();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CaffePOS Server] Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrapServer();
