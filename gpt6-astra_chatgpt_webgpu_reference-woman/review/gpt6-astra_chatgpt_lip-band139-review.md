# Lip band ownership review 139

## Decision

Keep the accepted full 130 geometry and original lip material at 77/100 while diagnosing the remaining upper-lip band. None of the 139 diagnostic materials is an artistic candidate. The evidence supports investigating the upper lip's existing relief and its diffuse response; another clearcoat or specular sweep would repeat a question that 139 has resolved.

This review inspected image1 and all twelve matched native images: modes 0, 1, 2 and 3 in ordinary detail, lip closeup and lip quarter view. No production file was changed.

## What the images establish

The narrow curved pale band across the inner-middle upper lip remains in the clearcoat-off images and in the images with both clearcoat and base specular suppressed. It is easiest to see in the frontal closeup and remains recognizable in the quarter view. Removing those two responses makes only a small difference to the surrounding lip finish.

The mapped Basic diagnostic removes the narrow band. It also makes the whole lip body flatter and brighter, particularly the lower lip, so it must not be interpreted as a replacement material or as a quantitative subtraction of individual light components. The source image has softer upper-lip modeling, an irregular central seam, and local lip texture. It does not have a similarly prominent continuous curved stripe across the upper lip.

The parent verified the installed r186 physical material code: for this nonmetallic material, zero specular intensity produces zero F0 and F90. Mode 2 therefore meaningfully removes the base physical specular term. The remaining response includes diffuse illumination, receiver shadows, and the unchanged small emissive atlas contribution. Basic removes diffuse lighting and shadows as well. The images identify a lit-surface artifact; by themselves they do not uniquely separate surface-normal orientation from shadows.

The atlas is not an appropriate first edit. The same actual atlas is present in mode 3 without the narrow stripe. This does not assert that every photographic illumination feature has been removed from the atlas, only that an independently visible atlas stripe does not explain this diagnostic result.

## The relevant current construction

The two lips in `src/face.js` use 100 horizontal subdivisions and only 16 subdivisions from the skin border to the closed seam. Their coordinate `v` is 0 at the skin border and 1 at the seam. Before the accepted pose and Y refinements, their depth is:

```js
z = faceZ(x, y) + .001 + (1 - t*t) * (
  .024 * v*v * (3 - 2*v) + .022 * Math.sin(Math.PI*v)
);
```

The original vertex normals are triangle averages from this actual relief. The initial portrait Y warp, accepted 0.94 lower-face compaction, and accepted 0.06 lip thickness refinement carry those normals through their inverse-transpose transforms. The raised lip materials have no bound bump map; setting their bump scale in reference preparation does not create one. Their source atlas and emissive atlas contribution remain unchanged in the study.

Full 130 replaces only the outer relief at `v < .35`. Its separately reported authored normal weld also fades to zero at `.35`. At this 16-row resolution, rows 6 through 16 (`v >= .375`) retain the pre-130 positions and normals exactly. The seam and fixed corners also remain exact. There is no active 130 boundary-normal correction inside the apparent inner-middle band.

The outer correction can still alter the band's contrast: the full 130 profile rises tangentially from the skin and then catches up to the retained profile. At the center column and `v=.1875`, its relief derivative is 0.114655, compared with the original 0.079405. That steeper outer section faces more upward and creates a darker interval under the current frontal studio light directions, making the unchanged inner bright interval more distinct. This is a geometry/illumination interaction, not evidence of a discontinuous normal row.

## Focused source-only normal check

`review/lip-band139-profile-analysis.json` records a source-only inspection using the established 130 geometry harness through its fixture construction. It executes the actual `makeMouth` source and current full 130 helper, with the accepted preparation transforms. It does not rerun the old broad audit loop, change production normals, or claim native GPU readback.

For comparison only, it independently computes triangle-averaged normals from the resulting positions. It inspects five columns, all 17 rows, and the analytic relief derivatives. The following center-column values are sufficient to identify the relevant lobe:

| Row | v | Authored normal Y | Dot with current key direction | Difference from independently recomputed triangle normal |
| --- | ---: | ---: | ---: | ---: |
| 3 | .1875 | .884948 | .685442 | .977487° |
| 5 | .3125 | .777864 | .772945 | 1.212686° |
| 6 | .3750 | .678618 | .819316 | .464396° |
| 7 | .4375 | .580487 | .845602 | .000346° |
| 8 | .5000 | .427823 | .859287 | .000225° |
| 9 | .5625 | .209815 | .836456 | .000109° |
| 10 | .6250 | -.053557 | .755391 | .000052° |
| 11 | .6875 | -.306473 | .625451 | .000271° |

These dot products describe geometric orientation toward the current key direction, not final pixel intensities. They omit environment convolution, shadows, material evaluation and the nonlinear display transform. Their rise and fall nevertheless give a concrete explanation for a narrow diffuse-facing interval on the inner upper lip. The apparent band location is consistent with that interval by direct visual inspection; an exact native pixel-to-row correspondence has not been asserted.

The central rows agree with independently recomputed finite normals to less than .00035 degrees. Recomputing vertex normals would therefore preserve the inner lobe. The larger outer boundary discrepancy is the previously documented authored weld and coarse finite-mesh boundary slope, not an unexplained error in the central band. Source-only full 130 minimum face clearance remains .0009933101, consistent with the accepted attachment check.

## Bounded next direction

The next useful geometric study would target only the upper lip's excess inner relief, keeping the accepted outer attachment, mouth seam, corners, X/Y coordinates, original UV0 and photo atlas fixed. A small inward reprofile could broaden the roll from the upward-facing lip surface toward the closed seam, with normals transported consistently from the changed surface. Its purpose would be to remove the concentrated lighting lobe while retaining the original mouth outline and expression. It should not be a whole-mouth scale, a new tube, or a free normal smoothing pass.

No exact displacement or support field is frozen here. The 130 boundary and its first derivatives must remain compatible with any later field, and the upper lip must retain its actual clearance above the continuous face. The existing lower lip is outside this proposed scope.

There is one remaining causal qualification before calling the stripe entirely geometry-driven: 139 Basic also bypasses receiver shadows. A single matched closeup of mode 2 with only the upper lip's `receiveShadow` disabled would distinguish a shadow contribution while retaining its actual positions, normals, atlas and diffuse material. This is a focused ownership check, not a lighting or material search. No such additional native run has been performed by this reviewer.

## Native evidence reviewed

The parent-provided `review/lip-band139-native-result.json` records native WebGPU in all four states, 900 × 1200 output, AA2, tone mapping 7 and exposure 1.4. All ten lip geometry attributes/index records and the one shared original atlas remain exact. Original material references restore, the two private materials dispose in each altered state, every restored detail PNG matches its baseline exactly, and every browser error list is empty.

These checks support the diagnostic's isolation. They do not turn a safe geometry or material change into an artistic gain. The accepted portrait score remains 77/100.

## Completed receiver-shadow follow-up

The focused follow-up requested above has now completed. Modes 2 and 4 keep the same physical diffuse response, zero base specular and zero clearcoat; mode 4 changes only the upper lip's `receiveShadow` from true to false. The native report is `review/lip-shadow139-native-result.json`, and both matched closeups were inspected independently.

Both native closeup PNGs have the exact same SHA-256, `d2ca7b09c9e0182f836806b313069476a0e823fe856aec08a8981eca7728a9b1`. Their upper curved band is unchanged. The ten source attribute records and shared atlas remain exact; both states restore the same original detail PNG, with no browser errors. Receiver-shadow suppression therefore makes no pixel difference in this matched diagnostic. This closes the shadow qualification for this framing and source state; it does not make a claim about every possible light or camera.

The next approved study is the single bounded upper-lip relief candidate 140. Its specific profile, analytic normal transport, triangle clearance checks and native on/off handoff are documented in `review/upper-lip-relief140-handoff.md`. No 139 material is adopted, and the score remains 77 pending that separate geometric comparison.
