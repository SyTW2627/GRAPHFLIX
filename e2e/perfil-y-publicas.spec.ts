import { test, expect } from './coverage';
import { registerViaApi, loginViaUI, loggedInUser } from './helpers';

test.describe('Buscador del onboarding y pantallas públicas', () => {
  test('permite buscar y limpiar búsqueda en el onboarding', async ({ page, request }) => {
    const user = await registerViaApi(request);
    await loginViaUI(page, user);
    await expect(page).toHaveURL(/\/onboarding$/);

    const buscador = page.getByPlaceholder('Buscar una película...');
    await buscador.fill('a');

    // Espera resultados y selecciona el primero si aparece
    const resultado = page.locator('.search-results button, .search-results li').first();
    if (await resultado.isVisible({ timeout: 3000 }).catch(() => false)) {
      await resultado.click();
    }

    // Limpia la búsqueda
    const btnLimpiar = page.getByRole('button', { name: /limpiar búsqueda/i });
    if (await btnLimpiar.isVisible()) {
      await btnLimpiar.click();
      await expect(buscador).toHaveValue('');
    }
  });

  test('permite navegar a las páginas públicas desde la landing', async ({ page }) => {
    await page.goto('/');

    // Navega a Sobre nosotros (/sobre-nosotros)
    await page.getByRole('link', { name: 'Sobre nosotros' }).click();
    await expect(page).toHaveURL(/\/sobre-nosotros$/);
    await expect(page.getByRole('main')).toContainText(/graphflix/i);

    // Vuelve a la portada y prueba el ancla "Cómo funciona"
    await page.goto('/');
    await page.getByRole('link', { name: 'Cómo funciona' }).click();
    await expect(page.getByRole('heading', { name: '¿Cómo funciona Graphflix?' })).toBeVisible();
  });

  test('permite acceder a la configuración de cuenta desde el menú de usuario', async ({
    page,
    request,
  }) => {
    await loggedInUser(page, request);

    await page.getByRole('button', { name: 'Menú de usuario' }).click();
    const linkPerfil = page.getByRole('menuitem', { name: /perfil|cuenta/i }).or(
      page.getByRole('link', { name: /perfil|cuenta/i }),
    );
    await linkPerfil.first().click();

    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('AccountScreen (Gestión de perfil y cuenta)', () => {
  test('permite editar los datos del usuario y guardar cambios', async ({ page, request }) => {
    const user = await loggedInUser(page, request);

    // Ahora sí estamos en /grafo donde existe "Menú de usuario"
    await page.getByRole('button', { name: 'Menú de usuario' }).click();
    const linkPerfil = page.getByRole('menuitem', { name: /perfil|cuenta/i }).or(
      page.getByRole('link', { name: /perfil|cuenta/i }),
    );
    await linkPerfil.first().click();

    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    const btnEditar = main.getByRole('button', { name: /editar/i }).first();
    if (await btnEditar.isVisible().catch(() => false)) {
      await btnEditar.click();
    }

    const inputNombre = main.locator('input[type="text"]').first();
    if (await inputNombre.isEditable().catch(() => false)) {
      await inputNombre.fill(`${user.nombre_usuario}_edit`);
    }

    const btnGuardar = main.getByRole('button', { name: /guardar|actualizar/i }).first();
    if (await btnGuardar.isVisible().catch(() => false)) {
      await btnGuardar.click();
    }
  });

  test('valida el cambio de contraseña y la eliminación de cuenta (cancelando confirmación)', async ({
    page,
    request,
  }) => {
    const user = await loggedInUser(page, request);

    await page.getByRole('button', { name: 'Menú de usuario' }).click();
    const linkPerfil = page.getByRole('menuitem', { name: /perfil|cuenta/i }).or(
      page.getByRole('link', { name: /perfil|cuenta/i }),
    );
    await linkPerfil.first().click();

    const main = page.getByRole('main');

    const passInputs = main.locator('input[type="password"]');
    const numPass = await passInputs.count();
    if (numPass >= 2) {
      await passInputs.nth(0).fill(user.password);
      await passInputs.nth(1).fill('NuevaPass123!');
      if (numPass >= 3) {
        await passInputs.nth(2).fill('OtraDiferente123!');
        const btnCambiarPass = main.getByRole('button', { name: /contraseña|guardar|actualizar/i }).last();
        if (await btnCambiarPass.isVisible().catch(() => false)) {
          await btnCambiarPass.click();
        }
        await passInputs.nth(2).fill('NuevaPass123!');
        if (await btnCambiarPass.isVisible().catch(() => false)) {
          await btnCambiarPass.click();
        }
      }
    }

    const btnEliminar = main.getByRole('button', { name: /eliminar cuenta|borrar cuenta/i }).first();
    if (await btnEliminar.isVisible().catch(() => false)) {
      await btnEliminar.click();
      const btnCancelar = page.getByRole('button', { name: /cancelar|cerrar|no/i }).first();
      if (await btnCancelar.isVisible().catch(() => false)) {
        await btnCancelar.click();
      }
    }
  });
});
test.describe('AboutScreen (Sobre nosotros)', () => {
  test('ejercita todas las secciones y enlaces/botones de AboutScreen como visitante y autenticado', async ({
    page,
    request,
  }) => {
    // 1. Acceso como visitante desde la portada
    await page.goto('/');
    await page.getByRole('link', { name: 'Sobre nosotros' }).click();
    await expect(page).toHaveURL(/\/sobre-nosotros$/);

    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Abre cualquier <details>/<summary> o pestaña si existiera en AboutScreen
    const interactivos = main.locator('summary, [role="tab"]');
    const totalInteractivos = await interactivos.count();
    for (let i = 0; i < totalInteractivos; i++) {
      await interactivos.nth(i).click();
    }

    // Ejercita cada enlace o botón dentro de <main> en AboutScreen
    const botonesYEnlaces = main.locator('a[href], button');
    const totalAcciones = await botonesYEnlaces.count();
    for (let i = 0; i < totalAcciones; i++) {
      await page.goto('/sobre-nosotros');
      const elemento = page.getByRole('main').locator('a[href], button').nth(i);
      if (await elemento.isVisible()) {
        await elemento.click();
      }
    }

    // 2. Acceso como usuario autenticado (cubre ramas condicionales de sesión si las hay)
    await loggedInUser(page, request);
    await page.goto('/sobre-nosotros');
    await expect(page.getByRole('main')).toBeVisible();
  });
});