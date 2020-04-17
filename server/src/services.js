const axios = require('axios');

exports.getQuote = ticker => {
  return axios.get(`https://finance.yahoo.com/quote/${ticker}.sa/`).then(({ data }) => {
    const main = JSON.parse(data.split("root.App.main = ")[1].split(";\n}(this));")[0]);

    if (!main.context.dispatcher.stores.QuoteSummaryStore.financialData) {
      return null;
    }

    const quote = {
      ticker,
      price: parseFloat(main.context.dispatcher.stores.QuoteSummaryStore.price.regularMarketPrice.fmt),
      open: parseFloat(main.context.dispatcher.stores.QuoteSummaryStore.price.regularMarketOpen.fmt),
      high: parseFloat(main.context.dispatcher.stores.QuoteSummaryStore.price.regularMarketDayHigh.fmt),
      low: parseFloat(main.context.dispatcher.stores.QuoteSummaryStore.price.regularMarketDayLow.fmt),
      previousClose: parseFloat(main.context.dispatcher.stores.QuoteSummaryStore.price.regularMarketPreviousClose.fmt),
      volume: parseFloat(main.context.dispatcher.stores.QuoteSummaryStore.price.regularMarketVolume.fmt),
      marketChange: parseFloat(main.context.dispatcher.stores.QuoteSummaryStore.price.regularMarketChange.fmt),
      shortName: main.context.dispatcher.stores.QuoteSummaryStore.price.shortName,
      longName: main.context.dispatcher.stores.QuoteSummaryStore.price.longName,
    }

    return quote;
  })
  .catch(err => {
    console.log(err)
  });
};
