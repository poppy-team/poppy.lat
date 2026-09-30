<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { api, ApiError } from './api';

/**
 * Choosing a profile photo: pick a file, frame it with three sliders, and the
 * browser draws a 256 x 256 WebP under 40 KB before anything is sent. The
 * server checks and re-encodes it again; this step only saves bandwidth.
 */
const props = defineProps<{ name: string; photoUrl: string | null }>();
const emit = defineEmits<{ changed: [photoUrl: string | null] }>();

const maxSource = 10 * 1024 * 1024;
const target = 256;
const maxBytes = 40 * 1024;

const canvas = ref<HTMLCanvasElement | null>(null);
const bitmap = ref<ImageBitmap | null>(null);
const zoom = ref(1);
const offsetX = ref(50);
const offsetY = ref(50);
const busy = ref(false);
const message = ref('');
const failed = ref(false);

const initial = computed(() => Array.from(props.name.trim())[0]?.toUpperCase() ?? '?');

function draw(): void {
  const context = canvas.value?.getContext('2d');
  const image = bitmap.value;

  if (!context || !image || !canvas.value) {
    return;
  }

  const side = Math.min(image.width, image.height) / zoom.value;
  const sx = (image.width - side) * (offsetX.value / 100);
  const sy = (image.height - side) * (offsetY.value / 100);

  canvas.value.width = target;
  canvas.value.height = target;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sx, sy, side, side, 0, 0, target, target);
}

watch([zoom, offsetX, offsetY, bitmap], () => draw(), { flush: 'post' });

async function choose(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];

  message.value = '';
  failed.value = false;

  if (!file) {
    return;
  }

  if (!/^image\/(png|jpeg|webp)$/u.test(file.type)) {
    fail('Use uma imagem PNG, JPEG ou WebP.');

    return;
  }

  if (file.size > maxSource) {
    fail('Essa imagem é muito grande. Escolha uma de até 10 MB.');

    return;
  }

  try {
    bitmap.value = await createImageBitmap(file, { imageOrientation: 'from-image' });
    zoom.value = 1;
    offsetX.value = 50;
    offsetY.value = 50;
  } catch {
    fail('Não consegui abrir essa imagem. Tente outra.');
  }
}

function fail(text: string): void {
  failed.value = true;
  message.value = text;
}

function toBlob(quality: number, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.value?.toBlob(resolve, type, quality));
}

/** Tries lower qualities until the picture is small; falls back to JPEG where WebP cannot be written. */
async function compress(): Promise<Blob | null> {
  for (const type of ['image/webp', 'image/jpeg']) {
    for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45, 0.35]) {
      const blob = await toBlob(quality, type);

      if (blob && blob.type === type && blob.size <= maxBytes) {
        return blob;
      }
    }
  }

  return null;
}

async function save(): Promise<void> {
  busy.value = true;
  message.value = '';

  try {
    const blob = await compress();

    if (!blob) {
      fail('Não consegui deixar a foto pequena o bastante. Tente outra.');

      return;
    }

    const result = await api<{ photoUrl: string }>('/api/me/photo', {
      method: 'PUT',
      body: blob,
      headers: { 'content-type': blob.type },
    });

    bitmap.value = null;
    emit('changed', result.photoUrl);
    message.value = 'Foto atualizada.';
    failed.value = false;
  } catch (error) {
    fail(error instanceof ApiError ? error.message : 'Não foi possível enviar a foto agora.');
  } finally {
    busy.value = false;
  }
}

async function remove(): Promise<void> {
  busy.value = true;

  try {
    await api('/api/me/photo', { method: 'DELETE' });
    emit('changed', null);
    message.value = 'Foto removida.';
    failed.value = false;
  } catch (error) {
    fail(error instanceof ApiError ? error.message : 'Não foi possível remover agora.');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="photo-editor">
    <div class="photo-editor__now">
      <span class="avatar avatar--large" aria-hidden="true">
        <img v-if="photoUrl" :src="photoUrl" alt="" width="96" height="96" />
        <span v-else>{{ initial }}</span>
      </span>
      <div>
        <label class="acct-btn photo-editor__pick">
          {{ photoUrl ? 'Trocar a foto' : 'Escolher uma foto' }}
          <input class="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" @change="choose" />
        </label>
        <button v-if="photoUrl" type="button" class="acct-btn acct-btn--quiet" :disabled="busy" @click="remove">
          Remover
        </button>
        <p class="acct-muted acct-fine">
          Só quem está logado vê a foto. Ela é reduzida para 256 px antes de sair do seu computador.
        </p>
      </div>
    </div>

    <div v-if="bitmap" class="photo-editor__frame">
      <canvas ref="canvas" width="256" height="256" class="photo-editor__canvas" aria-label="Prévia da foto" />
      <div class="photo-editor__controls">
        <label class="acct-range"><span>Aproximar</span><input v-model.number="zoom" type="range" min="1" max="3" step="0.05" /></label>
        <label class="acct-range"><span>Mover para os lados</span><input v-model.number="offsetX" type="range" min="0" max="100" /></label>
        <label class="acct-range"><span>Mover para cima e para baixo</span><input v-model.number="offsetY" type="range" min="0" max="100" /></label>
        <div>
          <button type="button" class="acct-btn acct-btn--primary" :disabled="busy" @click="save">
            {{ busy ? 'Enviando…' : 'Usar esta foto' }}
          </button>
          <button type="button" class="acct-btn acct-btn--quiet" :disabled="busy" @click="bitmap = null">Cancelar</button>
        </div>
      </div>
    </div>

    <p v-if="message" :class="failed ? 'acct-error' : 'acct-ok'" :role="failed ? 'alert' : 'status'">{{ message }}</p>
  </div>
</template>
