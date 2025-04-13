/**
 * Omnitrade Backend - Phase 3 Market Data APIs
 * Includes:
 * - Market Data REST API endpoints with mock data
 * - In-memory caching
 * - Basic rate limiting
 * - WebSocket server for real-time updates
 * - Existing RBAC and Password Reset
 */

const express = require('express');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');

// --- Firebase Admin Initialization ---
const serviceAccount = require('./omnitrade-firebase-adminsdk.json'); // Make sure this path is correct

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// --- End Firebase Admin Initialization ---

const { loadUserPermissions, checkPermission } = require('./rbacMiddleware');

const app = express();
const prisma = new PrismaClient();

// In-memory cache with TTL
const cache = {};
function setCache(key, data, ttlMs = 10000) {
  cache[key] = { data, expires: Date.now() + ttlMs };
}
function getCache(key) {
  const entry = cache[key];
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  } else {
    delete cache[key];
    return null;
  }
}

// Rate limiter for market data endpoints
const marketLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 seconds
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later.',
});


app.use(express.json());

// const JWT_SECRET = process.env.JWT_SECRET || 'changeme'; // No longer needed

// Middleware: Authenticate Firebase ID Token and attach user info
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const idToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!idToken) {
    console.log('Auth: No token provided');
    return res.sendStatus(401); // Unauthorized
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // Attach user info to the request. Map Firebase uid to userId for compatibility.
    // You might need to fetch additional user details (like role) from your DB
    // based on decodedToken.uid if they aren't stored as custom claims in Firebase.
    req.user = {
        userId: decodedToken.uid, // Map uid to userId
        email: decodedToken.email,
        // role: decodedToken.role || 'user' // Example: Get role from custom claims or default
        // Add other relevant fields from decodedToken if needed
    };
    console.log(`Auth: Token verified for user ${req.user.userId}`);
    next();
  } catch (error) {
    console.error('Auth: Error verifying Firebase ID token:', error.message);
    // Handle specific errors like expired token, revoked token, etc. if needed
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).send('Token expired');
    }
    return res.sendStatus(403); // Forbidden
  }
}

// Middleware: Require specific role(s)
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.sendStatus(403);
    }
    next();
  };
}

// Example protected route (admin only)
app.get(
  '/admin/dashboard',
  authenticateToken,
  loadUserPermissions,
  checkPermission('system_settings:manage'),
  (req, res) => {
    res.json({ message: 'Welcome, admin!' });
  }
);

// Example protected route (any logged-in user)
app.get(
  '/user/profile',
  authenticateToken,
  loadUserPermissions,
  checkPermission('profile:read:own'),
  (req, res) => {
    res.json({ message: 'Welcome, user!' });
  }
);

// Password reset request
app.post('/auth/request-password-reset', async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.sendStatus(200); // Don't reveal user existence

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.user.update({
    where: { email },
    data: {
      reset_token: token,
      reset_token_expiry: expiry,
    },
  });

  console.log(`Simulated email: Use this token to reset password: ${token}`);
  res.sendStatus(200);
});

// Password reset confirmation
app.post('/auth/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.reset_token !== token || !user.reset_token_expiry || user.reset_token_expiry < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const password_hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: {
      password_hash,
      reset_token: null,
      reset_token_expiry: null,
    },
  });

  res.sendStatus(200);
});

// Start server
/**
 * Market Data API Endpoints (mock data)
 */
app.use('/api/v1/market-data', marketLimiter);

// GET /api/v1/market-data/symbols?exchangeId=binance
app.get('/api/v1/market-data/symbols', (req, res) => {
  const exchangeId = req.query.exchangeId || 'binance';
  const cacheKey = `symbols_${exchangeId}`;
  let symbols = getCache(cacheKey);
  if (!symbols) {
    symbols = [
      { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
      { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
      { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
    ];
    setCache(cacheKey, symbols, 60000); // cache 60s
  }
  res.json(symbols);
});

// GET /api/v1/market-data/price/:symbol
app.get('/api/v1/market-data/price/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `price_${symbol}`;
  let price = getCache(cacheKey);
  if (!price) {
    price = { symbol, price: (Math.random() * 50000 + 1000).toFixed(2) };
    setCache(cacheKey, price, 5000); // cache 5s
  }
  res.json(price);
});

// GET /api/v1/market-data/klines
app.get('/api/v1/market-data/klines', (req, res) => {
  const { exchangeId = 'binance', symbol = 'BTCUSDT', interval = '1h', limit = 10 } = req.query;
  const cacheKey = `klines_${exchangeId}_${symbol}_${interval}_${limit}`;
  let klines = getCache(cacheKey);
  if (!klines) {
    const now = Date.now();
    klines = [];
    for (let i = 0; i < limit; i++) {
      const timestamp = now - i * 3600000; // 1 hour intervals
      const open = (Math.random() * 50000 + 1000).toFixed(2);
      const close = (Math.random() * 50000 + 1000).toFixed(2);
      const high = Math.max(open, close, (Math.random() * 50000 + 1000).toFixed(2));
      const low = Math.min(open, close, (Math.random() * 50000 + 1000).toFixed(2));
      const volume = (Math.random() * 100).toFixed(2);
      klines.unshift([timestamp, open, high, low, close, volume]);
    }
    setCache(cacheKey, klines, 60000); // cache 60s
  }
  res.json(klines);
});

const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server, path: '/api/v1/market-data/updates' });

wss.on('connection', (ws) => {
  console.log('Market data WebSocket client connected');
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to market data updates' }));

  const interval = setInterval(() => {
    const update = {
      type: 'price_update',
      symbol: 'BTCUSDT',
      price: (Math.random() * 50000 + 1000).toFixed(2),
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(update));
  }, 3000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Market data WebSocket client disconnected');
  });
});

// --- User Management Endpoints ---

// GET /api/v1/users/me - Fetch current user's profile
app.get('/api/v1/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.userId }, // Uses userId mapped from Firebase uid
      select: { // Select only public profile fields
        user_id: true,
        email: true,
        user_name: true,
        created_at: true,
        last_login_at: true,
        role: true
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/users/update-profile - Update current user's profile
app.put('/api/v1/users/update-profile', authenticateToken, async (req, res) => {
  const { user_name } = req.body;
  const updateData = {};

  // Only include fields that are provided in the request
  if (user_name !== undefined) updateData.user_name = user_name;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { user_id: req.user.userId }, // Uses userId mapped from Firebase uid
      data: updateData,
      select: { // Return updated public profile
        user_id: true,
        email: true,
        user_name: true,
        created_at: true,
        last_login_at: true,
        role: true,
        updated_at: true // Include updated_at
      }
    });

    // Log activity - Placeholder, needs logUserActivity function defined first
    // logUserActivity(req.user.userId, 'PROFILE_UPDATE', { updatedFields: Object.keys(updateData) }, req);

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Handle potential errors like user not found (though unlikely with auth)
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Account Settings Endpoints ---

// GET /api/v1/users/settings - Fetch all settings for the current user
app.get('/api/v1/users/settings', authenticateToken, async (req, res) => {
  try {
    const settings = await prisma.userSetting.findMany({
      where: { user_id: req.user.userId }, // Uses userId mapped from Firebase uid
      select: { setting_key: true, setting_value: true } // Only return key and value
    });

    // Convert array of settings into a key-value object for easier frontend use
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});

    res.json(settingsObject);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/users/settings - Update settings for the current user
app.put('/api/v1/users/settings', authenticateToken, async (req, res) => {
  const settingsToUpdate = req.body; // Expects an object like { "notification_prefs": {...}, "security_2fa_enabled": true }

  if (typeof settingsToUpdate !== 'object' || settingsToUpdate === null || Object.keys(settingsToUpdate).length === 0) {
    return res.status(400).json({ error: 'Invalid or empty settings object provided' });
  }

  const userId = req.user.userId; // Uses userId mapped from Firebase uid
  const updatePromises = [];

  for (const key in settingsToUpdate) {
    if (Object.hasOwnProperty.call(settingsToUpdate, key)) {
      const value = settingsToUpdate[key];
      // Use upsert to create the setting if it doesn't exist, or update it if it does
      updatePromises.push(
        prisma.userSetting.upsert({
          where: { user_id_setting_key: { user_id: userId, setting_key: key } },
          update: { setting_value: value },
          create: { user_id: userId, setting_key: key, setting_value: value },
        })
      );
    }
  }

  try {
    await prisma.$transaction(updatePromises); // Execute all updates in a transaction

    // Fetch the updated settings to return them
    const updatedSettings = await prisma.userSetting.findMany({
      where: { user_id: userId },
      select: { setting_key: true, setting_value: true }
    });
    const updatedSettingsObject = updatedSettings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});

    // Log activity - Placeholder, needs logUserActivity function defined first
    // logUserActivity(req.user.userId, 'SETTINGS_UPDATE', { updatedKeys: Object.keys(settingsToUpdate) }, req);

    res.json(updatedSettingsObject);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Notification System ---

// Helper function to create notifications
async function createNotification(userId, type, message) {
  try {
    await prisma.notification.create({
      data: {
        user_id: userId,
        type: type,
        message: message,
        is_read: false, // Notifications start as unread
      },
    });
    console.log(`Notification created for user ${userId}: ${type}`);
    // In a real system, you might push this to a WebSocket or other real-time channel
  } catch (error) {
    console.error(`Error creating notification for user ${userId}:`, error);
  }
}

// Example usage (placeholder - integrate into actual event triggers like bot execution)
// createNotification('user-id-goes-here', 'BOT_EXECUTION_SUCCESS', 'Your BTC/USDT bot completed successfully.');

// GET /api/v1/users/notifications - Fetch notifications for the current user
app.get('/api/v1/users/notifications', authenticateToken, async (req, res) => {
  const { read } = req.query; // Optional query param: ?read=true or ?read=false
  const whereClause = { user_id: req.user.userId }; // Uses userId mapped from Firebase uid

  if (read !== undefined) {
    whereClause.is_read = read === 'true';
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }, // Show newest first
      take: 50, // Limit the number of notifications returned
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TODO: Add endpoint to mark notifications as read (e.g., PUT /api/v1/notifications/:id/read)

// --- Activity Tracking ---

// Helper function to log user activity
async function logUserActivity(userId, activityType, details = null, req = null) {
  try {
    const logData = {
      user_id: userId,
      activity_type: activityType,
      details: details,
    };
    // Attempt to get IP and User-Agent if req object is available
    if (req) {
      logData.ip_address = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
      logData.user_agent = req.headers['user-agent'];
    }
    await prisma.userActivityLog.create({ data: logData });
    console.log(`Activity logged for user ${userId}: ${activityType}`);
  } catch (error) {
    // Avoid crashing the main request if logging fails
    console.error(`Error logging activity for user ${userId} (${activityType}):`, error);
  }
}

// Example usage (placeholder - integrate into actual event triggers like login, bot actions)
// logUserActivity('user-id-goes-here', 'LOGIN', null, req); // Pass 'req' object if available
// logUserActivity('user-id-goes-here', 'BOT_START', { botId: 'bot-id' });

// GET /api/v1/users/activity - Fetch recent activity for the current user
app.get('/api/v1/users/activity', authenticateToken, async (req, res) => {
  try {
    const activityLogs = await prisma.userActivityLog.findMany({
      where: { user_id: req.user.userId }, // Uses userId mapped from Firebase uid
      orderBy: { timestamp: 'desc' }, // Show newest first
      take: 100, // Limit the number of logs returned
      select: { // Select specific fields to return
        activity_type: true,
        details: true,
        ip_address: true, // Consider privacy implications before exposing IP widely
        timestamp: true
      }
    });
    res.json(activityLogs);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- Performance Tracking Endpoints ---

// GET /api/v1/performance/bots/:botId - Fetch performance for a specific bot
app.get('/api/v1/performance/bots/:botId', authenticateToken, async (req, res) => {
  const { botId } = req.params;
  const userId = req.user.userId; // Uses userId mapped from Firebase uid

  try {
    // Verify the bot exists and belongs to the user (or is public if that's a feature)
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { userId: true } // Select only necessary field for ownership check
    });

    // Basic check: Does the bot exist and belong to the requesting user?
    // TODO: Add logic for shared/public bots if applicable
    if (!bot || bot.userId !== userId) {
      return res.status(404).json({ error: 'Bot not found or access denied' });
    }

    // Fetch latest live performance snapshot
    const livePerformance = await prisma.botPerformance.findFirst({
      where: { bot_id: botId, is_live: true },
      orderBy: { timestamp: 'desc' },
    });

    // Fetch backtest results
    const backtests = await prisma.backtestResult.findMany({
      where: { bot_id: botId },
      orderBy: { created_at: 'desc' },
      take: 10, // Limit number of backtests returned
    });

    // --- Mock Data Generation (if no real data) ---
    let mockLivePerformance = null;
    if (!livePerformance) {
        mockLivePerformance = {
            performance_id: `mock-live-${botId}`,
            bot_id: botId,
            timestamp: new Date(),
            roi: Math.random() * 50 - 10, // Mock ROI between -10% and +40%
            win_rate: Math.random() * 0.4 + 0.3, // Mock win rate between 30% and 70%
            max_drawdown: Math.random() * 20, // Mock drawdown up to 20%
            profit_factor: Math.random() * 2 + 0.5, // Mock profit factor between 0.5 and 2.5
            total_trades: Math.floor(Math.random() * 500),
            equity: Math.random() * 10000 + 1000,
            is_live: true,
            created_at: new Date(),
            updated_at: new Date(),
        };
    }

    let mockBacktests = [];
    if (backtests.length === 0) {
        for (let i = 0; i < 3; i++) { // Generate 3 mock backtests
            const endDate = new Date(Date.now() - i * 86400000 * 30); // ~i months ago
            const startDate = new Date(endDate.getTime() - 86400000 * 90); // ~3 months duration
            mockBacktests.push({
                backtest_id: `mock-backtest-${botId}-${i}`,
                bot_id: botId,
                strategy_config: { mockParam: Math.random() },
                start_date: startDate,
                end_date: endDate,
                roi: Math.random() * 100 - 20,
                win_rate: Math.random() * 0.5 + 0.25,
                max_drawdown: Math.random() * 30,
                profit_factor: Math.random() * 3 + 0.2,
                total_trades: Math.floor(Math.random() * 1000),
                equity_curve: [{timestamp: startDate.toISOString(), value: 1000}, {timestamp: endDate.toISOString(), value: 1000 * (1 + (Math.random()*100-20)/100)}], // Simplified curve
                created_at: endDate,
            });
        }
    }
    // --- End Mock Data Generation ---


    res.json({
      live: livePerformance || mockLivePerformance, // Use real data if available, else mock
      backtests: backtests.length > 0 ? backtests : mockBacktests, // Use real data if available, else mock
    });

  } catch (error) {
    console.error(`Error fetching performance for bot ${botId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/performance/leaderboard - Fetch leaderboard data
app.get('/api/v1/performance/leaderboard', authenticateToken, async (req, res) => {
  const { metric = 'roi', timePeriod = 'all', limit = 10 } = req.query; // Example: ?metric=roi&limit=5

  try {
    // --- Mock Data Generation ---
    // In a real scenario, this would involve complex aggregation queries
    // across BotPerformance, potentially filtering by is_live=true, timePeriod, etc.
    const mockLeaderboard = [];
    const botIds = ['mock-bot-1', 'mock-bot-2', 'mock-bot-3', 'mock-bot-4', 'mock-bot-5']; // Example bot IDs
    for (let i = 0; i < Math.min(limit, botIds.length); i++) {
        mockLeaderboard.push({
            rank: i + 1,
            bot_id: botIds[i],
            // Fetch mock user/bot names if needed - requires joining Bot and User tables
            bot_name: `Mock Bot ${i + 1}`, // Placeholder
            user_name: `User ${String.fromCharCode(65 + i)}`, // Placeholder User A, B, C...
            metric_value: (metric === 'roi') ? (Math.random() * 200 + 50).toFixed(2) : (Math.random() * 3 + 1).toFixed(2), // Mock ROI or Profit Factor
            metric_name: metric,
            timestamp: new Date(),
        });
    }
    // Sort mock data based on metric (descending)
    mockLeaderboard.sort((a, b) => b.metric_value - a.metric_value);
    // Re-assign rank after sorting
    mockLeaderboard.forEach((entry, index) => entry.rank = index + 1);
    // --- End Mock Data Generation ---

    // TODO: Replace mock data with actual Prisma query for aggregation
    // Example (conceptual - requires careful schema design and query optimization):
    /*
    const leaderboardData = await prisma.botPerformance.findMany({
      where: { is_live: true }, // Consider only live bots for leaderboard
      orderBy: { [metric]: 'desc' }, // Sort by the chosen metric
      take: parseInt(limit, 10),
      select: {
        bot_id: true,
        [metric]: true, // Select the metric value
        timestamp: true,
        bot: { // Include related bot info
          select: {
            // bot_name: true, // Assuming a name field exists on Bot model
            user: { // Include related user info
              select: {
                user_name: true
              }
            }
          }
        }
      }
    });
    // Format leaderboardData into the desired response structure...
    */

    res.json(mockLeaderboard); // Return mock data for now

  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 3001; // Define PORT if not already defined

server.listen(PORT, () => {
  console.log(`API and WebSocket server running on port ${PORT}`);
});