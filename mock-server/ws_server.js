/**
 * Rumour WebSocket Echo Server
 * Port: 4001
 *
 * Usage: node ws_server.js
 *
 * Behaviour:
 *  - Sends a welcome JSON frame on connection
 *  - Echoes every text message back verbatim
 *  - Responds to ping frames with pong automatically (via ws library)
 */

const { WebSocketServer } = require('ws');

const PORT = 4001;
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[WS] Client connected from ${clientIp}`);

  // Send welcome frame only if requested via url (for action=listen testing)
  const isListenEndpoint = req.url && (req.url.includes('welcome') || req.url.includes('listen'));
  if (isListenEndpoint) {
    socket.send(JSON.stringify({
      event: 'connected',
      server: 'rumour-ws-mock',
      port: PORT,
      message: 'Welcome to Rumour WebSocket Echo Server'
    }));
  }

  socket.on('message', (data, isBinary) => {
    const text = isBinary ? `[binary:${data.length}bytes]` : data.toString();
    console.log(`[WS] Received: ${text}`);
    // Echo the message back exactly
    socket.send(text);
  });

  socket.on('close', (code, reason) => {
    console.log(`[WS] Client disconnected: code=${code} reason=${reason.toString() || 'none'}`);
  });

  socket.on('error', (err) => {
    console.error(`[WS] Socket error: ${err.message}`);
  });
});

wss.on('listening', () => {
  console.log(`\x1b[36m[WS-ECHO]\x1b[0m WebSocket echo server running at ws://localhost:${PORT}`);
});

wss.on('error', (err) => {
  console.error(`[WS] Server error: ${err.message}`);
  process.exit(1);
});
