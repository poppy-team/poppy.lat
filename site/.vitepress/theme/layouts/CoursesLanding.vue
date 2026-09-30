<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { courseTracks, handoutHref, hasHandout, lessonAt, lessonRoute, type Course } from '../data/courses';
import { useCourseState } from '../course-state';
import { accountsEnabled } from '../accounts/api';
import { me, sessionStatus } from '../accounts/session';

/**
 * The course landing: three ways in, depending on where the reader starts,
 * then the whole map, including what is not written yet, so the size of the
 * road is visible from the first visit.
 */
const state = useCourseState();
const { frontmatter } = useData();

// Lessons are written in Portuguese first; the English route says so.
const english = computed(() => frontmatter.value.locale === 'en');

const resume = computed(() => {
  const last = state.value.lastLesson;
  const place = last ? lessonAt(last) : undefined;

  return place && last ? { href: last, title: place.lesson.title, course: place.course.title } : undefined;
});

const entries = [
  {
    title: 'Nunca programei',
    description: 'Comece do zero: terminal, editor e o primeiro programa, sem pressa.',
    href: '#comece-aqui',
  },
  {
    title: 'Já programo',
    description: 'Veja os conceitos em Ori e Aipo lado a lado e siga para a trilha da linguagem.',
    href: '#pensar-em-codigo',
  },
  {
    title: 'Quero criar uma linguagem',
    description: 'Construa uma linguagem de calculadora e depois leia o compilador real.',
    href: '#como-uma-linguagem-funciona',
  },
];

// The invitation to sign in shows once the session is known, so it does not
// flash for people who are already signed in.
const invite = computed(() => accountsEnabled && sessionStatus.value === 'ready' && !me.value);

const languageNames = { ori: 'Ori', aipo: 'Aipo' } as const;

function lessonCount(course: Course): number {
  return course.modules.reduce((total, module) => total + module.lessons.length, 0);
}

function completedCount(course: Course): number {
  return course.modules.reduce(
    (total, module) =>
      total +
      module.lessons.filter((lesson) => state.value.completed.includes(lessonRoute(course, module, lesson))).length,
    0,
  );
}
</script>

<template>
  <div v-if="english" id="main-content" class="courses" tabindex="-1">
    <header class="courses-hero">
      <p class="eyebrow">Learn</p>
      <h1 class="courses-hero__title">Learn Ori and Aipo by building things</h1>
      <p class="courses-hero__summary">
        Short lessons, one idea at a time, each ending with a project that works. The lessons are being written in
        Portuguese first; English versions will follow one full module at a time.
      </p>
      <a class="courses-resume" href="/aprender/" lang="pt-BR">
        <span class="courses-resume__label">Open the lessons in Portuguese</span>
        <span class="courses-resume__title">Aprender</span>
      </a>
    </header>
  </div>

  <div v-else id="main-content" class="courses" tabindex="-1">
    <header class="courses-hero">
      <p class="eyebrow">Aprender</p>
      <h1 class="courses-hero__title">Aprender Ori e Aipo construindo coisas</h1>
      <p class="courses-hero__summary">
        Lições curtas, uma ideia por vez, sempre com um projeto que funciona no fim. Escritas para quem tem TDAH,
        dislexia, outras formas de pensar, ou está começando agora.
      </p>
      <p class="courses-free">
        <span class="courses-free__pill">Tudo gratuito</span>
        <span v-if="accountsEnabled">As lições, a conta, as anotações e os comentários não custam nada.</span>
        <span v-else>As lições não custam nada e ficam abertas para todo mundo.</span>
      </p>
      <p v-if="invite" class="courses-invite">
        <a class="courses-invite__link" href="/conta/entrar?voltar=/aprender/">Entrar ou criar conta</a>
        <span>para guardar seu progresso e suas anotações. Para ler, não precisa de conta.</span>
      </p>
      <ul v-if="invite" class="community-points" aria-label="O que a conta abre">
        <li>
          <strong>Tire dúvidas nos comentários.</strong>
          Cada aula tem uma conversa no fim da página: pergunte, responda e aprenda com quem está no mesmo ponto.
        </li>
        <li>
          <strong>Faça amizades no fórum.</strong>
          Em breve, um espaço para trocar ideias e projetos com quem também está aprendendo a programar.
        </li>
      </ul>
      <a v-if="resume" class="courses-resume" :href="resume.href">
        <span class="courses-resume__label">Continue de onde parou</span>
        <span class="courses-resume__title">{{ resume.title }} · {{ resume.course }}</span>
      </a>
    </header>

    <section class="courses-section" aria-labelledby="courses-entries">
      <h2 id="courses-entries" class="courses-section__title">Por onde começar</h2>
      <ul class="courses-entries">
        <li v-for="entry in entries" :key="entry.href">
          <a class="courses-entry" :href="entry.href">
            <span class="courses-entry__title">{{ entry.title }}</span>
            <span class="courses-entry__description">{{ entry.description }}</span>
          </a>
        </li>
      </ul>
    </section>

    <section
      v-for="track in courseTracks"
      :key="track.slug"
      class="courses-section"
      :aria-labelledby="`track-${track.slug}`"
    >
      <h2 :id="`track-${track.slug}`" class="courses-section__title">{{ track.title }}</h2>
      <p class="courses-section__summary">{{ track.summary }}</p>

      <article v-for="course in track.courses" :id="course.slug" :key="course.slug" class="course-card">
        <header class="course-card__head">
          <h3 class="course-card__title">{{ course.title }}</h3>
          <p class="course-card__summary">{{ course.summary }}</p>
          <p class="course-card__tags">
            <span v-for="language in course.languages" :key="language" class="course-card__tag">
              {{ languageNames[language] }}
            </span>
            <span class="course-card__tag course-card__tag--audience">{{ course.audience }}</span>
            <span v-if="lessonCount(course)" class="course-card__tag course-card__tag--progress">
              {{ completedCount(course) }} de {{ lessonCount(course) }} lições
            </span>
          </p>
          <p v-if="hasHandout(course)" class="course-card__handout">
            <a :href="handoutHref(course)" download>Baixar a apostila (Markdown)</a>
            <span>com as lições já escritas</span>
          </p>
        </header>

        <ol v-if="course.modules.length" class="course-modules">
          <li v-for="module in course.modules" :key="module.slug" class="course-module">
            <p class="course-module__title">
              {{ module.title }}
              <span class="course-module__project">Projeto: {{ module.project }}</span>
            </p>
            <ol v-if="module.lessons.length" class="course-lessons">
              <li v-for="lesson in module.lessons" :key="lesson.slug" class="course-lesson">
                <a v-if="lesson.status === 'available'" :href="lessonRoute(course, module, lesson)">
                  <span v-if="state.completed.includes(lessonRoute(course, module, lesson))" aria-hidden="true">✓ </span>
                  {{ lesson.title }}
                  <span class="visually-hidden" v-if="state.completed.includes(lessonRoute(course, module, lesson))">
                    (concluída)
                  </span>
                </a>
                <span v-else class="course-lesson--planned">{{ lesson.title }} <em>em breve</em></span>
                <span class="course-lesson__time">{{ lesson.minutes }} min</span>
              </li>
            </ol>
            <p v-else class="course-module__planned">Lições em preparação.</p>
          </li>
        </ol>
        <p v-else class="course-module__planned">Em preparação. O plano está no mapa do curso.</p>
      </article>
    </section>

    <section class="courses-section" aria-labelledby="courses-promise">
      <h2 id="courses-promise" class="courses-section__title">Como as lições são feitas</h2>
      <ul class="courses-promise">
        <li><strong>Mesma forma sempre.</strong> Objetivo, passos curtos, checkpoint, o que fazer se travar, resumo.</li>
        <li><strong>Uma ideia por lição.</strong> Até 12 minutos, com o tempo estimado no topo.</li>
        <li><strong>Leitura do seu jeito.</strong> Tamanho do texto, espaçamento, fonte de alta legibilidade e modo foco.</li>
        <li><strong>Sem pressa e sem pontos.</strong> O progresso fica salvo neste navegador, só para você.</li>
      </ul>
    </section>
  </div>
</template>
