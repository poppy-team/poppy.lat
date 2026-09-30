<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { accountsEnabled, api, ApiError, isStaff, shortDateTime, type CommentView } from './api';
import RoleBadge from './RoleBadge.vue';
import { loadRenderer } from './render-markdown';
import { me, sessionStatus, startSession } from './session';

/**
 * Moderation for contributors and admins: the reports queue, actions on a
 * person, and (admins) the log. Every action asks for a reason where one
 * matters, and is written to a log nobody can edit.
 */
interface Report {
  id: string;
  reason: string;
  details: string;
  reportedAt: string | null;
  reporter: string | null;
  comment: CommentView | null;
}

interface PersonState {
  handle: string;
  role: 'student' | 'contributor' | 'admin';
  banned: boolean;
  mutedUntil: string | null;
}

interface LogEntry {
  id: number;
  action: string;
  target: string | null;
  targetId: string;
  actor: string | null;
  reason: string;
  at: string | null;
}

const tab = ref<'reports' | 'people' | 'log'>('reports');
const reports = ref<Report[]>([]);
const log = ref<LogEntry[]>([]);
const render = ref<(source: string) => string>(() => '');
const loading = ref(false);
const message = ref<{ text: string; bad: boolean } | null>(null);
const reasonFor = reactive<Record<string, string>>({});

const lookup = ref('');
const person = ref<PersonState | null>(null);
const action = reactive({ hours: 24, reason: '', days: '', role: 'student' as PersonState['role'] });

const isAdmin = computed(() => me.value?.user.role === 'admin');

const reasonNames: Record<string, string> = {
  spam: 'Spam ou propaganda',
  ofensivo: 'Ofensivo ou desrespeitoso',
  'fora-do-tema': 'Fora do tema',
  'dados-pessoais': 'Dados pessoais',
  outro: 'Outro motivo',
};

const actionNames: Record<string, string> = {
  hide: 'ocultou comentário',
  restore: 'restaurou comentário',
  pin: 'fixou',
  unpin: 'desafixou',
  official: 'marcou como oficial',
  unofficial: 'tirou o selo oficial',
  purge: 'apagou de vez',
  mute: 'silenciou',
  unmute: 'tirou o silêncio de',
  ban: 'baniu',
  unban: 'desbaniu',
  role_change: 'mudou o papel de',
  photo_remove: 'removeu a foto de',
  report_resolved: 'resolveu denúncia',
  report_dismissed: 'ignorou denúncia',
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

async function loadReports(): Promise<void> {
  loading.value = true;

  try {
    reports.value = (await api<{ reports: Report[] }>('/api/mod/reports?status=open')).reports;
  } catch (error) {
    fail(error);
  } finally {
    loading.value = false;
  }
}

async function loadLog(): Promise<void> {
  try {
    log.value = (await api<{ entries: LogEntry[] }>('/api/mod/log')).entries;
  } catch (error) {
    fail(error);
  }
}

onMounted(async () => {
  startSession();

  const wait = setInterval(async () => {
    if (sessionStatus.value === 'ready') {
      clearInterval(wait);

      if (isStaff(me.value)) {
        render.value = await loadRenderer();
        await loadReports();
      }
    }
  }, 50);
});

function choose(next: typeof tab.value): void {
  tab.value = next;
  message.value = null;

  if (next === 'log') {
    void loadLog();
  }
}

async function resolve(report: Report, status: 'resolved' | 'dismissed'): Promise<void> {
  try {
    await api(`/api/mod/reports/${report.id}/resolve`, { json: { status } });
    await loadReports();
  } catch (error) {
    fail(error);
  }
}

async function hide(report: Report): Promise<void> {
  const reason = (reasonFor[report.id] ?? '').trim();

  if (!report.comment || reason.length < 3) {
    message.value = { text: 'Escreva o motivo (ao menos 3 letras) para ocultar.', bad: true };

    return;
  }

  try {
    await api(`/api/mod/comments/${report.comment.id}/hide`, { json: { reason } });
    message.value = { text: 'Comentário ocultado e denúncias resolvidas.', bad: false };
    await loadReports();
  } catch (error) {
    fail(error);
  }
}

async function findPerson(): Promise<void> {
  message.value = null;
  person.value = null;

  try {
    person.value = await api<PersonState>(`/api/mod/users/${encodeURIComponent(lookup.value.trim().replace(/^@/u, ''))}`);
    action.role = person.value.role;
  } catch (error) {
    fail(error);
  }
}

async function act(kind: 'mute' | 'unmute' | 'photo' | 'ban' | 'unban' | 'role'): Promise<void> {
  if (!person.value) {
    return;
  }

  const base = `/api/mod/users/${encodeURIComponent(person.value.handle)}`;
  const reason = action.reason.trim();

  try {
    switch (kind) {
      case 'mute':
        await api(`${base}/mute`, { json: { hours: Number(action.hours), reason } });
        break;
      case 'unmute':
        await api(`${base}/mute`, { method: 'DELETE' });
        break;
      case 'photo':
        await api(`${base}/photo`, { method: 'DELETE', json: { reason } });
        break;
      case 'ban':
        await api(`${base}/ban`, { json: { reason, ...(action.days ? { days: Number(action.days) } : {}) } });
        break;
      case 'unban':
        await api(`${base}/ban`, { method: 'DELETE', json: { reason } });
        break;
      case 'role':
        await api(`${base}/role`, { method: 'PUT', json: { role: action.role, reason } });
        break;
    }

    message.value = { text: 'Feito. A ação foi registrada.', bad: false };
    action.reason = '';
    await findPerson();
  } catch (error) {
    fail(error);
  }
}
</script>

<template>
  <div class="acct-page acct-page--wide">
    <h1>Moderação</h1>

    <p v-if="!accountsEnabled || sessionStatus !== 'ready'" role="status">Carregando…</p>
    <template v-else-if="!isStaff(me)">
      <p>Esta página é só para a equipe de moderação.</p>
    </template>

    <template v-else>
      <div class="mod-tabs" role="group" aria-label="Seções da moderação">
        <button type="button" class="acct-btn" :aria-pressed="tab === 'reports'" @click="choose('reports')">Denúncias</button>
        <button type="button" class="acct-btn" :aria-pressed="tab === 'people'" @click="choose('people')">Pessoas</button>
        <button v-if="isAdmin" type="button" class="acct-btn" :aria-pressed="tab === 'log'" @click="choose('log')">Registro</button>
      </div>

      <p v-if="message" :class="message.bad ? 'acct-error' : 'acct-ok'" :role="message.bad ? 'alert' : 'status'">{{ message.text }}</p>

      <section v-if="tab === 'reports'" aria-labelledby="mod-reports">
        <h2 id="mod-reports">Denúncias abertas</h2>
        <p v-if="loading" role="status">Carregando…</p>
        <p v-else-if="reports.length === 0" class="acct-muted">Nenhuma denúncia aberta. Tudo em ordem.</p>
        <ul class="mod-list">
          <li v-for="report in reports" :key="report.id" class="acct-card">
            <p>
              <strong>{{ reasonNames[report.reason] ?? report.reason }}</strong>
              <span class="acct-muted"> · por @{{ report.reporter ?? 'conta removida' }} · {{ shortDateTime(report.reportedAt) }}</span>
            </p>
            <p v-if="report.details" class="acct-muted">“{{ report.details }}”</p>
            <div v-if="report.comment" class="mod-comment">
              <p class="acct-muted">
                {{ report.comment.author?.name ?? 'Conta removida' }}
                <RoleBadge v-if="report.comment.author" :badge="report.comment.author.badge" />
                <a :href="`/aprender/${report.comment.targetId}#comentario-${report.comment.id}`">Abrir na aula</a>
              </p>
              <div class="comment__body" v-html="render(report.comment.bodyMd ?? '')" />
            </div>
            <label class="acct-field">
              <span>Motivo para ocultar</span>
              <input v-model="reasonFor[report.id]" maxlength="300" />
            </label>
            <div>
              <button type="button" class="acct-btn acct-btn--danger" @click="hide(report)">Ocultar comentário</button>
              <button type="button" class="acct-btn" @click="resolve(report, 'dismissed')">Ignorar denúncia</button>
              <button type="button" class="acct-btn acct-btn--quiet" @click="resolve(report, 'resolved')">Marcar como resolvida</button>
            </div>
          </li>
        </ul>
      </section>

      <section v-else-if="tab === 'people'" aria-labelledby="mod-people">
        <h2 id="mod-people">Pessoas</h2>
        <form class="acct-form mod-lookup" @submit.prevent="findPerson">
          <label class="acct-field">
            <span>Nome de usuário</span>
            <input v-model="lookup" autocapitalize="none" spellcheck="false" placeholder="aluno-3f9a1c" />
          </label>
          <button type="submit" class="acct-btn" :disabled="lookup.trim().length < 3">Buscar</button>
        </form>

        <div v-if="person" class="acct-card">
          <p>
            <strong>@{{ person.handle }}</strong>
            <RoleBadge :badge="person.role === 'student' ? 'student' : 'contributor'" />
            <span v-if="person.role === 'admin'" class="acct-muted">(admin)</span>
            <span v-if="person.banned" class="comment__tag comment__tag--warn">Banido</span>
            <span v-if="person.mutedUntil" class="comment__tag comment__tag--warn">
              Silenciado até {{ shortDateTime(person.mutedUntil) }}
            </span>
          </p>

          <label class="acct-field">
            <span>Motivo (vai para o registro)</span>
            <input v-model="action.reason" maxlength="300" />
          </label>

          <div class="mod-actions">
            <label class="acct-field">
              <span>Silenciar por</span>
              <select v-model="action.hours">
                <option :value="24">1 dia</option>
                <option :value="72">3 dias</option>
                <option :value="168">7 dias</option>
                <option :value="720">30 dias</option>
              </select>
            </label>
            <button type="button" class="acct-btn" :disabled="action.reason.trim().length < 3" @click="act('mute')">Silenciar</button>
            <button v-if="person.mutedUntil" type="button" class="acct-btn acct-btn--quiet" @click="act('unmute')">Tirar silêncio</button>
            <button type="button" class="acct-btn" :disabled="action.reason.trim().length < 3" @click="act('photo')">Remover a foto</button>
          </div>

          <div v-if="isAdmin" class="mod-actions">
            <label class="acct-field">
              <span>Banir por (dias; vazio = sem prazo)</span>
              <input v-model="action.days" inputmode="numeric" pattern="[0-9]*" />
            </label>
            <button type="button" class="acct-btn acct-btn--danger" :disabled="action.reason.trim().length < 3" @click="act('ban')">Banir</button>
            <button v-if="person.banned" type="button" class="acct-btn" @click="act('unban')">Desbanir</button>
          </div>

          <div v-if="isAdmin" class="mod-actions">
            <label class="acct-field">
              <span>Papel</span>
              <select v-model="action.role">
                <option value="student">Aluno</option>
                <option value="contributor">Contribuidor</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button type="button" class="acct-btn" :disabled="action.reason.trim().length < 3 || action.role === person.role" @click="act('role')">
              Mudar papel
            </button>
          </div>
        </div>
      </section>

      <section v-else aria-labelledby="mod-log">
        <h2 id="mod-log">Registro da moderação</h2>
        <p class="acct-muted">Só se acrescenta: nem o banco de dados deixa alterar ou apagar estas linhas.</p>
        <table class="mod-log">
          <thead>
            <tr><th scope="col">Quando</th><th scope="col">Quem</th><th scope="col">O quê</th><th scope="col">Motivo</th></tr>
          </thead>
          <tbody>
            <tr v-for="entry in log" :key="entry.id">
              <td>{{ shortDateTime(entry.at) }}</td>
              <td>@{{ entry.actor ?? '?' }}</td>
              <td>{{ actionNames[entry.action] ?? entry.action }} {{ entry.target ? `@${entry.target}` : '' }}</td>
              <td>{{ entry.reason }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
