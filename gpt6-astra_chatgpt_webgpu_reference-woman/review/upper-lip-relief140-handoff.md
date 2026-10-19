# Upper-lip relief candidate 140

## State and decision boundary

**Native art reviewed: recommend the fixed-on mode, retaining 77/100. Root owns production integration.** This is the single approved on/off upper-lip study on full 130 geometry. Mode 1 already contains the fixed half blend below; no intermediate-strength sweep is supported. No production, Mac, renderer, material, source-map or export change was made by this child task. The completed native outcome and its strict compositor-equality qualification are recorded at the end of this handoff and in `review/gpt6-astra_chatgpt_upper-lip140-review.md`.

The remaining narrow upper-lip band survives 139's clearcoat and base-specular suppression but disappears in its Basic diagnostic. The receiver-shadow follow-up then produced identical mode 2 and mode 4 lip PNGs, SHA-256 `d2ca7b09c9e0182f836806b313069476a0e823fe856aec08a8981eca7728a9b1`. Its source attributes/maps and restored source image are exact, with no browser errors. The unchanged stripe in this matched receiver comparison supports studying the actual relief/diffuse-facing lobe. It does not justify changing the photo atlas or repeating the physical-material sweep.

The implementation is `review/upper-lip-relief-candidate140.js`; the source audit is `review/upper-lip-relief140-audit.mjs` and its complete numerical result is `review/upper-lip-relief140-source-audit.json`. The root-only native wrapper is `review/upper-lip-relief140-native.mjs`.

## Fixed profile

The original upper-lip central relief is:

```text
R(v) = .024 v² (3 − 2v) + .022 sin(πv)
B = .875, u = v / B
Q(u) = .4090891310602009 u³
       − .6191483613815579 u⁴
       + .24144701583338896 u⁵
```

`Q` has zero value, slope and curvature at the skin border, and matches `R`, `R′` and `R″` at `B`. Let `R130(v)` be the **central** accepted full 130 profile, including its correction below `.35`. Let `E(x)` be the same C2 corner gate used by 130: one through `|x| <= .18`, fading to zero at `.235`. The sole candidate displacement in anatomical-head Z is:

```text
ΔZ(x,v) = .5 E(x) [1 − (x/.241)²] [Q(v/B) − R130(v)]
```

The helper explicitly returns a zero field for `v <= 0`, `v >= .875`, or `|x| >= .235`. This preserves actual stored border, seam and corner buffers rather than relying on rounded endpoint arithmetic. The continuous displacement is inward only; maximum pull is `.006902229241592291`. The existing grid samples a maximum `.00689344621890751` pull. The half blend lowers the largest central profile slope from approximately `.11638` to `.08300`, while preserving the old seam-side rows 14–16.

The continuous field is C2 at its support boundaries. The rendered surface still uses the existing 100 × 16 triangular grid. No claim that its finite triangles form a mathematically C2 surface is made.

## Correspondence and normal transport

The helper requires the accepted `.94` lower-face proportions, `.06` lip thickness and full 130 positions. It checks all 1,717 upper-lip vertices against `sampleLipFrame130`, their canonical UV coordinates and the full 130 depth construction. One common head-space XYZ translation is permitted, without fitting new slopes. The maximum allowed correspondence residual is `1.2e−6`; the accepted-frame source fixture measures about `9.55e−8` in XY and `5.69e−8` in Z. It also verifies all 9,600 index values against the original triangle order.

For the actual prepared relation `headXY = (x + tx, Y130(x,v) + ty)`, the spatial derivatives are:

```text
δY = Δv / Yv
δX = Δx − Δv Yx / Yv
```

The helper evaluates the actual post-130 XY chain, including the accepted Y refinements. It does not equate raw UV derivatives with posed X/Y derivatives. The resulting Z shear has determinant one. Its inverse transpose transports the **already accepted 130 normal exactly once**, through the actual mesh-to-head affine frame. There is no second boundary-normal weld, independent smoothing pass or normal flattening.

The audit also numerically inverts the actual XY relation and finite-differences the resulting spatial deformation. That independent Jacobian agrees with the transported authored normals within `3.20e−8` components in the accepted frame and `3.12e−8` in an oblique, nonuniform mathematical fixture. The latter is a coordinate-frame check, not another artistic strength.

Actual triangle normals, areas and orientation are evaluated separately. Baseline authored normals can already differ from finite triangle normals; that disagreement is recorded descriptively in each fixture's mesh frame and is not classified as a deformation failure. The largest head-space geometric triangle-normal turn in the accepted fixture is about `18.53°`.

## Actual surface clearance

The helper builds a temporary 32 × 16 lookup of the current continuous-face triangles under the lip, after accepted preparation and pose. It clips every upper-lip triangle against its overlapping face triangles in head XY. Both depth functions are affine over each resulting intersection polygon, so the minimum separation on that polygon occurs at one of its vertices. The coverage of every nondegenerate upper-lip triangle is checked as well.

This evaluates the actual two finite triangulations between their original vertices. It is more specific than checking a procedural `faceZ` value at the lip vertices, and is independent of the shading-normal comparison.

| Source audit quantity | Accepted-frame result |
| --- | ---: |
| Face triangles in the temporary index | 1,091 |
| Overlap polygons | 9,673 |
| Overlap polygon vertices checked | 34,942 |
| Minimum baseline and candidate clearance | .000992828070697449 |
| Minimum projection coverage ratio | .999999999901852 |
| Minimum triangle area ratio | .7377114837493607 |
| Projected orientation flips | 0 |
| Spatial Jacobian minimum / maximum | 1 / 1 |
| Maximum outward displacement | 0 |
| Exact protected position-and-normal vertices | 456 |
| Maximum changed normal unit-length error | 4.28e−8 |

The clearance gate is `.00005` head units. The preserved border's nominal `.001` separation lies outside the multiplied relief. The unchanged minimum above is the actual triangulated value after the accepted transforms and Float32 rounding, not an asserted exact `.001` offset everywhere.

An independent two-triangle plane fixture validates the polygon clipper's known `.101` minimum and complete projection coverage. All original source array identities, full bytes, bindings, bounds, groups, metadata and material references remain unchanged in the source fixtures. Unprepared pre-130 geometry is rejected.

## Resource ownership and once-call API

Mode 1 owns one complete private upper-lip geometry: every original attribute and the index are copied. The original UV0, color, index and any other retained attributes remain byte-exact. Only the supported upper-lip positions and normals change; the lower lip, face, eyes and every material/map stay on their existing resources.

The private allocation is **94,748 bytes in the source fixture before native index widening**. Native r186 WebGPU normally changes the original lip index to Uint32 on its first upload. The wrapper takes its source snapshot after that ordinary frame, then clones the already widened index; a 113,948-byte native private allocation is therefore expected. The wrapper reports the actual type and allocation rather than asserting the pre-upload byte count. No geometry buffer is shared with the candidate's disposable geometry, including unchanged UV and color buffers.

The complete clearance calculation takes roughly 74–90 ms once in the local source harness; total audit time was about 450 ms, with roughly 47 MiB JS heap and 147 MiB RSS. These are local geometry-fixture timings, not native browser performance results. The temporary face index is released after application. There is no new material, texture, draw group, animation callback or per-frame work.

If native art is accepted, root can copy the helper into `src/upper-lip-relief.js`. Its existing `../src/face.js` and `../src/lip-continuity.js` imports resolve correctly from both locations, so no import edit is required. Add the once-call immediately after the accepted full 130 call, within the existing cached preparation:

```js
import { applyUpperLipRelief140 } from './upper-lip-relief.js';

state.upperLipRelief140 = applyUpperLipRelief140(anatomicalHead, { strength: 1 });
```

`applyUpperLipRelief140` returns the metrics object directly. Repeating the same active strength returns that exact object without another deformation or allocation. Mode 0 returns a no-op result before traversal or matrix work. Switching an active strength requires `releaseUpperLipRelief140(head)` or a fresh head. Release restores the original full 130 geometry reference, disposes the one fully owned geometry, and returns cleanup metrics. A second release is a no-op. Keep an accepted application throughout renderer/backend changes; release it only when deliberately removing this study or disposing/replacing its scene.

## Native on/off comparison for root

The wrapper is frozen against accepted 133 `src/main.js`, SHA-256 `73d1b1589a6cb942353bd5d7301af47680e7e5510fe6f140b4aaa5c233004136`, with full 130 and no 135. It bundles that complete live app, then applies the study through an isolated bridge after `portrait.ready`, the ordinary baseline render and GPU queue completion. It never invokes a separate screen compilation path.

Run on the existing Mac project/server:

```sh
node review/upper-lip-relief140-native.mjs
```

`PORTRAIT_URL` defaults to `http://127.0.0.1:8766/`; `CHROME_PATH` defaults to installed macOS Google Chrome. The only modes are 0 and 1. Native WebGPU is mandatory, and the wrapper makes no automatic backend substitution. Both states retain Neutral mapping 7, exposure 1.4, soft lighting, 900 × 1200 output and AA2 / 1800 × 2400 internal rendering. Visible iteration is 140, score 77.

It captures `front`, `detail`, `left`, `right`, `back`, `lip` and `lip-quarter` for each state, through the compositor's `#viewport-wrap` screenshot. The two close cameras use the original full 130 upper/lower lip bounds, computed once before deformation, the same 1.45 vertical span as 139, and offsets `[0,0,8]` and `[2.3,0,8]`. This is 14 artistic comparison images, plus one restored source front used only for exact cleanup verification.

The native audit retains exact geometry/material/visibility/transform references throughout the scene, fully hashes the original continuous-face and both lip attributes/index, checks original face/lip material values and atlas pixels/source versions, and tracks disposal of source resources. The continuous face remains one geometry record with its original two-slot front/rear material array. The array object and both slot identities are retained, and both materials' properties and bound maps are audited; each lip still requires its single original material. Candidate geometry buffers must all be privately owned, all protected attributes and 456 fixed vertices exact, and the helper's actual clearance/orientation gates satisfied. Source and private snapshots remain strict; any unexpected attribute change records its exact mesh, slot, stage, type, hash and version, instead of conflating renderer activity with source-byte mutation.

After each state the candidate releases and source checks repeat. The final restored front compositor PNG must match mode 0 exactly. Idle rendering must remain zero. Errors are collected and the browser closes in `finally`, even after a failed assertion.

Outputs:

- `output/qa/lip140-{0,1}-{front,detail,left,right,back,lip,lip-quarter}.png`
- `output/qa/lip140-restored-front.png`
- `output/qa/upper-lip-relief140-native.json`

Local helper/audit/wrapper syntax and the exact concatenated live application entry parsed successfully. The source audit passed. Root has now completed the native comparison, which is recorded below. No export or broad repeated test is requested by this study.

## Native setup guard correction

Root's first native attempt, 1590, stopped before applying candidate 140 because the wrapper incorrectly required a single material on the continuous face. Production has its original front/rear material array. This was an audit setup defect, not an environment or candidate geometry failure.

The exact first-run wrapper is preserved as `review/upper-lip-relief140-before-face-material-fix.mjs`, 30,615 bytes, SHA-256 `b74c3c21325e70ac062ec07407164acf022e14c79c106c69058ff5009087d46f`. The corrected wrapper allows and fully snapshots the two original face slots, their material values and maps, while retaining the single-material requirement on both lips. The continuous-face geometry is still recorded once, and all prior geometry/source/cleanup checks remain. The deformation helper and passing source audit are unchanged. Root completed corrected native attempt 1597 as described below; this child has made no Mac calls.

## Completed native comparison and art review

Root's corrected native attempt produced all 14 matched views on accepted 133. This independent review accepts the fixed-on profile at the unchanged overall score of 77: the long pale upper-lip band is softer in both closeups and ordinary detail, with the closed seam, corners, contour and expression retained. Profiles are stable, and back PNGs are exactly equal. The complete findings are in `review/gpt6-astra_chatgpt_upper-lip140-review.md`.

The record `review/upper-lip-relief140-native.json` contains 15 protected original attribute/index records, 3 distinct source images, 4 original materials including both face slots, and 16 successful source/private integrity checkpoints. The helper takes 35.7 ms, its native private geometry is 113,948 bytes, minimum actual face clearance is `.000992828070697449`, no triangles flip, both modes add zero idle frames, and the one private geometry disposes with no shared source buffers. Source geometry/material references and bytes restore, and the browser error list is empty.

The native report nevertheless retains overall status **Failed** for its final complete compositor PNG equality assertion. The existing-capture decoded comparison finds 3,048 changed pixels / 8,907 channels, maximum two byte values, confined to x21–120, y1006–1036: the lower-left preview button. All image pixels outside that UI rectangle are exact. Its cause is untested, and this is not relabeled as a full strict compositor pass. The independent source/resource checks and the measured UI-only location support the art decision without another native run.

The helper, source audit and corrected wrapper remain unchanged. The wrapper is a historical comparison pinned to accepted 133; later integration changes to the live main should not be silently substituted into that frozen baseline. The approved production once-call remains immediately after full 130. Its byte metric is measured at construction time, so a pre-render Uint16 allocation of 94,748 bytes can become 113,948 bytes after r186 WebGPU index widening, while all geometry bindings remain privately owned.
