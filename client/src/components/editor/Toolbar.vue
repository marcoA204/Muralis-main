<template>
  <aside class="w-full md:w-80 bg-concrete-800 border-t-2 md:border-t-0 md:border-l-2 border-concrete-600 flex flex-col h-full overflow-y-auto text-sm select-none pb-12 md:pb-4">

    <div class="p-3 md:p-4 border-b-2 border-concrete-600 flex items-center justify-between bg-concrete-900 sticky top-0 z-20">
      <div>
        <span class="text-[10px] font-mono text-paint font-bold uppercase tracking-wider block">
          PAINEL DE CONTROLE
        </span>
        <h2 class="font-display font-black text-paper text-lg tracking-tight uppercase">Arte & Ajustes</h2>
      </div>

      <div class="flex items-center space-x-1.5">
        <button
          type="button"
          class="p-2 rounded-xs bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 text-concrete-300 hover:text-paper disabled:opacity-25 transition-all"
          :disabled="!canUndo"
          aria-label="Desfazer"
          title="Desfazer (Ctrl+Z)"
          @click="$emit('undo')"
        >
          <UndoIcon class="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          class="p-2 rounded-xs bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 text-concrete-300 hover:text-paper disabled:opacity-25 transition-all"
          :disabled="!canRedo"
          aria-label="Refazer"
          title="Refazer (Ctrl+Y)"
          @click="$emit('redo')"
        >
          <RedoIcon class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div class="p-4 space-y-6 flex-1">

      <div class="space-y-3">
        <div class="text-xs font-mono font-bold uppercase tracking-wider flex items-center">
          <span class="text-paint mr-1.5 font-black">01</span>
          <span class="text-paper">Sua Arte</span>
        </div>

        <div>
          <span class="block text-xs font-mono text-concrete-300 mb-1.5">
            Ilustração, Graffiti ou Logo (PNG, JPG)
          </span>

          <input
            ref="artFileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleArtUpload"
          />

          <div class="flex items-center space-x-2">
            <button
              type="button"
              class="flex-1 py-2.5 px-3 bg-paint hover:bg-paint-hover border border-paint rounded-xs text-xs font-mono font-black uppercase tracking-wider text-paint-dark flex items-center justify-center space-x-2 transition-colors shadow-subtle active:scale-[0.98]"
              @click="artFileInputRef?.click()"
            >
              <UploadIcon class="w-4 h-4 stroke-[2.5]" />
              <span>{{ hasArt ? 'Trocar Arte' : 'Carregar Arte' }}</span>
            </button>

            <button
              type="button"
              class="py-2.5 px-3 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono text-concrete-300 hover:text-paper transition-colors"
              title="Carregar arte stencil de exemplo"
              @click="loadSampleArt"
            >
              Exemplo
            </button>
          </div>

          <div v-if="hasArt" class="mt-2 flex items-center gap-2">
            <button
              type="button"
              class="flex-1 py-2 px-2.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 hover:border-paint rounded-xs text-xs font-mono font-bold text-paper flex items-center justify-center space-x-1.5 transition-colors"
              @click="$emit('openImageEditor')"
            >
              <CropIcon class="w-3.5 h-3.5 text-paint" />
              <span>Editar / Cortar</span>
            </button>

            <button
              type="button"
              class="py-2 px-2.5 bg-concrete-700 hover:bg-danger/20 border border-concrete-600 hover:border-danger-border rounded-xs text-xs font-mono font-bold text-concrete-300 hover:text-paper flex items-center justify-center space-x-1 transition-colors"
              aria-label="Remover arte carregada"
              title="Remover Arte"
              @click="$emit('removeArt')"
            >
              <Trash2Icon class="w-3.5 h-3.5" />
              <span>Remover</span>
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-3 pt-3 border-t border-concrete-600">
        <div class="text-xs font-mono font-bold uppercase tracking-wider flex items-center">
          <span class="text-paint mr-1.5 font-black">02</span>
          <span class="text-paper">Perspectiva da Arte</span>
        </div>

        <button
          type="button"
          class="w-full py-2.5 px-3 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 hover:border-paint rounded-xs text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors text-paper"
          @click="$emit('autoFit')"
        >
          <Wand2Icon class="w-4 h-4 text-paint" />
          <span>Ajustar à Parede</span>
        </button>

        <div class="space-y-1.5 pt-1">
          <span class="text-xs font-mono text-concrete-300 block">Ângulo de visão do muro:</span>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              class="py-1.5 px-1 text-xs font-mono rounded-xs font-bold border text-center transition-colors truncate"
              :class="
                currentSlope !== null && currentSlope < -0.1
                  ? 'bg-paint border-paint text-paint-dark'
                  : 'bg-concrete-750 border-concrete-600 text-concrete-300 hover:text-paper'
              "
              title="Muro visto pela esquerda"
              @click="$emit('applyPreset', -0.22)"
            >
              ← Esq
            </button>
            <button
              type="button"
              class="py-1.5 px-1 text-xs font-mono rounded-xs font-bold border text-center transition-colors truncate"
              :class="
                currentSlope === null || Math.abs(currentSlope) <= 0.1
                  ? 'bg-paint border-paint text-paint-dark'
                  : 'bg-concrete-750 border-concrete-600 text-concrete-300 hover:text-paper'
              "
              title="Muro visto de frente"
              @click="$emit('applyPreset', 0)"
            >
              Frente
            </button>
            <button
              type="button"
              class="py-1.5 px-1 text-xs font-mono rounded-xs font-bold border text-center transition-colors truncate"
              :class="
                currentSlope !== null && currentSlope > 0.1
                  ? 'bg-paint border-paint text-paint-dark'
                  : 'bg-concrete-750 border-concrete-600 text-concrete-300 hover:text-paper'
              "
              title="Muro visto pela direita"
              @click="$emit('applyPreset', 0.22)"
            >
              Dir →
            </button>
          </div>
        </div>

        <div class="space-y-1 pt-1">
          <div class="flex justify-between text-xs font-mono text-concrete-300">
            <span>Tamanho da arte no muro</span>
            <span class="text-paper font-bold">{{ Math.round((artScale ?? 0.7) * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0.20"
            max="1.50"
            step="0.05"
            :value="artScale"
            class="w-full"
            @input="(e) => $emit('update:artScale', parseFloat((e.target as HTMLInputElement).value))"
          />
        </div>

        <div class="pt-1 space-y-1.5">
          <button
            type="button"
            class="w-full py-1.5 px-2.5 text-xs font-mono font-bold rounded-xs border transition-colors flex items-center justify-between"
            :class="
              isGuideMode
                ? 'bg-paint border-paint text-paint-dark'
                : 'bg-concrete-750 border-concrete-600 text-concrete-300 hover:text-paper'
            "
            @click="$emit('toggleGuideMode')"
          >
            <span>Vetores do Muro (Topo / Base)</span>
            <span class="text-[10px]">{{ isGuideMode ? 'ATIVO' : 'OFF' }}</span>
          </button>
          <p v-if="isGuideMode" class="text-[10px] font-mono text-concrete-300 leading-snug">
            Arraste os vetores laranja (topo) e azul (base) nas bordas do muro e clique em Ajustar à Parede.
          </p>
        </div>

        <div class="space-y-1.5 pt-1">
          <div class="flex justify-between text-xs font-mono text-concrete-300">
            <span>Rotação da imagem</span>
            <span class="text-paper font-bold">{{ Math.round(artRotation ?? 0) }}°</span>
          </div>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              class="py-1 text-[11px] font-mono font-bold rounded-xs border bg-concrete-750 border-concrete-600 text-concrete-300 hover:text-paper hover:border-paint transition-colors"
              @click="$emit('update:artRotation', ((artRotation ?? 0) - 90 + 540) % 360 - 180)"
            >
              -90°
            </button>
            <button
              type="button"
              class="py-1 text-[11px] font-mono font-bold rounded-xs border transition-colors"
              :class="(artRotation ?? 0) === 0 ? 'bg-paint border-paint text-paint-dark' : 'bg-concrete-750 border-concrete-600 text-concrete-300 hover:text-paper'"
              @click="$emit('update:artRotation', 0)"
            >
              0°
            </button>
            <button
              type="button"
              class="py-1 text-[11px] font-mono font-bold rounded-xs border bg-concrete-750 border-concrete-600 text-concrete-300 hover:text-paper hover:border-paint transition-colors"
              @click="$emit('update:artRotation', ((artRotation ?? 0) + 90 + 540) % 360 - 180)"
            >
              +90°
            </button>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            :value="artRotation ?? 0"
            class="w-full"
            @input="(e) => $emit('update:artRotation', parseFloat((e.target as HTMLInputElement).value))"
          />
        </div>

        <!-- Slider de Posição Vertical -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono text-concrete-300">
            <span>Altura da arte</span>
            <span class="text-paper font-bold">{{ verticalPositionLabel }}</span>
          </div>
          <input
            type="range"
            min="-0.40"
            max="0.40"
            step="0.05"
            :value="verticalPosition"
            class="w-full"
            @input="(e) => $emit('update:verticalPosition', parseFloat((e.target as HTMLInputElement).value))"
          />
        </div>
      </div>


      <div class="space-y-3 pt-3 border-t border-concrete-600">
        <div class="text-xs font-mono font-bold uppercase tracking-wider flex items-center">
          <span class="text-paint mr-1.5 font-black">03</span>
          <span class="text-paper">Pintura & Acabamento</span>
        </div>

        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="mode in blendModes"
            :key="mode.id"
            type="button"
            class="py-2 px-2 text-xs font-mono rounded-xs font-bold border text-center transition-colors"
            :class="
              blendMode === mode.id
                ? 'bg-paint border-paint text-paint-dark'
                : 'bg-concrete-700 border-concrete-600 text-concrete-300 hover:bg-concrete-600 hover:text-paper'
            "
            @click="$emit('update:blendMode', mode.id)"
          >
            {{ mode.label }}
          </button>
        </div>

        <div class="space-y-3 pt-1">
          <div class="space-y-1">
            <div class="flex justify-between text-xs font-mono text-concrete-300">
              <span>Opacidade da tinta</span>
              <span class="text-paper font-bold">{{ Math.round(opacity * 100) }}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="opacity"
              class="w-full"
              @input="(e) => $emit('update:opacity', parseFloat((e.target as HTMLInputElement).value))"
            />
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs font-mono text-concrete-300">
              <span>Brilho</span>
              <span class="text-paper font-bold">{{ Math.round((brightness - 1) * 100) }}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              :value="brightness"
              class="w-full"
              @input="(e) => $emit('update:brightness', parseFloat((e.target as HTMLInputElement).value))"
            />
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs font-mono text-concrete-300">
              <span>Contraste</span>
              <span class="text-paper font-bold">{{ Math.round((contrast - 1) * 100) }}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              :value="contrast"
              class="w-full"
              @input="(e) => $emit('update:contrast', parseFloat((e.target as HTMLInputElement).value))"
            />
          </div>
        </div>
      </div>

      <div class="space-y-3 pt-3 border-t border-concrete-600">
        <div class="text-xs font-mono font-bold uppercase tracking-wider flex items-center">
          <span class="text-paint mr-1.5 font-black">04</span>
          <span class="text-paper">Muro ou Fachada</span>
        </div>

        <div>
          <span class="block text-xs font-mono text-concrete-300 mb-1.5">
            Parede de Fundo (Câmera ou Foto)
          </span>

          <div class="flex items-center space-x-2">
            <button
              type="button"
              class="flex-1 py-2 px-3 border rounded-xs text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
              :class="isCameraActive ? 'bg-danger text-paper border-danger-border' : 'bg-concrete-700 hover:bg-concrete-600 text-paper border-concrete-600'"
              @click="$emit('toggleCamera')"
              :title="isCameraActive ? 'Desativar câmera' : 'Apontar a câmera para o muro'"
            >
              <CameraIcon class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{{ isCameraActive ? 'Desativar Câmera' : 'Câmera ao Vivo' }}</span>
            </button>
            <button
              v-if="isCameraActive"
              type="button"
              class="py-2 px-3 bg-concrete-700 hover:bg-concrete-600 border border-concrete-500 rounded-xs text-xs font-mono font-bold text-paper flex items-center justify-center space-x-1 transition-colors"
              title="Congelar e salvar foto do muro"
              @click="$emit('captureCamera')"
            >
              <CheckIcon class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Congelar</span>
            </button>
          </div>

          <div class="mt-2 flex items-center space-x-2">
            <input
              ref="baseFileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleBasePhotoUpload"
            />
            <button
              type="button"
              class="flex-1 py-2 px-3 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono font-bold text-paper flex items-center justify-center space-x-1.5 transition-colors"
              @click="baseFileInputRef?.click()"
            >
              <UploadIcon class="w-3.5 h-3.5 text-concrete-300" />
              <span>Foto da Parede</span>
            </button>
            <button
              type="button"
              class="py-2 px-2.5 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono text-concrete-300 hover:text-paper transition-colors"
              title="Carregar foto de tijolos de exemplo"
              @click="loadSampleBase"
            >
              Exemplo
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-3 pt-3 border-t border-concrete-600">
        <div class="flex items-center justify-between">
          <div class="text-xs font-mono font-bold uppercase tracking-wider flex items-center">
            <span class="text-paint mr-1.5 font-black">05</span>
            <span class="text-paper">Máscara de oclusão</span>
          </div>
          <button
            type="button"
            class="py-1 px-2.5 text-xs font-mono font-bold rounded-xs border transition-colors"
            :class="
              isMaskMode
                ? 'bg-paint border-paint text-paint-dark'
                : 'bg-concrete-700 border-concrete-600 text-concrete-300 hover:bg-concrete-600 hover:text-paper'
            "
            @click="$emit('toggleMaskMode')"
          >
            {{ isMaskMode ? 'Fechar Pincel' : 'Pintar' }}
          </button>
        </div>

        <div v-if="isMaskMode" class="space-y-3 bg-concrete-900 p-3 rounded-xs border border-concrete-600">
          <p class="text-[11px] font-mono text-concrete-300 leading-relaxed">
            Pinte obstáculos (postes, cabos, árvores) na frente do muro para que a arte fique atrás deles.
          </p>

          <div class="flex items-center space-x-2">
            <button
              type="button"
              class="flex-1 py-1.5 text-xs font-mono font-bold rounded-xs border text-center transition-colors"
              :class="
                !isEraser
                  ? 'bg-paint border-paint text-paint-dark'
                  : 'bg-concrete-700 border-concrete-600 text-concrete-300'
              "
              @click="$emit('update:isEraser', false)"
            >
              Pincel
            </button>
            <button
              type="button"
              class="flex-1 py-1.5 text-xs font-mono font-bold rounded-xs border text-center transition-colors"
              :class="
                isEraser
                  ? 'bg-paint border-paint text-paint-dark'
                  : 'bg-concrete-700 border-concrete-600 text-concrete-300'
              "
              @click="$emit('update:isEraser', true)"
            >
              Borracha
            </button>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs font-mono text-concrete-300">
              <span>Espessura:</span>
              <span class="text-paper font-bold">{{ brushSize }}px</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              :value="brushSize"
              class="w-full"
              @input="(e) => $emit('update:brushSize', parseInt((e.target as HTMLInputElement).value))"
            />
          </div>

          <button
            type="button"
            class="w-full py-1.5 text-xs font-mono font-bold text-concrete-300 hover:text-paper border border-concrete-600 rounded-xs bg-concrete-800 transition-colors"
            @click="$emit('clearMask')"
          >
            Limpar Máscara
          </button>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-concrete-700/60">
          <span class="text-xs font-mono text-concrete-200 font-bold">Pintar Muro (Ao Redor)</span>
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-mono font-bold rounded-xs border transition-colors"
            :class="
              isPaintMode
                ? 'bg-paint border-paint text-paint-dark'
                : 'bg-concrete-700 border-concrete-600 text-concrete-300 hover:text-paper'
            "
            @click="$emit('togglePaintMode')"
          >
            {{ isPaintMode ? 'Ativo' : 'Ativar' }}
          </button>
        </div>

        <div v-if="isPaintMode" class="space-y-3 bg-concrete-900 p-3 rounded-xs border border-concrete-600">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-mono text-concrete-300">Cor da Tinta:</span>
            <div class="flex items-center gap-1.5">
              <button
                v-for="swatch in paintSwatches"
                :key="swatch"
                type="button"
                class="w-4 h-4 rounded-xs border"
                :class="paintColor === swatch ? 'border-white scale-110' : 'border-concrete-600'"
                :style="{ backgroundColor: swatch }"
                @click="$emit('update:paintColor', swatch)"
              ></button>
              <input
                type="color"
                :value="paintColor"
                class="w-6 h-5 p-0 border border-concrete-600 rounded-xs bg-transparent cursor-pointer"
                @input="(e) => $emit('update:paintColor', (e.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <button
              type="button"
              class="flex-1 py-1.5 text-xs font-mono font-bold rounded-xs border text-center transition-colors"
              :class="
                !isPaintEraser
                  ? 'bg-paint border-paint text-paint-dark'
                  : 'bg-concrete-700 border-concrete-600 text-concrete-300'
              "
              @click="$emit('update:isPaintEraser', false)"
            >
              Pincel
            </button>
            <button
              type="button"
              class="flex-1 py-1.5 text-xs font-mono font-bold rounded-xs border text-center transition-colors"
              :class="
                isPaintEraser
                  ? 'bg-paint border-paint text-paint-dark'
                  : 'bg-concrete-700 border-concrete-600 text-concrete-300'
              "
              @click="$emit('update:isPaintEraser', true)"
            >
              Borracha
            </button>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs font-mono text-concrete-300">
              <span>Tamanho do Pincel:</span>
              <span class="text-paper font-bold">{{ paintBrushSize }}px</span>
            </div>
            <input
              type="range"
              min="5"
              max="140"
              step="5"
              :value="paintBrushSize"
              class="w-full"
              @input="(e) => $emit('update:paintBrushSize', parseInt((e.target as HTMLInputElement).value))"
            />
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs font-mono text-concrete-300">
              <span>Opacidade da Tinta:</span>
              <span class="text-paper font-bold">{{ Math.round((paintOpacity ?? 0.85) * 100) }}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              :value="paintOpacity"
              class="w-full"
              @input="(e) => $emit('update:paintOpacity', parseFloat((e.target as HTMLInputElement).value))"
            />
          </div>

          <button
            type="button"
            class="w-full py-1.5 text-xs font-mono font-bold text-concrete-300 hover:text-paper border border-concrete-600 rounded-xs bg-concrete-800 transition-colors"
            @click="$emit('clearPaint')"
          >
            Limpar Pintura
          </button>
        </div>
      </div>

      <div class="space-y-3 border-t border-concrete-600 pt-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-mono font-bold text-paint">06</span>
            <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-paper">
              Medição de Muro
            </h3>
          </div>
          <button
            type="button"
            class="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-xs border transition-colors flex items-center space-x-1"
            :class="
              isMeasureMode
                ? 'bg-paint border-paint text-paint-dark'
                : 'bg-concrete-700 border-concrete-600 text-concrete-300 hover:text-paper'
            "
            @click="$emit('toggleMeasureMode')"
          >
            <RulerIcon class="w-3 h-3" />
            <span>{{ isMeasureMode ? 'Ativo' : 'Medir' }}</span>
          </button>
        </div>

        <div v-if="isMeasureMode || pixelsPerMeter" class="space-y-3 bg-concrete-900 p-3 rounded-xs border border-concrete-600">
          <p class="text-[11px] font-mono text-concrete-300 leading-relaxed">
            Arraste os pontos A e B sobre uma referência conhecida no muro e informe o comprimento real.
          </p>

          <div class="flex items-center space-x-2">
            <input
              type="number"
              min="0.05"
              step="0.05"
              :value="referenceMeters"
              class="w-24 px-2 py-1.5 bg-concrete-800 border border-concrete-600 focus:border-paint rounded-xs text-base md:text-xs font-mono text-paper focus:outline-none"
              aria-label="Comprimento de referência em metros"
              @input="(e) => $emit('update:referenceMeters', parseFloat((e.target as HTMLInputElement).value) || 0)"
            />
            <span class="text-xs font-mono text-concrete-300">m</span>
            <button
              type="button"
              :disabled="!hasMeasureLine || !referenceMeters || referenceMeters <= 0"
              class="flex-1 py-1.5 px-2 bg-paint hover:bg-paint-hover disabled:opacity-40 text-paint-dark text-xs font-mono font-black uppercase rounded-xs transition-colors"
              @click="$emit('calibrateMeasure')"
            >
              Calibrar
            </button>
          </div>

          <div v-if="pixelsPerMeter" class="space-y-1.5 border-t border-concrete-700 pt-2 text-xs font-mono">
            <div class="flex justify-between text-concrete-300">
              <span>Linha A-B:</span>
              <span class="text-paper font-bold">{{ measuredLineText }}</span>
            </div>
            <template v-if="quadMeasurement">
              <div class="flex justify-between text-concrete-300">
                <span>Arte (L × A):</span>
                <span class="text-paper font-bold">
                  {{ formatMeters(quadMeasurement.avgWidthM) }} × {{ formatMeters(quadMeasurement.avgHeightM) }}
                </span>
              </div>
              <div class="flex justify-between text-concrete-300">
                <span>Área da arte:</span>
                <span class="text-paint font-bold">{{ quadMeasurement.areaSqM.toFixed(2) }} m²</span>
              </div>
              <div class="flex justify-between text-concrete-300">
                <span>Tinta est. (1 demão):</span>
                <span class="text-paper font-bold">~{{ quadMeasurement.estimatedPaintLiters.toFixed(1) }} L</span>
              </div>
            </template>
          </div>

          <button
            type="button"
            class="w-full py-1.5 text-xs font-mono font-bold text-concrete-300 hover:text-paper border border-concrete-600 rounded-xs bg-concrete-800 transition-colors"
            @click="$emit('clearMeasure')"
          >
            Limpar Medição
          </button>
        </div>
      </div>

      <div class="space-y-3 pt-3 border-t border-concrete-600">
        <div class="text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-paint mr-1.5 font-black">07</span>
            <span class="text-paper">Computação Gráfica</span>
          </div>
          <span class="text-[9px] font-mono px-1.5 py-0.5 bg-paint/20 text-paint border border-paint/40 rounded-xs font-bold">
            CG & PDI
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="p-2 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 hover:border-paint text-paper font-mono text-xs font-bold rounded-xs flex flex-col items-center justify-center gap-1.5 transition-colors text-center"
            title="Inspecionar matriz homogênea 3x3, determinante e decomposição"
            @click="$emit('openMatrixInspector')"
          >
            <SlidersIcon class="w-4 h-4 text-paint" />
            <span>Matriz 3x3</span>
          </button>

          <button
            type="button"
            class="p-2 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 hover:border-paint text-paper font-mono text-xs font-bold rounded-xs flex flex-col items-center justify-center gap-1.5 transition-colors text-center"
            title="Convolução 3x3 (Sobel, Gaussiano, Laplaciano) e Relevo de Parede"
            @click="$emit('openConvolutionFilters')"
          >
            <SparklesIcon class="w-4 h-4 text-paint" />
            <span>Filtros PDI</span>
          </button>

          <button
            type="button"
            class="p-2 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 hover:border-paint text-paper font-mono text-xs font-bold rounded-xs flex flex-col items-center justify-center gap-1.5 transition-colors text-center"
            title="Simulador de Ambiente 3D com iluminação Phong e órbita livre"
            @click="$emit('openThreeScene')"
          >
            <BoxIcon class="w-4 h-4 text-paint" />
            <span>Cena 3D & Luz</span>
          </button>

          <button
            type="button"
            class="p-2 border font-mono text-xs font-bold rounded-xs flex flex-col items-center justify-center gap-1.5 transition-colors text-center"
            :class="showPainterGrid ? 'bg-paint text-paint-dark border-paint' : 'bg-concrete-700 hover:bg-concrete-600 border-concrete-600 text-paper'"
            title="Exibir grade de perspectiva do pintor (A1, A2, B1...)"
            @click="$emit('togglePainterGrid')"
          >
            <GridIcon class="w-4 h-4" :class="showPainterGrid ? 'text-paint-dark' : 'text-paint'" />
            <span>{{ showPainterGrid ? 'Grade: Ativa' : 'Grade Pintor' }}</span>
          </button>
        </div>

        <button
          type="button"
          class="w-full py-2 px-3 bg-concrete-900 hover:bg-concrete-750 border border-concrete-600 hover:border-paint rounded-xs text-xs font-mono font-bold text-paper flex items-center justify-center space-x-2 transition-colors"
          title="Modo tela cheia com Keystone inverso para apontar projetor para a parede"
          @click="$emit('openProjectorMode')"
        >
          <TvIcon class="w-3.5 h-3.5 text-paint" />
          <span>Modo Projetor (Keystone Inverso)</span>
        </button>
      </div>
    </div>

    <div class="p-4 border-t-2 border-concrete-600 bg-concrete-900 space-y-2 mt-auto">
      <div class="flex space-x-2">
        <button
          type="button"
          class="flex-1 py-2.5 px-3 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono font-bold text-paper flex items-center justify-center space-x-1.5 transition-colors"
          @click="$emit('save')"
        >
          <SaveIcon class="w-3.5 h-3.5 text-paint" />
          <span>Salvar</span>
        </button>

        <button
          type="button"
          class="flex-1 py-2.5 px-3 bg-concrete-700 hover:bg-concrete-600 border border-concrete-600 rounded-xs text-xs font-mono font-bold text-paper flex items-center justify-center space-x-1.5 transition-colors"
          @click="$emit('share')"
        >
          <Share2Icon class="w-3.5 h-3.5 text-paint" />
          <span>Compartilhar</span>
        </button>
      </div>

      <button
        type="button"
        class="w-full py-3 px-4 bg-paint hover:bg-paint-hover border border-paint text-paint-dark rounded-xs text-xs font-mono font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-subtle"
        @click="$emit('export')"
      >
        <DownloadIcon class="w-4 h-4 stroke-[2.5]" />
        <span>Exportar Resolução Original</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { BlendMode } from '../../engine/blendEngine.js';
import { QuadMeasurement, formatMeters } from '../../engine/wallMeasurement.js';
import {
  Undo as UndoIcon,
  Redo as RedoIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Share2 as Share2Icon,
  Camera as CameraIcon,
  Check as CheckIcon,
  Wand2 as Wand2Icon,
  Crop as CropIcon,
  Trash2 as Trash2Icon,
  Ruler as RulerIcon,
  Sliders as SlidersIcon,
  Sparkles as SparklesIcon,
  Box as BoxIcon,
  Grid as GridIcon,
  Tv as TvIcon
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    blendMode: BlendMode;
    opacity: number;
    brightness: number;
    contrast: number;
    canUndo: boolean;
    canRedo: boolean;
    isMaskMode: boolean;
    brushSize: number;
    isEraser: boolean;
    isCameraActive?: boolean;
    artScale?: number;
    verticalPosition?: number;
    currentSlope?: number | null;
    hasArt?: boolean;
    isMeasureMode?: boolean;
    referenceMeters?: number;
    pixelsPerMeter?: number | null;
    measuredLineText?: string;
    quadMeasurement?: QuadMeasurement | null;
    hasMeasureLine?: boolean;
    showPainterGrid?: boolean;
    isGuideMode?: boolean;
    isPaintMode?: boolean;
    paintColor?: string;
    paintBrushSize?: number;
    paintOpacity?: number;
    isPaintEraser?: boolean;
    artRotation?: number;
  }>(),
  {
    artScale: 0.70,
    verticalPosition: 0,
    currentSlope: null,
    hasArt: false,
    isMeasureMode: false,
    referenceMeters: 2,
    pixelsPerMeter: null,
    measuredLineText: '',
    quadMeasurement: null,
    hasMeasureLine: false,
    showPainterGrid: false,
    isGuideMode: false,
    isPaintMode: false,
    paintColor: '#FFFFFF',
    paintBrushSize: 36,
    paintOpacity: 0.85,
    isPaintEraser: false,
    artRotation: 0
  }
);

const emit = defineEmits<{
  (e: 'update:blendMode', val: BlendMode): void;
  (e: 'update:opacity', val: number): void;
  (e: 'update:brightness', val: number): void;
  (e: 'update:contrast', val: number): void;
  (e: 'update:brushSize', val: number): void;
  (e: 'update:isEraser', val: boolean): void;
  (e: 'update:artScale', val: number): void;
  (e: 'update:verticalPosition', val: number): void;
  (e: 'applyPreset', slope: number): void;
  (e: 'toggleMaskMode'): void;
  (e: 'clearMask'): void;
  (e: 'toggleMeasureMode'): void;
  (e: 'update:referenceMeters', val: number): void;
  (e: 'calibrateMeasure'): void;
  (e: 'clearMeasure'): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'save'): void;
  (e: 'share'): void;
  (e: 'export'): void;
  (e: 'baseLoaded', url: string): void;
  (e: 'artLoaded', url: string): void;
  (e: 'toggleCamera'): void;
  (e: 'captureCamera'): void;
  (e: 'autoFit'): void;
  (e: 'openImageEditor'): void;
  (e: 'removeArt'): void;
  (e: 'openMatrixInspector'): void;
  (e: 'openConvolutionFilters'): void;
  (e: 'openThreeScene'): void;
  (e: 'togglePainterGrid'): void;
  (e: 'openProjectorMode'): void;
  (e: 'toggleGuideMode'): void;
  (e: 'togglePaintMode'): void;
  (e: 'update:paintColor', val: string): void;
  (e: 'update:paintBrushSize', val: number): void;
  (e: 'update:paintOpacity', val: number): void;
  (e: 'update:isPaintEraser', val: boolean): void;
  (e: 'clearPaint'): void;
  (e: 'update:artRotation', val: number): void;
}>();

const verticalPositionLabel = computed(() => {
  const pos = props.verticalPosition ?? 0;
  if (pos < -0.2) return 'Topo';
  if (pos > 0.2) return 'Base';
  return 'Centro';
});

const paintSwatches = ['#FFFFFF', '#111111', '#E63946', '#F4A261', '#2A9D8F', '#264653'];
const baseFileInputRef = ref<HTMLInputElement | null>(null);
const artFileInputRef = ref<HTMLInputElement | null>(null);

const blendModes: { id: BlendMode; label: string }[] = [
  { id: 'multiply', label: 'Tinta no Muro (Multiply)' },
  { id: 'overlay', label: 'Contraste (Overlay)' },
  { id: 'soft-light', label: 'Luz Suave (Natural)' },
  { id: 'normal', label: 'Adesivo Opaco (Normal)' }
];

function handleBasePhotoUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  emit('baseLoaded', url);
}

function handleArtUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  emit('artLoaded', url);
}

function loadSampleBase() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#452e24';
  ctx.fillRect(0, 0, 1200, 800);

  ctx.strokeStyle = '#1a1614';
  ctx.lineWidth = 5;
  const brickH = 44;
  const brickW = 110;

  for (let y = 0; y < 800; y += brickH) {
    const isOdd = (y / brickH) % 2 === 1;
    const offset = isOdd ? brickW / 2 : 0;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1200, y);
    ctx.stroke();

    for (let x = -offset; x < 1200; x += brickW) {
      const colorVariance = (Math.sin(x * 12.3 + y * 7.7) * 15) | 0;
      const r = Math.max(0, Math.min(255, 69 + colorVariance));
      const g = Math.max(0, Math.min(255, 46 + colorVariance / 2));
      const b = Math.max(0, Math.min(255, 36 + colorVariance / 3));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + brickH);
      ctx.stroke();
    }
  }

  const noise = ctx.getImageData(0, 0, 1200, 800);
  for (let i = 0; i < noise.data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 28;
    noise.data[i] = Math.max(0, Math.min(255, noise.data[i] + grain));
    noise.data[i + 1] = Math.max(0, Math.min(255, noise.data[i + 1] + grain));
    noise.data[i + 2] = Math.max(0, Math.min(255, noise.data[i + 2] + grain));
  }
  ctx.putImageData(noise, 0, 0);

  emit('baseLoaded', canvas.toDataURL('image/jpeg', 0.95));
}

function loadSampleArt() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ee5a3c';
  ctx.fillRect(40, 40, 720, 520);

  ctx.fillStyle = '#151413';
  ctx.fillRect(80, 80, 640, 440);

  ctx.fillStyle = '#ece6d8';
  ctx.font = '900 110px "Big Shoulders Stencil Display", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MURALIS', 400, 260);

  ctx.font = '600 20px "IBM Plex Mono", monospace';
  ctx.letterSpacing = '4px';
  ctx.fillText('ARTE URBANA & FACHADAS', 400, 360);

  emit('artLoaded', canvas.toDataURL('image/png'));
}
</script>
