import { WebSocketServer } from 'ws';

let wssInstance = null;

export const setWebSocketServer = (wss) => {
  wssInstance = wss;
  console.log('[WebSocket Service] WebSocket server instance set');
};

export const broadcastToClients = (data) => {
  const timestamp = new Date().toISOString();
  
  if (!wssInstance) {
    console.warn(`[WebSocket Service] [${timestamp}] WebSocket server not initialized - cannot broadcast`);
    return;
  }

  const totalClients = wssInstance.clients.size;
  const readyClients = Array.from(wssInstance.clients).filter(client => client.readyState === 1).length;
  
  console.log(`[WebSocket Service] [${timestamp}] Broadcasting message:`);
  console.log(`  - Message type: ${data.type || 'unknown'}`);
  console.log(`  - Total clients: ${totalClients}`);
  console.log(`  - Ready clients: ${readyClients}`);
  
  if (data.data && data.data._id) {
    console.log(`  - Data ID: ${data.data._id}`);
  }
  
  if (data.data && data.data.name) {
    console.log(`  - Data name: ${data.data.name}`);
  }

  const message = JSON.stringify(data);
  const messageSize = Buffer.byteLength(message, 'utf8');
  console.log(`  - Message size: ${messageSize} bytes`);

  let sentCount = 0;
  let failedCount = 0;
  
  wssInstance.clients.forEach((client, index) => {
    try {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
        sentCount++;
        console.log(`  - Sent to client ${index + 1}/${readyClients}`);
      } else {
        console.log(`  - Skipped client ${index + 1} (state: ${client.readyState})`);
      }
    } catch (error) {
      failedCount++;
      console.error(`  - Failed to send to client ${index + 1}:`, error.message);
    }
  });

  console.log(`[WebSocket Service] [${timestamp}] Broadcast complete:`);
  console.log(`  - Successfully sent: ${sentCount}`);
  console.log(`  - Failed: ${failedCount}`);
  console.log(`  - Total attempted: ${sentCount + failedCount}`);
};
