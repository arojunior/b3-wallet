const puppeteer = require('puppeteer');
const readLine = require('readline-sync');
const fs = require('fs');

// Clear html selectors
const HEAD_TABLE_SELECTOR = '.cont_right cblc > table > thead > tr > th';
const BODY_TABLE_SELECTOR = '.entries-cblc-holder > tr';

const extractionData = [];

console.log(`=== Extrator de dados Clear corretora ===`);

const user = readLine.question(`Qual seu CPF? `);
const pass = readLine.question(`Qual a sua senha? `, { hideEchoBack: true });
const dateBirth = readLine.question(`Qual sua data de nascimento? (dd/mm/aaaa) `);

(async () => {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // for log and better network/loading performance 
  await page.setRequestInterception(true)  
  page.on('request', (req) => {
    if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
      req.abort()
    } else {
      req.continue()
    }
  })

  // do auth
  await page.goto('https://www.clear.com.br/pit/signin?controller=SignIn');
  await page.click('#identificationNumber');
  await page.keyboard.type(user);
  await page.click('#password');
  await page.keyboard.type(pass);
  await page.click('#dob');
  await page.keyboard.type(dateBirth);  
  await page.click('.bt_signin');

  console.log(`=== Login... `);

  console.log('=============================================')
  console.log('https://www.clear.com.br/pit/signin?controller=SignIn')
  page.content().then(value => {
    console.log(value)
  })

  // await page.waitForSelector('#container_slct', {
  //   timeout: 120000
  // });

  console.log(`=== Coletando dados da Clear corretora... Aguarde...`);

  // Navega para página de extrato financeiro do novo pit
  await page.goto('https://novopit.clear.com.br/MinhaConta/ExtratoFinanceiro');
  console.log('=============================================')
  console.log('https://novopit.clear.com.br/MinhaConta/ExtratoFinanceiro')
  page.content().then(value => {
    console.log(value)
  })
  await page.waitForSelector('#combo-filter-range');
  
  const rows = await page.evaluate((selector) => {
    return Array.prototype.map.call(
      document.querySelectorAll(selector),
      el => Array.prototype.map.call(el.children, subEl => subEl && subEl.textContent.trim() || '')
    )
  }, BODY_TABLE_SELECTOR)

  rows.forEach((row) => {
    const dataRow = {}
    row.forEach((col, index) => {
      dataRow[header[index]] = col
    })
    extractionData[brokerId].data.push(dataRow)
  })

  console.log(`==== RESULT ====`);
  const resultToText = JSON.stringify(extractionData.filter(v => v));
  console.log(resultToText);
  fs.writeFileSync('clear.json', resultToText);
  process.exit(0);  
})();
