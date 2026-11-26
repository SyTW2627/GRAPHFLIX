import { test, expect } from './coverage';
import { loggedInUser, openFavorites, searchInSidebar } from './helpers';

test.describe('Buscar y gestionar favoritos', () => {
  test.beforeEach(async ({ page, request }) => {
    await loggedInUser(page, request);
  });

  test('buscar una película muestra resultados', async ({ page }) => {
    await searchInSidebar(page, 'Titanic');

    const resultado = page.locator('.search-item', { hasText: 'Titanic' }).first();
    await expect(resultado).toBeVisible();
    await expect(resultado).toContainText('1997');
  });

  test('una búsqueda sin coincidencias lo indica', async ({ page }) => {
    await searchInSidebar(page, 'zzzzqxw');

    await expect(page.getByText('No se encontraron películas.')).toBeVisible();
  });

  test('añadir una película a favoritos la muestra en el panel y en el resumen', async ({ page }) => {
    await searchInSidebar(page, 'Titanic');

    const sidebar = page.locator('.sidebar');
    await sidebar.getByRole('button', { name: 'Añadir Titanic a favoritos', exact: true }).click();

    // El botón pasa a "Quitar"
    await expect(sidebar.getByRole('button', { name: 'Quitar Titanic de favoritos', exact: true })).toBeVisible();

    // Resumen del sidebar
    await expect(page.locator('.summary-item', { hasText: 'Favoritas' }).locator('strong')).toHaveText('1');

    // Panel de favoritos
    await openFavorites(page);
    await expect(page.locator('.favorites').getByRole('img', { name: 'Póster de Titanic' })).toBeVisible();

    // Y el grafo deja de estar vacío
    await expect(page.getByText('Todavía no hay películas para mostrar')).toHaveCount(0);
  });

  test('quitar una favorita desde el panel la elimina', async ({ page }) => {
    await searchInSidebar(page, 'Titanic');
    await page.locator('.sidebar').getByRole('button', { name: 'Añadir Titanic a favoritos', exact: true }).click();
    await openFavorites(page);

    const panel = page.locator('.favorites');
    await panel.getByRole('button', { name: 'Quitar Titanic de favoritos' }).click();

    await expect(panel.getByText('Aún no tienes favoritas')).toBeVisible();
    await expect(page.getByText('Todavía no hay películas para mostrar')).toBeVisible();
    await expect(
      page.locator('.sidebar').getByRole('button', { name: 'Añadir Titanic a favoritos', exact: true }),
    ).toBeVisible();
  });

  test('las favoritas persisten tras recargar la página', async ({ page }) => {
    await searchInSidebar(page, 'Titanic');
    const sidebar = page.locator('.sidebar');
    await sidebar.getByRole('button', { name: 'Añadir Titanic a favoritos', exact: true }).click();
    await expect(sidebar.getByRole('button', { name: 'Quitar Titanic de favoritos', exact: true })).toBeVisible();

    await page.reload();

    await openFavorites(page);
    await expect(page.locator('.favorites').getByRole('img', { name: 'Póster de Titanic' })).toBeVisible();
  });

  test('pulsar una favorita abre el detalle de la película', async ({ page }) => {
    await searchInSidebar(page, 'Titanic');
    await page.locator('.sidebar').getByRole('button', { name: 'Añadir Titanic a favoritos', exact: true }).click();
    await openFavorites(page);

    await page.locator('.favorite-card[title="Titanic"]').click();

    await expect(page).toHaveURL(/\/pelicula\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Titanic', level: 1, exact: true })).toBeVisible();
  });
});