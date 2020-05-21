const { flatMap, toNumber } = require(`../services/utils`);

const COLUMNS = {
  TICKER: `Cód. de Negociação`,
  QUANTITY: `Qtde.`,
};

class ProcessDataFromWallet {
  constructor(wallet = []) {
    this.wallet = wallet;
  }

  getFullWallet() {
    const mergedWallet = flatMap(this.wallet.map((broker) => broker.data));

    return mergedWallet.map((row) => ({
      ticker: row[COLUMNS.TICKER],
      quantity: toNumber(row[COLUMNS.QUANTITY]),
    }));
  }
}

module.exports = ProcessDataFromWallet;
