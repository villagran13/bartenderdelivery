'use client'

import { useMemo, useState } from 'react'
import { ImagenProducto } from '@/components/ImagenProducto'
import { Boton, Etiqueta } from '@/components/ui'
import { abrirCarro, agregarPack } from '@/lib/carrito'
import { clp, volumen } from '@/lib/formato'
import { DESPACHO_GRATIS_DESDE, type LineaPack, type Preferencias, type Sugerencia } from '@/lib/motor'
import type { OpcionesPorRol, ProductoLigero } from '@/lib/producto'
import { DE_CASA, POR_ID } from '@/lib/roles'

const INTENSIDAD_TEXTO = ['', 'suave', 'medio', 'cargado']

export function TarjetaSugerencia({
  sugerencia,
  destacada,
  opciones,
}: {
  sugerencia: Sugerencia
  destacada: boolean
  prefs: Preferencias
  opciones: OpcionesPorRol
}) {
  const { receta, pack, yaTienes, deCasa, tragosTotales, motivos, diferencias } = sugerencia
  const [elegido, setElegido] = useState<Record<string, number>>({})
  const [agregado, setAgregado] = useState(false)

  // El usuario puede cambiar la botella de cada línea; las unidades se recalculan
  // porque un desechable de 3 L no rinde lo mismo que una lata de 350 cc.
  const lineas = useMemo<LineaPack[]>(
    () =>
      pack.map((linea) => {
        const id = elegido[linea.rol]
        if (id == null || id === linea.producto.id) return linea
        const alternativa = (opciones[linea.rol] ?? []).find((p) => p.id === id)
        if (!alternativa) return linea
        const unidades = alternativa.ml
          ? Math.max(1, Math.ceil(linea.mlNecesarios / alternativa.ml))
          : linea.unidades
        return { ...linea, producto: alternativa, unidades, subtotal: unidades * alternativa.precio }
      }),
    [pack, elegido, opciones],
  )

  const total = lineas.reduce((s, l) => s + l.subtotal, 0)
  const porTrago = tragosTotales ? Math.round(total / tragosTotales) : 0

  function agregar() {
    agregarPack(lineas, { id: receta.id, nombre: receta.nombre })
    setAgregado(true)
    abrirCarro()
  }

  return (
    <article
      className={`entrada border bg-noche-alto/40 ${destacada ? 'border-sol/60' : 'border-noche-borde'}`}
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
        <div className="border-b border-noche-borde p-6 sm:p-8 lg:border-r lg:border-b-0">
          <div className="flex flex-wrap items-center gap-2">
            {destacada ? <Etiqueta tono="sol">Mi primera opción</Etiqueta> : null}
            <Etiqueta>{receta.origen}</Etiqueta>
            <Etiqueta>{INTENSIDAD_TEXTO[receta.intensidad]}</Etiqueta>
            <Etiqueta>{receta.minutos} min</Etiqueta>
          </div>

          <h3 className="titular mt-4 text-grande text-hueso">{receta.nombre}</h3>
          <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-bruma">{receta.resumen}</p>

          {diferencias.length ? (
            <ul className="mt-5 space-y-1.5 border-l-2 border-vino pl-4 text-sm text-bruma">
              {diferencias.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : null}

          {motivos.length ? (
            <ul className="mt-5 space-y-1.5 text-sm text-lima">
              {motivos.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-7 border-t border-noche-borde pt-5">
            <p className="rotulo text-base text-hueso">Para un vaso, en {receta.vaso.toLowerCase()}</p>
            <ul className="mt-3 space-y-2">
              {receta.ingredientes.map((ing, i) => {
                const esCasa = !('rol' in ing)
                const nombre = 'rol' in ing ? POR_ID[ing.rol].nombre : DE_CASA[ing.casa]
                return (
                  <li key={`${nombre}-${i}`} className="flex items-baseline justify-between gap-4 text-sm">
                    <span className={esCasa ? 'text-bruma' : 'text-hueso'}>{nombre}</span>
                    <span className="text-right text-bruma">{ing.medida}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <ol className="mt-7 space-y-3 border-t border-noche-borde pt-5">
            {receta.pasos.map((paso, i) => (
              <li key={paso} className="flex gap-4 text-sm leading-relaxed text-bruma">
                <span className="numero shrink-0 text-lg text-sol">{i + 1}</span>
                <span>{paso}</span>
              </li>
            ))}
          </ol>

          <p className="mt-6 border-l-2 border-sol pl-4 text-sm leading-relaxed text-hueso">{receta.tip}</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <p className="rotulo text-base text-hueso">
              El pack para {tragosTotales} {tragosTotales === 1 ? 'trago' : 'tragos'}
            </p>
            <p className="numero text-sm text-bruma">{clp(porTrago)} por trago</p>
          </div>

          <ul className="mt-4 divide-y divide-noche-borde border-y border-noche-borde">
            {lineas.map((linea) => (
              <LineaProducto
                key={linea.rol}
                linea={linea}
                alternativas={opciones[linea.rol] ?? []}
                onElegir={(id) => setElegido((prev) => ({ ...prev, [linea.rol]: id }))}
              />
            ))}
          </ul>

          {yaTienes.length ? (
            <p className="mt-4 text-sm text-bruma">
              Fuera del pack porque ya lo tienes: {yaTienes.map((y) => y.nombre.toLowerCase()).join(', ')}.
            </p>
          ) : null}

          {deCasa.length ? (
            <p className="mt-2 text-sm text-bruma">
              Lo pones tú: {deCasa.map((c) => c.nombre.toLowerCase()).join(', ')}. Edrink no lo vende suelto.
            </p>
          ) : null}

          <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-noche-borde pt-5">
            <span className="rotulo text-lg text-hueso">Total del pack</span>
            <span className="numero text-3xl text-lima">{clp(total)}</span>
          </div>
          <p className="mt-2 text-sm text-bruma">
            {total >= DESPACHO_GRATIS_DESDE
              ? 'Despacho gratis: pasa los $10.000.'
              : `Faltan ${clp(DESPACHO_GRATIS_DESDE - total)} para el despacho gratis.`}
          </p>

          <Boton variante="sol" tamano="grande" onClick={agregar} className="mt-5 w-full">
            {agregado ? 'Sumado al carro' : 'Agregar el pack al carro'}
          </Boton>
        </div>
      </div>
    </article>
  )
}

function LineaProducto({
  linea,
  alternativas,
  onElegir,
}: {
  linea: LineaPack
  alternativas: ProductoLigero[]
  onElegir: (id: number) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const otras = alternativas.filter((p) => p.id !== linea.producto.id)

  return (
    <li className="py-4">
      <div className="flex items-start gap-4">
        <ImagenProducto src={linea.producto.imagen} alt={linea.producto.nombre} lado={56} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-hueso">{linea.producto.nombre}</p>
          <p className="mt-0.5 text-xs text-bruma">
            {[linea.producto.formato, linea.producto.grados ? `${linea.producto.grados}°` : null, linea.nombreRol]
              .filter(Boolean)
              .join(' / ')}
          </p>
          <p className="mt-1 text-xs text-bruma">
            {linea.mlNecesarios > 0
              ? `Necesitas ${volumen(linea.mlNecesarios)} en total`
              : 'Una unidad para picar'}
          </p>
          {otras.length ? (
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              className="mt-2 text-xs text-sol underline underline-offset-4 transition-colors hover:text-hueso"
            >
              {abierto ? 'Cerrar opciones' : `Cambiar por otra (${otras.length})`}
            </button>
          ) : null}
        </div>
        <div className="text-right">
          {linea.unidades > 1 ? (
            <>
              <p className="numero text-base text-hueso">
                {linea.unidades} x {clp(linea.producto.precio)}
              </p>
              <p className="numero mt-0.5 text-sm text-lima">{clp(linea.subtotal)}</p>
            </>
          ) : (
            <p className="numero text-base text-lima">{clp(linea.subtotal)}</p>
          )}
        </div>
      </div>

      {abierto && otras.length ? (
        <ul className="mt-3 space-y-1 border-l border-noche-borde pl-4">
          {otras.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onElegir(p.id)
                  setAbierto(false)
                }}
                className="flex w-full items-baseline justify-between gap-4 py-1.5 text-left text-xs text-bruma transition-colors hover:text-hueso"
              >
                <span className="min-w-0 truncate">
                  {p.nombre}
                  {p.formato ? `, ${p.formato}` : ''}
                </span>
                <span className="numero shrink-0">{clp(p.precio)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}
