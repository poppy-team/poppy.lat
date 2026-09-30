<script setup lang="ts">
import { ref } from 'vue';
import { longDate, type LinkView, type ProfileView } from './api';
import Avatar from './Avatar.vue';
import RoleBadge from './RoleBadge.vue';

/**
 * The top of a profile: photo, name, handle, badge, bio and the link badges.
 * Used for your own profile and for the public profile of someone else. The
 * `actions` slot holds the "Editar perfil" button on your own.
 */
defineProps<{ profile: ProfileView; mine?: boolean }>();

const shownEmail = ref('');

function linkHref(link: LinkView): string | null {
  return link.href;
}
</script>

<template>
  <header class="profile-head">
    <Avatar :name="profile.name" :photo-url="profile.photoUrl" :size="96" />
    <div class="profile-head__text">
      <div class="profile-head__title">
        <h1>{{ profile.name }}</h1>
        <slot name="actions" />
      </div>
      <p class="profile-head__meta">
        <span class="profile-head__handle">@{{ profile.handle }}</span>
        <RoleBadge :badge="profile.badge" />
        <span v-if="profile.memberSince" class="acct-muted">na Poppy desde {{ longDate(profile.memberSince) }}</span>
      </p>
      <p v-if="profile.bio" class="profile-head__bio">{{ profile.bio }}</p>
      <ul v-if="profile.links.length" class="link-badges" :aria-label="`Links de ${profile.name}`">
        <li v-for="link in profile.links" :key="link.service">
          <a
            v-if="linkHref(link)"
            class="link-badge"
            :href="linkHref(link) ?? undefined"
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
          >
            {{ link.label }}
          </a>
          <template v-else>
            <button v-if="shownEmail !== link.value" type="button" class="link-badge" @click="shownEmail = link.value">
              E-mail: mostrar
            </button>
            <span v-else class="link-badge link-badge--text">{{ link.value }}</span>
          </template>
        </li>
      </ul>
      <p v-if="mine && !profile.isPublic" class="acct-muted acct-fine">
        Seu perfil é privado: só você o vê. Os outros alunos veem apenas o seu nome e o selo ao lado dos comentários.
      </p>
    </div>
  </header>
</template>
