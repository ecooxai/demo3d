# 148 native comparison freeze

**Ready for one native WebGPU OFF/ON comparison on accepted149. This is a source-ready study, not production adoption or a quality increase. Accepted score remains 78/100.**

Run from the existing project directory on the Mac:

```sh
node review/upper-shoulder148-native.mjs
```

The wrapper requires the running project server at `http://127.0.0.1:8766`, the existing Playwright/esbuild dependencies and `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. It does not initialize another environment, change production source, or fall back from WebGPU.

## Frozen source and transfer set

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `review/hair-groom-candidate148.js` | 45,461 | `16a97d4964a318d240257e727179f9198537faab0117c76b5310ef83641d2fba` |
| `review/upper-shoulder-paths148.js` | 11,797 | `1474414832f1ec2a5399f6bf3254bab64ba1fa4cf757a5b2900617794ee571cf` |
| `review/upper-shoulder148-native-coefficients.js` | 2,636 | `206c769092ca3e7d710ac62c126ae24ef905653670d734df21aeb4089854665e` |
| `review/upper-shoulder148-native-layout.json` | 42,755 | `45fb64f0d4ab036d751bdc6223b394831a1d464f27d6dd811317cbcd7f519140` |
| `review/upper-shoulder148-native.mjs` | 13,193 | `9285e59e745eba7a01c4b599cca77fc52b2779f979389ade9fb594856aa963c1` |
| `review/upper-shoulder148-full-audit.json` | 25,784 | `5a6e9194c8dc1a4983bdf8db5c0d4770440e2adb003fb7ac621d38411f99126a` |

Transfer those six files and this handoff. The curated archive/manifest excludes all large reproducible mesh JSON, sampled segment JSON, plots and source-harness dependencies. The compact layout carries protected attribute ranges and exact relevant source hashes; it does not contain geometry coordinates.

Required current main: `a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521`.

Required production groom: `a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d`.

The native wrapper additionally checks every source hash in the layout, including actual blouse, contact, lower placement, head, eye147, hair color149 and pose/balance helpers. It retains accepted147 eyes,149 uniform tint,140 lips,141 crown facing,100 crown,118.5 placement,86.35 contact,99 balance and Neutral1.4 in both modes. Jaw152 is not included.

## Coherent geometry mechanism

The selected 75 guides keep the original approved upper depth field and existing closed section volume. The common model-space map is `X'=X, Y'=Y, Z'=Z−P(X,Y)`. Its frozen coefficient fingerprint is `aee55b27f5e40c9f6eb41cdd351dccefabe8f7567f5420172c257bda9adec66a`.

MASS uses the approved inverse planning through the original ear transform, partial gravity and86 mapping before original section meshing. Its accepted118.5 guide fit happens once. The fine generator uses each selected guide’s accepted original118 curve and original subdivision cuts; it does not independently rebuild or refit a curve. After its ordinary gravity/contact pass and baseline normal calculation, selected fine vertices receive the identical model-space shear directly. Their normals receive the analytic inverse transpose of that shear. Thus a normal outside the field stays exactly unchanged even if a long neighboring triangle touches the transition.

This adds no surface population, cuts, textures, materials, baseline attribute copies retained by the finished groom or per-frame work. The 2,415 owned regular fibers and 27 already assigned flyaways retain their original RNG slots, indices, colors and UVs. Fine range metadata is coalesced into 102 small intervals.

## Completed source checks

- Candidate OFF is byte-exact to the accepted original groom for every geometry attribute and index.
- ON retains **955,385 hair vertices and 1,114,888 hair triangles**. Added vertices/triangles: 0.
- All unowned arrays and all positions/normals at modelY≤.55 or modelY≥2.30 are exact. No lower-tip or upper-root normal exception was used.
- No nonfinite normals or triangle orientation reversals. Hair retains its original 3 zero normals. Maximum unit-normal error 4.97e−8; minimum old/new triangle-normal cosine .94820.
- Maximum fine vertex residual against the shared field 1.32e−7. Analytic normal-gradient finite-difference error 4.48e−10; jet value matches the original pull evaluator exactly.
- **0 new cloth/collar/neck crossings** across 87,893 moved fine edge/interior samples. Minimum tested forward normal gap .00447. These are sampled actual triangles, not a global mesh-disjointness proof.
- The continuous shear determinant is 1. Actual triangles were checked separately; the determinant alone is not used to certify the discrete surface.

The largest observed fine chord deviation from the smooth field is **.01729**. A near-maximum recorded case is a regular guide138 ribbon, row14, around modelY1.697. This comes from the original coarse ribbon cuts through the stronger upper bend. It did not produce a tested triangle orientation reversal or clothing crossing, so no refinement was added. Inspect the upper curl and any newly visible straight fine carriers natively.

The full source audit used three complete local harness constructions: original 16.47s, OFF 16.50s and ON 15.99s. Its peak RSS was 754.24MiB; this includes the simultaneous review copies and captured curves. The paired values are not evidence of a speedup. The one-time fine transport measured 54.12ms, guide preparation .23ms, with no extra retained geometry. Full native construction, heap and warm frame cost remain to be measured by the wrapper.

## Native capture and integrity checks

The wrapper creates fresh OFF and ON pages at 900×1200, AA2, Neutral1.4. Before setting the review badge to iteration 148/78 it checks accepted149 state and preparation. It compares complete geometry counts, protected positions/normals, full index/color/UV attributes, all other model meshes, original hair material settings and exact hair-map pixels between the modes.

Outputs are `output/qa/upper-shoulder148-{0,100}-{front,detail,left,right,back,shoulder}.png`, plus restored-front captures. The shoulder closeup uses the same fixed near-quarter camera in both modes and includes the 87/28 root interface and collar passage. The result JSON is `output/qa/upper-shoulder148-native-result.json`; it is saved after each completed case and on failure. Console errors and page errors are both collected. Pages and the browser close in `finally` blocks.

After closeups, the wrapper restores exact front camera/target/projection/render state, measures eight warm CPU submissions plus GPU queue completion and requires zero idle renders. It makes no pixel-identity claim for the changing performance label and no speedup claim from one timing pair.

## Art gate

The approved coarse view reduces the upper collar/profile gap while preserving frontal footprint and original long ends. The stronger turn near Y1.75 remains a specific risk. The existing guide87/fixed28 exposed seam shifts: two adjacent new triangle-pair segments at Y2.089–2.097 remain within .00294 sampled distance of the old seam. This is not described as entirely hidden or erased because it is small.

The focused coarse intersection study found the other tested new interfaces covered in front, near quarter/profile and back. It does not prove fine-strand visibility or native material correctness. Native acceptance should inspect the upper turn, 87/28 seam, collar clearance and any exposed old carriers. No production adoption or additional score is authorized by a successful build, finite source audit or completed capture.
