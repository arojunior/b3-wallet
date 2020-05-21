const { DATA_FOLDER, FILES } = require(`../constants`);
const GetDataFromCEI = require(`../scripts/extractData`);
const updatePrices = require(`../scripts/updateData`);

let updateInterval;

const updateWallet = (client) => {
  updatePrices()
    .then((data) => {
      console.log(`Última atualização`, new Date().toLocaleString(`pt-BR`));
      client.emit(`walletUpdated`, data);
    })
    .catch(() => {});

  const FIVE_MINUTES = 300000;

  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(() => {
    updatePrices()
      .then((data) => {
        console.log(`Última atualização`, new Date().toLocaleString(`pt-BR`));
        client.emit(`walletUpdated`, data);
      })
      .catch(() => {});
  }, FIVE_MINUTES);
};

const importData = (client, { user, pass }) => {
  const getDataFromCEI = new GetDataFromCEI({ user, pass });

  return getDataFromCEI
    .extractData()
    .then(() => {
      updateWallet(client);
      client.emit(`dataImported`);
    })
    .catch((error) => {
      console.log(`error ao importar dados`, error);
      client.emit(`dataImported`);
    });
};

const getWallet = (client) => {
  try {
    client.emit(`wallet`, require(`${DATA_FOLDER}/${FILES.WALLET}`));
  } catch (e) {
    client.emit(`wallet`, { data: [] });
  }
};

const getCredentials = (client) => {
  try {
    const { user, pass } = require(`${DATA_FOLDER}/${FILES.CREDENTIALS}`);
    client.emit(`credentials`, { user, pass });
  } catch (e) {
    client.emit(`credentials`, {});
  }
};

module.exports = {
  getCredentials,
  getWallet,
  importData,
  updateWallet,
};
