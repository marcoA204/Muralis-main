<template>
  <div
    ref="containerRef"
    class="absolute inset-0 z-20 cursor-none touch-none overflow-hidden"
    @pointerdown="handlePointerDown"
    @pointermove="handleHoverMove"
    @pointerleave="cursorVisible = false"
  >
    <div
      v-if="cursorVisible"
      class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm"
      :style="{
        left: `${cursorX}px`,
        top: `${cursorY}px`,
        width: `${brushSize}px`,
        height: `${brushSize}px`,
        borderColor: isEraser ? '#ffffff' : color,
        borderStyle: isEraser ? 'dashed' : 'solid',
        backgroundColor: isEraser ? 'rgba(255,255,255,0.12)' : 'transparent'
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  brushSize: number;
  color: string;
  opacity: number;
  isEraser: boolean;
  canvasBounds: { width: number; height: number };
}>();

const emit = defineEmits<{
  (e: 'paintUpdated', canvas: HTMLCanvasElement): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const cursorVisible = ref(false);
const cursorX = ref(0);
const cursorY = ref(0);

const MASTER_RES = 2048;
let masterCanvas: HTMLCanvasElement | null = null;
let masterCtx: CanvasRenderingContext2D | null = null;
let strokeCanvas: HTMLCanvasElement | null = null;
let strokeCtx: CanvasRenderingContext2D | null = null;
let compositeCanvas: HTMLCanvasElement | null = null;
let compositeCtx: CanvasRenderingContext2D | null = null;
let isDrawing = false;

function initCanvases() {
  if (!masterCanvas) {
    masterCanvas = document.createElement('canvas');
    masterCanvas.width = MASTER_RES;
    masterCanvas.height = MASTER_RES;
    masterCtx = masterCanvas.getContext('2d');
  }
  if (!strokeCanvas) {
    strokeCanvas = document.createElement('canvas');
    strokeCanvas.width = MASTER_RES;
    strokeCanvas.height = MASTER_RES;
    strokeCtx = strokeCanvas.getContext('2d');
  }
  if (!compositeCanvas) {
    compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = MASTER_RES;
    compositeCanvas.height = MASTER_RES;
    compositeCtx = compositeCanvas.getContext('2d');
  }
}

function handleHoverMove(e: PointerEvent) {
  const el = containerRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  cursorX.value = e.clientX - rect.left;
  cursorY.value = e.clientY - rect.top;
  cursorVisible.value = true;
}

function emitCompositePreview() {
  if (!compositeCanvas || !compositeCtx || !masterCanvas || !strokeCanvas) return;
  compositeCtx.clearRect(0, 0, MASTER_RES, MASTER_RES);
  compositeCtx.globalAlpha = 1;
  compositeCtx.drawImage(masterCanvas, 0, 0);
  compositeCtx.save();
  compositeCtx.globalAlpha = props.opacity;
  compositeCtx.drawImage(strokeCanvas, 0, 0);
  compositeCtx.restore();
  emit('paintUpdated', compositeCanvas);
}

function handlePointerDown(e: PointerEvent) {
  initCanvases();
  const el = containerRef.value;
  if (!el || !masterCanvas || !masterCtx || !strokeCanvas || !strokeCtx) return;

  const { width, height } = props.canvasBounds;
  if (width <= 0 || height <= 0) return;

  const rect = el.getBoundingClientRect();
  const startX = e.clientX - rect.left;
  const startY = e.clientY - rect.top;
  cursorX.value = startX;
  cursorY.value = startY;
  cursorVisible.value = true;

  isDrawing = true;
  try {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  } catch {}

  const scaleToMasterX = MASTER_RES / width;
  const scaleToMasterY = MASTER_RES / height;
  const scaleAvg = (scaleToMasterX + scaleToMasterY) / 2;
  const masterBrushRadius = (props.brushSize / 2) * scaleAvg;

  const targetCtx = props.isEraser ? masterCtx : strokeCtx;
  if (!props.isEraser) {
    strokeCtx.clearRect(0, 0, MASTER_RES, MASTER_RES);
  }

  targetCtx.lineCap = 'round';
  targetCtx.lineJoin = 'round';
  targetCtx.lineWidth = props.brushSize * scaleAvg;

  if (props.isEraser) {
    targetCtx.globalCompositeOperation = 'destination-out';
  } else {
    targetCtx.globalCompositeOperation = 'source-over';
    targetCtx.fillStyle = props.color;
    targetCtx.strokeStyle = props.color;
  }

  let lastMasterX = (startX / width) * MASTER_RES;
  let lastMasterY = (startY / height) * MASTER_RES;

  targetCtx.beginPath();
  targetCtx.arc(lastMasterX, lastMasterY, masterBrushRadius, 0, Math.PI * 2);
  targetCtx.fill();

  if (props.isEraser) {
    emit('paintUpdated', masterCanvas);
  } else {
    emitCompositePreview();
  }

  const onPointerMove = (moveEvent: PointerEvent) => {
    if (!isDrawing) return;
    const curX = moveEvent.clientX - rect.left;
    const curY = moveEvent.clientY - rect.top;
    cursorX.value = curX;
    cursorY.value = curY;

    const curMasterX = (curX / width) * MASTER_RES;
    const curMasterY = (curY / height) * MASTER_RES;

    targetCtx.beginPath();
    targetCtx.moveTo(lastMasterX, lastMasterY);
    targetCtx.lineTo(curMasterX, curMasterY);
    targetCtx.stroke();

    lastMasterX = curMasterX;
    lastMasterY = curMasterY;

    if (props.isEraser && masterCanvas) {
      emit('paintUpdated', masterCanvas);
    } else {
      emitCompositePreview();
    }
  };

  const onPointerUp = (upEvent: PointerEvent) => {
    isDrawing = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(upEvent.pointerId);
    } catch {}
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    if (!props.isEraser && masterCtx && strokeCanvas) {
      masterCtx.save();
      masterCtx.globalCompositeOperation = 'source-over';
      masterCtx.globalAlpha = props.opacity;
      masterCtx.drawImage(strokeCanvas, 0, 0);
      masterCtx.restore();
      strokeCtx?.clearRect(0, 0, MASTER_RES, MASTER_RES);
    }

    if (masterCanvas) {
      emit('paintUpdated', masterCanvas);
    }
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function clearPaint() {
  if (masterCanvas && masterCtx) {
    masterCtx.clearRect(0, 0, masterCanvas.width, masterCanvas.height);
  }
  if (strokeCanvas && strokeCtx) {
    strokeCtx.clearRect(0, 0, strokeCanvas.width, strokeCanvas.height);
  }
  if (compositeCanvas && compositeCtx) {
    compositeCtx.clearRect(0, 0, compositeCanvas.width, compositeCanvas.height);
  }
  if (masterCanvas) {
    emit('paintUpdated', masterCanvas);
  }
}

defineExpose({
  clearPaint,
  getMasterCanvas: () => masterCanvas
});

onMounted(() => {
  initCanvases();
});
</script>
