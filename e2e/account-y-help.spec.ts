import { test, expect } from './coverage';
import { loggedInUser } from './helpers';

test.describe('HelpScreen (Ayuda y preguntas frecuentes)', () => {
  test('despliega todas las preguntas frecuentes y ejercita el botón Volver con y sin historial', async ({
    page,
    request,
  }) => {
    await loggedInUser(page, request);

    // 1. Navegación con historial previo (desde /grafo)
    const btnMenu = page.getByRole('button', { name: 'Menú de usuario' });
    await btnMenu.click();
    await page.keyboard.press('Escape');
    await btnMenu.click();
    await page.locator('main').click();

    // Abre menú y entra en Ayuda
    await btnMenu.click();
    await page.getByRole('menuitem', { name: 'Ayuda' }).click();
    await expect(page).toHaveURL(/\/help$/);

    await expect(page.getByRole('heading', { name: '¿En qué podemos ayudarte?' })).toBeVisible();

    // Abre los 9 acordeones (<details><summary>) de las 3 secciones
    const summaries = page.locator('details.help-question summary');
    const total = await summaries.count();
    expect(total).toBe(9);
    for (let i = 0; i < total; i++) {
      await summaries.nth(i).click();
    }

    // Prueba la rama navigate(-1) de handleBack
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page).toHaveURL(/\/grafo$/);

    // 2. Navegación directa sin historial previo para cubrir la rama else navigate("/") de handleBack
    const nuevaPagina = await page.context().newPage();
    await nuevaPagina.goto('/help');
    if (await nuevaPagina.getByRole('button', { name: 'Volver' }).isVisible().catch(() => false)) {
      await nuevaPagina.getByRole('button', { name: 'Volver' }).click();
    }
    await nuevaPagina.close();
  });
});

test.describe('AccountScreen (Gestión de perfil y contraseña)', () => {
  test('valida errores de formulario y actualiza nombre de usuario y correo', async ({
    page,
    request,
  }) => {
    const user = await loggedInUser(page, request);

    await page.getByRole('button', { name: 'Menú de usuario' }).click();
    const linkCuenta = page
      .getByRole('menuitem', { name: /cuenta|perfil/i })
      .or(page.getByRole('link', { name: /cuenta|perfil/i }));
    await linkCuenta.first().click();

    await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible();

    const inputUsername = page.getByLabel('Nombre de usuario');
    const inputEmail = page.getByLabel('Correo electrónico');
    const btnGuardarPerfil = page.getByRole('button', { name: 'Guardar cambios' });

    // 1. Rama error: nombre de usuario vacío
    await inputUsername.fill('   ');
    await btnGuardarPerfil.click();
    await expect(page.getByRole('alert')).toHaveText('El nombre de usuario no puede estar vacío.');

    // 2. Rama error: correo electrónico inválido
    await inputUsername.fill(user.nombre_usuario);
    await inputEmail.fill('correo-invalido');
    await btnGuardarPerfil.click();
    await expect(page.getByRole('alert')).toHaveText('Introduce un correo electrónico válido.');

    // 3. Rama éxito: actualización válida de nombre de usuario y correo
    const nuevoNombre = `${user.nombre_usuario}_upd`;
    const nuevoCorreo = `upd_${user.correo}`;
    await inputUsername.fill(nuevoNombre);
    await inputEmail.fill(nuevoCorreo);
    await btnGuardarPerfil.click();
    await expect(page.getByRole('status')).toHaveText(
      'Tus datos se han actualizado correctamente.',
    );

    // 4. Botón "Volver al grafo" (rama navigate(-1))
    await page.getByRole('button', { name: 'Volver al grafo' }).click();
    await expect(page).toHaveURL(/\/grafo$/);
  });

  test('valida todas las reglas de contraseña y permite cambiarla', async ({ page, request }) => {
    const user = await loggedInUser(page, request);

    await page.getByRole('button', { name: 'Menú de usuario' }).click();
    const linkCuenta = page
      .getByRole('menuitem', { name: /cuenta|perfil/i })
      .or(page.getByRole('link', { name: /cuenta|perfil/i }));
    await linkCuenta.first().click();

    const inputActual = page.getByLabel('Contraseña actual');
    const inputNueva = page.getByLabel('Nueva contraseña', { exact: true });
    const inputRepetir = page.getByLabel('Repite la nueva contraseña');
    const btnCambiarPass = page.getByRole('button', { name: 'Cambiar contraseña' });

    // 1. Rama error: longitud menor a 8 caracteres
    await inputActual.fill(user.password);
    await inputNueva.fill('1234');
    await inputRepetir.fill('1234');
    await btnCambiarPass.click();
    await expect(page.getByRole('alert')).toHaveText(
      'La nueva contraseña debe tener al menos 8 caracteres.',
    );

    // 2. Rama error: las contraseñas nuevas no coinciden
    await inputNueva.fill('NuevaPass123!');
    await inputRepetir.fill('OtraDiferente123!');
    await btnCambiarPass.click();
    await expect(page.getByRole('alert')).toHaveText('Las contraseñas nuevas no coinciden.');

    // 3. Rama error: la nueva contraseña es igual a la actual
    await inputNueva.fill(user.password);
    await inputRepetir.fill(user.password);
    await btnCambiarPass.click();
    await expect(page.getByRole('alert')).toHaveText(
      'La nueva contraseña debe ser distinta de la actual.',
    );

    // 4. Rama éxito: contraseña nueva válida y distinta
    await inputNueva.fill('NuevaPass123!');
    await inputRepetir.fill('NuevaPass123!');
    await btnCambiarPass.click();
    await expect(page.getByRole('status')).toHaveText(
      'Tu contraseña se ha actualizado correctamente.',
    );
  });
});