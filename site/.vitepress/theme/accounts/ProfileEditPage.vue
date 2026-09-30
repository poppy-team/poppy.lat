<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { accountsEnabled, api, ApiError, type ProfileView } from './api';
import PhotoEditor from './PhotoEditor.vue';
import { me, refreshMe, sessionStatus, startSession } from './session';

/**
 * `/conta/editar`: everything you can change about your profile, kept apart
 * from the profile itself so the profile is a place to look at, not a form.
 */
const services = [
  { key: 'github', label: 'GitHub', hint: 'seu-usuario' },
  { key: 'x', label: 'X', hint: '@usuario' },
  { key: 'linkedin', label: 'LinkedIn', hint: 'final do endereço, como ana-silva-123' },
  { key: 'instagram', label: 'Instagram', hint: '@usuario' },
  { key: 'youtube', label: 'YouTube', hint: '@canal' },
  { key: 'email', label: 'E-mail de contato', hint: 'voce@exemplo.com' },
  { key: 'site', label: 'Site pessoal', hint: 'https://seusite.com' },
] as const;

const loaded = ref(false);
const form = reactive({ name: '', handle: '', bio: '', isPublic: false, showInRankings: false });
const linkValues = reactive<Record<string, string>>({});
const linkMessages = reactive<Record<string, { text: string; bad: boolean }>>({});
const profileMessage = ref<{ text: string; bad: boolean } | null>(null);
const saving = ref(false);
const deleteConfirm = ref('');
const deleteMessage = ref('');

const profile = computed(() => me.value?.profile ?? null);

function fill(profileValue: ProfileView): void {
  Object.assign(form, {
    name: profileValue.name,
    handle: profileValue.handle,
    bio: profileValue.bio,
    isPublic: profileValue.isPublic,
    showInRankings: profileValue.showInRankings,
  });

  for (const service of services) {
    linkValues[service.key] = profileValue.links.find((link) => link.service === service.key)?.value ?? '';
  }
}

onMounted(async () => {
  startSession();

  const current = await refreshMe();

  if (current) {
    fill(current.profile);
  }

  loaded.value = true;
});

async function saveProfile(): Promise<void> {
  saving.value = true;
  profileMessage.value = null;

  try {
    const result = await api<{ profile: ProfileView }>('/api/me/profile', { method: 'PUT', json: { ...form } });

    if (me.value) {
      me.value.profile = result.profile;
      me.value.user.name = result.profile.name;
    }

    profileMessage.value = { text: 'Perfil salvo.', bad: false };
  } catch (error) {
    profileMessage.value = { text: error instanceof ApiError ? error.message : 'Não foi possível salvar.', bad: true };
  } finally {
    saving.value = false;
  }
}

async function saveLink(service: string): Promise<void> {
  const value = (linkValues[service] ?? '').trim();

  try {
    const result = await api<{ profile: ProfileView }>(`/api/me/links/${service}`, {
      method: value ? 'PUT' : 'DELETE',
      ...(value ? { json: { value } } : {}),
    });

    if (me.value) {
      me.value.profile = result.profile;
    }

    linkValues[service] = result.profile.links.find((link) => link.service === service)?.value ?? '';
    linkMessages[service] = { text: value ? 'Salvo.' : 'Removido.', bad: false };
  } catch (error) {
    linkMessages[service] = { text: error instanceof ApiError ? error.message : 'Não foi possível salvar.', bad: true };
  }
}

function photoChanged(photoUrl: string | null): void {
  if (me.value) {
    me.value.profile.photoUrl = photoUrl;
  }
}

async function deleteAccount(): Promise<void> {
  deleteMessage.value = '';

  try {
    await api('/api/me', { method: 'DELETE', json: { confirm: deleteConfirm.value } });
    location.assign('/aprender/');
  } catch (error) {
    deleteMessage.value =
      error instanceof ApiError && error.code === 'recent_login_required'
        ? 'Por segurança, entre de novo (peça um novo link) e volte aqui para apagar a conta.'
        : error instanceof ApiError
          ? error.message
          : 'Não foi possível apagar agora.';
  }
}
</script>

<template>
  <div class="acct-page">
    <template v-if="!accountsEnabled">
      <h1>Editar perfil</h1>
      <p>As contas ainda não estão ativas neste site.</p>
    </template>

    <p v-else-if="!loaded || sessionStatus === 'loading'" role="status">Carregando…</p>

    <template v-else-if="!me || !profile">
      <h1>Editar perfil</h1>
      <p>Entre para editar o seu perfil.</p>
      <a class="acct-btn acct-btn--primary" href="/conta/entrar?voltar=/conta/editar">Entrar</a>
    </template>

    <template v-else>
      <p class="edit-back"><a href="/conta/perfil">← Voltar ao perfil</a></p>
      <h1>Editar perfil</h1>

      <section class="acct-card" aria-labelledby="sec-photo">
        <h2 id="sec-photo">Foto</h2>
        <PhotoEditor :name="profile.name" :photo-url="profile.photoUrl" @changed="photoChanged" />
      </section>

      <section class="acct-card" aria-labelledby="sec-about">
        <h2 id="sec-about">Sobre você</h2>
        <form class="acct-form" @submit.prevent="saveProfile">
          <label class="acct-field">
            <span>Nome que aparece</span>
            <input v-model="form.name" name="name" maxlength="40" required autocomplete="nickname" />
          </label>
          <label class="acct-field">
            <span>Nome de usuário</span>
            <input v-model="form.handle" name="handle" maxlength="24" required autocomplete="off" autocapitalize="none" spellcheck="false" />
            <small>De 3 a 24 letras minúsculas, números ou hífens. Vira o endereço do seu perfil público.</small>
          </label>
          <label class="acct-field">
            <span>Bio</span>
            <textarea v-model="form.bio" name="bio" rows="3" maxlength="280" />
            <small>
              Até 280 caracteres. Emojis 😀 e menções como @poppy-team são bem-vindos. Endereços de sites e e-mails
              vão na seção de links.
            </small>
          </label>
          <label class="acct-check">
            <input v-model="form.isPublic" type="checkbox" />
            <span>Deixar meu perfil público (nome, selo, bio e links)</span>
          </label>
          <label class="acct-check">
            <input v-model="form.showInRankings" type="checkbox" />
            <span>Aparecer no ranking quando ele existir</span>
          </label>
          <div>
            <button type="submit" class="acct-btn acct-btn--primary" :disabled="saving">
              {{ saving ? 'Salvando…' : 'Salvar' }}
            </button>
          </div>
          <p v-if="profileMessage" :class="profileMessage.bad ? 'acct-error' : 'acct-ok'" :role="profileMessage.bad ? 'alert' : 'status'">
            {{ profileMessage.text }}
          </p>
        </form>
      </section>

      <section class="acct-card" aria-labelledby="sec-links">
        <h2 id="sec-links">Links</h2>
        <p class="acct-muted">
          Escreva só o seu nome em cada serviço. O site monta o endereço. Os que você preencher viram selos no seu
          perfil. O e-mail só aparece para quem está logado, depois de um clique.
        </p>
        <ul class="link-editor">
          <li v-for="service in services" :key="service.key">
            <form class="link-editor__row" @submit.prevent="saveLink(service.key)">
              <label class="acct-field">
                <span>{{ service.label }}</span>
                <input v-model="linkValues[service.key]" :placeholder="service.hint" maxlength="200" autocomplete="off" autocapitalize="none" spellcheck="false" />
              </label>
              <button type="submit" class="acct-btn">Salvar</button>
            </form>
            <p
              v-if="linkMessages[service.key]"
              :class="linkMessages[service.key]?.bad ? 'acct-error' : 'acct-ok'"
              :role="linkMessages[service.key]?.bad ? 'alert' : 'status'"
            >
              {{ linkMessages[service.key]?.text }}
            </p>
          </li>
        </ul>
        <p class="acct-muted acct-fine">Deixe o campo vazio e salve para remover o link.</p>
      </section>

      <section class="acct-card" aria-labelledby="sec-data">
        <h2 id="sec-data">Seus dados</h2>
        <p>
          <a class="acct-btn" href="/api/me/export" download>Baixar tudo o que a Poppy guarda sobre mim</a>
        </p>
        <details class="acct-danger">
          <summary>Apagar minha conta</summary>
          <p>
            Isto apaga a sua conta, o perfil, a foto, as anotações e o progresso, e não tem volta. Comentários que já
            receberam respostas ficam sem o seu nome, com o texto trocado por “[removido]”; os outros são apagados.
          </p>
          <form class="acct-form" @submit.prevent="deleteAccount">
            <label class="acct-field">
              <span>Para confirmar, escreva o seu nome de usuário ({{ profile.handle }})</span>
              <input v-model="deleteConfirm" autocomplete="off" autocapitalize="none" spellcheck="false" />
            </label>
            <div><button type="submit" class="acct-btn acct-btn--danger" :disabled="!deleteConfirm">Apagar para sempre</button></div>
            <p v-if="deleteMessage" class="acct-error" role="alert">{{ deleteMessage }}</p>
          </form>
        </details>
      </section>
    </template>
  </div>
</template>
