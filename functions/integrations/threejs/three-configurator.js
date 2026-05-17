import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const textureLoader = new THREE.TextureLoader();

function initConfigurator(canvas) {
  const modelUrl     = canvas.getAttribute("data-three");
  const exposure     = parseFloat(canvas.getAttribute("data-exposure")     || "1.0");
  const saturation   = parseFloat(canvas.getAttribute("data-saturation")   || "1.0");
  const envIntensity = parseFloat(canvas.getAttribute("data-env-intensity") || "1.0");
  let confMeshes = [];
  try {
    const parsed = JSON.parse(canvas.getAttribute("data-conf-meshes") || "[]");
    confMeshes = Array.isArray(parsed) ? parsed : [];
  } catch (e) {}
  if (!modelUrl) return;

  const container = canvas.parentElement;
  const w = container.offsetWidth;
  const h = container.offsetHeight || w;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6f7f9);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(10, 20, 15);
  scene.add(dirLight);

  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 10000);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = exposure;
  canvas.style.filter = saturation !== 1 ? `saturate(${saturation})` : "";

  console.log("[hoger-conf] exposure:", exposure, "| saturation:", saturation, "| envIntensity:", envIntensity);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment()).texture;
  scene.environment = envTexture;
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
      const origColor = child.material?.color
        ? child.material.color.clone()
        : new THREE.Color(0xcccccc);
      const isTarget = !confMeshes.length || confMeshes.includes(child.name);
      child.material = new THREE.MeshStandardMaterial({
        color: origColor,
        side: THREE.DoubleSide,
        envMap: isTarget ? envTexture : null,
        envMapIntensity: isTarget ? envIntensity : 0,
        roughness: isTarget ? 0.5 : 0.9,
        metalness: isTarget ? 0.1 : 0,
      });
      if (isTarget) meshes.push(child);
    });
  });

  // Expose texture-apply function globally
  canvas.applyTexture = (url, roughness = 0.9, metalness = 0, useModelUv = true, repeatX = 1, repeatY = 1, rotation = 0) => {
    if (!url) return;
    textureLoader.load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      if (!useModelUv) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.center.set(0.5, 0.5);
        texture.rotation = rotation * (Math.PI / 180);
      }
      meshes.forEach((mesh) => {
        mesh.material.map = texture;
        mesh.material.color.set(0xffffff);
        mesh.material.roughness = roughness;
        mesh.material.metalness = metalness;
        mesh.material.envMap = envTexture;
        mesh.material.envMapIntensity = envIntensity;
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
          const surface = surfaces[activeType];
          canvas.applyTexture(
            color.photo,
            surface.roughness  ?? 0.9,
            surface.metalness  ?? 0,
            surface.useModelUv ?? true,
            surface.repeatX    ?? 1,
            surface.repeatY    ?? 1,
            surface.rotation   ?? 0
          );
        }
      });

      colorsEl.appendChild(btn);
    });
  }

  renderTypes();
  renderColors();
}

document.addEventListener("DOMContentLoaded", initSurfacePicker);
