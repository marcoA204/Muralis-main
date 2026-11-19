<template>
  <div class="h-full bg-concrete-900 text-paper flex items-center justify-center p-4 relative overflow-hidden select-none">
    <div class="max-w-md w-full bg-concrete-800 border-2 border-concrete-600 shadow-brutalist relative p-6 sm:p-8 space-y-6 rounded-xs">

      <div class="space-y-2 border-b-2 border-paint pb-4">
        <div class="flex items-center space-x-2">
          <span class="w-2 h-6 bg-paint"></span>
          <h1 class="font-display font-black text-3xl text-paper tracking-wider uppercase">
            MURALIS
          </h1>
        </div>
        <h2 class="text-xs font-mono font-bold text-concrete-300 uppercase tracking-widest">
          {{ isRegister ? 'Cadastro de Artista' : 'Estúdio de Arte Urbana' }}
        </h2>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="isRegister">
          <label class="block text-xs font-mono font-semibold uppercase tracking-wider text-concrete-300 mb-1">
            Nome do Artista ou Estúdio
          </label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full bg-concrete-900 border border-concrete-600 focus:border-paint focus:outline-none px-3.5 py-2.5 text-base md:text-xs text-paper placeholder-concrete-500 rounded-xs transition-colors font-mono"
            placeholder="Nome ou estúdio"
          />
        </div>

        <div>
          <label class="block text-xs font-mono font-semibold uppercase tracking-wider text-concrete-300 mb-1">
            E-mail
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full bg-concrete-900 border border-concrete-600 focus:border-paint focus:outline-none px-3.5 py-2.5 text-base md:text-xs text-paper placeholder-concrete-500 rounded-xs transition-colors font-mono"
            placeholder="artista@estudio.com"
          />
        </div>

        <div>
          <label class="block text-xs font-mono font-semibold uppercase tracking-wider text-concrete-300 mb-1">
            Senha
          </label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full bg-concrete-900 border border-concrete-600 focus:border-paint focus:outline-none px-3.5 py-2.5 text-base md:text-xs text-paper placeholder-concrete-500 rounded-xs transition-colors font-mono"
            placeholder="••••••••"
          />
        </div>

        <div v-if="errorMessage" class="p-2.5 bg-danger/20 border border-danger-border text-paper text-xs font-mono rounded-xs">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 px-4 bg-paint hover:bg-paint-hover border border-paint text-paint-dark text-xs font-mono font-black uppercase tracking-wider rounded-xs transition-colors shadow-subtle active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <span>{{ loading ? 'Processando...' : isRegister ? 'Criar Cadastro' : 'Entrar no Estúdio' }}</span>
        </button>
      </form>

      <div class="text-center pt-2 border-t border-concrete-600">
        <button
          type="button"
          class="text-xs text-concrete-300 hover:text-paper transition-colors font-mono tracking-wide"
          @click="isRegister = !isRegister; errorMessage = ''"
        >
          {{ isRegister ? 'Já possui conta? Entrar' : 'Não possui conta? Cadastre-se' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { apiRequest } from '../services/apiClient.js';

const router = useRouter();
const authStore = useAuthStore();

const isRegister = ref(false);
const name = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const endpoint = isRegister.value ? '/auth/register' : '/auth/login';
    const payload = isRegister.value
      ? { name: name.value, email: email.value, password: password.value }
      : { email: email.value, password: password.value };

    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.token) {
      authStore.setAuth(res.user, res.token, res.refreshToken);
      router.push('/projects');
    } else {
      router.push('/projects');
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Falha na autenticação';
  } finally {
    loading.value = false;
  }
}
</script>
