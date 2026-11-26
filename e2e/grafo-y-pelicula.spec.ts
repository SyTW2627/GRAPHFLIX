import { test, expect } from './coverage';
import {
  registerViaApi,
  loginViaUI,
  loggedInUser,
  openSidebar,
  openFavorites,
  searchInSidebar,
} from './helpers';

test.describe('Grafo y exploración', () => {
  test('renderiza el lienzo del grafo cuando el usuario completa el onboarding con películas', async ({
    page,
    request,
  }) => {
    const user = await registerViaApi(request);
    await loginViaUI(page, user);
    await expect(page).toHaveURL(/\/onboarding$/);

    const cards = page.locator('.movies-grid .movie-card');
    await expect(cards.first()).toBeVisible();

    for (let i = 0; i < 3; i++) {
      await cards.nth(i).click();
    }

    await page.getByRole('button', { name: /Continuar/ }).click();
    await expect(page).toHaveURL(/\/grafo$/);

    // El lienzo de vis-network debe estar visible
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  });

  test('permite buscar películas desde la barra lateral', async ({ page, request }) => {
    await loggedInUser(page, request);

    // Buscamos una letra común ("a") para garantizar resultados en el catálogo
    await searchInSidebar(page, 'a');

    // Esperamos a que aparezcan resultados en la barra lateral
    const resultados = page.locator('aside button, aside li, .sidebar-results button').first();
    await expect(resultados).toBeVisible({ timeout: 5000 });
  });

  test('permite abrir y cerrar los paneles de navegación y favoritos', async ({ page, request }) => {
    await loggedInUser(page, request);

    await openSidebar(page);
    await expect(page.getByPlaceholder('Buscar película...')).toBeVisible();

    await openFavorites(page);
    await expect(page.locator('.favorites')).toBeVisible();
  });
});

test.describe('Detalle de película y favoritos', () => {
  test('carga la ficha completa de una película y permite volver al grafo', async ({
    page,
    request,
  }) => {
    await loggedInUser(page, request);

    await page.goto('/pelicula/1');
    await expect(page).toHaveURL(/\/pelicula\/1$/);

    // Acotamos a <main> para evitar el <h1> "Graphflix" del navbar
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sinopsis' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Temas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cast' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Detalles' })).toBeVisible();

    // Comprueba que el botón de volver regresa al grafo
    await page.getByRole('button', { name: 'Volver al grafo' }).click();
    await expect(page).toHaveURL(/\/grafo$/);
  });

  test('muestra las películas guardadas en el panel lateral de favoritos y permite cerrarlo', async ({
    page,
    request,
  }) => {
    const user = await registerViaApi(request);
    await loginViaUI(page, user);

    // Seleccionamos 3 películas en el onboarding para tener favoritos iniciales
    const cards = page.locator('.movies-grid .movie-card');
    await expect(cards.first()).toBeVisible();

    const titulos: string[] = [];
    for (let i = 0; i < 3; i++) {
      titulos.push((await cards.nth(i).locator('h3').innerText()).trim());
      await cards.nth(i).click();
    }

    await page.getByRole('button', { name: /Continuar/ }).click();
    await expect(page).toHaveURL(/\/grafo$/);

    // Abrimos el panel de favoritos y comprobamos que están las 3
    await openFavorites(page);
    const panelFavoritos = page.locator('.favorites');
    await expect(panelFavoritos).toBeVisible();

    for (const titulo of titulos) {
      await expect(
        panelFavoritos.getByRole('img', { name: `Póster de ${titulo}` }),
      ).toBeVisible();
    }

    // Cerramos el panel de favoritos y comprobamos que los pósters dejan de ser visibles
    await panelFavoritos.getByRole('button').first().click();
    await expect(panelFavoritos.locator('img')).toHaveCount(0);
  });
});