<template>
  <div
    ref="maskContainerRef"
    class="absolute inset-0 z-20 cursor-crosshair touch-none overflow-hidden"
    @pointerdown="handlePointerDown"
  >
    <canvas ref="maskCanvasRef" class="w-full h-full pointer-events-none block"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  brushSize: number;
  isEraser: boolean;
  canvasBounds: { width: number; height: number };
}>();

const emit = defineEmits<{
  (e: 'maskUpdated', canvas: HTMLCanvasElement): void;
}>();

const maskContainerRef = ref<HTMLDivElement | null>(null);
const maskCanvasRef = ref<HTMLCanvasElement | null>(null);

const MASTER_RES = 2048;
let masterCanvas: HTMLCanvasElement | null = null;
let masterCtx: CanvasRenderingContext2D | null = null;
let isDrawing = false;

function initMasterCanvas() {
  if (!masterCanvas) {
    masterCanvas = document.createElement('canvas');
    masterCanvas.width = MASTER_RES;
    masterCanvas.height = MASTER_RES;
    masterCtx = masterCanvas.getContext('2d');
  }
}

function syncDisplayCanvas() {
  if (!maskCanvasRef.value || !masterCanvas) return;
  const { width, height } = props.canvasBounds;
  if (width <= 0 || height <= 0) return;

  const displayCanvas = maskCanvasRef.value;
  displayCanvas.width = width;
  displayCanvas.height = height;

  const ctx = displayCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  ctx.drawImage(masterCanvas, 0, 0, width, height);
}

function handlePointerDown(e: PointerEvent) {
  if (!maskCanvasRef.value || !masterCanvas || !masterCtx) return;
  const displayCanvas = maskCanvasRef.value;
  const displayCtx = displayCanvas.getContext('2d');
  if (!displayCtx) return;

  const { width, height } = props.canvasBounds;
  if (width <= 0 || height <= 0) return;

  const rect = displayCanvas.getBoundingClientRect();
  const startX = e.clientX - rect.left;
  const startY = e.clientY - rect.top;

  isDrawing = true;
  try {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  } catch {}

  const scaleToMaster = MASTER_RES / width;
  const masterBrushRadius = (props.brushSize / 2) * scaleToMaster;

  masterCtx.lineCap = 'round';
  masterCtx.lineJoin = 'round';
  masterCtx.lineWidth = props.brushSize * scaleToMaster;
  if (props.isEraser) {
    masterCtx.globalCompositeOperation = 'destination-out';
  } else {
    masterCtx.globalCompositeOperation = 'source-over';
    masterCtx.fillStyle = '#000000';
    masterCtx.strokeStyle = '#000000';
  }

  displayCtx.lineCap = 'round';
  displayCtx.lineJoin = 'round';
  displayCtx.lineWidth = props.brushSize;
  if (props.isEraser) {
    displayCtx.globalCompositeOperation = 'destination-out';
  } else {
    displayCtx.globalCompositeOperation = 'source-over';
    displayCtx.fillStyle = '#000000';
    displayCtx.strokeStyle = '#000000';
  }

  const normX = startX / width;
  const normY = startY / height;
  const masterX = normX * MASTER_RES;
  const masterY = normY * MASTER_RES;

  masterCtx.beginPath();
  masterCtx.arc(masterX, masterY, masterBrushRadius, 0, Math.PI * 2);
  masterCtx.fill();

  displayCtx.beginPath();
  displayCtx.arc(startX, startY, props.brushSize / 2, 0, Math.PI * 2);
  displayCtx.fill();

  let lastX = startX;
  let lastY = startY;
  let lastMasterX = masterX;
  let lastMasterY = masterY;

  const onPointerMove = (moveEvent: PointerEvent) => {
    if (!isDrawing || !masterCtx || !displayCtx) return;
    const curX = moveEvent.clientX - rect.left;
    const curY = moveEvent.clientY - rect.top;

    const curNormX = curX / width;
    const curNormY = curY / height;
    const curMasterX = curNormX * MASTER_RES;
    const curMasterY = curNormY * MASTER_RES;

    masterCtx.beginPath();
    masterCtx.moveTo(lastMasterX, lastMasterY);
    masterCtx.lineTo(curMasterX, curMasterY);
    masterCtx.stroke();

    displayCtx.beginPath();
    displayCtx.moveTo(lastX, lastY);
    displayCtx.lineTo(curX, curY);
    displayCtx.stroke();

    lastX = curX;
    lastY = curY;
    lastMasterX = curMasterX;
    lastMasterY = curMasterY;

    if (masterCanvas) {
      emit('maskUpdated', masterCanvas);
    }
  };

  const onPointerUp = (upEvent: PointerEvent) => {
    isDrawing = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(upEvent.pointerId);
    } catch {}
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    if (masterCanvas) {
      emit('maskUpdated', masterCanvas);
    }
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function clearMask() {
  if (masterCanvas && masterCtx) {
    masterCtx.clearRect(0, 0, masterCanvas.width, masterCanvas.height);
  }
  if (maskCanvasRef.value) {
    const ctx = maskCanvasRef.value.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, maskCanvasRef.value.width, maskCanvasRef.value.height);
    }
  }
  if (masterCanvas) {
    emit('maskUpdated', masterCanvas);
  }
}

defineExpose({
  clearMask,
  getMasterCanvas: () => masterCanvas,
  getCanvas: () => maskCanvasRef.value
});

onMounted(() => {
  initMasterCanvas();
  syncDisplayCanvas();
});

watch(
  () => props.canvasBounds,
  () => {
    syncDisplayCanvas();
  },
  { deep: true }
);
</script>
