import { test, expect } from './coverage';
import { loggedInUser, searchInSidebar } from './helpers';

test.describe('Detalle de película', () => {
  test.beforeEach(async ({ page, request }) => {
    await loggedInUser(page, request);
  });

  test('desde el buscador se abre el detalle con sus datos', async ({ page }) => {
    await searchInSidebar(page, 'Titanic');
    await page.locator('.search-item').getByRole('link', { name: 'Titanic', exact: true }).click();

    await expect(page).toHaveURL(/\/pelicula\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Titanic', level: 1, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sinopsis' })).toBeVisible();
    await expect(page.locator('dt:has-text("Año") + dd')).toHaveText('1997');
    await expect(page.locator('dt:has-text("Director") + dd')).toHaveText('James Cameron');
  });

  test('"Volver al grafo" regresa al grafo', async ({ page }) => {
    await searchInSidebar(page, 'Titanic');
    await page.locator('.search-item').getByRole('link', { name: 'Titanic', exact: true }).click();
    await expect(page).toHaveURL(/\/pelicula\/\d+$/);

    await page.getByRole('button', { name: /Volver al grafo/ }).click();

    await expect(page).toHaveURL(/\/grafo$/);
  });

  test('un id que no existe muestra un error', async ({ page }) => {
    await page.goto('/pelicula/99999999');

    await expect(page.locator('.movie-message--error')).toBeVisible();
  });

  test('un id no numérico muestra "Película no válida"', async ({ page }) => {
    await page.goto('/pelicula/abc');

    await expect(page.getByText('Película no válida')).toBeVisible();
  });
});