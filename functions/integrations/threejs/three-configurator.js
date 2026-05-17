import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const textureLoader = new THREE.TextureLoader();

function initConfigurator(canvas) {
  const modelUrl = canvas.getAttribute("data-three");
  if (!modelUrl) return;

  const container = canvas.parentElement;
  const w = container.offsetWidth;
  const h = container.offsetHeight || w;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6f7f9);

  const ambientLight = new THREE.AmbientLight(0xffffff, 4);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 3);
  dirLight.position.set(10, 20, 15);
  scene.add(dirLight);

  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 10000);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment()).texture;
  pmrem.dispose();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;

  canvas.style.cursor = "grab";
  canvas.addEventListener("mousedown", () => { canvas.style.cursor = "grabbing"; });
  document.addEventListener("mouseup", () => { canvas.style.cursor = "grab"; });

  let meshes = [];

  function centerAndFit(object) {
    object.updateMatrixWorld(true);
    const box  = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const max  = Math.max(size.x, size.y, size.z);
    object.scale.setScalar(2 / max);
    object.updateMatrixWorld(true);
    const box2   = new THREE.Box3().setFromObject(object);
    const center = box2.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const fov    = camera.fov * (Math.PI / 180);
    const fitted = (box2.getSize(new THREE.Vector3()).y / 2) / Math.tan(fov / 2) * 1.5;
    camera.position.set(0, 0, Math.max(fitted, 3));
    controls.target.set(0, 0, 0);
    controls.update();
  }

  new GLTFLoader().load(modelUrl, (gltf) => {
    const model = gltf.scene;
    centerAndFit(model);
    scene.add(model);

    model.traverse((child) => {
      if (!child.isMesh) return;
      child.material = child.material.clone();
      child.material.side = THREE.DoubleSide;
      meshes.push(child);
    });
  });

  // Expose texture-apply function globally
  canvas.applyTexture = (url, roughness = 0.9, metalness = 0) => {
    if (!url) return;
    textureLoader.load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      meshes.forEach((mesh) => {
        mesh.material.map = texture;
        mesh.material.color.set(0xffffff);
        mesh.material.roughness = roughness;
        mesh.material.metalness = metalness;
        mesh.material.needsUpdate = true;
      });
    });
  };

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    const nw = container.offsetWidth;
    const nh = container.offsetHeight || nw;
    renderer.setSize(nw, nh);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  });
}

// ── UI: surface picker ────────────────────────────────────────────────────────

function initSurfacePicker() {
  const root = document.getElementById("hoger-configurator");
  if (!root) return;

  const canvas = root.querySelector("canvas[data-configurator]");
  if (!canvas) return;

  initConfigurator(canvas);

  const surfaces = window.hogerSurfaces || [];
  if (!surfaces.length) return;

  const picker = root.querySelector(".hoger-surface-picker");
  if (!picker) return;

  let activeType = null;
  let activeColor = null;

  function renderTypes() {
    const typesEl = picker.querySelector(".hoger-surface-types");
    typesEl.innerHTML = "";

    surfaces.forEach((surface, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hoger-surface-type-btn" + (activeType === idx ? " is-active" : "");
      btn.title = surface.title;

      if (surface.main_photo) {
        const img = document.createElement("img");
        img.src = surface.main_photo;
        img.alt = surface.title;
        btn.appendChild(img);
      }

      const label = document.createElement("span");
      label.textContent = surface.title;
      btn.appendChild(label);

      btn.addEventListener("click", () => {
        activeType = idx;
        activeColor = null;
        renderTypes();
        renderColors();
      });

      typesEl.appendChild(btn);
    });
  }

  function renderColors() {
    const colorsEl = picker.querySelector(".hoger-surface-colors");
    colorsEl.innerHTML = "";

    if (activeType === null) return;
    const surface = surfaces[activeType];
    if (!surface.colors || !surface.colors.length) {
      colorsEl.innerHTML = '<p class="hoger-conf-empty">No colors available.</p>';
      return;
    }

    surface.colors.forEach((color, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hoger-surface-color-btn" + (activeColor === idx ? " is-active" : "");
      btn.title = color.name;

      if (color.photo) {
        const img = document.createElement("img");
        img.src = color.photo;
        img.alt = color.name;
        btn.appendChild(img);
      }

      const label = document.createElement("span");
      label.textContent = color.name;
      btn.appendChild(label);

      btn.addEventListener("click", () => {
        activeColor = idx;
        renderColors();
        if (color.photo && canvas.applyTexture) {
          canvas.applyTexture(color.photo, color.roughness ?? 0.9, color.metalness ?? 0);
        }
      });

      colorsEl.appendChild(btn);
    });
  }

  renderTypes();
  renderColors();
}

document.addEventListener("DOMContentLoaded", initSurfacePicker);
