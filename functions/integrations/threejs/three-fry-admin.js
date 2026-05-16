import * as THREE from "three";
import { OBJLoader }  from "three/addons/loaders/OBJLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader }  from "three/addons/loaders/FBXLoader.js";

const box       = document.getElementById("mn-mesh-colors-box");
if (!box) throw new Error("three-fry-admin: meta box not found");

const canvas    = document.getElementById("mn-mesh-preview-canvas");
const meshList  = document.getElementById("mn-mesh-list");
const jsonInput = document.getElementById("mn_mesh_colors");
const loadBtn   = document.getElementById("mn-load-model-btn");
const statusEl  = document.getElementById("mn-load-status");

let colorMap = {};
try { colorMap = JSON.parse(jsonInput.value || "{}"); } catch(e) {}

let renderer, animId;

// ── Get model URL via WP REST API ──────────────────────────────────────────
function getModelUrl() {
  const id = (document.getElementById("mn_model_file") || {}).value;
  if (!id || id === "0") return Promise.resolve(null);

  const root = (window.wpApiSettings && window.wpApiSettings.root)
    ? window.wpApiSettings.root
    : "/wp-json/";
  const nonce = (window.wpApiSettings && window.wpApiSettings.nonce)
    ? window.wpApiSettings.nonce
    : "";

  return fetch(`${root}wp/v2/media/${id}`, {
    headers: nonce ? { "X-WP-Nonce": nonce } : {},
    credentials: "same-origin",
  })
    .then(r => r.ok ? r.json() : null)
    .then(data => data ? (data.source_url || null) : null);
}

// ── Center object in scene ─────────────────────────────────────────────────
function centerAndFit(object, camera, controls) {
  object.updateMatrixWorld(true);
  const b    = new THREE.Box3().setFromObject(object);
  const size = b.getSize(new THREE.Vector3());
  const max  = Math.max(size.x, size.y, size.z);
  object.scale.setScalar(2 / max);
  object.updateMatrixWorld(true);
  const b2     = new THREE.Box3().setFromObject(object);
  const center = b2.getCenter(new THREE.Vector3());
  object.position.sub(center);
  const fov     = camera.fov * (Math.PI / 180);
  const fitted  = (b2.getSize(new THREE.Vector3()).y / 2) / Math.tan(fov / 2) * 1.5;
  camera.position.set(0, 0, Math.max(fitted, 3));
  camera.lookAt(0, 0, 0);
}

// ── Apply saved colorMap to preview model ──────────────────────────────────
function applyColorMap(object) {
  let idx = 0;
  object.traverse(child => {
    if (!child.isMesh) return;
    const name = child.name || `mesh_${idx++}`;
    if (colorMap[name]) {
      child.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorMap[name]),
        side: THREE.DoubleSide,
      });
    }
  });
}

// ── Build color-picker rows ────────────────────────────────────────────────
function buildMeshList(object) {
  meshList.innerHTML = "";
  const meshes = [];
  let idx = 0;
  object.traverse(child => {
    if (child.isMesh) meshes.push({ mesh: child, name: child.name || `mesh_${idx++}` });
  });

  if (!meshes.length) {
    meshList.innerHTML = '<p style="color:#999;font-size:13px">No meshes found in this model.</p>';
    return;
  }

  const header = document.createElement("p");
  header.style.cssText = "font-weight:600;font-size:13px;margin:0 0 8px";
  header.textContent = `${meshes.length} mesh${meshes.length > 1 ? "es" : ""} found:`;
  meshList.appendChild(header);

  meshes.forEach(({ mesh, name }) => {
    const current = colorMap[name] || "";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:5px;";

    const picker = document.createElement("input");
    picker.type  = "color";
    picker.value = current || "#cccccc";
    picker.style.cssText = "width:36px;height:26px;padding:1px;border:1px solid #ccc;cursor:pointer;border-radius:3px;flex-shrink:0;";

    const label = document.createElement("span");
    label.style.cssText = "font-size:12px;font-family:monospace;word-break:break-all;";
    label.textContent = name;

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.title = "Reset (use default color)";
    clearBtn.style.cssText = "background:none;border:none;cursor:pointer;color:#aaa;font-size:14px;padding:0;flex-shrink:0;";
    clearBtn.textContent = "×";

    // sync color changes to colorMap + preview
    picker.addEventListener("input", e => {
      colorMap[name] = e.target.value;
      jsonInput.value = JSON.stringify(colorMap);
      mesh.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(e.target.value),
        side: THREE.DoubleSide,
      });
    });

    clearBtn.addEventListener("click", () => {
      delete colorMap[name];
      jsonInput.value = JSON.stringify(colorMap);
      picker.value = "#cccccc";
      mesh.material = mesh.userData.origMat || new THREE.MeshStandardMaterial({ color: 0xcccccc });
    });

    // store original material for reset
    mesh.userData.origMat = mesh.material.clone ? mesh.material.clone() : mesh.material;

    row.appendChild(picker);
    row.appendChild(label);
    row.appendChild(clearBtn);
    meshList.appendChild(row);
  });

  // Apply existing colorMap to mesh materials
  applyColorMap(object);
  jsonInput.value = JSON.stringify(colorMap);
}

// ── Load model & init mini scene ───────────────────────────────────────────
function loadModel(url) {
  statusEl.textContent = "Loading…";
  loadBtn.disabled = true;
  meshList.innerHTML = "";

  // Cleanup previous renderer
  if (animId) cancelAnimationFrame(animId);
  if (renderer) renderer.dispose();

  const scene    = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f2f5);

  const w = canvas.offsetWidth  || 300;
  const h = canvas.offsetHeight || 300;
  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 10000);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);

  scene.add(new THREE.AmbientLight(0xffffff, 5));
  const dir = new THREE.DirectionalLight(0xffffff, 3);
  dir.position.set(10, 20, 15);
  scene.add(dir);

  // Simple rotation for preview
  let rotY = 0;

  function onLoad(object) {
    centerAndFit(object, camera);
    scene.add(object);
    buildMeshList(object);
    statusEl.textContent = "";
    loadBtn.disabled = false;

    function animate() {
      animId = requestAnimationFrame(animate);
      object.rotation.y = rotY += 0.005;
      renderer.render(scene, camera);
    }
    animate();
  }

  function onError(e) {
    statusEl.textContent = "Load error. Check the file.";
    loadBtn.disabled = false;
    console.error("three-fry-admin:", e);
  }

  const ext = url.split(".").pop().toLowerCase();
  if (ext === "fbx") {
    new FBXLoader().load(url, onLoad, undefined, onError);
  } else if (ext === "glb" || ext === "gltf") {
    new GLTFLoader().load(url, gltf => onLoad(gltf.scene), undefined, onError);
  } else if (ext === "obj") {
    new OBJLoader().load(url, onLoad, undefined, onError);
  } else {
    statusEl.textContent = "Unsupported format: " + ext;
    loadBtn.disabled = false;
  }
}

// ── Button handler ─────────────────────────────────────────────────────────
loadBtn.addEventListener("click", () => {
  getModelUrl().then(url => {
    if (url) {
      loadModel(url);
    } else {
      statusEl.textContent = "No 3D model file assigned yet.";
    }
  }).catch(() => {
    statusEl.textContent = "Could not fetch model URL.";
  });
});

// ── Auto-load if model already assigned ───────────────────────────────────
const existingId = (document.getElementById("mn_model_file") || {}).value;
if (existingId && existingId !== "0") {
  getModelUrl().then(url => { if (url) loadModel(url); });
}
