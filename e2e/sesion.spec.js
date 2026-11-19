import { test, expect } from '@playwright/test';
import { registrarse, iniciarSesion } from './ayudas.js';

test.describe('Recorrido E2E: Ciclo de vida de la sesión (Requisito 21)', () => {
  test('un usuario se registra como primer entrenador (admin), cierra sesión y vuelve a iniciar sesión', async ({
    page,
  }) => {
    // 1. Registro como primer usuario del sistema (recibe rol de administrador)
    await registrarse(page, {
      usuario: 'AshKetchum',
      email: 'ash@kanto.org',
      clave: 'Pikachu123',
    });

    // 2. Al ser el primer usuario, ve la opción «👥 Usuarios» en la barra de navegación
    const enlaceUsuarios = page.getByRole('link', { name: /Usuarios/i });
    await expect(enlaceUsuarios).toBeVisible();
    await expect(page.getByText('Profesor (Admin)')).toBeVisible();

    // 3. Cierra la sesión activa
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await page.waitForURL('**/index.html');
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();

    // 4. Vuelve a iniciar sesión con las credenciales registradas
    await iniciarSesion(page, {
      usuario: 'AshKetchum',
      clave: 'Pikachu123',
    });

    // 5. Comprueba que ha regresado al listado con la sesión restaurada
    await expect(enlaceUsuarios).toBeVisible();
    await expect(page.locator('#info-usuario-activo')).toContainText('AshKetchum');
  });
});
