# Collar158 — isolated cross-page timing harness

Frozen replacement wrapper: `review/collar158-native-timing.mjs` (16,103 bytes), SHA256 `974a4198b76455d80d4425740ec379910d3cd8fb63a170682f2a46cbfecd7b13`.

Run on the root's Mac from the project, with the existing server:

```bash
node review/collar158-native-timing.mjs
```

The result is written separately to `output/qa/collar158-native-timing-result.json`; the bundle and captures also use the separate `collar158-timing` prefix. The original failed result, original wrapper, original39-file manifest, QA module and all hair/cloth geometry are unchanged.

## Exact correction

Only these three measured fields are normalized for the cross-fresh-page protected-signature comparison:

| Owner | JSON metadata leaf |
|---|---|
| `materials[36]` | `referenceCrownMicrocontrast.bakeMs` |
| `materials[36]` | `referenceCrownMicrocontrast.elapsedMs` |
| `textures[0]` | `bakeMs` |

The signature stores metadata as JSON strings. The comparison clones the two affected rows, requires canonical JSON and finite nonnegative timing values, and substitutes a sentinel at exactly these leaves. It records each excluded OFF/ON timing pair in `results[1].crossPageTimingNormalization`. Every other field remains in the exact comparison. Original raw signatures remain in each page's audit, and the frozen QA's per-page material, texture, metadata, buffer and preparation-cache checks are untouched.

All39 original runtime file guards remain verbatim and passed locally. The native report's provenance includes the new wrapper's own computed SHA256, the original wrapper SHA256 and the exclusion list. This is a harness correction; it makes no art, geometry or score claim.

## Targeted validation

`review/collar158-timing-normalization-check.mjs` extracts and executes only the normalization function from the new wrapper. It does not import/run the native wrapper, construct geometry or open a browser. The recorded result is `review/collar158-timing-normalization-check.json`.

The check confirms the three supplied measured timing differences normalize together and individually, raw signatures stay exact, and deeply frozen input is accepted. Ten non-allowlisted differences remain detectable, including neighboring timing metadata, physical material values, texture hashes/samplers, geometry hashes and transforms. Five malformed cases are rejected: missing leaf, string timing, nonfinite serialized value, negative timing and noncanonical metadata text. New wrapper syntax also passes.

No renderer was run. Native158 remains pending; accepted157 stays78/100.
