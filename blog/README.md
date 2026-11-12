# Blog del proyecto

## 12/11/2026 · Sprint 1 · Arranque de PokeMemories: usuarios, roles y primeros tests

### Dificultades y cómo las resolví

**Pruebas de roles entre ventana normal y modo incógnito:** Al implementar la regla de que el primer usuario registrado es administrador y los siguientes son usuarios normales, intentamos probar el registro de un segundo usuario abriendo una pestaña de incógnito y nos sorprendió ver que también recibía el rol de administrador. Investigando cómo funciona el navegador comprobamos que el modo incógnito crea un almacenamiento `localStorage` totalmente independiente y vacío desde cero. La solución para probar el comportamiento real de ambos roles fue cerrar sesión dentro de la misma ventana y registrar ahí un segundo entrenador, comprobando cómo al detectar usuarios previos ya le asignaba el rol `usuario` y ocultaba el enlace a `usuarios.html`.

**Control del doble envío en formularios asíncronos:** Como `resumirClave` (de `js/clave.js`) devuelve una promesa para calcular el resumen SHA-256 sin bloquear el hilo principal, si el usuario pulsaba el botón de enviar o la tecla Intro dos veces seguidas muy rápido podía lanzar dos envíos simultáneos. Para evitarlo introducimos una bandera `procesandoEnvio` junto a la desactivación del botón dentro de un bloque `try / catch / finally` en `js/paginas/login.js` y `js/paginas/registro.js`, asegurando que mientras dura el cálculo cualquier envío adicional sea ignorado.

**Protección frente a datos estropeados en el almacenamiento:** Al hacer pruebas modificando las claves de `localStorage` y `sessionStorage` desde las DevTools, vimos que un texto que no fuera JSON válido hacía fallar `JSON.parse()` y rompía la carga de toda la página. Lo resolvimos encapsulando las lecturas en bloques `try / catch` y validando la forma de los datos recuperados (con `Array.isArray` para la lista de usuarios y verificando que la sesión contenga `nombreUsuario` y un `rol` válido), devolviendo `[]` o `null` por defecto si algo está corrupto.

### Problemas conceptuales

**Por qué usar un evento propio (`CustomEvent`) para los avisos en lugar de editar el DOM directamente:** Al principio parecía más sencillo buscar `#zona-avisos` desde el archivo del login o del registro y cambiar su HTML allí mismo. Sin embargo, eso acoplaba la lógica de negocio a la estructura HTML de la alerta. Usando un evento personalizado que burbujea (`bubbles: true`), cualquier elemento del formulario puede notificar algo sin saber cómo se pinta:

```javascript
// js/avisos.js (líneas 15-21)
export function lanzarAviso(emisor, mensaje, tipo = 'info') {
  const evento = new CustomEvent('aviso', {
    bubbles: true,
    detail: { mensaje, tipo },
  });
  emisor.dispatchEvent(evento);
}
```

Un único oyente en `document` escucha `'aviso'` en fase de burbuja y se encarga de renderizar la alerta de Bootstrap en el contenedor con `role="status"`.

**Inyección de dependencias para poder hacer tests unitarios sin navegador:** Al empezar con Vitest no entendía cómo se podía probar una función que lee de `localStorage` si Node no tiene `localStorage` nativo. La clave está en recibir el almacenamiento como parámetro opcional con un valor por defecto:

```javascript
// js/datos/usuarios.js (línea 23)
export function obtenerUsuarios(almacen = localStorage) {
  ...
}
```

De este modo, cuando el navegador ejecuta la aplicación usa `localStorage` automáticamente, pero en `tests/unitarios/datos.test.js` podemos pasarle `new AlmacenFalso()` y probar todas las funciones de guardado, roles y datos corruptos de forma aislada y ultrarrápida.
