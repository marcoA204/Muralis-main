<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-2 sm:p-4 select-none"
  >
    <div class="bg-concrete-800 border-2 border-concrete-600 rounded-xs shadow-brutalist max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden">
      <!-- Header -->
      <div class="h-12 bg-concrete-900 border-b-2 border-paint px-4 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-2">
          <span class="w-1.5 h-3.5 bg-paint"></span>
          <span class="px-1.5 py-0.5 bg-paint text-paint-dark font-mono text-[11px] font-bold uppercase rounded-xs">
            PDI / CONVOLUÇÃO
          </span>
          <h3 class="text-sm font-display font-black text-paper uppercase tracking-wider">
            Filtros Matriciais 3x3 e Relevo
          </h3>
        </div>
        <button
          type="button"
          class="p-1.5 text-concrete-300 hover:text-paper rounded-xs hover:bg-concrete-700 transition-colors"
          aria-label="Fechar modal de filtros"
          @click="$emit('close')"
        >
          <XIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 overflow-y-auto space-y-4">
        <!-- Preset Kernels Selection -->
        <div>
          <label class="block text-xs font-mono text-concrete-300 uppercase font-bold mb-2">
            Escolher Filtro Convolucional
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="(k, key) in STANDARD_KERNELS"
              :key="key"
              type="button"
              class="p-2 text-left border rounded-xs font-mono transition-colors"
              :class="selectedKernelKey === key ? 'bg-concrete-700 border-paint text-paint' : 'bg-concrete-900 border-concrete-700 text-concrete-200 hover:bg-concrete-750'"
              @click="selectKernel(key)"
            >
              <div class="text-[11px] font-bold truncate">{{ k.name }}</div>
              <div class="text-[9px] text-concrete-300 truncate">{{ k.description }}</div>
            </button>
          </div>
        </div>

        <!-- Custom 3x3 Matrix Grid (Editable) -->
        <div class="bg-concrete-950 p-3 rounded-xs border border-concrete-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono text-paint font-bold uppercase">
              Matriz de Convolução 3x3 (Kernel Customizável)
            </span>
            <span class="text-[10px] font-mono text-concrete-300">
              Digite valores para testar novos filtros
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2 max-w-xs mx-auto my-2">
            <template v-for="(row, r) in editableMatrix" :key="r">
              <input
                v-for="(_, c) in row"
                :key="c"
                v-model.number="editableMatrix[r][c]"
                type="number"
                step="any"
                class="w-full text-center bg-concrete-900 border border-concrete-700 focus:border-paint text-paper font-mono text-xs py-1 rounded-xs focus:outline-none"
              />
            </template>
          </div>

          <div class="flex items-center justify-center space-x-4 mt-3 text-xs font-mono text-concrete-300">
            <div class="flex items-center space-x-1.5">
              <span>Divisor:</span>
              <input
                v-model.number="divisor"
                type="number"
                step="any"
                class="w-16 text-center bg-concrete-900 border border-concrete-700 text-paper px-1 py-0.5 rounded-xs"
              />
            </div>
            <div class="flex items-center space-x-1.5">
              <span>Bias (Offset):</span>
              <input
                v-model.number="offset"
                type="number"
                step="any"
                class="w-16 text-center bg-concrete-900 border border-concrete-700 text-paper px-1 py-0.5 rounded-xs"
              />
            </div>
          </div>
        </div>

        <!-- Procedural Wall Texture Relief -->
        <div class="bg-concrete-900 p-3 rounded-xs border border-concrete-700">
          <span class="text-xs font-mono text-concrete-200 font-bold uppercase block mb-2">
            Simulação de Textura da Superfície (Bump / Relevo de Parede)
          </span>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="px-3 py-1.5 border rounded-xs font-mono text-xs transition-colors"
              :class="wallTextureType === 'none' ? 'bg-paint text-paint-dark border-paint font-bold' : 'bg-concrete-800 border-concrete-600 text-concrete-300'"
              @click="wallTextureType = 'none'"
            >
              Sem Relevo
            </button>
            <button
              type="button"
              class="px-3 py-1.5 border rounded-xs font-mono text-xs transition-colors"
              :class="wallTextureType === 'concrete' ? 'bg-paint text-paint-dark border-paint font-bold' : 'bg-concrete-800 border-concrete-600 text-concrete-300'"
              @click="wallTextureType = 'concrete'"
            >
              Concreto Liso
            </button>
            <button
              type="button"
              class="px-3 py-1.5 border rounded-xs font-mono text-xs transition-colors"
              :class="wallTextureType === 'brick' ? 'bg-paint text-paint-dark border-paint font-bold' : 'bg-concrete-800 border-concrete-600 text-concrete-300'"
              @click="wallTextureType = 'brick'"
            >
              Tijolo Aparente
            </button>
            <button
              type="button"
              class="px-3 py-1.5 border rounded-xs font-mono text-xs transition-colors"
              :class="wallTextureType === 'rough' ? 'bg-paint text-paint-dark border-paint font-bold' : 'bg-concrete-800 border-concrete-600 text-concrete-300'"
              @click="wallTextureType = 'rough'"
            >
              Chapisco Áspero
            </button>
          </div>
        </div>

        <!-- Preview Canvas -->
        <div class="flex flex-col items-center justify-center bg-concrete-950 p-2 rounded-xs border border-concrete-700">
          <span class="text-[10px] font-mono text-concrete-300 mb-2">Pré-visualização do Filtro</span>
          <canvas ref="previewCanvasRef" class="max-h-48 max-w-full rounded-xs object-contain border border-concrete-800"></canvas>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="h-14 bg-concrete-900 border-t border-concrete-700 px-4 flex items-center justify-between shrink-0">
        <button
          type="button"
          class="px-3 py-1.5 bg-concrete-700 hover:bg-concrete-600 text-paper font-mono text-xs uppercase font-bold rounded-xs transition-colors"
          @click="resetToIdentity"
        >
          Resetar
        </button>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            class="px-4 py-1.5 bg-concrete-700 hover:bg-concrete-600 text-paper font-mono text-xs uppercase font-bold rounded-xs transition-colors"
            @click="$emit('close')"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="px-4 py-1.5 bg-paint hover:bg-paint-hover text-paint-dark font-mono text-xs uppercase font-black rounded-xs transition-colors"
            @click="applyAndClose"
          >
            Aplicar no Projeto
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { X as XIcon } from 'lucide-vue-next';
import {
  STANDARD_KERNELS,
  applyConvolution,
  applySobelMagnitude,
  generateProceduralWallTexture
} from '../../engine/convolution.js';

const props = defineProps<{
  isOpen: boolean;
  artAssetUrl: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'applyFilter', newArtDataUrl: string): void;
}>();

const selectedKernelKey = ref<string>('sharpen');
const editableMatrix = ref<number[][]>([
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0]
]);
const divisor = ref(1);
const offset = ref(0);
const wallTextureType = ref<'none' | 'concrete' | 'brick' | 'rough'>('none');

const previewCanvasRef = ref<HTMLCanvasElement | null>(null);
let originalImage: HTMLImageElement | null = null;

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      loadImage();
    }
  }
);

watch([selectedKernelKey, wallTextureType, divisor, offset], () => {
  renderPreview();
}, { deep: true });

function selectKernel(key: string) {
  selectedKernelKey.value = key;
  const k = STANDARD_KERNELS[key];
  if (k) {
    editableMatrix.value = JSON.parse(JSON.stringify(k.matrix));
    divisor.value = k.divisor;
    offset.value = k.offset;
  }
  renderPreview();
}

function resetToIdentity() {
  selectKernel('identity');
  wallTextureType.value = 'none';
}

function loadImage() {
  if (!props.artAssetUrl) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    originalImage = img;
    selectKernel(selectedKernelKey.value);
    renderPreview();
  };
  img.src = props.artAssetUrl;
}

function renderPreview() {
  const canvas = previewCanvasRef.value;
  if (!canvas || !originalImage) return;

  const maxDimension = 320;
  let w = originalImage.naturalWidth || 300;
  let h = originalImage.naturalHeight || 300;
  if (w > maxDimension || h > maxDimension) {
    if (w > h) {
      h = Math.round((h * maxDimension) / w);
      w = maxDimension;
    } else {
      w = Math.round((w * maxDimension) / h);
      h = maxDimension;
    }
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(originalImage, 0, 0, w, h);

  if (selectedKernelKey.value !== 'identity') {
    const imgData = ctx.getImageData(0, 0, w, h);
    let processed: ImageData;

    if (selectedKernelKey.value === 'sobel_magnitude') {
      processed = applySobelMagnitude(imgData);
    } else {
      processed = applyConvolution(imgData, editableMatrix.value, divisor.value, offset.value);
    }
    ctx.putImageData(processed, 0, 0);
  }

  // Se selecionou relevo de parede, compõe em modo multiply/overlay
  if (wallTextureType.value !== 'none') {
    const texCanvas = generateProceduralWallTexture(wallTextureType.value, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(texCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }
}

function applyAndClose() {
  const canvas = previewCanvasRef.value;
  if (!canvas) return;

  // Renderiza na resolução original
  if (originalImage) {
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = originalImage.naturalWidth || 800;
    fullCanvas.height = originalImage.naturalHeight || 600;
    const ctx = fullCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(originalImage, 0, 0);
      if (selectedKernelKey.value !== 'identity') {
        const fullData = ctx.getImageData(0, 0, fullCanvas.width, fullCanvas.height);
        let processed: ImageData;
        if (selectedKernelKey.value === 'sobel_magnitude') {
          processed = applySobelMagnitude(fullData);
        } else {
          processed = applyConvolution(fullData, editableMatrix.value, divisor.value, offset.value);
        }
        ctx.putImageData(processed, 0, 0);
      }

      if (wallTextureType.value !== 'none') {
        const texCanvas = generateProceduralWallTexture(wallTextureType.value, fullCanvas.width, fullCanvas.height);
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.5;
        ctx.drawImage(texCanvas, 0, 0);
      }

      const finalDataUrl = fullCanvas.toDataURL('image/png');
      emit('applyFilter', finalDataUrl);
    }
  }

  emit('close');
}

onMounted(() => {
  if (props.isOpen) {
    loadImage();
  }
});
</script>
