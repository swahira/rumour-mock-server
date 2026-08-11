/**
 * Rumour gRPC EchoService Server
 * Port: 50051
 *
 * Usage: node grpc_server.js
 *
 * Services:
 *  - EchoService.Echo  → echoes message + value back with timestamp
 *  - EchoService.Ping  → returns pong + ok=true
 */

const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, 'echo.proto');
const PORT = 50051;

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDesc = grpc.loadPackageDefinition(packageDef);
const echoPackage = protoDesc.echo;

// ─── Handlers ─────────────────────────────────────────────────────────────────

function echo(call, callback) {
  const { message, value } = call.request;
  console.log(`[gRPC] Echo called: message="${message}", value=${value}`);

  callback(null, {
    echo: `echo: ${message}`,
    received_value: value || 0,
    timestamp: new Date().toISOString(),
  });
}

function ping(call, callback) {
  const { payload } = call.request;
  console.log(`[gRPC] Ping called: payload="${payload}"`);

  callback(null, {
    pong: `pong: ${payload || 'empty'}`,
    ok: true,
  });
}

// Permissive JSON serializer/deserializer to support Rumour's raw gRPC JSON payload format
const jsonServiceDefinition = {
  Echo: {
    path: '/echo.EchoService/Echo',
    requestStream: false,
    responseStream: false,
    requestSerialize: (obj) => Buffer.from(JSON.stringify(obj)),
    requestDeserialize: (buffer) => {
      try {
        return JSON.parse(buffer.toString('utf8'));
      } catch {
        return {};
      }
    },
    responseSerialize: (obj) => Buffer.from(JSON.stringify(obj)),
    responseDeserialize: (buffer) => JSON.parse(buffer.toString('utf8')),
  },
  Ping: {
    path: '/echo.EchoService/Ping',
    requestStream: false,
    responseStream: false,
    requestSerialize: (obj) => Buffer.from(JSON.stringify(obj)),
    requestDeserialize: (buffer) => {
      try {
        return JSON.parse(buffer.toString('utf8'));
      } catch {
        return {};
      }
    },
    responseSerialize: (obj) => Buffer.from(JSON.stringify(obj)),
    responseDeserialize: (buffer) => JSON.parse(buffer.toString('utf8')),
  }
};

const server = new grpc.Server();

server.addService(jsonServiceDefinition, {
  Echo: echo,
  Ping: ping,
});

server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(`[gRPC] Failed to bind: ${err.message}`);
      process.exit(1);
    }
    console.log(`\x1b[35m[gRPC-ECHO]\x1b[0m EchoService running at http://localhost:${port}`);
    console.log('  Service : echo.EchoService');
    console.log('  Methods : Echo, Ping');
  }
);
