const Aedes = require('aedes');
const aedes = new Aedes.Aedes();
const server = require('net').createServer(aedes.handle);
const PORT = 1883;

server.listen(PORT, '127.0.0.1', function () {
  console.log(`\x1b[33m[MQTT-BROKER]\x1b[0m Aedes MQTT broker running at mqtt://127.0.0.1:${PORT}`);
});

aedes.on('client', function (client) {
  console.log(`[MQTT] Client Connected: \x1b[33m${client ? client.id : client}\x1b[0m`);
});
