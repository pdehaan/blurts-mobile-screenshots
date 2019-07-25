const path = require("path");

const pontoonql = require("pontoonql");
const puppeteer = require("puppeteer");
const devices = require("puppeteer/DeviceDescriptors");

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});

async function main() {
  let locales = await pontoonql("firefox-monitor-website", 80);
  locales = locales.map(l => l.locale.code).sort();

  for (const locale of locales) {
    await scrapeLocale("https://monitor.firefox.com/", locale);
  }
  console.log("finished...");
  process.exit(0);
}

async function scrapeLocale(
  href,
  locale = "en",
  deviceName = "iPhone 8 Plus",
  viewportHeight = 4000
) {
  const filename = path.join(
    __dirname,
    "shots",
    `${locale}-${deviceName.replace(/\s+/g, "_")}.png`
  );

  const mobileDevice = devices[deviceName];
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulate(mobileDevice);
  const viewport = page.viewport();
  viewport.height = viewportHeight;
  await page.setViewport(viewport);
  await page.setExtraHTTPHeaders({ "Accept-Language": locale });
  await page.goto(href);
  await page.evaluate(() =>
    document.querySelector(".latest-breach-headline-wrapper").scrollIntoView()
  );
  await sleep(3000);
  await page.screenshot({ path: filename });
  console.log("done", filename, viewport);
  return;
}

async function sleep(ms = 3000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
