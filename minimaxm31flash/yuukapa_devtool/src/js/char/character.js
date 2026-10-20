/**
 * character.js — assembles the whole character and poses it.
 * The pose is described in world-space bone directions and solved
 * into local rotations, so the silhouette matches the reference.
 */
import * as THREE from 'three';
import { buildBody } from './body.js';
import { buildHead, HEAD } from './head.js';
import { buildHair } from './hair.js';
import { buildOutfit } from './outfit.js';
import { makeBow, makeHeadband, makeHalo, makePillow, makeSlipper } from './props.js';

const DOWN = new THREE.Vector3(0, -1, 0);

/** Aim a chain of bones along world-space directions. */
function aimChain(bones, dirs) {
  const parentQ = new THREE.Quaternion();
  for (let i = 0; i < bones.length; i++) {
    const local = dirs[i].clone().applyQuaternion(parentQ.clone().invert()).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(DOWN, local);
    bones[i].quaternion.copy(q);
    parentQ.multiply(q);
  }
}

export function buildCharacter(M) {
  const rig = buildBody(M);

  /* ── head + hair ─────────────────────────────────────────── */
  const head = buildHead(M);
  rig.headPivot.add(head.group);

  const hair = buildHair(M);
  rig.headPivot.add(hair);

  /* ── clothes ─────────────────────────────────────────────── */
  buildOutfit(M, rig);

  /* ── headband + bow ──────────────────────────────────────── */
  const headband = makeHeadband(M);
  rig.headPivot.add(headband);

  const bow = makeBow(M, {
    width: 0.125, height: 0.062, depth: 0.042,
    knot: 0.030, tails: true, tailLen: 0.10, color: M.collar,
  });
  bow.position.set(0, HEAD.center.y + 0.126, -0.016);
  bow.rotation.set(-0.34, 0, 0.03);
  bow.scale.set(1, 1, 1);
  rig.headPivot.add(bow);

  /* ── halo ────────────────────────────────────────────────── */
  const halo = makeHalo(M);
  halo.position.set(0, HEAD.center.y + 0.182, 0);
  halo.rotation.set(0.26, 0, -0.10);
  rig.headPivot.add(halo);

  /* ── pose ────────────────────────────────────────────────── */
  poseCharacter(rig);

  /* ── pillow (held in the left hand) ──────────────────────── */
  const pillow = makePillow(M, { w: 0.165, h: 0.265, d: 0.075, gather: new THREE.Vector3(-0.155, 0.250, 0) });
  pillow.position.set(0.335, 0.618, 0.105);
  pillow.rotation.set(0.16, 0.42, 0.30);
  rig.root.add(pillow);

  /* ── slippers ────────────────────────────────────────────── */
  for (const side of ['L', 'R']) {
    const slipper = makeSlipper(M);
    slipper.name = 'slipper' + side;
    rig.legs[side].ankle.add(slipper);
  }

  return { rig, head, hair, halo, bow, headband, pillow };
}

/* ══════════════════════════════════════════════════════════════
   The pose
   ══════════════════════════════════════════════════════════════ */
function poseCharacter(rig) {
  const v = (x, y, z) => new THREE.Vector3(x, y, z);

  // world positions of the rig joints (the rig itself is never rotated)
  const hipsWorld = v(0, 0.92, 0);
  const chestWorld = hipsWorld.clone().add(rig.chest.position);

  /* ── right arm: raised, hand beside the head ─────────────── */
  const rShoulder = chestWorld.clone().add(rig.arms.R.shoulder.position);
  const rElbow = v(-0.302, 1.276, 0.132);
  const rWrist = v(-0.166, 1.462, 0.098);
  aimChain(
    [rig.arms.R.shoulder, rig.arms.R.elbow, rig.arms.R.wrist],
    [
      rElbow.clone().sub(rShoulder).normalize(),
      rWrist.clone().sub(rElbow).normalize(),
      v(0.10, 0.94, 0.32).normalize(),          // the hand points up
    ]
  );
  // spread the relaxed fingers
  rig.arms.R.wrist.rotation.x += 0.10;

  /* ── left arm: down, holding the pillow ──────────────────── */
  const lShoulder = chestWorld.clone().add(rig.arms.L.shoulder.position);
  const lElbow = v(0.168, 1.072, 0.030);
  const lWrist = v(0.182, 0.845, 0.066);
  aimChain(
    [rig.arms.L.shoulder, rig.arms.L.elbow, rig.arms.L.wrist],
    [
      lElbow.clone().sub(lShoulder).normalize(),
      lWrist.clone().sub(lElbow).normalize(),
      v(0.14, -0.80, 0.58).normalize(),          // the hand grips downwards
    ]
  );

  /* ── legs ────────────────────────────────────────────────── */
  const legDirs = {
    R: { hip: v(-0.066, 0.905, 0), knee: v(-0.074, 0.505, -0.014), ankle: v(-0.070, 0.105, -0.038) },
    L: { hip: v(0.066, 0.905, 0), knee: v(0.060, 0.505, 0.032), ankle: v(0.032, 0.105, 0.014) },
  };
  for (const side of ['L', 'R']) {
    const d = legDirs[side];
    const hipWorld = hipsWorld.clone().add(rig.legs[side].hip.position);
    aimChain(
      [rig.legs[side].hip, rig.legs[side].knee, rig.legs[side].ankle],
      [
        d.knee.clone().sub(hipWorld).normalize(),
        d.ankle.clone().sub(d.knee).normalize(),
        v(0, -0.22, 0.975).normalize(),
      ]
    );
  }

  /* ── head: tilted to her right, chin slightly down ───────── */
  rig.headPivot.rotation.set(0.035, -0.055, 0.125);

  /* ── a touch of spine curve ──────────────────────────────── */
  rig.chest.rotation.set(0.012, 0.02, -0.012);
  rig.hips.rotation.set(0, 0.03, 0.012);
}
