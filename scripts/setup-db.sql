-- Create Events table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  location TEXT,
  date TEXT,
  time TEXT,
  category TEXT,
  price_sol REAL,
  price_usdc REAL,
  total_tickets INTEGER,
  available_tickets INTEGER,
  organizer_wallet TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  ticket_number INTEGER,
  price_paid REAL,
  currency TEXT,
  purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  cnft_mint TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_id TEXT,
  amount REAL,
  currency TEXT,
  type TEXT,
  signature TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Insert sample events
INSERT OR IGNORE INTO events (id, name, description, image_url, location, date, time, category, price_sol, price_usdc, total_tickets, available_tickets, organizer_wallet) VALUES
('event-1', 'Solana Meetup NYC', 'Join us for an evening of networking and learning about Solana ecosystem updates', '/events/solana-meetup.jpg', 'New York, NY', '2024-03-15', '18:00', 'Meetup', 1.5, 50, 200, 180, 'organizer1.sol'),
('event-2', 'Web3 Conference 2024', 'The largest Web3 conference featuring keynotes from industry leaders', '/events/web3-conf.jpg', 'San Francisco, CA', '2024-04-20', '09:00', 'Conference', 5.0, 150, 500, 250, 'organizer2.sol'),
('event-3', 'NFT Art Showcase', 'Experience cutting-edge NFT art installations and meet the creators', '/events/nft-art.jpg', 'Los Angeles, CA', '2024-03-25', '19:00', 'Exhibition', 0.5, 20, 150, 90, 'organizer3.sol');
