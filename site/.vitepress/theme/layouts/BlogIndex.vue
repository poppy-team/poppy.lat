<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import type { Locale } from '@poppy/project-data';
import { data as posts } from '../data/posts.data';
import { formatDate } from '../format';

const { frontmatter } = useData();
const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const notes = computed(() => posts.filter((post) => post.locale === locale.value));
</script>

<template>
  <div id="main-content" class="journal-page" tabindex="-1">
    <header class="page-intro">
      <p class="eyebrow">Poppy Team</p>
      <h1 class="page-intro__title">{{ locale === 'en' ? 'Journal' : 'Blog' }}</h1>
      <p class="page-intro__lead">
        {{
          locale === 'en'
            ? 'Short notes on how the projects are built and why they are shaped this way.'
            : 'Notas curtas sobre como os projetos são construídos e por que têm esta forma.'
        }}
      </p>
    </header>

    <ul class="post-list">
      <li v-for="post in notes" :key="post.url" class="post-list__item">
        <time class="post-list__date" :datetime="post.date">{{ formatDate(post.date, locale) }}</time>
        <div>
          <h2 class="post-list__title"><a class="card-link" :href="post.url">{{ post.title }}</a></h2>
          <p class="post-list__description">{{ post.description }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>
