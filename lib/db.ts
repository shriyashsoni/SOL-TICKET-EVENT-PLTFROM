import fs from 'node:fs';
import path from 'node:path';

// File-backed database for BlinkTicket
// Data persists across server restarts in local workspace

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

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DB_DIR, 'blink-db.json');

// Global runtime cache backed by disk
const database: DatabaseShape = {
  events: [],
  users: [],
  tickets: [],
  transactions: [],
  initialized: false,
};

function persistDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  fs.writeFileSync(
    DB_FILE_PATH,
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
}

function initializeDatabase() {
  if (database.initialized) return;

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseShape>;
      database.events = Array.isArray(parsed.events) ? parsed.events : [];
      database.users = Array.isArray(parsed.users) ? parsed.users : [];
      database.tickets = Array.isArray(parsed.tickets) ? parsed.tickets : [];
      database.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    } else {
      database.events = [];
      database.users = [];
      database.tickets = [];
      database.transactions = [];
      persistDatabase();
    }
  } catch {
    database.events = [];
    database.users = [];
    database.tickets = [];
    database.transactions = [];
    persistDatabase();
  }

  database.initialized = true;
}

export async function dbAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
  initializeDatabase();

  if (query.includes('SELECT * FROM events')) {
    let events = [...database.events] as any[];
    
    if (query.includes('WHERE category = ?')) {
      events = events.filter(e => e.category === params[0]);
    }
    
    if (query.includes('WHERE id = ?')) {
      events = events.filter(e => e.id === params[0]);
    }

    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return events as T[];
  }

  if (query.includes('SELECT * FROM tickets')) {
    let tickets = [...database.tickets] as any[];
    
    if (query.includes('WHERE event_id = ?')) {
      tickets = tickets.filter(t => t.event_id === params[0]);
    }
    
    if (query.includes('WHERE owner_wallet = ?')) {
      tickets = tickets.filter(t => t.owner_wallet === params[0]);
    }

    return tickets as T[];
  }

  if (query.includes('SELECT * FROM transactions')) {
    let transactions = [...database.transactions] as any[];
    
    if (query.includes('WHERE user_wallet = ?')) {
      transactions = transactions.filter(t => t.user_wallet === params[0]);
    }

    return transactions as T[];
  }

  return [] as T[];
}

export async function dbGet<T = any>(query: string, params: any[] = []): Promise<T | undefined> {
  const results = await dbAll<T>(query, params);
  return results[0];
}

export async function dbRun(query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  initializeDatabase();

  if (query.includes('INSERT INTO events')) {
    const [id, name, description, location, date, category, price_sol, price_usdc, total_tickets, available_tickets, organizer_wallet, organizer_name, event_account, source_url, poster_url] = params;
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
    persistDatabase();
    return { lastID: database.events.length, changes: 1 };
  }

  if (query.includes('UPDATE events SET withdrawn_profit_sol = ? WHERE id = ?')) {
    const [withdrawn_profit_sol, id] = params;
    const index = database.events.findIndex((event) => event.id === id);
    if (index === -1) {
      return { lastID: 0, changes: 0 };
    }

    database.events[index] = {
      ...database.events[index],
      withdrawn_profit_sol: Number(withdrawn_profit_sol) || 0,
    };

    persistDatabase();
    return { lastID: index + 1, changes: 1 };
  }

  if (query.includes('UPDATE events SET available_tickets = ? WHERE id = ?')) {
    const [available_tickets, id] = params;
    const index = database.events.findIndex((event) => event.id === id);
    if (index === -1) {
      return { lastID: 0, changes: 0 };
    }

    database.events[index] = {
      ...database.events[index],
      available_tickets: Math.max(0, Number(available_tickets) || 0),
    };

    persistDatabase();
    return { lastID: index + 1, changes: 1 };
  }

  if (query.includes('DELETE FROM events WHERE id = ?')) {
    const [id] = params;
    const beforeCount = database.events.length;

    database.events = database.events.filter((event) => event.id !== id);
    database.tickets = database.tickets.filter((ticket) => ticket.event_id !== id);
    database.transactions = database.transactions.filter((tx) => tx.event_id !== id);

    const changes = beforeCount - database.events.length;
    if (changes > 0) {
      persistDatabase();
      return { lastID: beforeCount, changes };
    }

    return { lastID: 0, changes: 0 };
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
    persistDatabase();
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
    persistDatabase();
    return { lastID: database.transactions.length, changes: 1 };
  }

  return { lastID: 0, changes: 0 };
}

export function getStats() {
  initializeDatabase();

  const totalTicketsSold = database.tickets.length;
  const activeEvents = database.events.filter(e => new Date(e.date) > new Date()).length;
  const activeUsers = new Set(database.tickets.map(t => t.owner_wallet)).size;
  const totalRevenueSol = database.tickets.reduce((sum, t) => sum + t.price_paid_sol, 0);

  return {
    totalTicketsSold,
    activeEvents,
    activeUsers,
    totalRevenueSol: parseFloat(totalRevenueSol.toFixed(2)),
    platformFees: 0,
  };
}
