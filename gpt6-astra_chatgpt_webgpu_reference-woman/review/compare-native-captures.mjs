import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import path from 'node:path';

// Compare existing compositor captures. Image bytes stay inside this process;
// stdout contains only numerical differences, never encoded image contents.
const [before, after, destination] = process.argv.slice(2);
if (!before || !after || !destination) throw new Error('Supply two image paths and a report path.');
const root = path.resolve(import.meta.dirname, '..');
for (const f of [before, after, destination]) {
  if (path.isAbsolute(f) || !path.resolve(root, f).startsWith(root + path.sep)) throw new Error('Paths must remain inside this project.');
}
const urls = await Promise.all([before, after].map(async f => 'data:image/png;base64,' + (await readFile(path.resolve(root, f))).toString('base64')));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const page = await browser.newPage();
  const metrics = await page.evaluate(async urls => {
    const arrays = []; let width, height;
    for (const url of urls) {
      const image = new Image(); image.src = url; await image.decode();
      if (width && (width !== image.width || height !== image.height)) throw new Error('Capture dimensions differ.');
      width = image.width; height = image.height;
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      arrays.push(context.getImageData(0, 0, width, height).data);
    }
    let changedPixels = 0, changedChannels = 0, maxChannelDelta = 0, sumAbsoluteChannelDelta = 0;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    const channelDeltaHistogram = {};
    for (let p = 0; p < width * height; p++) {
      let changed = false;
      for (let c = 0; c < 4; c++) {
        const delta = Math.abs(arrays[0][p * 4 + c] - arrays[1][p * 4 + c]);
        if (!delta) continue;
        changed = true; changedChannels++; sumAbsoluteChannelDelta += delta; maxChannelDelta = Math.max(maxChannelDelta, delta);
        channelDeltaHistogram[delta] = (channelDeltaHistogram[delta] || 0) + 1;
      }
      if (!changed) continue;
      changedPixels++; const x = p % width, y = Math.floor(p / width);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    return { width, height, changedPixels, changedChannels, maxChannelDelta, sumAbsoluteChannelDelta,
      meanAbsoluteRGBDelta: sumAbsoluteChannelDelta / (width * height * 3),
      changedBounds: changedPixels ? [minX, minY, maxX, maxY] : null, channelDeltaHistogram };
  }, urls);
  const result = { files: [before, after], ...metrics,
    note: 'Decoded comparison of existing captures; this does not explain the cause of a difference or replace independent source resource checks.' };
  await writeFile(path.resolve(root, destination), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
