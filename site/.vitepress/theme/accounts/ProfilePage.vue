<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { accountsEnabled, api, isStaff, type ProfileView } from './api';
import ProfileDashboard from './ProfileDashboard.vue';
import ProfileHead from './ProfileHead.vue';
import { me, refreshMe, sessionStatus, signOut, startSession } from './session';

/**
 * `/conta/perfil` is your own profile: who you are, a panel to get back to
 * your lessons and conversations, and one button to edit. With `?u=nome` it
 * shows someone's public profile instead. Nothing here is a form.
 */
const viewing = ref('');
const other = ref<ProfileView | null>(null);
const missing = ref(false);
const loaded = ref(false);

const profile = computed(() => (viewing.value ? other.value : (me.value?.profile ?? null)));

onMounted(async () => {
  startSession();

  viewing.value = (new URLSearchParams(location.search).get('u') ?? '').toLowerCase();

  if (viewing.value) {
    try {
      other.value = (await api<{ profile: ProfileView }>(`/api/u/${encodeURIComponent(viewing.value)}`)).profile;
    } catch {
      missing.value = true;
    }
  } else {
    await refreshMe();
  }

  loaded.value = true;
});
</script>

<template>
  <main id="main-content" tabindex="-1" class="acct-page" :class="{ 'acct-page--wide': !viewing }">
    <template v-if="!accountsEnabled">
      <h1>Perfil</h1>
      <p>As contas ainda não estão ativas neste site.</p>
    </template>

    <p v-else-if="!loaded || (!viewing && sessionStatus === 'loading')" role="status">Carregando…</p>

    <template v-else-if="viewing && missing">
      <h1>Perfil não encontrado</h1>
      <p>Esta pessoa não existe ou mantém o perfil privado.</p>
    </template>

    <template v-else-if="!viewing && !me">
      <h1>Seu perfil</h1>
      <p>Entre para ver o seu perfil.</p>
      <a class="acct-btn acct-btn--primary" href="/conta/entrar?voltar=/conta/perfil">Entrar</a>
    </template>

    <template v-else-if="profile">
      <ProfileHead :profile="profile" :mine="!viewing">
        <template v-if="!viewing" #actions>
          <a class="acct-btn" href="/conta/editar">Editar perfil</a>
        </template>
      </ProfileHead>

      <ProfileDashboard v-if="!viewing" :profile="profile" />

      <!-- On a phone the account menu of the header is gone; its items live here. -->
      <section v-if="!viewing" class="acct-card profile-account" aria-labelledby="profile-account">
        <h2 id="profile-account">Conta</h2>
        <ul>
          <li><a href="/conta/anotacoes">Minhas anotações</a></li>
          <li v-if="isStaff(me)"><a href="/conta/moderacao">Moderação</a></li>
          <li><button type="button" @click="signOut">Sair</button></li>
        </ul>
      </section>
    </template>
  </main>
</template>
