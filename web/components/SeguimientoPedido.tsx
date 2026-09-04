'use client'

import Link from 'next/link'
import { ImagenProducto } from '@/components/ImagenProducto'
import { RadarDespacho } from '@/components/RadarDespacho'
import { Boton, Etiqueta } from '@/components/ui'
import { POR_ID, RADIOS_KM, distanciaDe } from '@/lib/botillerias'
import { clp, hora, segundosHasta } from '@/lib/formato'
import { useAhora } from '@/lib/reloj'
import {
  cancelarPedido,
  reintentar,
  useMotorDespacho,
  usePedido,
  type EstadoPedido,
  type Pedido,
} from '@/lib/pedidos'

const ETAPAS: { estado: EstadoPedido; nombre: string }[] = [
  { estado: 'buscando', nombre: 'Buscando' },
  { estado: 'aceptado', nombre: 'Tomado' },
  { estado: 'preparando', nombre: 'Armando' },
  { estado: 'en_camino', nombre: 'En camino' },
  { estado: 'entregado', nombre: 'Entregado' },
]

export function SeguimientoPedido({ id }: { id: string }) {
  useMotorDespacho()
  const pedido = usePedido(id)
  const ahora = useAhora()

  if (ahora === 0) {
    return <Aviso titulo="Abriendo el pedido" texto="Un segundo." />
  }

  if (!pedido) {
    return (
      <Aviso
        titulo={`No encuentro el pedido ${id}`}
        texto="Los pedidos de esta demostración se guardan en el navegador donde se hicieron. Si abriste el enlace en otro equipo o borraste los datos del sitio, ya no está."
      />
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm text-bruma transition-colors hover:text-hueso">
          Volver al bartender
        </Link>
        <div className="flex items-center gap-2">
          <Etiqueta>Pedido {pedido.id}</Etiqueta>
          <Etiqueta tono="sol">simulación acelerada</Etiqueta>
        </div>
      </div>

      <Titular pedido={pedido} ahora={ahora} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-noche-borde bg-noche-alto/40 p-6">
          <RadarDespacho pedido={pedido} />
          <p className="mt-4 text-center text-sm text-bruma">
            {pedido.estado === 'buscando'
              ? `Sonando en ${pedido.ofertas.filter((o) => o.respuesta === 'pendiente').length} botillerías${
                  pedido.modo === 'auto'
                    ? `, dentro de ${(RADIOS_KM[pedido.ronda - 1] ?? RADIOS_KM[RADIOS_KM.length - 1])
                        .toString()
                        .replace('.', ',')} km`
                    : ' de toda la ciudad'
                }`
              : pedido.botilleriaId
                ? `${POR_ID[pedido.botilleriaId]?.nombre} a ${distanciaDe(pedido.botilleriaId, pedido.distancias)
                    .toString()
                    .replace('.', ',')} km de tu dirección`
                : 'La red quedó en silencio'}
          </p>
        </div>

        <div>
          <Etapas pedido={pedido} />
          <Respuestas pedido={pedido} ahora={ahora} />
          <Detalle pedido={pedido} />
        </div>
      </div>

      <Bitacora pedido={pedido} />

      <div className="mt-10 flex flex-wrap gap-3">
        {pedido.estado === 'sin_cobertura' || pedido.estado === 'cancelado' ? (
          <Boton variante="sol" onClick={() => reintentar(pedido.id)}>
            Volver a enviarlo
          </Boton>
        ) : null}
        {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' ? (
          <Boton variante="contorno" onClick={() => cancelarPedido(pedido.id)}>
            Cancelar el pedido
          </Boton>
        ) : null}
        <Link
          href="/botilleria"
          className="rotulo border border-lima px-5 py-2.5 text-base text-lima transition-colors hover:bg-lima hover:text-noche"
        >
          Abrir el panel de botillería
        </Link>
      </div>
    </main>
  )
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-5">
      <h1 className="titular text-grande text-hueso">{titulo}</h1>
      <p className="mt-4 text-base leading-relaxed text-bruma">{texto}</p>
      <Link
        href="/"
        className="rotulo mt-8 self-start border border-sol px-5 py-2.5 text-base text-sol transition-colors hover:bg-sol hover:text-noche"
      >
        Armar otro trago
      </Link>
    </main>
  )
}

function Titular({ pedido, ahora }: { pedido: Pedido; ahora: number }) {
  const botilleria = pedido.botilleriaId ? POR_ID[pedido.botilleriaId] : null
  const radio = RADIOS_KM[pedido.ronda - 1] ?? RADIOS_KM[RADIOS_KM.length - 1]
  const pendientes = pedido.ofertas.filter((o) => o.respuesta === 'pendiente')
  const cierreRonda = pendientes.length ? Math.min(...pendientes.map((o) => o.venceEn)) : null

  const copia: Record<EstadoPedido, { titulo: string; texto: string }> = {
    buscando: {
      titulo: 'Buscando quién lo tome',
      texto:
        pedido.modo === 'manual'
          ? `${pendientes.length} botillerías de la red tienen el pedido en pantalla y esperan tu decisión. Ábrelo en el panel de botillería y tómalo.`
          : `Ronda ${pedido.ronda}: ${pendientes.length} ${
              pendientes.length === 1 ? 'botillería' : 'botillerías'
            } a menos de ${radio.toString().replace('.', ',')} km${
              cierreRonda ? `, quedan ${segundosHasta(cierreRonda, ahora)} segundos` : ''
            }.`,
    },
    aceptado: {
      titulo: `${botilleria?.nombre ?? 'Una botillería'} tomó tu pedido`,
      texto: `${botilleria?.direccion ?? ''}. Confirma el stock y empieza a armarlo.`,
    },
    preparando: {
      titulo: 'Están armando tu pedido',
      texto: `${botilleria?.nombre ?? 'La botillería'} junta las botellas del pack.`,
    },
    en_camino: {
      titulo: 'Va en camino',
      texto: `Sale de ${botilleria?.sector ?? 'la botillería'} hacia ${pedido.cliente.direccion}.`,
    },
    entregado: {
      titulo: 'Entregado',
      texto: 'Que lo disfrutes. Prohibida la venta a menores de 18 años.',
    },
    sin_cobertura: {
      titulo: 'Ninguna botillería pudo tomarlo',
      texto: 'Se preguntó en toda la ciudad y nadie está disponible. Puedes reenviarlo.',
    },
    cancelado: {
      titulo: 'Pedido cancelado',
      texto: 'No se cobró nada.',
    },
  }

  const { titulo, texto } = copia[pedido.estado]

  return (
    <div className="mt-6 border-b border-noche-borde pb-8">
      <h1 className="titular text-grande text-hueso">{titulo}</h1>
      <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-bruma">{texto}</p>
      {pedido.etaMin && pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' ? (
        <p className="numero mt-4 text-2xl text-lima">Llega en unos {pedido.etaMin} minutos</p>
      ) : null}
    </div>
  )
}

function Etapas({ pedido }: { pedido: Pedido }) {
  const indice = ETAPAS.findIndex((e) => e.estado === pedido.estado)
  const detenido = pedido.estado === 'cancelado' || pedido.estado === 'sin_cobertura'

  return (
    <ol className="flex items-center gap-1">
      {ETAPAS.map((etapa, i) => {
        const hecha = !detenido && i <= indice
        return (
          <li key={etapa.estado} className="flex-1">
            <div className={`h-1 ${hecha ? 'bg-lima' : 'bg-noche-borde'}`} />
            <p className={`mt-2 text-xs ${hecha ? 'text-lima' : 'text-bruma/60'}`}>{etapa.nombre}</p>
          </li>
        )
      })}
    </ol>
  )
}

function Respuestas({ pedido, ahora }: { pedido: Pedido; ahora: number }) {
  if (!pedido.ofertas.length) return null
  const ordenadas = [...pedido.ofertas].sort(
    (a, b) => distanciaDe(a.botilleriaId, pedido.distancias) - distanciaDe(b.botilleriaId, pedido.distancias),
  )

  return (
    <div className="mt-8 border border-noche-borde bg-noche-alto/40">
      <p className="rotulo border-b border-noche-borde px-5 py-3 text-base text-hueso">
        Qué contestó cada botillería
      </p>
      <ul className="divide-y divide-noche-borde">
        {ordenadas.map((o) => {
          const b = POR_ID[o.botilleriaId]
          const espera = o.respuesta === 'pendiente' ? segundosHasta(o.venceEn, ahora) : null
          const texto = {
            pendiente: espera != null && espera < 300 ? `sonando, ${espera} s` : 'sonando',
            aceptada: o.respondidaPor === 'panel' ? 'aceptó desde el panel' : 'aceptó',
            rechazada: 'no puede ahora',
            vencida: pedido.botilleriaId ? 'se la ganó otra' : 'no alcanzó a contestar',
          }[o.respuesta]
          const color = {
            pendiente: 'text-lima',
            aceptada: 'text-sol',
            rechazada: 'text-bruma/60',
            vencida: 'text-bruma/60',
          }[o.respuesta]
          return (
            <li key={o.botilleriaId} className="flex items-baseline justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-hueso">{b?.nombre}</p>
                <p className="text-xs text-bruma">
                  {b?.sector}, {distanciaDe(o.botilleriaId, pedido.distancias).toString().replace('.', ',')} km
                </p>
              </div>
              <p className={`shrink-0 text-sm ${color}`}>{texto}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Detalle({ pedido }: { pedido: Pedido }) {
  return (
    <div className="mt-8 border border-noche-borde bg-noche-alto/40">
      <div className="border-b border-noche-borde px-5 py-3">
        <p className="rotulo text-base text-hueso">
          {pedido.receta ? `Pack para ${pedido.receta.nombre.toLowerCase()}` : 'Tu pedido'}
        </p>
        <p className="mt-1 text-xs text-bruma">
          {pedido.cliente.nombre}, {pedido.cliente.direccion}, {pedido.cliente.sector}
        </p>
      </div>
      <ul className="divide-y divide-noche-borde">
        {pedido.items.map((item) => (
          <li key={item.productoId} className="flex items-center gap-3 px-5 py-3">
            <ImagenProducto src={item.imagen} alt={item.nombre} lado={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-hueso">{item.nombre}</p>
              <p className="numero text-xs text-bruma">
                {item.cantidad} x {clp(item.precio)}
              </p>
            </div>
            <p className="numero text-sm text-lima">{clp(item.precio * item.cantidad)}</p>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between border-t border-noche-borde px-5 py-4">
        <span className="rotulo text-base text-hueso">
          Total {pedido.despacho === 0 ? 'con despacho gratis' : 'con despacho'}
        </span>
        <span className="numero text-2xl text-lima">{clp(pedido.total)}</span>
      </div>
    </div>
  )
}

function Bitacora({ pedido }: { pedido: Pedido }) {
  return (
    <div className="mt-10 border-t border-noche-borde pt-6">
      <p className="rotulo text-base text-hueso">Lo que fue pasando</p>
      <ul className="mt-4 space-y-2">
        {pedido.eventos.map((e, i) => (
          <li key={`${e.en}-${i}`} className="flex gap-4 text-sm">
            <span className="numero shrink-0 text-bruma">{hora(e.en)}</span>
            <span className="text-bruma">{e.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
