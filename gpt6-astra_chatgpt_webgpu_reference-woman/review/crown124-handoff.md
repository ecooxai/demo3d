# Candidate124: shared crown-to-fringe replacement

Status: frozen for the first native comparison. Overall quality remains76/100 pending actual rendered review. No production source has been changed.

## Files and API

- `review/hair-groom-candidate124.js`:48,405 bytes, SHA256 `e6ed556b74851ec6b383a27f639ca74e3e4d606070528db5010a91ef953fd811`.
- `review/crown124-native.mjs`:6,139 bytes, SHA256 `3394562c0c1e5bc76e2c422948a021408474ef9c70c8c1054738528ac76316e0`.
- `review/crown124-audit.mjs` and `review/crown124-audit.json`: bounded source check and measured results.
- `review/hair-groom-before124.js`: exact accepted118 source checkpoint, SHA256 `b75e9b72d44a5a51d88c3aa280842321b3e75ae8b6dc242ad9df7db79e024822`.
- `review/crown124-build.mjs`: reproduces the candidate from that checkpoint. Do not rebuild the frozen candidate during native review.

```js
createGroomHair({
  headShiftX: .26,
  shoulderContact: .35,
  guidePlacement: .5,
  crownPatch124: 0 // or1; default0 is the exact accepted baseline
});
```

This is a binary structural replacement. Fractional positive inputs currently select the complete replacement and are reported as strength1; they are not interpolation strengths.

## What changes

The exposed forward tail of the two old crown sheets is withdrawn through their vertex alpha. Its fade is in varying crown-flow coordinates, with different positions across the front. The existing crown grid, positions, normals, UV0, RGB and topology remain exact. The existing upper fine crown fibers keep their count and UV/color data; affected front fibers now taper within the overlap instead of ending at the obsolete lower cap edge.

The old seven fringe families are not emitted when124 is enabled. Their random draws are still consumed so later accepted geometry stays deterministic. Twenty-four unequal replacement families start inside retained crown coverage. Their dense upper sections and fine forehead or temple ends use the same continuous paths. Five families on each side continue toward the accepted side guides; the remaining fourteen have unequal bowed forehead ends. A monotone interpolation of their vertical coordinates prevents the exposed upward returns that failed in105.

The replacement emits1,565 thin fine ribbons and one shallow rounded coverage mesh. Its new256×1024 original procedural map contains fine longitudinal lanes with varied disappearance positions. The new coverage uses the accepted matte fringe material response, without125's experimental shader. The existing back, mass,94 far-ear layer,118 lower-guide deformation,86 contact and their physical materials are unchanged.

## Measured source results

| Measure | Result |
|---|---:|
| Baseline hair triangles |1,114,888 |
| Candidate hair triangles |1,072,144 |
| Triangle change |−3.83% |
| Candidate geometry memory |51.75MiB |
| Source construction time |4.632s |
| Replacement families |24 |
| Replacement fine strands |1,565 |
| Changed CROWN alpha values |4,904 |
| Nonfinite geometry values |0 |
| Exposed upward family steps |0 |
| Minimum sampled descending family step |.0007122 |
| Maximum root-attachment distance from retained crown |.0008301 |
| Minimum crown retention at root attachment |1 |
| Minimum sampled inner center-path skin clearance |.0342375 |

Off is byte-identical to accepted118 at the stated placement/contact settings. All MASS attributes/index, the lower DETAIL prefix and protected DETAIL suffix are exact. The DETAIL UV/color/index remains exact throughout. Those checks preserve lower118 geometry, the contact fit, flyaways and the94 far-temple layer. New meshes have finite, unit normals; the original crown retains its three existing pole zero normals.

These are source-harness measurements. The three-construction audit took14.42s and peaked at556.35MiB RSS. They do not measure native Three/WebGPU heap, render speed or visible quality.

## Native review

Run the frozen wrapper against the current122 main and current source dependencies. It replaces only the groom module and adds the124 constructor flag. It includes accepted118 placement.5, contact.35,100 texture, and the current portrait pose/cloth/ear setup; it adds neither116/119 nor125.

It captures off/on front, detail, left, right, back and a close junction view. The on case additionally hides only the old forward cap overlap for detail/right isolation, leaving the foundation, top, back and new replacement paths visible. This diagnostic deliberately exposes whether the new roots need the old tail for support.

The adoption gate is visible loss of the hard lid without sparse holes, a bald-looking upper overlap, heavy blade ends, hooks or damaged ear/profile flow. No score increase is warranted before that comparison.

## Remaining concrete risks

The source audit checks attachments and center paths, not exhaustive alpha-filtered, view-dependent coverage or every fine-strand skin intersection. The new matte root coverage may differ visibly from the retained crown's sheen. The existing MASS roots remain exact and may contribute a residual side boundary even when the front sheet tail is removed. These are reasons for the requested native close-up and old-cap isolation.

If the visible experiment is accepted,104's filtered-coverage characterization must be rerun against the altered CROWN alpha. The exact100 UV/layout is preserved, so no exporter change is required merely to render the experiment. The new coverage map is an original procedural asset and uses standard mesh UVs/material alpha.
