# Lip edge material135: frozen native A/B handoff

Status: implementation, numerical audit and syntax/injection checks complete. **Native render, source-restoration and visual review are pending.** Overall quality remains **77/100**; no visual gain is claimed.

## Candidate scope

The candidate runs after accepted full130 geometry, with the separate crease tube still hidden. It replaces only the two lip geometry/material references during the isolated experiment. Every original position, normal, UV0, color and index byte is copied unchanged; the added UV1 uses the original100×16 grid parameterization. The geometry copies own every attribute and index because the actual r186 disposal path can also delete cached RenderObject attributes.

One shared **128×128 RGBA8 map, 65,536 bytes**, supplies clearcoat in R and roughness in G. It is linear numerical data, uses UV channel1, clamp-to-edge and bilinear filtering, and has no mipmaps. UV endpoints address the first/last texel centers. Both lips use the same map because their grid v=0 denotes the outer border and v=1 denotes the closure.

The field is the approved corner gate multiplied by `1 − quintic(v / .35)`:

`roughness = .44 + .09 m`, encoded as G with material factor `.53`.

`clearcoat = .12 (1 − m)`, encoded as R with material factor `.12`.

The original color/emissive atlas, original UV0, specular settings, clearcoat roughness, bump binding/scale, sheen, geometry/normals, eyes and all other meshes remain unchanged. No shader hooks, new draw groups, per-frame work, additional pore map or lighting changes are introduced.

## Explicit approximation

| Quantity | Result |
| --- | --- |
| Central roughness after RGBA8 encoding | 0.44062745098039213 |
| Central roughness bias from0.44 | +0.0006274509803921302 |
| Central clearcoat | 0.12, preserved |
| Maximum roughness error at baked texels | 0.0010386692279628629 |
| Maximum clearcoat error at baked texels | 0.00023514915328667896 |
| Maximum interpolated roughness error,1,050,625 parameter samples | 0.0010651576238260851 |
| Maximum interpolated clearcoat error, same samples | 0.0005776052984182798 |
| Analytical roughness error bound, ideal double-precision UV | 0.0013813703051340383 |
| Analytical clearcoat error bound, ideal double-precision UV | 0.0006915002761264302 |
| Maximum Float32 grid UV encoding error | 2.8610229518832853e-8 |

The analytical bound includes byte quantization and separable bilinear interpolation; the audit separately reports actual Float32 grid sampling. Dense sampled maxima are not represented as exhaustive continuum maxima. All central texels have R255/G212, and the filtered central region retains that constant response. This is a small bounded approximation, not an exact preservation of the original central roughness.

The packed-map SHA256 is `3dbea8f0cd81612f372934aac6f9575fdc5b62b63b4883ee7eeb2d7bb77ee947`.

## Cost and ownership

- Two fully private geometry copies: **216,968 bytes** before native index widening, including **27,472 bytes** of new UV1.
- One shared packed map: **65,536 CPU texture bytes** and **65,536 nominal GPU texture bytes**, with no mipmaps.
- Two private material clones; existing source textures stay shared and unchanged.
- No per-frame CPU work or additional groups.
- The numerical audit took approximately342ms with41.84MiB peak RSS. Native construction time and heap are measured by the wrapper; no native performance is claimed yet.

The installed WebGPU backend can widen the two temporary Uint16 indices to Uint32 at first upload. The diagnostic permits only that documented representation change after checking every index value and the retained original array hash. Resource counts and source references remain strict.

## Run on the actual Mac

```sh
node review/lip-edge-material135-native.mjs
```

Default modes:0 and1. Optional unique subset: `LIP135_MODES=0` or `LIP135_MODES=1`. Existing optional environment overrides are `PORTRAIT_URL` and `CHROME_PATH`.

The wrapper requires the live main's literal accepted call:

```js
state.mouthContinuity130=applyMouthContinuity130(anatomicalHead,{strength:1});
```

It injects the study immediately afterward inside cached preparation, and rejects duplicate135 integration. It uses ordinary native WebGPU rendering at900×1200, AA2, with no automatic fallback and no extra `compileAsync` call. The live production display curve and lighting are inherited.

Outputs:

- `output/qa/lip135-{0,1}-{front,detail,left,right,back,nose,nose-quarter}.png`
- `output/qa/lip135-{0,1}-restored-front.png`
- `output/qa/lip-edge-material135-native.json`

The two closeups use the same original123/130 face-UV nose anchor and camera offsets. The wrapper records unchanged lip source/private bytes, exact additional UV1, unrelated material values and source atlas bytes, map packing/sampler state, scene references, browser errors and idle frames. Its finally path restores the accepted full130 geometry/materials, disposes exactly2 private geometries/2 materials/1 shared map in mode1, renders the restored source through the normal path, and closes the browser. It does not export or perform another broad shape audit.

## API

`applyLipEdgeMaterial135(head, { strength, geometry130 })` returns metrics directly. `geometry130` is `state.mouthContinuity130`; it must indicate the accepted full130 result. Mode0 is a no-op. Repeated mode1 on the same head is idempotent. Switching modes requires release or a fresh head.

`releaseLipEdgeMaterial135(head)` restores only the resources owned by135. It preserves the accepted full130 geometry and does not call its release function.

Do not integrate until the root reviews the native A/B images. The visual criterion is reduced outer-lip highlight/boundary while preserving the central wet response and expression. A failed material comparison should leave the accepted geometry-only130 result in place.

## Frozen files

| File | Bytes | SHA256 |
| --- | ---: | --- |
| `review/lip-edge-material-candidate135.js` | 12009 | `bab6c913d8a03cf8138af2c7fd620df30ad9875246f680e006876dd534114558` |
| `review/lip-edge-material135-audit.mjs` | 7390 | `1959c51b6b3905806f87441cc2aed205b53af28919dc7037b6c87f6979cb2cf5` |
| `review/lip-edge-material135-source-audit.json` | 2308 | `56f1eb13d2eaf4f9c6bd9f9d6078a60be1ef4d5112d1aec9221054b7b113bb33` |
| `review/lip-edge-material135-native.mjs` | 26147 | `fb6a64e978c856bf0f381d7e2948183308e47869bba52e5928eeb87ae3199ec4` |
| Existing `review/hair-strand-normal111-integrity.js` | 4175 | `e9025789ce1e5f05ba2961aca223990c729997b2e0f110fc6f3685b6e0f2b8fa` |

The111 file contributes only its generic, previously native-verified attribute representation inspector; no rejected hair material is imported. The full live135-injected main and helper parsed successfully using Node's module parser. Local dependencies are absent, so bundling and rendering remain assigned to the root's actual Mac environment.
