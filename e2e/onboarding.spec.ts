import { test, expect } from './coverage';
import { registerViaApi, loginViaUI, logoutViaUI, openFavorites } from './helpers';

test.describe('Onboarding', () => {
  test('"Continuar" se habilita al elegir 3 películas', async ({ page, request }) => {
    const user = await registerViaApi(request);
    await loginViaUI(page, user);
    await expect(page).toHaveURL(/\/onboarding$/);

    const cards = page.locator('.movies-grid .movie-card');
    const continuar = page.getByRole('button', { name: /Continuar/ });

    await expect(cards.first()).toBeVisible();
    await expect(continuar).toBeDisabled();
    await expect(page.getByText('(0/3)')).toBeVisible();

    await cards.nth(0).click();
    await cards.nth(1).click();
    await expect(page.getByText('(2/3)')).toBeVisible();
    await expect(continuar).toBeDisabled();

    await cards.nth(2).click();
    await expect(page.getByText('Has seleccionado 3 películas.')).toBeVisible();
    await expect(continuar).toBeEnabled();
  });

  test('elegir 3 películas y continuar las guarda como favoritas', async ({ page, request }) => {
    const user = await registerViaApi(request);
    await loginViaUI(page, user);
    await expect(page).toHaveURL(/\/onboarding$/);

    const cards = page.locator('.movies-grid .movie-card');
    await expect(cards.first()).toBeVisible();

    const titulos: string[] = [];
    for (let i = 0; i < 3; i++) {
      titulos.push((await cards.nth(i).locator('h3').innerText()).trim());
      await cards.nth(i).click();
    }

    await page.getByRole('button', { name: /Continuar/ }).click();
    await expect(page).toHaveURL(/\/grafo$/);

    await openFavorites(page);
    for (const titulo of titulos) {
      await expect(page.locator('.favorites').getByRole('img', { name: `Póster de ${titulo}` })).toBeVisible();
    }
  });

  test('"Saltar" lleva al grafo vacío y el onboarding no vuelve a salir', async ({ page, request }) => {
    const user = await registerViaApi(request);
    await loginViaUI(page, user);
    await expect(page).toHaveURL(/\/onboarding$/);

    await page.getByRole('button', { name: /Saltar/ }).click();
    await expect(page).toHaveURL(/\/grafo$/);
    await expect(page.getByText('Todavía no hay películas para mostrar')).toBeVisible();

    // Cerramos sesión y volvemos a entrar: ya no debe pedir onboarding
    await logoutViaUI(page);
    await loginViaUI(page, user);
    await expect(page).toHaveURL(/\/grafo$/);
  });

  test('se puede continuar con más de 3 películas y se guardan todas', async ({ page, request }) => {
    const user = await registerViaApi(request);
    await loginViaUI(page, user);
    await expect(page).toHaveURL(/\/onboarding$/);

    const cards = page.locator('.movies-grid .movie-card');
    await expect(cards.first()).toBeVisible();

    for (let i = 0; i < 4; i++) {
      await cards.nth(i).click();
    }

    await expect(page.getByText('Has seleccionado 4 películas.')).toBeVisible();
    const continuar = page.getByRole('button', { name: /Continuar/ });
    await expect(continuar).toBeEnabled();

    await continuar.click();
    await expect(page).toHaveURL(/\/grafo$/);
  });
});