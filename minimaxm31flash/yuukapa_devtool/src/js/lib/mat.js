/**
 * mat.js — the material library.
 * Cel-shaded surfaces use a 4-step toon ramp; a thin additive
 * fresnel shell provides the anime rim light.
 */
import * as THREE from 'three';
import {
  normalWorld, positionWorld, cameraPosition,
  normalize, dot, pow, float, vec3, vec4, oneMinus, abs, color, positionLocal, normalLocal,
} from 'three/tsl';
import {
  makeToonRamp, makeFaceTexture, makePajamaTexture,
  makeFabricTexture, makePillowTexture, makeGlowTexture,
} from './tex.js';

export const PALETTE = {
  skin: 0xf7d6cc,
  skinShadow: 0xf6c9c0,
  hairRoot: 0x3b3168,
  hairMid: 0x50428a,
  hairTip: 0x7a68b8,
  hairSheen: 0xb9a9f0,
  fabric: 0xeaf7fd,
  cloth: 0xf8fcff,
  pillow: 0xf4f9ff,
  pink: 0xd9538f,
  pinkDeep: 0xb93a72,
  haloRing: 0x25262e,
  haloGlow: 0x59d8ff,
  outline: 0x2a2144,
  eye: 0x6f4bcf,
};

export function createMaterials() {
  const ramp = makeToonRamp([0.50, 0.70, 0.86, 1.0]);
  const softRamp = makeToonRamp([0.64, 0.78, 0.90, 1.0]);
  const hairRamp = makeToonRamp([0.42, 0.62, 0.82, 1.0]);

  const pajamaMap = makePajamaTexture();
  pajamaMap.repeat.set(2.6, 2.6);
  const pillowMap = makePillowTexture();
  const fabricMap = makeFabricTexture();
  const faceMap = makeFaceTexture();
  const glowMap = makeGlowTexture('rgba(120,220,255,0.9)');

  const toon = (params) => new THREE.MeshToonMaterial({ gradientMap: ramp, ...params });

  const M = {
    ramp, softRamp, hairRamp, faceMap,

    skin: toon({ color: PALETTE.skin }),
    skinSoft: toon({ color: 0xf9ded5, gradientMap: softRamp }),
    innerEar: toon({ color: 0xf7cfc6 }),

    hair: toon({ color: 0xffffff, gradientMap: hairRamp, vertexColors: true }),
    hairSheen: toon({ color: 0xffffff, gradientMap: hairRamp, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false }),

    pajama: toon({ color: 0xffffff, map: pajamaMap }),
    pajamaPlain: toon({ color: 0xd6ecf6 }),
    pajamaTrim: toon({ color: 0xfdfeff }),
    scallop: toon({ color: 0xa9c7d8, gradientMap: softRamp }),
    collar: toon({ color: 0xfdfeff, gradientMap: softRamp }),
    button: new THREE.MeshPhysicalMaterial({ color: 0xfffaf4, roughness: 0.28, metalness: 0.0, sheen: 0.6, sheenColor: new THREE.Color(0xffe6d8) }),

    pillow: toon({ color: 0xffffff, map: pillowMap, gradientMap: softRamp }),
    cloth: toon({ color: PALETTE.cloth, gradientMap: softRamp, map: fabricMap }),
    slipper: toon({ color: 0xfdffff, gradientMap: softRamp }),
    slipperSole: toon({ color: 0xc3d2e4 }),
    pink: toon({ color: PALETTE.pink, gradientMap: softRamp }),

    haloRing: toon({ color: PALETTE.haloRing, gradientMap: softRamp }),
    haloGlow: new THREE.MeshBasicMaterial({ color: PALETTE.haloGlow, transparent: true, opacity: 0.95, toneMapped: false }),

    eye: new THREE.MeshToonMaterial({
      map: faceMap, color: 0xffffff, gradientMap: softRamp,
      transparent: true, alphaTest: 0.012,
      depthWrite: true, side: THREE.FrontSide, toneMapped: false,
    }),

    ground: new THREE.MeshStandardMaterial({ color: 0xdfeef8, roughness: 0.95, metalness: 0 }),
  };

  /* ── rim-light shells (additive fresnel) ── */
  const rimNode = (colorHex, strength, power) => {
    const viewDir = normalize(cameraPosition.sub(positionWorld));
    const ndv = abs(dot(viewDir, normalWorld));
    const f = pow(oneMinus(ndv), float(power));
    return color(colorHex).mul(f).mul(float(strength));
  };

  M.rimBody = new THREE.MeshBasicNodeMaterial();
  M.rimBody.colorNode = rimNode(0xbfe9ff, 0.30, 4.2);
  M.rimBody.transparent = true;
  M.rimBody.blending = THREE.AdditiveBlending;
  M.rimBody.depthWrite = false;
  M.rimBody.side = THREE.FrontSide;
  M.rimBody.toneMapped = false;
  M.rimBody.polygonOffset = true;
  M.rimBody.polygonOffsetFactor = -2;
  M.rimBody.polygonOffsetUnits = -2;

  M.rimHair = new THREE.MeshBasicNodeMaterial();
  M.rimHair.colorNode = rimNode(0xb9a4ff, 0.13, 5.0);
  M.rimHair.transparent = true;
  M.rimHair.blending = THREE.AdditiveBlending;
  M.rimHair.depthWrite = false;
  M.rimHair.side = THREE.FrontSide;
  M.rimHair.toneMapped = false;
  M.rimHair.polygonOffset = true;
  M.rimHair.polygonOffsetFactor = -2;
  M.rimHair.polygonOffsetUnits = -2;

  M.rimWarm = new THREE.MeshBasicNodeMaterial();
  M.rimWarm.colorNode = rimNode(0xfff0d8, 0.26, 4.2);
  M.rimWarm.transparent = true;
  M.rimWarm.blending = THREE.AdditiveBlending;
  M.rimWarm.depthWrite = false;
  M.rimWarm.side = THREE.FrontSide;
  M.rimWarm.toneMapped = false;
  M.rimWarm.polygonOffset = true;
  M.rimWarm.polygonOffsetFactor = -2;
  M.rimWarm.polygonOffsetUnits = -2;

  M.glowMap = glowMap;

  /* ── inverted-hull ink outlines ─────────────────────────── */
  const hull = () => {
    const m = new THREE.MeshBasicNodeMaterial();
    m.side = THREE.BackSide;
    m.toneMapped = false;
    m.colorNode = vec4(color(0x241b42), 1.0);
    m.polygonOffset = true;
    m.polygonOffsetFactor = 1;
    m.polygonOffsetUnits = 1;
    return m;
  };
  M.outlineBody = hull();
  M.outlineHair = hull();
  M.outlineSoft = hull();

  return M;
}

/**
 * Attach an inverted-hull outline shell to a mesh.
 * The shell geometry is expanded along the vertex normals on the CPU,
 * which keeps the ink line crisp and free of z-fighting.
 */
export function addOutline(mesh, material, thickness = 0.0022) {
  const src = mesh.geometry;
  const g = src.clone();
  const pos = g.attributes.position;
  const nor = src.attributes.normal;
  if (nor) {
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        pos.getX(i) + nor.getX(i) * thickness,
        pos.getY(i) + nor.getY(i) * thickness,
        pos.getZ(i) + nor.getZ(i) * thickness
      );
    }
    pos.needsUpdate = true;
  }
  const shell = new THREE.Mesh(g, material);
  shell.name = 'outline';
  shell.castShadow = false;
  shell.receiveShadow = false;
  shell.renderOrder = -1;
  mesh.add(shell);
  return shell;
}

/**
 * Attach a rim-light shell to a mesh (same geometry, additive fresnel).
 */
export function addRim(mesh, material, strength = 1) {
  const shell = new THREE.Mesh(mesh.geometry, material);
  shell.name = 'rim';
  shell.castShadow = false;
  shell.receiveShadow = false;
  shell.renderOrder = 4;
  shell.userData.rimStrength = strength;
  mesh.add(shell);
  return shell;
}
