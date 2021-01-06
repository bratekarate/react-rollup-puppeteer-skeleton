import test from "ava";
import fs from "fs";
import path from "path";
import puppeteer, {Browser, Page} from "puppeteer";
import url from "url";
import {ExecutionContext} from 'ava';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';
let browser: Browser;

const wsEndpoint = process.env.WS_ENDPOINT;
const serverUrl = process.env.SERVER_URL;

type AvaCallback = (t: ExecutionContext, page: Page) => Promise<void>
const withPage = async (t: ExecutionContext, run: AvaCallback) => {
  const page = await browser.newPage();
  try {
    await run(t, page);
  } finally {
    await page.close();
  }
};

test.before(async () => {
  browser = await puppeteer.connect({
    browserWSEndpoint: wsEndpoint
  });
});

test.after.always(async () => {
  browser.disconnect();
});

const makeScreenshot = async (page: Page, filepath: string) => {
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

  fs.writeFileSync(path.resolve(filepath), image);
};

const getTestReportsDir = () => {
  const dir = path.resolve(__dirname, "__test-report__");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  return dir;
}

test('page should match snapshot', withPage, async (t: ExecutionContext, page: Page) => {
  await page.goto(url.resolve(serverUrl, '/'));

  const reportsDir = getTestReportsDir();
  const newShotPath = `${reportsDir}/shot.png`;
  await makeScreenshot(page, newShotPath);

  const img1 =
    PNG.sync.read(fs.readFileSync(`${process.cwd()}/src/test/resources/shot.png`));
  const img2 = PNG.sync.read(fs.readFileSync(newShotPath));
  const {width, height} = img1;
  const diff = new PNG({width, height});

  const diffPixels =
    pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.1});

  if (diffPixels) {
    fs.writeFileSync(`${reportsDir}/diff.png`, PNG.sync.write(diff));
  }

  t.assert(!diffPixels)
});
