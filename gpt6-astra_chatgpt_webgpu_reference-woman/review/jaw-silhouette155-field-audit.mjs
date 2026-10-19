import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import config from './jaw-silhouette155-config.json' with {type:'json'};
import {createJawSilhouetteField155} from './jaw-silhouette155-field.js';
import {certifyJawField155} from './jaw-silhouette155-geometry-audit.js';
const started=performance.now(),sourceBytes=await readFile(new URL('./jaw-silhouette153-native.json',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex');
if(hash(sourceBytes)!=='918cb5813c9e99aeb32b2f75fb4b5b5e4f517aaefb67563239fc163125702fec')throw Error('155 source mouth-box report changed.');
const source=JSON.parse(sourceBytes),mouthBox=source.results[1].setup.metrics.mouthBox,field=createJawSilhouetteField155(config,mouthBox),certificate=certifyJawField155(field),b=field.protectedBox,h=1e-4;
const xs=new Set([210,280,750,820,515,b[0]-72,b[0],b[1],b[1]+72]),ys=new Set([500,650,760,880,b[2],b[3],b[3]+40]);
for(let x=210;x<=820;x+=11)xs.add(x);for(let y=500;y<=880;y+=13)ys.add(y);
let checks=0,maxGradientError=0,maxFrameResidual=0,minIndependentDeterminant=Infinity;
for(const x of xs)for(const y of ys){
 const f=field.photo(x,y),dx=(field.photo(x+h,y).delta-field.photo(x-h,y).delta)/(2*h),dy=(field.photo(x,y+h).delta-field.photo(x,y-h).delta)/(2*h);
 maxGradientError=Math.max(maxGradientError,Math.abs(dx-f.gradient[0]),Math.abs(dy-f.gradient[1]));minIndependentDeterminant=Math.min(minIndependentDeterminant,1+dx);checks++;
 const {a,b:bb,worldOrigin:wo,photoOrigin:po}=config.frame,den=a*a+bb*bb,px=x-po[0],py=y-po[1],wx=wo[0]+(a*px+bb*py)/den,wy=wo[1]+(bb*px-a*py)/den,
  w=field.world(wx,wy,.37),after=field.project(wx+w.delta[0],wy+w.delta[1]);
 maxFrameResidual=Math.max(maxFrameResidual,Math.abs(after[0]-x-f.delta),Math.abs(after[1]-y),Math.abs(w.delta[2]));
}
let protectedBoxChecks=0;for(let j=0;j<=20;j++)for(let i=0;i<=20;i++){
 const f=field.photo(b[0]+(b[1]-b[0])*i/20,b[2]+(b[3]-b[2])*j/20);if(f.active||f.delta!==0||f.gradient.some(x=>x!==0))throw Error('155 reaches protected mouth box.');protectedBoxChecks++;
}
if(maxGradientError>1e-7||maxFrameResidual>1e-8||!(field.analyticMinimumDeterminant>.02)||certificate.minimumSampledDeterminant+1e-10<field.analyticMinimumDeterminant)throw Error('155 derivative/frame/global-bound source check failed.');
const diagnostics=config.controls.map(c=>({label:c.label,at:c.at,manualX:c.manualX,previous153RawDelta:c.comparison153RawDelta,broad155Delta:field.photo(...c.at).delta,continuousPredictionX:c.at[0]+field.photo(...c.at).delta}));
const report={candidate:155,status:'Source field checks passed; actual native geometry and artwork pending',scoreUnchanged:78,
 sourceMouthReport:{file:'review/jaw-silhouette153-native.json',sha256:hash(sourceBytes),mouthBox,interpretation:'The actual lips remained unchanged through153; their recorded bounds are reused only for this local field check. The native helper measures the current lip geometry again.'},
 fieldFiles:{},certificate,finiteDifference:{step:h,checks,maxGradientError,minIndependentDeterminant},frameRoundtripMaxResidualPhotoPixels:maxFrameResidual,protectedBoxChecks,
 diagnostics,elapsedMs:performance.now()-started,interpretation:'155 uses a broad contraction, not interpolation of the153 targets. These finite differences independently check its analytic first derivatives; complete-support bounds certify the continuous scalar map only. No actual head/neck triangle or unchanged-hair/cloth clearance claim is made before native geometry and art review.'};
for(const name of ['jaw-silhouette155-config.json','jaw-silhouette155-field.js','jaw-silhouette155-geometry-audit.js','jaw-silhouette155-field-audit.mjs']){const bytes=await readFile(new URL(name,import.meta.url));report.fieldFiles['review/'+name]={bytes:bytes.length,sha256:hash(bytes)};}
await writeFile(new URL('./jaw-silhouette155-field-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,fieldFiles:Object.keys(report.fieldFiles)}));
