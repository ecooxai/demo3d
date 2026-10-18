import * as THREE from 'three';

// Original ear sculpture. Coordinates are already in the final, portrait-warped
// head space: add after refineProportions(), with no extra group transforms.
// The sole supplied portrait is the visual reference; no image maps are used.
const clamp = THREE.MathUtils.clamp;
const smooth = t => { t = clamp(t, 0, 1); return t*t*(3-2*t); };
const X_RADIUS = .128;
const Y_RADIUS = .29554290750644;
const Y_CENTER = -.15086151548356;
const Y_BOW = -.00557799168204;

function finalY(v) {
  return Y_CENTER + Y_RADIUS*v + Y_BOW*(1-v*v);
}

function planar(u, v) {
  return new THREE.Vector3(u*X_RADIUS, finalY(v)-Y_CENTER, 0);
}

function line(points, height, width, steps = 40) {
  const spline = new THREE.CatmullRomCurve3(
    points.map(p => planar(p[0], p[1])), false, 'centripetal', .5
  );
  const samples = spline.getSpacedPoints(steps);
  return { samples, height, width };
}

function ridgeAt(x, y, ridge) {
  let nearest = Infinity, along = 0;
  const p = ridge.samples;
  for (let i = 0; i < p.length-1; i++) {
    const a = p[i], b = p[i+1], dx = b.x-a.x, dy = b.y-a.y;
    const t = clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy), 0, 1);
    const ex = x-a.x-t*dx, ey = y-a.y-t*dy, d = ex*ex+ey*ey;
    if (d < nearest) { nearest = d; along = (i+t)/(p.length-1); }
  }
  const fade = smooth(along/.09)*smooth((1-along)/.14);
  const width = ridge.width*(.86+.14*Math.sin(along*Math.PI));
  const variation = .85+.15*Math.sin(along*Math.PI*.94);
  return ridge.height*fade*variation*Math.exp(-nearest/(width*width));
}

function ellipse(u, v, cx, cy, rx, ry) {
  return Math.exp(-(((u-cx)/rx)**2+((v-cy)/ry)**2));
}

function outline(count) {
  // An asymmetric outline: fuller upper cartilage, an attached inward edge,
  // and a soft lower lobe. The helix is deliberately not a concentric ring.
  const points = [
    [-.80,.82],[-.20,1],[.55,.91],[.91,.62],[1,.20],
    [.86,-.36],[.61,-.78],[.12,-1],[-.38,-.93],[-.72,-.68],
    [-.81,-.41],[-.61,-.19],[-.90,.05],[-1,.33],[-.98,.61]
  ];
  const curve = new THREE.CatmullRomCurve3(
    points.map(([u,v]) => new THREE.Vector3(u*X_RADIUS,v*Y_RADIUS,0)),
    true, 'centripetal', .5
  );
  const samples = curve.getSpacedPoints(count).slice(0,count);
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for (const p of samples) {
    minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);
    minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
  }
  return samples.map(p => [2*(p.x-minX)/(maxX-minX)-1,2*(p.y-minY)/(maxY-minY)-1]);
}

function materialFor(skinMaterial) {
  const mat = skinMaterial?.clone ? skinMaterial.clone() : new THREE.MeshPhysicalMaterial();
  mat.name = 'ear-original-cartilage-skin';
  mat.color.set('#ffffff');
  mat.vertexColors = true;
  // Ear UVs are independent from the photograph-derived facial atlas.
  for (const key of ['map','normalMap','bumpMap','roughnessMap','metalnessMap','alphaMap','emissiveMap','aoMap','displacementMap']) mat[key]=null;
  mat.metalness=0;mat.roughness=.57;mat.specularIntensity=.23;
  mat.clearcoat=0;mat.transmission=0;mat.sheen=.025;
  if (mat.sheenColor) mat.sheenColor.set('#e8b6aa');
  if (mat.emissive) mat.emissive.set('#000000');
  mat.emissiveIntensity=0;
  mat.transparent=false;mat.opacity=1;mat.depthWrite=true;mat.side=THREE.FrontSide;
  mat.needsUpdate=true;
  return mat;
}

export function createEar(side, skinMaterial) {
  const s=side<0?-1:1;
  const group=new THREE.Group();group.name=s<0?'left-ear':'right-ear';
  const offsetX=s<0?-.045:0,offsetY=s<0?.13:0,offsetZ=s<0?.16:0;
  const angular=96,radial=28,boundary=outline(angular);
  const helix=line([
    [-.68,.46],[-.68,.72],[-.19,.90],[.40,.83],
    [.72,.55],[.82,.15],[.65,-.30],[.34,-.66],[-.07,-.84]
  ],.041,.0175,64);
  const antihelix=line([[-.19,-.62],[.065,-.36],[.21,-.065],[.115,.22]],.021,.014,36);
  const upperBranch=line([[.115,.20],[.34,.40],[.36,.62]],.018,.012,28);
  const innerBranch=line([[.12,.23],[-.13,.33],[-.40,.35]],.013,.012,28);
  const crus=line([[-.65,.53],[-.46,.31],[-.31,.16],[-.42,.07]],.015,.013,30);
  const ridges=[helix,antihelix,upperBranch,innerBranch,crus];
  const base=new THREE.Color('#e2b3a7');
  const warm=new THREE.Color('#c98b81');
  const rimTint=new THREE.Color('#ecc7b8');
  const lobeTint=new THREE.Color('#e7b2a6');
  const p=[],c=[],indices=[],uv=[];

  function addVertex(u,v,r,front) {
    const x=u*X_RADIUS,y=finalY(v)-Y_CENTER;
    const concha=ellipse(u,v,-.25,-.14,.38,.24);
    const canal=ellipse(u,v,-.49,-.18,.17,.13);
    const lobe=ellipse(u,v,-.09,-.79,.62,.25);
    const tragus=ellipse(u,v,-.67,-.14,.17,.11);
    const antiTragus=ellipse(u,v,-.24,-.50,.21,.10);
    const fossa=ellipse(u,v,-.08,.48,.25,.18);
    let relief=-.023*concha-.005*canal-.008*fossa;
    for (const ridge of ridges) relief+=ridgeAt(x,y,ridge);
    relief+=.019*lobe+.026*tragus+.016*antiTragus;

    // A gentle posterior sweep gives the ear volume when viewed in profile.
    // The front and back share their perimeter; its rounded transition has no
    // separate torus, floating cartilage tubes, or open cut face.
    const plane=.056-.030*u+.010*v;
    const edge=Math.sqrt(Math.max(0,1-r**8));
    const z=front?plane+edge*(.009+relief):plane-edge*(.037+.007*lobe);
    p.push(s*(.792+x)+offsetX,finalY(v)+offsetY,z+offsetZ);
    const color=base.clone();
    const interior=.13*concha+.09*canal+.025*fossa;
    color.lerp(warm,front?interior:.045);
    color.lerp(rimTint,front?.11*clamp(relief/.044,0,1):.035);
    color.lerp(lobeTint,.20*lobe);
    // Very low amplitude pigment variation, not extra pore or bump noise.
    color.offsetHSL(0,0,.0015*Math.sin(u*19+v*7)*Math.sin(v*27-u*8));
    c.push(color.r,color.g,color.b);uv.push((u+1)/2,(v+1)/2);
    return p.length/3-1;
  }

  function triangle(a,b,d,front) {
    // The authored outline is clockwise; mirror winding for the opposite ear.
    if ((s>0)===front) indices.push(a,d,b);
    else indices.push(a,b,d);
  }

  function surface(front,sharedBoundary) {
    const centerU=-.10,centerV=-.07;
    const center=addVertex(centerU,centerV,0,front),rings=[];
    for (let j=1;j<=radial;j++) {
      if (j===radial&&sharedBoundary) { rings.push(sharedBoundary);continue; }
      const r=j/radial,ring=[];
      for (let i=0;i<angular;i++) {
        const [u,v]=boundary[i];
        ring.push(addVertex(centerU+(u-centerU)*r,centerV+(v-centerV)*r,r,front));
      }
      rings.push(ring);
    }
    for(let i=0;i<angular;i++)triangle(center,rings[0][i],rings[0][(i+1)%angular],front);
    for(let j=1;j<radial;j++)for(let i=0;i<angular;i++) {
      const next=(i+1)%angular,a=rings[j-1][i],b=rings[j][i],d=rings[j][next],e=rings[j-1][next];
      triangle(a,b,d,front);triangle(a,d,e,front);
    }
    return rings[radial-1];
  }

  const perimeter=surface(true);surface(false,perimeter);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const ear=new THREE.Mesh(geometry,materialFor(skinMaterial));
  ear.name='ear-continuous-anatomical-shell';ear.castShadow=true;ear.receiveShadow=true;
  group.add(ear);
  group.userData={
    source:'Original closed ear geometry and pigment colors, visually based only on image 1.',
    coordinateSpace:'Final head-local coordinates; add after refineProportions, without additional ear group offsets.',
    triangles:indices.length/3
  };
  return group;
}
