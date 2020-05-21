exports.DATA_FOLDER = `${__dirname}/../data`;

exports.FILES = {
  EXTRACT_HISTORY: `b3_result_history.json`,
  EXTRACT_WALLET: `b3_result_wallet.json`,
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

exports.CEI = {
  // CEI pages
  LOGIN_PAGE: `https://cei.b3.com.br/CEI_Responsivo/`,
  STOCKS_HISTORY: `https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx`,
  STOCKS_WALLET: `https://cei.b3.com.br/CEI_Responsivo/ConsultarCarteiraAtivos.aspx`,
  // CEI html selectors
  BROKER_SELECTOR: `#ctl00_ContentPlaceHolder1_ddlAgentes`,
  SEARCH_BTN_SELECTOR: `#ctl00_ContentPlaceHolder1_btnConsultar`,
  HISTORY_HEAD_TABLE_SELECTOR: `#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados > div > div > section > div > table > thead > tr > th`,
  HISTORY_BODY_TABLE_SELECTOR: `#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados > div > div > section > div > table > tbody > tr`,
  WALLET_HEAD_TABLE_SELECTOR: `#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_rprCarteira_ctl00_grdCarteira > thead > tr > th`,
  WALLET_BODY_TABLE_SELECTOR: `#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_rprCarteira_ctl00_grdCarteira > tbody > tr`,
};
