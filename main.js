import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

// ---------------- Scene, Camera, and Renderers ----------------

// Create the scene
const scene = new THREE.Scene();

// Set up the camera (FOV, aspect ratio, near, far)
const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);
camera.position.set(0, -2, 6);
camera.rotation.x = -Math.PI / 6;  // Tilt the camera downward 30 degrees

// Set up the WebGL renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the CSS3DRenderer for HTML content
const css3dRenderer = new CSS3DRenderer();
css3dRenderer.setSize(window.innerWidth, window.innerHeight);
css3dRenderer.domElement.style.position = 'absolute';
css3dRenderer.domElement.style.top = '0';
css3dRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(css3dRenderer.domElement);

// ---------------- Helper Function: Create Curved Video Mesh ----------------

function createCurvedVideoMesh(videoSrc, position, rotation, scale, materialOptions = {}) {
  // Create video element
  const videoEl = document.createElement('video');
  videoEl.src = videoSrc;
  videoEl.autoplay = true;
  videoEl.loop = true;
  videoEl.muted = true;
  videoEl.playsInline = true;  // for mobile compatibility

  // Wait for the video to be ready before playing
  videoEl.addEventListener('canplay', function() {
    videoEl.play().catch(error => {
      console.error('Video playback failed:', error);
    });
  });

  // Create video texture
  const videoTexture = new THREE.VideoTexture(videoEl);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBFormat;
  
  // Define geometry parameters
  const screenWidth = 4;
  const screenHeight = 3;
  const segmentsX = 20;
  const segmentsY = 20;
  const geometry = new THREE.PlaneGeometry(screenWidth, screenHeight, segmentsX, segmentsY);
  
  // Apply cylindrical bending transformation
  const arcAngle = -Math.PI / 8; // Adjust for curvature
  const radius = screenWidth / arcAngle;
  const posAttr = geometry.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const factor = x / (screenWidth / 2);
    const theta = factor * (arcAngle / 2);
    const newX = radius * Math.sin(theta);
    const newZ = radius * (1 - Math.cos(theta));
    posAttr.setX(i, newX);
    posAttr.setZ(i, newZ);
  }
  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
  
  // Create material merging base options with any additional options
  const baseMaterialOptions = {
    map: videoTexture,
    side: THREE.DoubleSide,
  };
  const materialOpts = Object.assign({}, baseMaterialOptions, materialOptions);
  const material = new THREE.MeshBasicMaterial(materialOpts);
  
  // Create the mesh and apply transformation parameters
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  
  return mesh;
}

// ---------------- Video Meshes ----------------

// Create first video mesh using the "Old TV Overlay" video
const videoMesh1 = createCurvedVideoMesh(
  'Videos/Old TV Overlay.mp4',
  [-4.7, -1.5, 0.5],
  [0, 0.3, 0],
  [0.9, 0.9, 0.9]
);
scene.add(videoMesh1);

// Create second video mesh using the same video source but different placement
const videoMesh2 = createCurvedVideoMesh(
  'Videos/Old TV Overlay.mp4',
  [4.3, -1, 0.6],
  [0, -0.3, 0],
  [0.9, 0.9, 0.9]
);
scene.add(videoMesh2);

// Create hacker video mesh
const hackerMesh = createCurvedVideoMesh(
  'Videos/hacker_overlay.mp4',
  [0, 30, -20],
  [0, 0, 0],
  [40, 40, 40],
  {
    transparent: true,
    blending: THREE.AdditiveBlending
  }
);
scene.add(hackerMesh);

// Create hacker video mesh
const projectMesh = createCurvedVideoMesh(
    'Videos/Projects.mp4',
    [0, -0.5, 0.2],
    [0, 0, 0],
    [1, 1, 1],
    {
      transparent: true,
      blending: THREE.AdditiveBlending
    }
  );
  scene.add(projectMesh);

// ---------------- Models & Textures ----------------

const loader = new GLTFLoader();

// CRT TV model
loader.load('/models/crt_tv_gltf/scene.gltf', function (gltf) {
  gltf.scene.position.set(0, -3, 0);
  gltf.scene.scale.set(0.1, 0.1, 0.1);
  scene.add(gltf.scene);
}, undefined, function (error) {
  console.error(error);
});

// 1970s vintage television model
loader.load('/models/1970s_vintage_television_gltf/scene.gltf', function (gltf) {
  gltf.scene.position.set(-4.8, -3, -0.5);
  gltf.scene.scale.set(0.3, 0.3, 0.3);
  gltf.scene.rotation.y = 0.3;
  scene.add(gltf.scene);
}, undefined, function (error) {
  console.error(error);
});

// Old Russian TV model
loader.load('/models/old_russian_tv_gltf/scene.gltf', function (gltf) {
  gltf.scene.position.set(5, -1, -0.5);
  gltf.scene.scale.set(9, 9, 9);
  gltf.scene.rotation.y = -0.3;
  scene.add(gltf.scene);
}, undefined, function (error) {
  console.error(error);
});

// TV with embedded textures model
loader.load('/models/tv_embeddedtextures_gltf/scene.gltf', function (gltf) {
  gltf.scene.position.set(-2, -1, -0.5);
  gltf.scene.scale.set(2, 2, 2);
  gltf.scene.rotation.y = 0.2;
  scene.add(gltf.scene);
}, undefined, function (error) {
  console.error(error);
});

// Floor texture and mesh
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('/Texture/Grunge.jpeg');
const floorGeometry = new THREE.PlaneGeometry(50, 50);
floorGeometry.rotateX(-Math.PI / 2);
floorGeometry.rotateY(Math.PI / 2);
const floorMaterial = new THREE.MeshPhongMaterial({ map: floorTexture });
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.position.set(0, -3, -5);
scene.add(floorMesh);

// ---------------- CSS3D Integration ----------------

// Select the HTML element with the class "project_title"
const textElement = document.querySelector('.project_title');
if (textElement) {
  // Remove fixed positioning so CSS3DRenderer can control it
  textElement.style.position = 'static';
  // Wrap the HTML element in a CSS3DObject and set its 3D transformation
  const cssObject = new CSS3DObject(textElement);
  cssObject.position.set(-305, -97, -0.5);  // Adjust as needed
  cssObject.scale.set(0.012, 0.012, 0.012);
  cssObject.rotation.set(0, Math.PI / 16, 0);
  cssObject.element.style.color = '#20C20E';
  scene.add(cssObject);
} else {
  console.warn('Element with class "project_title" not found.');
}

// ---------------- Lighting ----------------

const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(0, 30, 10);
topLight.castShadow = true;
topLight.angle = Math.PI / 4;
topLight.shadow.mapSize.width = 1024;
topLight.shadow.mapSize.height = 1024;
topLight.shadow.camera.near = 0.5;
topLight.shadow.camera.far = 50;
scene.add(topLight);

// ---------------- OrbitControls & Render Loop ----------------

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  css3dRenderer.render(scene, camera);
}
animate();

// ---------------- Handle Window Resize ----------------

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  css3dRenderer.setSize(window.innerWidth, window.innerHeight);
});
