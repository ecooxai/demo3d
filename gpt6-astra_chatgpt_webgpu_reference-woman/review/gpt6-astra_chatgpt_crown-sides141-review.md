# Crown side rendering review 141

## Decision

**Accept mode 2 as a bounded live material correction, retaining 77/100.** The pale triangular sliver below the near earlobe disappears, making that small hair/ear transition closer to image1. The inspected views show no new coverage opening, changed silhouette or useful reason to retain the exposed inner crown surface there. This is a local cleanup, not a substantial groom-quality or likeness gain.

This review independently inspected image1, all ten `crown-sides141-five-{0,2}-{front,detail,left,right,back}.jpg` images, and all nine focal `crown-sides141-{0,1,2}-{detail,ear,ear-oblique}.jpg` images. No Mac call, production change or extra test was made.

## Visual findings

| View | Mode 2 versus accepted mode 0 |
| --- | --- |
| Front | The pale sliver behind the near earlobe is removed. The face, crown outline, fringe arrangement and long hair masses retain their apparent size and position. The correction is small at ordinary portrait scale. |
| Detail | The improvement is clearer: the light gray triangular sheet under the earlobe gives way to the existing dark hair behind it. It no longer reads as a rigid metallic insert between ear and cheek. Existing thin hairs crossing the ear remain. |
| Left | Visually indistinguishable coverage and silhouette in the supplied JPEGs. No new scalp opening or exposed inner sheet is apparent. Root's separate comparison reports a maximum one-byte JPEG difference. |
| Right | Some small crown highlights change locally. I do not see a new hole, sliced outline, enlarged scalp gap or change to the long lengths. The existing crown volume and part remain recognizable. |
| Back | The visible coverage and outline are unchanged. The native PNG hashes are also exactly equal between modes, independently confirming the supplied images' appearance. |
| Ear closeup | The conspicuous pale triangle in mode 0 disappears in mode 2. The underlying dark hair remains a continuous visual backing for the ear. Image1 has a shaded hair/ear junction without the same large pale insert. |
| Ear oblique | All three focal modes retain the same visible coverage. Their native PNG hashes are identical; this angle does not reveal a new culling gap. |

The focal mode 1 applies outward-only rendering to the foundation group while retaining the original side-sheet material. It already removes the foundation's bright contribution but leaves a more apparent dark sheet edge below the ear. Mode 2 extends outward-only rendering to the complete crown and gives the cleaner closeup transition. Its native implementation retains one original geometry and its original draw-group layout.

The foreground lashes, source eye catchlights, current mouth, broader crown smoothness and coarse long-hair structure are unchanged limitations of the existing portrait. They are not gains attributable to 141. The five views and focal oblique view support this limited acceptance; they are not an exhaustive proof for every possible camera angle.

## What the native records establish

The focused `review/crown-sides141-native-result.json` reports native WebGPU, six exact original crown attribute/index records, unchanged source map bindings (`map`, `normalMap`, `alphaMap`), restored geometry/material references and flags, private-resource disposal and no browser errors. All three focused modes restore the exact original detail PNG.

The broader `review/crown-sides141-five-native-result.json` reports the same source-data and reference checks, with no browser errors. Mode 0's restored detail PNG is exact. **Mode 2's final strict restored-detail PNG hash does not match. It must not be described as a full strict restoration pass.**

The subsequent decoded comparison in `review/crown-sides141-five-restore-pixel-diff.json` measures the existing baseline and restored PNGs at 796 × 1061 pixels:

| Restoration difference | Measured result |
| --- | ---: |
| Changed pixels | 3 |
| Changed channels | 4 |
| Maximum channel difference | 1 byte |
| Sum of absolute channel differences | 4 bytes |
| Changed bounding box | x452–453, y179–180 |

The cause is not established. This is a negligible visible restoration difference alongside independently exact source buffers/references, rather than evidence for a framing change or a broad source mutation. I accept the bounded artistic correction with that qualification and do not relabel the failed strict equality assertion as passed.

For reference, mode 0 and mode 2's full back PNG share SHA-256 `93d4d158e187d22add9eff6574e8c78844a087116d49948cc04a10dc9c0f95fa`. All three focal ear-oblique PNGs share `51b7dc1774d14a526431651ff12408f5fc6dd23dc59538329b95ac5be8f9bbdd`.

The 141 scripts fingerprint the crown attribute bytes and retain source texture object bindings. They do not constitute a new full source-pixel/sampler audit or an export roundtrip, and this review does not claim those additional checks occurred.

## Isolation from MASS and integration scope

Source inspection supports keeping this change entirely on the crown. In `src/hair-groom.js`, the MASS mesh uses `material`; the crown already receives its own `crownMaterial = material.clone()`. The accepted 100 preparation in `src/reference-crown.js` then creates and assigns another crown-specific material for the UV1 atlas and UV0 coverage map. The long MASS material is not that final crown material.

The reviewed mode 2 clones only the current crown material and changes:

```js
crownOnly.side = THREE.FrontSide;
crownOnly.shadowSide = THREE.DoubleSide;
```

It assigns that clone only to `Continuous parted crown with longitudinal fiber flow`. The geometry, UV0/UV1, index, vertex RGBA, three source texture bindings and physical response fields are otherwise retained. No MASS material, geometry, normal map or alpha behavior needs to change. The shared texture objects must remain on their original bindings; changing their samplers or image data is outside this acceptance.

For production, the smallest equivalent placement is on the already separate `crownMaterial` immediately after its creation in the groom factory, before first rendering. The accepted 100 clone copies these side settings, and the source atlas bake does not use either field. This uses the existing dedicated crown ownership without another retained geometry or texture allocation. Root can instead retain a dedicated final material clone if that fits its controller lifetime; either placement must target only CROWN, with MASS's original material untouched.

The explicit `shadowSide = DoubleSide` is part of the selected live setting. Both shadow flags on the crown remain as before. The 100/104 affine UV layout and coverage bytes are unchanged, so the prior alpha-merge mapping contract remains valid; there is no new alpha-resampling study in this correction. This verdict covers the inspected live renderer behavior, not an unperformed loaded-scene shadow or export comparison.

Root owns production integration. The accepted score remains **77/100**.
