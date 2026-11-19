<template>
  <div class="flex flex-col md:flex-row landscape:flex-row h-full w-full bg-concrete-900 text-paper overflow-hidden select-none safe-top safe-bottom relative">
    <main class="flex-1 relative flex flex-col h-full overflow-hidden">

      <header class="h-14 bg-concrete-800 border-b-2 border-paint flex items-center justify-between px-3 md:px-4 z-10 shrink-0">
        <div class="flex items-center space-x-2 md:space-x-3 min-w-0">
          <router-link
            to="/projects"
            class="text-xs font-mono font-bold text-concrete-300 hover:text-paper flex items-center space-x-1 uppercase transition-colors shrink-0"
            aria-label="Ir para a galeria de murais"
          >
            <ArrowLeftIcon class="w-4 h-4 stroke-[2.5]" />
            <span class="hidden sm:inline">Galeria</span>
          </router-link>

          <div class="h-4 w-px bg-concrete-600 shrink-0"></div>

          <div class="flex items-center space-x-1.5 min-w-0">
            <span class="text-paint font-mono text-xs font-bold shrink-0">MURAL:</span>
            <input
              v-model="projectStore.currentProject.title"
              type="text"
              class="bg-transparent border-b border-transparent hover:border-concrete-500 focus:border-paint text-base md:text-xs font-mono font-bold text-paper px-1 py-0.5 focus:outline-none uppercase tracking-wider truncate max-w-[140px] sm:max-w-xs"
              placeholder="NOME DO MURAL"
            />
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0">

          <span
            v-if="isCameraActive"
            class="px-2 py-0.5 border border-paint text-paint rounded-xs text-[10px] font-mono font-bold tracking-wider flex items-center space-x-1 bg-concrete-900"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-paint"></span>
            <span>CÂMERA AO VIVO</span>
          </span>
          <span
            v-else-if="projectStore.currentProject.basePhotoUrl"
            class="px-2 py-0.5 border border-concrete-500 text-concrete-300 rounded-xs text-[10px] font-mono font-bold tracking-wider flex items-center space-x-1 bg-concrete-900"
          >
            <span>FOTO ESTÁTICA</span>
          </span>
          <span
            v-if="saveFeedback"
            class="px-2 py-0.5 border border-paint bg-paint text-paint-dark rounded-xs text-[10px] font-mono font-black tracking-wider"
          >
            SALVO
          </span>
          <span
            v-else-if="projectStore.currentProject.isDirty"
            class="hidden sm:inline-block px-2 py-0.5 border border-concrete-600 text-concrete-300 rounded-xs text-[10px] font-mono"
          >
            ALTERADO
          </span>
        </div>
      </header>

      <div class="flex-1 relative overflow-hidden flex items-center justify-center p-2 md:p-4 bg-concrete-950">


        <ViewportCanvas
          ref="viewportRef"
          :base-photo-url="projectStore.currentProject.basePhotoUrl"
          :art-asset-url="projectStore.currentProject.artAssetUrl"
          :corner-points="projectStore.currentProject.cornerPoints"
          :blend-mode="projectStore.currentProject.blendMode"
          :opacity="projectStore.currentProject.opacity"
          :brightness="projectStore.currentProject.brightness"
          :contrast="projectStore.currentProject.contrast"
          :show-handles="!isMaskMode && !isMeasureMode"
          :mask-canvas="maskCanvas"
          :is-camera-active="isCameraActive"
          :is-mask-mode="isMaskMode"
          :brush-size="brushSize"
          :is-eraser="isEraser"
          :is-measure-mode="isMeasureMode"
          :measure-points="measurePoints"
          :pixels-per-meter="pixelsPerMeter"
          :show-painter-grid="showPainterGrid"
          :paint-canvas="paintCanvas"
          :is-paint-mode="isPaintMode"
          :paint-color="paintColor"
          :paint-brush-size="paintBrushSize"
          :paint-opacity="paintOpacity"
          :is-paint-eraser="isPaintEraser"
          :is-guide-mode="isGuideMode"
          :guide-vectors="guideVectors"
          :art-rotation="artRotation"
          @update-point="handleUpdatePoint"
          @update-points="handleUpdatePoints"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          @camera-frame-captured="handleCameraFrameCaptured"
          @camera-error="handleCameraError"
          @mask-updated="handleMaskUpdated"
          @paint-updated="handlePaintUpdated"
          @update-guide-vectors="(val) => (guideVectors = val)"
          @update-art-rotation="(deg) => (artRotation = deg)"
          @update-measure-points="(pts) => (measurePoints = pts)"
        />

        <input
          ref="directArtInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleDirectArtUpload"
        />

        <div
          v-if="!projectStore.currentProject.artAssetUrl"
          class="absolute z-20 flex flex-col items-center justify-center pointer-events-none p-4 text-center max-w-xs"
        >
          <button
            type="button"
            class="pointer-events-auto py-3 px-5 bg-paint hover:bg-paint-hover text-paint-dark border border-paint rounded-xs text-xs font-mono font-black uppercase tracking-wider flex items-center space-x-2 shadow-brutalist transition-transform active:scale-95"
            @click="directArtInputRef?.click()"
          >
            <UploadIcon class="w-4 h-4 stroke-[2.5]" />
            <span>Adicionar Sua Arte</span>
          </button>
          <span class="mt-2 text-[10px] font-mono text-concrete-300 bg-concrete-900/90 border border-concrete-600 px-2 py-0.5 rounded-xs">
            Projete sua arte na parede
          </span>
        </div>
      </div>

      <div
        v-if="mobileSnap !== 'open'"
        class="md:hidden landscape:hidden absolute bottom-16 left-3 right-3 z-20 flex items-center justify-center pointer-events-none"
      >
        <div class="bg-concrete-800 border border-concrete-600 p-1.5 rounded-xs shadow-brutalist flex items-center space-x-1.5 pointer-events-auto max-w-full overflow-x-auto">

          <button
            type="button"
            class="py-2 px-3.5 bg-paint hover:bg-paint-hover border border-paint text-paint-dark font-mono text-xs font-black uppercase rounded-xs flex items-center space-x-1.5 transition-colors shadow-subtle shrink-0 active:scale-95"
            @click="directArtInputRef?.click()"
          >
            <UploadIcon class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{{ projectStore.currentProject.artAssetUrl ? 'Trocar Arte' : 'Carregar Arte' }}</span>
          </button>

          <button
            v-if="projectStore.currentProject.artAssetUrl"
            type="button"
            class="py-2 px-2.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 text-paper font-mono text-xs font-bold uppercase rounded-xs flex items-center space-x-1 transition-colors shrink-0 active:scale-95"
            title="Cortar e girar arte"
            @click="isImageEditorOpen = true"
          >
            <CropIcon class="w-3.5 h-3.5 text-paint" />
            <span>Cortar</span>
          </button>

          <button
            v-if="isCameraActive"
            type="button"
            class="py-2 px-2.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-500 text-paper font-mono text-xs font-bold uppercase rounded-xs flex items-center space-x-1 transition-colors shrink-0 active:scale-95"
            title="Congelar foto da parede"
            @click="handleCaptureCamera"
          >
            <CheckIcon class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Congelar</span>
          </button>

          <button
            v-else
            type="button"
            class="py-2 px-2.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 text-concrete-300 font-mono text-xs font-bold uppercase rounded-xs flex items-center space-x-1 transition-colors shrink-0 active:scale-95"
            title="Ligar câmera ao vivo"
            @click="handleToggleCamera"
          >
            <CameraIcon class="w-3.5 h-3.5 text-concrete-300" />
            <span>Câmera</span>
          </button>
        </div>
      </div>
    </main>

    <div class="hidden md:flex landscape:flex w-80 shrink-0 h-full border-l-2 border-concrete-600">
      <Toolbar
        :blend-mode="projectStore.currentProject.blendMode"
        :opacity="projectStore.currentProject.opacity"
        :brightness="projectStore.currentProject.brightness"
        :contrast="projectStore.currentProject.contrast"
        :can-undo="projectStore.historyIndex > 0"
        :can-redo="projectStore.historyIndex < projectStore.history.length - 1"
        :is-mask-mode="isMaskMode"
        :brush-size="brushSize"
        :is-eraser="isEraser"
        :is-camera-active="isCameraActive"
        :art-scale="artScale"
        :vertical-position="verticalPosition"
        :current-slope="manualSlope"
        :has-art="!!projectStore.currentProject.artAssetUrl"
        :is-measure-mode="isMeasureMode"
        :reference-meters="referenceMeters"
        :pixels-per-meter="pixelsPerMeter"
        :measured-line-text="measuredLineText"
        :quad-measurement="quadMeasurement"
        :has-measure-line="measurePoints.length === 2"
        :show-painter-grid="showPainterGrid"
        :is-guide-mode="isGuideMode"
        :is-paint-mode="isPaintMode"
        :paint-color="paintColor"
        :paint-brush-size="paintBrushSize"
        :paint-opacity="paintOpacity"
        :is-paint-eraser="isPaintEraser"
        :art-rotation="artRotation"
        @update:blend-mode="projectStore.setBlendMode"
        @update:opacity="projectStore.setOpacity"
        @update:brightness="projectStore.setBrightness"
        @update:contrast="projectStore.setContrast"
        @update:brush-size="(val) => (brushSize = val)"
        @update:is-eraser="(val) => (isEraser = val)"
        @update:art-scale="handleUpdateArtScale"
        @update:vertical-position="handleUpdateVerticalPosition"
        @apply-preset="handleApplyPreset"
        @toggle-mask-mode="handleToggleMaskMode"
        @clear-mask="handleClearMask"
        @toggle-measure-mode="handleToggleMeasureMode"
        @update:reference-meters="(val) => (referenceMeters = val)"
        @calibrate-measure="handleCalibrateMeasure"
        @clear-measure="handleClearMeasure"
        @undo="projectStore.undo"
        @redo="projectStore.redo"
        @save="handleSave"
        @share="handleShare"
        @export="handleExport"
        @base-loaded="handleBaseLoaded"
        @art-loaded="handleArtLoaded"
        @toggle-camera="handleToggleCamera"
        @capture-camera="handleCaptureCamera"
        @auto-fit="handleAutoFit"
        @open-image-editor="handleOpenImageEditor"
        @remove-art="handleRemoveArt"
        @open-matrix-inspector="isMatrixInspectorOpen = true"
        @open-convolution-filters="isConvolutionFiltersOpen = true"
        @open-three-scene="handleOpenThreeScene"
        @toggle-painter-grid="showPainterGrid = !showPainterGrid"
        @open-projector-mode="isProjectorModeOpen = true"
        @toggle-guide-mode="handleToggleGuideMode"
        @toggle-paint-mode="handleTogglePaintMode"
        @update:paint-color="(v) => (paintColor = v)"
        @update:paint-brush-size="(v) => (paintBrushSize = v)"
        @update:paint-opacity="(v) => (paintOpacity = v)"
        @update:is-paint-eraser="(v) => (isPaintEraser = v)"
        @clear-paint="handleClearPaint"
        @update:art-rotation="(v) => (artRotation = v)"
      />
    </div>

    <BottomSheet v-model="mobileSnap">
      <Toolbar
        :blend-mode="projectStore.currentProject.blendMode"
        :opacity="projectStore.currentProject.opacity"
        :brightness="projectStore.currentProject.brightness"
        :contrast="projectStore.currentProject.contrast"
        :can-undo="projectStore.historyIndex > 0"
        :can-redo="projectStore.historyIndex < projectStore.history.length - 1"
        :is-mask-mode="isMaskMode"
        :brush-size="brushSize"
        :is-eraser="isEraser"
        :is-camera-active="isCameraActive"
        :art-scale="artScale"
        :vertical-position="verticalPosition"
        :current-slope="manualSlope"
        :has-art="!!projectStore.currentProject.artAssetUrl"
        :is-measure-mode="isMeasureMode"
        :reference-meters="referenceMeters"
        :pixels-per-meter="pixelsPerMeter"
        :measured-line-text="measuredLineText"
        :quad-measurement="quadMeasurement"
        :has-measure-line="measurePoints.length === 2"
        :show-painter-grid="showPainterGrid"
        :is-guide-mode="isGuideMode"
        :is-paint-mode="isPaintMode"
        :paint-color="paintColor"
        :paint-brush-size="paintBrushSize"
        :paint-opacity="paintOpacity"
        :is-paint-eraser="isPaintEraser"
        :art-rotation="artRotation"
        @update:blend-mode="projectStore.setBlendMode"
        @update:opacity="projectStore.setOpacity"
        @update:brightness="projectStore.setBrightness"
        @update:contrast="projectStore.setContrast"
        @update:brush-size="(val) => (brushSize = val)"
        @update:is-eraser="(val) => (isEraser = val)"
        @update:art-scale="handleUpdateArtScale"
        @update:vertical-position="handleUpdateVerticalPosition"
        @apply-preset="handleApplyPreset"
        @toggle-mask-mode="handleToggleMaskMode"
        @clear-mask="handleClearMask"
        @toggle-measure-mode="handleToggleMeasureMode"
        @update:reference-meters="(val) => (referenceMeters = val)"
        @calibrate-measure="handleCalibrateMeasure"
        @clear-measure="handleClearMeasure"
        @undo="projectStore.undo"
        @redo="projectStore.redo"
        @save="handleSave"
        @share="handleShare"
        @export="handleExport"
        @base-loaded="handleBaseLoaded"
        @art-loaded="handleArtLoaded"
        @toggle-camera="handleToggleCamera"
        @capture-camera="handleCaptureCamera"
        @auto-fit="handleAutoFit"
        @open-image-editor="handleOpenImageEditor"
        @remove-art="handleRemoveArt"
        @open-matrix-inspector="isMatrixInspectorOpen = true"
        @open-convolution-filters="isConvolutionFiltersOpen = true"
        @open-three-scene="handleOpenThreeScene"
        @toggle-painter-grid="showPainterGrid = !showPainterGrid"
        @open-projector-mode="isProjectorModeOpen = true"
        @toggle-guide-mode="handleToggleGuideMode"
        @toggle-paint-mode="handleTogglePaintMode"
        @update:paint-color="(v) => (paintColor = v)"
        @update:paint-brush-size="(v) => (paintBrushSize = v)"
        @update:paint-opacity="(v) => (paintOpacity = v)"
        @update:is-paint-eraser="(v) => (isPaintEraser = v)"
        @clear-paint="handleClearPaint"
        @update:art-rotation="(v) => (artRotation = v)"
      />
    </BottomSheet>

    <ImageEditorModal
      :is-open="isImageEditorOpen"
      :image-url="projectStore.currentProject.artAssetUrl"
      @close="isImageEditorOpen = false"
      @save="handleSaveEditedArt"
    />

    <MatrixInspectorModal
      :is-open="isMatrixInspectorOpen"
      :corner-points="projectStore.currentProject.cornerPoints"
      :canvas-bounds="viewportRef?.bounds || { width: 800, height: 600 }"
      @close="isMatrixInspectorOpen = false"
    />

    <ConvolutionFiltersModal
      :is-open="isConvolutionFiltersOpen"
      :art-asset-url="projectStore.currentProject.artAssetUrl"
      @close="isConvolutionFiltersOpen = false"
      @apply-filter="handleApplyFilter"
    />

    <ThreeSceneModal
      :is-open="isThreeSceneOpen"
      :art-asset-url="projectStore.currentProject.artAssetUrl"
      :base-photo-url="projectStore.currentProject.basePhotoUrl"
      :scene-texture-url="threeSceneTextureUrl"
      :full-scene-url="threeFullSceneUrl"
      :initial-yaw="threeInitialYaw"
      :initial-roughness="threeInitialRoughness"
      @close="isThreeSceneOpen = false"
    />

    <ProjectorKeystoneModal
      :is-open="isProjectorModeOpen"
      :art-asset-url="projectStore.currentProject.artAssetUrl"
      :corner-points="projectStore.currentProject.cornerPoints"
      @close="isProjectorModeOpen = false"
    />
    <div
      v-if="shareModalOpen"
      class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 select-text"
    >
      <div class="bg-concrete-800 border-2 border-concrete-600 shadow-brutalist max-w-md w-full p-6 space-y-4 rounded-xs relative">
        <div class="flex items-center space-x-2">
          <span class="w-1.5 h-4 bg-paint"></span>
          <h3 class="text-base font-display font-black text-paper uppercase tracking-tight">
            Compartilhar Simulação
          </h3>
        </div>

        <p class="text-xs font-mono text-concrete-300 leading-relaxed">
          Link público para visualização da arte na fachada em qualquer dispositivo:
        </p>

        <div class="flex items-center space-x-2">
          <input
            type="text"
            readonly
            :value="shareUrl"
            class="flex-1 bg-concrete-900 border border-concrete-600 px-3 py-2 text-base md:text-xs font-mono text-paper rounded-xs focus:outline-none select-all"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <button
            type="button"
            class="px-4 py-2 border rounded-xs text-xs font-mono font-bold uppercase transition-colors shrink-0"
            :class="copied ? 'bg-concrete-700 text-paint border-paint' : 'bg-paint hover:bg-paint-hover text-paint-dark border-paint'"
            @click="copyShareLink"
          >
            {{ copied ? 'Copiado!' : 'Copiar' }}
          </button>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="button"
            class="px-4 py-1.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 text-xs font-mono font-bold text-paper rounded-xs transition-colors"
            @click="shareModalOpen = false"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, triggerRef, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft as ArrowLeftIcon, Camera as CameraIcon, Check as CheckIcon, Upload as UploadIcon, Crop as CropIcon } from 'lucide-vue-next';
import { useProjectStore } from '../stores/projectStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { Point2D } from '../engine/homography.js';
import type { GuideVectors } from '../engine/autoFit.js';
import {
  computePixelsPerMeter,
  measureDistanceMeters,
  measureQuadDimensions,
  formatMeters
} from '../engine/wallMeasurement.js';
import ViewportCanvas from '../components/editor/ViewportCanvas.vue';
import Toolbar from '../components/editor/Toolbar.vue';
import BottomSheet, { SnapState } from '../components/editor/BottomSheet.vue';
import ImageEditorModal from '../components/editor/ImageEditorModal.vue';
import MatrixInspectorModal from '../components/editor/MatrixInspectorModal.vue';
import ConvolutionFiltersModal from '../components/editor/ConvolutionFiltersModal.vue';
import ThreeSceneModal from '../components/editor/ThreeSceneModal.vue';
import ProjectorKeystoneModal from '../components/editor/ProjectorKeystoneModal.vue';
import { apiRequest } from '../services/apiClient.js';
import { ensureCameraPermissions } from '../services/permissionService.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const saveFeedback = ref(false);

const viewportRef = ref<InstanceType<typeof ViewportCanvas> | null>(null);

const mobileSnap = ref<SnapState>('closed');
const isMaskMode = ref(false);
const isPaintMode = ref(false);
const paintCanvas = shallowRef<HTMLCanvasElement | null>(null);
const paintColor = ref('#FFFFFF');
const paintBrushSize = ref(36);
const paintOpacity = ref(0.85);
const isPaintEraser = ref(false);
const isGuideMode = ref(false);
const artRotation = ref(0);
const guideVectors = ref<GuideVectors>({
  top: [{ x: 0.2, y: 0.16 }, { x: 0.72, y: 0.28 }],
  bot: [{ x: 0.2, y: 0.88 }, { x: 0.72, y: 0.68 }]
});
const brushSize = ref(30);
const isEraser = ref(false);
const maskCanvas = ref<HTMLCanvasElement | null>(null);
const isMeasureMode = ref(false);
const measurePoints = ref<Point2D[]>([]);
const referenceMeters = ref(2.0);
const pixelsPerMeter = ref<number | null>(null);

const measuredLineText = computed(() => {
  if (!pixelsPerMeter.value || measurePoints.value.length < 2) return '';
  const bounds = viewportRef.value?.bounds;
  if (!bounds) return '';
  const m = measureDistanceMeters(
    measurePoints.value[0],
    measurePoints.value[1],
    pixelsPerMeter.value,
    bounds.width,
    bounds.height
  );
  return m !== null ? formatMeters(m) : '';
});

const quadMeasurement = computed(() => {
  if (!pixelsPerMeter.value || !projectStore.currentProject.artAssetUrl) return null;
  const bounds = viewportRef.value?.bounds;
  if (!bounds) return null;
  return measureQuadDimensions(
    projectStore.currentProject.cornerPoints,
    pixelsPerMeter.value,
    bounds.width,
    bounds.height
  );
});

function handleToggleMaskMode() {
  isMaskMode.value = !isMaskMode.value;
  if (isMaskMode.value) {
    isMeasureMode.value = false;
    isPaintMode.value = false;
    isGuideMode.value = false;
  }
}

function handleTogglePaintMode() {
  isPaintMode.value = !isPaintMode.value;
  if (isPaintMode.value) {
    isMaskMode.value = false;
    isMeasureMode.value = false;
    isGuideMode.value = false;
  }
}

function handleToggleGuideMode() {
  isGuideMode.value = !isGuideMode.value;
  if (isGuideMode.value) {
    isMaskMode.value = false;
    isMeasureMode.value = false;
    isPaintMode.value = false;
  }
}

function handlePaintUpdated(canvas: HTMLCanvasElement) {
  paintCanvas.value = canvas;
  triggerRef(paintCanvas);
}

function handleClearPaint() {
  if (viewportRef.value) {
    viewportRef.value.clearPaint();
  }
  paintCanvas.value = null;
}

function handleToggleMeasureMode() {
  isMeasureMode.value = !isMeasureMode.value;
  if (isMeasureMode.value) {
    isMaskMode.value = false;
    if (measurePoints.value.length < 2) {
      measurePoints.value = [
        { x: 0.25, y: 0.5 },
        { x: 0.75, y: 0.5 }
      ];
    }
  }
}

function handleCalibrateMeasure() {
  const bounds = viewportRef.value?.bounds;
  if (!bounds || measurePoints.value.length < 2) return;
  const ppm = computePixelsPerMeter(
    measurePoints.value[0],
    measurePoints.value[1],
    referenceMeters.value,
    bounds.width,
    bounds.height
  );
  if (ppm) {
    pixelsPerMeter.value = ppm;
  }
}

function handleClearMeasure() {
  pixelsPerMeter.value = null;
  measurePoints.value = [];
  isMeasureMode.value = false;
}
const isCameraActive = ref(false);
const artScale = ref(0.70);
const verticalPosition = ref(0);
const manualSlope = ref<number | null>(null);
const isImageEditorOpen = ref(false);
const isMatrixInspectorOpen = ref(false);
const isConvolutionFiltersOpen = ref(false);
const isThreeSceneOpen = ref(false);
const threeSceneTextureUrl = ref<string | null>(null);
const threeFullSceneUrl = ref<string | null>(null);
const threeInitialYaw = ref(0);
const threeInitialRoughness = ref(0.65);
const isProjectorModeOpen = ref(false);
const showPainterGrid = ref(false);
const directArtInputRef = ref<HTMLInputElement | null>(null);

function handleDirectArtUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  handleArtLoaded(url);
  setTimeout(() => {
    handleAutoFit();
  }, 100);
}

const shareModalOpen = ref(false);
const shareUrl = ref('');
const copied = ref(false);

function handleOpenImageEditor() {
  if (projectStore.currentProject.artAssetUrl) {
    isImageEditorOpen.value = true;
  }
}

function handleRemoveArt() {
  projectStore.pushHistory();
  projectStore.setArtAsset(null);
}

async function handleOpenThreeScene() {
  if (viewportRef.value) {
    try {
      const [fullUrl, rectified] = await Promise.all([
        viewportRef.value.exportHighRes('image/png'),
        viewportRef.value.exportRectifiedWall(0.06)
      ]);
      threeFullSceneUrl.value = fullUrl;
      if (rectified) {
        threeSceneTextureUrl.value = rectified.textureUrl;
        threeInitialYaw.value = rectified.yawAngle;
        threeInitialRoughness.value = rectified.roughness;
      } else {
        threeSceneTextureUrl.value = fullUrl;
        threeInitialYaw.value = 0;
      }
    } catch {
      threeSceneTextureUrl.value = null;
      threeFullSceneUrl.value = null;
    }
  }
  isThreeSceneOpen.value = true;
}

function handleSaveEditedArt(newUrl: string) {
  projectStore.pushHistory();
  projectStore.setArtAsset(newUrl);
  projectStore.saveProject();
}

function handleApplyFilter(newArtUrl: string) {
  projectStore.pushHistory();
  projectStore.setArtAsset(newArtUrl);
  projectStore.saveProject();
}

function handleUpdatePoint(index: number, point: Point2D) {
  projectStore.setCornerPoint(index, point);
}

function handleUpdatePoints(points: [Point2D, Point2D, Point2D, Point2D]) {
  projectStore.setCornerPoints(points);
}

function handleDragStart() {
  projectStore.pushHistory();
}

function handleDragEnd() {
  projectStore.saveProject();
}

function handleMaskUpdated(canvas: HTMLCanvasElement) {
  maskCanvas.value = canvas;
  projectStore.currentProject.isDirty = true;
}

function handleClearMask() {
  maskCanvas.value = null;
  viewportRef.value?.clearMask();
  projectStore.currentProject.isDirty = true;
}

async function handleToggleCamera() {
  if (isCameraActive.value) {
    isCameraActive.value = false;
  } else {
    try {
      const perm = await ensureCameraPermissions();
      if (!perm.granted) {
        alert(perm.error || 'Permissão de câmera necessária.');
        return;
      }
      isCameraActive.value = true;
    } catch (e: any) {
      alert(e.message || 'Não foi possível solicitar permissão para a câmera.');
    }
  }
}

function handleCaptureCamera() {
  if (!viewportRef.value) return;
  const dataUrl = viewportRef.value.captureCameraFrame();
  if (dataUrl) {
    projectStore.pushHistory();
    projectStore.setBasePhoto(dataUrl);
    isCameraActive.value = false;
    projectStore.saveProject();
  }
}

function handleCameraFrameCaptured(dataUrl: string) {
  projectStore.pushHistory();
  projectStore.setBasePhoto(dataUrl);
  isCameraActive.value = false;
  projectStore.saveProject();
}

function handleCameraError(error: string) {
  console.error('Camera error in view:', error);
  isCameraActive.value = false;
}

function handleBaseLoaded(url: string) {
  projectStore.pushHistory();
  isCameraActive.value = false;
  projectStore.setBasePhoto(url);
  projectStore.saveProject();
}

function handleArtLoaded(url: string) {
  projectStore.pushHistory();
  projectStore.setArtAsset(url);
  projectStore.saveProject();
}

function handleAutoFit() {
  if (!viewportRef.value) return;
  viewportRef.value.autoFitWall({
    scaleFactor: artScale.value,
    manualSlope: manualSlope.value,
    verticalOffset: verticalPosition.value
  });
}

function handleApplyPreset(slope: number) {
  manualSlope.value = slope;
  if (!viewportRef.value) return;
  viewportRef.value.applyDirectionPreset(slope);
}

function handleUpdateArtScale(scale: number) {
  artScale.value = scale;
  handleAutoFit();
}

function handleUpdateVerticalPosition(pos: number) {
  verticalPosition.value = pos;
  handleAutoFit();
}

async function handleSave() {
  const savedId = await projectStore.saveProject();
  if (route.params.id !== savedId) {
    router.replace(`/editor/${savedId}`);
  }
  saveFeedback.value = true;
  setTimeout(() => {
    saveFeedback.value = false;
  }, 2000);
}

async function handleShare() {
  const savedId = await projectStore.saveProject();
  if (route.params.id !== savedId) {
    router.replace(`/editor/${savedId}`);
  }

  let targetUrl = window.location.href;
  if (authStore.isAuthenticated && !savedId.startsWith('local_')) {
    try {
      const res = await apiRequest<{ shareUrl?: string; token?: string }>(`/projects/${savedId}/share`, {
        method: 'POST',
        body: JSON.stringify({ expiresInDays: 30 })
      });
      if (res.token) {
        targetUrl = `${window.location.origin}/share/${res.token}`;
      }
    } catch {}
  }

  shareUrl.value = targetUrl;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: projectStore.currentProject.title || 'Muralis',
        text: 'Confira a simulação do mural projetado:',
        url: shareUrl.value
      });
      return;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        shareModalOpen.value = true;
      }
      return;
    }
  }

  shareModalOpen.value = true;
}

function copyShareLink() {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2500);
  }
}

async function handleExport() {
  if (!viewportRef.value) return;
  try {
    const dataUrl = await viewportRef.value.exportHighRes('image/png');
    const safeTitle = (projectStore.currentProject.title || 'mural').toLowerCase().replace(/\s+/g, '-');
    const fileName = `${safeTitle}-muralis.png`;

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: projectStore.currentProject.title || 'Muralis',
          text: 'Simulação de mural em alta resolução gerada no Muralis'
        });
        return;
      }
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') return;
      console.warn('Native file share failed or unsupported, downloading file', shareErr);
    }

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export project', err);
  }
}

function isInputFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (active as HTMLElement).isContentEditable;
}

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (isInputFocused()) return;

  const isCtrlOrMeta = e.ctrlKey || e.metaKey;

  if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    projectStore.undo();
    return;
  }
  if ((isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'z') || (isCtrlOrMeta && e.key.toLowerCase() === 'y')) {
    e.preventDefault();
    projectStore.redo();
    return;
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    viewportRef.value?.deselect();
    return;
  }

  if ((e.key === 'Delete' || e.key === 'Backspace') && isMaskMode.value) {
    e.preventDefault();
    handleClearMask();
    return;
  }

  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    if (!projectStore.currentProject.cornerPoints || !projectStore.currentProject.artAssetUrl) return;
    e.preventDefault();
    const stepPx = e.shiftKey ? 10 : 1;
    const dx = (e.key === 'ArrowLeft' ? -stepPx : e.key === 'ArrowRight' ? stepPx : 0) / 800;
    const dy = (e.key === 'ArrowUp' ? -stepPx : e.key === 'ArrowDown' ? stepPx : 0) / 600;

    const currentCorners = projectStore.currentProject.cornerPoints;
    const updated = currentCorners.map(p => ({
      x: Number((p.x + dx).toFixed(4)),
      y: Number((p.y + dy).toFixed(4))
    })) as [Point2D, Point2D, Point2D, Point2D];

    projectStore.pushHistory();
    projectStore.setCornerPoints(updated);
    projectStore.saveProject();
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeyDown);

  const projectId = route.params.id as string;
  if (projectId) {
    await projectStore.loadProject(projectId);
    if (projectStore.currentProject.maskCanvas) {
      maskCanvas.value = projectStore.currentProject.maskCanvas;
    }
  }

  if (!projectStore.currentProject.basePhotoUrl) {
    try {
      const perm = await ensureCameraPermissions();
      if (perm.granted) {
        isCameraActive.value = true;
      }
    } catch (e) {
      console.warn('Auto camera start skipped:', e);
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown);
});
</script>
