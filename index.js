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

function run (pagesToScrape) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!pagesToScrape) {
                pagesToScrape = 1;
            }

            const browserFetcher = puppeteer.createBrowserFetcher();
            let revisionInfo = await browserFetcher.download('938248');

            var doAction = function () {
                let test=1;
                // your function code here
            }
            
            

            const browser = await puppeteer.launch( {  headless: false,
            args: ["--no-sandbox"] } );

            const page = await browser.newPage();
            // Ackknowledge popup request location access
            
            await page.on('body', async dialog => {
                console.log('here');
                await dialog.accept();ß
            });

            await page.setRequestInterception(true);

            // page.on('request', (request) => {
            //     if (request.resourceType() === 'document') {
            //         request.continue();
            //     } else {
            //         request.abort();
            //     }
            // });

            await page.goto("https://homehardware.ca/");
            await page.goto("https://www.homehardware.ca/en/thermostats/c/7449");

            let currentPage = 1;
            let urls = [];

            while (currentPage <= pagesToScrape) {



                let articleSelector = 'a.mz-productlisting-title.data-layer-productClick';
                await page.waitForSelector(articleSelector);

                let arrayOfItems = await page.evaluate((articleSelector) => {
                    
                    let results = [];

                    
                    const myNodeList = document.querySelectorAll(articleSelector);

                    const myArray = []; // empty Array
                    for (let i = 0; i < myNodeList.length; i++) {
                        const self = myNodeList[i];
                        myArray.push(self.innerHTML);
                        //console.log(self.innerHTML);
                    }

                    
                    return myArray;

                }, articleSelector);

                arrayOfItems.forEach(e => {
                    
                    console.log(e);
                
                });

                
                currentPage++;

            }

            browser.close();

            return resolve(urls);

        } catch (e) {

            return reject(e);
        }
    })
}
run(1).then(console.log).catch(console.error);
