// Database seeding script
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create exchanges
  const exchanges = [
    {
      exchange_id: 'binance',
      exchange_name: 'Binance',
      api_base_url: 'https://api.binance.com',
      ws_base_url: 'wss://stream.binance.com:9443',
      is_active: true,
    },
    {
      exchange_id: 'coinbase',
      exchange_name: 'Coinbase Pro',
      api_base_url: 'https://api.pro.coinbase.com',
      ws_base_url: 'wss://ws-feed.pro.coinbase.com',
      is_active: true,
    },
    {
      exchange_id: 'kraken',
      exchange_name: 'Kraken',
      api_base_url: 'https://api.kraken.com',
      ws_base_url: 'wss://ws.kraken.com',
      is_active: true,
    },
  ];

  console.log('Creating exchanges...');
  for (const exchange of exchanges) {
    await prisma.exchange.upsert({
      where: { exchange_id: exchange.exchange_id },
      update: exchange,
      create: exchange,
    });
  }

  // Create a test user (for development only)
  const testUser = {
    email: 'test@example.com',
    password_hash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Password is 'password'
    full_name: 'Test User',
    is_active: true,
    email_verified: true,
  };

  console.log('Creating test user...');
  const user = await prisma.user.upsert({
    where: { email: testUser.email },
    update: testUser,
    create: testUser,
  });

  console.log('Database seeded successfully!');
  return { exchanges, user };
}

main()
  .then(async (result) => {
    console.log(`Created ${result.exchanges.length} exchanges and 1 test user`);
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
