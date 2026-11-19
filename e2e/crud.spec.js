import { test, expect } from '@playwright/test';
import { registrarse, crearRecuerdo } from './ayudas.js';

test.describe('Recorrido E2E: Operaciones CRUD de recuerdos (Requisito 21)', () => {
  test('un entrenador da de alta una partida, la edita, la borra con confirmación y persiste al recargar', async ({
    page,
  }) => {
    // 1. Registro e inicio de sesión inicial
    await registrarse(page, {
      usuario: 'AshKetchum',
      email: 'ash@kanto.org',
      clave: 'Pikachu123',
    });

    // 2. Dar de alta un recuerdo en ficha.html
    await crearRecuerdo(page, {
      edicion: 'HeartGold',
      numero: '0042',
      titulo: 'Oro HeartGold en mi 3ds',
      fecha: '2026-10-15',
      tiempo: '45:30',
      idEntrenador: '00151-7',
      mote: 'Typhlosion',
      nivel: '65',
      movimiento: 'Lanzallamas',
    });

    // 3. Comprobar que aparece en listado.html y persiste tras recargar
    const tituloTarjeta = page.locator('[data-campo="titulo"]');
    await expect(tituloTarjeta).toHaveText('Oro HeartGold en mi 3ds');
    await expect(page.locator('[data-campo="codigoRegistro"]')).toHaveText('POKE-HGD-0042');
    await expect(page.locator('[data-campo="equipo"]')).toContainText('Typhlosion');

    await page.reload();
    await expect(tituloTarjeta).toHaveText('Oro HeartGold en mi 3ds');

    // 4. Editar el recuerdo existente
    await page.locator('a[data-accion="editar"]').first().click();
    await expect(page).toHaveURL(/ficha\.html\?id=/);
    await expect(page.getByLabel('Título de la partida')).toHaveValue('Oro HeartGold en mi 3ds');

    await page.getByLabel('Título de la partida').fill('Oro HeartGold Edición Coleccionista');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await page.waitForURL('**/listado.html');

    // 5. Comprobar edición y persistencia al recargar
    await expect(tituloTarjeta).toHaveText('Oro HeartGold Edición Coleccionista');
    await page.reload();
    await expect(tituloTarjeta).toHaveText('Oro HeartGold Edición Coleccionista');

    // 6. Borrar con confirmación en el <dialog>
    await page.locator('button[data-accion="borrar"]').first().click();
    const dialogo = page.locator('#dialogo-borrar');
    await expect(dialogo).toBeVisible();
    await expect(dialogo).toContainText('Oro HeartGold Edición Coleccionista');

    await page.locator('#btn-confirmar-borrado').click();

    // 7. Comprobar que se ha borrado y persiste el estado vacío tras recargar
    await expect(page.locator('#estado-vacio')).toBeVisible();
    await expect(page.locator('[data-campo="titulo"]')).toHaveCount(0);

    await page.reload();
    await expect(page.locator('#estado-vacio')).toBeVisible();
    await expect(page.locator('[data-campo="titulo"]')).toHaveCount(0);
  });
});
