const server = require('http').createServer();
const io = require('socket.io')(server, { transports: ['websocket'] });
const { DATA_FOLDER, FILES } = require('./constants');
const getDataFromB3 = require('./scripts/extractData');
const updatePrices = require('./scripts/updateData');

const port = 4000;
let updateInterval;

const updateWallet = client => {
  console.log('Última atualização', new Date().toLocaleString('pt-BR'));

  updatePrices().then(data => {
    client.emit('walletUpdated', data);
  })
  
  const FIVE_MINUTES = 300000;
  
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(() => {
    console.log('Última atualização', new Date().toLocaleString('pt-BR'));
    updatePrices().then(data => {
      client.emit('walletUpdated', data);
    })
  }, FIVE_MINUTES);
}

const importData = (client, { user, pass }) => {
  getDataFromB3({ user, pass }).then(() => {
    updateWallet(client);
  });
}

const getWallet = client => {
  try {
    client.emit('wallet', require(`${DATA_FOLDER}/${FILES.WALLET}`));
  } catch (e) {
    client.emit('wallet', {});
  }
}

io.on('connection', client => { 
  client.emit('connected');

  client.on('getWallet', () => {
    getWallet(client);
  })

  client.on('updateWallet', () => {
    updateWallet(client);
  })

  client.on('importData', credentials => {
    importData(client, credentials);
  })

});

server.listen(port, () => console.log(`server listening at http://localhost:${port}`))