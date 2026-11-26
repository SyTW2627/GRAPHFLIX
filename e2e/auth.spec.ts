import { test, expect } from './coverage';
import {
  API_URL,
  newUser,
  registerViaApi,
  loginViaUI,
  loggedInUser,
  logoutViaUI,
} from './helpers';

test.describe('Registro', () => {
  test('un usuario nuevo se registra y puede iniciar sesión (va al onboarding)', async ({ page }) => {
    const user = newUser();

    await page.goto('/register');
    await page.getByLabel('Nombre de usuario').fill(user.nombre_usuario);
    await page.getByLabel('Correo electrónico').fill(user.correo);
    await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
    await page.getByLabel('Confirmar contraseña').fill(user.password);
    await page.getByRole('button', { name: 'Registrarse' }).click();

    // Tras registrarse la app te lleva a /login
    await expect(page).toHaveURL(/\/login$/);

    // Con esas credenciales puede entrar y, al ser nuevo, va al onboarding
    await loginViaUI(page, user);
    await expect(page).toHaveURL(/\/onboarding$/);
  });

  test('si las contraseñas no coinciden muestra error y no registra', async ({ page }) => {
    const user = newUser();

    await page.goto('/register');
    await page.getByLabel('Nombre de usuario').fill(user.nombre_usuario);
    await page.getByLabel('Correo electrónico').fill(user.correo);
    await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
    await page.getByLabel('Confirmar contraseña').fill('OtraDistinta123!');
    await page.getByRole('button', { name: 'Registrarse' }).click();

    await expect(page.locator('.error-message')).toContainText('Las contraseñas no coinciden');
    await expect(page).toHaveURL(/\/register$/);
  });

  test('un correo ya registrado muestra un error', async ({ page, request }) => {
    const existing = await registerViaApi(request);

    await page.goto('/register');
    await page.getByLabel('Nombre de usuario').fill(newUser().nombre_usuario);
    await page.getByLabel('Correo electrónico').fill(existing.correo);
    await page.getByLabel('Contraseña', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar contraseña').fill('Password123!');
    await page.getByRole('button', { name: 'Registrarse' }).click();

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).not.toHaveText(/failed to fetch/i);
    await expect(page).toHaveURL(/\/register$/);
  });
});

test.describe('Login y sesión', () => {
  test('con contraseña incorrecta muestra error y no entra', async ({ page, request }) => {
    const user = await registerViaApi(request);

    await loginViaUI(page, { ...user, password: 'incorrecta123' });

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).not.toHaveText(/failed to fetch/i);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('un usuario con onboarding completado entra directamente a /grafo', async ({ page, request }) => {
    // loggedInUser crea el usuario, marca onboarding como completado e inicia sesión
    const user = await loggedInUser(page, request);
    await logoutViaUI(page);

    await loginViaUI(page, user);
    await expect(page).toHaveURL(/\/grafo$/);
  });

  test('las pantallas privadas redirigen a /login si no hay sesión', async ({ page }) => {
    for (const ruta of ['/grafo', '/onboarding', '/pelicula/1']) {
      await page.goto(ruta);
      await expect(page, `ruta ${ruta}`).toHaveURL(/\/login$/);
    }
  });

  test('la sesión se mantiene al recargar la página', async ({ page, request }) => {
    await loggedInUser(page, request);

    await page.reload();

    await expect(page).toHaveURL(/\/grafo$/);
    await expect(page.getByRole('button', { name: 'Menú de usuario' })).toBeVisible();
  });

  test('cerrar sesión borra la sesión y bloquea /grafo', async ({ page, request }) => {
    await loggedInUser(page, request);

    await logoutViaUI(page);
    await expect(page).toHaveURL(/\/$/);

    // La cookie del servidor también se ha eliminado
    const res = await page.request.get(`${API_URL}/favorites/1`);
    expect(res.status()).toBe(401);

    await page.goto('/grafo');
    await expect(page).toHaveURL(/\/login$/);
  });
});