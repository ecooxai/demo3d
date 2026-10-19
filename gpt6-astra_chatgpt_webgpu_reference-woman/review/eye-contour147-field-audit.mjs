import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createEyeContourField147} from './eye-contour147-field.js';
const config=JSON.parse(fs.readFileSync('review/eye-contour147-config.json','utf8')),field=createEyeContourField147(config),start=performance.now();
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('src/main.js')).digest('hex'),config.baseMainSHA256);
let maximumControlError=0,maximumFiniteDifferenceError=0,minimumDeterminant=Infinity,maximumDisplacement=0,maximumGradientNorm=0,maximumRawGradientNorm=0,maximumLowerFadeRawDisplacement=0,nonfinite=0,samples=0;
for(const c of config.controls){const f=field.photo(...c.at);maximumControlError=Math.max(maximumControlError,Math.hypot(f.delta[0]-c.delta[0],f.delta[1]-c.delta[1]));}
const R=config.radiusPhotoPixels,minX=Math.min(...config.controls.map(c=>c.at[0]))-R,maxX=Math.max(...config.controls.map(c=>c.at[0]))+R,minY=Math.min(...config.controls.map(c=>c.at[1]))-R,maxY=Math.max(...config.controls.map(c=>c.at[1]))+R,step=.25;
function spectral(g){const [a,b,c,d]=g,s=a*a+b*b+c*c+d*d,det=(a*d-b*c)**2;return Math.sqrt((s+Math.sqrt(Math.max(0,s*s-4*det)))/2);}
for(let y=minY;y<=maxY+step;y+=step)for(let x=minX;x<=maxX+step;x+=step){
 const raw=field.rawPhoto(x,y),f=field.photo(x,y);samples++;for(const v of [...f.delta,...f.gradient,f.determinant])if(!Number.isFinite(v))nonfinite++;
 minimumDeterminant=Math.min(minimumDeterminant,f.determinant);maximumDisplacement=Math.max(maximumDisplacement,Math.hypot(...f.delta));maximumGradientNorm=Math.max(maximumGradientNorm,spectral(f.gradient));maximumRawGradientNorm=Math.max(maximumRawGradientNorm,spectral(raw.gradient));
 if(y>=config.lowerFadePhotoY[0]-step&&y<=config.lowerFadePhotoY[1]+step)maximumLowerFadeRawDisplacement=Math.max(maximumLowerFadeRawDisplacement,Math.hypot(...raw.delta));
}
for(const c of config.controls)for(const d of [[0,0],[7.3,-11.7],[-19.1,5.8]]){
  const x=c.at[0]+d[0],y=c.at[1]+d[1],h=.0001,f=field.photo(x,y),xp=field.photo(x+h,y).delta,xm=field.photo(x-h,y).delta,yp=field.photo(x,y+h).delta,ym=field.photo(x,y-h).delta;
  const finite=[(xp[0]-xm[0])/(2*h),(yp[0]-ym[0])/(2*h),(xp[1]-xm[1])/(2*h),(yp[1]-ym[1])/(2*h)];
  maximumFiniteDifferenceError=Math.max(maximumFiniteDifferenceError,...finite.map((v,i)=>Math.abs(v-f.gradient[i])));
}
let maximumWorldDerivativeError=0;
for(const c of config.controls)for(const z of [.09,.16,.24,.36,.65]){
 const [x,y]=c.world,h=.000001,f=field.world(x,y,z);for(let a=0;a<3;a++){const p=[x,y,z],m=[x,y,z];p[a]+=h;m[a]-=h;const fp=field.world(...p).delta,fm=field.world(...m).delta;for(let row=0;row<3;row++){const value=(fp[row]-fm[row])/(2*h)+(row===a?1:0);maximumWorldDerivativeError=Math.max(maximumWorldDerivativeError,Math.abs(value-f.jacobian[row*3+a]));}}
}
// Every support point is at most step/2 away in each axis from a sampled
// vertex. Each gradient entry changes by at most H_i*step; the Frobenius
// matrix bound therefore includes both entries of each displacement row.
const errorBound=step*Math.SQRT2*Math.hypot(...field.hessianEntryBounds),rawLipschitzUpperBound=maximumRawGradientNorm+errorBound;
const lowerFadeDisplacementBound=maximumLowerFadeRawDisplacement+rawLipschitzUpperBound*step/Math.SQRT2;
const lowerFadeGradientAddition=lowerFadeDisplacementBound*1.875/(config.lowerFadePhotoY[1]-config.lowerFadePhotoY[0]);
const lipschitzUpperBound=rawLipschitzUpperBound+lowerFadeGradientAddition;
const report={iteration:147,score:77,scope:'Source field only; no scene geometry, native image or art gain yet',controls:config.controls.length,radius:R,minimumPivot:field.minimumPivot,maximumControlError,samples,step,minimumSampledDeterminant:minimumDeterminant,maximumSampledDisplacementPhotoPixels:maximumDisplacement,maximumSampledDisplacementWorld:maximumDisplacement/Math.hypot(config.frame.a,config.frame.b),maximumSampledGradientNorm:maximumGradientNorm,maximumSampledRawGradientNorm:maximumRawGradientNorm,globalHessianEntryBounds:field.hessianEntryBounds,gradientGridErrorBound:errorBound,rawLipschitzUpperBound,maximumLowerFadeRawDisplacement,lowerFadeDisplacementBound,lowerFadeGradientAddition,lipschitzUpperBound,globalInjectivityCertified:lipschitzUpperBound<1,nonfinite,maximumFiniteDifferenceError,maximumWorldDerivativeError,elapsedMs:performance.now()-start,coefficients:field.coefficients};
fs.writeFileSync('review/eye-contour147-field-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
assert(maximumControlError<1e-8&&maximumFiniteDifferenceError<1e-6&&maximumWorldDerivativeError<1e-6&&!nonfinite);
assert(minimumDeterminant>0,'Sampled147 field folds.');
assert(lipschitzUpperBound<1,'Global147 continuous injectivity remains unproved.');
