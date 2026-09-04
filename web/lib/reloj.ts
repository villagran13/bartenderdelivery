'use client'

// Reloj compartido: un solo intervalo para todas las cuentas regresivas de la página.
// Se expone como store externo para no escribir estado dentro de un efecto.
import { useSyncExternalStore } from 'react'

let ahora = 0
let intervalo: number | null = null
const oyentes = new Set<() => void>()

function suscribir(fn: () => void): () => void {
  oyentes.add(fn)
  if (intervalo == null && typeof window !== 'undefined') {
    ahora = Date.now()
    intervalo = window.setInterval(() => {
      ahora = Date.now()
      for (const o of oyentes) o()
    }, 1000)
  }
  return () => {
    oyentes.delete(fn)
    if (oyentes.size === 0 && intervalo != null) {
      window.clearInterval(intervalo)
      intervalo = null
    }
  }
}

/** Milisegundos actuales, o 0 mientras se renderiza en el servidor. */
export function useAhora(): number {
  return useSyncExternalStore(
    suscribir,
    () => ahora,
    () => 0,
  )
}
