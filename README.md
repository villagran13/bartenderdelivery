# Bartender Edrink

Landing que recomienda tragos según los gustos de quien entra, arma el pack de botellas con el
catálogo real de [edrink.cl](https://www.edrink.cl) y reparte el pedido a una red de botillerías de
Santiago con lógica tipo Uber.

Demostración para cliente. No procesa pagos ni envía pedidos reales.

## Correr en local

```bash
cd web
npm install
npm run dev
```

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | La landing: gustos, recomendación, pack y carrito |
| `/pedido/[id]` | Seguimiento del pedido con el radar de despacho |
| `/botilleria` | Panel que ve el local cuando le suena un pedido |

Para la demostración a dos pantallas: haz el pedido eligiendo "La tomo yo" en el modo de respuesta y
abre `/botilleria` en otra pestaña del mismo navegador.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run verificar` | Lint, revisión de tipos y build |
| `npm run catalogo` | Vuelve a extraer y normalizar el catálogo de edrink.cl |

## Stack

Next 16, React 19, Tailwind 4, TypeScript. Sin base de datos y sin servicios externos: el motor de
recetas es determinista y el estado de los pedidos vive en el navegador, sincronizado entre pestañas
con `BroadcastChannel`.

El detalle de las decisiones, lo que quedó pendiente y las limitaciones conocidas está en
[REGISTRO.md](REGISTRO.md).
