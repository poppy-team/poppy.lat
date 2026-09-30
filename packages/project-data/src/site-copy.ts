import type { Locale } from './projects.ts';

export interface NavigationCopy {
  home: string;
  projects: string;
  docs: string;
  learn: string;
  blog: string;
  contact: string;
}

export interface SiteCopy {
  skipLink: string;
  navigationLabel: string;
  navigation: NavigationCopy;
  languageLabel: string;
  languageName: string;
  footerDescription: string;
  githubLabel: string;
  emailLabel: string;
  privacyLabel: string;
  termsLabel: string;
  /** First sidebar entry of a project's documentation. */
  overviewLabel: string;
}

export const siteCopy: Record<Locale, SiteCopy> = {
  'pt-BR': {
    skipLink: 'Pular para o conteúdo',
    navigationLabel: 'Navegação principal',
    navigation: {
      home: 'Início',
      projects: 'Projetos',
      docs: 'Documentação',
      learn: 'Aprender',
      blog: 'Blog',
      contact: 'Contato',
    },
    languageLabel: 'Ler em inglês',
    languageName: 'English',
    footerDescription: 'Uma equipe pequena construindo linguagens e ferramentas com atenção à leitura.',
    githubLabel: 'GitHub da Poppy Team',
    emailLabel: 'Escreva para a equipe',
    privacyLabel: 'Privacidade',
    termsLabel: 'Termos de Uso',
    overviewLabel: 'Visão geral',
  },
  en: {
    skipLink: 'Skip to content',
    navigationLabel: 'Primary navigation',
    navigation: {
      home: 'Home',
      projects: 'Projects',
      docs: 'Documentation',
      learn: 'Learn',
      blog: 'Journal',
      contact: 'Contact',
    },
    languageLabel: 'Read in Portuguese',
    languageName: 'Português',
    footerDescription: 'A small team building languages and tools with care for the reader.',
    githubLabel: 'Poppy Team on GitHub',
    emailLabel: 'Write to the team',
    privacyLabel: 'Privacy (in Portuguese)',
    termsLabel: 'Terms of Use (in Portuguese)',
    overviewLabel: 'Overview',
  },
};

export interface DocsCategoryCopy {
  slug: string;
  label: string;
  description: string;
}

/**
 * The three documentation audiences. `roadmap` covers changelog and planning;
 * `development` covers contributor and architecture material.
 */
export const docsCategories: Record<Locale, DocsCategoryCopy[]> = {
  'pt-BR': [
    {
      slug: 'guides',
      label: 'Guia de uso',
      description: 'Conceitos, primeiros passos e referência para usar o projeto.',
    },
    {
      slug: 'roadmap',
      label: 'Novidades e planos',
      description: 'Histórico de versões e o que está previsto para o futuro.',
    },
    {
      slug: 'development',
      label: 'Desenvolvimento',
      description: 'Arquitetura interna, convenções e material para quem contribui.',
    },
  ],
  en: [
    {
      slug: 'guides',
      label: 'User guide',
      description: 'Concepts, first steps, and reference for using the project.',
    },
    {
      slug: 'roadmap',
      label: 'Changelog and plans',
      description: 'Release history and what is planned next.',
    },
    {
      slug: 'development',
      label: 'Development',
      description: 'Internal architecture, conventions, and material for contributors.',
    },
  ],
};
