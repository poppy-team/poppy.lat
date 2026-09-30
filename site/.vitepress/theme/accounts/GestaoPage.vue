<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { accountsEnabled, api, ApiError, badgeOf, canEnterPanel, roleLabel, shortDateTime, type Role } from './api';
import RoleBadge from './RoleBadge.vue';
import { me, sessionStatus, startSession } from './session';

/**
 * The management panel, for the team only. It is about people and content:
 * who can do what, and (soon) lessons, posts and media. It never edits the
 * site, its look or its settings. What each section shows depends on the role;
 * the server checks the same thing on every request, so hiding a tab is only
 * a courtesy.
 */
interface Person {
  handle: string;
  name: string;
  email: string;
  role: Role;
  banned: boolean;
  isPublic: boolean;
  joinedAt: string | null;
  lastSeenAt: string | null;
}

const role = computed(() => me.value?.user.role ?? 'student');
const isAdmin = computed(() => role.value === 'admin');

const tabs = computed(() => {
  const list: { id: 'overview' | 'people' | 'content' | 'moderation'; label: string }[] = [];

  if (isAdmin.value) {
    list.push({ id: 'overview', label: 'Visão geral' }, { id: 'people', label: 'Pessoas' });
  }

  if (role.value === 'creator' || isAdmin.value) {
    list.push({ id: 'content', label: 'Conteúdo' });
  }

  if (role.value === 'contributor' || isAdmin.value) {
    list.push({ id: 'moderation', label: 'Moderação' });
  }

  return list;
});

const tab = ref<'overview' | 'people' | 'content' | 'moderation'>('overview');
const summary = ref<Record<string, number>>({});
const people = ref<Person[]>([]);
const total = ref(0);
const more = ref(false);
const loading = ref(false);
const message = ref<{ text: string; bad: boolean } | null>(null);
const search = reactive({ q: '', role: '' });
const editing = ref<string | null>(null);
const change = reactive<{ role: Role; reason: string }>({ role: 'student', reason: '' });

const assignable: Role[] = ['student', 'contributor', 'creator', 'admin'];

const rolePlural: Record<Role, string> = { student: 'Alunos', contributor: 'Contribuidores', creator: 'Criadores', admin: 'Admins' };

const roleHelp: Record<Role, string> = {
  student: 'Estuda, anota e comenta.',
  contributor: 'Contribui com o site e os projetos. Modera comentários.',
  creator: 'Cria aulas e conteúdos. Publica depois da revisão de um admin.',
  admin: 'Cuida de tudo: pessoas, conteúdo e moderação.',
};

function fail(error: unknown): void {
  message.value = {
    text:
      error instanceof ApiError && error.code === 'recent_login_required'
        ? 'Por segurança, esta ação pede um login recente. Saia, entre de novo pelo link do e-mail e volte aqui.'
        : error instanceof ApiError
          ? error.message
          : 'Não foi possível concluir.',
    bad: true,
  };
}

async function loadSummary(): Promise<void> {
  try {
    summary.value = (await api<{ byRole: Record<string, number> }>('/api/gestao/summary')).byRole;
  } catch (error) {
    fail(error);
  }
}

async function loadPeople(append = false): Promise<void> {
  loading.value = true;

  try {
    const params = new URLSearchParams({ limit: '25', offset: String(append ? people.value.length : 0) });

    if (search.q.trim()) {
      params.set('q', search.q.trim());
    }

    if (search.role) {
      params.set('role', search.role);
    }

    const page = await api<{ total: number; more: boolean; users: Person[] }>(`/api/gestao/users?${params}`);

    people.value = append ? [...people.value, ...page.users] : page.users;
    total.value = page.total;
    more.value = page.more;
  } catch (error) {
    fail(error);
  } finally {
    loading.value = false;
  }
}

function choose(next: typeof tab.value): void {
  tab.value = next;
  message.value = null;

  if (next === 'overview') {
    void loadSummary();
  } else if (next === 'people') {
    void loadPeople();
  }
}

function startEdit(person: Person): void {
  editing.value = person.handle;
  change.role = person.role;
  change.reason = '';
  message.value = null;
}

async function saveRole(person: Person): Promise<void> {
  try {
    await api(`/api/mod/users/${encodeURIComponent(person.handle)}/role`, {
      method: 'PUT',
      json: { role: change.role, reason: change.reason.trim() },
    });
    message.value = { text: `Papel de ${person.name} mudou para ${roleLabel[change.role]}. A ação foi registrada.`, bad: false };
    editing.value = null;
    await loadPeople();
  } catch (error) {
    fail(error);
  }
}

onMounted(() => {
  startSession();
});

// The session loads on its own; the first tab opens once it is ready.
watch(
  sessionStatus,
  (status) => {
    if (status === 'ready' && tabs.value[0]) {
      choose(tabs.value[0].id);
    }
  },
  { immediate: true },
);
</script>

<template>
  <main id="main-content" tabindex="-1" class="acct-page acct-page--wide gestao">
    <p class="gestao__kicker">Gestão</p>
    <h1>Painel da equipe</h1>

    <p v-if="!accountsEnabled || sessionStatus !== 'ready'" role="status">Carregando…</p>
    <p v-else-if="!canEnterPanel(me)">Esta página é só para a equipe.</p>

    <template v-else>
      <p class="acct-muted">
        Você entrou como <strong>{{ roleLabel[role] }}</strong>.
        Aqui ficam as pessoas e o conteúdo. O visual e as configurações do site não passam por este painel.
      </p>

      <div class="mod-tabs" role="group" aria-label="Seções da gestão">
        <button v-for="entry in tabs" :key="entry.id" type="button" class="acct-btn" :aria-pressed="tab === entry.id" @click="choose(entry.id)">
          {{ entry.label }}
        </button>
      </div>

      <p v-if="message" :class="message.bad ? 'acct-error' : 'acct-ok'" :role="message.bad ? 'alert' : 'status'">{{ message.text }}</p>

      <section v-if="tab === 'overview'" aria-labelledby="gestao-overview">
        <h2 id="gestao-overview">Visão geral</h2>
        <ul class="gestao__counts">
          <li v-for="entry in assignable" :key="entry" class="acct-card">
            <span class="gestao__count">{{ summary[entry] ?? 0 }}</span>
            <span class="gestao__count-label">{{ (summary[entry] ?? 0) === 1 ? roleLabel[entry] : rolePlural[entry] }}</span>
            <span class="acct-muted acct-fine">{{ roleHelp[entry] }}</span>
          </li>
        </ul>
      </section>

      <section v-else-if="tab === 'people'" aria-labelledby="gestao-people">
        <h2 id="gestao-people">Pessoas</h2>

        <form class="gestao__search" role="search" @submit.prevent="loadPeople()">
          <label class="acct-field">
            <span>Buscar por nome, usuário ou e-mail</span>
            <input v-model="search.q" type="search" autocapitalize="none" spellcheck="false" maxlength="80" />
          </label>
          <label class="acct-field">
            <span>Papel</span>
            <select v-model="search.role" @change="loadPeople()">
              <option value="">Todos</option>
              <option v-for="entry in assignable" :key="entry" :value="entry">{{ roleLabel[entry] }}</option>
            </select>
          </label>
          <button type="submit" class="acct-btn">Buscar</button>
        </form>

        <p class="acct-muted" role="status">{{ loading ? 'Carregando…' : `${total} ${total === 1 ? 'pessoa' : 'pessoas'}` }}</p>

        <ul class="mod-list">
          <li v-for="person in people" :key="person.handle" class="acct-card gestao__person">
            <div class="gestao__person-head">
              <p>
                <strong>{{ person.name }}</strong>
                <span class="acct-muted"> @{{ person.handle }}</span>
                <RoleBadge :badge="badgeOf(person.role)" />
                <span v-if="person.role === 'admin'" class="acct-muted">(admin)</span>
                <span v-if="person.banned" class="comment__tag comment__tag--warn">Banido</span>
              </p>
              <p class="acct-muted acct-fine">
                {{ person.email }} · entrou {{ shortDateTime(person.joinedAt) }}<template v-if="person.lastSeenAt"> · visto {{ shortDateTime(person.lastSeenAt) }}</template>
              </p>
            </div>

            <div v-if="editing === person.handle" class="mod-actions">
              <label class="acct-field">
                <span>Novo papel</span>
                <select v-model="change.role">
                  <option v-for="entry in assignable" :key="entry" :value="entry">{{ roleLabel[entry] }}</option>
                </select>
              </label>
              <label class="acct-field gestao__reason">
                <span>Motivo (vai para o registro)</span>
                <input v-model="change.reason" maxlength="300" />
              </label>
              <button type="button" class="acct-btn acct-btn--primary" :disabled="change.reason.trim().length < 3 || change.role === person.role" @click="saveRole(person)">
                Mudar papel
              </button>
              <button type="button" class="acct-btn acct-btn--quiet" @click="editing = null">Cancelar</button>
              <p class="acct-muted acct-fine gestao__help">{{ roleHelp[change.role] }}</p>
            </div>
            <div v-else class="mod-actions">
              <button v-if="person.role !== 'admin'" type="button" class="acct-btn" @click="startEdit(person)">Mudar papel</button>
              <span v-else class="acct-muted acct-fine">Admins não mudam o papel de outros admins.</span>
              <a class="acct-btn acct-btn--quiet" href="/conta/moderacao">Silenciar ou banir</a>
            </div>
          </li>
        </ul>

        <button v-if="more" type="button" class="acct-btn" :disabled="loading" @click="loadPeople(true)">Mostrar mais</button>
      </section>

      <section v-else-if="tab === 'content'" aria-labelledby="gestao-content">
        <h2 id="gestao-content">Conteúdo</h2>
        <p>
          Aqui vão ficar as aulas, os podcasts, os slides e as imagens, com editor visual, revisão e publicação. Esta parte ainda
          está em construção: o <a href="https://github.com/poppy-team/poppy.lat/blob/main/docs/aprender-painel-admin.md">plano</a>
          descreve as próximas etapas.
        </p>
        <p class="acct-muted">Quando estiver pronta, o que você escrever fica como rascunho e vai para a revisão de um admin antes de aparecer no site.</p>
      </section>

      <section v-else-if="tab === 'moderation'" aria-labelledby="gestao-moderation">
        <h2 id="gestao-moderation">Moderação</h2>
        <p>Denúncias, comentários escondidos, silêncios e o registro de tudo que a equipe fez.</p>
        <a class="acct-btn acct-btn--primary" href="/conta/moderacao">Abrir a moderação</a>
      </section>
    </template>
  </main>
</template>
