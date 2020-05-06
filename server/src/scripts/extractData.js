const puppeteer = require(`puppeteer`);
const fs = require(`fs`);
const buildWallet = require(`./processDataHistory`);
const { DATA_FOLDER, FILES } = require(`../constants`);

const DEFAULT_TIMEOUT = { timeout: 8 * 1000 };

// CEI pages
const LOGIN_PAGE = `https://cei.b3.com.br/CEI_Responsivo/`;
const STOCKS_PAGE = `https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx`;

// CEI html selectors
const BROKER_SELECTOR = `#ctl00_ContentPlaceHolder1_ddlAgentes`;
const SEARCH_BTN_SELECTOR = `#ctl00_ContentPlaceHolder1_btnConsultar`;
const HEAD_TABLE_SELECTOR = `#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados > div > div > section > div > table > thead > tr > th`;
const BODY_TABLE_SELECTOR = `#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados > div > div > section > div > table > tbody > tr`;

module.exports = async ({ user, pass }) => {
  console.log(`=== Extrator de dados CEI B3 ===`);
  fs.writeFileSync(`${DATA_FOLDER}/${FILES.CREDENTIALS}`, JSON.stringify({ user, pass }));

  /**
   * go to B3 page
   */
  const getExtractData = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // for log and better network/loading performance
    await page.setRequestInterception(true);
    page.on(`request`, (req) => {
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
    await page.goto(LOGIN_PAGE);
    await page.click(`#ctl00_ContentPlaceHolder1_txtLogin`);
    await page.keyboard.type(user);
    await page.click(`#ctl00_ContentPlaceHolder1_txtSenha`);
    await page.keyboard.type(pass);
    await page.click(`#ctl00_ContentPlaceHolder1_btnLogar`);

    console.log(`=== Login... `);

    try {
      await page.waitForSelector(`#ctl00_Breadcrumbs_lblTituloPagina`, {
        timeout: 120000,
      });
    } catch (e) {
      fs.writeFileSync(`${DATA_FOLDER}/${FILES.CREDENTIALS}`, JSON.stringify({}));
    }

    console.log(`=== Coletando dados da B3... Aguarde...`);

    // nagivate to negociations and waiting for DOM load
    await page.goto(STOCKS_PAGE);
    await page.waitForSelector(BROKER_SELECTOR);

    // extract brokers ids
    const brokers = await page.evaluate((selector) => {
      return Array.prototype.map
        .call(document.querySelector(selector).children, (el) => ({
          id: el.value,
          name: el.textContent.trim(),
        }))
        .filter(({ id }) => id !== `-1`);
    }, BROKER_SELECTOR);

    console.log(`=== CORRETORAS === `, brokers.map(({ name }) => name).join(`, `));

    // extract information of each broker with one single account
    const getDataByBroker = async (previousBroker, broker) => {
      const { id: brokerId, name: brokerName } = broker;
      console.log(`==== ${brokerName} | Selecionada  ====`);
      await page.select(BROKER_SELECTOR, brokerId);
      await page.waitForResponse(STOCKS_PAGE);
      await page.click(SEARCH_BTN_SELECTOR);
      await page.waitForResponse(STOCKS_PAGE);

      try {
        await page.waitForSelector(BODY_TABLE_SELECTOR, DEFAULT_TIMEOUT);
      } catch (error) {
        console.log(`==== ${brokerName} | NÃO POSSUI ATIVOS NEGOCIADOS ====`);
        await page.click(SEARCH_BTN_SELECTOR);
        await page.waitForResponse(STOCKS_PAGE, DEFAULT_TIMEOUT);
        return Promise.resolve([...previousBroker, { name: brokerName, data: [] }]);
      }

      const header = await page.evaluate((selector) => {
        return Array.prototype.map.call(document.querySelectorAll(selector), (el) =>
          el.textContent.trim(),
        );
      }, HEAD_TABLE_SELECTOR);

      const rows = await page.evaluate((selector) => {
        return Array.prototype.map.call(document.querySelectorAll(selector), (el) =>
          Array.prototype.map.call(
            el.children,
            (subEl) => (subEl && subEl.textContent.trim()) || ``,
          ),
        );
      }, BODY_TABLE_SELECTOR);

      const brokerData = [];

      rows.forEach((row) => {
        const dataRow = {};
        row.forEach((col, index) => {
          dataRow[header[index]] = col;
        });
        brokerData.push(dataRow);
      });

      console.log(`==== ${brokerName} | Dados coletados  ====`);
      await page.click(SEARCH_BTN_SELECTOR);
      await page.waitForResponse(STOCKS_PAGE, DEFAULT_TIMEOUT);
      return Promise.resolve([...previousBroker, { name: brokerName, data: brokerData }]);
    };

    const result = brokers.reduce((accumulatorPromise, broker) => {
      return accumulatorPromise.then((previousBroker) => {
        return getDataByBroker(previousBroker, broker);
      });
    }, Promise.resolve([]));

    return result.then((allData) => {
      console.log(`==== FIM DA IMPORTAÇÃO ====`);

      if (allData.length) {
        fs.writeFileSync(`${DATA_FOLDER}/${FILES.EXTRACT}`, JSON.stringify(allData));
      }

      return allData;
    });
  };

  return getExtractData().then((result) => {
    if (!result.length) {
      throw Error(`Nenhum dado foi extraído`);
    }
    return buildWallet();
  });
};
