'use client'

import { BOTILLERIAS, RADIOS_KM, distanciaDe } from '@/lib/botillerias'
import type { Pedido } from '@/lib/pedidos'

const MAX_KM = RADIOS_KM[RADIOS_KM.length - 1]

// Escala de raíz cuadrada: con una escala lineal los locales cercanos se amontonan
// en el centro y las etiquetas quedan una encima de otra.
function fraccionRadio(distanciaKm: number): number {
  return Math.min(1, Math.sqrt(distanciaKm / MAX_KM))
}

function posicion(distanciaKm: number, anguloGrados: number) {
  const rad = (anguloGrados * Math.PI) / 180
  const fraccion = fraccionRadio(distanciaKm)
  return {
    left: `${50 + 44 * fraccion * Math.sin(rad)}%`,
    top: `${50 - 44 * fraccion * Math.cos(rad)}%`,
  }
}

type EstadoPunto = 'dormida' | 'sonando' | 'rechazo' | 'tomo'

export function RadarDespacho({ pedido }: { pedido: Pedido }) {
  const buscando = pedido.estado === 'buscando'
  const radioActual = RADIOS_KM[pedido.ronda - 1] ?? MAX_KM

  function estadoDe(id: string): EstadoPunto {
    if (pedido.botilleriaId === id) return 'tomo'
    const oferta = [...pedido.ofertas].reverse().find((o) => o.botilleriaId === id)
    if (!oferta) return 'dormida'
    if (oferta.respuesta === 'pendiente') return 'sonando'
    if (oferta.respuesta === 'aceptada') return 'tomo'
    return 'rechazo'
  }

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {RADIOS_KM.map((km) => {
        const lado = `${fraccionRadio(km) * 88}%`
        const activo = buscando && km === radioActual
        return (
          <div
            key={km}
            style={{ width: lado, height: lado }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
              activo ? 'border-lima/70' : 'border-noche-borde'
            }`}
          />
        )
      })}

      {/* Pulso: el único movimiento que arranca solo, y solo mientras la red pregunta. */}
      {buscando ? (
        <>
          <div className="pulso absolute top-1/2 left-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-lima" />
          <div
            className="pulso absolute top-1/2 left-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-lima/60"
            style={{ animationDelay: '1.6s' }}
          />
        </>
      ) : null}

      {/* La dirección de entrega */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-3 w-3 rounded-full bg-sol ring-4 ring-sol/25" />
      </div>

      {BOTILLERIAS.map((b) => {
        const estado = estadoDe(b.id)
        const punto = {
          dormida: 'bg-noche-borde',
          sonando: 'bg-lima latido',
          rechazo: 'bg-vino',
          tomo: 'bg-sol',
        }[estado]
        const texto = {
          dormida: 'text-bruma/50',
          sonando: 'text-lima',
          rechazo: 'text-bruma/50 line-through',
          tomo: 'text-sol',
        }[estado]
        return (
          <div
            key={b.id}
            style={posicion(distanciaDe(b.id, pedido.distancias), b.angulo)}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${punto}`} />
            <span className={`mt-1 max-w-24 text-center text-[0.65rem] leading-tight ${texto}`}>
              {b.sector}
            </span>
          </div>
        )
      })}
    </div>
  )
}
