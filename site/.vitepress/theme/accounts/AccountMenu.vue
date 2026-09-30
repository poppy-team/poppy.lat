<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vitepress';
import { accountsEnabled, canEnterPanel, isStaff } from './api';
import Avatar from './Avatar.vue';
import NotificationBell from './NotificationBell.vue';
import { me, sessionStatus, signOut, startSession } from './session';

/**
 * The account entry in the header: "Entrar" for visitors, and for people
 * who are logged in a small menu with their profile, notes and (for the
 * team) moderation. Draws nothing when accounts are switched off.
 */
const route = useRoute();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

onMounted(() => {
  startSession();

  document.addEventListener('click', (event) => {
    if (open.value && root.value && event.target instanceof Node && !root.value.contains(event.target)) {
      open.value = false;
    }
  });
});

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) {
    open.value = false;
    root.value?.querySelector<HTMLElement>('button')?.focus();
  }
}
</script>

<template>
  <div v-if="accountsEnabled" ref="root" class="account-menu" @keydown="onKeydown">
    <a
      v-if="!me"
      class="account-menu__enter"
      :href="`/conta/entrar?voltar=${encodeURIComponent(route.path)}`"
      :aria-busy="sessionStatus === 'loading'"
    >
      Entrar
    </a>

    <template v-else>
      <NotificationBell />
      <button
        type="button"
        class="account-menu__button"
        :aria-expanded="open"
        aria-controls="account-menu-list"
        @click="open = !open"
      >
        <Avatar :name="me.profile.name" :photo-url="me.profile.photoUrl" :size="28" />
        <span class="account-menu__name">{{ me.profile.name }}</span>
      </button>

      <ul v-show="open" id="account-menu-list" class="account-menu__list">
        <li><a href="/conta/perfil">Meu perfil</a></li>
        <li><a href="/conta/anotacoes">Minhas anotações</a></li>
        <li v-if="isStaff(me)"><a href="/conta/moderacao">Moderação</a></li>
        <li v-if="canEnterPanel(me)"><a href="/gestao">Gestão</a></li>
        <li><button type="button" @click="signOut">Sair</button></li>
      </ul>
    </template>
  </div>
</template>
