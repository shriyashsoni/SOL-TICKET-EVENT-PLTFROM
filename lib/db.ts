// In-memory database for BlinkTicket
// Data persists during the session

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
  type: 'purchase' | 'transfer' | 'resale';
  event_id: string;
  user_wallet: string;
  amount_sol: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

// Global in-memory database
const database: {
  events: Event[];
  users: User[];
  tickets: Ticket[];
  transactions: Transaction[];
  initialized: boolean;
} = {
  events: [],
  users: [],
  tickets: [],
  transactions: [],
  initialized: false,
};

// Initialize database (empty; events are user-created)
function initializeDatabase() {
  if (database.initialized) return;

  database.events = [];
  database.users = [];
  database.tickets = [];
  database.transactions = [];

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

    return { lastID: index + 1, changes: 1 };
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
