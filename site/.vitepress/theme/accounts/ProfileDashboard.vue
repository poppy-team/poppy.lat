<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { availableLessons, courseTracks, lessonAt, lessonRoute, type Course } from '../data/courses';
import { useCourseState } from '../course-state';
import { api, shortDateTime, type DashboardView, type ProfileView } from './api';
import { lessonHref, lessonTitle } from './lessons';

/**
 * The quick-access panel of your own profile: where to continue, your
 * courses and progress, a summary of your conversations, and the two things
 * that are not built yet (badges and ranking), said plainly.
 */
const props = defineProps<{ profile: ProfileView }>();

const state = useCourseState();
const dashboard = ref<DashboardView | null>(null);
const failed = ref(false);

onMounted(async () => {
  try {
    dashboard.value = await api<DashboardView>('/api/me/dashboard');
  } catch {
    failed.value = true;
  }
});

/**
 * The lesson you looked at last on this device; without one, the first lesson
 * you have not finished. The account does not remember the last lesson, only
 * what is finished, so on a new device this falls back to the second case.
 */
const resume = computed(() => {
  const last = state.value.lastLesson ? lessonAt(state.value.lastLesson) : undefined;

  if (last && state.value.lastLesson) {
    return { href: state.value.lastLesson, place: last, kind: 'last' as const };
  }

  const next = availableLessons().find((item) => !state.value.completed.includes(item.route));

  return next ? { href: next.route, place: next.place, kind: 'next' as const } : undefined;
});

const everythingDone = computed(
  () => availableLessons().length > 0 && availableLessons().every((item) => state.value.completed.includes(item.route)),
);

function progressByCourse(): { course: Course; done: number; total: number; available: number }[] {
  return courseTracks
    .flatMap((track) => track.courses)
    .map((course) => {
      const lessons = course.modules.flatMap((module) => module.lessons.map((lesson) => ({ lesson, route: lessonRoute(course, module, lesson) })));

      return {
        course,
        total: lessons.length,
        available: lessons.filter((item) => item.lesson.status === 'available').length,
        done: lessons.filter((item) => state.value.completed.includes(item.route)).length,
      };
    })
    .filter((item) => item.total > 0);
}

const progress = computed(() => progressByCourse());
</script>

<template>
  <div class="dash">
    <section class="acct-card dash__resume" aria-labelledby="dash-resume">
      <h2 id="dash-resume">Continuar de onde parou</h2>
      <template v-if="resume">
        <p class="dash__lesson">
          <strong>{{ resume.place.lesson.title }}</strong>
          <span class="acct-muted">{{ resume.place.course.title }} · {{ resume.place.module.title }}</span>
        </p>
        <p>
          <a class="acct-btn acct-btn--primary" :href="resume.href">
            {{ resume.kind === 'last' ? 'Voltar para a aula' : 'Começar a próxima aula' }}
          </a>
        </p>
      </template>
      <template v-else>
        <p v-if="everythingDone">Você terminou todas as aulas que existem hoje. Novas aulas chegam aos poucos.</p>
        <template v-else>
          <p>Você ainda não abriu nenhuma aula.</p>
          <p><a class="acct-btn acct-btn--primary" href="/aprender/">Ver os cursos</a></p>
        </template>
      </template>
    </section>

    <section class="acct-card" aria-labelledby="dash-courses">
      <h2 id="dash-courses">Seus cursos</h2>
      <ul class="progress-list">
        <li v-for="item in progress" :key="item.course.slug">
          <a :href="`/aprender/#${item.course.slug}`">{{ item.course.title }}</a>
          <progress :value="item.done" :max="item.total" :aria-label="`${item.course.title}: ${item.done} de ${item.total} lições`" />
          <span class="acct-muted">{{ item.available ? `${item.done} de ${item.total}` : 'em breve' }}</span>
        </li>
      </ul>
      <p class="dash__links">
        <a class="acct-btn" href="/aprender/">Todos os cursos</a>
        <a class="acct-btn" href="/conta/anotacoes">Minhas anotações</a>
      </p>
    </section>

    <section class="acct-card" aria-labelledby="dash-talk">
      <h2 id="dash-talk">Suas conversas</h2>
      <p v-if="failed" class="acct-muted">Não foi possível carregar o resumo agora.</p>
      <template v-else-if="dashboard">
        <p class="dash__numbers">
          <span><strong>{{ dashboard.comments.written }}</strong> {{ dashboard.comments.written === 1 ? 'comentário' : 'comentários' }}</span>
          <span><strong>{{ dashboard.comments.repliesReceived }}</strong> {{ dashboard.comments.repliesReceived === 1 ? 'resposta recebida' : 'respostas recebidas' }}</span>
        </p>
        <ul v-if="dashboard.comments.recent.length" class="dash__recent">
          <li v-for="item in dashboard.comments.recent" :key="item.id">
            <a :href="lessonHref(item.lessonId)">{{ lessonTitle(item.lessonId) }}</a>
            <span class="dash__excerpt">{{ item.excerpt }}</span>
            <span class="acct-muted acct-fine">
              {{ shortDateTime(item.createdAt) }}<template v-if="item.replies"> · {{ item.replies }} {{ item.replies === 1 ? 'resposta' : 'respostas' }}</template>
            </span>
          </li>
        </ul>
        <p v-else class="acct-muted">
          Quando tiver uma dúvida numa aula, pergunte nos comentários no fim da página. É assim que a comunidade
          aprende junta.
        </p>
      </template>
      <p v-else class="acct-muted" role="status">Carregando…</p>
    </section>

    <div class="dash__pair">
      <section class="acct-card" aria-labelledby="dash-badges">
        <h2 id="dash-badges">Conquistas</h2>
        <p class="acct-muted">
          Em breve. As conquistas vão marcar o que você fez: terminar um curso, ajudar alguém nos comentários. As
          regras ainda estão sendo definidas.
        </p>
      </section>
      <section class="acct-card" aria-labelledby="dash-rank">
        <h2 id="dash-rank">Ranking</h2>
        <p class="acct-muted">
          Em breve.
          {{ props.profile.showInRankings ? 'Você escolheu aparecer nele.' : 'Você escolheu não aparecer nele.' }}
          <a href="/conta/editar">Mudar</a>
        </p>
      </section>
    </div>
  </div>
</template>
