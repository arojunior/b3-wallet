const fs = require(`fs`);
const { DATA_FOLDER, FILES, MONTHS, ACOES, OLD_TICKERS } = require(`../constants`);
const {
  flatMap,
  onlyUnique,
  normalizeObjectKeys,
  convertStringToDate,
  convertStringToMoney,
  monthToName,
} = require(`../services/utils`);

const COLUMNS = {
  PRICE: `Preco_(R$)`,
  TOTAL_PRICE: `Valor_Total(R$)`,
  DATE: `Data_do_Negocio`,
  MONTH: `Mes`,
  OPERATION: `Compra/Venda`,
  TICKER: `Codigo_Negociacao`,
  QUANTITY: `Quantidade`,
};

/**
 * JSON parsing
 *
 * Normaliza os nomes das propriedades para um formato sem acentos e sem espaços
 * Converte datas para formato ISO
 * Convert valores de String para Number
 * */
class ProcessDataFromHistory {
  constructor(b3Result = []) {
    this.result = b3Result;
  }

  getParsedData() {
    return this.result.map((broker) => {
      const brokerData = broker.data.map((row) => {
        return {
          ...normalizeObjectKeys(row),
        };
      });

      return {
        ...broker,
        data: brokerData.map((data) => ({
          ...data,
          [COLUMNS.DATE]: convertStringToDate(data[COLUMNS.DATE]),
          [COLUMNS.MONTH]: monthToName(data[COLUMNS.DATE]),
          [COLUMNS.PRICE]: convertStringToMoney(data[COLUMNS.PRICE]),
          [COLUMNS.TOTAL_PRICE]: convertStringToMoney(data[COLUMNS.TOTAL_PRICE]),
        })),
      };
    });
  }

  /**
   * Filtering
   *
   * Separa em listas de Opções e Ações
   */
  filterByType(list, type, groupByBroker = false) {
    const applyFilter = (data) => data.filter((row) => type.includes(row[`Mercado`]));

    const filtered = list.map((broker) => {
      if (groupByBroker) {
        return {
          ...broker,
          data: applyFilter(broker.data),
        };
      }

      return applyFilter(broker.data);
    });

    return flatMap(filtered);
  }

  /**
   * Consolidação
   */
  accByMonth(m) {
    return Object.values(MONTHS).map((month) => {
      const filteredByMonth = m.filter((row) => row[COLUMNS.MONTH] === month);
      const sumAll = (prev, acc) => prev + acc[COLUMNS.TOTAL_PRICE];

      return {
        [month]: {
          compras: filteredByMonth
            .filter((row) => row[COLUMNS.OPERATION] === `C`)
            .reduce(sumAll, 0),
          vendas: filteredByMonth.filter((row) => row[COLUMNS.OPERATION] === `V`).reduce(sumAll, 0),
        },
      };
    });
  }

  /**
   * Monta lista única de tickers
   */
  getAllTickersFromHistory(stocksHistory) {
    return stocksHistory
      .map((row) => {
        const ticker = row[COLUMNS.TICKER];
        const isFracionado = ticker.charAt(ticker.length - 1) === `F`;

        if (isFracionado) {
          return ticker.substr(0, ticker.length - 1);
        }

        return ticker;
      })
      .filter((ticker) => !OLD_TICKERS.some((item) => item === ticker))
      .filter(onlyUnique)
      .sort();
  }

  /**
   * Carteira
   */
  generateCurrentlWallet(tickers) {
    const stocksHistory = this.filterByType(this.getParsedData(), ACOES);
    console.log(`Montando carteira de ações...`);
    /**
     * Percorre lista de tickers e calcula operações do extrato
     */
    const applyFilterByTicker = (row, ticker) => {
      return row[COLUMNS.TICKER] === ticker || row[COLUMNS.TICKER] === `${ticker}F`;
    };

    const wallet = tickers.map((stock) => {
      const operations = stocksHistory.filter((row) => applyFilterByTicker(row, stock.ticker));
      const {
        price: tickerPrice,
        totalPrice: tickerTotalPrice,
        quantity: quantityHistory,
      } = operations.reduce(
        (acc, row) => {
          /**
           * Calcula operação de compra
           */
          if (row[COLUMNS.OPERATION] === `C`) {
            const quantity = acc.quantity + Number(row[COLUMNS.QUANTITY].replace(`.`, ``));
            const totalPrice = acc.totalPrice + row[COLUMNS.TOTAL_PRICE];

            return {
              quantity,
              totalPrice,
              price: totalPrice / quantity,
            };
          }

          /**
           * Calcula operação de venda
           */
          const quantity = acc.quantity - Number(row[COLUMNS.QUANTITY]);
          const totalPrice = acc.totalPrice - row[COLUMNS.TOTAL_PRICE];

          return {
            quantity,
            totalPrice: quantity > 0 ? totalPrice : 0,
            price: quantity > 0 ? totalPrice / quantity : 0,
          };
        },
        { price: 0, totalPrice: 0, quantity: 0 },
      );

      return {
        ...stock,
        quantityHistory,
        price: parseFloat(tickerPrice),
        totalPrice: parseFloat(tickerTotalPrice),
        currentPrice: 0,
        totalCurrent: 0,
        variation: 0,
        totalVariation: 0,
      };
    });

    const builtWallet = { data: wallet, updated: new Date() };
    fs.writeFileSync(`${DATA_FOLDER}/${FILES.WALLET}`, JSON.stringify(builtWallet));
    console.log(`Carteira atualizada.`);
    return Promise.resolve(builtWallet);
  }
}

module.exports = ProcessDataFromHistory;
