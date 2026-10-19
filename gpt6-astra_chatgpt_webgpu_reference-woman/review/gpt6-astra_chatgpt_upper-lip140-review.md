# Upper-lip relief review 140

## Decision

**Accept the fixed-on candidate, retaining 77/100.** The upper lip's long narrow bright band is substantially softer in the two closeups and less conspicuous in ordinary face detail. The mouth retains its closed seam, outline, corners, source texture and volume. This is a useful bounded correction to an identified shading/relief artifact; it is not a large overall likeness improvement.

This independent review inspected image1 and all fourteen supplied `review/lip140-{0,1}-{front,detail,left,right,back,lip,lip-quarter}.jpg` images. No new test, Mac call, production edit, material change or source-map change was performed.

## Visual assessment

| Matched view | Fixed-on result |
| --- | --- |
| Front | A small improvement around the upper lip. The change does not alter the apparent mouth placement, closed expression or face outline. The portrait remains otherwise the same. |
| Detail | The thin pale curve across the upper lip is noticeably less prominent. The upper lip reads more like a continuous rounded surface, with the existing source texture still visible. The lower lip and surrounding skin keep their previous response. |
| Left | No objectionable change to the mouth silhouette, seam or projection at this ordinary profile scale. No new separation from the face is visible. |
| Right | Likewise stable mouth outline and expression, with no new pinching, notch or apparent lip/face opening. |
| Back | No visible change. The native PNG hashes for modes 0 and 1 are exactly equal. |
| Lip closeup | The strongest evidence for adoption: the near-continuous pale band in mode 0 is softened into the upper lip's broader tone. The lip keeps a rounded body and fine photographic striations. The dark closure and lower-lip highlight remain. |
| Lip quarter | The improvement survives the changed viewing direction. The baseline's bright curve toward the far corner becomes less artificial while the seam and corners remain in place. There is no apparent new surface ridge or attachment gap. |

Image1 has a softer, more varied upper-lip response without the same conspicuous continuous pale stripe. Mode 1 moves the render toward that appearance while keeping the original photo atlas. It does not flatten the entire lip or remove its wet lower-lip highlight. The original image and the model still differ in broader facial and hair quality, so the overall score remains 77.

The visible benefit is consistent with the prior ownership checks: 139's band persisted after physical specular/clearcoat suppression and after the matched receiver-shadow suppression, but disappeared under the Basic diagnostic. The accepted 140 change addresses the actual relief and carries its existing authored normals through that deformation. This review does not reinterpret the prior Basic mode as a proposed material or a subtraction of light components.

## Native geometry and source results

The corrected native record is `review/upper-lip-relief140-native.json`, 46,150 bytes, SHA-256 `3e202a3ac74b4d8ca0de0433a68ddca9ce473b55de7ec34409cf4a091d7a8b4e`.

It records **15 original attribute/index records**, **3 distinct source images**, **4 original materials** including both front/rear continuous-face slots, and **16 successful integrity checkpoints**. The source geometry and material array/slot identities, source bytes, material properties, texture bindings, image bytes and versions restore as checked. There are no original resource disposals or browser errors. Both mode records are marked Passed for their geometry/source/capture/cleanup stages, and both idle-frame counts are zero.

| Native quantity | Measured result |
| --- | ---: |
| Helper application time | 35.7 ms |
| Fully private upper-lip geometry bytes | 113,948 |
| Changed position / normal vertices | 1,259 / 1,261 |
| Exact protected position-and-normal vertices | 456 |
| Exact local X/Y values | 3,434 / 3,434 |
| Copied protected UV/color/index bytes | 72,740 |
| Maximum sampled inward pull | .00689344621890751 |
| Maximum outward movement | 0 |
| Minimum actual face clearance, before and after | .000992828070697449 |
| Triangle intersection polygons / vertices | 9,673 / 34,942 |
| Projected orientation flips | 0 |
| Minimum triangle area ratio | .7377114837493607 |
| Spatial Jacobian minimum / maximum | 1 / 1 |
| New materials / textures / draw groups | 0 / 0 / 0 |

The private geometry disposes once with zero shared source attribute or array-buffer bindings. Its original full 130 geometry reference restores. The source report's distinction between transported authored normals and independently evaluated finite-triangle geometry remains valid; this art decision does not collapse those into the same normal test.

The native application occurs after the original baseline upload, so its copied Uint32 index accounts for the 113,948-byte allocation. The normal production once-call, before first rendering, constructs a 94,748-byte geometry with a Uint16 index; the first WebGPU upload can widen that index later. The helper's byte metrics describe its construction-time allocation. This timing distinction does not affect its complete buffer ownership or disposal.

## Exact restoration qualification

**The native report's overall status remains Failed because the final complete compositor PNG equality assertion failed. It is not a full strict compositor pass.** The original source restoration and resource checks passed separately.

The decoded comparison of the existing captures is recorded in `review/upper-lip-relief140-restore-pixel-diff.json`, 564 bytes, SHA-256 `7888937ce1e9b94bb8a22e3c8cd7ffa275505a00aa5f42822b85d1e671122d64`.

It finds 3,048 changed pixels and 8,907 changed channels, with a maximum difference of two byte values. All changed pixels lie within x21–120, y1006–1036 of the 796 × 1061 compositor image: the lower-left preview button. Every pixel outside that rectangle is exact. The source portrait therefore has no measured restoration difference outside that UI region.

The UI variation's cause has not been tested. This review does not attribute it to hover, timing, tone mapping or floating-point rendering. The measured location, together with the independent source/resource checks, is sufficient to avoid an unnecessary rerender for this geometric art decision. The strict failure and decoded qualification should remain in the record.

For completeness, the two native back captures share SHA-256 `4fc9841472a598f778c76c6285a00771d8551a5824e4cd34275265fecfae4df9`.

## Handoff

The deformation helper is unchanged at 23,211 bytes, SHA-256 `867c5afca8b31aa80758186f523ff370eb403d3d6fdd326d429e05608e6c2f50`. Root can integrate the approved fixed mode after the existing accepted full 130 call, within cached preparation, using the direct metrics-return API documented in `review/upper-lip-relief140-handoff.md`.

Keep the call at `strength: 1`; that selects the already fixed half-profile blend. This review does not authorize a new depth sweep, extra normal edit, material sweep or atlas alteration. The lifetime remains once per prepared head, with its owned geometry retained across renderer/backend changes. No extra native test is requested by this review.

Root owns production integration of 140 and the independently accepted 141 crown-side correction. The score remains **77/100**.
