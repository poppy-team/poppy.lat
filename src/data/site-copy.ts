import type { Locale } from './projects';

export interface SiteCopy {
  skipLink: string;
  navigationLabel: string;
  navigation: {
    home: string;
    projects: string;
    docs: string;
    blog: string;
    contact: string;
  };
  languageLabel: string;
  footerDescription: string;
  githubLabel: string;
  emailLabel: string;
}

export const siteCopy: Record<Locale, SiteCopy> = {
  'pt-BR': {
    skipLink: 'Pular para o conteúdo',
    navigationLabel: 'Navegação principal',
    navigation: {
      home: 'Início',
      projects: 'Projetos',
      docs: 'Documentação',
      blog: 'Caderno',
      contact: 'Contato',
    },
    languageLabel: 'Read in English',
    footerDescription: 'Uma equipe pequena construindo linguagens e ferramentas com atenção à leitura.',
    githubLabel: 'GitHub da Poppy Team',
    emailLabel: 'Escreva para a equipe',
  },
  en: {
    skipLink: 'Skip to content',
    navigationLabel: 'Primary navigation',
    navigation: {
      home: 'Home',
      projects: 'Projects',
      docs: 'Documentation',
      blog: 'Journal',
      contact: 'Contact',
    },
    languageLabel: 'Ler em português',
    footerDescription: 'A small team building languages and tools with care for the reader.',
    githubLabel: 'Poppy Team on GitHub',
    emailLabel: 'Write to the team',
  },
};
