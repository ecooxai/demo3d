# Eye catchlight ownership diagnostic 137

## Frozen scope

This is a local review wrapper for the accepted iteration 133 scene, with accepted full-strength 130 lip geometry, Neutral tone mapping at exposure 1.4, and the original eye materials. No production file is changed. The portrait remains at the accepted score of 77/100; this diagnostic does not claim an artistic improvement.

The source guard requires `src/main.js` to have SHA-256 `73d1b1589a6cb942353bd5d7301af47680e7e5510fe6f140b4aaa5c233004136` (20,381 bytes). It also checks the accepted 133 fringe call, the full 130 preparation call, the Neutral 1.4 assignment, and the absence of the rejected 135 material helper. The bundle contains live main plus a `MeshBasicMaterial` type bridge only.

Wrapper: `review/eye-highlight-owner137-native.mjs`

- Bytes: 27,058
- SHA-256: `1550169acbe708bc12406f34de21edc020b6a37ae30802e3c27526c22538d208`

## Source ownership traced before the test

`src/reference-skin.js` replaces both `brown-iris-and-pupil` and `scleral-globe` maps with the same prepared 1024 × 1536 image1 CanvasTexture atlas. Their final UV0 coordinates come from their existing positions. The initially constructed procedural iris map is no longer bound. The diagnostic retains and records the final actual atlas; it does not rebake or substitute a different image.

| Actual retained surface | Roughness | Specular intensity | Stored environment gain | Clearcoat |
| --- | ---: | ---: | ---: | ---: |
| Iris | 0.48 | 0.10 | 0.40 | 0 |
| Sclera | 0.40 | 0.20 | 0.45 | 0.03 |

Both use an opaque, nonmetallic physical material, white material color, no vertex colors, no emissive map, and no transmission. The cornea is a separate material and surface; it is unchanged in every 137 state. The four separate `corneal-softbox-reflection` meshes are already hidden and remain hidden.

The prior 134 experiment modified only the cornea. Its unchanged large catchlights therefore do not establish whether the remaining iris/sclera physical response or their mapped source pixels own the pattern.

## Four states, two matched views

The wrapper prepares one native WebGPU scene and runs these states sequentially. It restores the original material references between states.

| Mode | Diagnostic operation | Original responses retained |
| --- | --- | --- |
| 0 | Current accepted scene | All |
| 1 | Clone only both iris materials and set their specular intensity to 0 | Sclera, cornea, iris roughness, map/color, environment settings and all lights |
| 2 | Restore iris; clone only both sclera materials and set their specular intensity and clearcoat to 0 | Iris, cornea, sclera roughness, map/color, environment settings and all lights |
| 3 | Use temporary Basic materials on the actual two iris and two sclera surfaces, with their exact current maps and colors | Cornea, geometry, UV0, surface opacity/depth/side state, tone-mapped output and scene display |

Each state produces the ordinary face-detail framing and the matched 134 eye-detail framing. Output is 900 × 1200 with AA2 and internal 1800 × 2400 samples. The wrapper uses only the normal `renderNow()` path, GPU completion, and compositor screenshots. It does not call standalone screen compilation or read the unpreserved WebGPU canvas into a 2D canvas.

Mode 3 is an owner diagnostic, not a material proposal. Basic also removes diffuse lighting. Neutral output is nonlinear. Compare the location, extent and shape of the bright pattern; do not interpret output brightness differences as additive lighting components or percentages.

## Original atlas crops

Before applying any state, the wrapper finds the actual indexed iris UV0 bounds. With the guarded identity texture transform and `flipY=true`, it copies those bounds plus two source pixels directly from the final bound canvas using `getImageData` and `putImageData`. It writes the unchanged RGBA crop at native source dimensions, with no resizing, recoloring or rebake. The report records the UV bounds, pixel rectangle, atlas size, texture UUID, raw RGBA hash and encoded PNG hash.

The PNG byte arrays are transferred internally from browser to Node and written to files. No base64 or full pixel arrays are printed.

## Targeted integrity and cleanup

The baseline snapshot occurs after a completed native frame so ordinary first-upload index widening is outside the comparison. The wrapper records full attribute identities, arrays, layout, versions and byte hashes for the two iris, two sclera and two cornea geometries. It checks all scene mesh geometry/material references, visibility and local transforms. It also checks original eye material values and bindings, final atlas pixels, texture/source identities and versions, sampler state, hidden fake-glint visibility, lights, environment and display.

Temporary materials are constructed and validated before binding. A construction failure disposes any staged materials. Every completed state and the outer `finally` restore original material references and dispose only the diagnostic materials. Original materials, textures and geometries are monitored for unwanted disposal. No geometry or texture is copied, created or disposed by the study. Across the four states there are eight temporary material instances in total, with a maximum of four simultaneously active.

The restored ordinary-detail compositor PNG must exactly match the initial mode 0 detail PNG. The final idle render count must remain zero. Browser errors fail the run. The browser and page close in `finally`; the JSON report is preserved on success or failure.

## Run on the authorized Mac

With the normal project server serving the accepted scene:

```sh
node review/eye-highlight-owner137-native.mjs
```

The defaults are `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` and `http://127.0.0.1:8766/`. `CHROME_PATH` and `PORTRAIT_URL` may override these locations. Native WebGPU is mandatory; the wrapper does not choose another backend.

Expected files:

- `output/qa/eye137-{0,1,2,3}-{detail,eye-detail}.png`
- `output/qa/eye137-bound-atlas-left-eye.png`
- `output/qa/eye137-bound-atlas-right-eye.png`
- `output/qa/eye137-restored-detail.png`
- `output/qa/eye-highlight-owner137-native.json`

## Local validation status

`node --check` passes for the complete wrapper. Node's module parser accepts both the wrapper and the exact current main with its appended type bridge. The pinned main hash matches. A source check confirms no standalone compilation call. These checks establish syntax and the frozen source contract; they do not claim a rendered result. The parent will run and visually assess the native diagnostic.

### One minimal native guard correction

The first native run completed modes 0 and 1. Mode 2 stopped in the intended-change guard before rendering because Three's public clearcoat setter also changes its enumerable `_clearcoat` backing field. The parent verified the installed r186 setter: crossing the positive/zero boundary increments material `version`, then assigns `_clearcoat=value`.

The only wrapper edit adds `_clearcoat` to mode 2's allowed fields. Material `version` was already allowed. A byte comparison proves there are no other code changes; modes, material values and views are identical. Both syntax checks pass again. The original wrapper is preserved as `review/eye-highlight-owner137-before-clearcoat-fix.mjs`, 27,044 bytes, SHA-256 `60026a585f04fba0a2985726f5d2437b3e9e8874d1376a67a63d5b585ddbda49`.

### Completed native and visual review

The corrected run completed all four states during a connector interruption. The parent recovered the successful report and captures without rerunning it. All 24 original eye attribute/index records and the one shared atlas stayed exact; original resource disposals, browser errors and additional idle frames were all zero. Original materials restored, and the restored detail PNG exactly matched mode 0.

The independent review inspected all eight captures, both exact atlas crops, image1 and two unaltered manually chosen source-eye crops. The major white clusters persist in Basic and are already visible in the atlas and corresponding source-eye regions. Keep the original physical materials, mode 0, at 77/100. No mapping distortion or nonlinear amplification is claimed from these differently sampled crops. Full findings are in `review/gpt6-astra_chatgpt_eye-highlight137-review.md`; the successful native report is `review/eye-highlight-owner137-native-result.json`.
