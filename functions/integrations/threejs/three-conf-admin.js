import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

function initConfMeshAdmin() {
  const box = document.getElementById("mn-conf-meshes-box");
  if (!box) return;

  const modelUrl = box.dataset.modelUrl;
  const btn      = document.getElementById("mn-conf-load-btn");
  const status   = document.getElementById("mn-conf-status");
  const list     = document.getElementById("mn-conf-mesh-list");
  const input    = document.getElementById("mn_conf_meshes");

  if (!btn || !input) return;

  let savedMeshes = [];
  try {
    const parsed = JSON.parse(input.value || "[]");
    savedMeshes = Array.isArray(parsed) ? parsed : [];
  } catch (e) {}

  function updateHidden() {
    const checked = Array.from(list.querySelectorAll("input[type=checkbox]:checked")).map((cb) => cb.value);
    input.value = JSON.stringify(checked);
  }

  function buildList(names) {
    list.innerHTML = "";
    if (!names.length) {
      list.innerHTML = '<p style="color:#999;font-size:13px;margin:0">No meshes found.</p>';
      return;
    }
    names.forEach((name) => {
      const label = document.createElement("label");
      label.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer;font-size:13px;";
      const cb = document.createElement("input");
      cb.type    = "checkbox";
      cb.value   = name;
      cb.checked = savedMeshes.includes(name);
      cb.addEventListener("change", updateHidden);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(name));
      list.appendChild(label);
    });
  }

  btn.addEventListener("click", () => {
    if (!modelUrl) { status.textContent = "No model file selected."; return; }
    status.textContent = "Loading…";
    btn.disabled = true;

    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        const names = [];
        gltf.scene.traverse((child) => {
          if (child.isMesh && child.name) names.push(child.name);
        });
        buildList(names);
        status.textContent = names.length + " mesh(es) detected.";
        btn.disabled = false;
      },
      undefined,
      () => { status.textContent = "Error loading model."; btn.disabled = false; }
    );
  });

  if (modelUrl && savedMeshes.length) btn.click();
}

document.addEventListener("DOMContentLoaded", initConfMeshAdmin);
