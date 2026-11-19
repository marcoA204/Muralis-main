<template>
  <div
    ref="containerRef"
    class="absolute inset-0 z-30 pointer-events-none select-none touch-none"
  >
    <svg
      class="w-full h-full overflow-visible"
      :viewBox="`0 0 ${canvasBounds.width} ${canvasBounds.height}`"
    >
      <defs>
        <marker id="arrow-top" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,1 L7,4 L0,7 Z" fill="#FF5E1A" />
        </marker>
        <marker id="arrow-bot" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,1 L7,4 L0,7 Z" fill="#22D3EE" />
        </marker>
      </defs>

      <line
        :x1="px(guideVectors.top[0]).x"
        :y1="px(guideVectors.top[0]).y"
        :x2="px(guideVectors.top[1]).x"
        :y2="px(guideVectors.top[1]).y"
        stroke="#FF5E1A"
        stroke-width="2.5"
        stroke-dasharray="6 4"
        marker-end="url(#arrow-top)"
      />
      <line
        :x1="px(guideVectors.bot[0]).x"
        :y1="px(guideVectors.bot[0]).y"
        :x2="px(guideVectors.bot[1]).x"
        :y2="px(guideVectors.bot[1]).y"
        stroke="#22D3EE"
        stroke-width="2.5"
        stroke-dasharray="6 4"
        marker-end="url(#arrow-bot)"
      />
    </svg>

    <div
      :style="labelStyle(guideVectors.top[0], guideVectors.top[1])"
      class="absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-[#FF5E1A] text-white font-mono text-[9px] font-bold tracking-wider pointer-events-none shadow"
    >
      TOPO
    </div>
    <div
      :style="labelStyle(guideVectors.bot[0], guideVectors.bot[1])"
      class="absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-[#22D3EE] text-black font-mono text-[9px] font-bold tracking-wider pointer-events-none shadow"
    >
      BASE
    </div>

    <button
      v-for="pt in handles"
      :key="pt.id"
      type="button"
      class="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md pointer-events-auto cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
      :style="{
        left: `${pt.point.x * 100}%`,
        top: `${pt.point.y * 100}%`,
        backgroundColor: pt.line === 'top' ? '#FF5E1A' : '#22D3EE'
      }"
      :title="pt.line === 'top' ? 'Vetor Topo' : 'Vetor Base'"
      @pointerdown.stop="startDrag(pt.line, pt.index, $event)"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Point2D } from '../../engine/homography';
import type { GuideVectors } from '../../engine/autoFit';

const props = defineProps<{
  guideVectors: GuideVectors;
  canvasBounds: { width: number; height: number };
}>();

const emit = defineEmits<{
  (e: 'update:guideVectors', value: GuideVectors): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

const handles = computed(() => [
  { id: 'top-0', line: 'top' as const, index: 0 as const, point: props.guideVectors.top[0] },
  { id: 'top-1', line: 'top' as const, index: 1 as const, point: props.guideVectors.top[1] },
  { id: 'bot-0', line: 'bot' as const, index: 0 as const, point: props.guideVectors.bot[0] },
  { id: 'bot-1', line: 'bot' as const, index: 1 as const, point: props.guideVectors.bot[1] }
]);

function px(pt: Point2D) {
  return {
    x: pt.x * props.canvasBounds.width,
    y: pt.y * props.canvasBounds.height
  };
}

function labelStyle(p0: Point2D, p1: Point2D) {
  return {
    left: `${((p0.x + p1.x) / 2) * 100}%`,
    top: `${((p0.y + p1.y) / 2) * 100}%`
  };
}

function startDrag(line: 'top' | 'bot', index: 0 | 1, e: PointerEvent) {
  const el = containerRef.value;
  if (!el) return;

  const target = e.currentTarget as HTMLElement;
  try {
    target.setPointerCapture(e.pointerId);
  } catch {}

  const onMove = (ev: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = Math.max(0.01, Math.min(0.99, (ev.clientX - rect.left) / rect.width));
    const y = Math.max(0.01, Math.min(0.99, (ev.clientY - rect.top) / rect.height));

    const next: GuideVectors = {
      top: [{ ...props.guideVectors.top[0] }, { ...props.guideVectors.top[1] }],
      bot: [{ ...props.guideVectors.bot[0] }, { ...props.guideVectors.bot[1] }]
    };
    next[line][index] = { x, y };
    emit('update:guideVectors', next);
  };

  const onUp = (ev: PointerEvent) => {
    try {
      target.releasePointerCapture(ev.pointerId);
    } catch {}
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}
</script>
