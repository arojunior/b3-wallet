const puppeteer = require(`puppeteer`);
const fs = require(`fs`);
const buildWallet = require(`./processData`);
const { DATA_FOLDER, FILES } = require(`../constants`);

// CEI html selectors
const BROKER_SELECTOR = `#ctl00_ContentPlaceHolder1_ddlAgentes`;
const SEARCH_BTN_SELECTOR = `#ctl00_ContentPlaceHolder1_btnConsultar`;
const HEAD_TABLE_SELECTOR = `#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados > div > div > section > div > table > thead > tr > th`;
const BODY_TABLE_SELECTOR = `#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados > div > div > section > div > table > tbody > tr`;

const extractionData = [];

module.exports = async ({ user, pass }) => {
  console.log(`=== Extrator de dados CEI B3 ===`);
  fs.writeFileSync(`${DATA_FOLDER}/${FILES.CREDENTIALS}`, JSON.stringify({ user, pass }));

  return new Promise(async (resolve) => {
    /**
     * go to B3 page
     */
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // for log and better network/loading performance
    await page.setRequestInterception(true);
    page.on(`request`, (req) => {
      if (
        req.resourceType() == `stylesheet` ||
        req.resourceType() == `font` ||
        req.resourceType() == `image`
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // do auth
    await page.goto(`https://cei.b3.com.br/CEI_Responsivo/`);
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
    await page.goto(`https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx`);
    await page.waitForSelector(BROKER_SELECTOR);

    // extract brokers ids
    const brokers = await page.evaluate((selector) => {
      return Array.prototype.map.call(document.querySelector(selector).children, (el) => ({
        id: el.value,
        name: el.textContent.trim(),
      }));
    }, BROKER_SELECTOR);

    console.log(`=== CORRETORAS ===`);

    // extract information of each broker with one single account
    for (let index = 1; index < brokers.length; index++) {
      const { id: brokerId, name: brokerName } = brokers[index];
      extractionData[brokerId] = {
        name: brokerName,
        data: [],
      };

      await page.select(BROKER_SELECTOR, brokerId);
      await page.waitForResponse(`https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx`);
      await page.click(SEARCH_BTN_SELECTOR);
      await page.waitForResponse(`https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx`);

      try {
        await page.waitFor(BODY_TABLE_SELECTOR, { timeout: 30 * 1000 });
      } catch (error) {
        console.log(`==== CORRETORA ${brokerName} NÃO POSSUI ATIVOS NEGOCIADOS ====`);
        continue;
      }

      if (index == 1) {
        header = await page.evaluate((selector) => {
          return Array.prototype.map.call(document.querySelectorAll(selector), (el) =>
            el.textContent.trim(),
          );
        }, HEAD_TABLE_SELECTOR);
      }

      const rows = await page.evaluate((selector) => {
        return Array.prototype.map.call(document.querySelectorAll(selector), (el) =>
          Array.prototype.map.call(
            el.children,
            (subEl) => (subEl && subEl.textContent.trim()) || ``,
          ),
        );
      }, BODY_TABLE_SELECTOR);

      rows.forEach((row) => {
        const dataRow = {};
        row.forEach((col, index) => {
          dataRow[header[index]] = col;
        });
        extractionData[brokerId].data.push(dataRow);
      });

      console.log(`==== ${brokerName} ... ====`);
    }

    console.log(`==== RESULT ====`);
    const cleanResult = extractionData.filter((v) => v);
    fs.writeFileSync(`${DATA_FOLDER}/${FILES.EXTRACT}`, JSON.stringify(cleanResult));
    resolve(buildWallet());
  });
};
