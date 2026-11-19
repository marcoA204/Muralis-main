<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-2 sm:p-4 select-none"
  >
    <div class="bg-concrete-900 border-2 border-concrete-600 rounded-xs shadow-brutalist max-w-5xl w-full flex flex-col h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="h-12 bg-concrete-950 border-b-2 border-paint px-4 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-2">
          <span class="w-1.5 h-3.5 bg-paint"></span>
          <span class="px-1.5 py-0.5 bg-paint text-paint-dark font-mono text-[11px] font-bold uppercase rounded-xs">
            COMPUTAÇÃO GRÁFICA 3D
          </span>
          <h3 class="text-sm font-display font-black text-paper uppercase tracking-wider">
            Simulador de Ambiente 3D & Iluminação Phong
          </h3>
        </div>
        <button
          type="button"
          class="p-1.5 text-concrete-300 hover:text-paper rounded-xs hover:bg-concrete-800 transition-colors"
          aria-label="Fechar simulador 3D"
          @click="$emit('close')"
        >
          <XIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Main Layout: 3D Viewport on Left/Center, Controls on Right -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <!-- 3D Canvas Container -->
        <div
          ref="canvasContainerRef"
          class="flex-1 h-full bg-black relative cursor-grab active:cursor-grabbing overflow-hidden"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp"
          @pointerleave="handlePointerUp"
          @wheel="handleWheel"
        >
          <!-- Live 3D Overlay Help -->
          <div class="absolute top-3 left-3 bg-concrete-900/80 border border-concrete-700 px-2 py-1 rounded-xs font-mono text-[10px] text-concrete-300 pointer-events-none">
            🖱️ Arraste para orbitar | Scroll para zoom
          </div>

          <!-- Camera Projection Indicator -->
          <div class="absolute top-3 right-3 bg-concrete-900/80 border border-concrete-700 px-2 py-1 rounded-xs font-mono text-[10px] text-paint pointer-events-none">
            {{ isOrthographic ? 'PROJEÇÃO ORTOGRÁFICA (PARALELA)' : 'PROJEÇÃO PERSPECTIVA (CÔNICA)' }}
          </div>
        </div>

        <!-- 3D Controls Sidebar -->
        <div class="w-full md:w-72 bg-concrete-800 border-t md:border-t-0 md:border-l border-concrete-700 p-4 overflow-y-auto space-y-4 text-xs font-mono shrink-0">
          <div v-if="fullSceneUrl && sceneTextureUrl">
            <span class="text-paint font-bold text-[11px] uppercase tracking-wider block mb-1.5">
              0. Enquadramento 3D
            </span>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                class="py-1.5 px-2 border rounded-xs font-mono text-center transition-colors"
                :class="focusWallOnly ? 'bg-paint text-paint-dark border-paint font-bold' : 'bg-concrete-900 border-concrete-700 text-concrete-300'"
                @click="toggleFocusMode(true)"
              >
                Muro + Arte
              </button>
              <button
                type="button"
                class="py-1.5 px-2 border rounded-xs font-mono text-center transition-colors"
                :class="!focusWallOnly ? 'bg-paint text-paint-dark border-paint font-bold' : 'bg-concrete-900 border-concrete-700 text-concrete-300'"
                @click="toggleFocusMode(false)"
              >
                Cena Inteira
              </button>
            </div>
          </div>

          <div>
            <span class="text-paint font-bold text-[11px] uppercase tracking-wider block mb-1.5">
              1. Projeção de Câmera
            </span>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                class="py-1.5 px-2 border rounded-xs font-mono text-center transition-colors"
                :class="!isOrthographic ? 'bg-paint text-paint-dark border-paint font-bold' : 'bg-concrete-900 border-concrete-700 text-concrete-300'"
                @click="setCameraMode(false)"
              >
                Perspectiva
              </button>
              <button
                type="button"
                class="py-1.5 px-2 border rounded-xs font-mono text-center transition-colors"
                :class="isOrthographic ? 'bg-paint text-paint-dark border-paint font-bold' : 'bg-concrete-900 border-concrete-700 text-concrete-300'"
                @click="setCameraMode(true)"
              >
                Ortográfica
              </button>
            </div>
          </div>

          <!-- Lighting (Modelo de Phong / PBR) -->
          <div class="space-y-3 pt-2 border-t border-concrete-700">
            <span class="text-paint font-bold text-[11px] uppercase tracking-wider block">
              2. Modelo de Iluminação
            </span>

            <!-- Luz Ambiente -->
            <div>
              <div class="flex justify-between text-concrete-300 mb-1">
                <span>Luz Ambiente (Ka):</span>
                <span class="text-paper">{{ ambientIntensity.toFixed(2) }}</span>
              </div>
              <input
                v-model.number="ambientIntensity"
                type="range"
                min="0"
                max="2"
                step="0.05"
                class="w-full accent-paint"
                @input="updateLighting"
              />
            </div>

            <!-- Luz Pontual / Foco (Spot / Point) -->
            <div>
              <div class="flex justify-between text-concrete-300 mb-1">
                <span>Luz Pontual (Kd):</span>
                <span class="text-paper">{{ lightIntensity.toFixed(2) }}</span>
              </div>
              <input
                v-model.number="lightIntensity"
                type="range"
                min="0"
                max="5"
                step="0.1"
                class="w-full accent-paint"
                @input="updateLighting"
              />
            </div>

            <!-- Rugosidade / Especularidade (Ks) -->
            <div>
              <div class="flex justify-between text-concrete-300 mb-1">
                <span>Rugosidade da Parede (Roughness):</span>
                <span class="text-paper">{{ roughness.toFixed(2) }}</span>
              </div>
              <input
                v-model.number="roughness"
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                class="w-full accent-paint"
                @input="updateMaterial"
              />
            </div>

            <!-- Metalness -->
            <div>
              <div class="flex justify-between text-concrete-300 mb-1">
                <span>Brilho Especular (Metalness):</span>
                <span class="text-paper">{{ metalness.toFixed(2) }}</span>
              </div>
              <input
                v-model.number="metalness"
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                class="w-full accent-paint"
                @input="updateMaterial"
              />
            </div>
          </div>

          <!-- Posição 3D da Fonte de Luz -->
          <div class="space-y-2 pt-2 border-t border-concrete-700">
            <span class="text-paint font-bold text-[11px] uppercase tracking-wider block">
              3. Posição da Luz 3D
            </span>

            <div>
              <div class="flex justify-between text-concrete-300 mb-1">
                <span>Posição X (Horizontal):</span>
                <span class="text-paper">{{ lightPos.x.toFixed(1) }}</span>
              </div>
              <input
                v-model.number="lightPos.x"
                type="range"
                min="-6"
                max="6"
                step="0.2"
                class="w-full accent-paint"
                @input="updateLightPosition"
              />
            </div>

            <div>
              <div class="flex justify-between text-concrete-300 mb-1">
                <span>Posição Y (Altura):</span>
                <span class="text-paper">{{ lightPos.y.toFixed(1) }}</span>
              </div>
              <input
                v-model.number="lightPos.y"
                type="range"
                min="-1"
                max="6"
                step="0.2"
                class="w-full accent-paint"
                @input="updateLightPosition"
              />
            </div>

            <div>
              <div class="flex justify-between text-concrete-300 mb-1">
                <span>Posição Z (Distância):</span>
                <span class="text-paper">{{ lightPos.z.toFixed(1) }}</span>
              </div>
              <input
                v-model.number="lightPos.z"
                type="range"
                min="1"
                max="10"
                step="0.2"
                class="w-full accent-paint"
                @input="updateLightPosition"
              />
            </div>
          </div>

          <!-- Reset Camera -->
          <button
            type="button"
            class="w-full py-2 bg-concrete-700 hover:bg-concrete-600 text-paper font-mono text-xs uppercase font-bold rounded-xs transition-colors"
            @click="resetCamera"
          >
            Resetar Ângulo de Câmera
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="h-12 bg-concrete-950 border-t border-concrete-700 px-4 flex items-center justify-between shrink-0">
        <span class="text-[11px] font-mono text-concrete-300">
          Renderizado com WebGL / Three.js Shaders
        </span>
        <button
          type="button"
          class="px-4 py-1.5 bg-concrete-700 hover:bg-concrete-600 text-paper font-mono text-xs uppercase font-bold rounded-xs transition-colors"
          @click="$emit('close')"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, reactive } from 'vue';
import { X as XIcon } from 'lucide-vue-next';
import * as THREE from 'three';

const props = defineProps<{
  isOpen: boolean;
  artAssetUrl: string | null;
  basePhotoUrl: string | null;
  sceneTextureUrl?: string | null;
  fullSceneUrl?: string | null;
  initialYaw?: number;
  initialRoughness?: number;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const canvasContainerRef = ref<HTMLDivElement | null>(null);

const isOrthographic = ref(false);
const focusWallOnly = ref(true);
const ambientIntensity = ref(0.6);
const lightIntensity = ref(2.5);
const roughness = ref(0.7);
const metalness = ref(0.1);

const lightPos = reactive({
  x: 2.0,
  y: 2.5,
  z: 4.0
});

// Three.js State
let scene: THREE.Scene | null = null;
let perspectiveCamera: THREE.PerspectiveCamera | null = null;
let orthographicCamera: THREE.OrthographicCamera | null = null;
let activeCamera: THREE.Camera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let animationFrameId: number | null = null;

let wallMesh: THREE.Mesh | null = null;
let wallMaterial: THREE.MeshStandardMaterial | null = null;
let pointLight: THREE.PointLight | null = null;
let ambientLight: THREE.AmbientLight | null = null;
let lightHelper: THREE.Mesh | null = null;

// Orbit controls state
let isDragging = false;
let previousPointerPos = { x: 0, y: 0 };
let cameraOrbit = { sphericalTheta: 0, sphericalPhi: Math.PI / 2.3, radius: 7.5 };

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      focusWallOnly.value = true;
      if (props.initialRoughness !== undefined) {
        roughness.value = Number(props.initialRoughness.toFixed(2));
      }
      cameraOrbit.sphericalTheta = props.initialYaw ?? 0;
      setTimeout(() => initThree(), 50);
    } else {
      disposeThree();
    }
  }
);

function initThree() {
  if (!canvasContainerRef.value) return;
  disposeThree();

  const width = canvasContainerRef.value.clientWidth || 600;
  const height = canvasContainerRef.value.clientHeight || 450;
  const aspect = width / height;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e11);

  // Cameras
  perspectiveCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
  const orthoSize = 4.5;
  orthographicCamera = new THREE.OrthographicCamera(
    -orthoSize * aspect,
    orthoSize * aspect,
    orthoSize,
    -orthoSize,
    0.1,
    100
  );
  activeCamera = isOrthographic.value ? orthographicCamera : perspectiveCamera;
  updateCameraPosition();

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  canvasContainerRef.value.appendChild(renderer.domElement);

  // Lights
  ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity.value);
  scene.add(ambientLight);

  pointLight = new THREE.PointLight(0xfff5e6, lightIntensity.value, 20);
  pointLight.position.set(lightPos.x, lightPos.y, lightPos.z);
  pointLight.castShadow = true;
  scene.add(pointLight);

  // Light source visual sphere
  const lightGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffe680 });
  lightHelper = new THREE.Mesh(lightGeo, lightMat);
  lightHelper.position.copy(pointLight.position);
  scene.add(lightHelper);

  // Room geometry: Floor
  const floorGeo = new THREE.PlaneGeometry(12, 10);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x222226,
    roughness: 0.85,
    metalness: 0.1
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Grid Helper on floor
  const grid = new THREE.GridHelper(12, 12, 0x00E699, 0x333339);
  grid.position.y = -1.99;
  scene.add(grid);

  const wallHeight = 4.2;
  let wallWidth = 6.0;
  const wallGeo = new THREE.PlaneGeometry(wallWidth, wallHeight);
  wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: roughness.value,
    metalness: metalness.value
  });

  wallMesh = new THREE.Mesh(wallGeo, wallMaterial);
  wallMesh.position.set(0, 0.1, 0);
  wallMesh.receiveShadow = true;
  scene.add(wallMesh);

  const frameGeo = new THREE.BoxGeometry(wallWidth + 0.2, wallHeight + 0.2, 0.06);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness: 0.6 });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.set(0, 0.1, -0.04);
  scene.add(frameMesh);

  const textureSource = focusWallOnly.value
    ? (props.sceneTextureUrl || props.fullSceneUrl || props.basePhotoUrl || props.artAssetUrl)
    : (props.fullSceneUrl || props.sceneTextureUrl || props.basePhotoUrl || props.artAssetUrl);
  if (textureSource) {
    const loader = new THREE.TextureLoader();
    loader.load(textureSource, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const img = texture.image as { width?: number; height?: number } | undefined;
      if (img?.width && img?.height && wallMesh) {
        const texAspect = img.width / img.height;
        wallWidth = Math.max(2.8, Math.min(9.0, wallHeight * texAspect));
        wallMesh.geometry.dispose();
        wallMesh.geometry = new THREE.PlaneGeometry(wallWidth, wallHeight);
        frameMesh.geometry.dispose();
        frameMesh.geometry = new THREE.BoxGeometry(wallWidth + 0.2, wallHeight + 0.2, 0.06);
      }
      if (wallMaterial) {
        wallMaterial.map = texture;
        wallMaterial.bumpMap = texture;
        wallMaterial.bumpScale = 0.04;
        wallMaterial.needsUpdate = true;
      }
    });
  }

  // Render loop
  animate();
}

function updateCameraPosition() {
  const x = cameraOrbit.radius * Math.sin(cameraOrbit.sphericalPhi) * Math.sin(cameraOrbit.sphericalTheta);
  const y = cameraOrbit.radius * Math.cos(cameraOrbit.sphericalPhi);
  const z = cameraOrbit.radius * Math.sin(cameraOrbit.sphericalPhi) * Math.cos(cameraOrbit.sphericalTheta);

  if (perspectiveCamera) {
    perspectiveCamera.position.set(x, y, z);
    perspectiveCamera.lookAt(0, 0, 0);
  }
  if (orthographicCamera) {
    orthographicCamera.position.set(x, y, z);
    orthographicCamera.lookAt(0, 0, 0);
  }
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  if (renderer && scene && activeCamera) {
    renderer.render(scene, activeCamera);
  }
}

function setCameraMode(ortho: boolean) {
  isOrthographic.value = ortho;
  activeCamera = ortho ? orthographicCamera : perspectiveCamera;
  updateCameraPosition();
}

function toggleFocusMode(wallOnly: boolean) {
  focusWallOnly.value = wallOnly;
  cameraOrbit.sphericalTheta = wallOnly ? (props.initialYaw ?? 0) : 0;
  initThree();
}

function updateLighting() {
  if (ambientLight) ambientLight.intensity = ambientIntensity.value;
  if (pointLight) pointLight.intensity = lightIntensity.value;
}

function updateMaterial() {
  if (wallMaterial) {
    wallMaterial.roughness = roughness.value;
    wallMaterial.metalness = metalness.value;
    wallMaterial.needsUpdate = true;
  }
}

function updateLightPosition() {
  if (pointLight && lightHelper) {
    pointLight.position.set(lightPos.x, lightPos.y, lightPos.z);
    lightHelper.position.copy(pointLight.position);
  }
}

function resetCamera() {
  cameraOrbit = { sphericalTheta: 0, sphericalPhi: Math.PI / 2.3, radius: 7.5 };
  updateCameraPosition();
}

// Pointer drag orbit
function handlePointerDown(e: PointerEvent) {
  isDragging = true;
  previousPointerPos = { x: e.clientX, y: e.clientY };
}

function handlePointerMove(e: PointerEvent) {
  if (!isDragging) return;
  const deltaX = e.clientX - previousPointerPos.x;
  const deltaY = e.clientY - previousPointerPos.y;
  previousPointerPos = { x: e.clientX, y: e.clientY };

  cameraOrbit.sphericalTheta -= deltaX * 0.01;
  cameraOrbit.sphericalPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraOrbit.sphericalPhi - deltaY * 0.01));

  updateCameraPosition();
}

function handlePointerUp() {
  isDragging = false;
}

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  cameraOrbit.radius = Math.max(3, Math.min(18, cameraOrbit.radius + e.deltaY * 0.01));
  updateCameraPosition();
}

function disposeThree() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (renderer && renderer.domElement && canvasContainerRef.value) {
    canvasContainerRef.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
  scene = null;
  renderer = null;
}

onBeforeUnmount(() => {
  disposeThree();
});
</script>
