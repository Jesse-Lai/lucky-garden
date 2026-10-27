import * as T from './vendor/three.module.js';
const $=s=>document.getElementById(s),TAU=Math.PI*2,palette=['#899b83','#b5ac89','#829c98','#ae987c','#a7ad95','#bfb69b','#78918a','#aaa095'];
const guestListVersion='meeting-first-names-2026-10-26';
const defaultNames=["Abhishek", "Aditi", "Alice", "Arjun", "Ashley", "Bobby", "Gia", "Hannah", "Ishneet", "Jane", "Jhonatan", "Jianxun", "Jing", "Lina", "Mohak", "Nebin", "Nupur", "Sara", "Shashidhar", "Shveta", "Stefano", "Sylvia", "Zidong"];
let names=[...defaultNames],history=[],spinning=false,angle=0,celebrate=0,sound=false,audio;
try{
 if(localStorage.getItem('lucky-garden-list-version')===guestListVersion){
  const saved=JSON.parse(localStorage.getItem('lucky-garden')||'null');
  if(Array.isArray(saved)&&saved.length>=2&&saved.length<=32&&saved.every(n=>typeof n==='string'&&n.trim()&&n.length<=24))names=saved;
 }else{
  localStorage.setItem('lucky-garden',JSON.stringify(names));
  localStorage.setItem('lucky-garden-list-version',guestListVersion);
 }
}catch{}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new T.WebGLRenderer({antialias:false,alpha:true});renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;$('scene').prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#ffffff');const camera=new T.OrthographicCamera(-9,9,7,-7,.1,100);camera.position.set(15,21.45,29);camera.lookAt(0,2.9,0);
const wideCamera=new T.Vector3(15,21.45,29),closeCamera=new T.Vector3(1.4,6.5,26),cameraAim=new T.Vector3();
let cameraBlend=0,lastCameraFrame=0,winnerIndex=-1,ambientTime=0;
scene.add(new T.HemisphereLight('#f5f5e8','#798574',1.45));const sun=new T.DirectionalLight('#fff3df',3);sun.position.set(-10,14,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:60});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;sun.shadow.radius=1;scene.add(sun);
// Surface grain remains fixed to each model, as on the reference's rocks and wood.
const mat=c=>{const m=new T.MeshStandardMaterial({color:c,roughness:.9,flatShading:true});
 m.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 materialPoint;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nmaterialPoint=position;');
 shader.fragmentShader='varying vec3 materialPoint;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 grainCell=floor(materialPoint*95.);
 float surfaceGrain=fract(sin(dot(grainCell,vec3(127.1,311.7,74.7)))*43758.5453);
 diffuseColor.rgb*=.84+surfaceGrain*.30;`);
 };return m;};const wood=mat('#8f7048'),dark=mat('#303b38'),cream=mat('#c7c8b3'),ground=mat('#aeafa3'),gold=mat('#b59b6b');
function mesh(geo,m,x,y,z,p=scene){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
const box=(x,y,z,w,h,d,m,p)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
const cyl=(x,y,z,r,h,m,p,n=12)=>mesh(new T.CylinderGeometry(r,r,h,n),m,x,y,z,p);
function bar(a,b,r,m,p=scene){let v=new T.Vector3(...a),w=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,v.distanceTo(w),6),m,0,0,0,p);o.position.copy(v.clone().add(w).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),w.sub(v).normalize());return o;}
let seed=81;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
// Match the reference's stable world-space grain and dissolving pixel boundary.
const groundSurface=ground.clone();
const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=128;
const grainContext=grainCanvas.getContext('2d');grainContext.fillStyle='#aaa99d';grainContext.fillRect(0,0,128,128);
const grainPixels=grainContext.getImageData(0,0,128,128);
for(let i=0;i<grainPixels.data.length;i+=4){const n=(rand()-.5)*48;for(let k=0;k<3;k++)grainPixels.data[i+k]+=n;}
grainContext.putImageData(grainPixels,0,0);
const grainMap=new T.CanvasTexture(grainCanvas);grainMap.colorSpace=T.SRGBColorSpace;grainMap.wrapS=grainMap.wrapT=T.RepeatWrapping;grainMap.repeat.set(4,3);grainMap.magFilter=grainMap.minFilter=T.NearestFilter;
groundSurface.color.set('#aeafa3');groundSurface.map=grainMap;
groundSurface.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 groundWorld;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ngroundWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
 shader.fragmentShader='varying vec3 groundWorld;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
 vec2 cell=floor(groundWorld.xz/.075);
 float noise=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);
 vec2 samplePoint=(cell+.5)*.075;
 float edge=1.-length(samplePoint/vec2(7.,4.48));
 if(noise>smoothstep(0.,.14,edge))discard;`);
};
const floor=mesh(new T.CircleGeometry(7,64),groundSurface,0,.01,0);floor.rotation.x=-Math.PI/2;floor.scale.y=.64;
floor.castShadow=false;
const shadow=mesh(new T.PlaneGeometry(100,100),new T.ShadowMaterial({color:'#70815f',opacity:.17}),0,-.08,0);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
const grass=['#91a278','#a6b08c','#6d865c','#c1c4a9'].map(mat);
for(let i=0;i<1350;i++){let x=(rand()-.5)*15,z=(rand()-.5)*10,r=Math.hypot(x/7,z/4.48);if(r>.85&&r<1.12&&rand()<(1.13-r)*3.5){const s=.06+rand()*.13;box(x,0,z,s,.015+rand()*.06,s,grass[i%4]).castShadow=false;}}
// A timber podium and freestanding wheel, in the reference's miniature material palette.
box(0,.14,0,6.5,.26,2.5,wood);for(let i=0;i<13;i++)box(-3+i*.5,.277,0,.015,.012,2.45,mat('#8f7956'));
box(-1.35,2.3,-.4,.26,4.2,.32,dark);box(1.35,2.3,-.4,.26,4.2,.32,dark);bar([-1.35,.3,.8],[-1.35,3.6,-.4],.09,wood);bar([1.35,.3,.8],[1.35,3.6,-.4],.09,wood);
const wheel=new T.Group();wheel.position.set(0,3.65,0);scene.add(wheel);let rim=cyl(0,0,0,2.73,.3,wood,wheel,64);rim.rotation.x=Math.PI/2;
const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=2048;const ctx=textureCanvas.getContext('2d'),texture=new T.CanvasTexture(textureCanvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
mesh(new T.CircleGeometry(2.57,96),new T.MeshStandardMaterial({map:texture,roughness:.9}),0,0,.163,wheel);
for(let i=0;i<40;i++){let a=i*TAU/40;const b=mesh(new T.SphereGeometry(.045,6,4),cream,Math.sin(a)*2.65,Math.cos(a)*2.65,.18,wheel);b.castShadow=false;}
let hub=cyl(0,0,.25,.36,.19,gold,wheel,24);hub.rotation.x=Math.PI/2;let cap=cyl(0,0,.36,.19,.05,cream,wheel,16);cap.rotation.x=Math.PI/2;
const pointer=new T.Shape();pointer.moveTo(-.18,0);pointer.lineTo(.18,0);pointer.lineTo(0,-.5);pointer.closePath();mesh(new T.ExtrudeGeometry(pointer,{depth:.12,bevelEnabled:false}),gold,0,6.49,.25);box(0,6.5,0,.65,.1,.65,dark);
// Cherry blossoms, cedar torii, and paper lanterns frame the close-up.
const blossom=[mat('#8e9c77'),mat('#b0b69b'),mat('#778964')],vermilion=mat('#82745b');
function tree(x,z,scale){const g=new T.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(scale);bar([0,0,0],[.15,3.5,0],.13,wood,g);for(let i=0;i<9;i++){const a=i*2.4,r=.5+rand()*.8,y=2.9+rand()*1.6;const end=[Math.cos(a)*r,y,Math.sin(a)*r*.7];bar([.1,2.1,0],end,.055,wood,g);const bloom=mesh(new T.IcosahedronGeometry(.65+rand()*.35,1),blossom[i%3],...end,g);bloom.scale.y=.65;}}
tree(-4,-1.4,1.1);tree(4.1,-2,1.15);
for(const x of [-3.25,3.25]){cyl(x,3.45,-2,.14,6.9,vermilion);box(x,.2,-2,.44,.4,.5,dark);}
box(0,6.5,-2,7.35,.2,.25,vermilion);box(0,7,-2,7.8,.28,.55,wood);box(0,6.76,-2,.23,.55,.2,vermilion);
for(const side of [-1,1]){const e=box(side*3.6,7.09,-2,1,.18,.56,wood);e.rotation.z=side*.16;}
for(const x of [-3,3]){bar([x,6.5,-2],[x,5.7,-2],.025,dark);const lamp=mesh(new T.SphereGeometry(.32,12,8),cream,x,5.4,-2);lamp.scale.y=1.3;for(const y of [5.04,5.76])cyl(x,y,-2,.17,.09,dark);for(let i=0;i<5;i++){let band=mesh(new T.TorusGeometry(.32*Math.sqrt(1-((i-2)*.14/.42)**2),.012,4,20),wood,x,5.4+(i-2)*.14,-2);band.rotation.x=Math.PI/2;}}
// Flat stepping stones and a small stone lantern in the garden.
for(let i=0;i<6;i++){const stone=cyl(-.3+Math.sin(i)*.18,.05,1.5+i*.45,.32,.1,mat('#9f9f92'),scene,7);stone.scale.z=.65;}
for(const x of [-3.5,3.5]){cyl(x,.12,1.3,.4,.24,ground);box(x,.55,1.3,.2,.8,.2,ground);box(x,1.03,1.3,.5,.42,.5,cream);mesh(new T.ConeGeometry(.48,.24,4),dark,x,1.37,1.3);}
function gift(x,z,color){box(x,.28,z,.55,.5,.55,mat(color));box(x,.55,z,.6,.08,.6,mat(color));box(x,.3,z,.08,.57,.57,cream);box(x,.6,z,.58,.025,.08,cream);}
gift(3.3,.8,'#b48b70');gift(3.9,.45,'#91a287');gift(3.65,1.15,'#d4bb81');
box(-3.7,.65,1.2,1.9,.16,.55,wood);for(const x of [-4.35,-3.05])box(x,.3,1.2,.12,.6,.45,dark);
const people=[];function person(x,z,color,rot=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);const skin=mat('#c6a47e'),shirt=mat(color),hair=mat('#4c493b');const legs=[];for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.12,.48,0);g.add(leg);box(0,-.23,0,.15,.5,.2,dark,leg);legs.push(leg);}box(0,.7,0,.42,.48,.25,shirt,g);box(0,.52,.015,.45,.12,.28,cream,g);bar([-.15,.93,.14],[.12,.59,.14],.023,cream,g);const head=new T.Group();head.position.set(0,1.02,0);g.add(head);box(0,.09,0,.29,.32,.28,skin,head);box(0,.26,-.03,.32,.12,.3,hair,head);const arms=[];for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.27,.88,0);g.add(arm);box(0,-.16,0,.13,.35,.17,shirt,arm);box(0,-.36,0,.12,.12,.15,skin,arm);arms.push(arm);}people.push({g,arms,legs,head,x,z,rot});}
person(-2.2,2.6,'#d4c29e',-.25);person(1.8,2.8,'#89a69c',.2);person(3.5,2.3,'#b9aa87',-.5);person(-3.35,2.5,'#e0d9bf',.5);person(.1,3.7,'#b08c73',.1);
const confetti=[];for(let i=0;i<110;i++){const o=box(0,-4,0,.07,.14,.035,mat(palette[i%8]));o.castShadow=false;confetti.push({o,x:(rand()-.5)*12,z:(rand()-.5)*6,y:5+rand()*7,s:1+rand()*2,r:rand()*10});}
function drawWheel(){ctx.clearRect(0,0,2048,2048);const n=names.length,step=TAU/n;for(let i=0;i<n;i++){const a=-Math.PI/2+i*step;ctx.beginPath();ctx.moveTo(1024,1024);ctx.arc(1024,1024,1020,a,a+step);ctx.closePath();ctx.fillStyle=palette[i%8];ctx.fill();ctx.strokeStyle='#f3efdd';ctx.lineWidth=4;ctx.stroke();ctx.save();ctx.translate(1024,1024);ctx.rotate(a+step/2);ctx.translate(670,0);ctx.rotate(Math.PI/2);ctx.fillStyle='#343a32';ctx.textAlign='center';ctx.textBaseline='middle';let name=names[i]||'Add name';const maxWidth=Math.min(750,2*670*Math.sin(step/2)*.88);let size=n>20?62:n>12?86:116;ctx.font=`600 ${size}px Georgia, "PingFang SC", serif`;while(ctx.measureText(name).width>maxWidth&&size>22){size-=2;ctx.font=`600 ${size}px Georgia, "PingFang SC", serif`;}ctx.fillText(name,0,0,maxWidth);ctx.restore();}texture.needsUpdate=true;}
function save(){try{localStorage.setItem('lucky-garden',JSON.stringify(names));}catch{}}
function validate(){const valid=names.every(n=>n.trim());$('spin').disabled=spinning||!valid;$('error').textContent=valid?'':'Please enter a name for every guest.';$('odds').textContent=`${names.length} guests · ${(100/names.length).toFixed(1)}% chance each`;return valid;}
function resetResult(){celebrate=0;$('result').classList.remove('won');$('result-label').textContent='A LITTLE LUCK IS WAITING';$('winner').textContent='One spin. A happy surprise.';}
function renderNames(){const holder=$('names');holder.replaceChildren();names.forEach((name,i)=>{let row=document.createElement('div');row.className='name-row';let num=document.createElement('span');num.className='number';num.textContent=String(i+1).padStart(2,'0');let dot=document.createElement('span');dot.className='dot';dot.style.background=palette[i%8];let input=document.createElement('input');input.value=name;input.maxLength=24;input.setAttribute('aria-label',`Name of participant ${i+1}`);input.addEventListener('input',()=>{names[i]=input.value;save();drawWheel();validate();resetResult();});input.addEventListener('change',()=>{names[i]=input.value.trim();input.value=names[i];save();});let remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label',`Remove participant ${i+1}`);remove.disabled=names.length<=2;remove.onclick=()=>{names.splice(i,1);changed();};row.append(num,dot,input,remove);holder.append(row);});$('count').value=String(names.length);$('add').disabled=names.length>=32;validate();}
function changed(){angle=0;wheel.rotation.z=0;save();renderNames();drawWheel();resetResult();}
function resizeCount(n){if(spinning)return;n=Math.max(2,Math.min(32,Math.floor(Number(n)||2)));while(names.length<n)names.push(`Guest ${names.length+1}`);names.length=n;changed();}
$('add').onclick=()=>resizeCount(names.length+1);
$('apply').onclick=()=>{if(spinning)return;const list=$('bulk').value.split(/[\n,，;；]+/).map(s=>s.trim()).filter(Boolean);if(list.length<2||list.length>32||list.some(n=>n.length>24)){$('error').textContent='Enter 2–32 names, up to 24 characters each.';return;}names=list;changed();$('bulk').value='';document.querySelector('details').open=false;};
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'♫ Sound on':'♫ Sound off';$('sound').setAttribute('aria-pressed',String(sound));if(sound){audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}};
function beep(freq,duration=.04,delay=0){if(!sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.035,audio.currentTime+delay);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+delay+duration);o.connect(g);g.connect(audio.destination);o.start(audio.currentTime+delay);o.stop(audio.currentTime+delay+duration);}
// Rejection sampling gives each sector equal odds, independent of its label.
function randomIndex(n){const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%n;}
function randomUnit(){return crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;}
function lock(value){document.querySelectorAll('aside input,aside button,aside textarea, #clear').forEach(e=>e.disabled=value);if(!value)renderNames();$('spin').disabled=value;}
function historyUI(){$('history').replaceChildren();if(!history.length)$('history').textContent='Your first lucky moment awaits';history.forEach((n,i)=>{const b=document.createElement('b');b.textContent=`${history.length-i}. ${n}`;$('history').append(b);});$('clear').hidden=!history.length;}
$('clear').onclick=()=>{history=[];historyUI();};
$('spin').onclick=()=>{if(spinning||!validate())return;spinning=true;lock(true);celebrate=0;$('result').classList.remove('won');$('result-label').textContent='GOOD LUCK IS ON ITS WAY';$('winner').textContent='Could it be you?';$('spin').textContent='Spinning…';const n=names.length,index=randomIndex(n),step=TAU/n;const landing=(index+.2+randomUnit()*.6)*step;const normalized=((angle%TAU)+TAU)%TAU;const delta=(TAU-landing-normalized+TAU)%TAU;const start=angle,end=angle+TAU*7+delta,t0=performance.now(),duration=reduced?180:6200;let lastTick=-1;function frame(now){const p=Math.min(1,(now-t0)/duration),ease=1-Math.pow(1-p,4);angle=start+(end-start)*ease;wheel.rotation.z=-angle;const tick=Math.floor(angle/step);if(tick!==lastTick){beep(700,.025);lastTick=tick;}if(p<1)requestAnimationFrame(frame);else{angle=end%TAU;wheel.rotation.z=-angle;spinning=false;winnerIndex=index;celebrate=performance.now();$('result').classList.add('won');$('result-label').textContent='✧ CONGRATULATIONS, LUCKY YOU ✧';$('winner').textContent=names[index];history.unshift(names[index]);history=history.slice(0,8);historyUI();$('spin').innerHTML='<span>✳</span> Spin again <span>↗</span>';lock(false);[523,659,784,1046].forEach((f,i)=>beep(f,.3,i*.12));}}requestAnimationFrame(frame);};
// Reference: gem-mine-scene/scene.js, default pixel + color rendering.
const target=new T.WebGLRenderTarget(480,300,{minFilter:T.NearestFilter,magFilter:T.NearestFilter});
target.texture.colorSpace=T.LinearSRGBColorSpace;
const post=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
const postMat=new T.ShaderMaterial({uniforms:{map:{value:target.texture},res:{value:new T.Vector2(480,300)},bg:{value:scene.background}},
 vertexShader:'varying vec2 uvv;void main(){uvv=uv;gl_Position=vec4(position,1.);}',
 fragmentShader:`uniform sampler2D map;uniform vec2 res;uniform vec3 bg;varying vec2 uvv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float bayer(vec2 p){vec2 q=mod(floor(p),4.);float a=mod(q.x,2.)*2.+mod(q.y,2.)*3.;a=mod(a,4.);vec2 r=floor(q/2.);float b=mod(r.x*2.+r.y*3.,4.);return (a*4.+b+.5)/16.;}
 void main(){
 vec3 raw=texture2D(map,uvv).rgb;vec2 p=floor(uvv*res);gl_FragColor=vec4(raw,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 if(distance(raw,bg)<.006){gl_FragColor=vec4(1.);}else{
 vec3 c=gl_FragColor.rgb;float noise=(bayer(p)-.5)*.65+(hash(p)-.5)*.08;
 c=floor(c*13.+.5+noise)/13.;gl_FragColor=vec4(clamp(c,0.,1.),1.);
 }}
`});
post.add(new T.Mesh(new T.PlaneGeometry(2,2),postMat));
// Bound the scenery and its directional shadows, not the infinite shadow receiver.
const framingPoints=[],particleMeshes=new Set(confetti.map(c=>c.o));
scene.updateMatrixWorld(true);
scene.traverse(o=>{
 if(!o.isMesh||o===shadow||particleMeshes.has(o))return;
 o.geometry.computeBoundingBox();const bounds=o.geometry.boundingBox;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const point=new T.Vector3(x,y,z).applyMatrix4(o.matrixWorld);framingPoints.push(point);
  if(o.castShadow&&point.y>0){const drop=(point.y+.08)/sun.position.y;
   framingPoints.push(new T.Vector3(point.x-sun.position.x*drop,-.08,point.z-sun.position.z*drop));}
 }
});
const framingPoint=new T.Vector3();
function fitSceneCamera(aspect,blend){
 camera.updateMatrixWorld(true);
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const point of framingPoints){framingPoint.copy(point).applyMatrix4(camera.matrixWorldInverse);
 minX=Math.min(minX,framingPoint.x);maxX=Math.max(maxX,framingPoint.x);
 minY=Math.min(minY,framingPoint.y);maxY=Math.max(maxY,framingPoint.y);}
 // Reserve headroom for the tiny jumping guests and breathing space at every edge.
 const padding=1.18-.07*blend;
 // Anchor the composition to the wheel hub, not the asymmetric cast shadow.
 const cx=framingPoint.copy(wheel.position).applyMatrix4(camera.matrixWorldInverse).x;
 const width=2*Math.max(Math.abs(minX-cx),Math.abs(maxX-cx));
 const height=Math.max(maxY-minY+.35,width/aspect)*padding;
 const cy=(minY+maxY)/2+.12;
 camera.left=cx-height*aspect/2;camera.right=cx+height*aspect/2;
 camera.top=cy+height/2;camera.bottom=cy-height/2;camera.zoom=1;camera.updateProjectionMatrix();
}
// A second camera move isolates the winning label after the wheel has stopped.
const winnerPoint=new T.Vector3();
function focusWinningName(aspect,t){
 if(!celebrate||winnerIndex<0)return;
 const progress=reduced?1:T.MathUtils.smoothstep((t-celebrate)/1000,.45,2.0);
 if(progress<=0)return;
 const theta=-Math.PI/2+(winnerIndex+.5)*TAU/names.length;
 // Canvas Y runs downward; convert the label anchor to the wheel's local plane.
 const radius=2.57*670/1020;
 winnerPoint.set(Math.cos(theta)*radius,-Math.sin(theta)*radius,.17);
 wheel.updateWorldMatrix(true,false);wheel.localToWorld(winnerPoint);
 winnerPoint.applyMatrix4(camera.matrixWorldInverse);
 // Keep the label comfortably inside the frame even with two guests or long names.
 const focusHeight=Math.max(3.25,3.6/aspect),focusWidth=focusHeight*aspect;
 const cx=winnerPoint.x,cy=winnerPoint.y-.12;
 camera.left=T.MathUtils.lerp(camera.left,cx-focusWidth/2,progress);
 camera.right=T.MathUtils.lerp(camera.right,cx+focusWidth/2,progress);
 camera.top=T.MathUtils.lerp(camera.top,cy+focusHeight/2,progress);
 camera.bottom=T.MathUtils.lerp(camera.bottom,cy-focusHeight/2,progress);
 camera.updateProjectionMatrix();
}
function resize(){const w=$('scene').clientWidth,h=$('scene').clientHeight;if(!w||!h)return;const scale=Math.min(1,480/w);renderer.setSize(w,h,false);target.setSize(Math.round(w*scale),Math.round(h*scale));postMat.uniforms.res.value.set(target.width,target.height);const aspect=w/h,view=Math.max(10.4,14.6/aspect);camera.left=-view*aspect/2;camera.right=view*aspect/2;camera.top=view/2;camera.bottom=-view/2;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe($('scene'));renderNames();drawWheel();resize();
function animateGuests(dt,party,elapsed){
 const idle=!spinning&&!celebrate&&!reduced;
 if(idle)ambientTime+=dt;
 const ease=1-Math.exp(-dt*5),chatPartners=[3,2,1,0];
 people.forEach((p,i)=>{
  let yaw=p.rot,bob=0,step=0,gesture=0;
  if(party){bob=Math.abs(Math.sin(elapsed*7+i))*.3;}
  else if(idle&&i===4){
   // A slow, enclosed oval along the front edge, away from the wheel and guests.
   const phase=ambientTime*.32;
   p.g.position.x=p.x+Math.sin(phase)*2.52;
   p.g.position.z=p.z+(1-Math.cos(phase))*.384;
   yaw=Math.atan2(2.52*Math.cos(phase),.384*Math.sin(phase));
   step=Math.sin(ambientTime*4.8)*.912;bob=Math.abs(Math.sin(ambientTime*4.8))*.06;
  }else if(idle){
   const friend=people[chatPartners[i]];
   yaw=Math.atan2(friend.x-p.x,friend.z-p.z);
   gesture=Math.sin(ambientTime*2.1+i)*(.5+.5*Math.sin(ambientTime*.7+i));
   bob=Math.sin(ambientTime*1.8+i)*.0192;
  }else if(spinning||celebrate){yaw=Math.atan2(-p.g.position.x,-p.g.position.z);}
  if(reduced){p.g.position.set(p.x,0,p.z);p.g.rotation.y=p.rot;}
  else{p.g.position.y=bob;const difference=Math.atan2(Math.sin(yaw-p.g.rotation.y),Math.cos(yaw-p.g.rotation.y));p.g.rotation.y+=difference*ease;}
  p.head.rotation.x=idle&&i!==4?Math.sin(ambientTime*2.4+i)*.168:0;
  p.head.rotation.y=idle&&i!==4?Math.sin(ambientTime*.85+i)*.216:0;
  p.legs.forEach((leg,j)=>leg.rotation.x+=(step*(j?1:-1)-leg.rotation.x)*ease);
  p.arms.forEach((arm,j)=>{
   const z=party?(j?1:-1)*(2.3+Math.sin(elapsed*8+i)*.25):idle&&i!==4?(j?1:-1)*(.288+Math.max(0,gesture)*.672):0;
   const x=idle&&i===4?-step*(j?1:-1):idle&&i!==4?(j===i%2?-.72-gesture*.6:0):0;
   arm.rotation.z+=(z-arm.rotation.z)*ease;arm.rotation.x+=(x-arm.rotation.x)*ease;
  });
 });
}
function animate(t){
 const dt=lastCameraFrame?Math.min((t-lastCameraFrame)/1000,.1):0;lastCameraFrame=t;
 // Keep the same angle variable as the draw, so clicking Spin never resets the wheel.
 if(!spinning&&!celebrate&&!reduced){angle=(angle+dt*.132)%TAU;wheel.rotation.z=-angle;}
 const targetBlend=celebrate?1:0;
 cameraBlend=reduced?targetBlend:cameraBlend+(targetBlend-cameraBlend)*(1-Math.exp(-dt*3.2));
 camera.position.lerpVectors(wideCamera,closeCamera,cameraBlend);
 cameraAim.set(0,2.9+(3.55-2.9)*cameraBlend,0);camera.lookAt(cameraAim);
 const aspect=$('scene').clientWidth/$('scene').clientHeight;
 fitSceneCamera(aspect,cameraBlend);
 focusWinningName(aspect,t);
 const elapsed=celebrate?(t-celebrate)/1000:0,party=celebrate&&elapsed<6&&!reduced;animateGuests(dt,party,elapsed);confetti.forEach(c=>{c.o.visible=!!party;if(party){c.o.position.set(c.x+Math.sin(elapsed+c.r)*.7,c.y-elapsed*c.s,c.z);c.o.rotation.set(elapsed*2+c.r,elapsed,c.r+elapsed);if(c.o.position.y<0)c.o.visible=false;}});renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(post,postCamera);requestAnimationFrame(animate);}requestAnimationFrame(animate);
