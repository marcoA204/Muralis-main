<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden"
  >
    <!-- Top Floating Toolbar -->
    <div class="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
      <div class="flex items-center space-x-2 bg-concrete-900/90 border border-concrete-700 px-3 py-1.5 rounded-xs pointer-events-auto">
        <span class="w-2 h-2 rounded-full bg-paint animate-pulse"></span>
        <span class="font-mono text-xs font-bold text-paint uppercase">
          MODO PROJETOR (KEYSTONE INVERSO)
        </span>
      </div>

      <div class="flex items-center space-x-2 bg-concrete-900/90 border border-concrete-700 p-1 rounded-xs pointer-events-auto">
        <!-- Calibração Grid On/Off -->
        <button
          type="button"
          class="px-2.5 py-1 text-xs font-mono font-bold rounded-xs transition-colors"
          :class="showCalibrationGrid ? 'bg-paint text-paint-dark' : 'bg-concrete-800 text-concrete-300 hover:text-paper'"
          @click="showCalibrationGrid = !showCalibrationGrid; drawProjectorCanvas()"
        >
          Grade de Calibração
        </button>

        <!-- Inverter Homografia On/Off -->
        <button
          type="button"
          class="px-2.5 py-1 text-xs font-mono font-bold rounded-xs transition-colors"
          :class="applyInverseHomography ? 'bg-paint text-paint-dark' : 'bg-concrete-800 text-concrete-300 hover:text-paper'"
          @click="applyInverseHomography = !applyInverseHomography; drawProjectorCanvas()"
        >
          {{ applyInverseHomography ? 'Keystone Inverso Ativo' : 'Perspectiva Direta' }}
        </button>

        <!-- Sair do modo projetor -->
        <button
          type="button"
          class="p-1.5 bg-concrete-800 hover:bg-concrete-700 text-concrete-300 hover:text-paper rounded-xs transition-colors ml-2"
          aria-label="Sair do modo projetor"
          @click="$emit('close')"
        >
          <XIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Main Projector Canvas (Pure Black Background) -->
    <canvas ref="canvasRef" class="w-full h-full block bg-black object-contain"></canvas>

    <!-- Bottom Hint -->
    <div class="absolute bottom-4 text-center font-mono text-[11px] text-concrete-400 bg-black/75 px-3 py-1 rounded-xs pointer-events-none">
      Aponte seu projetor diretamente para a parede real. Pressione Esc ou feche no canto superior para sair.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { X as XIcon } from 'lucide-vue-next';
import { Point2D } from '../../engine/homography.js';
import { drawWarpedImage } from '../../engine/meshWarp.js';

const props = defineProps<{
  isOpen: boolean;
  artAssetUrl: string | null;
  cornerPoints: [Point2D, Point2D, Point2D, Point2D];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const showCalibrationGrid = ref(true);
const applyInverseHomography = ref(true);

let artImage: HTMLImageElement | null = null;

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      window.addEventListener('keydown', handleKeyDown);
      loadImageAndDraw();
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }
);

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close');
  }
}

function loadImageAndDraw() {
  if (!props.artAssetUrl) {
    drawProjectorCanvas();
    return;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    artImage = img;
    drawProjectorCanvas();
  };
  img.src = props.artAssetUrl;
}

function drawProjectorCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Fundo preto absoluto (não projeta luz fora da arte)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  // Cantos da projeção
  const targetCorners: [Point2D, Point2D, Point2D, Point2D] = applyInverseHomography.value
    ? [
        { x: (1 - props.cornerPoints[1].x) * w, y: (1 - props.cornerPoints[1].y) * h },
        { x: (1 - props.cornerPoints[0].x) * w, y: (1 - props.cornerPoints[0].y) * h },
        { x: (1 - props.cornerPoints[3].x) * w, y: (1 - props.cornerPoints[3].y) * h },
        { x: (1 - props.cornerPoints[2].x) * w, y: (1 - props.cornerPoints[2].y) * h }
      ]
    : [
        { x: props.cornerPoints[0].x * w, y: props.cornerPoints[0].y * h },
        { x: props.cornerPoints[1].x * w, y: props.cornerPoints[1].y * h },
        { x: props.cornerPoints[2].x * w, y: props.cornerPoints[2].y * h },
        { x: props.cornerPoints[3].x * w, y: props.cornerPoints[3].y * h }
      ];

  if (artImage) {
    drawWarpedImage(ctx, artImage, targetCorners, { subdivisions: 20 });
  }

  // Grade de calibração milimétrica
  if (showCalibrationGrid.value) {
    ctx.strokeStyle = '#00E699';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    const step = 60;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Miras centrais
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2);
    ctx.moveTo(w / 2 - 60, h / 2);
    ctx.lineTo(w / 2 + 60, h / 2);
    ctx.moveTo(w / 2, h / 2 - 60);
    ctx.lineTo(w / 2, h / 2 + 60);
    ctx.stroke();
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>
