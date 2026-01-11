import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { connectToMongoDB } from './util/db.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import missionRoutes from './routes/missionRoutes.js';
import { setWebSocketServer } from './services/websocket.js';
import { startMissionAgent, stopMissionAgent } from './services/missionAgent.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

// Track connected clients
let clientCounter = 0;
const connectedClients = new Map();

// Set WebSocket server instance for broadcasting
setWebSocketServer(wss);

// WebSocket server event handlers
wss.on('listening', () => {
  console.log('[WebSocket] Server is listening on path /ws');
});

wss.on('error', (error) => {
  console.error('[WebSocket] Server error:', error);
});

wss.on('connection', (ws, req) => {
  clientCounter++;
  const clientId = clientCounter;
  const clientIp = req.socket.remoteAddress || 'unknown';
  const timestamp = new Date().toISOString();
  
  // Store client info
  connectedClients.set(clientId, {
    id: clientId,
    ip: clientIp,
    connectedAt: timestamp,
    lastActivity: timestamp
  });

  console.log(`[WebSocket] [${timestamp}] New client connected:`);
  console.log(`  - Client ID: ${clientId}`);
  console.log(`  - IP Address: ${clientIp}`);
  console.log(`  - Total connected clients: ${wss.clients.size}`);
  
  ws.on('message', (message) => {
    const timestamp = new Date().toISOString();
    const messageStr = message.toString();
    const messageSize = Buffer.byteLength(messageStr, 'utf8');
    
    console.log(`[WebSocket] [${timestamp}] Message received from client ${clientId}:`);
    console.log(`  - Message size: ${messageSize} bytes`);
    console.log(`  - Raw message: ${messageStr.substring(0, 200)}${messageStr.length > 200 ? '...' : ''}`);
    
    try {
      const data = JSON.parse(messageStr);
      console.log(`  - Parsed data type: ${data.type || 'unknown'}`);
      console.log(`  - Parsed data:`, JSON.stringify(data, null, 2));
      
      // Update last activity
      if (connectedClients.has(clientId)) {
        connectedClients.get(clientId).lastActivity = timestamp;
      }
      
      // Echo back or handle specific message types
      const ackMessage = JSON.stringify({ type: 'ack', message: 'Message received', timestamp });
      ws.send(ackMessage);
      console.log(`  - Sent acknowledgment to client ${clientId}`);
    } catch (error) {
      console.error(`[WebSocket] [${timestamp}] Error parsing message from client ${clientId}:`, error.message);
      console.error(`  - Error stack:`, error.stack);
    }
  });

  ws.on('close', (code, reason) => {
    const timestamp = new Date().toISOString();
    const reasonStr = reason ? reason.toString() : 'No reason provided';
    
    console.log(`[WebSocket] [${timestamp}] Client disconnected:`);
    console.log(`  - Client ID: ${clientId}`);
    console.log(`  - Close code: ${code}`);
    console.log(`  - Close reason: ${reasonStr}`);
    console.log(`  - Remaining connected clients: ${wss.clients.size}`);
    
    // Remove client from tracking
    connectedClients.delete(clientId);
  });

  ws.on('error', (error) => {
    const timestamp = new Date().toISOString();
    console.error(`[WebSocket] [${timestamp}] Error on client ${clientId}:`);
    console.error(`  - Error message: ${error.message}`);
    console.error(`  - Error stack:`, error.stack);
  });

  ws.on('pong', () => {
    const timestamp = new Date().toISOString();
    console.log(`[WebSocket] [${timestamp}] Received pong from client ${clientId}`);
  });

  // Send welcome message
  const welcomeMessage = {
    type: 'connected',
    message: 'Connected to Disaster Hub WebSocket server',
    clientId: clientId,
    timestamp: timestamp
  };
  
  ws.send(JSON.stringify(welcomeMessage));
  console.log(`  - Sent welcome message to client ${clientId}`);
});

// Periodic logging of WebSocket server status
setInterval(() => {
  const timestamp = new Date().toISOString();
  const connectedCount = wss.clients.size;
  const readyCount = Array.from(wss.clients).filter(client => client.readyState === 1).length;
  
  console.log(`[WebSocket] [${timestamp}] Server status:`);
  console.log(`  - Total clients: ${connectedCount}`);
  console.log(`  - Ready clients: ${readyCount}`);
  console.log(`  - Tracked clients: ${connectedClients.size}`);
  
  if (connectedClients.size > 0) {
    console.log(`  - Client details:`);
    connectedClients.forEach((client, id) => {
      const uptime = Math.floor((new Date() - new Date(client.connectedAt)) / 1000);
      console.log(`    * Client ${id}: IP ${client.ip}, Uptime: ${uptime}s, Last activity: ${client.lastActivity}`);
    });
  }
}, 60000); // Log every 60 seconds

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('disasterhubfe'));

// Connect to MongoDB on server start with retry logic
let dbClient;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function connectWithRetry() {
  try {
    dbClient = await connectToMongoDB();
    console.log('✅ MongoDB connection established successfully!');
    retryCount = 0; // Reset retry count on success
    
    // Start the background mission agent after database connection is established
    // Check every 5 minutes (300000 ms) for incidents that need missions
    const agentInterval = process.env.MISSION_AGENT_INTERVAL_MS 
      ? parseInt(process.env.MISSION_AGENT_INTERVAL_MS, 10) 
      : 5 * 60 * 1000; // Default: 5 minutes
    
    console.log(`[Server] Starting background mission agent (interval: ${agentInterval / 1000 / 60} minutes)`);
    startMissionAgent(agentInterval);
  } catch (error) {
    retryCount++;
    if (retryCount < MAX_RETRIES) {
      console.error(`❌ MongoDB connection failed (attempt ${retryCount}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY/1000} seconds...`);
      setTimeout(connectWithRetry, RETRY_DELAY);
    } else {
      console.error('❌ Failed to connect to MongoDB after', MAX_RETRIES, 'attempts');
      console.error('⚠️  Server will continue to run, but database operations will fail');
      console.error('💡 Troubleshooting tips:');
      console.error('   1. Check MongoDB Atlas IP whitelist - add 0.0.0.0/0 for testing (or your Docker host IP)');
      console.error('   2. Verify MONGODB_URI in .env file is correct');
      console.error('   3. Check if MongoDB Atlas cluster is running');
      console.error('   4. Verify network connectivity from Docker container');
      // Don't exit - allow server to start without DB for testing
      // process.exit(1);
    }
  }
}

// Start connection attempt
connectWithRetry();

// API Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/incident', incidentRoutes);
app.use('/api/mission', missionRoutes);

// Hello endpoint that returns available API endpoints
app.get('/hello', (req, res) => {
  res.json({
    message: 'Hello! Here are the available API endpoints:',
    endpoints: {
      inventory: {
        base: '/api/inventory',
        methods: {
          'GET /api/inventory': 'Get all inventory items',
          'GET /api/inventory/:id': 'Get inventory item by ID',
          'POST /api/inventory': 'Create new inventory item',
          'PUT /api/inventory/:id': 'Update inventory item',
          'DELETE /api/inventory/:id': 'Delete inventory item'
        }
      },
      volunteer: {
        base: '/api/volunteer',
        methods: {
          'GET /api/volunteer': 'Get all volunteers',
          'GET /api/volunteer/:id': 'Get volunteer by ID',
          'POST /api/volunteer': 'Create new volunteer',
          'PUT /api/volunteer/:id': 'Update volunteer',
          'DELETE /api/volunteer/:id': 'Delete volunteer'
        }
      },
      incident: {
        base: '/api/incident',
        methods: {
          'GET /api/incident': 'Get all incidents',
          'GET /api/incident/:id': 'Get incident by ID',
          'POST /api/incident': 'Create new incident',
          'PUT /api/incident/:id': 'Update incident',
          'DELETE /api/incident/:id': 'Delete incident'
        }
      },
      mission: {
        base: '/api/mission',
        methods: {
          'GET /api/mission': 'Get all missions',
          'GET /api/mission/:id': 'Get mission by ID',
          'POST /api/mission': 'Create new mission',
          'PUT /api/mission/:id': 'Update mission',
          'DELETE /api/mission/:id': 'Delete mission'
        }
      },
      other: {
        'GET /': 'API information',
        'GET /health': 'Health check',
        'GET /hello': 'List all endpoints'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  if (dbClient) {
    try {
      // Try to ping the database to verify connection
      await dbClient.db('admin').command({ ping: 1 });
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
      console.error('Health check: Database ping failed:', error.message);
    }
  }
  
  res.json({ 
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint with API information
app.get('/', (req, res) => {
  res.json({
    message: 'Disaster Hub API',
    version: '1.0.0',
    endpoints: {
      inventory: '/api/inventory',
      volunteer: '/api/volunteer',
      incident: '/api/incident',
      mission: '/api/mission',
      health: '/health',
      hello: '/hello'
    }
  });
});

// Start the server - bind to all network interfaces (0.0.0.0) to allow network access
server.listen(PORT, '0.0.0.0', () => {
  const timestamp = new Date().toISOString();
  console.log(`[Server] [${timestamp}] Server is running on port ${PORT}`);
  console.log(`[Server] API endpoint available at http://localhost:${PORT}/hello`);
  console.log(`[Server] WebSocket server available at ws://localhost:${PORT}/ws`);
  console.log(`[Server] Frontend available at http://localhost:${PORT}`);
  console.log(`[Server] Network access: http://0.0.0.0:${PORT} (accessible from your local network)`);
  console.log(`[Server] WebSocket server initialized and ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  const timestamp = new Date().toISOString();
  console.log(`[Server] [${timestamp}] SIGTERM signal received: closing HTTP server`);
  
  // Stop the background mission agent
  stopMissionAgent();
  
  console.log(`[WebSocket] Closing WebSocket server...`);
  console.log(`[WebSocket] Active connections: ${wss.clients.size}`);
  
  // Close all WebSocket connections
  wss.clients.forEach((client) => {
    console.log(`[WebSocket] Closing client connection...`);
    client.close(1001, 'Server shutting down');
  });
  
  wss.close(() => {
    console.log(`[WebSocket] WebSocket server closed`);
  });
  
  if (dbClient) {
    await dbClient.close();
    console.log('[Database] MongoDB connection closed');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  const timestamp = new Date().toISOString();
  console.log(`[Server] [${timestamp}] SIGINT signal received: closing HTTP server`);
  
  // Stop the background mission agent
  stopMissionAgent();
  
  console.log(`[WebSocket] Closing WebSocket server...`);
  console.log(`[WebSocket] Active connections: ${wss.clients.size}`);
  
  // Close all WebSocket connections
  wss.clients.forEach((client) => {
    console.log(`[WebSocket] Closing client connection...`);
    client.close(1001, 'Server shutting down');
  });
  
  wss.close(() => {
    console.log(`[WebSocket] WebSocket server closed`);
  });
  
  if (dbClient) {
    await dbClient.close();
    console.log('[Database] MongoDB connection closed');
  }
  process.exit(0);
});
