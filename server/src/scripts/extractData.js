const puppeteer = require(`puppeteer`);
const fs = require(`fs`);
const ProcessDataFromHistory = require(`./processDataHistory`);
const ProcessDataFromWallet = require(`./processDataWallet`);
const { DATA_FOLDER, FILES, CEI } = require(`../constants`);

const DEFAULT_TIMEOUT = { timeout: 8 * 1000 };

class GetDataFromCEI {
  constructor({ user, pass }) {
    console.log(`=== Extrator de dados CEI B3 ===`);
    this.user = user;
    this.pass = pass;
  }

  async openBrowser() {
    this.browser = await puppeteer.launch();
    this.browserTab = await this.browser.newPage();
  }

  /**
   * go to B3 page
   */
  async goToWebsiteAndDoLogin() {
    fs.writeFileSync(
      `${DATA_FOLDER}/${FILES.CREDENTIALS}`,
      JSON.stringify({ user: this.user, pass: this.pass }),
    );

    // for log and better network/loading performance
    await this.browserTab.setRequestInterception(true);
    this.browserTab.on(`request`, (req) => {
      if (
        req.resourceType() === `stylesheet` ||
        req.resourceType() === `font` ||
        req.resourceType() === `image`
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // do auth
    await this.browserTab.goto(CEI.LOGIN_PAGE);
    await this.browserTab.click(`#ctl00_ContentPlaceHolder1_txtLogin`);
    await this.browserTab.keyboard.type(this.user);
    await this.browserTab.click(`#ctl00_ContentPlaceHolder1_txtSenha`);
    await this.browserTab.keyboard.type(this.pass);
    await this.browserTab.click(`#ctl00_ContentPlaceHolder1_btnLogar`);

    console.log(`=== Login... `);

    try {
      await this.browserTab.waitForSelector(`#ctl00_Breadcrumbs_lblTituloPagina`, {
        timeout: 120000,
      });
    } catch (e) {
      fs.writeFileSync(`${DATA_FOLDER}/${FILES.CREDENTIALS}`, JSON.stringify({}));
    }

    console.log(`=== Coletando dados da B3... Aguarde...`);
  }

  // extract information of each broker with one single account
  async getDataByBroker(previousBroker, { broker, page, tableHead, tableBody }) {
    const { id: brokerId, name: brokerName } = broker;
    console.log(`==== ${brokerName} | Selecionada  ====`);
    await this.browserTab.select(CEI.BROKER_SELECTOR, brokerId);
    await this.browserTab.waitForResponse(page);
    await this.browserTab.click(CEI.SEARCH_BTN_SELECTOR);
    await this.browserTab.waitForResponse(page);

    try {
      await this.browserTab.waitForSelector(tableBody, DEFAULT_TIMEOUT);
    } catch (error) {
      console.log(`==== ${brokerName} | NÃO POSSUI ATIVOS NEGOCIADOS ====`);
      await this.browserTab.click(CEI.SEARCH_BTN_SELECTOR);
      await this.browserTab.waitForResponse(page, DEFAULT_TIMEOUT);
      return Promise.resolve([...previousBroker, { name: brokerName, data: [] }]);
    }

    const header = await this.browserTab.evaluate((selector) => {
      return Array.prototype.map.call(document.querySelectorAll(selector), (el) =>
        el.textContent.trim(),
      );
    }, tableHead);

    const rows = await this.browserTab.evaluate((selector) => {
      return Array.prototype.map.call(document.querySelectorAll(selector), (el) =>
        Array.prototype.map.call(el.children, (subEl) => (subEl && subEl.textContent.trim()) || ``),
      );
    }, tableBody);

    const brokerData = [];

    rows.forEach((row) => {
      const dataRow = {};
      row.forEach((col, index) => {
        dataRow[header[index]] = col;
      });
      brokerData.push(dataRow);
    });

    console.log(`==== ${brokerName} | Dados coletados  ====`);
    await this.browserTab.click(CEI.SEARCH_BTN_SELECTOR);
    await this.browserTab.waitForResponse(page, DEFAULT_TIMEOUT);
    return Promise.resolve([...previousBroker, { name: brokerName, data: brokerData }]);
  }

  async getDataFromAllBrokers({ page, file, tableHead, tableBody }) {
    // nagivate to negociations and waiting for DOM load
    await this.browserTab.goto(page);
    await this.browserTab.waitForSelector(CEI.BROKER_SELECTOR);
    console.log(`==== ${page} ====`);
    // extract brokers ids
    this.brokers = await this.browserTab.evaluate((selector) => {
      return Array.prototype.map
        .call(document.querySelector(selector).children, (el) => ({
          id: el.value,
          name: el.textContent.trim(),
        }))
        .filter(({ id }) => id !== `-1` && id !== `0`);
    }, CEI.BROKER_SELECTOR);

    console.log(`=== CORRETORAS === `, this.brokers.map(({ name }) => name).join(`, `));

    const result = this.brokers.reduce((accumulatorPromise, broker) => {
      return accumulatorPromise.then((previousBroker) => {
        return this.getDataByBroker(previousBroker, { broker, page, tableHead, tableBody });
      });
    }, Promise.resolve([]));

    return result.then((allData) => {
      console.log(`==== FIM DA IMPORTAÇÃO ====`);

      if (allData.length) {
        fs.writeFileSync(`${DATA_FOLDER}/${file}`, JSON.stringify(allData));
      }

      return allData;
    });
  }

  async extractData() {
    await this.openBrowser();
    await this.goToWebsiteAndDoLogin();
    const history = await this.getDataFromAllBrokers({
      page: CEI.STOCKS_HISTORY,
      file: FILES.EXTRACT_HISTORY,
      tableHead: CEI.HISTORY_HEAD_TABLE_SELECTOR,
      tableBody: CEI.HISTORY_BODY_TABLE_SELECTOR,
    });

    const wallet = await this.getDataFromAllBrokers({
      page: CEI.STOCKS_WALLET,
      file: FILES.EXTRACT_WALLET,
      tableHead: CEI.WALLET_HEAD_TABLE_SELECTOR,
      tableBody: CEI.WALLET_BODY_TABLE_SELECTOR,
    });

    const processDataHistory = new ProcessDataFromHistory(history);
    const processDataWallet = new ProcessDataFromWallet(wallet);
    return processDataHistory.generateCurrentlWallet(processDataWallet.getFullWallet());
  }
}

module.exports = GetDataFromCEI;
