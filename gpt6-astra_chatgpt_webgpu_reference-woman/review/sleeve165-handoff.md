# 165 sleeve compression — frozen native handoff

**Ready for one native OFF/ON comparison on accepted 164. The accepted scene remains 78/100; this candidate has no native art acceptance.** Root alone runs Mac and decides production adoption. No production source, material, image, population or renderer setting was changed.

Run from the project directory on the existing Mac server:

```sh
node review/sleeve165-native.mjs
```

The default URL is `http://127.0.0.1:8766/`; `PORTRAIT_URL` and `CHROME_PATH` retain the existing optional overrides. The wrapper uses fresh native WebGPU pages with modes 0 and 1, no automatic backend fallback. It reads the already completed Mac evidence at `output/qa/integrated164-native.json` (449,340 bytes; SHA-256 `650743e8db6d3ac77d353c629cfff8a9e849f52a3c2655da3cbb744f4989cbed`). It requires exact current main SHA-256 `88280af03c4be630968aca0763d3d430ec6699ae9533ba057015c53801d4ae55` and checks all 47 runtime inputs listed in the manifest before bundling. No live source rewrite is used.

## Visible hypothesis and ownership

The sole reference has a less uniformly rounded image-left sleeve, with compression and returning cotton rolls. This study adds one restrained diagonal compression and broader return aligned with the accepted sleeve fan. The expected benefit is a small ordinary silhouette tuck and a continuous front-to-side cloth roll. Reject a padded dent, conspicuous coarse crease, displaced seam, or an effect too slight to improve the normal portrait.

Only two existing owners are eligible:

| Existing mesh | Vertices | Owned vertices | Changed positions / normals |
| --- | ---: | ---: | ---: |
| `blouse-continuous-torso-and-sleeves` | 21,809 | 990 | 963 / 986 |
| `blouse-sleeve-attachment--1` | 285 | 135 | 135 / 135 |

The torso uses a compact C2 blouse-local displacement with exact analytic inverse-transpose normals. Its existing denser seam receives the displacement of the actual emitted torso triangles, extended along Z, with an exact affine-chart normal transform. This avoids the newly inside seam centers produced by independently sampling the smoother field. No arbitrary forward lift or subdivision is used. The seam derivative is piecewise affine across source triangle boundaries; native close/profile appearance remains a specific gate.

Apply after selected 117/154/158 and before the one ordinary 99 balance. All other components, selected central 154 relief, collars, buttons, placket, neck, hair, source UV/color/texture data and topology remain exact. Torso/seam Y is exact in blouse coordinates before 99. Since 99 moves model X and the blouse is rolled, do not interpret that as a promise of unchanged owned blouse-local Y after 99; all unowned p/n values remain exact after the same pass.

## Resource ownership and source evidence

The 154 cache retains the active torso geometry. Therefore 165 stages complete p/n values and commits into the same unique live attributes, preserving geometry, attribute and ArrayBuffer identities. It does not create a disposable production replacement. Production cache retention is metrics only. Zero is a true no-op; the selected call is idempotent and a changed option on a prepared instance is rejected.

| Source result | Measured value |
| --- | ---: |
| Additional vertices / triangles / draws / maps | 0 / 0 / 0 / 0 |
| Private production p/n staging | 530,256 bytes |
| Temporary seam typed coefficients | 348,944 bytes plus 620 plain chart records |
| Retained production staging / source geometry | 0 / 0 |
| Sampled field Jacobian range | 0.755265–1.104750 |
| Maximum displacement | 0.041130 model units |
| Maximum emitted midpoint deviation | 0.006182 model units |
| Maximum transported normal length error | 3.85e-8 |
| Affected source triangles | 2,363 |
| New degenerates / reversals / fixed-scene pairs | 0 / 0 / 0 in the source fixture |

The source fixture contains the accepted blouse and complete frozen hair, with unchanged source geometry. Its changed sleeve region has no overlapping fixed-hair triangle bounds; native checks use the complete actual model and are authoritative. Do not generalize the source result to a whole-scene zero-intersection certificate.

After the actual 99 pass, all 113 sampled seam ring centers/segment midpoints retain a front-torso hit, with no newly inside samples. Minimum signed directional Z gap is 0.000305; maximum extra separation is 0.001509 and extra inset is 0.000771. These are finite center/support samples, not tube-volume clearance or watertightness claims. The native sleeve and profile views must still reject a visibly broken seam.

Source checks also cover late-input atomic failure, incorrect frames, immutable data, preserved bindings, actual triangle orientation, and sampled analytic gradients. They have passed. The freeze only parsed ten modules/entry and checked existing reports; it did not repeat the field/contact work. No local WebGPU, browser build or art acceptance is claimed.

## Native isolation, outputs and cleanup

Both pages use unchanged accepted 164 display and preparations: Neutral 1.4, 900×1200 output, AA2, selected 158/159 with no original production retention. The OFF scene must match all actual 282 accepted-164 attribute rows, with 64 logical indices. ON masks only the stable 990/135 owned p/n sets while preserving all other geometry, all 50 materials, all 10 texture sources/pixels/samplers, object transforms and thirteen selected preparation identities.

Only the three previously measured fresh-page timing leaves are normalized across pages: material 36 `referenceCrownMicrocontrast.bakeMs` / `elapsedMs`, and texture 0 `bakeMs`. Their raw values are retained; all per-page metadata checks remain strict. No other appearance or geometry value is excluded.

QA alone holds two complete private backups of all attributes/index. A frame-identical unrendered proxy carries them through unchanged 99 once. Cleanup restores their balanced p/n values into the original live attributes, verifies exact values and bindings, then disposes only those two wholly private backups. The backups never enter the scene or renderer. Both original-disposal count and idle-frame count must remain zero. Actual QA bytes and proxy/native helper costs are reported separately.

The wrapper captures front, isolated garment, left, right, back and close sleeve for each mode:

`output/qa/sleeve165-{0,100}-{front,garment,left,right,back,sleeve}.png`

The close sleeve hides the head in both modes but otherwise uses identical existing geometry/light. Actual risk checks inspect changed emitted triangles against nearby fixed scene triangles and the current emitted seam support. Eight normal warm front submissions report CPU and completed GPU-queue timing; paired timing variation is not a speedup claim. Restored-front images, exact camera/state comparison, raw protected signatures, cleanup and errors are retained in:

`output/qa/sleeve165-native-result.json`

## Frozen runtime files

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `review/sleeve-fold-candidate165.js` | 13,203 | `965cbc0351f601f36e78d55e0cb98ca4b319a026c1c5ea0ba81a479c6a3f3934` |
| `review/sleeve165-geometry-audit.js` | 10,711 | `976353900144b4863643df9fe8ffb0db210af3612eb779d79ccd8dbb212e2dc8` |
| `review/sleeve165-native-qa.js` | 22,079 | `1c0b723b4a7615dd014a442b896d229843fb6f2e15bd8a56df297a1730b74a92` |
| `review/sleeve165-native.mjs` | 16,603 | `1d7ddedadc0ca99beb195abe992ef2801099f2e4b01c3d1ebc795906c9283a7b` |
| `review/sleeve165-manifest.json` | 12,113 | `864c9f4597aa8dc9effdac97a9605c21b075ef427d91965f6d8bdde04797a90a` |

The curated archive contains new text/runtime/audit files and the unchanged shared 154 triangle routine. Current production source and prior native evidence remain existing inputs. The 1.60 MB coarse image and large reproducible mesh JSON remain local and are not needed in the native transfer. The rejected narrow/X trial remains preserved locally. No further coefficient or decorative-detail work is warranted before the twelve native art views are judged.
