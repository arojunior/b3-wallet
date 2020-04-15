const fs = require('fs');
const { getQuote } = require('./services');
const wallet = require('../../client/src/data/wallet.json');
const { DATA_FOLDER, FILES } = require('./constants');

const updateData = () => {
  const requests = wallet.map(({ ticker }) => getQuote(ticker));

  Promise.all(requests).then(responses => {
    const updatedWallet = wallet.map(stock => {
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
    
    fs.writeFileSync(`${DATA_FOLDER}/${FILES.WALLET}`, JSON.stringify(updatedWallet));
  }).catch(err => {
    console.log('ERRO AO ATUALIZAR PREÇOS', err);
  });
};

updateData();

const FIVE_MINUTES = 300000;

setInterval(() => {
  updateData();
}, FIVE_MINUTES);