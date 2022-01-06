// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality.
// Any number of plugins can be added through `puppeteer.use()`
var puppeteer = require("puppeteer-extra");

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
var StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
var AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// Dom Parser
const { DOMParser } = require("xmldom");

/**
 * Function get host
 * @htmldom    {xmldom} name    HTML DOM
 * @return     {String}         Return product Title
 */
let getSiteHostname = function (url) {
  result = findAttribute(htmldom, "a", "href", 1);
  return url.replace(" ", "%20");
};

/**
 * Function replace space with %20
 * @htmldom    {xmldom} name    HTML DOM
 * @return     {String}         Return product Title
 */
let replaceSpace = function (url) {
  return url.replace(" ", "%20");
};

/**
 * Function find first attribute from html DOM based on tagname and attribute
 * @htmldom    {xmldom} name    HTML DOM
 * @return     {String}         Return product Title
 */
let findByAttributeInnerText = function (
  htmldom,
  tagName,
  propertyMatch,
  matchpos
) {
  let result = "";

  let tag = Array.from(htmldom.getElementsByTagName(tagName));
  tag.every((element) => {
    let indx = 1;
    let property = propertyMatch.split("=")[0];
    let value = propertyMatch.split("=")[1];
    let result = "";
    let innetText = "";

    result = element.getAttribute(property);

    if (result == value && matchpos == indx) {
      innerText = element.firstChild.nodeValue;
      return false;
    }
    indx++;

    return true;
  });

  return innerText;
};

/**
 * Function return the product Title
 * @htmldom    {xmldom} name    HTML DOM
 * @return     {String}         Return product Title
 */
let getProductTitle = function (htmldom) {
  result = findAttribute(htmldom, "a", "title", 1);
  console.log("title: " + result);
  return result;
};

/**
 * Function return the product Title
 * @htmldom    {xmldom} name    HTML DOM
 * @return     {String}         Return product Title
 */
let getProductImage = function (htmldom) {
  let tagImg = htmldom.getElementsByTagName("img");
  return tagImg[1].attribute[0];
};

function run(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const browserFetcher = puppeteer.createBrowserFetcher();
      let revisionInfo = await browserFetcher.download("938248");

      var doAction = function () {
        let test = 1;
        // your function code here
      };

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
          '--window-size=1920,1080',
          '--no-sandbox',
          '--disable-gpu',
          '--no-zygote',
          '--disable-setuid-sandbox',
          '--disable-accelerated-2d-canvas',
          '--disable-dev-shm-usage']
      });


      const page = await browser.newPage();
      // Ackknowledge popup request location access
      await page.setViewport({ width: 1280, height: 800 })
      await page.setDefaultNavigationTimeout(30000);

      // Enable Image Request Interceptor
      await enableImageReqInterceptor(page);

      let urls = [];
      let selector = "html";

      const response = await getPage(page, url);

      let baseurl = response.url().split("/")[0] + "//" + response.url().split("/")[2]
      console.log("baseurl: " + baseurl);

      let { htmldom, rawhtml } = await getDOM(page, selector);

      let pagesToScrape = getProductNumberPages(htmldom);
      let currentPage = 1;
      let maxRetrial = 3;
      let retrial = 1

      while (currentPage < pagesToScrape && retrial < maxRetrial) {
        let productDetailPageURLs = Array.from(getProductDetailPageUrls(htmldom));

        // productDetailPageURLs.forEach( (page, baseurl, url) => {
        //   await page.goto(baseurl + url, {waitUntil: 'networkidle2'}).catch((err) => { console.log(err); });
        //   let productTitle = getProductTitle(parsedHtml);
        // });

        // let productDesc = getProductDesc(parsedHtml);
        // let productStar = getProductStar(parsedHtml);
        // let productRegularPrice = getProductPrice(parsedHtml);
        // let productCurrentPrice = getProductPrice(parsedHtml);
        // let productDiscounted = getProductPrice(parsedHtml);
        // let productUnitCount = getProductPrice(parsedHtml);
        // let productUnit = getProductPrice(parsedHtml);
        // let productImgURL = getProductImgURL(parsedHtml);
        // let productImg = getProductImg(parsedHtml);
        // let productFetchDate = getProductFetchDate(parsedHtml);

        // Load next page

        if (currentPage < pagesToScrape) {

          let nextPageURL = url + "?startIndex=" + currentPage * 30;
          const response = await page.goto(nextPageURL, {waitUntil: 'networkidle2'}).catch((err) => { console.log(err); });

          if (response != null && response.status() === 200) {
            const navigationPromise = await page.waitForSelector('.mobile-navigation');
            await page.waitForResponse(response => response.status() === 200)

            let { htmldom, rawhtml } = await getDOM(page, selector);
            currentPage++;

          } else {
            // Failed wait 10 seconds and try againt
            console.log("Request failed try a gain in 10 seconds");
            await page.waitForTimout(10000);
            retrial=retrial + 1;

          }
        
        }
      }

      browser.close();

      return resolve("");
    } catch (e) {
      return reject(e);
    }

  });
}

run("https://www.homehardware.ca/en/thermostats/c/7449")
  .then(console.log)
  .catch(console.error);

/**
 * This function enables a request call stop interceptor 
 * for image.
 * 
 * @param {*} page 
 * 
 */
async function enableImageReqInterceptor(page) {
  const eventType = 'request';
  const resType = ['image'];

  await enableEventInterceptor(page, eventType, resType);
}

/**
 * This function enables a eventType and resource type interceptor 
 * @param {*} page 
 * @param {*} eventType 
 * @param {*} resType 
 */

async function enableEventInterceptor(page, eventType, resType) {
  page.removeAllListeners();
  await page.setRequestInterception(true);
  page.on(eventType, (req) => {
    if (req.resourceType().includes(resType)) {
      req.abort();
    } else {
      req.continue();
    }
  });
}

async function getPage(page, url) {
  let maxRetrial = 3;
  let retrial = 0;

  while (retrial < maxRetrial) {

    const response = await page.goto(url, { waitUntil: "networkidle2" });

    if (
      response !== null &&
      response.status() === 200 &&
      retrial < maxRetrial
    ) {
      const navigationPromise = await page.waitForSelector(
        ".mobile-navigation"
      );
      await page.waitForResponse((response) => response.status() === 200);
      await page.waitForSelector("html");
      await page.waitForTimeout(10000);
      return response;
    } else {
      retrial = retrial + 1;
    }
  }

  return null;
}

async function getDOM(page, selector) {
  let rawhtml = await getHTML(page, selector);
  let htmldom = transformHtmlToDom(rawhtml);
  return { htmldom, rawhtml };
}

async function getHTML(page, selector) {
  return await page.evaluate((selector) => {
    const myNodeList = document.querySelector(selector);

    return myNodeList.innerHTML;
  }, selector);
}

/**
 * Function get DOM from html
 * @rawhtml    {object} rawhtml    HTML DOM
 * @return     {object}            Return product Title
 */
function transformHtmlToDom(rawhtml) {
  let htmldom = new DOMParser().parseFromString(rawhtml, "text/html");
  return htmldom;
}

function getProductNumberPages(htmldom) {
  let innerText = findByAttributeInnerText(
    htmldom,
    "span",
    "class=mobile-navigation",
    1
  );

  let numberOfPages = innerText.split(" ")[3];

  console.log("numberOfPages: ", numberOfPages);

  return numberOfPages;
}

function getProductDetailPageUrls(htmldom) {
  partUrls = findNodeByTagnameAttributeValue(
    htmldom,
    "a",
    "class",
    "mz-productlisting-title data-layer-productClick add-ellipsis",
    "href"
  );
  return partUrls;
}
/**
 * Function return the product detailed page
 * @htmldom    {xmldom} name    HTML DOM
 * @return     {String}         Return product Title
 */
function findNodeByTagnameAttributeValue(
  htmldom,
  tagName,
  searchAttribute,
  searchValue,
  secondAttribute,
  pos = 1
) {
  elementList = Array.from(htmldom.getElementsByTagName(tagName));

  indx = 1;
  urls = [];
  elementList.forEach((node) => {
    result = node.getAttribute(searchAttribute);

    if (result.includes(searchValue)) {
      value = node.getAttribute(secondAttribute);
      value = replaceSpace(value);
      urls.push(value);
    }

    //    'a.mz-productlisting-title.data-layer-productClick'));
  });

  console.log("href: " + urls);
  return urls;
}
