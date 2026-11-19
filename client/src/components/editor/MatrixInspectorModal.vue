<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-2 sm:p-4 select-none"
  >
    <div class="bg-concrete-800 border-2 border-concrete-600 rounded-xs shadow-brutalist max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden">
      <!-- Header -->
      <div class="h-12 bg-concrete-900 border-b-2 border-paint px-4 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-2">
          <span class="w-1.5 h-3.5 bg-paint"></span>
          <span class="px-1.5 py-0.5 bg-paint text-paint-dark font-mono text-[11px] font-bold uppercase rounded-xs">
            COMPUTAÇÃO GRÁFICA
          </span>
          <h3 class="text-sm font-display font-black text-paper uppercase tracking-wider">
            Álgebra Linear & Matriz Homogênea 3x3
          </h3>
        </div>
        <button
          type="button"
          class="p-1.5 text-concrete-300 hover:text-paper rounded-xs hover:bg-concrete-700 transition-colors"
          aria-label="Fechar inspetor de matriz"
          @click="$emit('close')"
        >
          <XIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Content Body -->
      <div class="p-4 overflow-y-auto space-y-4 text-xs font-mono">
        <!-- Matrix Math Card -->
        <div class="bg-concrete-950 p-3 rounded-xs border border-concrete-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-paint font-bold text-[11px] uppercase tracking-wider">
              Matriz de Homografia Projetiva H (3x3)
            </span>
            <button
              type="button"
              class="px-2 py-0.5 bg-concrete-800 hover:bg-concrete-700 border border-concrete-600 text-concrete-300 text-[10px] rounded-xs transition-colors"
              @click="copyMatrixText"
            >
              {{ copied ? 'Copiado!' : 'Copiar Matriz' }}
            </button>
          </div>

          <!-- 3x3 Visual Grid -->
          <div class="grid grid-cols-3 gap-2 max-w-md mx-auto my-3 text-center">
            <div
              v-for="(val, idx) in currentMatrix"
              :key="idx"
              class="p-2 bg-concrete-900 border rounded-xs font-mono"
              :class="idx === 8 ? 'border-paint text-paint' : 'border-concrete-700 text-paper'"
            >
              <div class="text-[9px] text-concrete-300">h{{ Math.floor(idx / 3) }}{{ idx % 3 }}</div>
              <div class="font-bold truncate text-xs">{{ val.toFixed(4) }}</div>
            </div>
          </div>

          <div class="text-[10px] text-concrete-300 text-center">
            Mapeamento: [x', y', w']ᵀ = H · [x, y, 1]ᵀ, onde x_final = x' / w' e y_final = y' / w'
          </div>
        </div>

        <!-- Matrix Invariant Properties -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="bg-concrete-900 p-2.5 rounded-xs border border-concrete-700">
            <span class="text-[10px] text-concrete-300 block">Determinante det(H)</span>
            <span class="text-sm font-bold" :class="Math.abs(decomposition.det) > 1e-4 ? 'text-paint' : 'text-red-400'">
              {{ decomposition.det.toFixed(4) }}
            </span>
          </div>

          <div class="bg-concrete-900 p-2.5 rounded-xs border border-concrete-700">
            <span class="text-[10px] text-concrete-300 block">Inversível?</span>
            <span class="text-sm font-bold text-paint">
              {{ Math.abs(decomposition.det) > 1e-4 ? 'SIM (det ≠ 0)' : 'NÃO (singular)' }}
            </span>
          </div>

          <div class="bg-concrete-900 p-2.5 rounded-xs border border-concrete-700">
            <span class="text-[10px] text-concrete-300 block">Rotação Estimada (θ)</span>
            <span class="text-sm font-bold text-paper">
              {{ decomposition.rotationDeg.toFixed(1) }}°
            </span>
          </div>

          <div class="bg-concrete-900 p-2.5 rounded-xs border border-concrete-700">
            <span class="text-[10px] text-concrete-300 block">Escala Média (S)</span>
            <span class="text-sm font-bold text-paper">
              {{ ((decomposition.scaleX + decomposition.scaleY) / 2).toFixed(2) }}x
            </span>
          </div>
        </div>

        <!-- Decomposed Components -->
        <div class="bg-concrete-900 p-3 rounded-xs border border-concrete-700 space-y-2">
          <span class="text-concrete-200 font-bold text-[11px] uppercase tracking-wider block">
            Decomposição de Parâmetros Geométricos
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div>
              <span class="text-concrete-300">Vetor Translação (Tx, Ty):</span>
              <div class="text-paper font-bold">[{{ decomposition.translation.x.toFixed(1) }}, {{ decomposition.translation.y.toFixed(1) }}] px</div>
            </div>
            <div>
              <span class="text-concrete-300">Vetor Fuga / Perspectiva (Px, Py):</span>
              <div class="text-paint font-bold">[{{ (decomposition.perspective.x * 1000).toFixed(3) }}, {{ (decomposition.perspective.y * 1000).toFixed(3) }}] × 10⁻³</div>
            </div>
            <div>
              <span class="text-concrete-300">Fatores de Escala (Sx, Sy):</span>
              <div class="text-paper font-bold">Sx: {{ decomposition.scaleX.toFixed(3) }} | Sy: {{ decomposition.scaleY.toFixed(3) }}</div>
            </div>
            <div>
              <span class="text-concrete-300">Cisalhamento / Skew:</span>
              <div class="text-paper font-bold">{{ decomposition.skew.toFixed(3) }} rad</div>
            </div>
          </div>
        </div>

        <!-- Inverse Matrix H⁻¹ -->
        <div v-if="inverseMatrix" class="bg-concrete-950 p-3 rounded-xs border border-concrete-700">
          <div class="text-paint font-bold text-[11px] uppercase tracking-wider mb-2">
            Matriz Inversa H⁻¹ (Usada no Modo Keystone / Projetor Inverso)
          </div>
          <div class="grid grid-cols-3 gap-1.5 max-w-sm mx-auto text-center">
            <div
              v-for="(val, idx) in inverseMatrix"
              :key="'inv-' + idx"
              class="p-1.5 bg-concrete-900 border border-concrete-700 rounded-xs font-mono text-[10px] text-concrete-200 truncate"
            >
              {{ val.toFixed(4) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="h-12 bg-concrete-900 border-t border-concrete-700 px-4 flex items-center justify-end shrink-0">
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
import { computed, ref } from 'vue';
import { X as XIcon } from 'lucide-vue-next';
import { Point2D, Matrix3x3, computeHomography, invertMatrix3x3, decomposeHomography } from '../../engine/homography.js';

const props = defineProps<{
  isOpen: boolean;
  cornerPoints: [Point2D, Point2D, Point2D, Point2D];
  canvasBounds: { width: number; height: number };
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const copied = ref(false);

const currentMatrix = computed<Matrix3x3>(() => {
  const w = props.canvasBounds.width || 800;
  const h = props.canvasBounds.height || 600;

  const srcCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h }
  ];

  const dstCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: props.cornerPoints[0].x * w, y: props.cornerPoints[0].y * h },
    { x: props.cornerPoints[1].x * w, y: props.cornerPoints[1].y * h },
    { x: props.cornerPoints[2].x * w, y: props.cornerPoints[2].y * h },
    { x: props.cornerPoints[3].x * w, y: props.cornerPoints[3].y * h }
  ];

  return computeHomography(srcCorners, dstCorners);
});

const decomposition = computed(() => {
  return decomposeHomography(currentMatrix.value);
});

const inverseMatrix = computed(() => {
  return invertMatrix3x3(currentMatrix.value);
});

function copyMatrixText() {
  const m = currentMatrix.value;
  const text = `[
  [${m[0].toFixed(5)}, ${m[1].toFixed(5)}, ${m[2].toFixed(5)}],
  [${m[3].toFixed(5)}, ${m[4].toFixed(5)}, ${m[5].toFixed(5)}],
  [${m[6].toFixed(5)}, ${m[7].toFixed(5)}, ${m[8].toFixed(5)}]
]`;
  navigator.clipboard.writeText(text).then(() => {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  });
}
</script>
