import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

// References to CRT TV model and Projects video mesh
let crtTV;
let projectVideoMesh;

// ---------------- Scene, Camera & Renderers ----------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, -2, 6);
camera.rotation.x = -Math.PI / 6;

// store our “home” camera state
const initialCameraPosition = camera.position.clone();
const initialCameraRotation = camera.rotation.clone();

// target for camera lookAt
const lookAtTarget = new THREE.Vector3(0, -3, 0);
const initialLookAtTarget = lookAtTarget.clone();

// ---------------- Configurable Button Positions ----------------
let backBtnX    = -1.8;                              // X position for Back button
let backBtnY    =  1.2;                              // Y position for Back button
let linkBtnXs   = [-1.3, 1.3, -1.3, 1.3, -1.3, 1.3];  // X positions for Page 1–6 buttons
let linkBtnYs   = [ 0.5,    0.5,  -0.5,   -0.5,  -1.5,   -1.5];    // Y positions for Page 1–6 buttons

// ---------------- WebGL & CSS3D Renderers ----------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const css3dRenderer = new CSS3DRenderer();
css3dRenderer.setSize(window.innerWidth, window.innerHeight);
css3dRenderer.domElement.style.position = 'absolute';
css3dRenderer.domElement.style.top = '0';
css3dRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(css3dRenderer.domElement);

// ---------------- Helper: Curved Video Mesh ----------------
function createCurvedVideoMesh(src, pos, rot, scl, opts = {}) {
  const video = document.createElement('video');
  video.src = src;
  video.autoplay = video.loop = video.muted = video.playsInline = true;
  video.addEventListener('canplay', () => video.play().catch(console.error));

  const texture = new THREE.VideoTexture(video);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBFormat;

  const w = 4, h = 3;
  const geo = new THREE.PlaneGeometry(w, h, 20, 20);
  const arc = -Math.PI / 8;
  const radius = w / arc;
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const fac = x / (w / 2);
    const theta = fac * (arc / 2);
    posAttr.setX(i, radius * Math.sin(theta));
    posAttr.setZ(i, radius * (1 - Math.cos(theta)));
  }
  posAttr.needsUpdate = true;
  geo.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial(
    Object.assign(
      { map: texture, side: THREE.DoubleSide, transparent: true, opacity: 1, blending: THREE.NormalBlending },
      opts
    )
  );
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  mesh.scale.set(...scl);
  return mesh;
}

// ---------------- Add Video Meshes ----------------
scene.add(
  createCurvedVideoMesh('Videos/Old TV Overlay_2.mp4', [-4.7, -1.5, 0.5], [0, 0.3, 0], [0.9, 0.9, 0.9])
);
scene.add(
  createCurvedVideoMesh('Videos/Projects.mp4', [4.3, -1, 0.6], [0, -0.3, 0], [0.9, 0.9, 0.9])
);
scene.add(
  createCurvedVideoMesh('Videos/hacker_overlay.mp4', [0, 30, -20], [0, 0, 0], [40, 40, 40], { blending: THREE.AdditiveBlending })
);

projectVideoMesh = createCurvedVideoMesh('Videos/welcome_to_hoys_world.mp4', [0, -0.5, 0.2], [0, 0, 0], [1, 1, 1]);
scene.add(projectVideoMesh);

// ---------------- Load GLTF TV Models ----------------
const loader = new GLTFLoader();
loader.load('Models/crt_tv_gltf/scene.gltf', ({ scene: tv }) => {
  crtTV = tv;
  crtTV.position.set(0, -3, 0);
  crtTV.scale.set(0.1, 0.1, 0.1);
  scene.add(crtTV);
});
loader.load('Models/1970s_vintage_television_gltf/scene.gltf', ({ scene: tv }) => {
  tv.position.set(-4.8, -3, -0.5);
  tv.scale.set(0.3, 0.3, 0.3);
  tv.rotation.y = 0.3;
  scene.add(tv);
});
loader.load('Models/old_russian_tv_gltf/scene.gltf', ({ scene: tv }) => {
  tv.position.set(5, -1, -0.5);
  tv.scale.set(9, 9, 9);
  tv.rotation.y = -0.3;
  scene.add(tv);
});
loader.load('Models/tv_embeddedtextures_gltf/scene.gltf', ({ scene: tv }) => {
  tv.position.set(-2, -1, -0.5);
  tv.scale.set(2, 2, 2);
  tv.rotation.y = 0.2;
  scene.add(tv);
});

// ---------------- Floor ----------------
const floorTexture = new THREE.TextureLoader().load('Texture/Grunge.jpeg');
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50).rotateX(-Math.PI / 2).rotateY(Math.PI / 2),
  new THREE.MeshPhongMaterial({ map: floorTexture })
);
floor.position.set(0, -3, -5);
scene.add(floor);

// ---------------- CSS3D Title ----------------
const titleEl = document.querySelector('.project_title');
if (titleEl) {
  titleEl.style.position = 'static';
  const cssTitle = new CSS3DObject(titleEl);
  cssTitle.position.set(-305, -97, -0.5);
  cssTitle.scale.set(0.012, 0.012, 0.012);
  cssTitle.rotation.set(0, Math.PI / 16, 0);
  cssTitle.element.style.color = '#20C20E';
  scene.add(cssTitle);
}

// ---------------- CSS3D Back & Link Buttons ----------------
const allButtons = [];
const linkButtonObjs = [];

// Back button
const backBtnEl = document.createElement('button');
backBtnEl.innerText = 'Back';
Object.assign(backBtnEl.style, {
  padding: '8px 16px',
  fontFamily: 'Special Elite, cursive',
  fontSize: '16px',
  color: '#20C20E',
  background: 'transparent',
  border: '2px solid #20C20E',
  borderRadius: '4px',
  cursor: 'pointer',
  textAlign: 'left'
});
const cssBackBtn = new CSS3DObject(backBtnEl);
cssBackBtn.position.set(backBtnX, backBtnY, -1);
cssBackBtn.scale.set(0.01, 0.01, 0.01);
cssBackBtn.visible = false;
scene.add(cssBackBtn);
allButtons.push(cssBackBtn);

// Link buttons (manual way)
const linkData = [
  { label: 'Graphic Design',      url: 'graphic_design.html'      },
  { label: 'Rebrand',         url: 'rebrand.html'         },
  { label: 'Website Design', url: 'website_design.html' },
  { label: 'UX Design',          url: 'ux_design.html'           },
  { label: 'Photography',          url: 'photography.html'             },
  { label: 'Video Editing',                url: 'video_editing.html'                }
];
linkData.forEach((btn, i) => {
  const el = document.createElement('button');
  el.innerText = btn.label;
  Object.assign(el.style, {
    display:   'inline-block',   // become inline-block so width is respected
    width:     '150px',          // or whatever you need
    padding:   '10px 20px',
    fontFamily:'Special Elite, cursive',
    fontSize:  '10px',
    color:        '#000000',
    background:   '#39FF14',
    border:       '3px solid #000000',
    borderRadius: '6px',
    cursor:    'pointer',
    textAlign: 'left',           // now it will actually align left
    whiteSpace:'normal',         // let long labels wrap if needed
    pointerEvents: 'auto'
  });
  el.addEventListener('click', () => window.location.href = btn.url);
  const obj = new CSS3DObject(el);
  obj.position.set(linkBtnXs[i], linkBtnYs[i], -1);
  obj.scale.set(0.015, 0.015, 0.015);
  obj.visible = false;
  scene.add(obj);
  allButtons.push(obj);
  linkButtonObjs.push(obj);
});

// ---------------- Clickable Square ----------------
const clickEl = document.querySelector('.clickable-square');

// ---------------- Click & Fade Handler ----------------
clickEl.addEventListener('click', e => {
  e.preventDefault();
  if (projectVideoMesh) {
    projectVideoMesh.material.transparent = true;
    projectVideoMesh.material.opacity = 0;
  }
  clickEl.style.pointerEvents = 'none';

  const startPos = camera.position.clone();
  new TWEEN.Tween({ t: 0 })
    .to({ t: 1 }, 2000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(obj => {
      camera.position.lerpVectors(startPos, new THREE.Vector3(0, -1, 3), obj.t);
      camera.lookAt(lookAtTarget);
    })
    .onComplete(() => {
      allButtons.forEach(btn => btn.visible = true);
      glowScreen().then(() => window.location.href = 'project.html');
    })
    .start();
});

// ---------------- Back Button Handler ----------------
backBtnEl.addEventListener('click', e => {
  e.preventDefault();
  allButtons.forEach(b => b.visible = false);

  const startPos = camera.position.clone();
  const startLook = lookAtTarget.clone();

  new TWEEN.Tween({ t: 0 })
    .to({ t: 1 }, 2000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(obj => {
      camera.position.lerpVectors(startPos, initialCameraPosition, obj.t);
      camera.lookAt(new THREE.Vector3().lerpVectors(startLook, initialLookAtTarget, obj.t));
    })
    .onComplete(() => {
      if (projectVideoMesh) {
        projectVideoMesh.material.transparent = false;
        projectVideoMesh.material.opacity = 1;
      }
      clickEl.style.pointerEvents = 'auto';
    })
    .start();
});

// ---------------- Lighting ----------------
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 30, 10);
light.castShadow = true;
light.shadow.mapSize.set(1024, 1024);
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 50;
scene.add(light);

// ---------------- Controls & Render Loop ----------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;
(function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);
  css3dRenderer.render(scene, camera);
})();
// ---------------- Resize ----------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  css3dRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------- glowScreen ----------------
function glowScreen() {
  return new Promise(resolve => {
    if (!crtTV) return resolve();
    const screen = crtTV.getObjectByName('Screen') || crtTV.children.find(c => c.isMesh);
    if (!screen) return resolve();
    screen.material = screen.material.clone();
    screen.material.emissive = new THREE.Color(0xffffff);
    screen.material.emissiveIntensity = 0;
    new TWEEN.Tween({ i: 0 })
      .to({ i: 5 }, 800)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(g => screen.material.emissiveIntensity = g.i)
      .onComplete(resolve)
      .start();
  });
}