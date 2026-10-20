import * as THREE from 'three';
import { makePajamaTexture, makePillowTexture } from './textures.js';

export function makeGradientMap(steps = [132, 184, 226, 255]) {
  const data = new Uint8Array(steps);
  const texture = new THREE.DataTexture(data, steps.length, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export function createMaterialLibrary() {
  const gradientMap = makeGradientMap();
  const pajamaSource = makePajamaTexture();
  const pillowTexture = makePillowTexture();

  const pajamaTexture = pajamaSource.clone();
  pajamaTexture.wrapS = THREE.RepeatWrapping;
  pajamaTexture.wrapT = THREE.RepeatWrapping;
  pajamaTexture.repeat.set(1.55, 2.1);
  pajamaTexture.needsUpdate = true;

  const shortsTexture = pajamaSource.clone();
  shortsTexture.wrapS = THREE.RepeatWrapping;
  shortsTexture.wrapT = THREE.RepeatWrapping;
  shortsTexture.repeat.set(1.5, 1.2);
  shortsTexture.needsUpdate = true;

  const mats = {
    skin: new THREE.MeshToonMaterial({
      color: 0xf8c9b7,
      gradientMap,
    }),
    skinShade: new THREE.MeshToonMaterial({
      color: 0xe7a99c,
      gradientMap,
    }),
    lip: new THREE.MeshStandardMaterial({
      color: 0xbb697d,
      roughness: 0.42,
      metalness: 0,
    }),
    eyeWhite: new THREE.MeshPhysicalMaterial({
      color: 0xfdfbff,
      roughness: 0.28,
      metalness: 0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.22,
      side: THREE.DoubleSide,
    }),
    lash: new THREE.MeshBasicMaterial({ color: 0x2b204e, side: THREE.DoubleSide }),
    brow: new THREE.MeshBasicMaterial({ color: 0x4a367a, transparent: true, opacity: 0.86, side: THREE.DoubleSide }),
    pajama: new THREE.MeshToonMaterial({
      color: 0xffffff,
      map: pajamaTexture,
      gradientMap,
    }),
    pajamaShorts: new THREE.MeshToonMaterial({
      color: 0xffffff,
      map: shortsTexture,
      gradientMap,
    }),
    pajamaSolid: new THREE.MeshToonMaterial({
      color: 0x9dd8f6,
      gradientMap,
    }),
    pajamaShade: new THREE.MeshBasicMaterial({
      color: 0x8fc9ea,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    trim: new THREE.MeshToonMaterial({
      color: 0xf7fbff,
      side: THREE.DoubleSide,
      gradientMap,
    }),
    button: new THREE.MeshPhysicalMaterial({
      color: 0xf6fbff,
      roughness: 0.24,
      metalness: 0.08,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
    }),
    hair: new THREE.MeshPhysicalMaterial({
      color: 0x5c45b8,
      roughness: 0.68,
      metalness: 0.01,
      clearcoat: 0.03,
      clearcoatRoughness: 0.7,
      sheen: 0.34,
      sheenColor: new THREE.Color(0xa293f5),
      sheenRoughness: 0.62,
    }),
    hairDeep: new THREE.MeshPhysicalMaterial({
      color: 0x3d2a86,
      roughness: 0.48,
      metalness: 0.02,
      sheen: 0.55,
      sheenColor: new THREE.Color(0x8172dc),
      sheenRoughness: 0.52,
    }),
    hairSheet: new THREE.MeshPhysicalMaterial({
      color: 0x503aa7,
      roughness: 0.7,
      metalness: 0.01,
      clearcoat: 0.02,
      clearcoatRoughness: 0.72,
      sheen: 0.32,
      sheenColor: new THREE.Color(0x9d8cef),
      sheenRoughness: 0.64,
      side: THREE.DoubleSide,
    }),
    hairHighlight: new THREE.MeshBasicMaterial({
      color: 0xc3b8fb,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
    hairShine: new THREE.MeshBasicMaterial({
      color: 0xd8d2ff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
    slipper: new THREE.MeshToonMaterial({
      color: 0xf9faff,
      gradientMap,
    }),
    slipperSole: new THREE.MeshToonMaterial({
      color: 0xc8c9e8,
      gradientMap,
    }),
    bowShade: new THREE.MeshStandardMaterial({
      color: 0xc3cfe6,
      roughness: 0.82,
      metalness: 0,
    }),
    bowPink: new THREE.MeshPhysicalMaterial({
      color: 0xdc6fa0,
      roughness: 0.45,
      metalness: 0,
      clearcoat: 0.3,
      sheen: 0.65,
      sheenColor: new THREE.Color(0xffb8d1),
      sheenRoughness: 0.42,
    }),
    pillow: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: pillowTexture,
      roughness: 0.8,
      metalness: 0,
      clearcoat: 0.05,
      sheen: 1,
      sheenColor: new THREE.Color(0xe0eeff),
      sheenRoughness: 0.72,
    }),
    pillowShade: new THREE.MeshStandardMaterial({ color: 0xbcc9e4, roughness: 0.86 }),
    pillowCrease: new THREE.MeshStandardMaterial({ color: 0xd3dcec, roughness: 0.92 }),
    haloDark: new THREE.MeshPhysicalMaterial({
      color: 0x0c1427,
      roughness: 0.25,
      metalness: 0.86,
      clearcoat: 0.6,
      clearcoatRoughness: 0.18,
      emissive: 0x0c2e48,
      emissiveIntensity: 0.7,
    }),
    haloGlow: new THREE.MeshBasicMaterial({
      color: 0x87edff,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
    haloGlowSoft: new THREE.MeshBasicMaterial({
      color: 0x7adfff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
    petal: new THREE.MeshPhysicalMaterial({
      color: 0xffe6ef,
      roughness: 0.7,
      sheen: 0.8,
      sheenColor: new THREE.Color(0xffcfe0),
      side: THREE.DoubleSide,
    }),
    stage: new THREE.MeshPhysicalMaterial({
      color: 0xe9f5ff,
      roughness: 0.35,
      metalness: 0.1,
      clearcoat: 0.6,
      clearcoatRoughness: 0.35,
    }),
    stageRim: new THREE.MeshPhysicalMaterial({
      color: 0xb9d9f7,
      roughness: 0.24,
      metalness: 0.32,
    }),
    stageGlow: new THREE.MeshBasicMaterial({
      color: 0x75dffb,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
    outline: new THREE.MeshBasicMaterial({
      color: 0x6a5a92,
      side: THREE.BackSide,
    }),
  };

  return mats;
}

export function addOutline(mesh, options = {}) {
  if (options.enabled === false) return mesh;
  const thickness = options.thickness ?? 1.016;
  const color = options.color ?? 0x24213f;
  const outlineMaterial = options.material ?? new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
  });
  const outline = new THREE.Mesh(mesh.geometry, outlineMaterial);
  outline.name = `${mesh.name || 'mesh'}-outline`;
  outline.scale.setScalar(thickness);
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.renderOrder = -1;
  outline.userData.isOutline = true;
  mesh.add(outline);
  return mesh;
}

export function toonify(mesh) {
  if (mesh.material) {
    mesh.material.shadowSide = THREE.FrontSide;
  }
  return mesh;
}
