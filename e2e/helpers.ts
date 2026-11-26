import { expect, type APIRequestContext, type Page } from '@playwright/test';
import {API_URL } from './env';

export { API_URL };

export type TestUser = { nombre_usuario: string; correo: string; password: string };

let counter = 0;

/** Usuario único en cada llamada para que los tests no se pisen entre sí. */
export function newUser(): TestUser {
  const id = `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    nombre_usuario: `e2e_${id}`,
    correo: `e2e_${id}@test.com`,
    password: 'Password123!',
  };
}

/** Crea el usuario directamente por API (rápido, sin pasar por la pantalla de registro). */
export async function registerViaApi(request: APIRequestContext, user: TestUser = newUser()) {
  const res = await request.post(`${API_URL}/users/register`, { data: user });
  expect(res.status(), 'registro por API').toBe(201);
  return user;
}

export async function loginViaUI(page: Page, user: TestUser) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(user.correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
}

/** Usuario nuevo, logueado y ya en /grafo (sin favoritos). */
export async function loggedInUser(page: Page, request: APIRequestContext) {
  const user = await registerViaApi(request);
  await loginViaUI(page, user);
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole('button', { name: /Saltar/ }).click();
  await expect(page).toHaveURL(/\/grafo$/);
  return user;
}

export async function openSidebar(page: Page) {
  await page.getByRole('button', { name: 'Abrir navegación' }).click();
}

export async function openFavorites(page: Page) {
  await page.getByRole('button', { name: 'Abrir favoritos' }).click();
}

export async function searchInSidebar(page: Page, text: string) {
  await openSidebar(page);
  await page.getByPlaceholder('Buscar película...').fill(text);
}

export async function logoutViaUI(page: Page) {
  await page.getByRole('button', { name: 'Menú de usuario' }).click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
}