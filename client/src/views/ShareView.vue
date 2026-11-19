<template>
  <div class="h-full bg-concrete-900 text-paper flex flex-col overflow-hidden select-none">

    <header class="h-16 bg-concrete-800 border-b-2 border-paint flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
      <div class="flex items-center space-x-3">
        <span class="w-2 h-7 bg-paint"></span>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="font-display font-black text-sm sm:text-base text-paper uppercase tracking-tight">
              {{ project?.title || 'Simulação de Mural' }}
            </h1>
            <span class="px-1.5 py-0.5 border border-concrete-600 bg-concrete-900 text-concrete-300 text-[9px] font-mono font-bold tracking-wider uppercase rounded-xs">
              VISUALIZAÇÃO
            </span>
          </div>
          <span class="text-[10px] font-mono text-concrete-400 block mt-0.5">
            MURALIS — ARTE URBANA & FACHADAS
          </span>
        </div>
      </div>

      <button
        v-if="project"
        type="button"
        class="py-2 px-3 sm:px-4 bg-paint hover:bg-paint-hover text-paint-dark rounded-xs text-xs font-mono font-black uppercase tracking-wider flex items-center space-x-1.5 transition-colors shadow-subtle active:scale-[0.98]"
        @click="downloadPreview"
      >
        <DownloadIcon class="w-4 h-4 stroke-[2.5]" />
        <span>Baixar Imagem HD</span>
      </button>
    </header>

    <main class="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-concrete-950">
      <div v-if="loading" class="text-xs font-mono text-concrete-300">
        Carregando simulação...
      </div>

      <div v-else-if="error" class="text-xs font-mono text-paper bg-danger/20 p-4 border border-danger-border rounded-xs">
        {{ error }}
      </div>

      <ViewportCanvas
        v-else-if="project"
        ref="viewportRef"
        :base-photo-url="project.basePhoto?.url || null"
        :art-asset-url="project.artAsset?.url || null"
        :corner-points="project.cornerPoints"
        :blend-mode="project.blendMode"
        :opacity="project.opacity"
        :brightness="project.brightness"
        :contrast="project.contrast"
        :show-handles="false"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Download as DownloadIcon } from 'lucide-vue-next';
import ViewportCanvas from '../components/editor/ViewportCanvas.vue';
import { apiRequest } from '../services/apiClient.js';

const route = useRoute();
const viewportRef = ref<InstanceType<typeof ViewportCanvas> | null>(null);

const project = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

async function fetchSharedProject() {
  const token = route.params.token as string;
  try {
    const res = await apiRequest(`/share/${token}`);
    project.value = res.project;
  } catch (err: any) {
    error.value = err.message || 'Link expirado ou inexistente';
  } finally {
    loading.value = false;
  }
}

async function downloadPreview() {
  if (!viewportRef.value) return;
  try {
    const dataUrl = await viewportRef.value.exportHighRes('image/png');
    const safeTitle = (project.value?.title || 'mural').toLowerCase().replace(/\s+/g, '-');
    const fileName = `${safeTitle}-muralis.png`;

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: project.value?.title || 'Muralis',
          text: 'Simulação de mural em alta resolução'
        });
        return;
      }
    } catch {}

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export preview', err);
  }
}

onMounted(() => {
  fetchSharedProject();
});
</script>
