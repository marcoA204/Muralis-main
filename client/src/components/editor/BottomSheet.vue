<template>
  <div class="contents">

    <div
      v-if="currentSnap === 'open'"
      class="fixed inset-0 bg-black/60 z-30 transition-opacity duration-250 md:hidden"
      @click="setSnap('closed')"
    ></div>

    <div
      ref="sheetRef"
      class="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-[#262523] border-t-2 border-[#3a3835] rounded-t-[2px] shadow-2xl overflow-hidden md:hidden will-change-transform select-none"
      :style="sheetStyle"
    >

      <div
        ref="handleRef"
        class="h-10 w-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none shrink-0 border-b border-[#3a3835]/60 bg-[#262523]"
        @pointerdown="onPointerDown"
      >
        <div class="w-12 h-1 bg-[#55514b] rounded-[1px]"></div>
      </div>

      <div
        class="px-4 py-2 flex items-center justify-between border-b border-[#3a3835] bg-[#262523] shrink-0 touch-none"
        @pointerdown="onHeaderPointerDown"
      >
        <div class="flex items-center space-x-2">
          <span class="w-1.5 h-3.5 bg-[#ee5a3c]"></span>
          <span class="font-mono text-xs font-bold text-[#ece6d8] uppercase tracking-wider">
            Arte & Ajustes
          </span>
          <span class="text-[10px] font-mono text-[#a8a196]">
            [{{ snapLabel }}]
          </span>
        </div>

        <div class="flex items-center space-x-1">
          <button
            type="button"
            class="px-2 py-1 text-xs font-mono font-bold text-[#a8a196] hover:text-[#ece6d8] transition-colors"
            @click="toggleNextSnap"
          >
            {{ currentSnap === 'open' ? 'Reduzir' : currentSnap === 'half' ? 'Expandir' : 'Abrir' }}
          </button>
          <button
            type="button"
            class="p-1 text-[#a8a196] hover:text-[#ee5a3c] transition-colors"
            aria-label="Fechar gaveta"
            @click="setSnap('closed')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref="contentRef"
        class="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,16px)]"
        :style="contentStyle"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

export type SnapState = 'closed' | 'half' | 'open';

const props = withDefaults(
  defineProps<{
    modelValue?: SnapState;
  }>(),
  {
    modelValue: 'closed'
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', val: SnapState): void;
  (e: 'snapChanged', val: SnapState): void;
}>();

const sheetRef = ref<HTMLDivElement | null>(null);
const handleRef = ref<HTMLDivElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);

const currentSnap = ref<SnapState>(props.modelValue || 'closed');
const isDragging = ref(false);
const dragTranslateY = ref(0);

const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CLOSED_VISIBLE_PX = 56;

function getViewportHeight(): number {
  return window.visualViewport?.height || window.innerHeight || 800;
}

function getSnapTranslateY(snap: SnapState): number {
  const vh = getViewportHeight();
  const maxH = vh * 0.88;
  switch (snap) {
    case 'open':
      return 0;
    case 'half':
      return maxH - vh * 0.45;
    case 'closed':
    default:
      return maxH - CLOSED_VISIBLE_PX;
  }
}

const sheetStyle = computed(() => {
  const vh = getViewportHeight();
  const maxH = Math.round(vh * 0.88);
  const translateY = isDragging.value
    ? dragTranslateY.value
    : getSnapTranslateY(currentSnap.value);

  const transition = isDragging.value || prefersReducedMotion
    ? 'none'
    : 'transform 250ms cubic-bezier(0.2, 0.9, 0.3, 1)';

  return {
    height: `${maxH}px`,
    maxHeight: '88dvh',
    transform: `translate3d(0, ${Math.max(0, translateY)}px, 0)`,
    transition
  };
});

const contentStyle = computed(() => {
  const hiddenHeight = isDragging.value ? 0 : getSnapTranslateY(currentSnap.value);
  return { marginBottom: `${Math.max(0, Math.round(hiddenHeight))}px` };
});

const snapLabel = computed(() => {
  switch (currentSnap.value) {
    case 'open':
      return 'Max';
    case 'half':
      return 'Meio';
    case 'closed':
    default:
      return 'Min';
  }
});

function vibrate() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(8);
    } catch {}
  }
}

function setSnap(snap: SnapState, pushHistoryState = true) {
  if (currentSnap.value !== snap) {
    if (snap === 'open' && pushHistoryState) {
      try {
        window.history.pushState({ muralisSheet: 'open' }, '');
      } catch {}
    }
    currentSnap.value = snap;
    emit('update:modelValue', snap);
    emit('snapChanged', snap);
    vibrate();
  }
}

function toggleNextSnap() {
  if (currentSnap.value === 'closed') setSnap('half');
  else if (currentSnap.value === 'half') setSnap('open');
  else setSnap('half');
}

let startY = 0;
let startTranslate = 0;
let lastMoveY = 0;
let lastMoveTime = 0;
let velocityY = 0;

function onPointerDown(e: PointerEvent) {
  isDragging.value = true;
  startY = e.clientY;
  startTranslate = getSnapTranslateY(currentSnap.value);
  dragTranslateY.value = startTranslate;
  lastMoveY = e.clientY;
  lastMoveTime = performance.now();
  velocityY = 0;

  try {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  } catch {}

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}

function onHeaderPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('button')) return;
  onPointerDown(e);
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return;
  const dy = e.clientY - startY;
  const now = performance.now();
  const dt = now - lastMoveTime;

  if (dt > 10) {
    velocityY = (e.clientY - lastMoveY) / dt;
    lastMoveY = e.clientY;
    lastMoveTime = now;
  }

  const vh = getViewportHeight();
  const maxTranslate = vh * 0.88 - CLOSED_VISIBLE_PX;
  dragTranslateY.value = Math.max(0, Math.min(maxTranslate, startTranslate + dy));
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value) return;
  isDragging.value = false;

  try {
    handleRef.value?.releasePointerCapture(e.pointerId);
  } catch {}

  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);

  const currentY = dragTranslateY.value;
  const snapOpen = getSnapTranslateY('open');
  const snapHalf = getSnapTranslateY('half');
  const snapClosed = getSnapTranslateY('closed');

  if (velocityY > 0.4) {

    if (currentSnap.value === 'open') setSnap('half');
    else setSnap('closed');
    return;
  } else if (velocityY < -0.4) {

    if (currentSnap.value === 'closed') setSnap('half');
    else setSnap('open');
    return;
  }

  const distOpen = Math.abs(currentY - snapOpen);
  const distHalf = Math.abs(currentY - snapHalf);
  const distClosed = Math.abs(currentY - snapClosed);

  if (distOpen <= distHalf && distOpen <= distClosed) {
    setSnap('open');
  } else if (distHalf <= distOpen && distHalf <= distClosed) {
    setSnap('half');
  } else {
    setSnap('closed');
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (currentSnap.value === 'open') {
      e.stopPropagation();
      setSnap('half');
    } else if (currentSnap.value === 'half') {
      e.stopPropagation();
      setSnap('closed');
    }
  }
}

function onPopState(_e: PopStateEvent) {
  if (currentSnap.value === 'open') {
    setSnap('half', false);
  }
}

defineExpose({
  snap: currentSnap,
  setSnap
});

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('popstate', onPopState);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('popstate', onPopState);
});
</script>
