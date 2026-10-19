# Candidate129: bury the replacement roots and separate fine ends

Status: frozen for native off/on review. Current accepted quality remains77/100. Frozen124 remains rejected at approximately74/100; its source, wrapper and audit are unchanged. Production source is unchanged.

## Frozen files

| File | Bytes | SHA256 |
|---|---:|---|
| `review/hair-groom-candidate129.js` |53,138 | `4ec7b74cf3ddd660cb29bf9f398889baf62ef7c7276f2b1b77b5153635698aad` |
| `review/crown129-native.mjs` |4,948 | `1ae8daecee25f10ede8345f1439368b78c28c12a19969714a1640f1b08af84ce` |
| `review/crown129-audit.mjs` |8,811 | `278ae474e90bfd1243f9c2577ca835c6123efcf9db847574bb7e1648cab38e6c` |
| `review/crown129-audit.json` |18,777 | `dd8c2ccdc10f6932cd20b7e884ae099ce8eab16a823487499d899d03c10a8680` |

The review build script `review/crown129-build.mjs` starts from the exact frozen124 SHA and makes only the intended repair. Do not rebuild the source during native review.

```js
createGroomHair({
  headShiftX: .26,
  shoulderContact: .35,
  guidePlacement: .5,
  crownPatch129: 0 // or1; a binary structural replacement
});
```

## Changes from rejected124

The dense replacement roots now remain hidden while accepted crown coverage is high. A small192×208 field samples the actual front-facing CROWN triangle positions, vertex alpha and original procedural coverage map. It excludes the inset foundation and rear crown. A sixteen-sample cubic B-spline lookup supplies a smooth retention value and depth.

Both new support and new fine geometry receive the same nearby-only inward deformation. Its base offset rises smoothly to.035 as retained coverage rises from.12 to.88. A proximity gate releases it between.055 and.095 distance from the supporting cap, preventing a free forehead bow from being attracted to a remote surface at the same projected XY. The inward direction preserves every authored Y coordinate. Near strongly retained roots, a depth constraint puts the new forward face behind the sampled cap. The largest combined measured displacement is.08275.

The dense support has its own RGBA vertex alpha. It is fully suppressed where retained coverage is at least.75 and smoothly becomes available below.22. The mask is evaluated at both the original and moved positions. This prevents a shifted support edge from reappearing over retained hair. It uses the existing matte material response; no optical sweep or125 shader is added.

Twenty-four root families still supply continuity, but only five forehead families are dominant: three left and two right. The remaining foreground families have sparse companions. The total replacement fine strand count is1,322. Fine lane spread no longer collapses with the support tube's taper, and individual strands have longer, unequal ends. The accepted falling XY controls remain unchanged.

## Source measurements

| Measure | Result |
|---|---:|
| Hair triangles |1,056,592 |
| Change from accepted118 baseline |−5.23% |
| Geometry memory |50.93MiB |
| Source construction |4.678s |
| Support vertices moved |5,282 |
| Support vertices alpha-masked |5,306 |
| Fine vertices moved |50,048 |
| Maximum combined inward displacement |.08275 |
| Retention-field storage |638,976 bytes |
| Nonfinite geometry values |0 |

Disabled129 is byte-identical to the accepted118 source at placement.5/contact.35. MASS is exact, as are the protected DETAIL prefix/suffix, all DETAIL UV/color/index, and the94 far-temple layer. CROWN position/normal/index/UV0/RGB remain exact. The deliberate forward CROWN alpha withdrawal is unchanged from124, affecting4,904 vertex-alpha values.

The original24 family center paths have no exposed upward steps. The emitted fine geometry, after gravity/frame placement, has one sampled upward step above the.003 diagnostic threshold; its magnitude is.00457. This is reported rather than described as a universal zero-reversal guarantee. The root burial itself preserves rawY exactly.

The three-build source audit took14.51s and peaked at545.18MiB RSS. Those figures are not native GPU performance. For comparison, root measured rejected124's native construction at1826.5ms off and1898.3ms on despite its much slower source-harness timing.

## Actual-triangle audit limits

The audit makes43,626 fine-center queries against the actual posed CROWN triangles. It still finds591 fine-center samples in front of strongly retained cap at projected overlap/side regions and28 support vertices with alpha above.05 in front of such a cap. These include free foreground/temple overlap and boundaries of the filtered field; the source result does not certify every view-dependent edge as hidden.

The field's targeted strong-retention samples have at least.009 depth clearance against their sampled cap. That is a narrower claim than the actual-triangle audit above. No exhaustive filtered-alpha, scalp-support or glTF coverage certification is claimed before the rendered art decision.

## Native comparison

`review/crown129-native.mjs` uses the current main and dependencies, including accepted Neutral1.4,118 placement.5 and86 contact.35. It adds only the129 flag and review groom source. It captures off/on front, detail, left, right, back and a junction close-up. It adds neither116 color,119 part deformation nor125 shader.

The visible gate is removal of124's matte upper plates and stepped glossy islands while retaining coherent root density, natural long bowed foreground groups and the accepted profile/ear/lower shape. A successful native build alone does not raise77/100 or justify integration.104's coverage characterization remains deferred until a visual gain is demonstrated.
