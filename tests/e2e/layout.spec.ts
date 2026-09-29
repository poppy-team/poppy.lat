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
  { name: 'indice de documentacao', path: '/docs/' },
  { name: 'secao de projeto', path: '/docs/oride/' },
  { name: 'categoria', path: '/docs/oride/guides/' },
  { name: 'pagina de documentacao', path: '/docs/oride/guides/user-guide' },
  { name: 'documentacao em ingles', path: '/en/docs/prumo/' },
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

test.describe('chrome em telas estreitas', () => {
  test('a documentacao nao empilha dois cabecarios no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/docs/oride/');

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
      await page.goto(`/docs/${project}/`);

      await expect(page.locator('html')).toHaveAttribute('data-project', project);
    });
  }

  test('a identidade e aplicada tambem em tema escuro', async ({ page }) => {
    await page.goto('/docs/oride/');
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
      await page.goto('/docs/oride/guides/user-guide');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );

      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
