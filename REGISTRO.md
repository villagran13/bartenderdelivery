# Bartender interactivo Edrink

Landing que recomienda tragos según los gustos de quien entra, arma el pack de botellas con el
catálogo real de Edrink y despacha el pedido a una red de botillerías con lógica tipo Uber.

Fecha: 2026-09-03. Estado: construido y verificado en local, sin desplegar.

---

## Qué se pidió

> Quiero hacer el bartender interactivo. La idea es una landing que sugiera recetas personalizadas
> basadas en el catálogo de edrink. El usuario dice qué le gusta (dulce, cítrico, fuerte) o qué
> ingredientes ya tiene, y la IA le arma el trago y le permite agregar todo el pack de botellas al
> carrito. No estará conectado a un ecommerce, pero quiero que aparezcan los productos, de tal manera
> que funcione con la lógica de Uber: luego de hacer el pedido se activa una alerta a la redonda y
> las botillerías pueden aceptar el pedido.

Dos precisiones llegaron durante la construcción:

- Una sección donde seleccionar los gustos, recibir la recomendación y poder comprar.
- La ciudad es **Santiago**, no Arica.

## Decisiones tomadas antes de construir

| Decisión | Opción elegida | Por qué |
|---|---|---|
| Catálogo | Extraído real de edrink.cl | El cliente ve sus propios productos, con precio y stock verdaderos. La demo se cae sola si los productos son inventados. |
| Motor de recomendación | Solo reglas, sin API | Elección del cliente. Sin API key, sin costo por consulta y sin posibilidad de que la demo falle frente a alguien. |
| Red de botillerías | Simulación en el navegador | Elección del cliente. Sin servidor, desplegable como sitio estático. |
| Despliegue | Vercel | Todo el estado vive en el navegador, así que el sitio funciona en serverless sin base de datos. |

## Qué se construyó

`web/` es un proyecto Next 16 con React 19, Tailwind 4 y TypeScript. Tres rutas:

- **`/`** — la landing: héroe, selector de gustos, recomendación, pack, vitrina del catálogo y
  explicación de la red.
- **`/pedido/[id]`** — seguimiento del pedido con el radar de despacho.
- **`/botilleria`** — el panel que ve el local cuando le suena un pedido.

### El catálogo

`scripts/scrape-catalogo.mjs` recorre las 36 colecciones publicadas en edrink.cl (tienda Bsale) y
extrae los productos desde `window.INIT.collections`, que es donde la tienda los embebe.
`scripts/normalizar-catalogo.mjs` limpia los títulos en mayúsculas, separa formato y graduación,
decodifica las descripciones y emite `data/catalogo.ts`.

**629 productos únicos** con precio, stock, imagen, marca y enlace al producto real. Se emite como
módulo TypeScript y no como JSON porque importar 300 KB de JSON obliga a `tsc` a inferir el tipo
literal de cada producto y la revisión de tipos se vuelve lentísima.

Para refrescar el catálogo: `npm run catalogo`.

### El motor de recomendación

Tres piezas, todas sin servicios externos:

1. **Roles** (`lib/roles.ts`) — 39 roles de ingrediente (pisco, tónica, jugo de piña, ginger beer)
   con los mililitros que consume un trago y las reglas para reconocerlos en el catálogo.
2. **Recetas** (`lib/recetas.ts`) — 26 tragos con perfil de sabor, intensidad, base, pasos y un tip
   de bartender. Incluye clásicos chilenos (piscola, terremoto, jote, michelada) y tres sin alcohol.
3. **Motor** (`lib/motor.ts`) — filtra por stock real, perfil, intensidad, base y lo que la persona
   ya tiene en la casa; puntúa; y arma el pack.

El pack no es la receta de un vaso: con el número de personas y los tragos por cabeza calcula los
mililitros necesarios de cada ingrediente y los divide por el formato de la botella. Para ocho
personas propone el desechable de 3 L y no seis latas, porque los mixers se ordenan por precio por
mililitro y no por precio de lista.

**Lo que se pide no se negocia.** El destilado elegido, el perfil de sabor y el "sin alcohol" son
filtros duros: una receta que falla cualquiera de los tres no entra en "Lo que te recomiendo". Los
tragos sin alcohol solo aparecen si se marca la casilla, porque esto es una botillería.

Cuando quedan menos de tres cartas, el resto va en un bloque aparte, **"Si abres la mano"**, y cada
carta dice en qué se corre: "Lleva fernet, no gin", "Es cítrico y fuerte", "Más suave de lo que
pediste". Nunca se mezclan con las que sí calzan. Si no calza ninguna, el botón cambia a "Ver lo más
parecido" en vez de quedar inerte.

La intensidad es lo único blando: si nadie cumple la exacta, entran las de un punto de diferencia y
la carta lo dice.

### La red de botillerías

Ocho locales de Santiago con coordenadas reales por comuna. Al hacer el pedido se calcula la
distancia haversine desde la comuna de entrega hasta cada local, así que pedir desde Maipú no
muestra Providencia a 1,2 km.

El despacho funciona por rondas: 3 km, 7 km y 15 km. Cada ronda dura 22 segundos; si nadie contesta,
el radio se abre. Si nadie de la red toma el pedido, queda en "sin cobertura" con un botón para
reenviarlo. Los tiempos de respuesta y la decisión de cada botillería se sortean al crear el pedido
y quedan guardados, para que todas las pestañas calculen exactamente las mismas transiciones.

Estados: buscando, tomado, armando, en camino, entregado, más cancelado y sin cobertura.

**Dos modos**, elegibles en el checkout:

- **Sola** — las botillerías contestan por su cuenta en segundos. Sirve para mostrar el flujo
  completo sin tocar nada.
- **La tomo yo** — el pedido se le muestra a toda la red y espera sin vencerse hasta que alguien lo
  acepte desde el panel. Sirve para la demostración a dos pantallas.

El estado vive en `localStorage` y se sincroniza entre pestañas con `BroadcastChannel`. Abrir
`/botilleria` en otra pestaña del mismo navegador y tomar el pedido mueve la pantalla del cliente en
el momento.

### El diseño

Azul noche saturado como base, naranja para las acciones del cliente y lima reservado a las señales
de la red. Archivo en ancho expandido para los titulares, con energía de letrero de precios de
botillería, e Instrument Sans para la interfaz.

El panel de la botillería invierte la piel a modo diurno de trastienda: es el otro lado del
mostrador y debe verse como otro producto.

El único movimiento que arranca solo en toda la página es el pulso del radar, y respeta
`prefers-reduced-motion`.

## Cómo se demuestra

```
cd web
npm install
npm run dev
```

1. En `/`, elegir uno o dos sabores, la base y para cuántas personas. El contador muestra en vivo
   cuántos tragos siguen calzando.
2. "Armar mi trago" entrega tres cartas con receta, pack y precio total.
3. "Agregar el pack al carro" abre el cajón. "Continuar" pide los datos de entrega.
4. Elegir **La tomo yo** en el modo de respuesta.
5. Enviar. Se abre el seguimiento con el radar.
6. Abrir `/botilleria` en otra pestaña, elegir el local y tomar el pedido. La pantalla del cliente
   cambia sola.

## Qué quedó pendiente

- **Sin desplegar.** Falta definir el dominio y subirlo a Vercel.
- **La sincronización es por navegador.** `BroadcastChannel` y `localStorage` no cruzan equipos:
  el panel de la botillería solo recibe pedidos hechos en el mismo navegador. Llevarlo a varios
  dispositivos exige un servidor con estado (Durable Objects, Supabase Realtime o similar).
- **No hay pago ni pedido real.** El checkout no cobra nada y no envía nada a Edrink.
- **Las botillerías son ficticias**, salvo el concepto de casa matriz. Las direcciones y las tasas de
  aceptación son de demostración.
- **El hielo no está en el catálogo de Edrink** como producto suelto: solo aparece dentro de los packs
  promocionales. Las recetas lo tratan como ingrediente de casa, junto con el limón y la menta.
- **Falta revisar en un teléfono real.** La maqueta se verificó a 375 px dentro del navegador de
  escritorio, sin desbordes horizontales, pero no en un dispositivo.
- **El catálogo es una foto del 3 de septiembre de 2026.** Sin conexión al ecommerce, los precios se
  congelan hasta que se corra `npm run catalogo` de nuevo.

## Verificación

`npm run verificar` corre lint, revisión de tipos y build. Al cierre: los tres pasan.

Probado en el navegador de punta a punta: recomendación con filtros estrechos y anchos, cambio de
botella dentro del pack, carrito, checkout con validación de mayoría de edad, aceptación automática,
aceptación manual desde el panel en otra pestaña, ampliación de radio desde Maipú, estado sin
cobertura y reenvío del pedido.

## Correcciones posteriores

**2026-09-03, selección de gustos.** El motor rellenaba hasta tres cartas soltando filtros en
silencio: pedir amargo y gin devolvía un fernet con cola como tercera opción, sin más aviso que una
nota al margen. Se separó en dos bloques (lo que calza y lo que se corre, con el motivo escrito en
cada carta), se hizo duro el filtro de destilado y perfil, y los tragos sin alcohol pasaron a ser
opt-in. De paso, el castigo por pack largo hundía a los clásicos frente a recetas de un solo
ingrediente: se bajó a la mitad y los tragos reconocibles ganan peso cuando todavía no se elige nada.
