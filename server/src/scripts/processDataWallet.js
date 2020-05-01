const fs = require(`fs`);
const { DATA_FOLDER, FILES } = require(`../constants`);
const { flatMap, toNumber } = require(`../services/utils`);

const COLUMNS = {
  PRICE: `Preço (R$)*`,
  TOTAL_PRICE: `Valor (R$)`,
  TICKER: `Cód. de Negociação`,
  QUANTITY: `Qtde.`,
};

const buildWallet = () => {
  const result = require(`../../data/b3_result.json`);
  const wallet = flatMap(result.map((broker) => broker.data));

  const data = wallet.map((row) => ({
    ticker: row[COLUMNS.TICKER],
    quantity: toNumber(row[COLUMNS.QUANTITY]),
    price: parseFloat(toNumber(row[COLUMNS.PRICE])),
    totalPrice: parseFloat(toNumber(row[COLUMNS.TOTAL_PRICE])),
    currentPrice: 0,
    totalCurrent: 0,
    variation: 0,
    totalVariation: 0,
  }));

  const builtWallet = { data, updated: new Date() };
  fs.writeFileSync(`${DATA_FOLDER}/${FILES.WALLET}`, JSON.stringify(builtWallet));

  return builtWallet;
};

buildWallet();

module.exports = buildWallet;
