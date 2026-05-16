import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function softColor(hex, amount = 0.7) {
  const col = new THREE.Color(hex);
  col.lerp(new THREE.Color(0xffffff), amount);
  return col;
}

function initFryScene(canvas) {
  const modelUrl    = canvas.getAttribute("data-three");
  const bgHex       = canvas.getAttribute("data-bg-color")    || "#f2f2fb";
  const edgeHex     = canvas.getAttribute("data-edge-color")  || "#0057b8";
  const bgSoft      = canvas.getAttribute("data-bg-soft")     === "1";
  const edgeSoft    = canvas.getAttribute("data-edge-soft")   === "1";
  const autoRotate   = canvas.getAttribute("data-auto-rotate")  !== "0";
  const rotateSpeed  = parseFloat(canvas.getAttribute("data-rotate-speed") || "0.5");
  const showPlay     = canvas.getAttribute("data-show-play")   !== "0";
  const showEdges   = canvas.getAttribute("data-show-edges")  !== "0";
  const enableZoom  = canvas.getAttribute("data-enable-zoom") === "1";
  const enableOrbit    = canvas.getAttribute("data-enable-orbit")     !== "0";
  const useFbxColors   = canvas.getAttribute("data-use-fbx-colors")  === "1";

  if (!modelUrl) return;

  const bgCol   = bgSoft   ? softColor(bgHex)   : new THREE.Color(bgHex);
  const edgeCol = edgeSoft ? softColor(edgeHex) : new THREE.Color(edgeHex);

  const scene = new THREE.Scene();
  scene.background = bgCol;

  const ambientLight = new THREE.AmbientLight(0xffffff, 6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 4);
  dirLight.position.set(20, 70, 50);
  scene.add(dirLight);

  const container = canvas.parentElement;
  const w = container.offsetWidth;
  const h = container.offsetHeight || w;

  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 10000);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping     = true;
  controls.dampingFactor     = 0.25;
  controls.screenSpacePanning = false;
  controls.autoRotate        = autoRotate;
  controls.autoRotateSpeed   = rotateSpeed;
  controls.enableZoom        = enableZoom;
  controls.enableRotate      = enableOrbit;

  // Cursor
  if (enableOrbit) {
    canvas.style.cursor = "grab";
    canvas.addEventListener("mousedown", () => { canvas.style.cursor = "grabbing"; });
    document.addEventListener("mouseup",  () => { canvas.style.cursor = "grab"; });
  }

  container.style.position = "relative";

  // ── Play / Pause button ──────────────────────────────────────────────────
  let isRotating = autoRotate;

  if (showPlay) {
    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "btn btn-circle btn-primary btn-sm";
    playBtn.style.cssText = "position:absolute;top:12px;left:12px;z-index:10;";
    playBtn.innerHTML = isRotating
      ? '<i class="uil uil-pause"></i>'
      : '<i class="uil uil-play"></i>';

    playBtn.addEventListener("click", () => {
      isRotating = !isRotating;
      controls.autoRotate = isRotating;
      playBtn.innerHTML = isRotating
        ? '<i class="uil uil-pause"></i>'
        : '<i class="uil uil-play"></i>';
    });

    container.appendChild(playBtn);
  }

  // ── Edges toggle (built after model loads for FBX/GLB) ───────────────────
  let edgesVisible = true;
  let loadedModel  = null;

  function buildEdgesBtn() {
    if (!showEdges) return;

    const edgesBtn = document.createElement("button");
    edgesBtn.type = "button";
    edgesBtn.className = "btn btn-circle btn-primary btn-sm";
    edgesBtn.style.cssText = "position:absolute;top:60px;left:12px;z-index:10;";
    edgesBtn.innerHTML = '<i class="uil uil-eye-slash"></i>';

    edgesBtn.addEventListener("click", () => {
      edgesVisible = !edgesVisible;
      edgesBtn.innerHTML = edgesVisible
        ? '<i class="uil uil-eye-slash"></i>'
        : '<i class="uil uil-eye"></i>';

      loadedModel && loadedModel.traverse((child) => {
        if (!child.isMesh) return;
        if (edgesVisible) {
          if (!useFbxColors) {
            child.material = new THREE.MeshBasicMaterial({ color: bgCol, side: THREE.DoubleSide });
          }
          if (child.userData.edgeLines) child.add(child.userData.edgeLines);
        } else {
          if (useFbxColors) {
            child.material = child.userData.origMaterial || new THREE.MeshStandardMaterial({
              color: new THREE.Color(child.userData.origColor || 0xcccccc),
              side: THREE.DoubleSide,
            });
          } else {
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(child.userData.origColor || 0xcccccc),
              side: THREE.DoubleSide,
              metalness: 0.5,
              roughness: 0.4,
            });
          }
          if (child.userData.edgeLines) child.remove(child.userData.edgeLines);
        }
      });
    });

    container.appendChild(edgesBtn);
  }

  // ── Center + scale helper ────────────────────────────────────────────────
  function centerAndFit(object) {
    // Apply scale=1 first so Box3 measures real geometry
    object.updateMatrixWorld(true);

    const box  = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Scale so largest dimension = 2 units
    const scale = 2 / maxDim;
    object.scale.setScalar(scale);
    object.updateMatrixWorld(true);

    // Re-measure after scaling and move centroid to origin
    const box2   = new THREE.Box3().setFromObject(object);
    const center = box2.getCenter(new THREE.Vector3());
    object.position.sub(center);

    // Place camera so object fits in view
    const fov      = camera.fov * (Math.PI / 180);
    const fittedZ  = (box2.getSize(new THREE.Vector3()).y / 2) / Math.tan(fov / 2) * 1.5;
    camera.position.set(0, 0, Math.max(fittedZ, 3));
    controls.target.set(0, 0, 0);
    controls.update();
  }

  // ── Apply fry-style materials ────────────────────────────────────────────
  function applyFryStyle(object, withEdgesBtn = false) {
    loadedModel = object;
    centerAndFit(object);

    object.traverse((child) => {
      if (!child.isMesh) return;
      child.userData.origMaterial = child.material;
      child.userData.origColor = child.material && child.material.color
        ? child.material.color.getHex()
        : 0xcccccc;

      if (!useFbxColors) {
        child.material = new THREE.MeshBasicMaterial({ color: bgCol, side: THREE.DoubleSide });
      }

      const edgeLines = new THREE.LineSegments(
        new THREE.EdgesGeometry(child.geometry),
        new THREE.LineBasicMaterial({ color: edgeCol })
      );
      child.userData.edgeLines = edgeLines;
      child.add(edgeLines);
    });

    if (withEdgesBtn) buildEdgesBtn();
  }

  // ── Load ─────────────────────────────────────────────────────────────────
  const ext = modelUrl.split(".").pop().toLowerCase();

  if (ext === "obj") {
    new OBJLoader().load(modelUrl, (obj) => { applyFryStyle(obj, false); scene.add(obj); });
  } else if (ext === "glb" || ext === "gltf") {
    new GLTFLoader().load(modelUrl, (gltf) => { applyFryStyle(gltf.scene, true); scene.add(gltf.scene); });
  } else if (ext === "fbx") {
    new FBXLoader().load(modelUrl, (obj) => { applyFryStyle(obj, true); scene.add(obj); });
  } else {
    console.error("three-fry: unsupported format " + ext);
    return;
  }

  // ── Render loop ──────────────────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // ── Resize ───────────────────────────────────────────────────────────────
  window.addEventListener("resize", () => {
    const nw = container.offsetWidth;
    const nh = container.offsetHeight || nw;
    renderer.setSize(nw, nh);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  });
}

document.querySelectorAll("canvas[data-three-fry]").forEach(initFryScene);
