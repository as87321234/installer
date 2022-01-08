var log4js = require("log4js");
var logger = log4js.getLogger("");
var baseurl = null;

const beautify = require("simply-beautiful");

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
var XMLSerializer = require('xmlserializer');

// HTML to Text Converter
// There is also an alias to `convert` called `htmlToText`.
const { htmlToText } = require('html-to-text');


// Statics 
var stats = {'getPage': 0, 'getDom': 0};


function run(url) {
  logger.level = "debug";
  logger.debug("Some debug messages");

  return new Promise(async (resolve, reject) => {
    try {
      const browserFetcher = puppeteer.createBrowserFetcher();
      let revisionInfo = await browserFetcher.download("938248");

      const browser = await puppeteer.launch({
        headless: false,
        args: [
          "--no-sandbox",
          "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
          "--window-size=1920,1080",
          "--no-sandbox",
          "--disable-gpu",
          "--no-zygote",
          "--disable-setuid-sandbox",
          "--disable-accelerated-2d-canvas",
          "--disable-dev-shm-usage",
        ],
      });

      // Open a new page on the browser
      let page = await browser.newPage();

      // Ackknowledge popup request location access
      await page.setViewport({ width: 1280, height: 800 });
      await page.setDefaultNavigationTimeout(10000);

      // Enable Image Request Interceptor
      await enableImageReqInterceptor(page);

      // load page and wait for the 'HTML' tag
      const response = await getPage(page, url, "load", ".mobile-navigation");
      stats['getPage'] = stats['getPage'] + 1;

      // get base URL from http response
      baseurl = getBaseURL(response);
      console.log("baseurl: " + baseurl);

      let htmldom = await getDOM(page);
      let pagesToScrape = parseInt(getProductNumberPages(htmldom));
      let currentPage = 1;
      let maxRetrial = 3;
      let retrial = 1;

      while (currentPage < pagesToScrape && retrial < maxRetrial) {
        let productDetailPageURLs = Array.from(
          getProductDetailPageUrls(htmldom)
        );

        for (let i = 0; i < productDetailPageURLs.length; i++) {
          // load page and wait for the 'HTML' tag
          const response = await getPage(
            page,
            productDetailPageURLs[i],
            "load",
            "html"
          );
          const htmldom = await getDOM(page);
          const productTitle = getProductTitle(htmldom);
          const productDesc = getProductDesc(htmldom);
          stats['getPage'] = stats['getPage'] + 1;

          console.log(stats);
        }

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
          // Calculate startIndex before fetching next page
          let nextPageURL = url + "?startIndex=" + currentPage * 30;

          // load page and wait for the 'HTML' tag
          // const response = await getPage(page, nextPageURL, 'networkidle2');
          const response = await getPage(
            baseurl + page,
            nextPageURL,
            "load",
            ".mobile-navigation"
          );
          htmldom = await getDOM(page);
        }

        currentPage = currentPage + 1;
      }

      productDetailPageURLs = Array.from(getProductDetailPageUrls(htmldom));

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
 * This function returns the base site url from the
 * http response.
 *
 * @param {*} response
 * @returns
 */
function getBaseURL(response) {
  return response.url().split("/")[0] + "//" + response.url().split("/")[2];
}

/**
 * This function enables a request call stop interceptor
 * for image.
 *
 * @param {*} page
 *
 */
async function enableImageReqInterceptor(page) {
  const eventType = "request";
  const resType = ["image"];

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

async function getPage(page, url, waitUntil, selector) {
  let maxRetrial = 6;
  let retrial = 0;

  console.log("Loading page: " + url);
  while (retrial < maxRetrial) {
    try {
      const response = await page.goto(url, { waitUntil: waitUntil });
      await page.waitForTimeout(1000);

      if (
        response !== null &&
        response.status() === 200 &&
        retrial < maxRetrial
      ) {
        const navigationPromise = await page.waitForSelector(selector);

        await page.waitForResponse((response) => response.status() === 200);
        return response;
      }
    } catch {
      // NOP
      retrial = retrial + 1;
      console.log("timeout: " + url);
    }
  }

  return null;
}

async function getDOM(page) {
  let rawhtml = await getHTML(page);
  let htmldom = await transformHtmlToDom(rawhtml);
  return htmldom;
}

async function getHTML(page) {

  let rawhtml = null;

  try {
    rawhtml = await page.evaluate(() => {
      const myNodeList = document.querySelector('html');
      const html = myNodeList.innerHTML;
      return html;
    });

    // let rawhtml = await page.evaluate(() => {
    //   const myNodeList = document.querySelector('html');
    //   const html = myNodeList.innerHTML;
    //   return html;
    // });
  } catch (e) {
    console.log(e);
  }
  // console.log(beautify.html(rawhtml));

  return rawhtml;
}

/**
 * Function get DOM from html
 * @rawhtml    {object} rawhtml    HTML DOM
 * @return     {object}            Return product Title
 */
async function transformHtmlToDom(rawhtml) {
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
  const nodeList = findNodeByTagnameAttributeValue(
    htmldom,
    "a",
    "class",
    "href"
  );

  let urlList = [];
  let classSelector = "mz-productlisting-title data-layer-productClick add-ellipsis";

  nodeList.forEach((node) => {

    classAttr = node.getAttribute('class');

    if (classAttr.includes(classSelector)) {
      url = node.getAttribute('href');
      url = replaceSpace(url);
      urlList.push(baseurl + url);
    };

  });

  return urlList;
}
/**
 * Function return the product detailed page
 * @htmldom    {xmldom} name    HTML DOM
 * @return     {String}         Return product Title
 */
function findNodeByTagnameAttributeValue(
  htmldom,
  tagName,
) {
  nodeList = Array.from(htmldom.getElementsByTagName(tagName));
  return nodeList;
};

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

async function getProductTitle(htmldom) {
  const nodeList = findNodeByTagnameAttributeValue(
    htmldom,
    "h1"
  );

  const brandName = (nodeList[0].firstChild.nextSibling.childNodes[0].data).trim();
  const subTtile = (nodeList[0].lastChild.data).trim();

  const title = brandName + " " + subTtile;

  console.log("Product Title: " + title);

  return title;
}

/**
 * 
 * @param {*} htmldom 
 * @returns 
 */
async function getProductDesc(htmldom) {

  // Select all DIV from HTML document
  const nodeList = findNodeByTagnameAttributeValue(
    htmldom,
    "div"
  );

  // Select "description-container section-margin" 
  let description = null;
  nodeList.every(node => {

    if (node.getAttribute('class') == 'description-container section-margin') {
      const serializedNode = XMLSerializer.serializeToString(node);
      description =  htmlToText(serializedNode, {
        wordwrap: 130
      });
      return false;
    };
    return true;
  });
  
  console.log("Product Description: " + description);

  return description;
}

/**
 * Function return the product Title
 * @htmldom    {xmldom} name    HTML DOM
 * @return     {String}         Return product Title
 */
let getProductImage = function (htmldom) {
  let tagImg = htmldom.getElementsByTagName("img");
  return tagImg[1].attribute[0];
};
