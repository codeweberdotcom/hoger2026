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

// mesh name → THREE.Mesh reference (for live preview updates)
let meshMap = {};

let renderer, animId;

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

// ── Apply saved colorMap to preview meshes ─────────────────────────────────
function applyColorMap() {
  Object.entries(colorMap).forEach(([name, hex]) => {
    const mesh = meshMap[name];
    if (!mesh) return;
    mesh.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      side: THREE.DoubleSide,
    });
  });
}

// ── Build mesh list with wp-color-picker inputs ────────────────────────────
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
    child.userData.origMat = child.material;
  });

  if (!meshes.length) {
    meshList.innerHTML = '<p style="color:#999;font-size:13px">No meshes found.</p>';
    return;
  }

  const header = document.createElement("p");
  header.style.cssText = "font-weight:600;font-size:13px;margin:0 0 10px";
  header.textContent = `${meshes.length} mesh${meshes.length > 1 ? "es" : ""} found:`;
  meshList.appendChild(header);

  meshes.forEach(({ mesh, name }) => {
    const current = colorMap[name] || "";

    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;";

    // Label
    const label = document.createElement("span");
    label.style.cssText = "font-size:12px;font-family:monospace;word-break:break-all;flex:1;padding-top:5px;";
    label.textContent = name;

    // Color input (will be enhanced by wpColorPicker)
    const input = document.createElement("input");
    input.type        = "text";
    input.value       = current;
    input.placeholder = "#rrggbb";
    input.dataset.mesh = name;
    input.className   = "mn-mesh-color-pick small-text";
    input.style.cssText = "width:80px;";

    // Reset button
    const clearBtn = document.createElement("button");
    clearBtn.type  = "button";
    clearBtn.title = "Reset to default";
    clearBtn.style.cssText = "background:none;border:none;cursor:pointer;color:#aaa;font-size:16px;padding:0;line-height:1;flex-shrink:0;padding-top:3px;";
    clearBtn.textContent = "×";

    clearBtn.addEventListener("click", () => {
      delete colorMap[name];
      jsonInput.value = JSON.stringify(colorMap);
      // reset wpColorPicker value
      if (window.jQuery) {
        window.jQuery(input).wpColorPicker("color", "");
        window.jQuery(input).val("").trigger("change");
      }
      mesh.material = mesh.userData.origMat || new THREE.MeshStandardMaterial({ color: 0xcccccc });
    });

    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(clearBtn);
    meshList.appendChild(row);
  });

  // Apply existing colorMap to preview
  applyColorMap();
  jsonInput.value = JSON.stringify(colorMap);

  // Init wpColorPicker after DOM is ready
  if (window.jQuery && window.jQuery.fn.wpColorPicker) {
    window.jQuery(".mn-mesh-color-pick").wpColorPicker({
      change(event, ui) {
        const name  = event.target.dataset.mesh;
        const color = ui.color.toString();
        colorMap[name] = color;
        jsonInput.value = JSON.stringify(colorMap);
        const mesh = meshMap[name];
        if (mesh) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            side: THREE.DoubleSide,
          });
        }
      },
      clear(event) {
        const name = event.target.dataset.mesh;
        delete colorMap[name];
        jsonInput.value = JSON.stringify(colorMap);
        const mesh = meshMap[name];
        if (mesh) {
          mesh.material = mesh.userData.origMat || new THREE.MeshStandardMaterial({ color: 0xcccccc });
        }
      },
    });
  }
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
