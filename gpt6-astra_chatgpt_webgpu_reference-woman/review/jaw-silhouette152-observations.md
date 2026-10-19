# Iteration 152 — visible jaw measurement

Read-only study; accepted production remains149 /78. The goal remains unmet.

The actual native front/detail projections were inspected against manually authored image1 skin bounds. Two actual iris centers establish the photo frame. Complete indexed head triangles, not isolated UV vertices, establish each projected row extremum. Slightly inward geometric rays report the nearest modeled surface. They do not account for hair alpha/cutout/A2C or certify every rendered silhouette pixel.

| Photo Y | Projected head left | Projected head right | Approximate manual left/right | Head nearest at sampled sides |
| --- | ---: | ---: | --- | --- |
|625|325.9994|680.2510|356 /654|Both|
|650|338.9956|660.5962|370 /639|Both|
|675|353.9359|637.5685|387 /623|Both|
|700|370.2890|611.1812|414 /593|Both|
|720|391.0944|587.4292|449 /568|Right; left is behind neck|
|738|420.4550|561.4496|479 /541|Right; left is behind neck|
|750|445.2987|521.5892|502 /515|Right; left is behind neck|

The original chinUV vertex190 projects to approximately(470.4546,753.9969), but neck triangle5760 lies in front of its head triangle188. Its approximately−36.55-pixel horizontal residual from the manual chin point is therefore not a visible chin landmark error. The complete head's lowest projected vertex666 is approximately(476.6439,755.0589), and its inward probe is also neck-nearest. No head triangle crosses row756.

The native overlays show that the lower side silhouette is broader and blunter than the approximate reference bounds. Any candidate must still preserve the smooth anatomical cheek-to-jaw transition. Numeric agreement at the selected rows cannot certify that shape.

All64 original mesh bindings and10 selected head/neck attribute buffers remained exact. Temporary projection arrays totaled27,782,688 bytes; this is QA storage, not added production memory. Front/detail computation took640.8/688.6ms with zero browser errors. The normalized contour results agree between cameras within floating-point rounding.

Canonical native report: `review/jaw-silhouette152-native.json`,86,449 bytes, SHA-256 `3f105d468888d2af3612c9cbd1c08d566b480e1f042c8c047a73a8d577221b3e`. Root viewed both overlays and the sole reference. No geometry, material, map, pose or camera preset was changed by this study.
