import * as THREE from "three";
import { OBJLoader }  from "three/addons/loaders/OBJLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader }  from "three/addons/loaders/FBXLoader.js";

const box       = document.getElementById("mn-mesh-colors-box");
if (!box) throw new Error("three-fry-admin: meta box not found");

const canvas    = document.getElementById("mn-mesh-preview-canvas");
const meshList  = document.getElementById("mn-mesh-list");
const jsonInput = document.getElementById("mn_mesh_colors");
const confInput = document.getElementById("mn_conf_meshes");
const loadBtn   = document.getElementById("mn-load-model-btn");
const statusEl  = document.getElementById("mn-load-status");

let confMeshes = [];
try {
  const parsed = JSON.parse(confInput ? confInput.value || "[]" : "[]");
  confMeshes = Array.isArray(parsed) ? parsed : [];
} catch (e) {}

let meshMap = {};
let renderer, animId;

const matDefault  = () => new THREE.MeshStandardMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
const matSelected = () => new THREE.MeshStandardMaterial({ color: 0x9c886f, side: THREE.DoubleSide, metalness: 0.2, roughness: 0.5 });
const matHover    = () => new THREE.MeshStandardMaterial({ color: 0xc4a882, side: THREE.DoubleSide });

// ── Get model URL via WP REST API ──────────────────────────────────────────
function getModelUrl() {
  const id = (document.getElementById("mn_model_file") || {}).value;
  if (!id || id === "0") return Promise.resolve(null);

  const root  = (window.wpApiSettings && window.wpApiSettings.root)  || "/wp-json/";
  const nonce = (window.wpApiSettings && window.wpApiSettings.nonce) || "";

  return fetch(`${root}wp/v2/media/${id}`, {
    headers: nonce ? { "X-WP-Nonce": nonce } : {},
    credentials: "same-origin",
  })
    .then(r => r.ok ? r.json() : null)
    .then(data => data ? (data.source_url || null) : null);
}

// ── Center object in scene ─────────────────────────────────────────────────
function centerAndFit(object, camera) {
  object.updateMatrixWorld(true);
  const b    = new THREE.Box3().setFromObject(object);
  const size = b.getSize(new THREE.Vector3());
  const max  = Math.max(size.x, size.y, size.z);
  object.scale.setScalar(2 / max);
  object.updateMatrixWorld(true);
  const b2     = new THREE.Box3().setFromObject(object);
  const center = b2.getCenter(new THREE.Vector3());
  object.position.sub(center);
  const fov    = camera.fov * (Math.PI / 180);
  const fitted = (b2.getSize(new THREE.Vector3()).y / 2) / Math.tan(fov / 2) * 1.5;
  camera.position.set(0, 0, Math.max(fitted, 3));
  camera.lookAt(0, 0, 0);
}

// ── Build mesh list with checkboxes ────────────────────────────────────────
function buildMeshList(object) {
  meshList.innerHTML = "";
  meshMap = {};

  const meshes = [];
  let idx = 0;
  object.traverse(child => {
    if (!child.isMesh) return;
    const name = child.name || `mesh_${idx++}`;
    meshes.push({ mesh: child, name });
    meshMap[name] = child;
    child.material = confMeshes.includes(name) ? matSelected() : matDefault();
  });

  if (!meshes.length) {
    meshList.innerHTML = '<p style="color:#999;font-size:13px">No meshes found.</p>';
    return;
  }

  const header = document.createElement("p");
  header.style.cssText = "font-weight:600;font-size:13px;margin:0 0 8px;";
  header.textContent = `${meshes.length} mesh(es) — check to include in configurator:`;
  meshList.appendChild(header);

  const selectAll = document.createElement("label");
  selectAll.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:12px;color:#555;cursor:pointer;border-bottom:1px solid #eee;padding-bottom:8px;";
  const selectAllCb = document.createElement("input");
  selectAllCb.type = "checkbox";
  selectAll.appendChild(selectAllCb);
  selectAll.appendChild(document.createTextNode("Select all"));
  selectAll.addEventListener("change", () => {
    meshList.querySelectorAll(".mn-conf-cb").forEach(cb => {
      cb.checked = selectAllCb.checked;
      cb.dispatchEvent(new Event("change"));
    });
  });
  meshList.appendChild(selectAll);

  meshes.forEach(({ mesh, name }) => {
    const isChecked = confMeshes.includes(name);

    const row = document.createElement("label");
    row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:4px;cursor:pointer;padding:4px 6px;border-radius:3px;transition:background .1s;";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "mn-conf-cb";
    cb.value = name;
    cb.checked = isChecked;

    cb.addEventListener("change", () => {
      if (cb.checked) {
        if (!confMeshes.includes(name)) confMeshes.push(name);
        mesh.material = matSelected();
      } else {
        confMeshes = confMeshes.filter(n => n !== name);
        mesh.material = matDefault();
      }
      if (confInput) confInput.value = JSON.stringify(confMeshes);
      if (jsonInput) jsonInput.value = "{}";
    });

    row.addEventListener("mouseenter", () => {
      if (!cb.checked) mesh.material = matHover();
      row.style.background = "#f0ece6";
    });
    row.addEventListener("mouseleave", () => {
      mesh.material = cb.checked ? matSelected() : matDefault();
      row.style.background = "";
    });

    const nameSpan = document.createElement("span");
    nameSpan.style.cssText = "font-size:12px;font-family:monospace;word-break:break-all;";
    nameSpan.textContent = name;

    row.appendChild(cb);
    row.appendChild(nameSpan);
    meshList.appendChild(row);
  });

  if (confInput) confInput.value = JSON.stringify(confMeshes);
  if (jsonInput) jsonInput.value = "{}";
}

// ── Load model & init mini scene ───────────────────────────────────────────
function loadModel(url) {
  statusEl.textContent = "Loading…";
  loadBtn.disabled = true;
  meshList.innerHTML = "";

  if (animId) cancelAnimationFrame(animId);
  if (renderer) renderer.dispose();

  const scene  = new THREE.Scene();
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
  getModelUrl()
    .then(url => {
      url ? loadModel(url) : (statusEl.textContent = "No 3D model file assigned yet.");
    })
    .catch(() => { statusEl.textContent = "Could not fetch model URL."; });
});

// ── Auto-load if model already assigned ───────────────────────────────────
const existingId = (document.getElementById("mn_model_file") || {}).value;
if (existingId && existingId !== "0") {
  getModelUrl().then(url => { if (url) loadModel(url); });
}
