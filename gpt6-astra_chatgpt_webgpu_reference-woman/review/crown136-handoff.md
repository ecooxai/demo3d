# Crown departure 136 — frozen for native review

**Status: source checks pass; native appearance is unreviewed. Keep accepted 133 and its 77/100 score.** No production source, material, image, or asset changed. The separate 141 ear/foundation diagnostic is outside this patch.

## Run and API

From the project root on the existing Mac render environment:

```sh
node review/crown136-native.mjs
```

The wrapper reads current `src/main.js`, preserving its accepted preparation order, 100 crown atlas, 118 lower placement, contact, balance, display and mouth. It intercepts only the groom import and adds:

```js
createGroomHair({
  headShiftX: .26,
  shoulderContact: .35,
  guidePlacement: .5,
  diagonalFringe133: 1,
  crownDeparture136: 0 // baseline, or 1 for the candidate
})
```

It renders fresh native WebGPU pages at strengths 0 and 1, capturing front, detail, left, right, back and junction. Files are `output/qa/crown136-{0,1}-{view}.png`, with `crown136-native-report.json`. The junction uses the unchanged CROWN vertex at sheet stride 129, so both strengths have the same camera. There is no export or extra optics variant. The native wrapper has only been syntax-checked here; root performs the actual Mac run.

The three required native files are:

| File | Bytes | SHA256 |
|---|---:|---|
| `review/hair-groom-candidate136.js` | 45,413 | `aa79c144d5ea469ecae30bf930add4f65abb47286076b7ce5b9ffcf788968ac8` |
| `review/crown-departure-candidate136.js` | 11,818 | `4e4acdeae5197b3481eda98d700bce9c0bbc77588c12a7c4f6c90990dec90845` |
| `review/crown136-native.mjs` | 5,280 | `7102baba90af488fdd2f47be5c0753cbc4805ff5e2c60ef473765204cf79c0d4` |

The generated groom intentionally imports `../review/crown-departure-candidate136.js`; its native loader resolves from `src/`. Do not transfer it into production before visual acceptance.

## What changes

The prototype redirects **324 existing dedicated crown fibers** into the accepted visible bowed flow. It keeps the actual 133 FRINGE geometry exact. Covered roots join smoothly; exposed paths descend, with unequal ends and a bounded depth compression toward the forehead. A small common return path handles the upward front-chart boundary without reproducing its upward direction in exposed hair.

It withdraws the CROWN bed only across the supported main image-left transition and the narrow physical front-return volume. The latter catches overlapping sheet layers with different UV coordinates. The ordinary right transition remains covered because its oblique bridge was too weak in the prerequisite study. There are **no added strands, triangles, opaque supports or material changes**.

CROWN position, normal, index, UV and RGB stay exact. Only 1,522 existing vertex-alpha values change. The inset foundation, rear and protected buffers remain exact. MASS, FRINGE133 and WISPS are wholly unchanged; DETAIL outside the selected 324 ribbon blocks is exact. Original texture coverage bytes and the 100/104 UV layout are unchanged.

## Source evidence

`review/crown136-audit.json` records the complete audit and embeds the prerequisite measured before any bed-alpha withdrawal. Its SHA256 is `d950ab5c6d8f321b6bd4c044c27a3f127393f261e0701d38937624c49192a113`.

- Strength 0 matches frozen/live 133 geometry and material/map data byte for byte.
- Strength 1 remains **1,114,888 hair triangles / 52.49 MiB**. All mesh attributes are finite; selected ribbon normals have lengths 0.999999959–1.000000043.
- All 324 paths descend after their buried apex. Maximum sampled adjacent turn is 20.56 degrees; the sampled departure join differs by 0.00110 degrees and 0.00000132 local units.
- Maximum actual vertex displacement is 0.49205 local units, reflecting the intentionally longer fiber paths. This is a visible geometry change, not only a coverage adjustment.
- At original detail wedge ray `(527,198)`, three overlapping CROWN layers change from coverage 1/1/1 to approximately .00014/0/0. At nearby `(547,217)`, the surviving right layer retains .310 coverage, consistent with a narrowed transition.
- The selected dense left upper bridge has projected ribbon occupancy of roughly 78–99% in .036-unit windows over the useful samples in front and ±35-degree views. Withdrawal fades away from the weaker outer samples. This is a finite-window occupancy measurement, not proof that every pixel or triangle is covered.
- Actual analytic forehead support sampled 12,843 ribbon center/edge positions per view. There were **zero missing support intersections** in front and ±35 degrees. The −35-degree view has 65 near-grazing samples reported separately. Non-grazing depth gaps were .052–.161 front, .058–.307 at −35 degrees, and .065–.196 at +35 degrees; oblique depth gaps are not normal-distance clearances.

The source-only final audit took 15.02 seconds and peaked at 620.99 MiB RSS while retaining baseline/candidate geometry and diagnostics. Candidate construction inside that run was 4.57 seconds. Those are audit costs, not native browser performance; the wrapper records actual native construction and heap.

## Native decision

The intended gain is a left crown sweep that releases through continuous fine paths into the accepted unequal bows, with the opaque triangular return removed and no replacement band. Judge front/detail and junction first, then both profiles and back for exposed holes, hovering paths, a root discontinuity or silhouette damage.

The accepted glossy physical DETAIL material remains on the redirected fibers. It may make forehead extensions glint more than the matte FRINGE. That is a deliberate isolated-test risk, not a proposed material change. The sampled support and occupancy checks do not certify every interpolated triangle, every angle or final lighting response. If native appearance does not improve, retain 133. Recharacterize 100/104 export coverage only after a visible gain.
