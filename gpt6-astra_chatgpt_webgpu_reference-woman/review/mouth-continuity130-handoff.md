# Mouth continuity 130: frozen geometry study

The independent crease tube has already been visually accepted as hidden, with overall quality **77/100**. This separate outer-border geometry study has passed local source checks and is ready for native rendering. It has no accepted visual gain yet. Production integration remains with root.

## Run

```sh
node review/mouth-continuity130-native.mjs
```

The wrapper bundles the current `src/main.js` into an isolated QA entry and requires the accepted tube-hidden preparation. It inserts the study after the cached skin-illumination bake. It does not edit production files or invoke a separate screen-target compile.

Default strengths are `0,.5,1`. `MOUTH130_STRENGTHS` may select a unique subset of those values. Each strength gets a fresh page using native WebGPU, 900×1200 output and AA2. There is no automatic fallback. The seven views are ordinary front/detail/left/right/back and the exact original123 nose/nose-quarter framing. Root can compare the outer lip border without a changed atlas or central lip response.

Outputs are `output/qa/mouth130-border-{0,50,100}-{view}.png`, restored-front captures, and `output/qa/mouth-continuity130-native.json`. Browser cleanup and source geometry restoration occur in `finally`.

## Geometry and ownership

`applyMouthContinuity130(head,{strength})` replaces only the two lip geometries. Strength0 is a true no-op. `releaseMouthContinuity130(head)` restores their exact original geometry references and disposes their private replacements.

The source grids remain 100×16 segments per lip. Head-space X/Y, all UV/color/index values, every position at the skin border, the fixed corner band `|x|≥.235`, and the central `v≥.35` positions/normals are retained. The helper does not change the crease visibility, materials, atlases, other objects or continuous-face geometry.

The original lip profile departs from the face with nonzero elevation slope at its outer edge. At full strength, an endpoint-matched quintic replaces only the relief over `0≤v<.35`: zero value, slope and curvature at the skin border; original value, slope and curvature at `.35`. The existing `.001` positive border offset stays outside that replacement. A C2 X gate fades the correction between `.18` and `.235`. The replacement is inward and rises monotonically toward the original lip volume.

This final quintic replaces the unrendered initial gate-product draft. Its peak relief slope is `.116384`, versus `.137342` for that initial product, and its maximum continuous depth reduction is `.00507002`, versus `.00712` for the initial draft. The purpose is to avoid concentrating the changed relief into a steeper inner ridge.

Both temporary geometries own every attribute and index, initially **189,496 bytes total**. This avoids the installed r186 disposal behavior that also deletes attributes retained by cached RenderObjects. No geometry or texture is added per frame. Native WebGPU may widen the two private Uint16 indices to Uint32; the wrapper accepts that only after comparing every index value and reports the actual byte change separately.

## Normal handling

The analytic derivatives use the actual original mouth parameterization followed by `portraitY`, accepted `.94` compaction and accepted `.06` lip-Y refinement. The helper validates the entire two-grid UV/prepared-XY relationship with one common head-space offset. It does not fit new slopes or equate normalized UV derivatives with posed coordinates.

The Z-only displacement has determinant1. Its inverse transpose first transports the existing authored normals through the actual mesh→head affine frame. A **separate authored-normal residual** then aligns the interior outer boundary with normals sampled from the actual underlying face triangles and fades out by `.35`. This residual is not claimed to be another geometric derivative. The central lip normals remain exact.

The residual reached **16.44° at half strength** and **13.08° at full strength** in the source audit. These are measured changes, not claims of negligible adjustment. At full strength, 150 interior border samples agree with the underlying interpolated authored face normals to about `.00000171°`.

## Local source evidence

All four cases passed: zero, half and full in the aligned source frame, plus full in an oblique nonuniform frame. Actual `makeMouth()` grids and actual accepted deformation formulas run in the existing source-only harness. Its crease and RGB-grain stubs are explicitly documented; native color/material behavior is not inferred from that harness.

| Check | Result |
| --- | --- |
| Maximum UV residual | `6.85e-8` |
| Maximum prepared-XY residual, including oblique case | `1.16e-7` |
| Frame derivative finite-difference error | `1.05e-9` |
| Relief derivative finite-difference error | `2.56e-11` |
| Full depth reduction on actual source vertices | `.00505361` head units |
| Changed positions, aligned source | 966 at half; 966 at full |
| Changed normals, aligned source | 1,164 at either nonzero strength |
| Protected core/corner normals | 2,270 exact |
| Protected UV/color/index values | 36,370 exact |
| Actual face-clearance samples per nonzero case | 10,794 |
| Minimum source and repaired clearance | `.00099331` head units |
| New degenerate or inverted projected triangles | 0 |
| Minimum full triangle-normal dot with baseline | `.725202` |
| Aligned head-XY projected-area change | 0 |
| One-time local construction time, latest run | 36.6–69.5 ms |
| Complete source audit | .99 s wall; 1.83 s CPU; 190.2 MiB peak RSS |

The old steep border necessarily changes triangle directions. A trial cosine>.8 guard rejected that intended rotation; the final gate checks the actual nonfolding invariant: unchanged head-XY orientation under a Z-only shear, positive source/candidate triangle-normal dot, no new degeneracies, and positive real face-triangle clearance. The measured angles remain in the report rather than being presented as unchanged geometry.

Original source buffers and bounds remain exact during the study; source references restore exactly. All temporary disposal bindings are private. The source audit also rejects preparation, UV and triangle-order drift and verifies cleanup after a simulated second-target clone failure. Native injection syntax and the single after-illumination insertion passed local VM parsing.

## What native review must decide

The lower-lip patch has both geometry and material differences. Matching normals cannot remove a residual contact shadow from the retained positive gap, or the original `.44` lip versus `.53` skin roughness / `.12` lip clearcoat difference. This first study intentionally preserves all those material properties. Only consider a bounded material-continuity follow-up if the matched native images show a concrete remaining mismatch.

## Frozen files

| File | Bytes | SHA256 |
| --- | ---: | --- |
| `mouth-continuity-candidate130.js` | 26,860 | `fb2f288b264d9f2abade0aa4347d55e059c0179a0260dcf2e918d08745417c28` |
| `mouth-continuity130-audit.mjs` | 20,092 | `227b0fb7cd093b6ab21009a22d94ecda584186995a043389836890c8f4387a18` |
| `mouth-continuity130-source-audit.json` | 15,770 | `c0faf17cbdecbb61ca5228d5ab65c57a644e58c6c38a03b79feb0c7e536e6acc` |
| `mouth-continuity130-native.mjs` | 22,983 | `1429dd097a6e8a0f6f4018c67b29c221f33a1e6bd4812094e3a44857831cfe88` |

The native wrapper also reuses the existing generic `hair-strand-normal111-integrity.js`, SHA256 `e9025789ce1e5f05ba2961aca223990c729997b2e0f110fc6f3685b6e0f2b8fa`. It imports only the attribute inspector, not the rejected111 material.
