const fs = require(`fs`);
const { getQuote } = require(`../services/quoteService`);
const { DATA_FOLDER, FILES } = require(`../constants`);

const updateData = () => {
  try {
    const wallet = require(`../../data/wallet.json`);
    const requests = wallet.data.map(({ ticker }) => getQuote(ticker));

    return Promise.all(requests)
      .then((responses) => {
        const updatedWallet = wallet.data.map((stock) => {
          const quote = responses.find(({ ticker }) => ticker === stock.ticker);

          if (!quote) return stock;

          const currentPrice = quote.price;
          const totalCurrent = stock.quantity * quote.price;
          const variation = quote.marketChange;
          const totalVariation = parseFloat(
            ((totalCurrent - stock.totalPrice) * 100) / stock.totalPrice,
          );

          return {
            ...stock,
            currentPrice,
            totalCurrent,
            variation,
            totalVariation,
          };
        });
        const newWallet = { data: updatedWallet, updated: new Date() };
        fs.writeFileSync(`${DATA_FOLDER}/${FILES.WALLET}`, JSON.stringify(newWallet));
        return newWallet;
      })
      .catch(() => {
        console.log(`ERRO AO ATUALIZAR PREÇOS`);
        return {};
      });
  } catch (e) {
    return Promise.reject(Error(`ERRO AO ATUALIZAR PREÇOS`));
  }
};

module.exports = updateData;
