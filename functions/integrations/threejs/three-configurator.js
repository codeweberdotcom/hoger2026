import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const textureLoader = new THREE.TextureLoader();

function initConfigurator(canvas) {
  const modelUrl     = canvas.getAttribute("data-three");
  const exposure     = parseFloat(canvas.getAttribute("data-exposure")     || "1.0");
  const saturation   = parseFloat(canvas.getAttribute("data-saturation")   || "1.0");
  const envIntensity = parseFloat(canvas.getAttribute("data-env-intensity") || "1.0");
  const envHdr         = canvas.getAttribute("data-env-hdr") || "";
  const envJpg         = canvas.getAttribute("data-env-jpg") || "";
  const envRotate      = canvas.getAttribute("data-env-rotate") === "1";
  const envRotateSpeed = parseFloat(canvas.getAttribute("data-env-rotate-speed") || "0.001");

  const camX        = canvas.getAttribute("data-cam-x");
  const camY        = canvas.getAttribute("data-cam-y");
  const camZ        = canvas.getAttribute("data-cam-z");
  const camTargetX  = canvas.getAttribute("data-cam-target-x");
  const camTargetY  = canvas.getAttribute("data-cam-target-y");
  const camTargetZ  = canvas.getAttribute("data-cam-target-z");
  const camDebug    = canvas.getAttribute("data-cam-debug") === "1";
  const hasSavedCam = camX !== "" && camY !== "" && camZ !== "";
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

  function disableSceneLights() {
    ambientLight.intensity = 0;
    dirLight.intensity = 0;
  }

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
  pmrem.compileEquirectangularShader();
  let envTexture = pmrem.fromScene(new RoomEnvironment()).texture; // fallback

  function applyEnv(tex) {
    envTexture = pmrem.fromEquirectangular(tex).texture;
    scene.environment = envTexture;
    tex.dispose();
    pmrem.dispose();
    disableSceneLights();
  }

  if (envHdr) {
    new RGBELoader().load(envHdr, applyEnv);
  } else if (envJpg) {
    const loader = new THREE.TextureLoader();
    loader.load(envJpg, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      applyEnv(tex);
    });
  } else {
    scene.environment = envTexture;
    pmrem.dispose();
  }

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

  // Debug overlay
  let debugEl = null;
  let debugTextEl = null;
  let debugTexSection = null;
  if (camDebug) {
    debugEl = document.createElement("div");
    debugEl.style.cssText = "position:absolute;top:10px;left:10px;z-index:100;background:rgba(0,0,0,.75);color:#fff;font:12px/1.5 monospace;padding:10px 12px;border-radius:6px;min-width:200px;";
    const wrap = canvas.parentElement;
    if (getComputedStyle(wrap).position === "static") wrap.style.position = "relative";

    debugTextEl = document.createElement("div");
    debugTextEl.style.pointerEvents = "none";
    debugEl.appendChild(debugTextEl);

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy cam";
    copyBtn.style.cssText = "margin-top:8px;padding:3px 10px;font-size:11px;cursor:pointer;display:block;";
    copyBtn.addEventListener("click", () => {
      const p = camera.position, t = controls.target;
      const txt = [p.x.toFixed(4), p.y.toFixed(4), p.z.toFixed(4), t.x.toFixed(4), t.y.toFixed(4), t.z.toFixed(4)].join("\n");
      navigator.clipboard.writeText(txt).then(() => {
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy cam"; }, 1500);
      });
    });
    debugEl.appendChild(copyBtn);

    debugTexSection = document.createElement("div");
    debugTexSection.style.cssText = "margin-top:10px;border-top:1px solid rgba(255,255,255,.3);padding-top:8px;display:none;";
    debugEl.appendChild(debugTexSection);

    wrap.appendChild(debugEl);
  }

  // Stored textures for debug visualization
  let _dbgColorMap = null;
  let _dbgRoughnessMap = null;
  let _dbgBumpMap = null;

  function _updateDebugTexButtons() {
    if (!debugTexSection) return;
    debugTexSection.innerHTML = "";
    if (!_dbgColorMap) return;

    const lbl = document.createElement("div");
    lbl.textContent = "Texture debug:";
    lbl.style.cssText = "font-size:10px;opacity:.65;margin-bottom:5px;";
    debugTexSection.appendChild(lbl);

    const btnCss = "display:block;width:100%;margin-bottom:3px;padding:3px 8px;font-size:11px;cursor:pointer;text-align:left;background:#222;color:#fff;border:1px solid #555;border-radius:3px;";

    function makeBtn(label, onClick) {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = btnCss;
      b.addEventListener("click", onClick);
      debugTexSection.appendChild(b);
    }

    makeBtn("▶ color map (normal)", () => {
      meshes.forEach((m) => { m.material.map = _dbgColorMap; m.material.color.set(0xffffff); m.material.needsUpdate = true; });
    });

    if (_dbgRoughnessMap) {
      makeBtn("▶ show roughnessMap", () => {
        meshes.forEach((m) => { m.material.map = _dbgRoughnessMap; m.material.color.set(0xffffff); m.material.needsUpdate = true; });
      });
    }

    if (_dbgBumpMap) {
      makeBtn("▶ show bumpMap", () => {
        meshes.forEach((m) => { m.material.map = _dbgBumpMap; m.material.color.set(0xffffff); m.material.needsUpdate = true; });
      });
    }

    debugTexSection.style.display = "block";
  }

  new GLTFLoader().load(modelUrl, (gltf) => {
    const model = gltf.scene;
    centerAndFit(model);

    if (hasSavedCam) {
      camera.position.set(parseFloat(camX), parseFloat(camY), parseFloat(camZ));
      controls.target.set(
        parseFloat(camTargetX || "0"),
        parseFloat(camTargetY || "0"),
        parseFloat(camTargetZ || "0")
      );
      controls.update();
    }

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
  canvas.applyTexture = (
    url,
    roughness = 0.9, metalness = 0,
    useModelUv = true, repeatX = 1, repeatY = 1, rotation = 0,
    reflectionMaskUrl = '', reflectionStrength = 1, roughnessMapDepth = 1,
    rmRepeatX = 1, rmRepeatY = 1, rmRotation = 0,
    bumpMapUrl = '', bumpScale = 1,
    bmRepeatX = 1, bmRepeatY = 1, bmRotation = 0
  ) => {
    if (!url) return;

    function applyUvParams(tex, rx, ry, rot) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(rx, ry);
      tex.center.set(0.5, 0.5);
      tex.rotation = rot * (Math.PI / 180);
    }

    textureLoader.load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      if (!useModelUv) applyUvParams(texture, repeatX, repeatY, rotation);
      _dbgColorMap = texture;
      meshes.forEach((mesh) => {
        mesh.material.map = texture;
        mesh.material.color.set(0xffffff);
        // roughnessMapDepth controls the effective range of roughnessMap (0=no effect, 1=full range).
        // Without it, gloss/chrome (roughness=0.05) would give near-zero variation.
        mesh.material.roughness = reflectionMaskUrl ? roughnessMapDepth : roughness;
        mesh.material.metalness = metalness;
        mesh.material.envMap = envTexture;
        mesh.material.envMapIntensity = envIntensity * reflectionStrength;
        mesh.material.needsUpdate = true;
      });
      _updateDebugTexButtons();
    });

    if (reflectionMaskUrl) {
      textureLoader.load(reflectionMaskUrl, (tex) => {
        applyUvParams(tex, rmRepeatX, rmRepeatY, rmRotation);
        _dbgRoughnessMap = tex;
        meshes.forEach((mesh) => {
          mesh.material.roughnessMap = tex;
          mesh.material.needsUpdate = true;
        });
        _updateDebugTexButtons();
      }, undefined, (err) => {
        console.error('[hoger-conf] roughnessMap FAILED to load:', reflectionMaskUrl, err);
      });
    } else {
      _dbgRoughnessMap = null;
      meshes.forEach((mesh) => { mesh.material.roughnessMap = null; mesh.material.needsUpdate = true; });
    }

    if (bumpMapUrl) {
      textureLoader.load(bumpMapUrl, (tex) => {
        applyUvParams(tex, bmRepeatX, bmRepeatY, bmRotation);
        _dbgBumpMap = tex;
        meshes.forEach((mesh) => {
          mesh.material.bumpMap = tex;
          mesh.material.bumpScale = bumpScale;
          mesh.material.needsUpdate = true;
        });
        _updateDebugTexButtons();
      }, undefined, (err) => {
        console.error('[hoger-conf] bumpMap FAILED to load:', bumpMapUrl, err);
      });
    } else {
      _dbgBumpMap = null;
      meshes.forEach((mesh) => { mesh.material.bumpMap = null; mesh.material.bumpScale = 1; mesh.material.needsUpdate = true; });
    }
  };

  let envAngle = 0;

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (envRotate && meshes.length) {
      envAngle += envRotateSpeed;
      meshes.forEach((mesh) => {
        mesh.material.envMapRotation.y = envAngle;
      });
    }
    if (debugTextEl) {
      const p = camera.position, t = controls.target;
      debugTextEl.innerHTML =
        "<b>Camera</b><br>" +
        "X:&nbsp;" + p.x.toFixed(4) + "<br>" +
        "Y:&nbsp;" + p.y.toFixed(4) + "<br>" +
        "Z:&nbsp;" + p.z.toFixed(4) + "<br>" +
        "<b>Target</b><br>" +
        "X:&nbsp;" + t.x.toFixed(4) + "<br>" +
        "Y:&nbsp;" + t.y.toFixed(4) + "<br>" +
        "Z:&nbsp;" + t.z.toFixed(4);
    }
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
            surface.roughness               ?? 0.9,
            surface.metalness               ?? 0,
            surface.useModelUv              ?? true,
            surface.repeatX                 ?? 1,
            surface.repeatY                 ?? 1,
            surface.rotation                ?? 0,
            surface.reflectionMask          ?? '',
            surface.reflectionStrength      ?? 1,
            surface.roughnessMapDepth       ?? 1,
            surface.reflectionMaskRepeatX   ?? 1,
            surface.reflectionMaskRepeatY   ?? 1,
            surface.reflectionMaskRotation  ?? 0,
            surface.bumpMap                 ?? '',
            surface.bumpScale               ?? 1,
            surface.bumpMapRepeatX          ?? 1,
            surface.bumpMapRepeatY          ?? 1,
            surface.bumpMapRotation         ?? 0
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
