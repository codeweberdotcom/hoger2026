import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/controls/OrbitControls.js";

function initScene(canvas, modelUrl) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Загружаем JPG как environment map для отражений
  const envPath =
    "https://hoger.pro/wp-content/uploads/2025/02/4f647fe9462309dabc45a7690a60242d-1.jpg";
  const envTexture = new THREE.TextureLoader().load(envPath);
  envTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = envTexture;

  // Источники света
  const ambientLight = new THREE.AmbientLight(0xffffff, 20);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 20);
  directionalLight.position.set(20, 70, 50);
  scene.add(directionalLight);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
  camera.position.set(0, 3, 4);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  const size = canvas.parentElement.offsetWidth;
  renderer.setSize(size, size);

  const isMobile = window.innerWidth <= 768;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI;
  if (isMobile) {
    controls.enabled = false;
  }

  let isMouseDown = false;
  let isRotating = true;
  let showEdges = true;

  document.addEventListener("mousedown", (event) => {
    if (event.button === 0 || event.button === 2) isMouseDown = true;
  });
  document.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  const loaderGLTF = new GLTFLoader();
  const loaderOBJ = new OBJLoader();
  const loaderFBX = new FBXLoader();
  let model;
  const fileExtension = modelUrl.split(".").pop().toLowerCase();

  if (fileExtension === "glb" || fileExtension === "gltf") {
    loaderGLTF.load(modelUrl, (gltf) => {
      model = gltf.scene;
      setupModel(model);
      scene.add(model);
    });
  } else if (fileExtension === "obj") {
    loaderOBJ.load(modelUrl, (object) => {
      model = object;
      setupModel(model, true);
      scene.add(model);
    });
  } else if (fileExtension === "fbx") {
    loaderFBX.load(modelUrl, (object) => {
      model = object;
      setupModel(model);
      scene.add(model);
    });
  } else {
    console.error("Unsupported file format: " + fileExtension);
    return;
  }

  function setupModel(model, isRed = false) {
    const box = new THREE.Box3().setFromObject(model);
    const sizeVec = box.getSize(new THREE.Vector3());
    const scale = Math.min(3 / sizeVec.x, 2 / sizeVec.y, 2 / sizeVec.z);
    model.scale.set(scale, scale, scale);
    model.position.set(0, 0, 0);

    model.traverse((child) => {
      if (child.isMesh) {
        let originalColor = isRed ? 0x9c886f : 0x000000;
        if (!isRed && child.material && child.material.color) {
          originalColor = child.material.color.getHex();
        }
        child.userData.originalColor = originalColor;

        if (fileExtension === "obj") {
          child.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
          });
          const geometry = new THREE.EdgesGeometry(child.geometry);
          const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x9c886f,
            linewidth: 2,
          });
          const edges = new THREE.LineSegments(geometry, edgeMaterial);
          child.add(edges);
          child.userData.edges = edges;
        } else {
          if (showEdges) {
            child.material = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              side: THREE.DoubleSide,
            });
            const geometry = new THREE.EdgesGeometry(child.geometry);
            const edgeMaterial = new THREE.LineBasicMaterial({
              color: originalColor,
              linewidth: 2,
            });
            const edges = new THREE.LineSegments(geometry, edgeMaterial);
            child.add(edges);
            child.userData.edges = edges;
          } else {
            child.material = new THREE.MeshStandardMaterial({
              color: originalColor,
              side: THREE.DoubleSide,
              metalness: 0.9,
              roughness: 0.2,
              envMap: scene.environment,
              envMapIntensity: 0.5,
            });
          }
        }
      }
    });
  }

  function toggleRotation(rotationButtonIcon) {
    isRotating = !isRotating;
    if (isRotating) {
      rotationButtonIcon.classList.remove("uil-pause");
      rotationButtonIcon.classList.add("uil-play");
    } else {
      rotationButtonIcon.classList.remove("uil-play");
      rotationButtonIcon.classList.add("uil-pause");
    }
  }

  function toggleEdges(edgesButtonIcon) {
    if (fileExtension !== "obj") {
      if (showEdges) {
        model.traverse((child) => {
          if (child.isMesh) {
            if (child.userData.edges) {
              child.remove(child.userData.edges);
              child.userData.edges = null;
            }
            child.material = new THREE.MeshStandardMaterial({
              color: child.userData.originalColor,
              side: THREE.DoubleSide,
              metalness: 0.9,
              roughness: 0.2,
              envMap: scene.environment,
              envMapIntensity: 0.5,
            });
          }
        });
        showEdges = false;
        edgesButtonIcon.classList.remove("uil-eye-slash");
        edgesButtonIcon.classList.add("uil-eye");
      } else {
        model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              side: THREE.DoubleSide,
            });
            const geometry = new THREE.EdgesGeometry(child.geometry);
            const edgeMaterial = new THREE.LineBasicMaterial({
              color: child.userData.originalColor,
              linewidth: 2,
            });
            const edges = new THREE.LineSegments(geometry, edgeMaterial);
            child.add(edges);
            child.userData.edges = edges;
          }
        });
        showEdges = true;
        edgesButtonIcon.classList.remove("uil-eye");
        edgesButtonIcon.classList.add("uil-eye-slash");
      }
    }
  }

  const rotateButton = document.createElement("button");
  rotateButton.classList.add(
    "btn",
    "btn-circle",
    "btn-primary",
    "btn-sm",
    "me-2",
    "mb-2",
    "rotation-btn"
  );
  rotateButton.innerHTML = '<i class="uil uil-play"></i>';
  rotateButton.style.position = "absolute";
  rotateButton.style.top = "20px";
  rotateButton.style.left = "20px";
  rotateButton.style.zIndex = "1000";
  rotateButton.addEventListener("click", () => {
    toggleRotation(rotateButton.querySelector("i"));
  });

  if (fileExtension !== "obj") {
    const edgesButton = document.createElement("button");
    edgesButton.classList.add(
      "btn",
      "btn-circle",
      "btn-primary",
      "btn-sm",
      "me-2",
      "mb-2",
      "edges-btn"
    );
    edgesButton.innerHTML = '<i class="uil uil-eye-slash"></i>';
    edgesButton.style.position = "absolute";
    edgesButton.style.top = "60px";
    edgesButton.style.left = "20px";
    edgesButton.style.zIndex = "1000";
    edgesButton.addEventListener("click", () => {
      toggleEdges(edgesButton.querySelector("i"));
    });

    canvas.parentElement.style.position = "relative";
    canvas.parentElement.appendChild(edgesButton);
  }

  canvas.parentElement.style.position = "relative";
  canvas.parentElement.appendChild(rotateButton);

  function animate() {
    requestAnimationFrame(animate);
    if (model && !isMouseDown && isRotating) {
      model.rotation.y += 0.005;
    }
    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    const newSize = canvas.parentElement.offsetWidth;
    renderer.setSize(newSize, newSize);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  });
}

document.querySelectorAll("canvas[data-three]").forEach((canvas) => {
  const modelUrl = canvas.getAttribute("data-three");
  if (modelUrl) {
    initScene(canvas, modelUrl);
  }
});
