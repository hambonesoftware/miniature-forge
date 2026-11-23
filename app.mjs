import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {PointerLockControls} from 'three/addons/controls/PointerLockControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Navigation} from './navigation.mjs';

const $=id=>document.getElementById(id),scene=new THREE.Scene();
scene.background=new THREE.Color(0x9eb6bd);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.035,900);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',logarithmicDepthBuffer:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
$('world').appendChild(renderer.domElement);
renderer.domElement.tabIndex=0;
scene.add(new THREE.HemisphereLight(0xddeeff,0x78815a,1.2));
const sun=new THREE.DirectionalLight(0xffe4be,1.8);sun.position.set(-60,120,80);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-125,right:125,top:80,bottom:-80,near:1,far:320});sun.shadow.mapSize.set(1536,1536);sun.shadow.normalBias=.025;scene.add(sun);
const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=environment.texture;scene.environmentIntensity=.35;pmrem.dispose();
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.minDistance=3;orbit.maxDistance=420;orbit.maxPolarAngle=Math.PI*.49;
const pointer=new PointerLockControls(camera,renderer.domElement);pointer.pointerSpeed=.7;
const keys=new Set(),direction=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),clock=new THREE.Clock();
let data,nav,mode='orbit',ready=false,feet=[12,.02,14],lastSpawn='street',drag=null;
const status={ready:false,mode,position:[],error:null,frames:0};window.__forge=status;

function overview(){pointer.unlock();mode='orbit';orbit.enabled=true;keys.clear();const bounds=data?.bounds||[[-104.4,-52.2],[104.4,52.2]],target=new THREE.Vector3((bounds[0][0]+bounds[1][0])/2,3,(bounds[0][1]+bounds[1][1])/2),axis=new THREE.Vector3(1,.85,1.3).normalize();camera.position.copy(target).addScaledVector(axis,500);camera.lookAt(target);camera.updateMatrixWorld();
 const r=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),u=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));let distance=1;
 for(const x of[bounds[0][0],bounds[1][0]])for(const y of[-1.45,data?.height||14])for(const z of[bounds[0][1],bounds[1][1]]){const p=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,Math.abs(p.dot(r))/(tan*camera.aspect*.85)+p.dot(axis),Math.abs(p.dot(u))/(tan*.75)+p.dot(axis));}
 camera.position.copy(target).addScaledVector(axis,distance);orbit.target.copy(target);orbit.update();refreshUI();}
function refreshUI(){for(const id of ['orbit','walk','fly'])$(id).classList.toggle('active',mode===id);$('crosshair').hidden=mode==='orbit';$('touch-pad').hidden=mode==='orbit'||!(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0);
 $('hint').textContent=mode==='orbit'?'Drag to orbit · Scroll to zoom':mode==='walk'?'W A S D to walk · Mouse or drag to look · Esc to release':'W A S D to fly · Q / E down and up';status.mode=mode;}
function spawn(id){if(!ready)return;const place=data.spawns.find(p=>p.id===id)||data.spawns[0];lastSpawn=place.id;feet=[...place.feet];
 const h=nav.height(feet[0],feet[2],feet[1]);if(h!==null)feet[1]=h;
 mode='walk';orbit.enabled=false;keys.clear();camera.position.set(feet[0],feet[1]+1.7,feet[2]);camera.lookAt(...place.look);status.position=camera.position.toArray();status.feet=[...feet];$('location').value=place.id;refreshUI();}
function setMode(next){if(!ready)return;if(next==='orbit')return overview();
 if(next==='walk'){if(mode!=='walk')spawn(lastSpawn);mode='walk';}else{mode='fly';orbit.enabled=false;}
 refreshUI();if(!(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0)){try{pointer.lock();}catch{}}}
$('orbit').onclick=()=>setMode('orbit');$('walk').onclick=()=>setMode('walk');$('fly').onclick=()=>setMode('fly');$('reset').onclick=()=>mode==='orbit'?overview():spawn(lastSpawn);
$('location').onchange=e=>{spawn(e.target.value);renderer.domElement.focus({preventScroll:true});};$('help').onclick=()=>{$('instructions').hidden=!$('instructions').hidden;pointer.unlock();keys.clear();};$('close-help').onclick=()=>{$('instructions').hidden=true;renderer.domElement.focus({preventScroll:true});};
document.addEventListener('keydown',e=>{if(e.code==='Escape'){pointer.unlock();keys.clear();return;}if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}});
document.addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
renderer.domElement.addEventListener('pointerdown',e=>{renderer.domElement.focus({preventScroll:true});if(mode==='orbit')return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||pointer.isLocked||mode==='orbit')return;
 const angles=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');angles.y-=(e.clientX-drag.x)*.003;angles.x=THREE.MathUtils.clamp(angles.x-(e.clientY-drag.y)*.003,-1.45,1.45);camera.quaternion.setFromEuler(angles);drag.x=e.clientX;drag.y=e.clientY;});
for(const event of ['pointerup','pointercancel'])renderer.domElement.addEventListener(event,()=>drag=null);
for(const button of document.querySelectorAll('[data-key]')){button.onpointerdown=e=>{e.preventDefault();keys.add(button.dataset.key);button.setPointerCapture(e.pointerId);};for(const ev of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(ev,()=>keys.delete(button.dataset.key));}
document.addEventListener('pointerlockerror',()=>{$('hint').textContent='Drag on the model to look; W A S D still moves.';});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

async function load(){
 try{
  const models=await fetch(new URL('./scenes.json',document.baseURI)).then(r=>r.json()),selected=models.find(m=>m.id===new URLSearchParams(location.search).get('scene'))||models[0];
  for(const model of models)$('model').add(new Option(model.title,model.id));$('model').value=selected.id;$('model').disabled=false;$('model').onchange=e=>location.search='?scene='+encodeURIComponent(e.target.value);
  $('scene-title').textContent=selected.title;$('scene-description').textContent=selected.description;document.title=selected.title+' · Miniature Forge';status.scene=selected.id;
  renderer.shadowMap.enabled=false;if(renderer.shadowMap.enabled){Object.assign(sun.shadow.camera,{left:-32,right:32,top:27,bottom:-27});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00002;sun.shadow.normalBias=.01;}
  data=await fetch(selected.navigation).then(r=>{if(!r.ok)throw Error('Navigation data missing. Run the walkthrough export.');return r.json();});
  nav=new Navigation({...data,obstacles:[...data.obstacles,...(data.outdoorObstacles||[])]});
  const draco=new DRACOLoader();draco.setDecoderPath(new URL('./vendor/three/examples/jsm/libs/draco/gltf/',document.baseURI).href);draco.setWorkerLimit(2);
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  const gltf=await new Promise((resolve,reject)=>loader.load(selected.model,resolve,e=>{const amount=e.total?Math.round(e.loaded/e.total*100):0;$('progress').value=amount;$('load-message').textContent=amount<100?`Loading town geometry · ${amount}%`:'Preparing the model…';},reject));
  gltf.scene.traverse(o=>{if(!o.isMesh)return;const materials=Array.isArray(o.material)?o.material:[o.material];
   const replace=m=>{if(m.transmission>.1)return new THREE.MeshStandardMaterial({color:m.color,roughness:.12,metalness:.12,transparent:true,opacity:.06,depthWrite:false,side:THREE.DoubleSide});return m;};
   o.material=Array.isArray(o.material)?materials.map(replace):replace(o.material);o.castShadow=!materials.some(m=>m.transmission>.1||m.transparent);o.receiveShadow=true;});
  scene.add(gltf.scene);scene.updateMatrixWorld(true);
  // Closed door leaves remain solid in this outdoor-first version.
  nav.dynamic=data.doors.map(d=>{const o=gltf.scene.getObjectByName(d.node);if(!o)return null;const b=new THREE.Box3().setFromObject(o);return[b.min.toArray(),b.max.toArray()];}).filter(Boolean);
  for(const place of data.spawns){const option=new Option(place.label,place.id);$('location').add(option);}$('location').disabled=false;
  renderer.shadowMap.enabled=false;
  ready=true;status.ready=true;status.meshes=0;gltf.scene.traverse(o=>{if(o.isMesh)status.meshes++;});$('loader').hidden=true;overview();draco.dispose();
 }catch(error){status.error=String(error);$('load-message').textContent='Could not open the 3D scene. '+error.message;$('loader').setAttribute('role','alert');console.error(error);}
}
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.04);
 if(ready&&mode!=='orbit'&&$('instructions').hidden){const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
  camera.getWorldDirection(direction);if(mode==='walk'){direction.y=0;direction.normalize();}right.crossVectors(direction,up).normalize();
  const move=direction.multiplyScalar(forward).addScaledVector(right,side);if(mode==='fly')move.y+=(keys.has('KeyE')?1:0)-(keys.has('KeyQ')?1:0);
  if(move.lengthSq()){move.normalize().multiplyScalar((keys.has('ShiftLeft')||keys.has('ShiftRight')?6:2.6)*dt);if(mode==='walk'){feet=nav.move(feet,move.x,move.z);camera.position.x=feet[0];camera.position.z=feet[2];camera.position.y=THREE.MathUtils.lerp(camera.position.y,feet[1]+1.7,1-Math.exp(-dt*18));}else camera.position.add(move);}
 }
 if(mode==='orbit')orbit.update();renderer.render(scene,camera);status.frames++;status.position=camera.position.toArray();status.feet=[...feet];status.drawCalls=renderer.info.render.calls;
}
load();frame();
