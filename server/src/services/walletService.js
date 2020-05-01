const { DATA_FOLDER, FILES } = require('../constants');
const getDataFromB3 = require('../scripts/extractData');
const updatePrices = require('../scripts/updateData');

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
    client.emit('dataImported', true);
  }).catch(() => {
    client.emit('dataImported', true);
  })
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

module.exports = {
  getCredentials,
  getWallet,
  importData,
  updateWallet
};