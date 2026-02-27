import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';

// SQLite-backed database for BlinkTicket
// Persists in a writable location (BLINK_DB_PATH/BLINK_DB_DIR, workspace data/, or /tmp)

export interface Event {
  id: string;
  name: string;
  description: string;
  source_url?: string;
  poster_url?: string;
  location: string;
  date: string;
  category: string;
  price_sol: number;
  price_usdc: number;
  total_tickets: number;
  available_tickets: number;
  withdrawn_profit_sol?: number;
  organizer_wallet: string;
  organizer_name?: string;
  event_account?: string;
  created_at: string;
}

export interface User {
  id: string;
  wallet_address: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  event_id: string;
  owner_wallet: string;
  purchased_at: string;
  price_paid_sol: number;
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'transfer' | 'resale' | 'event_post' | 'withdraw';
  event_id: string;
  user_wallet: string;
  amount_sol: number;
  status: 'pending' | 'completed' | 'failed' | 'confirmed' | 'finalized';
  created_at: string;
}

type DatabaseShape = {
  events: Event[];
  tickets: Ticket[];
  initialized: boolean;
};

function resolveDbFilePath(): string {
  const explicitPath = process.env.BLINK_DB_PATH?.trim();
  if (explicitPath) {
    try {
      const dbDir = path.dirname(explicitPath);
      fs.mkdirSync(dbDir, { recursive: true });
      fs.accessSync(dbDir, fs.constants.W_OK);
      return explicitPath;
    } catch {
      // continue to directory-based resolution
    }
  }

  const explicitDir = process.env.BLINK_DB_DIR?.trim();
  const cwdDir = path.join(process.cwd(), 'data');
  const tmpDir = path.join('/tmp', 'blinkticket-data');

  const candidates = [explicitDir, cwdDir, tmpDir].filter((candidate): candidate is string => Boolean(candidate));

  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return path.join(dir, 'blink.db');
    } catch {
      // Try next candidate
    }
  }

  return ':memory:';
}

const database: DatabaseShape = {
  events: [],
  tickets: [],
  initialized: false,
};

const DB_FILE_PATH = resolveDbFilePath();
let sqliteDb: sqlite3.Database | null = null;
let initPromise: Promise<void> | null = null;

export function getDbHealth() {
  const mode = DB_FILE_PATH === ':memory:'
    ? 'memory'
    : DB_FILE_PATH.includes('/tmp')
      ? 'tmp'
      : 'file';

  return {
    mode,
    path: DB_FILE_PATH,
    initialized: database.initialized,
    connected: Boolean(sqliteDb),
  };
}

function runSql(query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      reject(new Error('Database not initialized'));
      return;
    }

    sqliteDb.run(query, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        lastID: Number(this.lastID ?? 0),
        changes: Number(this.changes ?? 0),
      });
    });
  });
}

function allSql<T = any>(query: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      reject(new Error('Database not initialized'));
      return;
    }

    sqliteDb.all(query, params, (error, rows: T[]) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows ?? []);
    });
  });
}

function getSql<T = any>(query: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      reject(new Error('Database not initialized'));
      return;
    }

    sqliteDb.get(query, params, (error, row: T) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  });
}

async function initializeDatabase() {
  if (database.initialized && sqliteDb) return;
  if (initPromise) return initPromise;

  initPromise = new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(DB_FILE_PATH, async (openError) => {
      if (openError) {
        if (DB_FILE_PATH !== ':memory:') {
          sqliteDb = new sqlite3.Database(':memory:', async (memoryError) => {
            if (memoryError) {
              reject(memoryError);
              return;
            }

            try {
              await runSql('PRAGMA foreign_keys = ON');
              await runSql(`
                CREATE TABLE IF NOT EXISTS events (
                  id TEXT PRIMARY KEY,
                  name TEXT NOT NULL,
                  description TEXT NOT NULL DEFAULT '',
                  source_url TEXT,
                  poster_url TEXT,
                  location TEXT NOT NULL,
                  date TEXT NOT NULL,
                  category TEXT NOT NULL DEFAULT 'General',
                  price_sol REAL NOT NULL,
                  price_usdc REAL NOT NULL,
                  total_tickets INTEGER NOT NULL,
                  available_tickets INTEGER NOT NULL,
                  withdrawn_profit_sol REAL NOT NULL DEFAULT 0,
                  organizer_wallet TEXT NOT NULL,
                  organizer_name TEXT,
                  event_account TEXT,
                  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
              `);

              await runSql(`
                CREATE TABLE IF NOT EXISTS users (
                  id TEXT PRIMARY KEY,
                  wallet_address TEXT UNIQUE NOT NULL,
                  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
              `);

              await runSql(`
                CREATE TABLE IF NOT EXISTS tickets (
                  id TEXT PRIMARY KEY,
                  event_id TEXT NOT NULL,
                  owner_wallet TEXT NOT NULL,
                  purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  price_paid_sol REAL NOT NULL,
                  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
                )
              `);

              await runSql(`
                CREATE TABLE IF NOT EXISTS transactions (
                  id TEXT PRIMARY KEY,
                  type TEXT NOT NULL,
                  event_id TEXT NOT NULL,
                  user_wallet TEXT NOT NULL,
                  amount_sol REAL NOT NULL,
                  status TEXT NOT NULL,
                  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
                )
              `);

              await runSql('CREATE INDEX IF NOT EXISTS idx_events_category ON events(category)');
              await runSql('CREATE INDEX IF NOT EXISTS idx_tickets_owner_wallet ON tickets(owner_wallet)');
              await runSql('CREATE INDEX IF NOT EXISTS idx_transactions_user_wallet ON transactions(user_wallet)');

              database.initialized = true;
              resolve();
            } catch (schemaError) {
              reject(schemaError);
            }
          });
          return;
        }

        reject(openError);
        return;
      }

      sqliteDb = db;

      try {
        await runSql('PRAGMA foreign_keys = ON');
        await runSql(`
          CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            source_url TEXT,
            poster_url TEXT,
            location TEXT NOT NULL,
            date TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'General',
            price_sol REAL NOT NULL,
            price_usdc REAL NOT NULL,
            total_tickets INTEGER NOT NULL,
            available_tickets INTEGER NOT NULL,
            withdrawn_profit_sol REAL NOT NULL DEFAULT 0,
            organizer_wallet TEXT NOT NULL,
            organizer_name TEXT,
            event_account TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await runSql(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            wallet_address TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await runSql(`
          CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            owner_wallet TEXT NOT NULL,
            purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            price_paid_sol REAL NOT NULL,
            FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
          )
        `);

        await runSql(`
          CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            event_id TEXT NOT NULL,
            user_wallet TEXT NOT NULL,
            amount_sol REAL NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
          )
        `);

        await runSql('CREATE INDEX IF NOT EXISTS idx_events_category ON events(category)');
        await runSql('CREATE INDEX IF NOT EXISTS idx_tickets_owner_wallet ON tickets(owner_wallet)');
        await runSql('CREATE INDEX IF NOT EXISTS idx_transactions_user_wallet ON transactions(user_wallet)');

        database.initialized = true;
        resolve();
      } catch (schemaError) {
        reject(schemaError);
      }
    });
  });

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

export async function dbAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
  await initializeDatabase();
  return allSql<T>(query, params);
}

export async function dbGet<T = any>(query: string, params: any[] = []): Promise<T | undefined> {
  await initializeDatabase();
  return getSql<T>(query, params);
}

export async function dbRun(query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  await initializeDatabase();
  return runSql(query, params);
}

export async function getStats() {
  await initializeDatabase();

  const tickets = await allSql<Ticket>('SELECT * FROM tickets');
  const events = await allSql<Event>('SELECT * FROM events');

  const totalTicketsSold = tickets.length;
  const activeEvents = events.filter((event) => new Date(event.date) > new Date()).length;
  const activeUsers = new Set(tickets.map((ticket) => ticket.owner_wallet)).size;
  const totalRevenueSol = tickets.reduce((sum, ticket) => sum + Number(ticket.price_paid_sol), 0);

  return {
    totalTicketsSold,
    activeEvents,
    activeUsers,
    totalRevenueSol: parseFloat(totalRevenueSol.toFixed(2)),
    platformFees: 0,
  };
}
