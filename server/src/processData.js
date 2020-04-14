const fs = require('fs');
const result = require("../resultado.json");

/**
 * Constantes
 */
const DATA_FOLDER =  '../client/src/data';
const FILES = {
  STOCKS: 'stocks.json',
  STOCKS_TOTAL: 'acc-stocks.json',
  OPTIONS: 'stocks-options.json',
  OPTIONS_TOTAL: 'acc-stocks-options.json',
  FULL: 'full-operations.json'
}

const MONTHS = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro"
};

const COLUMNS = {
  PRICE: "Preco_(R$)",
  TOTAL_PRICE: "Valor_Total(R$)",
  DATE: "Data_do_Negocio",
  MONTH: "Mes",
  OPERATION: "Compra/Venda"
}

const OPCOES = ["Opção de Compra", "Opção de Venda"];

const ACOES = ["Merc. Fracionário", "Mercado a Vista"];

/* Utils */
const flatMap = a => [].concat(...a)

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

const accByMonth =  m => Object.values(MONTHS).map(month => {
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

