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
  const modelUrl   = canvas.getAttribute("data-three");
  const bgHex      = canvas.getAttribute("data-bg-color")   || "#f2f2fb";
  const edgeHex    = canvas.getAttribute("data-edge-color") || "#0057b8";
  const bgSoft     = canvas.getAttribute("data-bg-soft")    === "1";
  const edgeSoft   = canvas.getAttribute("data-edge-soft")  === "1";
  const autoRotate = canvas.getAttribute("data-auto-rotate") !== "0";

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

  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
  camera.position.set(0, 1.5, 4);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping     = true;
  controls.dampingFactor     = 0.25;
  controls.screenSpacePanning = false;
  controls.autoRotate        = autoRotate;
  controls.autoRotateSpeed   = 0.5;
  controls.enableZoom        = false;

  // Cursor grab
  canvas.style.cursor = "grab";
  canvas.addEventListener("mousedown", () => {
    canvas.style.cursor = "grabbing";
    controls.autoRotate = false;
  });
  document.addEventListener("mouseup", () => {
    canvas.style.cursor = "grab";
    if (autoRotate && isRotating) controls.autoRotate = true;
  });

  // ── Play / Pause button ──────────────────────────────────────────────────
  let isRotating = autoRotate;

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

  container.style.position = "relative";
  container.appendChild(playBtn);

  // ── Edges toggle button (FBX / GLB only, added after model loads) ────────
  let showEdges = true;
  let loadedModel = null;

  function buildEdgesBtn() {
    const edgesBtn = document.createElement("button");
    edgesBtn.type = "button";
    edgesBtn.className = "btn btn-circle btn-primary btn-sm";
    edgesBtn.style.cssText = "position:absolute;top:60px;left:12px;z-index:10;";
    edgesBtn.innerHTML = '<i class="uil uil-eye-slash"></i>';

    edgesBtn.addEventListener("click", () => {
      showEdges = !showEdges;
      edgesBtn.innerHTML = showEdges
        ? '<i class="uil uil-eye-slash"></i>'
        : '<i class="uil uil-eye"></i>';

      loadedModel && loadedModel.traverse((child) => {
        if (!child.isMesh) return;
        if (showEdges) {
          child.material = new THREE.MeshBasicMaterial({ color: bgCol, side: THREE.DoubleSide });
          if (!child.userData.edgeLines) {
            const el = new THREE.LineSegments(
              new THREE.EdgesGeometry(child.geometry),
              new THREE.LineBasicMaterial({ color: edgeCol })
            );
            child.userData.edgeLines = el;
            child.add(el);
          } else {
            child.add(child.userData.edgeLines);
          }
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(child.userData.origColor || 0xcccccc),
            side: THREE.DoubleSide,
            metalness: 0.5,
            roughness: 0.4,
          });
          if (child.userData.edgeLines) child.remove(child.userData.edgeLines);
        }
      });
    });

    container.appendChild(edgesBtn);
  }

  // ── Load model ───────────────────────────────────────────────────────────
  const ext = modelUrl.split(".").pop().toLowerCase();

  function applyFryStyle(object, withEdgesBtn = false) {
    loadedModel = object;

    const box   = new THREE.Box3().setFromObject(object);
    const size  = box.getSize(new THREE.Vector3());
    const scale = Math.min(3 / size.x, 2 / size.y, 2 / size.z);
    object.scale.setScalar(scale);

    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
    object.position.sub(center);

    object.traverse((child) => {
      if (!child.isMesh) return;
      // Save original color for edges-off mode
      child.userData.origColor = child.material && child.material.color
        ? child.material.color.getHex()
        : 0xcccccc;

      child.material = new THREE.MeshBasicMaterial({
        color: bgCol,
        side: THREE.DoubleSide,
      });
      const edgeLines = new THREE.LineSegments(
        new THREE.EdgesGeometry(child.geometry),
        new THREE.LineBasicMaterial({ color: edgeCol })
      );
      child.userData.edgeLines = edgeLines;
      child.add(edgeLines);
    });

    if (withEdgesBtn) buildEdgesBtn();
  }

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

  window.addEventListener("resize", () => {
    const nw = container.offsetWidth;
    const nh = container.offsetHeight || nw;
    renderer.setSize(nw, nh);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  });
}

document.querySelectorAll("canvas[data-three-fry]").forEach(initFryScene);
