// In-memory database for BlinkTicket
// Data persists during the session

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  category: string;
  price_sol: number;
  price_usdc: number;
  total_tickets: number;
  available_tickets: number;
  organizer_wallet: string;
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

// Initialize database with sample data
function initializeDatabase() {
  if (database.initialized) return;
  
  database.events = [
    {
      id: 'event-1',
      name: 'Solana Summer Festival 2024',
      description: 'The most anticipated Solana event of the summer featuring live performances and workshops.',
      location: 'Austin, Texas',
      date: 'June 15-17, 2024',
      category: 'Music',
      price_sol: 2.5,
      price_usdc: 150,
      total_tickets: 5000,
      available_tickets: 1800,
      organizer_wallet: 'organizer1.sol',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-2',
      name: 'Web3 Developer Conference',
      description: 'Connect with industry leaders and learn the latest in blockchain technology.',
      location: 'San Francisco, CA',
      date: 'July 20-22, 2024',
      category: 'Conference',
      price_sol: 3.0,
      price_usdc: 180,
      total_tickets: 2500,
      available_tickets: 650,
      organizer_wallet: 'organizer2.sol',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-3',
      name: 'Blockchain Gaming Expo',
      description: 'The largest gaming expo focused on blockchain and Web3 games.',
      location: 'Los Angeles, CA',
      date: 'August 10-12, 2024',
      category: 'Gaming',
      price_sol: 1.8,
      price_usdc: 110,
      total_tickets: 6000,
      available_tickets: 1500,
      organizer_wallet: 'organizer3.sol',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Generate sample tickets sold
  for (let i = 0; i < 3200; i++) {
    database.tickets.push({
      id: `ticket-${i}`,
      event_id: 'event-1',
      owner_wallet: `user${Math.floor(Math.random() * 500) + 1}.sol`,
      purchased_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      price_paid_sol: 2.5,
    });
  }

  for (let i = 0; i < 1850; i++) {
    database.tickets.push({
      id: `ticket-${3200 + i}`,
      event_id: 'event-2',
      owner_wallet: `user${Math.floor(Math.random() * 500) + 1}.sol`,
      purchased_at: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000).toISOString(),
      price_paid_sol: 3.0,
    });
  }

  for (let i = 0; i < 4500; i++) {
    database.tickets.push({
      id: `ticket-${5050 + i}`,
      event_id: 'event-3',
      owner_wallet: `user${Math.floor(Math.random() * 500) + 1}.sol`,
      purchased_at: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
      price_paid_sol: 1.8,
    });
  }

  // Create unique users
  const uniqueWallets = new Set(database.tickets.map(t => t.owner_wallet));
  uniqueWallets.forEach((wallet) => {
    database.users.push({
      id: `user-${wallet}`,
      wallet_address: wallet,
      created_at: new Date().toISOString(),
    });
  });

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
    const [id, name, description, location, date, category, price_sol, price_usdc, total_tickets, available_tickets, organizer_wallet] = params;
    database.events.push({
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
      created_at: new Date().toISOString(),
    });
    return { lastID: database.events.length, changes: 1 };
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
