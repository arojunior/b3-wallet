const fs = require(`fs`);
const { DATA_FOLDER, FILES, MONTHS, OPCOES, ACOES, OLD_TICKERS } = require(`../constants`);
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

const processData = () => {
  const result = require(`../../data/b3_result.json`);
  const resultParsed = result.map((broker) => {
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

  fs.writeFileSync(`${DATA_FOLDER}/${FILES.FULL}`, JSON.stringify(resultParsed));

  /**
   * Filtering
   *
   * Separa em listas de Opções e Ações
   * */

  const filterByType = (list, type, groupByBroker = false) => {
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
  };

  const opcoesList = filterByType(resultParsed, OPCOES);
  const acoesList = filterByType(resultParsed, ACOES);

  fs.writeFileSync(`${DATA_FOLDER}/${FILES.STOCKS}`, JSON.stringify(acoesList));
  fs.writeFileSync(`${DATA_FOLDER}/${FILES.OPTIONS}`, JSON.stringify(opcoesList));

  /**
   * Consolidação
   */

  const accByMonth = (m) =>
    Object.values(MONTHS).map((month) => {
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

  fs.writeFileSync(`${DATA_FOLDER}/${FILES.STOCKS_TOTAL}`, JSON.stringify(accByMonth(acoesList)));
  fs.writeFileSync(`${DATA_FOLDER}/${FILES.OPTIONS_TOTAL}`, JSON.stringify(accByMonth(opcoesList)));

  return { acoesList, opcoesList };
};

/**
 * Carteira
 */
const buildWallet = () => {
  const wallet = {};
  const { acoesList } = processData();
  /**
   * Monta lista única de tickers
   */
  console.log(`Montando carteira de ações...`);
  const tickers = acoesList
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

  /**
   * Percorre lista de tickers e calcula operações do extrato
   */
  const applyFilterByTicker = (row, ticker) => {
    return row[COLUMNS.TICKER] === ticker || row[COLUMNS.TICKER] === `${ticker}F`;
  };

  tickers.forEach((ticker) => {
    const operationsByTicker = acoesList.filter((row) => applyFilterByTicker(row, ticker));

    wallet[ticker] = { quantity: 0, totalPrice: 0, price: 0 };

    operationsByTicker.forEach((row) => {
      /**
       * Calcula operação de compra
       */
      if (row[COLUMNS.OPERATION] === `C`) {
        const quantity = wallet[ticker].quantity + Number(row[COLUMNS.QUANTITY].replace(`.`, ``));
        const totalPrice = wallet[ticker].totalPrice + row[COLUMNS.TOTAL_PRICE];

        wallet[ticker] = {
          quantity,
          totalPrice,
          price: totalPrice / quantity,
        };
      }

      /**
       * Calcula operação de venda
       */
      if (row[COLUMNS.OPERATION] === `V`) {
        const quantity = wallet[ticker].quantity - Number(row[COLUMNS.QUANTITY]);
        const totalPrice = wallet[ticker].totalPrice - row[COLUMNS.TOTAL_PRICE];

        wallet[ticker] = {
          quantity,
          totalPrice: quantity > 0 ? totalPrice : 0,
          price: quantity > 0 ? totalPrice / quantity : 0,
        };
      }
    });
  });

  /**
   * Transforma object em array
   */
  const walletArray = Object.keys(wallet)
    .map((ticker) => ({
      ticker,
      quantity: wallet[ticker].quantity,
      price: parseFloat(wallet[ticker].price),
      totalPrice: parseFloat(wallet[ticker].totalPrice),
      currentPrice: 0,
      totalCurrent: 0,
      variation: 0,
      totalVariation: 0,
    }))
    .filter(({ quantity }) => quantity > 0);

  const builtWallet = { data: walletArray, updated: new Date() };
  fs.writeFileSync(`${DATA_FOLDER}/${FILES.WALLET}`, JSON.stringify(builtWallet));
  console.log(`Carteira atualizada.`);
  return Promise.resolve(builtWallet);
};
// buildWallet();

module.exports = buildWallet;
