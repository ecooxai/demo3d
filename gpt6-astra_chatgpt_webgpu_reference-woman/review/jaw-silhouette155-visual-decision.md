# Jaw silhouette 155 — independent visual decision

## Verdict

**Adopt ON as a bounded contour improvement; retain the overall score of 78/100.** This is an independent artistic recommendation, recorded before receiving root's artistic verdict. The mathematical and native checks do not earn a quality point.

I directly viewed the sole `reference/image1.png` and all 14 `jaw-silhouette155-{0,1}-{front,detail,jaw,jaw-oblique,left,right,back}.jpg` images. I also re-viewed the rejected 153 ON front and detail images to compare its specific cheek-pinch failure. No image measurements, new renders, source edits, or contact audit were performed for this decision.

## Visual findings

| Matched view | Independent assessment |
| --- | --- |
| Ordinary front | ON reduces the broad lower-face appearance and brings the cheek-to-chin taper closer to the source photograph. The benefit is visible at ordinary preview size, with the expression retained. |
| Detail | The narrower lower cheeks form a more coherent continuation into the jaw. The change is spread across the contour instead of making the abrupt inward step seen in 153. The far-ear edge becomes slightly more exposed as the face narrows. |
| Jaw | The mouth anchors and closed expression remain visually stable. The under-chin region is still somewhat planar and angular; 155 does not resolve that existing surface/shading limitation. |
| Jaw oblique | The jaw and neck remain visually connected in this view. The slightly more exposed far-ear edge is easier to see here. It does not establish a geometric gap or intersection, and no such claim is made. |
| Left profile | The small lower-face change does not create a meaningful new silhouette or neck-transition problem at the supplied scale. |
| Right profile | No meaningful visual regression is apparent in the supplied view; the existing hair framing remains dominant. |
| Back | No meaningful visible change is apparent. This is a visual observation, not a claim of exact pixel equality. |

The key distinction from rejected 153 is the continuity of the visible transition. Its localized fit produced a conspicuous indentation below each cheek, apparent in both front and detail. 155 retains the intended narrowing while substantially reducing that abrupt notch. Some sculpted cheek/jaw planes remain visible, but they no longer dominate the correction as a pinched deformation.

The source photograph has a softly narrowing lower face. ON moves this aspect in the right direction without visibly shifting the eyes, mouth, or expression. The remaining planar under-chin shading, incomplete ear/hair concealment, and coarse hair construction still limit overall likeness and realism. I therefore recommend a bounded adoption without a whole-scene score increase.

## Native evidence and limits

The actual native report was mirrored and verified locally: `review/jaw-silhouette155-native.json`, **337,654 bytes**, SHA-256 **`e9f57d86ea02ea24d5271a71f516f4e5b0266e95eaa6b057b6877f254da0921a`**.

Root's native OFF/ON comparison passes source and resource checks with 282 original attributes protected, no browser errors, and no idle frames. ON takes 27.9 ms and creates two private geometries containing 7,704,240 replacement bytes before upload. Actual maximum vertex displacement is 0.07144603 world units. The face changes 84,671 triangles and the neck 3,563; neither has a new degeneracy, reversal to its original normal, or opposition to its transported geometric normal. Their minimum area ratios are approximately 0.72030 and 0.75471. Cleanup restores source references, disposes both private geometries, and disposes no originals.

These results establish bounded deformation and ownership behavior. They do not certify discrete clearance against the fixed ear, eye-adjacent surfaces, hair, or clothing. In particular, the extra exposed far-ear edge should remain an explicit observation if root requests a focused interface check before promotion. No formal contact audit is implied by this visual recommendation, and no further test or geometry change is requested here.

Production and all frozen 155 files remain unchanged by this review.
