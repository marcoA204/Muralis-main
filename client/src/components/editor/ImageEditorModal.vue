<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-2 sm:p-4 select-none"
  >
    <div class="bg-concrete-800 border-2 border-concrete-600 rounded-xs shadow-brutalist max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden">

      <div class="h-12 bg-concrete-900 border-b-2 border-paint px-4 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-2">
          <span class="w-1.5 h-3.5 bg-paint"></span>
          <span class="px-1.5 py-0.5 bg-paint text-paint-dark font-mono text-[11px] font-bold uppercase rounded-xs">
            EDITAR ARTE
          </span>
          <h3 class="text-sm font-display font-black text-paper uppercase tracking-wider">
            Recortar e Transformar
          </h3>
        </div>
        <button
          type="button"
          class="p-1.5 text-concrete-300 hover:text-paper rounded-xs hover:bg-concrete-700 transition-colors"
          aria-label="Fechar editor de imagem"
          @click="$emit('close')"
        >
          <XIcon class="w-4 h-4" />
        </button>
      </div>

      <div class="bg-concrete-800 border-b border-concrete-600 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">

        <div class="flex items-center space-x-1 sm:space-x-2">
          <button
            type="button"
            class="px-2.5 py-1.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono font-bold text-paper flex items-center space-x-1 transition-colors"
            title="Girar 90° Esquerda"
            @click="rotateCounterClockwise"
          >
            <RotateCcwIcon class="w-3.5 h-3.5 text-paint" />
            <span class="hidden sm:inline">-90°</span>
          </button>
          <button
            type="button"
            class="px-2.5 py-1.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono font-bold text-paper flex items-center space-x-1 transition-colors"
            title="Girar 90° Direita"
            @click="rotateClockwise"
          >
            <RotateCwIcon class="w-3.5 h-3.5 text-paint" />
            <span class="hidden sm:inline">+90°</span>
          </button>
          <button
            type="button"
            class="px-2.5 py-1.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono font-bold text-paper flex items-center space-x-1 transition-colors"
            :class="flipH ? 'bg-concrete-600 border-paint text-paint' : ''"
            title="Espelhar Horizontal"
            @click="flipH = !flipH; drawPreview()"
          >
            <FlipHorizontalIcon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Espelhar H</span>
          </button>
          <button
            type="button"
            class="px-2.5 py-1.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono font-bold text-paper flex items-center space-x-1 transition-colors"
            :class="flipV ? 'bg-concrete-600 border-paint text-paint' : ''"
            title="Espelhar Vertical"
            @click="flipV = !flipV; drawPreview()"
          >
            <FlipVerticalIcon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Espelhar V</span>
          </button>
        </div>

        <div class="flex items-center space-x-1">
          <span class="text-[11px] font-mono text-concrete-300 mr-1 hidden md:inline">Corte:</span>
          <button
            v-for="aspect in aspectOptions"
            :key="aspect.id"
            type="button"
            class="px-2 py-1 text-xs font-mono font-bold rounded-xs border transition-colors"
            :class="selectedAspect === aspect.id ? 'bg-paint text-paint-dark border-paint' : 'bg-concrete-700 border-concrete-600 text-concrete-300 hover:bg-concrete-600 hover:text-paper'"
            @click="changeAspectRatio(aspect.id)"
          >
            {{ aspect.label }}
          </button>
        </div>
      </div>

      <div
        ref="previewContainerRef"
        class="flex-1 bg-concrete-950 overflow-hidden relative flex items-center justify-center p-4 min-h-[260px]"
      >
        <div
          ref="cropWrapperRef"
          class="relative select-none shadow-md"
          :style="{ width: `${stageWidth}px`, height: `${stageHeight}px` }"
        >
          <canvas
            ref="previewCanvasRef"
            :width="stageWidth"
            :height="stageHeight"
            class="block w-full h-full pointer-events-none rounded-xs"
          ></canvas>

          <svg class="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <mask id="cropMask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  :x="cropRect.x"
                  :y="cropRect.y"
                  :width="cropRect.w"
                  :height="cropRect.h"
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(15, 14, 13, 0.72)" mask="url(#cropMask)" />
          </svg>

          <div
            class="absolute border border-paint z-20 cursor-move"
            :style="{
              left: `${cropRect.x}px`,
              top: `${cropRect.y}px`,
              width: `${cropRect.w}px`,
              height: `${cropRect.h}px`
            }"
            @pointerdown="startCropMove"
          >

            <div class="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div class="border-r border-b border-paint/40"></div>
              <div class="border-r border-b border-paint/40"></div>
              <div class="border-b border-paint/40"></div>
              <div class="border-r border-b border-paint/40"></div>
              <div class="border-r border-b border-paint/40"></div>
              <div class="border-b border-paint/40"></div>
              <div class="border-r border-b border-paint/40"></div>
              <div class="border-r border-b border-paint/40"></div>
              <div></div>
            </div>

            <div
              class="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-paper border border-paint-dark rounded-xs cursor-nwse-resize z-30"
              @pointerdown.stop="(e) => startResize('tl', e)"
            ></div>
            <div
              class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-paper border border-paint-dark rounded-xs cursor-nesw-resize z-30"
              @pointerdown.stop="(e) => startResize('tr', e)"
            ></div>
            <div
              class="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-paper border border-paint-dark rounded-xs cursor-nwse-resize z-30"
              @pointerdown.stop="(e) => startResize('br', e)"
            ></div>
            <div
              class="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-paper border border-paint-dark rounded-xs cursor-nesw-resize z-30"
              @pointerdown.stop="(e) => startResize('bl', e)"
            ></div>
          </div>
        </div>
      </div>

      <div class="h-14 bg-concrete-900 border-t-2 border-concrete-600 px-4 flex items-center justify-between shrink-0">
        <button
          type="button"
          class="px-3 py-1.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono font-bold text-concrete-300 hover:text-paper transition-colors"
          @click="resetAll"
        >
          Resetar
        </button>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            class="px-4 py-1.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono font-bold text-paper transition-colors"
            @click="$emit('close')"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="px-5 py-1.5 bg-paint hover:bg-paint-hover border border-paint text-paint-dark rounded-xs text-xs font-mono font-black uppercase tracking-wider transition-colors flex items-center space-x-1.5 shadow-subtle"
            @click="applyAndSave"
          >
            <CheckIcon class="w-4 h-4 stroke-[2.5]" />
            <span>Aplicar Recorte</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue';
import {
  X as XIcon,
  RotateCw as RotateCwIcon,
  RotateCcw as RotateCcwIcon,
  FlipHorizontal as FlipHorizontalIcon,
  FlipVertical as FlipVerticalIcon,
  Check as CheckIcon
} from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  imageUrl: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', newUrl: string): void;
}>();

const previewContainerRef = ref<HTMLDivElement | null>(null);
const previewCanvasRef = ref<HTMLCanvasElement | null>(null);
const cropWrapperRef = ref<HTMLDivElement | null>(null);

const sourceImage = ref<HTMLImageElement | null>(null);

const rotation = ref(0);
const flipH = ref(false);
const flipV = ref(false);

const stageWidth = ref(400);
const stageHeight = ref(300);

const selectedAspect = ref<'free' | '1:1' | '4:3' | '16:9'>('free');

const aspectOptions = [
  { id: 'free' as const, label: 'Livre' },
  { id: '1:1' as const, label: '1:1' },
  { id: '4:3' as const, label: '4:3' },
  { id: '16:9' as const, label: '16:9' }
];

const cropRect = reactive({
  x: 20,
  y: 20,
  w: 200,
  h: 200
});

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.imageUrl) {
      resetAll();
      loadImage(props.imageUrl);
    }
  }
);

function loadImage(src: string) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    sourceImage.value = img;
    nextTick(() => {
      calculateStageSize();
      initCropRect();
      drawPreview();
    });
  };
  img.src = src;
}

function calculateStageSize() {
  if (!sourceImage.value || !previewContainerRef.value) return;

  const containerRect = previewContainerRef.value.getBoundingClientRect();
  const maxW = Math.max(200, containerRect.width - 40);
  const maxH = Math.max(180, containerRect.height - 40);

  const isRotated90 = rotation.value === 90 || rotation.value === 270;
  const rawW = isRotated90 ? sourceImage.value.naturalHeight : sourceImage.value.naturalWidth;
  const rawH = isRotated90 ? sourceImage.value.naturalWidth : sourceImage.value.naturalHeight;

  const aspect = rawW / rawH;
  let w = maxW;
  let h = maxW / aspect;

  if (h > maxH) {
    h = maxH;
    w = maxH * aspect;
  }

  stageWidth.value = Math.floor(w);
  stageHeight.value = Math.floor(h);
}

function initCropRect() {
  const margin = 16;
  cropRect.x = margin;
  cropRect.y = margin;
  cropRect.w = Math.max(60, stageWidth.value - margin * 2);
  cropRect.h = Math.max(60, stageHeight.value - margin * 2);
  enforceAspectRatio();
}

function changeAspectRatio(aspect: 'free' | '1:1' | '4:3' | '16:9') {
  selectedAspect.value = aspect;
  enforceAspectRatio();
}

function enforceAspectRatio() {
  if (selectedAspect.value === 'free') return;

  let ratio = 1;
  if (selectedAspect.value === '4:3') ratio = 4 / 3;
  if (selectedAspect.value === '16:9') ratio = 16 / 9;

  let targetW = cropRect.w;
  let targetH = targetW / ratio;

  if (cropRect.y + targetH > stageHeight.value) {
    targetH = stageHeight.value - cropRect.y;
    targetW = targetH * ratio;
  }
  if (cropRect.x + targetW > stageWidth.value) {
    targetW = stageWidth.value - cropRect.x;
    targetH = targetW / ratio;
  }

  cropRect.w = Math.max(40, targetW);
  cropRect.h = Math.max(40, targetH);
}

function rotateClockwise() {
  rotation.value = (rotation.value + 90) % 360;
  calculateStageSize();
  initCropRect();
  drawPreview();
}

function rotateCounterClockwise() {
  rotation.value = (rotation.value + 270) % 360;
  calculateStageSize();
  initCropRect();
  drawPreview();
}

function resetAll() {
  rotation.value = 0;
  flipH.value = false;
  flipV.value = false;
  selectedAspect.value = 'free';
  if (sourceImage.value) {
    calculateStageSize();
    initCropRect();
    drawPreview();
  }
}

function drawPreview() {
  if (!previewCanvasRef.value || !sourceImage.value) return;
  const canvas = previewCanvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation.value * Math.PI) / 180);
  ctx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1);

  const isRotated90 = rotation.value === 90 || rotation.value === 270;
  const drawW = isRotated90 ? canvas.height : canvas.width;
  const drawH = isRotated90 ? canvas.width : canvas.height;

  ctx.drawImage(sourceImage.value, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function startCropMove(e: PointerEvent) {
  e.preventDefault();
  const startX = e.clientX;
  const startY = e.clientY;
  const initialX = cropRect.x;
  const initialY = cropRect.y;

  const onPointerMove = (ev: PointerEvent) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    const newX = Math.max(0, Math.min(stageWidth.value - cropRect.w, initialX + dx));
    const newY = Math.max(0, Math.min(stageHeight.value - cropRect.h, initialY + dy));

    cropRect.x = newX;
    cropRect.y = newY;
  };

  const onPointerUp = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function startResize(handle: 'tl' | 'tr' | 'bl' | 'br', e: PointerEvent) {
  e.preventDefault();
  const startX = e.clientX;
  const startY = e.clientY;
  const initialX = cropRect.x;
  const initialY = cropRect.y;
  const initialW = cropRect.w;
  const initialH = cropRect.h;

  let ratio: number | null = null;
  if (selectedAspect.value === '1:1') ratio = 1;
  else if (selectedAspect.value === '4:3') ratio = 4 / 3;
  else if (selectedAspect.value === '16:9') ratio = 16 / 9;

  const onPointerMove = (ev: PointerEvent) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    if (handle === 'br') {
      let newW = Math.max(40, Math.min(stageWidth.value - initialX, initialW + dx));
      let newH = ratio ? newW / ratio : Math.max(40, Math.min(stageHeight.value - initialY, initialH + dy));
      if (initialY + newH > stageHeight.value && ratio) {
        newH = stageHeight.value - initialY;
        newW = newH * ratio;
      }
      cropRect.w = newW;
      cropRect.h = newH;
    } else if (handle === 'bl') {
      let newW = Math.max(40, Math.min(initialX + initialW, initialW - dx));
      let newX = initialX + (initialW - newW);
      let newH = ratio ? newW / ratio : Math.max(40, Math.min(stageHeight.value - initialY, initialH + dy));
      if (initialY + newH > stageHeight.value && ratio) {
        newH = stageHeight.value - initialY;
        newW = newH * ratio;
        newX = initialX + (initialW - newW);
      }
      cropRect.x = newX;
      cropRect.w = newW;
      cropRect.h = newH;
    } else if (handle === 'tr') {
      let newW = Math.max(40, Math.min(stageWidth.value - initialX, initialW + dx));
      let newH = ratio ? newW / ratio : Math.max(40, Math.min(initialY + initialH, initialH - dy));
      let newY = initialY + (initialH - newH);
      if (newY < 0 && ratio) {
        newY = 0;
        newH = initialY + initialH;
        newW = newH * ratio;
      }
      cropRect.y = newY;
      cropRect.w = newW;
      cropRect.h = newH;
    } else if (handle === 'tl') {
      let newW = Math.max(40, Math.min(initialX + initialW, initialW - dx));
      let newX = initialX + (initialW - newW);
      let newH = ratio ? newW / ratio : Math.max(40, Math.min(initialY + initialH, initialH - dy));
      let newY = initialY + (initialH - newH);
      if (newY < 0 && ratio) {
        newY = 0;
        newH = initialY + initialH;
        newW = newH * ratio;
        newX = initialX + (initialW - newW);
      }
      cropRect.x = newX;
      cropRect.y = newY;
      cropRect.w = newW;
      cropRect.h = newH;
    }
  };

  const onPointerUp = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function applyAndSave() {
  if (!sourceImage.value) return;

  const isRotated90 = rotation.value === 90 || rotation.value === 270;
  const transformedW = isRotated90 ? sourceImage.value.naturalHeight : sourceImage.value.naturalWidth;
  const transformedH = isRotated90 ? sourceImage.value.naturalWidth : sourceImage.value.naturalHeight;

  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = transformedW;
  fullCanvas.height = transformedH;
  const fullCtx = fullCanvas.getContext('2d');
  if (!fullCtx) return;

  fullCtx.save();
  fullCtx.translate(transformedW / 2, transformedH / 2);
  fullCtx.rotate((rotation.value * Math.PI) / 180);
  fullCtx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1);

  const drawW = isRotated90 ? transformedH : transformedW;
  const drawH = isRotated90 ? transformedW : transformedH;

  fullCtx.drawImage(sourceImage.value, -drawW / 2, -drawH / 2, drawW, drawH);
  fullCtx.restore();

  const scaleX = transformedW / stageWidth.value;
  const scaleY = transformedH / stageHeight.value;

  const cropX = Math.floor(cropRect.x * scaleX);
  const cropY = Math.floor(cropRect.y * scaleY);
  const cropW = Math.floor(cropRect.w * scaleX);
  const cropH = Math.floor(cropRect.h * scaleY);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = Math.max(1, cropW);
  croppedCanvas.height = Math.max(1, cropH);
  const cropCtx = croppedCanvas.getContext('2d');
  if (!cropCtx) return;

  cropCtx.drawImage(
    fullCanvas,
    cropX, cropY, cropW, cropH,
    0, 0, cropW, cropH
  );

  const resultDataUrl = croppedCanvas.toDataURL('image/png');
  emit('save', resultDataUrl);
  emit('close');
}
</script>
