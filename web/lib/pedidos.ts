'use client'

// Estado compartido de los pedidos. Vive en el navegador: localStorage guarda, BroadcastChannel
// avisa a las otras pestañas. Así el panel de la botillería recibe la alerta del pedido en vivo
// sin servidor. Los tiempos de respuesta se sortean al crear el pedido y quedan guardados,
// para que todas las pestañas calculen exactamente las mismas transiciones.
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { BOTILLERIAS, POR_ID, RADIOS_KM, distanciaDe, distanciasDesde } from './botillerias'

export type EstadoPedido =
  | 'buscando'
  | 'aceptado'
  | 'preparando'
  | 'en_camino'
  | 'entregado'
  | 'sin_cobertura'
  | 'cancelado'

export type RespuestaOferta = 'pendiente' | 'aceptada' | 'rechazada' | 'vencida'

export type Oferta = {
  botilleriaId: string
  ronda: number
  enviadaEn: number
  venceEn: number
  respondeEn: number
  aceptaAuto: boolean
  respuesta: RespuestaOferta
  respondidaPor: 'auto' | 'panel' | null
}

export type ItemPedido = {
  productoId: number
  nombre: string
  precio: number
  cantidad: number
  imagen: string | null
}

export type Evento = { en: number; texto: string }

export type Cliente = {
  nombre: string
  telefono: string
  direccion: string
  sector: string
  notas: string
}

export type Pedido = {
  id: string
  creadoEn: number
  estado: EstadoPedido
  items: ItemPedido[]
  subtotal: number
  despacho: number
  total: number
  receta: { id: string; nombre: string } | null
  cliente: Cliente
  ronda: number
  ofertas: Oferta[]
  botilleriaId: string | null
  /** Distancia real de cada local a la comuna de entrega. */
  distancias: Record<string, number>
  aceptadoEn: number | null
  listoEn: number | null
  salidaEn: number | null
  entregaEn: number | null
  etaMin: number | null
  modo: 'auto' | 'manual'
  eventos: Evento[]
}

const CLAVE = 'edrink.pedidos.v1'
const CANAL = 'edrink.pedidos'

/** Simulación acelerada: la vuelta completa dura poco más de un minuto. */
export const TIEMPOS = {
  rondaMs: 22_000,
  respuestaMinMs: 4_000,
  respuestaMaxMs: 16_000,
  confirmacionMs: 6_000,
  preparacionMs: 20_000,
  viajePorKmMs: 2_500,
  viajeMinimoMs: 10_000,
}

const VACIO: Pedido[] = []
let cache: Pedido[] = VACIO
let cargado = false
let canal: BroadcastChannel | null = null
const oyentes = new Set<() => void>()

function hayNavegador(): boolean {
  return typeof window !== 'undefined'
}

function leerDisco(): Pedido[] {
  if (!hayNavegador()) return VACIO
  try {
    const bruto = window.localStorage.getItem(CLAVE)
    if (!bruto) return VACIO
    const datos = JSON.parse(bruto)
    return Array.isArray(datos) ? (datos as Pedido[]) : VACIO
  } catch {
    return VACIO
  }
}

function notificar() {
  for (const fn of oyentes) fn()
}

function guardar(lista: Pedido[], avisarOtras = true) {
  cache = lista
  if (hayNavegador()) {
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(lista))
    } catch {
      // Modo privado o cuota llena: la sesión sigue funcionando en memoria.
    }
    if (avisarOtras) canal?.postMessage('cambio')
  }
  notificar()
}

function recargar() {
  cache = leerDisco()
  notificar()
}

function iniciar() {
  if (cargado || !hayNavegador()) return
  cargado = true
  cache = leerDisco()
  try {
    canal = new BroadcastChannel(CANAL)
    canal.onmessage = () => recargar()
  } catch {
    canal = null
  }
  window.addEventListener('storage', (e) => {
    if (e.key === CLAVE) recargar()
  })
}

function suscribir(fn: () => void): () => void {
  iniciar()
  oyentes.add(fn)
  return () => {
    oyentes.delete(fn)
  }
}

const snapshotServidor = () => VACIO
const snapshot = () => cache

export function usePedidos(): Pedido[] {
  return useSyncExternalStore(suscribir, snapshot, snapshotServidor)
}

export function usePedido(id: string): Pedido | undefined {
  const pedidos = usePedidos()
  return pedidos.find((p) => p.id === id)
}

function mutar(id: string, fn: (p: Pedido) => Pedido | null) {
  const lista = leerDisco()
  const i = lista.findIndex((p) => p.id === id)
  if (i === -1) return
  const nuevo = fn(lista[i])
  if (!nuevo) return
  const copia = [...lista]
  copia[i] = nuevo
  guardar(copia)
}

function entre(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

const DIA_MS = 86_400_000

function crearOfertas(pedido: Pedido, ronda: number, ahora: number): Oferta[] {
  // En modo manual el pedido se le muestra a toda la red y espera sin vencerse,
  // porque quien decide es la persona que tiene abierto el panel en otra pestaña.
  const manual = pedido.modo === 'manual'
  const radio = manual ? RADIOS_KM[RADIOS_KM.length - 1] : RADIOS_KM[ronda - 1]
  if (radio == null) return []
  const yaOfertadas = new Set(pedido.ofertas.map((o) => o.botilleriaId))
  return BOTILLERIAS.filter((b) => distanciaDe(b.id, pedido.distancias) <= radio)
    .filter((b) => !yaOfertadas.has(b.id))
    .map((b) => ({
      botilleriaId: b.id,
      ronda,
      enviadaEn: ahora,
      venceEn: manual ? ahora + DIA_MS : ahora + TIEMPOS.rondaMs,
      respondeEn: ahora + entre(TIEMPOS.respuestaMinMs, TIEMPOS.respuestaMaxMs),
      aceptaAuto: Math.random() < b.tasaAceptacion,
      respuesta: 'pendiente' as RespuestaOferta,
      respondidaPor: null,
    }))
}

function conEvento(p: Pedido, en: number, texto: string): Pedido {
  return { ...p, eventos: [...p.eventos, { en, texto }] }
}

export function crearPedido(datos: {
  items: ItemPedido[]
  subtotal: number
  despacho: number
  total: number
  receta: { id: string; nombre: string } | null
  cliente: Cliente
  modo: 'auto' | 'manual'
}): Pedido {
  iniciar()
  const ahora = Date.now()
  const id = `AR-${String(ahora).slice(-6)}`
  const base: Pedido = {
    id,
    creadoEn: ahora,
    estado: 'buscando',
    items: datos.items,
    subtotal: datos.subtotal,
    despacho: datos.despacho,
    total: datos.total,
    receta: datos.receta,
    cliente: datos.cliente,
    ronda: 1,
    ofertas: [],
    botilleriaId: null,
    distancias: distanciasDesde(datos.cliente.sector),
    aceptadoEn: null,
    listoEn: null,
    salidaEn: null,
    entregaEn: null,
    etaMin: null,
    modo: datos.modo,
    eventos: [{ en: ahora, texto: 'Pedido enviado a la red' }],
  }
  // Desde una comuna periférica puede que el radio más chico no alcance a nadie:
  // se abre hasta el primero que sí tenga locales.
  let ronda = 1
  let ofertas = crearOfertas(base, ronda, ahora)
  while (!ofertas.length && ronda < RADIOS_KM.length) {
    ronda++
    ofertas = crearOfertas(base, ronda, ahora)
  }

  const conOfertas: Pedido = { ...base, ronda, ofertas }
  const pedido = conEvento(
    conOfertas,
    ahora,
    datos.modo === 'manual'
      ? `Aviso a ${ofertas.length} botillerías, esperando respuesta desde el panel`
      : `Aviso a ${ofertas.length} botillerías a menos de ${RADIOS_KM[ronda - 1]} km de ${datos.cliente.sector}`,
  )
  guardar([pedido, ...leerDisco()])
  return pedido
}

/** Aplica todas las transiciones que ya vencieron. Devuelve null si nada cambió. */
export function avanzar(p: Pedido, ahora: number): Pedido | null {
  if (p.estado === 'entregado' || p.estado === 'cancelado' || p.estado === 'sin_cobertura') return null
  let x = p
  let cambio = false

  if (x.estado === 'buscando') {
    if (x.modo === 'auto') {
      for (let i = 0; i < x.ofertas.length; i++) {
        const o = x.ofertas[i]
        if (o.respuesta !== 'pendiente' || o.respondeEn > ahora) continue
        const ofertas = [...x.ofertas]
        ofertas[i] = {
          ...o,
          respuesta: o.aceptaAuto ? 'aceptada' : 'rechazada',
          respondidaPor: 'auto',
        }
        x = { ...x, ofertas }
        cambio = true
        if (o.aceptaAuto) break
      }
    }

    const aceptada = x.ofertas.find((o) => o.respuesta === 'aceptada')
    if (aceptada) {
      x = aceptar(x, aceptada.botilleriaId, ahora)
      return x
    }

    const ofertas = x.ofertas.map((o) =>
      o.respuesta === 'pendiente' && o.venceEn <= ahora ? { ...o, respuesta: 'vencida' as RespuestaOferta } : o,
    )
    if (ofertas.some((o, i) => o !== x.ofertas[i])) {
      x = { ...x, ofertas }
      cambio = true
    }

    const quedaAlguna = x.ofertas.some((o) => o.ronda === x.ronda && o.respuesta === 'pendiente')
    if (!quedaAlguna) {
      // Se salta cualquier radio que no agregue botillerías nuevas, para que el pedido
      // no quede congelado entre dos rondas equivalentes.
      let siguiente = x.ronda + 1
      let nuevas: Oferta[] = []
      while (siguiente <= RADIOS_KM.length && nuevas.length === 0) {
        nuevas = crearOfertas(x, siguiente, ahora)
        if (!nuevas.length) siguiente++
      }
      if (nuevas.length) {
        return conEvento(
          { ...x, ronda: siguiente, ofertas: [...x.ofertas, ...nuevas] },
          ahora,
          `Nadie tomó el pedido. Se amplía la búsqueda a ${RADIOS_KM[siguiente - 1]} km`,
        )
      }
      return conEvento({ ...x, estado: 'sin_cobertura' }, ahora, 'Ninguna botillería de la red pudo tomarlo')
    }
    return cambio ? x : null
  }

  if (x.estado === 'aceptado' && x.aceptadoEn != null && ahora >= x.aceptadoEn + TIEMPOS.confirmacionMs) {
    return conEvento({ ...x, estado: 'preparando', listoEn: ahora + TIEMPOS.preparacionMs }, ahora, 'Armando el pedido')
  }

  if (x.estado === 'preparando' && x.listoEn != null && ahora >= x.listoEn) {
    const km = x.botilleriaId ? distanciaDe(x.botilleriaId, x.distancias) : 3
    const viaje = Math.max(TIEMPOS.viajeMinimoMs, Math.round(km * TIEMPOS.viajePorKmMs))
    return conEvento(
      { ...x, estado: 'en_camino', salidaEn: ahora, entregaEn: ahora + viaje },
      ahora,
      'El repartidor salió con tu pedido',
    )
  }

  if (x.estado === 'en_camino' && x.entregaEn != null && ahora >= x.entregaEn) {
    return conEvento({ ...x, estado: 'entregado' }, ahora, 'Pedido entregado')
  }

  return cambio ? x : null
}

function aceptar(p: Pedido, botilleriaId: string, ahora: number): Pedido {
  const b = POR_ID[botilleriaId]
  const km = distanciaDe(botilleriaId, p.distancias)
  const eta = Math.round((b?.minutosPreparacion ?? 10) + km * 2.5 + 4)
  const ofertas = p.ofertas.map((o) =>
    o.botilleriaId === botilleriaId
      ? { ...o, respuesta: 'aceptada' as RespuestaOferta, respondidaPor: o.respondidaPor ?? 'panel' }
      : o.respuesta === 'pendiente'
        ? { ...o, respuesta: 'vencida' as RespuestaOferta }
        : o,
  )
  return conEvento(
    { ...p, estado: 'aceptado', botilleriaId, aceptadoEn: ahora, etaMin: eta, ofertas },
    ahora,
    `${b?.nombre ?? 'Una botillería'} tomó el pedido`,
  )
}

export function responderOferta(pedidoId: string, botilleriaId: string, acepta: boolean) {
  mutar(pedidoId, (p) => {
    if (p.estado !== 'buscando') return null
    const ahora = Date.now()
    if (acepta) return aceptar(p, botilleriaId, ahora)
    const ofertas = p.ofertas.map((o) =>
      o.botilleriaId === botilleriaId && o.respuesta === 'pendiente'
        ? { ...o, respuesta: 'rechazada' as RespuestaOferta, respondidaPor: 'panel' as const }
        : o,
    )
    return { ...p, ofertas }
  })
}

export function empujarEstado(pedidoId: string) {
  mutar(pedidoId, (p) => {
    const ahora = Date.now()
    if (p.estado === 'aceptado') {
      return conEvento({ ...p, estado: 'preparando', listoEn: ahora + TIEMPOS.preparacionMs }, ahora, 'Armando el pedido')
    }
    if (p.estado === 'preparando') {
      const km = p.botilleriaId ? distanciaDe(p.botilleriaId, p.distancias) : 3
      const viaje = Math.max(TIEMPOS.viajeMinimoMs, Math.round(km * TIEMPOS.viajePorKmMs))
      return conEvento(
        { ...p, estado: 'en_camino', salidaEn: ahora, entregaEn: ahora + viaje },
        ahora,
        'El repartidor salió con tu pedido',
      )
    }
    if (p.estado === 'en_camino') {
      return conEvento({ ...p, estado: 'entregado' }, ahora, 'Pedido entregado')
    }
    return null
  })
}

export function cancelarPedido(pedidoId: string) {
  mutar(pedidoId, (p) => {
    if (p.estado === 'entregado' || p.estado === 'cancelado') return null
    return conEvento({ ...p, estado: 'cancelado' }, Date.now(), 'El cliente canceló')
  })
}

/** Vuelve a lanzar la búsqueda desde el radio más chico. */
export function reintentar(pedidoId: string) {
  mutar(pedidoId, (p) => {
    if (p.estado !== 'sin_cobertura' && p.estado !== 'cancelado') return null
    const ahora = Date.now()
    const limpio: Pedido = { ...p, estado: 'buscando', ronda: 1, ofertas: [], botilleriaId: null }
    let ronda = 1
    let ofertas = crearOfertas(limpio, ronda, ahora)
    while (!ofertas.length && ronda < RADIOS_KM.length) {
      ronda++
      ofertas = crearOfertas(limpio, ronda, ahora)
    }
    return conEvento({ ...limpio, ronda, ofertas }, ahora, 'Se reenvía el pedido a la red')
  })
}

export function cambiarModo(pedidoId: string, modo: 'auto' | 'manual') {
  mutar(pedidoId, (p) => (p.modo === modo ? null : { ...p, modo }))
}

export function borrarTodo() {
  guardar([])
}

/** Hace avanzar los pedidos abiertos una vez por segundo. */
export function useMotorDespacho(activo = true) {
  const pedidos = usePedidos()
  const tick = useCallback(() => {
    const ahora = Date.now()
    for (const p of pedidos) {
      if (p.estado === 'entregado' || p.estado === 'cancelado' || p.estado === 'sin_cobertura') continue
      mutar(p.id, (actual) => avanzar(actual, ahora))
    }
  }, [pedidos])

  useEffect(() => {
    if (!activo) return
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [activo, tick])
}

export function ofertasPendientes(pedidos: Pedido[], botilleriaId: string): Pedido[] {
  return pedidos.filter(
    (p) =>
      p.estado === 'buscando' &&
      p.ofertas.some((o) => o.botilleriaId === botilleriaId && o.respuesta === 'pendiente'),
  )
}

export function pedidosDe(pedidos: Pedido[], botilleriaId: string): Pedido[] {
  return pedidos.filter((p) => p.botilleriaId === botilleriaId)
}
