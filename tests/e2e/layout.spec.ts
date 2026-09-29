import { expect, test } from '@playwright/test';

/**
 * Layout separation between the editorial site and the documentation.
 *
 * These assertions exist because a VitePress migration makes it easy to put
 * the documentation chrome on editorial pages: the default theme's Layout
 * always renders a navbar, a search box and a sidebar, so a home page that
 * reuses it silently becomes a documentation page. The HTML-level suite cannot
 * catch that, because both shells emit valid, complete markup.
 */

const editorialPages = [
  { name: 'home', path: '/' },
  { name: 'home em ingles', path: '/en/' },
  { name: 'pagina de projeto', path: '/projects/ori' },
  { name: 'pagina de projeto em ingles', path: '/en/projects/aipo' },
  { name: 'caderno', path: '/blog/' },
  { name: 'artigo do caderno', path: '/blog/um-arquivo-com-origem' },
  { name: 'pagina de erro', path: '/not-found/' },
];

const documentationPages = [
  { name: 'secao de projeto', path: '/oride/docs/' },
  { name: 'categoria', path: '/oride/docs/guides/' },
  { name: 'pagina de documentacao', path: '/oride/docs/guides/user-guide' },
  { name: 'documentacao em ingles', path: '/en/prumo/docs/' },
];

test.describe('paginas editoriais nao herdam chrome de documentacao', () => {
  for (const page of editorialPages) {
    test(`${page.name} nao tem barra lateral de documentacao`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);

      await expect(browserPage.locator('.VPSidebar')).toBeHidden();
      await expect(browserPage.locator('.VPNavBar')).toBeHidden();
    });

    test(`${page.name} nao tem a barra de busca de documentacao`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);

      await expect(browserPage.locator('.VPNavBar')).toBeHidden();
      await expect(browserPage.locator('#local-search')).toBeHidden();
    });

    test(`${page.name} nao tem o seletor de projeto`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);

      await expect(browserPage.locator('.project-switch')).toBeHidden();
    });
  }
});

test.describe('paginas de documentacao tem o chrome de documentacao', () => {
  for (const page of documentationPages) {
    test(`${page.name} tem barra lateral e busca`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);

      await expect(browserPage.locator('.VPSidebar').first()).toBeAttached();
      await expect(browserPage.locator('#local-search')).toBeAttached();
    });

    test(`${page.name} tem o seletor de projeto`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);

      await expect(browserPage.locator('.project-switch__link')).toHaveCount(4);
    });
  }
});

test.describe('a home nao parece uma pagina de documentacao', () => {
  test('a home abre com o titulo editorial, nao com a barra de docs', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('h1').first();

    await expect(heading).toHaveText(/Ideias que continuam legíveis\./u);
  });

  test('a home nao repete o titulo em duas camadas sobrepostas', async ({ page }) => {
    await page.goto('/');

    // A regressão que motivou esta suíte renderizava o h1 duas vezes, uma
    // abaixo da outra, com o texto sobreposto.
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('o titulo da home nao esta sobreposto ao texto seguinte', async ({ page }) => {
    await page.goto('/');

    const boxes = await page.locator('h1, .hero__intro').evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();

        return { top: rect.top, bottom: rect.bottom };
      }),
    );

    expect(boxes.length).toBeGreaterThanOrEqual(2);

    for (let index = 1; index < boxes.length; index += 1) {
      const previous = boxes[index - 1]!;
      const current = boxes[index]!;

      // Uma sobreposição real faria o topo do elemento seguinte ficar acima do
      // fim do anterior.
      expect(
        current.top,
        'elementos do hero se sobrepõem',
      ).toBeGreaterThanOrEqual(previous.bottom - 1);
    }
  });

  test('a largura do conteudo nao e comprimida pela barra lateral', async ({ page }) => {
    await page.goto('/');

    const content = page.locator('.VPContent');
    const width = await content.evaluate((element) => element.getBoundingClientRect().width);
    const viewport = page.viewportSize()?.width ?? 0;

    // Com a barra lateral presente, o conteudo principal ficava estreito e
    // deslocado para a direita.
    expect(width).toBeGreaterThan(viewport * 0.8);
  });
});

test.describe('badge e amostra de saida', () => {
  // The badge belongs to the featured cards; the secondary list carries the
  // name and category instead, so it has no room for a status line.
  for (const slug of ['ori', 'aipo']) {
    test(`${slug} mostra o badge de status no card de destaque`, async ({ page }) => {
      await page.goto('/');
      const badge = page.locator(`.project-feature--${slug} .project-badge`);

      // The badge carries a stage and a positioning, and must be readable
      // rather than decorative.
      await expect(badge).toBeVisible();
      await expect(badge.locator('.project-badge__stage')).toHaveText(/^S\d$/u);
      await expect(badge.locator('.project-badge__text').first()).not.toBeEmpty();
    });
  }

  for (const slug of ['ori', 'aipo', 'oride', 'prumo']) {
    test(`${slug} mostra o badge na pagina do projeto`, async ({ page }) => {
      await page.goto(`/projects/${slug}`);

      await expect(page.locator('.project-badge')).toBeVisible();
    });

    test(`${slug} mostra a saida da amostra`, async ({ page }) => {
      await page.goto(`/projects/${slug}`);
      const output = page.locator('.code-plate__output');

      await expect(output).toBeVisible();
      await expect(output).not.toBeEmpty();
    });
  }

  test('a saida da amostra e marcada como ilustrativa', async ({ page }) => {
    await page.goto('/projects/ori');

    // The line under the code is typed output, but nothing runs in the
    // browser; the page has to say so.
    const note = page.locator('.project-page__note');
    await expect(note).toContainText(/não compila nem executa|does not compile or run/u);
  });
});

test.describe('destaque dos projetos na home', () => {
  const featured = ['ori', 'aipo'];
  const secondary = ['oride', 'prumo'];

  for (const slug of [...featured, ...secondary]) {
    test(`${slug} tem o nome visivel na home`, async ({ page }) => {
      await page.goto('/');

      const name = await page.locator(`.secondary-project__name, .project-feature__title`)
        .filter({ hasText: new RegExp(`^${slug === 'ori' ? 'Ori' : slug === 'aipo' ? 'Aipo' : slug === 'oride' ? 'Oride' : 'Prumo'}$`, 'u') })
        .count();

      expect(name, `${slug} deveria ter o nome visível na home`).toBeGreaterThan(0);
    });
  }

  for (const slug of featured) {
    test(`${slug} tem um card de destaque com area propria`, async ({ page }) => {
      await page.goto('/');

      const card = page.locator(`.project-feature--${slug}`);
      const box = await card.boundingBox();

      // Um destaque espremido numa faixa de lista não comunica的项目 importance,
      // and a card that carries no colour reads as a generic panel.
      expect(box!.height, `${slug} deveria ter altura de destaque`).toBeGreaterThan(220);
      expect(box!.width, `${slug} deveria ter largura de destaque`).toBeGreaterThan(300);
    });
  }

  test('os cartoes de destaque tem planos de cor distintos', async ({ page }) => {
    await page.goto('/');

    const ori = await page.locator('.project-feature--ori').evaluate((el) => getComputedStyle(el).backgroundColor);
    const aipo = await page.locator('.project-feature--aipo').evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(ori).not.toBe(aipo);
  });

  test('a home destaca exatamente os dois projetos principais', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.project-feature')).toHaveCount(2);
    await expect(page.locator('.secondary-project')).toHaveCount(2);
  });
});

test.describe('chrome em telas estreitas', () => {
  test('a documentacao nao empilha dois cabecarios no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/oride/docs/');

    // A navbar da documentacao ja carrega o nome e o comutador de idioma, entao
    // o cabecario da marca e oculto nessa faixa e a pagina comeca pela navbar.
    await expect(page.locator('.site-header')).toBeHidden();

    const [chrome, docsNavbar] = await Promise.all([
      page.locator('.project-switch').boundingBox(),
      page.locator('.VPNavBar').boundingBox(),
    ]);

    expect(chrome, 'o chrome do site deveria estar no fim da pagina').not.toBeNull();
    expect(docsNavbar, 'a navbar de documentacao deveria estar no topo').not.toBeNull();
    expect(chrome!.y).toBeGreaterThan(docsNavbar!.y);
  });

  test('a home nao repete cabecalho no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('.VPNavBar')).toBeHidden();
  });

  test('o contraste do texto sobrevive ao tema escuro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const results = await page.evaluate(() => {
      const out: { selector: string; ratio: number }[] = [];

      for (const selector of ['.closing-note', '.project-feature__summary', '.secondary-project__summary']) {
        const element = document.querySelector(selector) as HTMLElement | null;

        if (!element) {
          continue;
        }

        const parse = (value: string): number[] => {
          const parts = (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);

          return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
        };
        const luminance = (rgb: number[]) => {
          const linear = rgb.map((channel) => {
            const c = (channel ?? 0) / 255;

            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });

          return (
            0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0)
          );
        };
        const fg = luminance(parse(getComputedStyle(element).color));
        let bg = 1;
        let node: HTMLElement | null = element;

        while (node) {
          const background = getComputedStyle(node).backgroundColor;

          if (background && !background.includes('rgba(0, 0, 0, 0)')) {
            bg = luminance(parse(background));
            break;
          }

          node = node.parentElement;
        }

        const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);

        out.push({ selector, ratio: Math.round(ratio * 100) / 100 });
      }

      return out;
    });

    for (const { selector, ratio } of results) {
      // WCAG 2.1 AA para texto normal.
      expect(ratio, `contraste insuficiente em ${selector}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

test.describe('identidade visual por projeto', () => {
  const projects = ['ori', 'aipo', 'oride', 'prumo'];

  for (const project of projects) {
    test(`${project} aplica sua identidade na pagina de documentacao`, async ({ page }) => {
      await page.goto(`/${project}/docs/`);

      await expect(page.locator('html')).toHaveAttribute('data-project', project);
    });
  }

  test('a identidade e aplicada tambem em tema escuro', async ({ page }) => {
    await page.goto('/oride/docs/');
    await page.evaluate(() => document.documentElement.classList.add('dark'));

    await expect(page.locator('html')).toHaveAttribute('data-project', 'oride');
  });
});

test.describe('navegacao por teclado', () => {
  test('o link de pulo leva ao conteudo principal', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');

    const skipLink = page.locator('.skip-link');

    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test('o conteudo principal e o alvo do link de pulo', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main-content');
    await expect(page.locator('#VPContent')).toHaveCount(1);
  });

  test('os links de navegacao recebem foco visivel', async ({ page }) => {
    await page.goto('/');

    const link = page.locator('.site-nav__link').first();
    await link.focus();

    const outline = await link.evaluate((element) => {
      const style = getComputedStyle(element);

      return style.outlineStyle;
    });

    expect(outline).not.toBe('none');
  });
});

test.describe('responsividade', () => {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 850, height: 1024 },
    { name: 'celular', width: 390, height: 844 },
  ]) {
    test(`a home nao rola horizontalmente em ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );

      expect(overflow).toBeLessThanOrEqual(1);
    });

    test(`a documentacao nao rola horizontalmente em ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/oride/docs/guides/user-guide');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );

      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});

test.describe('navegacao da documentacao', () => {
  test('o pager leva a pagina anterior e a proxima do mesmo projeto', async ({ page }) => {
    await page.goto('/aipo/docs/guides/getting-started/installation');

    // O pager era derivado de uma barra lateral com todos os projetos e links
    // com barra final, entao nenhuma pagina era reconhecida como ativa e o
    // "proxima" sempre levava ao primeiro projeto da lista.
    await expect(page.locator('.pager-link.prev')).toHaveAttribute(
      'href',
      /\/aipo\/docs\/guides\/getting-started\/what-is-aipo/u,
    );
    await expect(page.locator('.pager-link.next')).toHaveAttribute(
      'href',
      /\/aipo\/docs\/guides\/getting-started\/first-program/u,
    );

    await page.locator('.pager-link.next').click();
    await expect(page).toHaveURL(/first-program/u);
    await expect(page.locator('.pager-link.prev')).toHaveAttribute('href', /installation/u);
  });

  test('a barra lateral marca a pagina atual e mostra so o projeto aberto', async ({ page }) => {
    await page.goto('/aipo/docs/guides/getting-started/installation');

    await expect(page.locator('.VPSidebarItem.is-active')).toHaveCount(1);
    await expect(page.locator('.VPSidebar a[href*="/ori/docs/"]')).toHaveCount(0);
  });
});

test.describe('cards clicaveis na home', () => {
  for (const slug of ['ori', 'aipo']) {
    test(`o card de ${slug} inteiro abre a pagina do projeto`, async ({ page }) => {
      await page.goto('/');
      // A point on the card away from its title: the title link's hit area
      // covers the whole card.
      await page.locator(`.project-feature--${slug}`).click({ position: { x: 24, y: 220 } });

      await expect(page).toHaveURL(new RegExp(`/projects/${slug}`, 'u'));
    });
  }

  test('o link de documentacao do card continua sendo seu proprio destino', async ({ page }) => {
    await page.goto('/');
    await page.locator('.project-feature--aipo .project-feature__docs').click();

    await expect(page).toHaveURL(/\/aipo\/docs\//u);
  });
});
