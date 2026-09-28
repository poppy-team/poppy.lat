import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const siteOrigin = process.env.SITE_ORIGIN;

export default defineConfig({
  ...(siteOrigin ? { site: siteOrigin } : {}),
  output: 'static',
  markdown: {
    shikiConfig: {
      langAlias: {
        aipo: 'plaintext',
        ori: 'plaintext',
      },
    },
  },
  integrations: [
    starlight({
      title: 'Poppy Team — Documentação',
      logo: {
        light: './src/assets/poppy-logo.svg',
        dark: './src/assets/poppy-logo-dark.svg',
        alt: 'Poppy Team',
      },
      disable404Route: true,
      description: 'Documentação pública selecionada dos projetos Poppy Team.',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'Português',
          lang: 'pt-BR',
        },
        en: {
          label: 'English',
          lang: 'en',
        },
      },
      sidebar: [
        {
          label: 'Ori',
          items: [{ autogenerate: { directory: 'docs/ori' } }],
        },
        {
          label: 'Aipo',
          items: [{ autogenerate: { directory: 'docs/aipo' } }],
        },
      ],
      social: [
        {
          icon: 'github',
          label: 'Poppy Team no GitHub',
          href: 'https://github.com/poppy-team',
        },
      ],
      customCss: ['./src/styles/docs.css'],
    }),
  ],
});
