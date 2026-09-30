import { expect, test } from '@playwright/test';

/**
 * The language a reader picks with the switch is kept: later pages and later
 * visits open in it, including a page reached from a link in the other one.
 */

test.describe('idioma escolhido permanece', () => {
  test('a escolha do interruptor vale para as paginas seguintes', async ({ page }) => {
    await page.goto('/oride/docs/guides/user-guide');
    await page.locator('.language-switch:visible').click();
    await expect(page).toHaveURL(/\/en\/oride\/docs\//u);

    // A link in Portuguese, such as one shared by someone else, opens in English.
    await page.goto('/blog/');
    await expect(page).toHaveURL(/\/en\/blog\/$/u);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('a escolha sobrevive a uma nova visita ao inicio do site', async ({ page }) => {
    await page.goto('/');
    await page.locator('.language-switch:visible').click();
    await expect(page).toHaveURL(/\/en\/$/u);

    await page.goto('/');
    await expect(page).toHaveURL(/\/en\/$/u);
  });

  test('voltar ao portugues tambem e lembrado', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('.language-switch:visible').click();
    await expect(page).toHaveURL(/\/$/u);
    await expect(page).not.toHaveURL(/\/en\//u);

    await page.goto('/en/blog/');
    await expect(page).toHaveURL(/\/blog\/$/u);
    await expect(page).not.toHaveURL(/\/en\//u);
  });

  test('sem escolha nenhuma, cada pagina abre no proprio idioma', async ({ page }) => {
    await page.goto('/en/blog/');
    await expect(page).toHaveURL(/\/en\/blog\/$/u);

    await page.goto('/blog/');
    await expect(page).toHaveURL(/\/blog\/$/u);
    await expect(page).not.toHaveURL(/\/en\//u);
  });
});
