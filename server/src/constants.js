exports.DATA_FOLDER = `${__dirname}/../data`;

exports.FILES = {
  EXTRACT: `b3_result.json`,
  STOCKS: `stocks.json`,
  STOCKS_TOTAL: `acc-stocks.json`,
  OPTIONS: `stocks-options.json`,
  OPTIONS_TOTAL: `acc-stocks-options.json`,
  FULL: `full-operations.json`,
  WALLET: `wallet.json`,
  CREDENTIALS: `credentials.json`,
};

exports.MONTHS = {
  1: `Janeiro`,
  2: `Fevereiro`,
  3: `Março`,
  4: `Abril`,
  5: `Maio`,
  6: `Junho`,
  7: `Julho`,
  8: `Agosto`,
  9: `Setembro`,
  10: `Outubro`,
  11: `Novembro`,
  12: `Dezembro`,
};

exports.COLUMNS = {
  PRICE: `Preco_(R$)`,
  TOTAL_PRICE: `Valor_Total(R$)`,
  DATE: `Data_do_Negocio`,
  MONTH: `Mes`,
  OPERATION: `Compra/Venda`,
  TICKER: `Codigo_Negociacao`,
  QUANTITY: `Quantidade`,
};

exports.OPCOES = [`Opção de Compra`, `Opção de Venda`];

exports.ACOES = [`Merc. Fracionário`, `Mercado a Vista`];

exports.OLD_TICKERS = [`NATU3`, `NATU3F`, `BMGB11`, `BMGB11F`];

exports.PORT = 9990;
