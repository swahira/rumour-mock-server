const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
// Accept JSON body for any Content-Type (Rumour's GraphQL handler may omit Content-Type header)
app.use(express.json({ limit: '100mb', type: () => true }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.originalUrl} (path: ${req.path})`);
  next();
});


// 1. Dynamic Topic Module Loader
// We will create individual files in routes/v2 for every topic you listed
const v2Dir = path.join(__dirname, 'routes', 'v2');
if (!fs.existsSync(v2Dir)) fs.mkdirSync(v2Dir, { recursive: true });

const catchAlls = [];

fs.readdirSync(v2Dir).forEach(file => {
  if (file.endsWith('.js')) {
    const routeName = file.replace('.js', '');
    const hyphenatedName = routeName.replace(/_/g, '-');
    const route = require(`./routes/v2/${file}`);

    if (routeName === 'playback' || routeName === 'docs_master') {
      catchAlls.push({ routeName, hyphenatedName, route });
    } else {
      // app.use(`/api/v2`, route);
      app.use(`/api/v2/${routeName}`, route);
      if (routeName !== hyphenatedName) {
        app.use(`/api/v2/${hyphenatedName}`, route);
      }
      console.log(`Loaded Topic Module: ${routeName}`);
    }
  }
});

// Generic /api/v2/headers fallback endpoint
app.get('/api/v2/headers', (req, res) => res.json(req.headers));

// Mount catch-alls last so they don't intercept specific routes
catchAlls.forEach(({ routeName, hyphenatedName, route }) => {
  app.use(`/api/v2`, route);
  app.use(`/api/v2/${routeName}`, route);
  if (routeName !== hyphenatedName) {
    app.use(`/api/v2/${hyphenatedName}`, route);
  }
  console.log(`Loaded Catch-all Module: ${routeName}`);
});

// Swagger Setup
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rumour Mock API',
      version: '2.0.0',
      description: 'API Documentation for the Rumour Testing Environment',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./routes/**/*.js', './server.js'], // files containing annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mock server endpoints for documentation examples
app.use('/', require('./routes/httpbin'));

// Legacy routes for backward compatibility during transition
app.use('/api/battle', require('./routes/battle'));
app.use('/api', require('./routes/misc'));
app.use('/api/files', require('./routes/files'));

// Root Status
app.get('/', (req, res) => {
  res.json({
    status: "Rumour Master Test Server Active",
    version: "2.0.0",
    modules_loaded: fs.readdirSync(v2Dir).filter(f => f.endsWith('.js'))
  });
});

const { fork } = require('child_process');

const spawnSubServer = (file) => {
  const p = fork(path.join(__dirname, file));
  p.on('error', (err) => console.error(`Failed to start ${file}:`, err));
  return p;
};

const wsProcess = spawnSubServer('ws_server.js');
const grpcProcess = spawnSubServer('grpc_server.js');
const mqttProcess = spawnSubServer('mqtt_server.js');

process.on('exit', () => {
  wsProcess.kill();
  grpcProcess.kill();
  mqttProcess.kill();
});

app.listen(PORT, () => {
  console.log(`\x1b[35m[MASTER]\x1b[0m Server initialized at http://localhost:${PORT}`);
});
