<template>
  <div class="h-full bg-concrete-900 text-paper flex flex-col overflow-y-auto select-none">
    <header class="h-16 bg-concrete-800 border-b-2 border-paint flex items-center justify-between px-4 sm:px-8 lg:px-10 z-10 shrink-0">
      <div class="flex items-center space-x-3">
        <span class="w-2 h-7 bg-paint"></span>
        <div>
          <h1 class="font-display font-black text-2xl text-paper tracking-wider uppercase leading-none">
            MURALIS
          </h1>
          <span class="text-[10px] text-paint font-mono font-bold tracking-widest uppercase block mt-0.5">
            GALERIA DE FACHADAS
          </span>
        </div>
      </div>

      <div class="flex items-center space-x-3 sm:space-x-4">
        <button
          type="button"
          class="py-2 px-3 sm:px-4 bg-paint hover:bg-paint-hover text-paint-dark text-xs font-mono font-black uppercase tracking-wider rounded-xs flex items-center space-x-1.5 transition-colors shadow-subtle active:scale-[0.98]"
          @click="openNewModal"
        >
          <PlusIcon class="w-4 h-4 stroke-[2.5]" />
          <span>Novo Mural</span>
        </button>

        <button
          v-if="authStore.isAuthenticated"
          type="button"
          class="text-xs font-mono text-concrete-300 hover:text-paper transition-colors uppercase tracking-wider"
          @click="authStore.clearAuth(); loadProjects()"
        >
          Sair
        </button>
        <router-link
          v-else
          to="/login"
          class="text-xs font-mono text-concrete-300 hover:text-paper transition-colors uppercase tracking-wider"
        >
          Entrar
        </router-link>
      </div>
    </header>

    <main class="max-w-6xl w-full mx-auto p-4 sm:p-8 lg:p-10 space-y-6 flex-1">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-concrete-600 pb-5">
        <div>
          <div class="text-xs font-mono font-bold uppercase tracking-widest text-paint flex items-center">
            <span class="mr-1">PROJETOS</span>
          </div>
          <h2 class="text-2xl lg:text-3xl font-display font-black text-paper tracking-tight uppercase mt-1">
            Simulações de Murais
          </h2>
          <p class="text-xs font-mono text-concrete-300 mt-1">
            {{ authStore.isAuthenticated ? 'Salvos localmente e sincronizados na sua conta.' : 'Armazenamento local ativo neste dispositivo.' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div class="flex items-center space-x-2 text-xs font-mono text-concrete-300 bg-concrete-800 border border-concrete-600 px-3 py-1.5 rounded-xs">
            <span class="w-2 h-2 rounded-full" :class="authStore.isAuthenticated ? 'bg-paint' : 'bg-concrete-400'"></span>
            <span>{{ authStore.isAuthenticated ? 'Conta Conectada' : 'Modo Local' }}</span>
          </div>

          <div class="flex items-center space-x-2 text-xs font-mono text-concrete-300 bg-concrete-800 border border-concrete-600 px-3 py-1.5 rounded-xs">
            <span class="w-2 h-2 rounded-full bg-paint"></span>
            <span>{{ projects.length }} Mural(is)</span>
          </div>
        </div>
      </div>

      <div
        v-if="showCreateForm"
        class="bg-concrete-800 border-2 border-paint p-4 rounded-xs shadow-subtle flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
      >
        <div class="flex-1">
          <label class="block text-[11px] font-mono font-bold uppercase tracking-wider text-concrete-300 mb-1">
            Nome do Novo Mural
          </label>
          <input
            v-model="newProjectTitle"
            type="text"
            placeholder="Ex: Fachada Centro, Muro Escola..."
            class="w-full px-3 py-2 bg-concrete-900 border border-concrete-600 focus:border-paint rounded-xs text-base sm:text-xs font-mono text-paper focus:outline-none"
            @keyup.enter="confirmCreateProject"
            @keyup.esc="showCreateForm = false"
          />
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-4 py-2 bg-paint hover:bg-paint-hover text-paint-dark text-xs font-mono font-black uppercase tracking-wider rounded-xs transition-colors"
            @click="confirmCreateProject"
          >
            Criar e Abrir
          </button>
          <button
            type="button"
            class="px-3 py-2 bg-concrete-700 hover:bg-concrete-600 text-concrete-200 text-xs font-mono uppercase tracking-wider rounded-xs transition-colors"
            @click="showCreateForm = false"
          >
            Cancelar
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-20 text-concrete-300 font-mono text-xs">
        Carregando galeria...
      </div>

      <div v-else-if="projects.length === 0" class="border-2 border-dashed border-concrete-600 bg-concrete-800/40 p-12 text-center space-y-4 rounded-xs">
        <div class="w-14 h-14 bg-concrete-700 border border-concrete-600 mx-auto flex items-center justify-center text-paper rounded-xs">
          <FolderPlusIcon class="w-7 h-7" />
        </div>
        <h3 class="text-base font-display font-black text-paper uppercase tracking-wide">
          Nenhum mural registrado
        </h3>
        <p class="text-xs font-mono text-concrete-300 max-w-md mx-auto leading-relaxed">
          Crie um mural, aponte a câmera ao vivo ou carregue a foto de uma parede para projetar sua arte em perspectiva.
        </p>
        <button
          type="button"
          class="py-2.5 px-5 bg-paint hover:bg-paint-hover text-paint-dark text-xs font-mono font-black uppercase tracking-wider rounded-xs inline-flex items-center space-x-2 transition-colors shadow-subtle active:scale-[0.98]"
          @click="openNewModal"
        >
          <PlusIcon class="w-4 h-4 stroke-[2.5]" />
          <span>Criar Primeiro Mural</span>
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="proj in projects"
          :key="proj.id"
          class="bg-concrete-800 border-2 border-concrete-600 hover:border-paint transition-colors flex flex-col group cursor-pointer shadow-subtle rounded-xs relative"
          @click="$router.push(`/editor/${proj.id}`)"
        >
          <div class="h-48 bg-concrete-950 flex items-center justify-center relative overflow-hidden border-b border-concrete-600">
            <div class="absolute top-3 left-3 px-2 py-0.5 bg-concrete-900 border border-concrete-600 text-[10px] font-mono text-concrete-200 font-semibold tracking-wider uppercase z-10 rounded-xs">
              {{ (proj.blendMode || 'multiply').toUpperCase() }}
            </div>

            <div class="absolute top-3 right-3 px-2 py-0.5 bg-concrete-900 border border-concrete-600 text-[10px] font-mono font-bold tracking-wider uppercase z-10 rounded-xs"
              :class="proj.synced ? 'text-paint border-paint/50' : 'text-concrete-300'"
            >
              {{ proj.synced ? 'NUVEM' : 'LOCAL' }}
            </div>

            <img
              v-if="proj.basePhotoUrl"
              :src="proj.basePhotoUrl"
              class="w-full h-full object-cover"
              alt="Pré-visualização do mural"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-concrete-900">
              <span class="font-display font-black text-concrete-500 text-3xl tracking-widest uppercase">
                MURAL
              </span>
            </div>

            <div
              v-if="proj.artAssetUrl"
              class="absolute bottom-2.5 right-2.5 w-12 h-12 bg-concrete-900 border border-concrete-500 rounded-xs overflow-hidden shadow-subtle"
              title="Arte aplicada"
            >
              <img :src="proj.artAssetUrl" class="w-full h-full object-cover" alt="Arte do mural" />
            </div>
          </div>

          <div class="p-4 flex items-center justify-between">
            <div class="min-w-0 flex-1 pr-2">
              <h4 class="text-sm font-display font-bold text-paper group-hover:text-paint transition-colors truncate uppercase">
                {{ proj.title || 'Mural Sem Título' }}
              </h4>
              <span class="text-[11px] font-mono text-concrete-400 block mt-0.5">
                {{ new Date(proj.updatedAt || Date.now()).toLocaleDateString('pt-BR') }}
              </span>
            </div>

            <div class="flex items-center space-x-1">
              <button
                type="button"
                class="p-2 rounded-xs text-concrete-400 hover:text-paper hover:bg-concrete-700 transition-colors border border-transparent hover:border-concrete-500"
                aria-label="Duplicar mural"
                title="Duplicar Mural"
                @click.stop="duplicateProjectItem(proj.id)"
              >
                <CopyIcon class="w-4 h-4" />
              </button>

              <button
                type="button"
                class="p-2 rounded-xs text-concrete-400 hover:text-paper hover:bg-danger/20 transition-colors border border-transparent hover:border-danger-border"
                aria-label="Excluir mural"
                title="Excluir Mural"
                @click.stop="deleteProject(proj.id)"
              >
                <Trash2Icon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus as PlusIcon,
  FolderPlus as FolderPlusIcon,
  Trash2 as Trash2Icon,
  Copy as CopyIcon
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/authStore.js';
import { useProjectStore } from '../stores/projectStore.js';
import { apiRequest } from '../services/apiClient.js';
import { db } from '../services/offlineDb.js';

const router = useRouter();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const projects = ref<any[]>([]);
const loading = ref(true);
const showCreateForm = ref(false);
const newProjectTitle = ref('');

async function loadProjects() {
  loading.value = true;
  try {
    const localProjects = await db.projects.toArray();
    if (authStore.isAuthenticated) {
      try {
        const remoteProjects = await apiRequest('/projects');
        const mergedMap = new Map<string, any>();
        for (const lp of localProjects) {
          mergedMap.set(lp.id, lp);
        }
        for (const rp of remoteProjects) {
          mergedMap.set(rp.id, { ...rp, synced: true });
        }
        projects.value = Array.from(mergedMap.values()).sort(
          (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
        );
        return;
      } catch {}
    }
    projects.value = localProjects.sort((a, b) => b.updatedAt - a.updatedAt);
  } finally {
    loading.value = false;
  }
}

function openNewModal() {
  newProjectTitle.value = '';
  showCreateForm.value = true;
}

async function confirmCreateProject() {
  const id = await projectStore.createProject(newProjectTitle.value || 'Novo Mural');
  showCreateForm.value = false;
  router.push(`/editor/${id}`);
}

async function duplicateProjectItem(id: string) {
  await projectStore.duplicateProject(id);
  await loadProjects();
}

async function deleteProject(id: string) {
  if (!confirm('Deseja excluir esta simulação?')) return;

  if (authStore.isAuthenticated && !id.startsWith('local_')) {
    try {
      await apiRequest(`/projects/${id}`, { method: 'DELETE' });
    } catch {}
  }

  try {
    await db.projects.delete(id);
  } catch {}

  projects.value = projects.value.filter(p => p.id !== id);
}

onMounted(() => {
  loadProjects();
});
</script>
