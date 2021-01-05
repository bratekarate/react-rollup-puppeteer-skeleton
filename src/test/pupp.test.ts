import test from "ava";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import url from "url";
import {ExecutionContext} from 'ava';

let browser: puppeteer.Browser;

const wsEndpoint = process.env.WS_ENDPOINT;
const serverUrl = process.env.SERVER_URL;

type AvaCallback = (t: ExecutionContext, page: puppeteer.Page) => Promise<void>

const withPage = async (t: ExecutionContext, run: AvaCallback) => {
  const page = await browser.newPage();
  try {
    await run(t, page);
  } finally {
    await page.close();
  }
};

test.before(async _ => {
  browser = await puppeteer.connect({
    browserWSEndpoint: wsEndpoint,
    browserURL: serverUrl,
  });
});

test.after.always(async _ => {
  browser.disconnect();
});

const makeScreenshot = async (page: puppeteer.Page, filename: string) => {
  const clip = await page.evaluate(
    element => ({
      x: element.offsetLeft,
      y: element.offsetTop,
      height: element.offsetHeight,
      width: element.offsetWidth,
    }),
    await page.$("#app")
  );
  const image = await page.screenshot({clip});
  const dir = path.resolve(__dirname, "__test-report__");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  fs.writeFileSync(path.resolve(dir, filename), image);
};

test('page should match snapshot', withPage, async (t: ExecutionContext, page: puppeteer.Page) => {
    await page.goto(url.resolve(serverUrl, '/'));
    await makeScreenshot(page, 'shot.png');

  t.assert(true);
});
