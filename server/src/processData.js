const fs = require('fs');
const result = require("../../client/src/data/b3_result.json");
const { DATA_FOLDER, FILES, MONTHS, COLUMNS, OPCOES, ACOES } = require('./constants');

/* Utils */
const flatMap = a => [].concat(...a);

const onlyUnique = (value, index, self) => self.indexOf(value) === index;

const normalizeText = value =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ /g, "_");

const normalizeObjectKeys = obj => {
  Object.keys(obj).forEach(key => {
    const newKey = normalizeText(key);

    if (key !== newKey) {
      Object.defineProperty(
        obj,
        newKey,
        Object.getOwnPropertyDescriptor(obj, key)
      );
      delete obj[key];
    }
  });

  return obj;
};

const convertStringToDate = value => {
  const pieces = value.split("/");
  const year = pieces[2];
  const month = pieces[1];
  const day = pieces[0];
  return new Date(`${year}-${month}-${day}`);
};

const convertStringToMoney = value => {
  return Number(value.replace(".", "").replace(",", "."));
};

const monthToName = value => {
  return MONTHS[Number(value.split("/")[1])];
};

/**
 * JSON parsing
 *
 * Normaliza os nomes das propriedades para um formato sem acentos e sem espaços
 * Converte datas para formato ISO
 * Convert valores de String para Number
 * */
const resultParsed = result.map(broker => {
  const brokerData = broker.data.map(row => {
    return {
      ...normalizeObjectKeys(row)
    };
  });

  return {
    ...broker,
    data: brokerData.map(data => ({
      ...data,
      [COLUMNS.DATE]: convertStringToDate(data[COLUMNS.DATE]),
      [COLUMNS.MONTH]: monthToName(data[COLUMNS.DATE]),
      [COLUMNS.PRICE]: convertStringToMoney(data[COLUMNS.PRICE]),
      [COLUMNS.TOTAL_PRICE]: convertStringToMoney(data[COLUMNS.TOTAL_PRICE])
    }))
  };
});

fs.writeFileSync(`${DATA_FOLDER}/${FILES.FULL}`, JSON.stringify(resultParsed));

/**
 * Filtering
 *
 * Separa em listas de Opções e Ações
 * */

const filterByType = (list, type, groupByBroker = false) => {
  const applyFilter = data => data.filter(row => type.includes(row["Mercado"]));
  
  const filtered =  list.map(broker => {
    if (groupByBroker) {
      return {
        ...broker,
        data: applyFilter(broker.data)
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

const accByMonth = m => Object.values(MONTHS).map(month => {
  const filteredByMonth = m.filter(row => row[COLUMNS.MONTH] === month);
  const sumAll = (prev, acc) => prev + acc[COLUMNS.TOTAL_PRICE];

  return {
    [month]: {
      compras: filteredByMonth
        .filter(row => row[COLUMNS.OPERATION] === "C")
        .reduce(sumAll, 0),
      vendas: filteredByMonth
        .filter(row => row[COLUMNS.OPERATION] === "V")
        .reduce(sumAll, 0)
    }
  };
});

fs.writeFileSync(`${DATA_FOLDER}/${FILES.STOCKS_TOTAL}`, JSON.stringify(accByMonth(acoesList)));
fs.writeFileSync(`${DATA_FOLDER}/${FILES.OPTIONS_TOTAL}`, JSON.stringify(accByMonth(opcoesList)));

/**
 * Carteira
 */
const buildWallet = () => {
  let wallet = {};

  /**
   * Monta lista única de tickers
   */
  const tickers = acoesList.map(row =>  {
    const ticker = row[COLUMNS.TICKER];
    const isFracionado = ticker.charAt(ticker.length - 1) === 'F';

    if (isFracionado) {
      return ticker.substr(0, ticker.length - 1);
    }

    return ticker;
  })
  .filter(onlyUnique).sort(); 

  /**
   * Percorre lista de tickers e calcula operações do extrato
   */
  tickers.forEach(ticker => {
    const operationsByTicker = acoesList.filter(row =>  {
      return row[COLUMNS.TICKER] === ticker || row[COLUMNS.TICKER] === `${ticker}F`;
    });
    
    wallet[ticker] = { quantidade: 0, total_aquisicao: 0, preco_medio: 0 };
    
    operationsByTicker.forEach(row => {

      /**
       * Calcula operação de compra
       */
      if (row[COLUMNS.OPERATION] === "C") {
        const quantidade = wallet[ticker].quantidade + Number(row[COLUMNS.QUANTITY]);
        const total_aquisicao = wallet[ticker].total_aquisicao + row[COLUMNS.TOTAL_PRICE];
        
        wallet[ticker] = {
          quantidade,
          total_aquisicao,
          preco_medio: total_aquisicao / quantidade
        };
      }

      /**
       * Calcula operação de venda
       */
      if (row[COLUMNS.OPERATION] === "V") {
        const quantidade = wallet[ticker].quantidade - Number(row[COLUMNS.QUANTITY]);
        const total_aquisicao = wallet[ticker].total_aquisicao - row[COLUMNS.TOTAL_PRICE];
        
        wallet[ticker] = {
          quantidade,
          total_aquisicao: quantidade > 0 ? total_aquisicao : 0,
          preco_medio: quantidade > 0 ? total_aquisicao / quantidade : 0,
        };
      }
    });
  });

  /**
   * Transforma object em array
   */
  const walletArray = Object.keys(wallet).map(ticker => ({
    ticker,
    quantidade: wallet[ticker].quantidade,
    preco_medio: parseFloat(wallet[ticker].preco_medio),
    total_aquisicao: parseFloat(wallet[ticker].total_aquisicao),
  })).filter(({ quantidade }) => quantidade > 0);

  return { data: walletArray, updated: new Date() };
}

fs.writeFileSync(`${DATA_FOLDER}/${FILES.WALLET}`, JSON.stringify(buildWallet()));

console.log(`==== DADOS PROCESSADOS COM SUCESSO ====`);
