# Lip material135 native art review

Reviewer: GPT-6 Astra / ChatGPT, independent local visual review.

## Decision

**Keep mode 0: accepted full-strength130 geometry with the original lip material. Do not integrate135.** Overall quality remains **77/100**. Mode 1 is technically sound and introduces no clear visual regression, but its artistic improvement is too slight to justify retaining the additional material field and UV1.

I inspected all 14 matched native images in `lip135-{0,1}-{front,detail,left,right,back,nose,nose-quarter}.jpg` against the uploaded `reference/image1.png` and the accepted geometry-only130 baseline. No new renders, Mac calls, production edits or export checks were performed for this review.

## Visual findings

| Matched view | Finding |
| --- | --- |
| Nose | The thin curved pale band on the upper vermilion remains conspicuous in both modes. The lower-lip transition retains the improvement already obtained from full130 geometry. Any further response softening in1 is faint. |
| Nose-quarter | Mode1 slightly restrains the outer upper-lip response, but the curved contour remains discernible. The change is much smaller than130's geometric improvement to the lower border. |
| Front | No convincing improvement to expression, likeness or the mouth-to-face relationship at the ordinary portrait size. |
| Detail | The lips retain their original color, closure and central highlights. The residual upper highlight remains visible; the material change does not make a clear enough improvement to the patch transition. |
| Left | Lip projection and facial profile remain stable. No useful additional appearance change at the supplied scale. |
| Right | Same conclusion: stable profile and no distinct new defect or material benefit. |
| Back | No visible change, consistent with the study's bounded scope. |

Image1 has a soft transition into the surrounding skin, with restrained wet highlights concentrated within the lips. The accepted130 geometry moves the lower boundary toward that relationship. Candidate135 preserves those central highlights, but does not resolve the remaining curved upper band or establish a convincing additional likeness gain.

The result supports retaining the current geometry-only repair. It does not establish that material continuity can never matter, or identify a unique cause for the residual highlight. This specific outer roughness/clearcoat field has insufficient visible benefit in the supplied native views.

## Technical evidence is separate from the art decision

The root reports that native Mac run1459 completed both modes successfully: native WebGPU, browser errors `[]`, approximately 1.4 ms helper construction, exact source attributes, idle frames 0, and correct private disposal/source restoration. The numerical study had already quantified the RGBA8 central roughness bias of +0.00062745098 and the bounded interpolation errors. There is no observed technical failure behind this rejection.

The experiment's fixed costs are one 65,536-byte packed map, two material clones and two fully private geometry copies totalling 216,968 bytes before native index widening, including 27,472 bytes of UV1. Those costs are small, but a successful implementation alone is not a reason to retain an appearance change that does not deliver a clear benefit.

Leave135 frozen as review history. The accepted scene remains full130 geometry, hidden crease tube, original lip material and overall77. No135 export audit or further material changes are warranted by this result.
