# Blouse154 — frozen isolated OFF/ON native study

**Source-ready; native art review pending. Overall score stays 78/100.** Production main, blouse, hair and every other `src/` file remain unchanged. This is one restrained coarse cotton fold, with no added geometry population, material, texture or per-frame work.

## Exact baseline and files

Use the current accepted149 pipeline for both states, including147 eyes,149 hair tint,140/130 lips,141 crown facing,100 crown,133 fringe,118.5 guide placement,86.35 contact,99 balance and117 cloth color.151 is visually selected by root but deliberately not integrated into this baseline yet.155 is also separate.

| Input | SHA-256 |
| --- | --- |
| `src/main.js` | `a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521` |
| `src/blouse.js` | `02b15fe9bbdfa428be27fd0f9ed44f7171b3178056b32c9586b8cf63a1da63a6` |
| `src/hair-groom.js` | `a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d` |
| `review/blouse-drape-candidate154.js` | `eceb86f01cc60b2fb711bd32669a88dc7aeff0be0e40d2ba10180764b07790a3` |

`review/blouse-drape154-manifest.json` records exact bytes/hashes for every new native module and the local relative runtime dependency graph. The native wrapper verifies them before building. If production changes, rebase the explicit guard deliberately; do not bypass it.

Native modules:

- `review/blouse-drape-candidate154.js`: one bounded Z field and exact analytic normal transport; private complete torso clone.
- `review/blouse-drape154-geometry-audit.js`: affected emitted torso strips against actual fixed hair triangles.
- `review/blouse-drape154-native-qa.js`: after117/before99 placement guards, exact protected buffers/maps, unrendered original99 proxy and cleanup.
- `review/blouse-drape154-native.mjs`: one fresh native WebGPU OFF/ON comparison, six matched views and restored front.

The curated archive contains these modules, manifest, this handoff, compact source/proxy/contact reports, the approved amended plan, and the coarse diagnostic PNG. It deliberately excludes the large reproducible coarse mesh JSON. Runtime dependencies are the existing Mac project dependencies; no installation is required.

## What the final constrained fold does

Own 254 existing vertices on `blouse-continuous-torso-and-sleeves`, the original 21,809-vertex / 43,008-triangle torso. Only 250 Float32 Z values and 254 normal entries change. X/Y, every outside p/n entry, UV/color/index values, all other meshes and all materials/maps remain exact.

The field follows the existing middle-left button-pull path. It includes the full widened placket `C(Y)`, `d=C(Y)-X`, curved `Yc(d)` and all gate/width derivatives. Normal transport is the exact inverse transpose of `(X,Y,Z) -> (X,Y,Z+H(X,Y))` in the asserted identity torso-to-blouse frame. Continuous determinant is1; actual triangle orientation/contact checks are separate.

The final coefficients are **crest 0.006 / hollow 0.028**, resulting in measured vertex displacement **+0.005321 / −0.025848**. The final form is primarily a deeper asymmetric hollow next to a modest shoulder, rather than the larger convex crest initially proposed. No later decorative fold or coefficient sweep is included.

Two concrete constraints narrowed the first draft:

1. Broader lateral gates within the same approved support resolved a 0.00609 original-grid chord error without subdivision. Final maximum sampled field-to-chord error is 0.002011 across 2,304 edge/centroid samples.
2. Actual hair triangles rejected crest 0.040: 35 new contact pairs, including guide 133. Crest 0.018 still had four new fine-chord pairs although sampled point gaps were positive. Their exact projected-overlap vertices bounded the crest coefficient to 0.006513 with a 0.0005 margin; the selected 0.006 passes the complete focused check. All failed-draft evidence remains in `review/`.

This is not a claim of a global collision-free garment. The torso already has inherited overlap with hair; the test reports changes relative to those actual pairs.

## Passing source evidence

The established local arithmetic harness constructs the current blouse and accepted133/118.5/86.35 groom, poses them and applies unchanged99 once. No photograph pixels are analyzed for these checks.

| Check | Final source result |
| --- | --- |
| Owned vertices / changed Z / changed normals |254 /250 /254 |
| X/Y or outside p/n changes |0 |
| Affected original torso triangles |576 |
| New degenerate / reversed triangles |0 /0 |
| Minimum old/new triangle-normal cosine |0.928967 |
| Area ratio range |0.962512–1.194695 |
| Maximum sampled field-to-chord deviation |0.002011 |
| Analytic H gradient versus independent finite differences |max1.69e−10 over2,911 samples |
| Widened C(Y) value / derivative error |0 /5.89e−11 |
| Actual fixed hair population |1,114,888 triangles |
| Hair triangles overlapping changed torso XY region |13,107 |
| Baseline / candidate actual contact pairs |46 /46 |
| New / removed / retained pair identities |0 /0 /46 |
| Additional projected forward hits |5,745 |
| Sampled minimum forward gap, old→new |0.019090→0.018644 |
| New sampled forward crossing |0 |

The projected samples supplement actual triangle tests; they are not shortest-distance or global disjointness proofs. Native repeats this focused actual-triangle gate against the live current groom.

The helper also passes zero-before-traversal, same-argument result identity, changed-option rejection, finite input preflight and atomic wrong-frame rejection. No optional broad geometry audit is pending.

## Full replacement ownership and restoration

The replacement clones **all** attributes and index. It shares no original attribute object or underlying buffer, including unchanged UV/color/index. This follows root's explicit correction to the initial position/normal-only cost estimate.

| Binding | Bytes before native upload |
| --- | ---: |
| Position |261,708 |
| Normal |261,708 |
| Color |261,708 |
| UV |174,472 |
| Uint16 index |258,048 |
| **Complete private replacement** |**1,217,644 (1.161MiB)** |

If the installed WebGPU backend widens the index to Uint32, the complete current array total becomes 1,475,692 B (1.407 MiB). The wrapper records actual array replacement and logical index equality. These are complete replacement totals, not equal permanent CPU/GPU increases: production uploads the replacement instead of the original. Native QA intentionally retains the original for cleanup. No additional mesh/draw/texture or per-frame pass is introduced.

154 applies **after117 and before99**, preserving the atlas bytes. QA retains a detached raw original only in the ON case. Immediately after ordinary99, it constructs an **unrendered, frame-identical one-mesh proxy**, calls the same imported99 helper once on that proxy, then detaches it without disposal. This carries the retained original into exactly the OFF case's balanced coordinates. The real candidate and all other objects receive the ordinary99 call once.

The narrow proxy audit invokes the actual QA preparation/continuation/cleanup code and confirms **every balanced original attribute hash matches OFF**, with zero original disposals and one fully private disposal for ON. Native checks the installed Three objects/events/index upload separately. The ordinary post-restoration render must use that balanced original; swapping the unbalanced source would be wrong.

Local helper time was 18.5 ms in the arithmetic fixture. Native records helper time, QA proxy/final-snapshot time, heap and eight ordinary warm front submissions separately. Local full-groom contact checking is diagnostic work and is not added to production startup.

## Root-only native run and art gate

From the existing Mac project directory, with its ordinary localhost server running:

```sh
node review/blouse-drape154-native.mjs
```

Two fresh pages select `fold154=0` and `fold154=1`, native WebGPU only. The wrapper guards accepted149/78 and Neutral1.4 at 900×1200 with AA2 before changing the UI to154/78. It does not silently select WebGL or reconfigure the materials or lighting.

Output:

- `output/qa/blouse-drape154-{0,100}-{front,detail,left,right,back,garment}.png`
- `output/qa/blouse-drape154-{0,100}-restored-front.png`
- `output/qa/blouse-drape154-native-result.json`

The garment closeup uses the established isolated garment camera with the head group hidden temporarily, then restores it before all source checks and cleanup. Both cases retain the ordinary whole portrait front and all four sides. Camera and display restoration are enforced. Encoded PNG equality is reported independently, including both cases after the same restoration sequence; any portrait-visible discrepancy needs inspection.

Accept only if the ordinary front and garment view show a softer, more plausible connected cotton fold. Reject if it reads as an embossed stripe, a pinched cut, a doubled painted shadow, or an imperceptible change at this cost. The triangular collar, broad remaining panels, and larger hair/face limitations are unchanged. **Technical success does not raise 78 or establish production adoption.**
