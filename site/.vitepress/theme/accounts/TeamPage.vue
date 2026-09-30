<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { accountsEnabled, api, type LinkView, type ProfileView } from './api';
import Avatar from './Avatar.vue';
import RoleBadge from './RoleBadge.vue';
import { startSession } from './session';

/**
 * The team page. The people come from the profiles themselves: anyone on the
 * team who made their profile public is listed, with the photo, the bio and the
 * links they chose to show. Change your profile and the card changes. A
 * private profile is never listed.
 */
const members = ref<ProfileView[]>([]);
const status = ref<'loading' | 'ready' | 'failed'>('loading');
const shownEmail = ref('');

onMounted(async () => {
  if (!accountsEnabled) {
    status.value = 'ready';

    return;
  }

  startSession();

  try {
    members.value = (await api<{ members: ProfileView[] }>('/api/team')).members;
    status.value = 'ready';
  } catch {
    status.value = 'failed';
  }
});

function emailLink(link: LinkView): boolean {
  return link.href === null;
}
</script>

<template>
  <main id="main-content" tabindex="-1" class="team-page">
    <header class="team-page__intro">
      <p class="team-page__kicker">Equipe</p>
      <h1>Quem faz a Poppy</h1>
      <p>
        Somos uma equipe pequena que constrói linguagens e ferramentas com atenção à leitura, e ensina a usá-las de graça,
        em português, pensando em quem costuma ficar de fora: pessoas com TDAH, dislexia, neurodivergentes e quem está
        começando agora.
      </p>
    </header>

    <p v-if="status === 'loading'" role="status" class="acct-muted">Carregando a equipe…</p>
    <p v-else-if="status === 'failed'" class="acct-muted">Não foi possível carregar a equipe agora. Tente de novo mais tarde.</p>

    <ul v-else-if="members.length" class="team-grid" aria-label="Pessoas da equipe">
      <li v-for="member in members" :key="member.handle" class="team-card">
        <Avatar :name="member.name" :photo-url="member.photoUrl" :size="72" />
        <h2 class="team-card__name">{{ member.name }}</h2>
        <p class="team-card__meta">
          <a :href="`/conta/perfil?u=${encodeURIComponent(member.handle)}`">@{{ member.handle }}</a>
          <RoleBadge :badge="member.badge" />
        </p>
        <p v-if="member.bio" class="team-card__bio">{{ member.bio }}</p>
        <ul v-if="member.links.length" class="link-badges" :aria-label="`Links de ${member.name}`">
          <li v-for="link in member.links" :key="link.service">
            <a
              v-if="!emailLink(link) && link.href"
              class="link-badge"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              {{ link.label }}
            </a>
            <template v-else>
              <button v-if="shownEmail !== `${member.handle}:${link.value}`" type="button" class="link-badge" @click="shownEmail = `${member.handle}:${link.value}`">
                E-mail: mostrar
              </button>
              <span v-else class="link-badge link-badge--text">{{ link.value }}</span>
            </template>
          </li>
        </ul>
      </li>
    </ul>

    <p v-else class="acct-muted">
      A equipe ainda vai aparecer aqui, com as pessoas que escolherem mostrar o perfil. Enquanto isso, você encontra o nosso
      trabalho no <a href="https://github.com/poppy-team">GitHub da Poppy Team</a>.
    </p>

    <aside class="team-page__join" aria-labelledby="team-join">
      <h2 id="team-join">Quer ajudar?</h2>
      <p>
        Escrever uma lição, revisar um texto, traduzir ou apontar uma barreira de acessibilidade já é ajudar. Conte com a
        gente pelo <a href="https://github.com/poppy-team">GitHub</a> ou por e-mail, em
        <a href="mailto:mail@poppy.lat">mail@poppy.lat</a>.
      </p>
    </aside>
  </main>
</template>
