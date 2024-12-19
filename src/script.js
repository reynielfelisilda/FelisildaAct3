import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as CANNON from "cannon-es";
import * as dat from "lil-gui";

/**
 * Debug GUI
 */
const gui = new dat.GUI();

/**
 * Base Setup
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Physics World
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 3, 10);
scene.add(camera);

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Particles
 */
const particlesCount = 2000;
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20; // Spread out particles
}
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

const particlesMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.05,
});
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/**
 * Galaxy Generator
 */
const galaxyGeometry = new THREE.BufferGeometry();
const galaxyMaterial = new THREE.PointsMaterial({
  size: 0.02,
  color: 0xff0000,
});
const galaxyCount = 2000;
const galaxyPositions = new Float32Array(galaxyCount * 3);

for (let i = 0; i < galaxyCount; i++) {
  const angle = i * 0.1;
  const radius = Math.sqrt(i) * 0.05;
  const x = radius * Math.cos(angle);
  const y = (Math.random() - 0.5) * 0.5;
  const z = radius * Math.sin(angle);
  galaxyPositions.set([x, y, z], i * 3);
}

galaxyGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(galaxyPositions, 3)
);
const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
scene.add(galaxy);

/**
 * Physics Cube
 */
// Physics Box
const boxBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
  position: new CANNON.Vec3(0, 5, 0),
});
world.addBody(boxBody);

// Three.js Cube
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial()
);
scene.add(cube);

// Physics Ground
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

/**
 * Raycasting and Mouse Events
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
});

window.addEventListener("click", () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    intersects[0].object.material.color.set(0x00ff00);
  }
});

/**
 * Model Loader
 */
const gltfLoader = new GLTFLoader();
gltfLoader.load("models/model.gltf", (gltf) => {
  gltf.scene.position.set(0, 0, -5);
  scene.add(gltf.scene);
});

/**
 * Scroll-Based Animation
 */
window.addEventListener("scroll", () => {
  const scrollY = window.scrollY / sizes.height;
  camera.position.y = -scrollY * 2;
  camera.position.z = 10 + scrollY * 2;
});

/**
 * Animation Loop
 */
const clock = new THREE.Clock();
const tick = () => {
  const deltaTime = clock.getDelta();

  // Update Physics
  world.step(1 / 60, deltaTime, 3);
  cube.position.copy(boxBody.position);
  cube.quaternion.copy(boxBody.quaternion);

  // Raycaster updates
  raycaster.setFromCamera(mouse, camera);

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Request next frame
  window.requestAnimationFrame(tick);
};

tick();
