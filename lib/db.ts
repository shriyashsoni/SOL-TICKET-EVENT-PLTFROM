import fs from 'node:fs';
import path from 'node:path';

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
  users: User[];
  tickets: Ticket[];
  transactions: Transaction[];
  initialized: boolean;
};

function resolveDbFilePath(): string {
  const isReadOnlyRuntimePath = (targetPath: string) => targetPath.startsWith('/var/task');

  const isServerlessRuntime =
    process.env.VERCEL === '1'
    || process.env.AWS_LAMBDA_FUNCTION_NAME
    || process.env.NEXT_RUNTIME === 'nodejs';

  const tmpDir = path.join('/tmp', 'blinkticket-data');

  if (isServerlessRuntime) {
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.accessSync(tmpDir, fs.constants.W_OK);
      return path.join(tmpDir, 'blink.db');
    } catch {
      // fallback to other candidates
    }
  }

  const explicitPath = process.env.BLINK_DB_PATH?.trim();
  if (explicitPath && !isReadOnlyRuntimePath(explicitPath)) {
    try {
      const dbDir = path.dirname(explicitPath);
      if (isReadOnlyRuntimePath(dbDir)) {
        throw new Error('Read-only DB path');
      }
      fs.mkdirSync(dbDir, { recursive: true });
      fs.accessSync(dbDir, fs.constants.W_OK);
      return explicitPath;
    } catch {
      // continue to directory-based resolution
    }
  }

  const explicitDir = process.env.BLINK_DB_DIR?.trim();
  const cwdDir = path.join(process.cwd(), 'data');

  const candidates = [explicitDir, cwdDir, tmpDir].filter((candidate): candidate is string => Boolean(candidate));

  for (const dir of candidates) {
    if (isReadOnlyRuntimePath(dir)) {
      continue;
    }

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
  users: [],
  tickets: [],
  transactions: [],
  initialized: false,
};

const DB_FILE_PATH = resolveDbFilePath();
const FALLBACK_JSON_PATH = DB_FILE_PATH === ':memory:'
  ? path.join('/tmp', 'blinkticket-data', 'blink-fallback.json')
  : path.join(path.dirname(DB_FILE_PATH), 'blink-fallback.json');
let sqliteDb: any = null;
let initPromise: Promise<void> | null = null;
let usingMemoryFallback = false;

function loadFallbackFromDisk() {
  try {
    const dir = path.dirname(FALLBACK_JSON_PATH);
    fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(FALLBACK_JSON_PATH)) {
      database.events = [];
      database.users = [];
      database.tickets = [];
      database.transactions = [];
      return;
    }

    const raw = fs.readFileSync(FALLBACK_JSON_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseShape>;
    database.events = Array.isArray(parsed.events) ? parsed.events : [];
    database.users = Array.isArray(parsed.users) ? parsed.users : [];
    database.tickets = Array.isArray(parsed.tickets) ? parsed.tickets : [];
    database.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
  } catch {
    database.events = [];
    database.users = [];
    database.tickets = [];
    database.transactions = [];
  }
}

function persistFallbackToDisk() {
  if (!usingMemoryFallback) return;

  try {
    const dir = path.dirname(FALLBACK_JSON_PATH);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      FALLBACK_JSON_PATH,
      JSON.stringify(
        {
          events: database.events,
          users: database.users,
          tickets: database.tickets,
          transactions: database.transactions,
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch {
    // keep runtime data even if persistence fails
  }
}

function activateMemoryFallback() {
  usingMemoryFallback = true;
  sqliteDb = null;
  loadFallbackFromDisk();
  database.initialized = true;
}

export function getDbHealth() {
  const mode = usingMemoryFallback
    ? 'memory-fallback'
    : DB_FILE_PATH === ':memory:'
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

    sqliteDb.run(query, params, function onRun(this: { lastID?: number; changes?: number }, error: Error | null) {
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

    sqliteDb.all(query, params, (error: Error | null, rows: T[]) => {
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

    sqliteDb.get(query, params, (error: Error | null, row: T) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  });
}

function memoryDbAll<T = any>(query: string, params: any[] = []): T[] {
  if (query.includes('SELECT * FROM events')) {
    let events = [...database.events] as any[];

    if (query.includes('WHERE category = ?')) {
      events = events.filter((event) => event.category === params[0]);
    }

    if (query.includes('WHERE id = ?')) {
      events = events.filter((event) => event.id === params[0]);
    }

    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return events as T[];
  }

  if (query.includes('SELECT * FROM tickets')) {
    let tickets = [...database.tickets] as any[];

    if (query.includes('WHERE event_id = ?')) {
      tickets = tickets.filter((ticket) => ticket.event_id === params[0]);
    }

    if (query.includes('WHERE owner_wallet = ?')) {
      tickets = tickets.filter((ticket) => ticket.owner_wallet === params[0]);
    }

    return tickets as T[];
  }

  if (query.includes('SELECT * FROM transactions')) {
    let transactions = [...database.transactions] as any[];

    if (query.includes('WHERE user_wallet = ?')) {
      transactions = transactions.filter((transaction) => transaction.user_wallet === params[0]);
    }

    return transactions as T[];
  }

  return [] as T[];
}

function memoryDbRun(query: string, params: any[] = []): { lastID: number; changes: number } {
  if (query.includes('INSERT INTO events')) {
    const [
      id,
      name,
      description,
      location,
      date,
      category,
      price_sol,
      price_usdc,
      total_tickets,
      available_tickets,
      organizer_wallet,
      organizer_name,
      event_account,
      source_url,
      poster_url,
    ] = params;

    database.events.push({
      id,
      name,
      description,
      source_url,
      poster_url,
      location,
      date,
      category,
      price_sol,
      price_usdc,
      total_tickets,
      available_tickets,
      withdrawn_profit_sol: 0,
      organizer_wallet,
      organizer_name,
      event_account,
      created_at: new Date().toISOString(),
    });

    persistFallbackToDisk();

    return { lastID: database.events.length, changes: 1 };
  }

  if (query.includes('UPDATE events SET withdrawn_profit_sol = ? WHERE id = ?')) {
    const [withdrawn_profit_sol, id] = params;
    const index = database.events.findIndex((event) => event.id === id);
    if (index === -1) return { lastID: 0, changes: 0 };

    database.events[index] = {
      ...database.events[index],
      withdrawn_profit_sol: Number(withdrawn_profit_sol) || 0,
    };

    persistFallbackToDisk();

    return { lastID: index + 1, changes: 1 };
  }

  if (query.includes('UPDATE events SET available_tickets = ? WHERE id = ?')) {
    const [available_tickets, id] = params;
    const index = database.events.findIndex((event) => event.id === id);
    if (index === -1) return { lastID: 0, changes: 0 };

    database.events[index] = {
      ...database.events[index],
      available_tickets: Math.max(0, Number(available_tickets) || 0),
    };

    persistFallbackToDisk();

    return { lastID: index + 1, changes: 1 };
  }

  if (query.includes('DELETE FROM events WHERE id = ?')) {
    const [id] = params;
    const beforeCount = database.events.length;

    database.events = database.events.filter((event) => event.id !== id);
    database.tickets = database.tickets.filter((ticket) => ticket.event_id !== id);
    database.transactions = database.transactions.filter((transaction) => transaction.event_id !== id);

    persistFallbackToDisk();

    return { lastID: beforeCount, changes: beforeCount - database.events.length };
  }

  if (query.includes('INSERT INTO tickets')) {
    const [id, event_id, owner_wallet, price_paid_sol] = params;
    database.tickets.push({
      id,
      event_id,
      owner_wallet,
      price_paid_sol,
      purchased_at: new Date().toISOString(),
    });

    persistFallbackToDisk();
    return { lastID: database.tickets.length, changes: 1 };
  }

  if (query.includes('INSERT INTO transactions')) {
    const [id, type, event_id, user_wallet, amount_sol, status] = params;
    database.transactions.push({
      id,
      type,
      event_id,
      user_wallet,
      amount_sol,
      status,
      created_at: new Date().toISOString(),
    });

    persistFallbackToDisk();
    return { lastID: database.transactions.length, changes: 1 };
  }

  return { lastID: 0, changes: 0 };
}

async function initializeDatabase() {
  if (database.initialized && sqliteDb) return;
  if (database.initialized && usingMemoryFallback) return;
  if (initPromise) return initPromise;

  initPromise = new Promise<void>((resolve, reject) => {
    const openDb = async () => {
      try {
        const sqlite3Module = await import('sqlite3');
        const sqlite3Driver = (sqlite3Module as any).default ?? sqlite3Module;

        const db = new sqlite3Driver.Database(DB_FILE_PATH, async (openError: Error | null) => {
          if (openError) {
            if (DB_FILE_PATH !== ':memory:') {
              sqliteDb = new sqlite3Driver.Database(':memory:', async (memoryError: Error | null) => {
                if (memoryError) {
                  activateMemoryFallback();
                  resolve();
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
                } catch {
                  activateMemoryFallback();
                  resolve();
                }
              });
              return;
            }

            activateMemoryFallback();
            resolve();
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
          } catch {
            activateMemoryFallback();
            resolve();
          }
        });
      } catch {
        activateMemoryFallback();
        resolve();
      }
    };

    openDb();
  });

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

export async function dbAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
  await initializeDatabase();
  if (usingMemoryFallback) {
    return memoryDbAll<T>(query, params);
  }
  return allSql<T>(query, params);
}

export async function dbGet<T = any>(query: string, params: any[] = []): Promise<T | undefined> {
  await initializeDatabase();
  if (usingMemoryFallback) {
    return memoryDbAll<T>(query, params)[0];
  }
  return getSql<T>(query, params);
}

export async function dbRun(query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  await initializeDatabase();
  if (usingMemoryFallback) {
    return memoryDbRun(query, params);
  }
  return runSql(query, params);
}

export async function getStats() {
  await initializeDatabase();

  if (usingMemoryFallback) {
    const totalTicketsSold = database.tickets.length;
    const activeEvents = database.events.filter((event) => new Date(event.date) > new Date()).length;
    const activeUsers = new Set(database.tickets.map((ticket) => ticket.owner_wallet)).size;
    const totalRevenueSol = database.tickets.reduce((sum, ticket) => sum + Number(ticket.price_paid_sol), 0);

    return {
      totalTicketsSold,
      activeEvents,
      activeUsers,
      totalRevenueSol: parseFloat(totalRevenueSol.toFixed(2)),
      platformFees: 0,
    };
  }

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
