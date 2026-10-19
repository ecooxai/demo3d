# Lip band ownership diagnostic139

Current accepted scene:133,77/100. This diagnostic changes no production source.

## Question and controlled states

The curved light band across the upper lip remains after the accepted130 geometry improvement and rejected135 edge material map. The four fresh-page states hold the actual133/full130 meshes, photographic atlas, Neutral exposure1.4, lighting, cameras and native900x1200 AA2 output fixed:

| Mode | Lip material change | Purpose |
|---|---|---|
|0|Current Physical material|Baseline|
|1|Clearcoat0 only|Test whole-lip clearcoat, including the core outside135 edge gate|
|2|Clearcoat0 and specularIntensity0|Remove the two added reflective responses|
|3|Basic material with original color/map/UV/coverage/depth/toneMapped settings|View the actual bound color pattern without physical diffuse/reflection/shadow response; diagnostic only|

Every mode captures ordinary detail, a lower-face closeup and a matched quarter closeup. Brightness changes between Physical and Basic do not form an additive decomposition of illumination.

## Root observations

All12 captures were inspected. Modes1 and2 leave the thin curved upper-lip band plainly visible and offer no clear ordinary-detail gain. With map-only mode3 the narrow band disappears, while the lip body becomes flatter and brighter. The source photograph contains soft lip color and lower-lip gloss but no comparable hard upper-lip curve.

These observations localize the remaining band to the lit lip surface response, beyond the tested clearcoat/base specular contribution. They do not establish a source atlas defect or prove whether normal interpolation, geometry curvature, direct diffuse lighting or shadows own it. The next useful work is to trace the actual accepted130 upper-lip surface/normal field before another artistic candidate. Basic mode3 is not adopted.

## Native evidence

All four states used native WebGPU,900x1200, AA2 and Neutral exposure1.4. Each preserved all10 original lip attribute/index arrays and references and the one unique bound texture image exactly. Original material settings/map references stayed intact; clones were restored and disposed without disposing source geometry or maps. Each restored ordinary-detail PNG matched baseline SHA256 cdeb251228e555ac173cdeb1022f2abc5c433301165ec03e435fe631ebd484cd. Browser errors were empty. Sampled heaps were345.332,347.873,339.063 and340.515MiB; these snapshots include diagnostic hashing/renderer allocations rather than a retained-memory census.

Native report: lip-band139-native-result.json. Wrapper: lip-band139-native.mjs. Independent review and geometry/normal ownership diagnosis are recorded in gpt6-astra_chatgpt_lip-band139-review.md and lip-band139-profile-analysis.json. Accepted score remains77/100; no gain is claimed.

## Receiver-shadow continuation

The next two fresh-page native states retain clearcoat0/specularIntensity0 on both lips. Mode2 keeps the original upper-lip receiveShadow=true; mode4 changes only that flag to false before its private material first compiles. Original casting flags, lights, maps and actual geometry remain unchanged. Both lip closeups are byte-identical, SHA256 d2ca7b09c9e0182f836806b313069476a0e823fe856aec08a8981eca7728a9b1, and the narrow curve persists. Both runs restore original receiver flags/materials and match the original detail hash above, with10 protected attributes,1 map and no errors. This rules out received shadows as the cause in this exact matched specular-free view.

Continuation wrapper: lip-band139-shadow-native.mjs. Report: lip-shadow139-native-result.json. Root and independent reviewer retain mode0 at77. A single bounded upper-lip relief geometry study140 is next; no production change has been made.
