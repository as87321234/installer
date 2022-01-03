// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality.
// Any number of plugins can be added through `puppeteer.use()`
const puppeteer = require('puppeteer-extra')

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

const args = [
'--no-sandbox',
'--no-headless',
'--disable-setuid-sandbox',
'--disable-infobars',
'--window-position=0,0',
'--ignore-certifcate-errors',
'--ignore-certifcate-errors-spki-list',
'--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
];

function run (pagesToScrape) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!pagesToScrape) {
                pagesToScrape = 1;
            }

	    const browserFetcher = puppeteer.createBrowserFetcher();
	    let revisionInfo = await browserFetcher.download('938248');

	    const browser = await puppeteer.launch( {  headless: false,
        args: ["--no-sandbox"] } );

            const page = await browser.newPage();
            // Ackknowledge popup request location access
            await page.on('body', async dialog => {
                console.log('here');
                await dialog.accept();
            });

            await page.setRequestInterception(true);

            //page.on('request', (request) => {
                //if (request.resourceType() === 'document') {
                    //request.continue();
                //} else {
                    //request.abort();
                //}
            //});

            await page.goto("https://homehardware.ca/");
            await page.goto("https://www.homehardware.ca/en/thermostats/c/7449");

            let currentPage = 1;
            let urls = [];

            while (currentPage <= pagesToScrape) {

                await page.waitForSelector('.mz-productlisting.datalayer-parent-element.ign-data-product-impression.mz-productlist-tiled');

                let res = await page.evaluate(() => {

                    let results = [];
                    let items = document.querySelectorAll('div.mz-productlisting');

                });

                console.log(res);

                let newUrls = await page.evaluate(() => {

                    let results = [];
                    let items = document.querySelectorAll('div.mz-productlisting');

                    items.forEach((item) => {
                        results.push({
                            url:  item.getAttribute('href'),
                            text: item.innerText,
                        });
                    });

                    return results;
                });

                urls = urls.concat(newUrls);

                if (currentPage < pagesToScrape) {
                    await Promise.all([
                        await page.waitForSelector('a.morelink'),
                        await page.click('a.morelink'),
                        await page.waitForSelector('a.titlelink')
                    ])
                }

                currentPage++;

            }

            browser.close();

            return resolve(urls);

        } catch (e) {

            return reject(e);
        }
    })
}
run(5).then(console.log).catch(console.error);
