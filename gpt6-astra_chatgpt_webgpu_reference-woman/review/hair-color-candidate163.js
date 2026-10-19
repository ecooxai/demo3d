// Review163 only: defer the exact accepted149 multiplier until the optional
// sixth private material exists. No production helper or material is changed.
const applied = new WeakMap();
const FACTOR = Object.freeze([0.65, 0.69, 0.75]);
const NAMES = Object.freeze([
  'Continuous parted crown with longitudinal fiber flow',
  'Overlapping layered S-wave hair around front back and shoulders',
  'Independent fine crown lengths and silhouette strands',
  'Dense fine bowed brown fringe strands',
  'Sparse short temple edge and hairline wisps',
]);
const NEW_NAME = 'Original ordered crown-to-fringe ribbons163';

export function applyHairColor149(groom) {
  const previous = applied.get(groom);
  if (previous) return previous;
  if (groom?.name !== 'Original reference-directed chestnut layered groom') {
    throw new Error('Hair color149 requires the accepted anatomical groom.');
  }
  const names = groom.getObjectByName(NEW_NAME) ? [...NAMES, NEW_NAME] : NAMES;
  const materials = names.map(name => {
    const mesh = groom.getObjectByName(name);
    if (!mesh?.isMesh || Array.isArray(mesh.material) || !mesh.material?.isMeshPhysicalMaterial) {
      throw new Error('Hair color149 cannot find the original material: ' + name);
    }
    const material = mesh.material;
    if (!material.color.toArray().every(Number.isFinite)) {
      throw new Error('Hair color149 requires finite original diffuse colors.');
    }
    return material;
  });
  if (new Set(materials).size !== names.length) {
    throw new Error('Review163 requires five or six independently owned materials.');
  }
  for (const material of materials) {
    const color = material.color;
    color.setRGB(color.r * FACTOR[0], color.g * FACTOR[1], color.b * FACTOR[2]);
  }
  const result = Object.freeze({
    version: 'uniform-hair-color-149',
    linearDiffuseMultiplier: FACTOR,
    materials: materials.length,
    addedGeometryBytes: 0,
    addedTextureBytes: 0,
    perFrameWork: 0,
    interpretation: 'Visual color preference from image1; not measured albedo.',
  });
  applied.set(groom, result);
  return result;
}
