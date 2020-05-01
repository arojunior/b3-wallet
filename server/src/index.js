const server = require('http').createServer();
const io = require('socket.io')(server, { transports: ['websocket'] });
const { PORT } = require('./constants');
const walletService = require('./services/walletService');

io.on('connection', (client) => {
  client.emit('connected');

  client.on('getWallet', () => {
    walletService.getWallet(client);
  });

  client.on('getCredentials', () => {
    walletService.getCredentials(client);
  });

  client.on('updateWallet', () => {
    walletService.updateWallet(client);
  });

  client.on('importData', (credentials) => {
    walletService.importData(client, credentials);
  });
});

server.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
