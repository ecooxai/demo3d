# Candidate 133 — single diagonal fringe family

## Status

Frozen for first native review. **No art score assigned; accepted production remains 77/100.** Only review files were written. The live groom and all rejected candidates remain unchanged.

## Native entry

Run `node review/fringe133-native.mjs`; add `--isolate` to capture two optional images with only fringe group0 shown while retaining the other hair meshes.

The wrapper loads current live `src/main.js`, including the latest accepted full130 mouth preparation, and replaces only the groom import and this constructor option:

```js
createGroomHair({
  headShiftX: .26,
  shoulderContact: .35,
  guidePlacement: .5,
  diagonalFringe133: 0 // or1; positive selects the new family
})
```

The exact accepted118 constructor marker is guarded. No other initialization or renderer preparation is rewritten. Expected captures are `output/qa/fringe133-{0,1}-{front,detail,left,right,back,junction}.png`, with optional `fringe133-1-group0-only-{detail,left}.png`. Native metadata are written to `output/qa/fringe133-native-report.json`.

## Change

Only accepted108 `bangGuides[0]` changes:270 existing source slots,223 emitted strands. The other six bowed fringe families remain exact. The original buried path is retained through approximately head-local Y.90; one narrower diagonal family then follows the outer brow toward the upper cheek. A small subset takes a shorter bowed route toward the upper ear, and the remaining short companions end unequally around the principal fall.

Source-slot routing is220 principal,23 short companions,27 upper-ear companions. These are source slots, not additional fibers; the accepted omitted-slot pattern remains. Ends range from head-local Y−.51963 to+.28320. Widths, strand types, materials, colors and their original random draws are unchanged.

The new lower controls are evaluated in final head-local coordinates and mapped back through the exact existing hair gravity compensation. Their front support uses the original facial equation through the accepted50 vertical deformation. The small58 cheek narrowing makes that runtime envelope conservative. Upper-ear paths were checked against the actual original closed ear triangles after50 and115. No cap, carrier, plate, broad ear strap, extra material, texture, or source-image projection is added.

Two concrete path issues were repaired before freeze: coarse inverse-height sampling disturbed the join tangent, and a fade based on normalized curve time concentrated the root offset into too little physical distance. The inverse now uses sufficient numerical precision, and the offset releases smoothly over.42 head-local vertical units. The short upper-ear transition is also rounded over the actual cartilage region.

## Source checks

- Off133 is byte-identical to the accepted118 groom at placement.5/contact.35.
- CROWN, MASS, DETAIL and WISPS attributes/index are exact.
- Fringe groups1–6 positions/normals are exact; all fringe indices, UVs and colors are exact.
- All maps, material settings and counts are unchanged.
- Hair total remains **1,114,888 triangles /52.49 MiB**.
- All geometry is finite; modified-family normals are unit length within Float32 rounding.
-270 source paths /223 emitted paths;7,943 sampled exposed segments;0 upward steps.
- Retained-prefix and join-position error:0.
- Maximum sampled join-tangent difference: **.03637°**.
- Maximum adjacent100-step trajectory turn:16.97°, at a principal fine tip.
- Maximum gravity-inverse residual:2.38e−12.
- Sampled face clearance minimum:.02648; no sampled face penetrations.
- Actual115 ear clearance:.05085–.08494; no sampled ear penetrations.
- Principal lower-path maximum support gap belowY.75:.08827.

The maximum nearest-support gap including the retained upper-root transition is.20047. The maximum gap to face alone is.28195 at an upper-ear sample whose nearer ear support is only.061 away; that face-only value does not measure empty-space distance. Two sampled lower points lie beyond both front XY support domains near the silhouette. These results do not certify every ribbon/tube vertex or rendered triangle interpolation. Native profiles and art are still required.

Source construction in the final run was5,132.7ms; the audit retains three full grooms and peaked at797.26MiB RSS. This is not native construction time or GPU memory. The native trial should measure actual costs rather than extrapolating from this harness.

## Frozen files

| File | Bytes | SHA256 |
|---|---:|---|
| `review/hair-groom-candidate133.js` |44,537|`a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d`|
| `review/fringe133-native.mjs` |5,585|`0e8e934bd8fdf3a4526c1a42ebf17eec36a30a9f14b9686577790e126fbef93d`|
| `review/fringe133-audit.mjs` |10,137|`3bc7d76ff06fca459358950bcb99d04fd6ebd16d1ea204c1f4906a2f97e69cfa`|
| `review/fringe133-audit.json` |58,119|`ad36005040c44cd0cccc343cd0ca858e753fdad50803621061ccf0752ff1ae5d`|

The unchanged live groom is38,955bytes, SHA256 `b75e9b72d44a5a51d88c3aa280842321b3e75ae8b6dc242ad9df7db79e024822`.
