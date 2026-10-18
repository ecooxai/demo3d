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

function bowl(u, v, cx, cy, rx, ry) {
  // A shallow floor and a steeper cartilage wall, with a smooth transition.
  const q=((u-cx)/rx)**2+((v-cy)/ry)**2;
  return Math.exp(-Math.pow(q,1.55));
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
  ],.0355,.013,64);
  const antihelix=line([[-.18,-.52],[.04,-.35],[.20,-.06],[.105,.22]],.023,.0117,36);
  const upperBranch=line([[.105,.18],[.38,.40],[.36,.63]],.018,.0105,28);
  const innerBranch=line([[.12,.22],[-.12,.36],[-.42,.36]],.0135,.0105,28);
  const crus=line([[-.65,.50],[-.44,.28],[-.23,.15],[-.40,.04]],.0155,.011,30);
  const ridges=[helix,antihelix,upperBranch,innerBranch,crus];
  const base=new THREE.Color('#e2b3a7');
  const warm=new THREE.Color('#c98b81');
  const rimTint=new THREE.Color('#ecc7b8');
  const lobeTint=new THREE.Color('#e7b2a6');
  const p=[],c=[],indices=[],uv=[];

  function addVertex(u,v,r,front) {
    const x=u*X_RADIUS,y=finalY(v)-Y_CENTER;
    const concha=bowl(u,v,-.29,-.19,.33,.265);
    const cymba=ellipse(u,v,-.36,.24,.29,.17);
    const canal=ellipse(u,v,-.50,-.19,.135,.11);
    const lobe=ellipse(u,v,-.09,-.80,.60,.22);
    // Place the tragus inside the inward notch; a ridge centered on the shared
    // perimeter is flattened to zero by the edge closure and disappears.
    const tragus=ellipse(u,v,-.50,-.02,.14,.11);
    const antiTragus=ellipse(u,v,-.27,-.49,.18,.115);
    const fossa=ellipse(u,v,.02,.50,.24,.18);
    const scapha=ellipse(u,v,.49,.33,.15,.42);
    let ridgeRelief=0;
    for (const ridge of ridges) ridgeRelief+=ridgeAt(x,y,ridge);
    let relief=ridgeRelief-.035*concha-.019*cymba-.009*canal-.010*fossa-.006*scapha;
    relief-=.004*ellipse(u,v,.46,-.27,.17,.25);
    relief+=.021*lobe+.025*tragus+.021*antiTragus;

    // A gentle posterior sweep gives the ear volume when viewed in profile.
    // The front and back share their perimeter; its rounded transition has no
    // separate torus, floating cartilage tubes, or open cut face.
    const plane=.056-.030*u+.010*v;
    const edge=Math.sqrt(Math.max(0,1-r**8));
    const worldY=finalY(v)+offsetY,baseZ=plane+offsetZ;
    // The back follows the cartilage's actual form. A positive wall thickness
    // prevents a deepened bowl from crossing a formerly flat back surface.
    const thickness=.027+.015*lobe+.004*clamp(ridgeRelief/.036,0,1);
    const depth=.009+relief-(front?0:thickness);
    p.push(s*(.792+x)+offsetX,worldY,baseZ+edge*depth);
    const color=base.clone();
    const interior=.13*concha+.09*canal+.06*cymba+.025*fossa;
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
    attachment:'The original ear placement and perimeter are retained. Both cartilage surfaces remain single-valued over the same closed outline.',
    triangles:indices.length/3
  };
  return group;
}
