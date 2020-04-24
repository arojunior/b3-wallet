const fs = require('fs');
const { getQuote } = require('../services');
const { DATA_FOLDER, FILES } = require('../constants');

const updateData = () => {
  try {
    const wallet = require('../../data/wallet.json');
    const requests = wallet.data.map(({ ticker }) => getQuote(ticker));

    return Promise.all(requests).then(responses => {
      const updatedWallet = wallet.data.map(stock => {
        const quote = responses.find(({ ticker }) => ticker === stock.ticker);

        if (!quote) return stock;

        const preco_atual = quote.price;
        const total_atual = stock.quantidade * quote.price;
        const variacao_dia =  quote.marketChange;
        const variacao_total = parseFloat(((total_atual - stock.total_aquisicao) * 100 ) / stock.total_aquisicao);

        return {
          ...stock,
          preco_atual,
          total_atual,
          variacao_dia,
          variacao_total,
        };
      });
      const newWallet = { data: updatedWallet, updated: new Date() };
      fs.writeFileSync(`${DATA_FOLDER}/${FILES.WALLET}`, JSON.stringify(newWallet));
      return newWallet;
    }).catch(() => {
      console.log('ERRO AO ATUALIZAR PREÇOS');
      return {};
    });
  } catch (e) {
    return Promise.reject({});
  }
};

module.exports = updateData;

