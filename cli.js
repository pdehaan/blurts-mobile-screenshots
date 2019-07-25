const fs = require("fs");
const path = require("path");

const pontoonql = require("pontoonql");
const puppeteer = require("puppeteer");
const devices = require("puppeteer/DeviceDescriptors");

const DEFAULTS = {
  deviceName: "iPhone 8 Plus",
  viewportHeight: 2500,
  outDir: path.join(".", "shots"),
  pontoonProject: "firefox-monitor-website",
  pontoonMinTranslations: 80
};

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});

async function main(
  deviceName = DEFAULTS.deviceName,
  viewportHeight = DEFAULTS.viewportHeight
) {
  const locales = await getLocales();
  const deviceFilename = deviceName.replace(/\s+/g, "_");
  const mobileDevice = devices[deviceName];
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.emulate(mobileDevice);
  const viewport = page.viewport();
  viewport.height = viewportHeight;
  await page.setViewport(viewport);

  const files = [];
  for (const locale of locales) {
    const filename = path.join(
      DEFAULTS.outDir,
      `${locale}-${deviceFilename}.png`
    );
    await scrapeLocale(page, "https://monitor.firefox.com/", locale, filename);
    files.push({ locale, filename });
  }
  console.log("finished...");
  const output = files.reduce((prev, curr) => {
    prev += `## ${curr.locale}\n![](../${curr.filename})\n\n`;
    return prev;
  }, "");
  fs.writeFileSync(
    path.join(DEFAULTS.outDir, "README.md"),
    output.toString().trim() + "\n"
  );
  process.exit(0);
}

async function getLocales(pontoonSlug = DEFAULTS.pontoonProject) {
  const locales = await pontoonql(pontoonSlug, DEFAULTS.pontoonMinTranslations);
  return locales.map(l => l.locale.code).sort();
}

async function scrapeLocale(page, href, locale = "en", filename) {
  await page.setExtraHTTPHeaders({ "Accept-Language": locale });
  await page.goto(href, { waitUntil: "networkidle0" });
  await page.evaluate(() =>
    document.querySelector(".latest-breach-headline-wrapper").scrollIntoView()
  );
  await sleep(2000);
  await page.screenshot({ path: filename });
  return;
}

async function sleep(ms = 3000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
