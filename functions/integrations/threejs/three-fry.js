import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function initFryScene(canvas) {
  const modelUrl  = canvas.getAttribute("data-three");
  const bgColor   = canvas.getAttribute("data-bg-color")   || "#f2f2fb";
  const edgeColor = canvas.getAttribute("data-edge-color") || "#0057b8";
  const autoRotate = canvas.getAttribute("data-auto-rotate") !== "0";

  if (!modelUrl) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bgColor);

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
  controls.enableDamping    = true;
  controls.dampingFactor    = 0.25;
  controls.screenSpacePanning = false;
  controls.autoRotate       = autoRotate;
  controls.autoRotateSpeed  = 0.5;
  // Зум зафиксирован как на fryreglet
  controls.enableZoom = false;

  let isGrabbing = false;
  canvas.style.cursor = "grab";
  canvas.addEventListener("mousedown", () => {
    isGrabbing = true;
    canvas.style.cursor = "grabbing";
    if (autoRotate) controls.autoRotate = false;
  });
  document.addEventListener("mouseup", () => {
    if (!isGrabbing) return;
    isGrabbing = false;
    canvas.style.cursor = "grab";
    if (autoRotate) controls.autoRotate = true;
  });

  const ext = modelUrl.split(".").pop().toLowerCase();

  function applyFryStyle(object) {
    const box   = new THREE.Box3().setFromObject(object);
    const size  = box.getSize(new THREE.Vector3());
    const scale = Math.min(3 / size.x, 2 / size.y, 2 / size.z);
    object.scale.setScalar(scale);

    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center.multiplyScalar(scale));

    const edgeCol = new THREE.Color(edgeColor);
    const bgCol   = new THREE.Color(bgColor);

    object.traverse((child) => {
      if (!child.isMesh) return;

      child.material = new THREE.MeshBasicMaterial({
        color: bgCol,
        side: THREE.DoubleSide,
      });

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(child.geometry),
        new THREE.LineBasicMaterial({ color: edgeCol })
      );
      child.add(edges);
    });
  }

  if (ext === "obj") {
    new OBJLoader().load(modelUrl, (object) => {
      applyFryStyle(object);
      scene.add(object);
    });
  } else if (ext === "glb" || ext === "gltf") {
    new GLTFLoader().load(modelUrl, (gltf) => {
      applyFryStyle(gltf.scene);
      scene.add(gltf.scene);
    });
  } else if (ext === "fbx") {
    new FBXLoader().load(modelUrl, (object) => {
      applyFryStyle(object);
      scene.add(object);
    });
  } else {
    console.error("three-fry: unsupported format " + ext);
    return;
  }

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
