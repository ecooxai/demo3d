# Candidate 142 — immutable native visual decision

**Decision: reject ON. Retain accepted 133 hair within production 141 at 77/100.**

The root reviewer scored ON **75/100**; the independent hair reviewer scored ON **76/100**. These are qualified subjective art judgments against the same accepted 77 baseline, not measured accuracy percentages. Both reviewers reject integration. The candidate and native report remain frozen; no export or intermediate-strength sweep is warranted.

## Evidence reviewed

The independent reviewer inspected the sole original `reference/image1.png`, then all twelve unique native captures in `review/crown142-{0,1}-{front,detail,left,right,back,junction}.jpg`. Ordinary front and detail views were assessed before the junction closeup. The paired run uses accepted main 141, including the same 140 upper-lip correction and 141 CROWN facing settings in both modes.

The front/detail ON result replaces the old pointed return with a darker, flatter bank immediately left of the part. At the 796 × 1061 detail preview, its most conspicuous region is approximately x430–545, y180–230. This makes the forehead opening squarer. The junction reveals a crimped/chevron pattern above that bank, small repeated teeth along its left release, and a strong near-vertical sheet edge on the right. The broad cap remains visible. The photographed hair instead has continuous overlapping root flow that narrows and separates at unequal positions.

Both profiles retain coverage, without an obvious new large loop or major silhouette regression. The back is visually unchanged. The independent reviewer found no major new hole or long-bow regression. This is a localized failure of the intended crown-to-fringe art improvement, rather than a nonfinite or topology failure.

The exact pole closure is a real source change, but it does not establish visual success. Its rendered replacement still reads as an opaque cap with a folded-looking join. Surface shape, texture compression and fine orientation require a separate read-only diagnosis before another construction is proposed.

## Native verification

Source: `review/crown142-native-report.json`, Mac native run 1638.

| Check | OFF | ON |
|---|---:|---:|
| Native WebGPU | true | true |
| Construction | 2408.0 ms | 2525.1 ms |
| Hair triangles | 1,114,888 | 1,114,888 |
| Geometry | 52.49 MiB | 52.49 MiB |
| Nonfinite attributes | 0 | 0 |
| Captured errors | none | none |
| Strict restored-detail PNG equality | true | true |

The construction increase is 117.1 ms, approximately 4.9%, in this paired run. The back PNG hash is exactly equal between OFF and ON. Both modes render internally at 1800 × 2400 for the 900 × 1200 output. These checks support a valid controlled comparison; they do not compensate for the visual regression.

## Scope retained

Keep `review/crown-chart-candidate142.js`, `review/hair-groom-candidate142.js`, `review/crown142-native.mjs`, their source audit and all native captures unchanged. The subsequent iteration 146 is a read-only proposal that may reconsider the formerly exact upper-fringe root prefixes; it does not retroactively change this decision or the candidate.
