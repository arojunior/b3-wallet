const server = require('http').createServer();
const io = require('socket.io')(server, { transports: ['websocket'] });
const { DATA_FOLDER, FILES } = require('./constants');
const getDataFromB3 = require('./scripts/extractData');
const updatePrices = require('./scripts/updateData');

const port = 4000;
let updateInterval;

const updateWallet = (client) => {
  
  updatePrices().then((data) => {
    console.log('Última atualização', new Date().toLocaleString('pt-BR'));
    client.emit('walletUpdated', data);
  }).catch(() => {});

  const FIVE_MINUTES = 300000;

  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(() => {    
    updatePrices().then((data) => {
      console.log('Última atualização', new Date().toLocaleString('pt-BR'));
      client.emit('walletUpdated', data);
    }).catch(() => {});
  }, FIVE_MINUTES);
};

const importData = (client, { user, pass }) => {
  getDataFromB3({ user, pass }).then(() => {
    updateWallet(client);
  });
};

const getWallet = (client) => {
  try {
    client.emit('wallet', require(`${DATA_FOLDER}/${FILES.WALLET}`));
  } catch (e) {
    client.emit('wallet', {});
  }
};

const getCredentials = (client) => {
  try {
    const { user, pass } = require(`${DATA_FOLDER}/${FILES.CREDENTIALS}`);
    client.emit('credentials', { user, pass });
  } catch (e) {}
};

io.on('connection', (client) => {
  client.emit('connected');

  client.on('getWallet', () => {
    getWallet(client);
  });

  client.on('getCredentials', () => {
    getCredentials(client);
  });

  client.on('updateWallet', () => {
    updateWallet(client);
  });

  client.on('importData', (credentials) => {
    importData(client, credentials);
  });
});

server.listen(port, () =>
  console.log(`server listening at http://localhost:${port}`)
);
