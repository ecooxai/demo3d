# 147 / 149 production promotion — focused source review

**Decision: no concrete source or wrapper blocker found.** The promoted implementation is ready for the root-run native integration check. This is a read-only review of parity, imports, caching and resource ownership; it does not claim that the new native check has passed. The accepted artistic score remains **78/100** from the separately reviewed 147 and 149 studies.

## Promotion parity and execution order

`src/eye-contour.js` differs from frozen `review/eye-contour-candidate147.js` only in the two import paths for the promoted field and configuration. The field and JSON configuration remain byte-identical. The deformation, analytic normal transport, bounds, source-buffer isolation, zero-normal handling and cache semantics are unchanged.

Main invokes 147 after the accepted full 130 and 140 lip preparations, inside the existing `scenePreparationPromise`. The default `retainSourceForQA: false` is preserved: this helper does not retain the replaced source geometries for restoration. That is an ownership statement about this helper, not a claim that every previous owner has released every source buffer. The candidate still clones all attributes and indices of affected geometries before changing their positions and normals. Its production call adds no per-frame work and does not alter material or texture bindings.

The 149 call follows the accepted 100 crown bake and 141 crown-side selection, inside the same preparation promise. Its separate WeakMap returns the original result identity on repeated calls. All five named physical materials and finite colors are validated, and their distinct material identities are checked, before any color changes occur. The current groom constructors leave their diffuse factors at white; crown and fine-material cloning preserve those factors. Consequently the chosen linear multipliers produce exactly `[0.65, 0.69, 0.75]` on each selected material, matching the native wrapper’s expectation. There are no added geometries, textures, draw groups or retained source-color copies. The source maps, vertex colors and crown-versus-MASS side ownership remain intact.

## Narrow native wrapper review

`review/integrated149-native.mjs` uses the selected original 147 native report as evidence without altering that frozen report’s historical status. Its label-and-attribute queues account for repeated mesh names and require all 62 selected position/normal hashes across 31 promoted geometries. Float32 position and normal hashes are appropriate for this comparison; the broader resource baseline is taken after an ordinary initial WebGPU render, avoiding a false first-upload index-widening failure.

The wrapper traverses all current model mesh bindings and handles scalar and array material slots. It protects geometry, material, attribute-array and map references, attribute versions and full bytes across native WebGPU → explicitly requested WebGL → native WebGPU. The six cached result identities are actual assigned state fields, including `state.referenceCrown`; the five tint factors are checked for accidental repeated multiplication. It also retains the existing crown/MASS ownership, original-disposal, idle-frame and browser-error gates.

Rendering follows the ordinary application path without a standalone `compileAsync`. The final 390-pixel check is explicitly a desktop-browser CSS layout check and preserves the 900 × 1200 output; it does not claim physical-phone performance. Browser/page closure is in the wrapper’s `finally` block. No additional test suite, diagnostic sweep or production edit was added during this review.

## Reviewed file identities

| File | SHA-256 |
| --- | --- |
| `src/main.js` | `a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521` |
| `src/eye-contour.js` | `c3b6e6857af712a6e4b4c7280be44a0d64cb8a19e4fd94671304acf39c412b79` |
| `src/eye-contour-field.js` | `15649a72bd4823bb48b2d7c143db9e8a445272c4ecdbcc0df84f17d2093f97fd` |
| `src/eye-contour-config.json` | `80c678db068d31d33b2ad0e23424419d029047038de6c19f044fa7869605bfb8` |
| `src/hair-color.js` | `a49c0ea4be9ead7ca1c1a45f6d1174f38ecabd31031935bbc9d00d3ce53590e1` |
| `review/integrated149-native.mjs` | `be0c315ea71352bd67ae1fb42f33e40ab23ee7beeb5bd639285cb92e1d1d3591` |

Reviewed by GPT-6 Astra / ChatGPT, local source only. Root owns the pending native execution and integration outcome.
