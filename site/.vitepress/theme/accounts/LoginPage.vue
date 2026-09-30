<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { courseTracks } from '../data/courses';
import { accountsEnabled, api, ApiError } from './api';
import { me, refreshMe } from './session';

/**
 * Login has no password: the person types an e-mail address, gets a link
 * that works once for ten minutes, and clicks it. GitHub is offered when the
 * server has it set up.
 */
const email = ref('');
const sending = ref(false);
const sent = ref(false);
const error = ref('');
const github = ref(false);
const back = ref('/aprender/');

onMounted(async () => {
  const wanted = new URLSearchParams(location.search).get('voltar');

  // Only paths of this site are accepted, never another address.
  if (wanted && /^\/(?!\/)[\w\-./?=&%#]*$/u.test(wanted)) {
    back.value = wanted;
  }

  if (new URLSearchParams(location.search).has('erro')) {
    error.value = 'O link não funcionou. Ele vale por 10 minutos e só uma vez. Peça um novo abaixo.';
  }

  await refreshMe();

  if (me.value) {
    location.replace(back.value);

    return;
  }

  github.value = await api<{ github?: boolean }>('/api/health')
    .then((health) => Boolean(health.github))
    .catch(() => false);
});

async function submit(): Promise<void> {
  error.value = '';
  sending.value = true;

  try {
    await api('/api/auth/sign-in/magic-link', {
      json: {
        email: email.value.trim(),
        callbackURL: back.value,
        errorCallbackURL: '/conta/entrar?erro=1',
      },
    });
    sent.value = true;
  } catch (failure) {
    error.value =
      failure instanceof ApiError && failure.status === 429
        ? 'Muitos pedidos. Espere um pouco e tente de novo.'
        : failure instanceof ApiError && failure.status === 400
          ? 'Confira o e-mail: ele parece incompleto.'
          : failure instanceof ApiError
            ? failure.message
            : 'Não foi possível enviar agora.';
  } finally {
    sending.value = false;
  }
}

async function withGithub(): Promise<void> {
  try {
    const result = await api<{ url?: string }>('/api/auth/sign-in/social', {
      json: { provider: 'github', callbackURL: back.value },
    });

    if (result.url) {
      location.assign(result.url);
    }
  } catch {
    error.value = 'Não foi possível abrir o GitHub agora.';
  }
}
</script>

<template>
  <div class="acct-page" :class="accountsEnabled && !sent ? 'acct-page--login' : 'acct-page--narrow'">
    <template v-if="!accountsEnabled">
      <h1>Entrar</h1>
      <p>As contas ainda não estão ativas neste site. As lições continuam abertas para todo mundo.</p>
    </template>

    <template v-else-if="sent">
      <h1>Olhe seu e-mail</h1>
      <p role="status">
        Enviamos um link para <strong>{{ email }}</strong
        >. Clique nele para entrar. O link vale por 10 minutos e funciona uma vez.
      </p>
      <p class="acct-muted">Não chegou? Veja a caixa de spam e espere um minuto. Depois você pode pedir outro.</p>
      <button type="button" class="acct-btn" @click="sent = false">Usar outro e-mail</button>
    </template>

    <template v-else>
      <div class="login">
        <header class="login__intro">
          <p class="login__free">Tudo gratuito</p>
          <h1>Entrar ou criar conta</h1>
          <p>
            Aprender Ori e Aipo, construindo projetos, não custa nada: as aulas, a conta, as anotações e os
            comentários são gratuitos, sem cartão de crédito. A conta serve para guardar o seu progresso e as suas
            anotações e para conversar com a comunidade.
          </p>
          <ul class="community-points" aria-label="O que a conta abre">
            <li>
              <strong>Tire dúvidas nos comentários.</strong>
              Cada aula tem uma conversa no fim da página. Pergunte o que não entendeu e responda a quem está no mesmo
              ponto que você já esteve.
            </li>
            <li>
              <strong>Faça amizades no fórum.</strong>
              Em breve, um espaço para trocar ideias e projetos com outras pessoas que estão aprendendo a programar.
              Ninguém aprende sozinho.
            </li>
          </ul>
          <p class="acct-muted">
            Só quer ler? As aulas continuam abertas, <a href="/aprender/">veja os cursos sem entrar</a>.
          </p>
        </header>

        <div class="login__form acct-card">
          <p>
            Sem senha para lembrar. Você recebe um link no e-mail e clica. Se ainda não tem conta, ela é criada
            na hora, como <strong>Aluno</strong>.
          </p>

          <form class="acct-form" novalidate @submit.prevent="submit">
            <label class="acct-field">
              <span>Seu e-mail</span>
              <input v-model="email" type="email" name="email" autocomplete="email" inputmode="email" required />
            </label>
            <button type="submit" class="acct-btn acct-btn--primary" :disabled="sending || !email.includes('@')">
              {{ sending ? 'Enviando…' : 'Enviar o link' }}
            </button>
          </form>

          <p v-if="error" class="acct-error" role="alert">{{ error }}</p>

          <div v-if="github" class="acct-alt">
            <p class="acct-muted">ou</p>
            <button type="button" class="acct-btn" @click="withGithub">Entrar com GitHub</button>
          </div>

          <p class="acct-muted acct-fine">
            As contas são para maiores de 18 anos. Ao criar a sua, você confirma a idade e aceita os
            <a href="/termos">Termos de Uso</a>, a <a href="/privacidade">Política de Privacidade</a> e as
            <a href="/aprender/regras">regras da comunidade</a>. Você pode baixar ou apagar os seus dados quando
            quiser, no seu perfil.
          </p>
        </div>

        <section class="login__courses" aria-labelledby="login-courses">
          <h2 id="login-courses">O que você encontra</h2>
          <ul class="login__tracks">
            <li v-for="track in courseTracks" :key="track.slug">
              <strong>{{ track.title }}</strong>
              <span class="acct-muted">{{ track.summary }}</span>
              <ul class="login__course-list">
                <li v-for="course in track.courses" :key="course.slug">{{ course.title }}</li>
              </ul>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>
