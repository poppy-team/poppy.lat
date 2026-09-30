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
  await expect(page.locator('.lesson-bar')).toBeVisible();
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
