# Candidate 132 — registered crown RGB replacement

**Review-only prototype. Overall score remains 77/100 pending native art review.**

**Frozen for native comparison against the live full 130 pipeline.** No production file has changed. The later 133 fringe-only integration is compatible because its crown topology, UVs and materials remain exact.

## What this comparison tests

Candidate 132 replaces accepted 100's repeated strip pattern with a single registered, original-resolution photo signal inside the valid front-crown region. It uses the same 37 manual registration landmarks as 116, but does not use 116's small filtered field or multiply that field over 100's repeated grain.

The numerator retains the photograph's original RGB pixels. Only the illumination denominator uses a broad 113 by 113 pixel, hair-mask-weighted mean. This preserves meaningful intermediate strand groups as well as fine strands. The bounded relative linear RGB gain is normalized to mean 1 in each channel and blended from accepted 100 by the requested strength. The source is only the uploaded `reference/image1-color.jpg`.

The existing 2048 by 2048 atlas supplies 992 pixels across each crown chart. Sampling follows the actual B–C triangle split, the fixed 3D registration and a smooth front/side mask. Four subtexel samples are used only where the projected source footprint is larger than 1.15 source pixels per atlas texel. There is no camera-facing image plane, repeated photo tiling or color approximation at root vertices.

## Native comparison

Transfer these two files without changing their paths:

- `review/reference-crown-candidate132.js`
- `review/reference-crown132-native.mjs`

Run from the Mac project:

```sh
node review/reference-crown132-native.mjs
```

The default compares fresh pages at strengths 0 and 1. Add `--half` only if the intermediate comparison is wanted. The wrapper builds the live `src/main.js` and inserts 132 immediately after the exact accepted 100 preparation call. It retains the current full 130 mouth continuity and all other live components.

The wrapper requires native WebGPU and the accepted Neutral tone mapping at exposure 1.4. It captures front, detail, left, right, back and a second lighting setup for detail. It closes each page and the browser in `finally`, collects page errors, and compares protected source fingerprints across fresh pages.

Output images:

```text
output/qa/registered-crown132-{0,100}-{front,detail,left,right,back,relight-detail}.png
```

Native report:

```text
output/qa/reference-crown132-native-result.json
```

## Preserved source and export behavior

All hair geometry, indices, position/normal/UV0/UV1/color attributes and material settings remain unchanged. The existing map object receives replacement RGB pixels only. Its alpha bytes, foundation chart, normal map and UV0 coverage map remain exact. Existing root fibers retain their colors and materials.

The new signal retains 100's 0.60 headroom, with bounded gain no greater than 1.60. Thus the newly constructed linear map component remains below 0.96 before the unchanged original material and vertex factors. The 100 metadata and atlas/channel layout remain exact; 132 adds separate diagnostic metadata. The existing 104 export-only alpha merge still operates on the current atlas RGB and unchanged source coverage. No new export workaround is introduced before art acceptance.

Strength 0 does not access the groom, decode the image or allocate the source field. Repeating the same nonzero strength returns the same result without another decode. A different strength on an already prepared groom is rejected; native variants use fresh pages.

## Existing source checks and practical limits

The focused bake verifies exact preservation of all protected objects and bytes, legal map values, source normalization, registration orientation, true zero behavior and idempotence. Source metrics are saved in `review/reference-crown132-audit.json`; the literal atlas inspection is `review/reference-crown132-atlas-inspection.png`.

The source mask retains the 116 registration landmarks exactly. Manual source crops justified moving six right exterior polygon vertices inward and correcting one left top corner from (565,24) to (552,35). The remaining 20 left vertices and the right inner/part boundary remain exact. A modest 6 to 12 pixel sampling guard and fade protects the narrow valid regions. The observed exterior points (770,226), (808,395) and (560,30) are now 9.35, 8.76 and 9.27 pixels outside their corrected polygons, respectively.

The highest remaining unweighted source ratio occurs at a feathered left silhouette pixel (234,268), where the mask weight is only 0.000680. The bounded gain limits that pixel's full-strength replacement contribution below 0.00041 linear. This negligible boundary residual is documented rather than pursuing another broad inset sweep. The mask is manually authored; it is not an RGB segmentation or a claim of exact foreground matting.

A separate small geometric coverage diagnosis found 327 exposed-crown points among 999 eligible front-crown samples. Overlying MASS and DETAIL triangles covered the other points. This is a geometric point estimate, not antialiased pixel coverage. The overlying triangles span approximately 18.8 source pixels at the median and 32.6 at the 95th percentile, so vertex RGB would not carry the original fine signal faithfully. This prototype intentionally leaves those root layers unchanged; their coverage may limit the visible benefit.

No extra GPU texture, draw call, retained attribute or per-frame work is added. The existing 16 MiB atlas is replaced. Temporary work includes an approximately 8.5 MiB source gain field, a 17.05 MiB masked integral and a 16 MiB staging atlas, plus the decoded source pixels. Temporary arrays are not retained in the completed group.

Native art acceptance must judge whether the registered medium groups follow the generated hair, whether the front/detail gains survive root coverage, and whether profile fades or the alternate light reveal a painted-on pattern. Passing the source checks does not increase the art score.

## Final local measurements

| Check | Result |
|---|---:|
| Helper elapsed time | 1,118.40 ms |
| Atlas bake | 983.45 ms |
| Source preparation | 115.70 ms |
| Mapped atlas texels | 352,519 |
| Interior texels replaced at weight above 0.999 | 210,608 |
| Used source pixels | 78,206 |
| Actual source gain range | 0.455752 to 1.600000 |
| Highest linear atlas RGB component | 0.951452 |
| Weighted per-channel linear mean gain | 1 within 2.1e-8 |
| Mean source pixels per atlas texel | 0.813682 |
| Maximum source footprint | 1.808344 pixels |
| Texels using footprint filtering | 29,908 |
| Sampled normalized registration Jacobian | 0.280238 to 1.765209 |
| Protected atlas alpha mismatches | 0 |
| Protected foundation byte mismatches | 0 |
| Original procedural RGB recovery error | 0 |
| Added retained GPU maps or attributes | 0 |

The complete local harness, including constructing the accepted groom and 100 baseline, fingerprinting buffers and writing the inspection, took 6.67 seconds with 506.85 MiB process peak RSS. Those values are not the incremental helper cost. Native performance is still pending. Both transfer files passed JavaScript syntax checks; the native wrapper retains the exact full 130 preparation call from live main.

## Frozen file manifest

| File | Bytes | SHA256 |
|---|---:|---|
| `review/reference-crown-candidate132.js` | 25,513 | `0d93db3be5ffac6214bc6a7163eaf6c5dab8561bdf7e1dcc569c0726bd79f84a` |
| `review/reference-crown132-native.mjs` | 6,953 | `5fa1050ec67dc0674e48736c53a7a60434119bf64226da4a46822f42c16d29f9` |
| `review/reference-crown132-audit.mjs` | 9,205 | `05f90647615bde2c08966fbe42894e7cabcac3bdb516ecf782bc5a553eb1eaf7` |
| `review/reference-crown132-audit.json` | 24,170 | `286a94c15edb0537e7b7028d142845bedbd874b89cd6c8b73f542882d2cd8cbf` |
