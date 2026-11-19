<template>
  <div
    ref="overlayRef"
    class="absolute inset-0 z-20"
    :class="isActive ? 'pointer-events-auto cursor-crosshair touch-none' : 'pointer-events-none'"
    :style="{
      width: canvasBounds.width + 'px',
      height: canvasBounds.height + 'px',
      left: canvasBounds.left + 'px',
      top: canvasBounds.top + 'px'
    }"
    @pointerdown="handleOverlayPointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
  >
    <svg
      v-if="canvasBounds.width > 0 && canvasBounds.height > 0"
      class="w-full h-full overflow-visible pointer-events-none"
      :viewBox="`0 0 ${canvasBounds.width} ${canvasBounds.height}`"
    >
      <g v-if="points.length === 2">
        <line
          :x1="points[0].x * canvasBounds.width"
          :y1="points[0].y * canvasBounds.height"
          :x2="points[1].x * canvasBounds.width"
          :y2="points[1].y * canvasBounds.height"
          stroke="#151413"
          stroke-width="4"
          stroke-linecap="round"
        />
        <line
          :x1="points[0].x * canvasBounds.width"
          :y1="points[0].y * canvasBounds.height"
          :x2="points[1].x * canvasBounds.width"
          :y2="points[1].y * canvasBounds.height"
          stroke="#ee5a3c"
          stroke-width="2"
          stroke-dasharray="6 4"
          stroke-linecap="round"
        />
      </g>
    </svg>

    <div
      v-if="points.length === 2 && canvasBounds.width > 0"
      class="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 bg-concrete-900 border border-paint text-paper font-mono text-[11px] font-bold rounded-xs pointer-events-none whitespace-nowrap shadow-subtle"
      :style="{
        left: (((points[0].x + points[1].x) / 2) * canvasBounds.width) + 'px',
        top: (((points[0].y + points[1].y) / 2) * canvasBounds.height) + 'px'
      }"
    >
      {{ lineLabel }}
    </div>

    <div
      v-for="(pt, idx) in points"
      :key="idx"
      class="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center"
      :class="isActive ? 'pointer-events-auto cursor-grab active:cursor-grabbing touch-none' : 'pointer-events-none'"
      :style="{
        left: (pt.x * canvasBounds.width) + 'px',
        top: (pt.y * canvasBounds.height) + 'px'
      }"
      @pointerdown.stop="startHandleDrag(idx, $event)"
    >
      <span class="w-4 h-4 rounded-full bg-paint border-2 border-concrete-900 shadow-subtle flex items-center justify-center text-[8px] font-mono font-black text-paint-dark">
        {{ idx === 0 ? 'A' : 'B' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Point2D } from '../../engine/homography.js';
import { measureDistanceMeters, formatMeters } from '../../engine/wallMeasurement.js';

const props = defineProps<{
  isActive: boolean;
  points: Point2D[];
  pixelsPerMeter: number | null;
  canvasBounds: { width: number; height: number; left: number; top: number };
}>();

const emit = defineEmits<{
  (e: 'update:points', points: Point2D[]): void;
}>();

const overlayRef = ref<HTMLDivElement | null>(null);
const draggingIndex = ref<number | null>(null);

const lineLabel = computed(() => {
  if (props.points.length < 2) return '';
  if (props.pixelsPerMeter) {
    const meters = measureDistanceMeters(
      props.points[0],
      props.points[1],
      props.pixelsPerMeter,
      props.canvasBounds.width,
      props.canvasBounds.height
    );
    if (meters !== null) {
      return formatMeters(meters);
    }
  }
  return 'LINHA REF.';
});

function toNormalizedPoint(e: PointerEvent): Point2D {
  const el = overlayRef.value;
  if (!el || props.canvasBounds.width <= 0 || props.canvasBounds.height <= 0) {
    return { x: 0.5, y: 0.5 };
  }
  const rect = el.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  return { x, y };
}

function handleOverlayPointerDown(e: PointerEvent) {
  if (!props.isActive) return;
  const pt = toNormalizedPoint(e);
  if (props.points.length === 0 || props.points.length >= 2) {
    emit('update:points', [pt, { ...pt }]);
    draggingIndex.value = 1;
  } else {
    emit('update:points', [props.points[0], pt]);
    draggingIndex.value = 1;
  }
  (e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
}

function startHandleDrag(idx: number, e: PointerEvent) {
  if (!props.isActive) return;
  draggingIndex.value = idx;
  overlayRef.value?.setPointerCapture?.(e.pointerId);
}

function handlePointerMove(e: PointerEvent) {
  if (!props.isActive || draggingIndex.value === null) return;
  const pt = toNormalizedPoint(e);
  const next = props.points.map((p, i) => (i === draggingIndex.value ? pt : p));
  emit('update:points', next);
}

function handlePointerUp(e: PointerEvent) {
  if (draggingIndex.value !== null) {
    draggingIndex.value = null;
    try {
      overlayRef.value?.releasePointerCapture?.(e.pointerId);
    } catch {}
  }
}
</script>
