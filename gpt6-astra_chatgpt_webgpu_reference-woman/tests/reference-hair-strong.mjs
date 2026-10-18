import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Diagnostic 71 only: the production module and its default remain unchanged.
const hairPath = path.resolve('review/reference-hair-candidate63.js');
const hairSource = await readFile(hairPath, 'utf8');
const replaceOnce = (source, before, after) => {
  const at = source.indexOf(before);
  assert(at >= 0 && source.indexOf(before, at + before.length) < 0,
    `Expected exactly one diagnostic replacement: ${before}`);
  return source.slice(0, at) + after + source.slice(at + before.length);
};
let virtualHair = replaceOnce(hairSource, 'BIT_STEP = 128', 'BIT_STEP = 256');
virtualHair = replaceOnce(virtualHair,
  'const lum = .24 * Math.tanh(.32 * (Math.log(luma) - anchorLogLuma) / .24);',
  'const lum = .55 * Math.tanh(.65 * (Math.log(luma) - anchorLogLuma) / .55);');
const chroma = 'const chroma = .04 * Math.tanh(.15 * (Math.log(Math.max(1e-6, rgb[ch]) / luma) - anchor[ch]) / .04);';
assert(hairSource.includes(chroma) && virtualHair.includes(chroma), 'Chroma must stay unchanged');

function preflightOffsets() {
  const step = 256, mantissaSize = 2 ** 23;
  // Luma +/- .55 plus chroma +/- .04; convex field sampling and feathering
  // cannot enlarge these log-space bounds. They are slightly wider than .56-1.8.
  const gainMin = Math.exp(-.59), gainMax = Math.exp(.59);
  const capacityBits = 32767 * step;
  // For reciprocal factors inside [.5, 2], the largest positive-normal Float32
  // bit difference over an octave is 2*(1-gainMin)*2^23. Add rounding allowance.
  const bitDifferenceBound = Math.ceil(2 * (1 - gainMin) * mantissaSize) + 2;
  const offsetBound = Math.ceil(bitDifferenceBound / step + .5);
  const relativeErrorBound = 129 / mantissaSize; // 128 quantization ULPs + float rounding.
  assert(offsetBound <= 32767, 'Strong gain cannot fit the packed Int16 offsets');
  assert(relativeErrorBound < .00002, 'Quantization must stay below .002%');

  const values = new Float32Array(2), bits = new Uint32Array(values.buffer);
  let maxOffset = 0, maxRelativeError = 0, minQuantizedGain = 1, maxQuantizedGain = 1;
  let cases = 0, roundTrips = 0;
  // Exhaust every Float32 mantissa at both worst gain endpoints. The packed
  // difference is exponent-independent for the normal finite hair colors.
  for (const factor of [gainMin, gainMax]) {
    for (let mantissa = 0; mantissa < mantissaSize; mantissa++) {
      const baseBits = 0x3f800000 + mantissa;
      bits[0] = baseBits;
      const base = values[0], target = base * factor;
      values[1] = target;
      const offset = Math.round((bits[1] - baseBits) / step);
      if (Math.abs(offset) > 32767) throw new Error('Exhaustive packed-capacity check failed');
      bits[1] = baseBits + offset * step;
      const actual = values[1];
      maxOffset = Math.max(maxOffset, Math.abs(offset));
      maxRelativeError = Math.max(maxRelativeError, Math.abs(actual / target - 1));
      minQuantizedGain = Math.min(minQuantizedGain, actual / base);
      maxQuantizedGain = Math.max(maxQuantizedGain, actual / base);
      cases++;
      if ((mantissa & 8191) === 0) {
        let previous = 0, restoredBits = baseBits;
        for (const strength of [1, .13, .72, .003, .99, .5, 0]) {
          restoredBits = restoredBits - Math.round(offset * previous) * step
            + Math.round(offset * strength) * step;
          previous = strength;
        }
        assert.equal(restoredBits, baseBits, 'Strength cycling must restore exact Float32 bits');
        roundTrips++;
      }
    }
  }
  assert(maxOffset <= offsetBound);
  assert(maxRelativeError <= relativeErrorBound);
  return {candidate: 71, bitStep: step, gainMin, gainMax, capacityBits,
    bitDifferenceBound, offsetBound, maxOffset, relativeErrorBound,
    maxRelativeError, minQuantizedGain, maxQuantizedGain, cases, roundTrips};
}

const preflight = preflightOffsets();
console.log(JSON.stringify({preflight}));
const source = await readFile('src/main.js', 'utf8');
const marker = 'detailTarget.x=.02+state.pose.shiftX;';
const candidate = "import {applyReferenceHairColor} from '../review/reference-hair-candidate63.js';\n"
  + replaceOnce(source, marker, marker
    + "\n    state.referenceHair=await applyReferenceHairColor(anatomicalHair,{strength:Number(new URLSearchParams(location.search).get('haircolor')||0)});");
if (process.argv.includes('--preflight-only')) process.exit(0);

const {build} = await import('esbuild');
const {chromium} = await import('playwright');
let virtualLoads = 0;
await build({
  stdin: {contents: candidate, resolveDir: path.resolve('src'), sourcefile: 'main-hair-color-71-review.js'},
  bundle: true, format: 'iife', target: ['es2022'], minify: true,
  loader: {'.jpg': 'dataurl'}, outfile: 'output/qa/app-hair-color71.js', logLevel: 'silent',
  plugins: [{name: 'reference-hair-71-virtual-only', setup(builder) {
    builder.onLoad({filter: /[/\\]reference-hair-candidate63\.js$/}, args => {
      if (path.resolve(args.path) !== hairPath) return;
      virtualLoads++;
      return {contents: virtualHair, loader: 'js', resolveDir: path.dirname(hairPath)};
    });
  }}],
});
assert.equal(virtualLoads, 1, 'Diagnostic module must be substituted exactly once');
assert.equal(await readFile(hairPath, 'utf8'), hairSource, 'Production hair source changed');

const browser = await chromium.launch({
  executablePath: path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal'],
});
try {
  for (const strength of [0, 1]) {
    // New pages isolate the bake and all retained state for each comparison.
    const page = await browser.newPage({viewport: {width: 1440, height: 1350}, deviceScaleFactor: 1});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.route('**/app.js', route => route.fulfill({path: 'output/qa/app-hair-color71.js', contentType: 'text/javascript'}));
      await page.goto(`http://127.0.0.1:8766/?haircolor=${strength}`, {waitUntil: 'networkidle'});
      await page.waitForFunction(() => window.portrait?.ready);
      const metrics = await page.evaluate(() => {
        const p = window.portrait;
        p.setScore(71, 76);
        return {candidate: 71, nativeWebGPU: p.renderer.backend.isWebGPUBackend === true, hair: p.state.referenceHair};
      });
      assert(metrics.nativeWebGPU && metrics.hair, 'Candidate did not initialize with native WebGPU');
      assert.equal(metrics.hair.strength, strength);
      if (strength) {
        assert(metrics.hair.maxRelativeQuantizationError <= preflight.relativeErrorBound);
        assert(metrics.hair.minFullMultiplier >= preflight.gainMin * (1 - preflight.relativeErrorBound));
        assert(metrics.hair.maxFullMultiplier <= preflight.gainMax * (1 + preflight.relativeErrorBound));
      }
      for (const view of ['front', 'detail', 'right']) {
        await page.evaluate(view => {
          const p = window.portrait;
          p.setView(view);
          p.renderNow();
        }, view);
        await page.waitForTimeout(180);
        await page.locator('#viewport-wrap').screenshot({path: `output/qa/hair-color-71-${Math.round(strength * 100)}-${view}.png`});
      }
      console.log(JSON.stringify(metrics));
      assert.deepEqual(errors, [], 'Browser page errors');
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
