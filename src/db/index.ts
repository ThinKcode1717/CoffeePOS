/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.ts';

let connectionString = process.env.DATABASE_URL;

if (connectionString) {
  // Clean Whitespace, Newlines, Carriage Returns, and Outer Quotes
  connectionString = connectionString.trim().replace(/^['"]|['"]$/g, '').trim();
  console.log(`[Neon DB Connection] Cleaned connection string length: ${connectionString.length}`);
}

if (!connectionString) {
  // Graceful fallback helper if DATABASE_URL is not set yet in development
  console.warn("WARNING: DATABASE_URL is not set. Neon database connection is disabled.");
}

// Lazy initialization or standard setup
export const sql = connectionString ? neon(connectionString) : null;
export const db = sql ? drizzle(sql, { schema }) : null;
