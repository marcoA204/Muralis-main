<template>
  <div
    ref="containerRef"
    class="relative w-full h-full bg-concrete-950 flex items-center justify-center overflow-hidden cursor-default touch-none"
    @pointerdown="handleContainerPointerDown"
  >
    <div class="relative flex items-center justify-center shadow-md rounded-xs">
      <canvas ref="canvasRef" class="rounded-xs block"></canvas>

      <video
        ref="videoRef"
        class="hidden"
        playsinline
        autoplay
        muted
      ></video>

      <CornerHandles
        v-if="showHandles && isSelected && bounds.width > 0 && artImage && !isMaskMode && !isMeasureMode && !isPaintMode && !isGuideMode"
        :corner-points="cornerPoints"
        :canvas-bounds="bounds"
        :art-rotation="artRotation ?? 0"
        @update-point="(idx, pt) => $emit('updatePoint', idx, pt)"
        @update-points="(pts) => $emit('updatePoints', pts)"
        @drag-start="() => $emit('dragStart')"
        @drag-end="() => $emit('dragEnd')"
        @update:art-rotation="(deg) => $emit('updateArtRotation', deg)"
      />

      <PaintBrush
        v-if="isPaintMode"
        ref="paintBrushRef"
        :brush-size="paintBrushSize || 36"
        :color="paintColor || '#ffffff'"
        :opacity="paintOpacity ?? 0.85"
        :is-eraser="isPaintEraser || false"
        :canvas-bounds="bounds"
        @paint-updated="(canvas) => $emit('paintUpdated', canvas)"
      />

      <WallGuideVectors
        v-if="isGuideMode && guideVectors && bounds.width > 0"
        :guide-vectors="guideVectors"
        :canvas-bounds="bounds"
        @update:guide-vectors="(val) => $emit('updateGuideVectors', val)"
      />

      <MaskBrush
        v-if="isMaskMode"
        ref="maskBrushRef"
        :brush-size="brushSize || 30"
        :is-eraser="isEraser || false"
        :canvas-bounds="bounds"
        @mask-updated="(canvas) => $emit('maskUpdated', canvas)"
      />

      <WallMeasureOverlay
        v-if="isMeasureMode || (pixelsPerMeter && measurePoints && measurePoints.length === 2)"
        :is-active="!!isMeasureMode"
        :points="measurePoints || []"
        :pixels-per-meter="pixelsPerMeter ?? null"
        :canvas-bounds="{ width: bounds.width, height: bounds.height, left: 0, top: 0 }"
        @update:points="(pts) => $emit('updateMeasurePoints', pts)"
      />

      <div
        v-if="showHandles && !isSelected && artImage && !isMaskMode && !isMeasureMode && !isPaintMode && !isGuideMode"
        class="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-concrete-800 border border-concrete-600 text-concrete-300 font-mono text-[10px] rounded-xs pointer-events-none shadow-subtle"
      >
        Toque na arte para selecionar
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, reactive, shallowRef } from 'vue';
import { Point2D, computeHomography, transformPoint } from '../../engine/homography.js';
import { BlendMode, compositeLayers, RenderState, ValidBaseImage } from '../../engine/blendEngine.js';
import { calculateAutoFitCorners, applyDirectionToQuad, detectWallPlane, GuideVectors } from '../../engine/autoFit.js';
import { drawPerspectiveSquaringGrid } from '../../engine/squaringGrid.js';
import CornerHandles from './CornerHandles.vue';
import MaskBrush from './MaskBrush.vue';
import PaintBrush from './PaintBrush.vue';
import WallGuideVectors from './WallGuideVectors.vue';
import WallMeasureOverlay from './WallMeasureOverlay.vue';

const props = defineProps<{
  basePhotoUrl: string | null;
  artAssetUrl: string | null;
  cornerPoints: [Point2D, Point2D, Point2D, Point2D];
  blendMode: BlendMode;
  opacity: number;
  brightness: number;
  contrast: number;
  showHandles: boolean;
  maskCanvas?: HTMLCanvasElement | null;
  paintCanvas?: HTMLCanvasElement | null;
  isPaintMode?: boolean;
  paintColor?: string;
  paintBrushSize?: number;
  paintOpacity?: number;
  isPaintEraser?: boolean;
  isGuideMode?: boolean;
  guideVectors?: GuideVectors;
  isCameraActive?: boolean;
  isMaskMode?: boolean;
  brushSize?: number;
  isEraser?: boolean;
  isMeasureMode?: boolean;
  measurePoints?: Point2D[];
  pixelsPerMeter?: number | null;
  showPainterGrid?: boolean;
  artRotation?: number;
}>();

const emit = defineEmits<{
  (e: 'updatePoint', index: number, point: Point2D): void;
  (e: 'updatePoints', points: [Point2D, Point2D, Point2D, Point2D]): void;
  (e: 'dragStart'): void;
  (e: 'dragEnd'): void;
  (e: 'cameraFrameCaptured', dataUrl: string): void;
  (e: 'cameraError', error: string): void;
  (e: 'maskUpdated', canvas: HTMLCanvasElement): void;
  (e: 'paintUpdated', canvas: HTMLCanvasElement): void;
  (e: 'updateGuideVectors', value: GuideVectors): void;
  (e: 'updateArtRotation', value: number): void;
  (e: 'updateMeasurePoints', points: Point2D[]): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const maskBrushRef = ref<InstanceType<typeof MaskBrush> | null>(null);
const paintBrushRef = ref<InstanceType<typeof PaintBrush> | null>(null);

const baseImage = shallowRef<HTMLImageElement | null>(null);
const artImage = shallowRef<HTMLImageElement | null>(null);
const mediaStream = shallowRef<MediaStream | null>(null);

const isSelected = ref(true);

const bounds = reactive({
  width: 0,
  height: 0,
  screenX: 0,
  screenY: 0
});

let animationFrameId: number | null = null;
let isStartingCamera = false;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function isPointInsideQuad(pt: Point2D, quad: [Point2D, Point2D, Point2D, Point2D]): boolean {
  let inside = false;
  for (let i = 0, j = quad.length - 1; i < quad.length; j = i++) {
    const xi = quad[i].x, yi = quad[i].y;
    const xj = quad[j].x, yj = quad[j].y;
    const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
      (pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function handleContainerPointerDown(e: PointerEvent) {
  if (props.isMaskMode) return;
  if (!canvasRef.value) {
    isSelected.value = false;
    return;
  }

  const canvasRect = canvasRef.value.getBoundingClientRect();
  if (canvasRect.width === 0 || canvasRect.height === 0) {
    isSelected.value = false;
    return;
  }

  const normX = (e.clientX - canvasRect.left) / canvasRect.width;
  const normY = (e.clientY - canvasRect.top) / canvasRect.height;

  if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
    const inside = isPointInsideQuad({ x: normX, y: normY }, props.cornerPoints);
    isSelected.value = inside;
  } else {
    isSelected.value = false;
  }
}

async function startCamera() {
  if (isStartingCamera) return;

  const tracks = mediaStream.value?.getVideoTracks();
  if (mediaStream.value && tracks && tracks.length > 0 && tracks[0].readyState === 'live') {
    return;
  }

  isStartingCamera = true;
  stopCamera();

  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    mediaStream.value = stream;

    stream.getVideoTracks().forEach(track => {
      track.onended = () => {
        if (props.isCameraActive && document.visibilityState === 'visible') {
          startCamera();
        }
      };
    });

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
      updateLayout();
      startContinuousRender();
      autoFitWall();
      isSelected.value = true;
    }
  } catch (err: any) {
    console.error('Failed to start camera', err);
    emit('cameraError', err.message || 'Não foi possível acessar a câmera.');
  } finally {
    isStartingCamera = false;
  }
}

function stopCamera() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => {
      track.onended = null;
      track.stop();
    });
    mediaStream.value = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  stopContinuousRender();
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && props.isCameraActive) {
    const tracks = mediaStream.value?.getVideoTracks();
    const isLive = tracks && tracks.length > 0 && tracks[0].readyState === 'live';
    if (!isLive) {
      startCamera();
    }
  }
}

function captureCameraFrame(): string | null {
  if (!videoRef.value || !mediaStream.value) return null;

  const video = videoRef.value;
  const capCanvas = document.createElement('canvas');
  capCanvas.width = video.videoWidth || 1280;
  capCanvas.height = video.videoHeight || 720;
  const ctx = capCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, capCanvas.width, capCanvas.height);
  const dataUrl = capCanvas.toDataURL('image/jpeg', 0.92);
  emit('cameraFrameCaptured', dataUrl);
  return dataUrl;
}

function autoFitWall(options?: { scaleFactor?: number; manualSlope?: number | null; verticalOffset?: number; guideVectors?: GuideVectors | null }) {
  const baseTarget: ValidBaseImage | null = props.isCameraActive && videoRef.value
    ? videoRef.value
    : baseImage.value;

  if (!artImage.value) return;

  const activeGuides = options?.guideVectors !== undefined
    ? options.guideVectors
    : (props.isGuideMode && props.guideVectors ? props.guideVectors : null);

  const autoCorners = calculateAutoFitCorners(baseTarget, artImage.value, {
    ...options,
    guideVectors: activeGuides
  });
  emit('updatePoints', autoCorners);

  isSelected.value = true;
  requestRender();
}

function applyDirectionPreset(slope: number) {
  if (props.cornerPoints) {
    const updatedCorners = applyDirectionToQuad(props.cornerPoints, slope);
    emit('updatePoints', updatedCorners);
    isSelected.value = true;
    requestRender();
  }
}

async function updateBaseImage() {
  if (props.isCameraActive) return;

  if (!props.basePhotoUrl) {
    baseImage.value = null;
    requestRender();
    return;
  }
  try {
    baseImage.value = await loadImage(props.basePhotoUrl);
    updateLayout();
    autoFitWall();
    isSelected.value = true;
    requestRender();
  } catch (err) {
    console.error('Failed to load base photo', err);
  }
}

async function updateArtImage() {
  if (!props.artAssetUrl) {
    artImage.value = null;
    requestRender();
    return;
  }
  try {
    artImage.value = await loadImage(props.artAssetUrl);
    autoFitWall();
    isSelected.value = true;
    requestRender();
  } catch (err) {
    console.error('Failed to load art asset', err);
  }
}

function updateLayout() {
  if (!containerRef.value || !canvasRef.value) return;

  const containerRect = containerRef.value.getBoundingClientRect();
  const cWidth = containerRect.width - 32;
  const cHeight = containerRect.height - 32;

  let imgW = 800;
  let imgH = 600;

  if (props.isCameraActive && videoRef.value && videoRef.value.videoWidth > 0) {
    imgW = videoRef.value.videoWidth;
    imgH = videoRef.value.videoHeight;
  } else if (baseImage.value) {
    imgW = baseImage.value.naturalWidth;
    imgH = baseImage.value.naturalHeight;
  }

  const aspect = imgW / imgH;
  let renderW = cWidth;
  let renderH = cWidth / aspect;

  if (renderH > cHeight) {
    renderH = cHeight;
    renderW = cHeight * aspect;
  }

  renderW = Math.max(100, Math.floor(renderW));
  renderH = Math.max(100, Math.floor(renderH));

  const canvas = canvasRef.value;
  canvas.width = renderW;
  canvas.height = renderH;
  canvas.style.width = `${renderW}px`;
  canvas.style.height = `${renderH}px`;

  const canvasRect = canvas.getBoundingClientRect();
  bounds.width = renderW;
  bounds.height = renderH;
  bounds.screenX = canvasRect.left;
  bounds.screenY = canvasRect.top;
}

function startContinuousRender() {
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);

  const loop = () => {
    render();
    if (props.isCameraActive) {
      animationFrameId = requestAnimationFrame(loop);
    }
  };
  animationFrameId = requestAnimationFrame(loop);
}

function stopContinuousRender() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function requestRender() {
  if (props.isCameraActive) return;
  if (animationFrameId !== null) return;

  animationFrameId = requestAnimationFrame(() => {
    animationFrameId = null;
    render();
  });
}

function render() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  const currentBase: ValidBaseImage | null = props.isCameraActive && videoRef.value && videoRef.value.readyState >= 2
    ? videoRef.value
    : baseImage.value;

  const state: RenderState = {
    baseImage: currentBase,
    artImage: artImage.value,
    maskCanvas: props.maskCanvas,
    paintCanvas: props.paintCanvas,
    cornerPoints: props.cornerPoints,
    blendMode: props.blendMode,
    opacity: props.opacity,
    brightness: props.brightness,
    contrast: props.contrast,
    artRotation: props.artRotation ?? 0
  };

  const w = canvasRef.value.width;
  const h = canvasRef.value.height;
  compositeLayers(ctx, w, h, state, 16);

  // Grade de Perspectiva do Pintor (Squaring-up)
  if (props.showPainterGrid && artImage.value && props.cornerPoints) {
    const scaledCorners: [Point2D, Point2D, Point2D, Point2D] = [
      { x: props.cornerPoints[0].x * w, y: props.cornerPoints[0].y * h },
      { x: props.cornerPoints[1].x * w, y: props.cornerPoints[1].y * h },
      { x: props.cornerPoints[2].x * w, y: props.cornerPoints[2].y * h },
      { x: props.cornerPoints[3].x * w, y: props.cornerPoints[3].y * h }
    ];
    drawPerspectiveSquaringGrid(ctx, scaledCorners, { rows: 6, cols: 8 });
  }
}

async function exportHighRes(mimeType: 'image/png' | 'image/jpeg' = 'image/png'): Promise<string> {
  const currentBase: ValidBaseImage | null = props.isCameraActive && videoRef.value
    ? videoRef.value
    : baseImage.value;

  if (!currentBase) throw new Error('No base image to export');

  const naturalW = 'videoWidth' in currentBase ? currentBase.videoWidth : currentBase.naturalWidth;
  const naturalH = 'videoHeight' in currentBase ? currentBase.videoHeight : currentBase.naturalHeight;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = naturalW || 1920;
  exportCanvas.height = naturalH || 1080;

  const exportCtx = exportCanvas.getContext('2d');
  if (!exportCtx) throw new Error('Could not create export canvas context');

  const state: RenderState = {
    baseImage: currentBase,
    artImage: artImage.value,
    maskCanvas: props.maskCanvas,
    paintCanvas: props.paintCanvas,
    cornerPoints: props.cornerPoints,
    blendMode: props.blendMode,
    opacity: props.opacity,
    brightness: props.brightness,
    contrast: props.contrast,
    artRotation: props.artRotation ?? 0
  };

  compositeLayers(exportCtx, exportCanvas.width, exportCanvas.height, state, 32);

  if (props.showPainterGrid && artImage.value && props.cornerPoints) {
    const scaledCorners: [Point2D, Point2D, Point2D, Point2D] = [
      { x: props.cornerPoints[0].x * exportCanvas.width, y: props.cornerPoints[0].y * exportCanvas.height },
      { x: props.cornerPoints[1].x * exportCanvas.width, y: props.cornerPoints[1].y * exportCanvas.height },
      { x: props.cornerPoints[2].x * exportCanvas.width, y: props.cornerPoints[2].y * exportCanvas.height },
      { x: props.cornerPoints[3].x * exportCanvas.width, y: props.cornerPoints[3].y * exportCanvas.height }
    ];
    drawPerspectiveSquaringGrid(exportCtx, scaledCorners, { rows: 6, cols: 8 });
  }

  return exportCanvas.toDataURL(mimeType, 0.95);
}

async function exportRectifiedWall(margin = 0.06): Promise<{
  textureUrl: string;
  aspect: number;
  yawAngle: number;
  roughness: number;
} | null> {
  const currentBase: ValidBaseImage | null =
    props.isCameraActive && videoRef.value ? videoRef.value : baseImage.value;
  if (!currentBase) return null;

  const naturalW = ('videoWidth' in currentBase ? currentBase.videoWidth : currentBase.naturalWidth) || 800;
  const naturalH = ('videoHeight' in currentBase ? currentBase.videoHeight : currentBase.naturalHeight) || 600;
  const scale = Math.min(1, 1280 / Math.max(naturalW, naturalH));
  const srcW = Math.max(100, Math.round(naturalW * scale));
  const srcH = Math.max(100, Math.round(naturalH * scale));

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return null;

  compositeLayers(
    srcCtx,
    srcW,
    srcH,
    {
      baseImage: currentBase,
      artImage: artImage.value,
      maskCanvas: props.maskCanvas,
      paintCanvas: props.paintCanvas,
      cornerPoints: props.cornerPoints,
      blendMode: props.blendMode,
      opacity: props.opacity,
      brightness: props.brightness,
      contrast: props.contrast,
      artRotation: props.artRotation ?? 0
    },
    24
  );

  const [tl, tr, br, bl] = props.cornerPoints;
  const bilerp = (u: number, v: number): Point2D => {
    const topX = tl.x + (tr.x - tl.x) * u;
    const topY = tl.y + (tr.y - tl.y) * u;
    const botX = bl.x + (br.x - bl.x) * u;
    const botY = bl.y + (br.y - bl.y) * u;
    return {
      x: Math.max(0, Math.min(srcW - 1, (topX + (botX - topX) * v) * srcW)),
      y: Math.max(0, Math.min(srcH - 1, (topY + (botY - topY) * v) * srcH))
    };
  };

  const expandedQuad: [Point2D, Point2D, Point2D, Point2D] = [
    bilerp(-margin, -margin),
    bilerp(1 + margin, -margin),
    bilerp(1 + margin, 1 + margin),
    bilerp(-margin, 1 + margin)
  ];

  const topW = Math.hypot(expandedQuad[1].x - expandedQuad[0].x, expandedQuad[1].y - expandedQuad[0].y);
  const botW = Math.hypot(expandedQuad[2].x - expandedQuad[3].x, expandedQuad[2].y - expandedQuad[3].y);
  const leftH = Math.hypot(expandedQuad[3].x - expandedQuad[0].x, expandedQuad[3].y - expandedQuad[0].y);
  const rightH = Math.hypot(expandedQuad[2].x - expandedQuad[1].x, expandedQuad[2].y - expandedQuad[1].y);

  const avgW = Math.max(20, (topW + botW) / 2);
  const avgH = Math.max(20, (leftH + rightH) / 2);
  const aspect = Math.max(0.4, Math.min(2.8, avgW / avgH));

  const outW = 768;
  const outH = Math.max(256, Math.min(1024, Math.round(outW / aspect)));

  const dstRect: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0, y: 0 },
    { x: outW, y: 0 },
    { x: outW, y: outH },
    { x: 0, y: outH }
  ];

  const hMat = computeHomography(dstRect, expandedQuad);
  const srcImgData = srcCtx.getImageData(0, 0, srcW, srcH).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return null;

  const outImg = outCtx.createImageData(outW, outH);
  const dstData = outImg.data;

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const pt = transformPoint(hMat, { x, y });
      const sx = Math.max(0, Math.min(srcW - 1, Math.round(pt.x)));
      const sy = Math.max(0, Math.min(srcH - 1, Math.round(pt.y)));
      const sIdx = (sy * srcW + sx) * 4;
      const dIdx = (y * outW + x) * 4;
      dstData[dIdx] = srcImgData[sIdx];
      dstData[dIdx + 1] = srcImgData[sIdx + 1];
      dstData[dIdx + 2] = srcImgData[sIdx + 2];
      dstData[dIdx + 3] = 255;
    }
  }

  outCtx.putImageData(outImg, 0, 0);

  const ratio = (leftH - rightH) / Math.max(leftH, rightH, 1);
  const yawAngle = Math.max(-0.55, Math.min(0.55, ratio * 0.9));
  const wallInfo = detectWallPlane(currentBase);

  return {
    textureUrl: outCanvas.toDataURL('image/png'),
    aspect,
    yawAngle,
    roughness: wallInfo.textureRoughness
  };
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isSelected.value = false;
  }
}

function clearMask() {
  if (maskBrushRef.value) {
    maskBrushRef.value.clearMask();
  }
}

function clearPaint() {
  if (paintBrushRef.value) {
    paintBrushRef.value.clearPaint();
  }
}

defineExpose({
  bounds,
  exportHighRes,
  exportRectifiedWall,
  updateLayout,
  startCamera,
  stopCamera,
  captureCameraFrame,
  autoFitWall,
  applyDirectionPreset,
  clearMask,
  clearPaint,
  select: () => (isSelected.value = true),
  deselect: () => (isSelected.value = false)
});

watch(() => props.isCameraActive, (active) => {
  if (active) {
    startCamera();
  } else {
    stopCamera();
    updateBaseImage();
  }
});

watch(() => props.basePhotoUrl, updateBaseImage);
watch(() => props.artAssetUrl, updateArtImage);
watch(
  [
    () => props.cornerPoints,
    () => props.blendMode,
    () => props.opacity,
    () => props.brightness,
    () => props.contrast,
    () => props.maskCanvas,
    () => props.paintCanvas,
    () => props.artRotation,
    () => props.showPainterGrid
  ],
  () => {
    if (!props.isCameraActive) requestRender();
  },
  { deep: true }
);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('keydown', handleKeyDown);

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateLayout();
      requestRender();
    });
    resizeObserver.observe(containerRef.value);
  }

  if (props.isCameraActive) {
    startCamera();
  } else {
    updateBaseImage();
  }
  updateArtImage();
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('keydown', handleKeyDown);
  stopCamera();
  if (resizeObserver) resizeObserver.disconnect();
  stopContinuousRender();
});
</script>
