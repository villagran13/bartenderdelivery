'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { BOTILLERIAS, POR_ID, distanciaDe } from '@/lib/botillerias'
import { clp, hora, segundosHasta } from '@/lib/formato'
import { useAhora } from '@/lib/reloj'
import {
  empujarEstado,
  ofertasPendientes,
  pedidosDe,
  responderOferta,
  useMotorDespacho,
  usePedidos,
  type Pedido,
} from '@/lib/pedidos'

const CLAVE_LOCAL = 'edrink.botilleria.v1'

// Qué botillería está operando el panel. Store externo para que el valor guardado
// no tenga que entrar por un efecto y desalinear la hidratación.
let seleccion = BOTILLERIAS[0].id
let cargada = false
const oyentesSeleccion = new Set<() => void>()

function suscribirSeleccion(fn: () => void): () => void {
  if (!cargada && typeof window !== 'undefined') {
    cargada = true
    try {
      const guardada = window.localStorage.getItem(CLAVE_LOCAL)
      if (guardada && POR_ID[guardada]) seleccion = guardada
    } catch {
      // Sin localStorage se queda con la primera de la lista.
    }
  }
  oyentesSeleccion.add(fn)
  return () => {
    oyentesSeleccion.delete(fn)
  }
}

function elegirBotilleria(id: string) {
  seleccion = id
  try {
    window.localStorage.setItem(CLAVE_LOCAL, id)
  } catch {
    // Ídem.
  }
  for (const fn of oyentesSeleccion) fn()
}

function useBotilleriaActiva(): string {
  return useSyncExternalStore(
    suscribirSeleccion,
    () => seleccion,
    () => BOTILLERIAS[0].id,
  )
}

const SIGUIENTE: Record<string, string> = {
  aceptado: 'Marcar como armado',
  preparando: 'Salió a reparto',
  en_camino: 'Marcar como entregado',
}

export function PanelBotilleria() {
  useMotorDespacho()
  const pedidos = usePedidos()
  const botilleriaId = useBotilleriaActiva()
  const ahora = useAhora()
  const montado = ahora > 0

  const yo = POR_ID[botilleriaId]
  const sonando = montado ? ofertasPendientes(pedidos, botilleriaId) : []
  const mios = montado ? pedidosDe(pedidos, botilleriaId) : []
  const activos = mios.filter((p) => p.estado !== 'entregado' && p.estado !== 'cancelado')
  const cerrados = mios.filter((p) => p.estado === 'entregado' || p.estado === 'cancelado')

  return (
    <div className="min-h-screen bg-hueso text-noche">
      <header className="border-b-2 border-noche bg-hueso">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="titular text-2xl text-noche">edrink red</p>
            <p className="text-sm text-noche/60">Panel de la botillería</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-noche/70">
              Estás operando como
              <select
                value={botilleriaId}
                onChange={(e) => elegirBotilleria(e.target.value)}
                className="ml-2 border-2 border-noche bg-hueso px-3 py-2 text-base text-noche"
              >
                {BOTILLERIAS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </label>
            <Link href="/" className="text-sm text-noche/60 underline underline-offset-4 hover:text-noche">
              Ir al bartender
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-noche pb-4">
          <h1 className="titular text-grande text-noche">{yo.nombre}</h1>
          <p className="text-sm text-noche/70">
            {yo.direccion}, {yo.sector}. Cierra a las {yo.cierra}. {yo.pedidosMes} pedidos el mes pasado.
          </p>
        </div>

        <section className="mt-8">
          <h2 className="rotulo text-xl text-noche">
            Pedidos sonando {sonando.length ? `(${sonando.length})` : ''}
          </h2>
          {sonando.length === 0 ? (
            <div className="mt-4 border-2 border-dashed border-noche/30 p-8 text-center">
              <p className="text-base text-noche/70">No hay pedidos esperando respuesta.</p>
              <p className="mx-auto mt-2 max-w-[52ch] text-sm text-noche/60">
                Arma un trago en el bartender y elige que el pedido lo tome alguien desde el panel. Aparece acá
                en el momento, en esta misma pestaña o en otra del mismo navegador.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {sonando.map((p) => (
                <TarjetaEntrante key={p.id} pedido={p} botilleriaId={botilleriaId} ahora={ahora} />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="rotulo text-xl text-noche">En curso {activos.length ? `(${activos.length})` : ''}</h2>
          {activos.length === 0 ? (
            <p className="mt-3 text-sm text-noche/60">Nada en preparación por ahora.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {activos.map((p) => (
                <TarjetaEnCurso key={p.id} pedido={p} />
              ))}
            </ul>
          )}
        </section>

        {cerrados.length ? (
          <section className="mt-12">
            <h2 className="rotulo text-xl text-noche">Cerrados hoy</h2>
            <ul className="mt-4 divide-y divide-noche/20 border-y border-noche/20">
              {cerrados.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                  <span className="numero text-noche/70">{p.id}</span>
                  <span className="text-noche/70">{p.cliente.direccion}</span>
                  <span className="numero text-noche">{clp(p.total)}</span>
                  <span className="text-noche/60">{p.estado === 'entregado' ? 'entregado' : 'cancelado'}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-14 border-t border-noche/20 pt-6 text-xs leading-relaxed text-noche/60">
          Demostración: los pedidos viven en el navegador y se sincronizan entre pestañas del mismo equipo. En
          producción esto sería un servidor con notificaciones al celular del local.
        </p>
      </main>
    </div>
  )
}

function TarjetaEntrante({
  pedido,
  botilleriaId,
  ahora,
}: {
  pedido: Pedido
  botilleriaId: string
  ahora: number
}) {
  const oferta = pedido.ofertas.find((o) => o.botilleriaId === botilleriaId && o.respuesta === 'pendiente')
  const restante = oferta ? segundosHasta(oferta.venceEn, ahora) : 0
  const apurado = restante > 0 && restante <= 10

  return (
    <li className="border-2 border-noche bg-hueso">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-noche bg-noche px-5 py-3 text-hueso">
        <div>
          <p className="rotulo text-lg">Pedido {pedido.id}</p>
          <p className="text-sm text-bruma">
            {pedido.cliente.sector}, {pedido.cliente.direccion}
          </p>
        </div>
        <div className="text-right">
          <p className="numero text-2xl text-lima">{clp(pedido.total)}</p>
          {restante < 120 ? (
            <p className={`numero text-sm ${apurado ? 'text-sol' : 'text-bruma'}`}>quedan {restante} s</p>
          ) : (
            <p className="text-sm text-bruma">esperando tu respuesta</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 px-5 py-4 sm:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-sm text-noche/60">
            {pedido.receta ? `Pack para ${pedido.receta.nombre.toLowerCase()}` : 'Productos sueltos'}
          </p>
          <ul className="mt-2 space-y-1">
            {pedido.items.map((i) => (
              <li key={i.productoId} className="flex justify-between gap-4 text-sm">
                <span className="text-noche">
                  <span className="numero">{i.cantidad}</span> {i.nombre}
                </span>
                <span className="numero text-noche/70">{clp(i.precio * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          {pedido.cliente.notas ? (
            <p className="mt-3 border-l-4 border-sol pl-3 text-sm text-noche/80">{pedido.cliente.notas}</p>
          ) : null}
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div className="text-sm text-noche/70">
            <p>
              {pedido.cliente.nombre}, {pedido.cliente.telefono}
            </p>
            <p className="mt-1">Entró a las {hora(pedido.creadoEn)}</p>
            <p className="mt-1">
              A {distanciaDe(botilleriaId, pedido.distancias).toString().replace('.', ',')} km del local
            </p>
            <p className="mt-1">
              {pedido.despacho === 0 ? 'Despacho gratis' : `Despacho ${clp(pedido.despacho)}`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => responderOferta(pedido.id, botilleriaId, true)}
              className="rotulo flex-1 bg-noche px-5 py-3 text-base text-lima transition-colors hover:bg-noche-alto"
            >
              Tomar el pedido
            </button>
            <button
              type="button"
              onClick={() => responderOferta(pedido.id, botilleriaId, false)}
              className="rotulo border-2 border-noche/30 px-4 py-3 text-base text-noche/70 transition-colors hover:border-noche hover:text-noche"
            >
              No puedo
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

function TarjetaEnCurso({ pedido }: { pedido: Pedido }) {
  const siguiente = SIGUIENTE[pedido.estado]
  const etiqueta: Record<string, string> = {
    aceptado: 'Tomado, falta armarlo',
    preparando: 'Armando el pedido',
    en_camino: 'Repartidor en la calle',
  }

  return (
    <li className="border-2 border-noche/25 bg-hueso p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="rotulo text-lg text-noche">Pedido {pedido.id}</p>
          <p className="text-sm text-noche/70">
            {pedido.cliente.direccion}, {pedido.cliente.sector}
          </p>
        </div>
        <p className="text-sm text-noche/70">{etiqueta[pedido.estado] ?? pedido.estado}</p>
        <p className="numero text-xl text-noche">{clp(pedido.total)}</p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-noche/70">
        {pedido.items.map((i) => (
          <li key={i.productoId}>
            <span className="numero">{i.cantidad}</span> {i.nombre}
          </li>
        ))}
      </ul>

      {siguiente ? (
        <button
          type="button"
          onClick={() => empujarEstado(pedido.id)}
          className="rotulo mt-4 border-2 border-noche px-5 py-2.5 text-base text-noche transition-colors hover:bg-noche hover:text-hueso"
        >
          {siguiente}
        </button>
      ) : null}
    </li>
  )
}
