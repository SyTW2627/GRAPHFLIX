import { test, expect } from '@playwright/test';
import { API_URL } from './helpers';

// Smoke tests de la API real: sin navegador, para detectar rápido si el entorno está roto.
test.describe('API (smoke)', () => {
  test('GET / responde', async ({ request }) => {
    const res = await request.get(`${API_URL}/`);
    expect(res.ok()).toBeTruthy();
    expect(await res.text()).toContain('Graphflix API funcionando');
  });

  test('GET /movies/popular devuelve el catálogo sembrado', async ({ request }) => {
    const res = await request.get(`${API_URL}/movies/popular?limit=12`);
    expect(res.status()).toBe(200);
    const movies = await res.json();
    expect(movies).toHaveLength(12);
    expect(movies[0]).toHaveProperty('titulo');
  });

  test('GET /movies/search encuentra Titanic', async ({ request }) => {
    const res = await request.get(`${API_URL}/movies/search?q=Titanic`);
    expect(res.status()).toBe(200);
    const movies = await res.json();
    expect(movies.some((m: { titulo: string }) => m.titulo === 'Titanic')).toBe(true);
  });

  test('un endpoint protegido sin sesión devuelve 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/favorites/1`);
    expect(res.status()).toBe(401);
  });
});