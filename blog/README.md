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


## 19/11/2026 · Sprint 2 · El CRUD, la zona de administración, validación accesible y pruebas de extremo a extremo

### Dificultades y cómo las resolví

**Captura del evento `blur` para la validación en tiempo real:** Al implementar el motor de validación accesible en `js/componentes/validacionFormulario.js`, queríamos que los errores solo se mostraran cuando el usuario abandona un campo por primera vez (para no agobiarle en rojo mientras escribe desde el principio). Sin embargo, el evento estándar `blur` no burbujea por el árbol del DOM (`bubbles: false`). En lugar de recorrer todos los campos y asociar oyentes individuales (lo cual fallaría al añadir dinámicamente nuevos miembros al equipo Pokémon), registramos el oyente de `blur` directamente sobre el formulario en la **fase de captura** (`capture: true`):

```javascript
// js/componentes/validacionFormulario.js
formulario.addEventListener('blur', manejarSalidaCampo, true);
```

De esta forma, cuando el foco abandona cualquier control hijo, el evento viaja desde la raíz hacia el objetivo pasando por el formulario durante la bajada (fase de captura), permitiendo marcar el campo como tocado y mostrar el error de forma centralizada.

**Filtrado multi-término insensible a mayúsculas y acentos en el buscador:** En la vitrina de recuerdos y en la tabla de usuarios, las búsquedas simples con `indexOf` o `includes` fallaban cuando el usuario introducía palabras separadas en diferente orden (por ejemplo, «epico rubi» para encontrar «Rubí Omega Épico») o escribía sin acentos. Lo resolvimos en `js/paginacion.js` mediante la función pura `filtrarLista`, combinando `normalize('NFD').replace(/[\u0300-\u036f]/g, '')` para eliminar diacríticos y dividiendo la consulta en términos individuales (`split(/\s+/)`) para exigir con `every` que todas las palabras buscadas coincidan en el texto normalizado.

**Manejo de grupos dinámicos y lectura con `FormData.getAll()`:** La ficha de partida incluye dos grupos repetibles: el equipo campeón (1 a 6 miembros) y las leyendas caídas (1 a 6 caídos condicionales). Al enviar el formulario, `new FormData(formulario)` permite recolectar los campos homogéneos mediante `getAll('pokemonMote')`, `getAll('pokemonNivel')` y `getAll('pokemonMovimiento')`, reconstruyendo el array de objetos con un simple mapeo por índice sin tener que recorrer el DOM manualmente.

### Problemas conceptuales

**Delegación de eventos con `closest` en interfaces dinámicas:** En lugar de asociar eventos `click` a cada botón de borrar o editar en las tarjetas de recuerdos, a cada botón de eliminar fila de Pokémon o a cada botón de cambiar rol en la tabla de usuarios, aplicamos **delegación de eventos**. Añadimos un único oyente al contenedor padre (`#lista-partidas`, `#lista-equipo`, `#lista-usuarios`) y usamos `evento.target.closest('button[data-accion="..."]')`. Esto no solo reduce drásticamente el consumo de memoria y simplifica el ciclo de vida de los elementos dinámicos, sino que evita errores de oyentes huérfanos cuando se reemplazan o eliminan nodos del DOM.

**Aislamiento y determinismo en las pruebas de extremo a extremo con Playwright:** Al preparar los recorridos E2E (`e2e/sesion.spec.js` y `e2e/crud.spec.js`), un aspecto crucial fue entender que Playwright crea un contexto de navegador limpio para cada prueba con el almacenamiento vacío. Esto garantizó que el primer usuario registrado en cada test siempre fuera administrador, permitiendo diseñar pruebas independientes y reproducibles. Encapsular las acciones repetidas en `e2e/ayudas.js` (`registrarse`, `iniciarSesion`, `crearRecuerdo`) mantuvo los tests limpios y enfocados en las aserciones de usuario.
