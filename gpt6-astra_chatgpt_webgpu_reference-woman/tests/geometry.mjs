import test from 'node:test';
import assert from 'node:assert/strict';
import { createHead } from '../src/face.js';
test('portrait anatomy is finite and fully dimensional', () => {
  const head = createHead({ textures: false });
  let triangles=0, meshes=0;
  head.traverse(o=>{
    if(!o.isMesh) return;
    meshes++;
    const p=o.geometry.getAttribute('position');
    assert.ok(p && p.count>2, o.name);
    for(const v of p.array) assert.ok(Number.isFinite(v),o.name+' finite vertices');
    o.geometry.computeBoundingBox();
    triangles+=(o.geometry.index?.count || p.count)/3;
  });
  assert.ok(meshes>=8,'face, both eyes, lips, ears, brows');
  assert.ok(triangles<300000,'head geometry budget');
  assert.ok(head.getObjectByName('continuous-face'),'continuous facial surface');
  assert.ok(head.getObjectByName('left-eye') && head.getObjectByName('right-eye'),'bilateral eyes');
});

test('visible facial and iris normals point outward', () => {
 const head=createHead({textures:false});
 const surface=head.getObjectByName('continuous-face').geometry;
 const p=surface.getAttribute('position'),n=surface.getAttribute('normal');
 let found=0;
 for(let i=0;i<p.count;i++) if(Math.abs(p.getX(i))<.03&&p.getY(i)>.75&&p.getY(i)<1&&p.getZ(i)>.45){assert.ok(n.getZ(i)>.4);found++;}
 assert.ok(found>1,'sampled forehead');
 const iris=head.getObjectByName('brown-iris-and-pupil').geometry;
 const norms=iris.getAttribute('normal');
 for(let i=100;i<norms.count-100;i+=43) assert.ok(norms.getZ(i)>.4,'iris faces the camera');
});
