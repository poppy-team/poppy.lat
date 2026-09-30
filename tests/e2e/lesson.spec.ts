import { expect, test } from '@playwright/test';

/**
 * The lesson pages: reading preferences, focus mode, the code wrap button and
 * the phone layout. The preference tests exist because the watchers that
 * applied and saved them used to belong to the first component that mounted,
 * so they worked on a fresh load and silently stopped after the first
 * client-side navigation, which is how readers actually move through lessons.
 */

const lesson = '/aprender/pensar-em-codigo/primeiro-programa/ola';

async function openLessonFromLanding(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/aprender/');
  await page.locator(`a[href$="${lesson}"]:visible`).first().click();
  await expect(page).toHaveURL(new RegExp(`${lesson}$`, 'u'));
  await expect(page.locator('.lesson-head')).toBeVisible();
}

test.describe('preferencias de leitura', () => {
  test('o modo foco funciona depois de navegar pelo site', async ({ page }) => {
    await openLessonFromLanding(page);
    await page.getByRole('button', { name: 'Modo foco' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-reading-focus', 'true');
    await expect(page.getByRole('button', { name: 'Sair do modo foco' }).last()).toBeVisible();
  });

  test('o tamanho do texto muda e continua depois de recarregar', async ({ page }) => {
    await openLessonFromLanding(page);
    await page.getByRole('button', { name: 'Leitura' }).click();
    await page.getByLabel('Maior').check();

    await expect(page.locator('html')).toHaveAttribute('data-reading-size', 'larger');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-reading-size', 'larger');
  });

  test('o painel de leitura flutua e fecha com Escape', async ({ page }) => {
    await page.goto(lesson);

    const toggle = page.getByRole('button', { name: 'Leitura' });
    const before = await page.locator('.vp-doc h1').first().boundingBox();

    await toggle.click();
    await expect(page.locator('#reading-tools-panel')).toBeVisible();
    expect((await page.locator('.vp-doc h1').first().boundingBox())!.y).toBe(before!.y);

    await page.keyboard.press('Escape');
    await expect(page.locator('#reading-tools-panel')).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});

test.describe('estrutura propria das aulas', () => {
  test('a aula nao usa a barra lateral nem o menu da documentacao', async ({ page }) => {
    await page.goto(lesson);

    await expect(page.locator('.lesson-top')).toBeVisible();
    await expect(page.locator('.VPNav')).toBeHidden();
    await expect(page.locator('.VPSidebar')).toBeHidden();
    await expect(page.locator('.VPDoc .aside')).toBeHidden();
  });

  test('o painel de conteudo abre, marca a licao atual e fecha com Escape', async ({ page }) => {
    await page.goto(lesson);

    const open = page.getByRole('button', { name: 'Conteúdo' });
    await open.click();

    const panel = page.getByRole('dialog', { name: 'Conteúdo dos cursos' });
    await expect(panel).toBeVisible();
    await expect(panel.locator('a[aria-current="page"]')).toHaveText(/Seu primeiro programa/u);
    await expect(panel.getByText('Várias linhas de texto')).toContainText('em breve');

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(open).toBeFocused();
  });

  test('o painel mantem o foco dentro dele enquanto esta aberto', async ({ page }) => {
    await page.goto(lesson);
    await page.getByRole('button', { name: 'Conteúdo' }).click();

    for (let step = 0; step < 40; step += 1) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('#course-outline')))).toBe(true);
    }
  });

  test('o fim da aula mostra o caminho para seguir', async ({ page }) => {
    await page.goto(lesson);

    await expect(page.locator('.lesson-pager a')).toHaveCount(1);
    await expect(page.locator('.lesson-steps li')).toHaveCount(4);
  });

  test('no celular a barra da aula cabe na tela e o painel cobre a barra de abas', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(lesson);
    await page.getByRole('button', { name: 'Conteúdo' }).click();

    const panel = page.locator('#course-outline');
    await expect(panel).toBeVisible();

    const covered = await page.evaluate(() => {
      const tabs = document.querySelector('.tabbar')!.getBoundingClientRect();
      const hit = document.elementFromPoint(tabs.x + tabs.width / 2, tabs.y + tabs.height / 2);

      return Boolean(hit?.closest('#course-outline, .outline-backdrop'));
    });

    expect(covered).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

test.describe('codigo', () => {
  test('o botao de quebra de linha vale para todos os blocos e fica salvo', async ({ page }) => {
    await page.goto(lesson);

    const button = page.locator('.vp-doc .code-wrap').first();
    await button.scrollIntoViewIfNeeded();
    await expect(button).toHaveAttribute('aria-pressed', 'false');

    await button.click({ force: true });
    await expect(page.locator('html')).toHaveAttribute('data-code-wrap', 'true');
    await expect(page.locator('.vp-doc .code-wrap').last()).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-code-wrap', 'true');
  });
});

test.describe('celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  for (const path of ['/', '/aprender/', lesson, '/blog/']) {
    test(`${path} tem a barra de abas e nao rola para o lado`, async ({ page }) => {
      await page.goto(path);

      const tabs = page.locator('.tabbar');
      await expect(tabs).toBeVisible();
      await expect(tabs.locator('a')).toHaveCount(5);

      const box = await tabs.boundingBox();
      expect(box!.y + box!.height).toBeCloseTo(844, 0);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('a aba da secao atual esta marcada', async ({ page }) => {
    await page.goto(lesson);

    await expect(page.locator('.tabbar [aria-current="page"]')).toHaveText('Aprender');
  });

  test('o modo foco esconde a barra de abas', async ({ page }) => {
    await page.goto(lesson);
    await page.getByRole('button', { name: 'Modo foco' }).click();

    await expect(page.locator('.tabbar')).toBeHidden();
  });

  test('a barra de abas some em telas largas', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('/');

    await expect(page.locator('.tabbar')).toBeHidden();
  });
});
