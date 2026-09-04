'use client'

import { useMemo, useRef, useState } from 'react'
import { Boton, Chip, Pregunta } from '@/components/ui'
import { TarjetaSugerencia } from '@/components/TarjetaSugerencia'
import {
  CASA_DECLARABLES,
  PREFERENCIAS_INICIALES,
  ROLES_DECLARABLES,
  contarPosibles,
  sugerir,
  type Preferencias,
  type Resultado,
} from '@/lib/motor'
import type { OpcionesPorRol } from '@/lib/producto'
import { PERFILES, RECETAS, type Perfil } from '@/lib/recetas'
import { DE_CASA, POR_ID, type CasaId, type RolId } from '@/lib/roles'

const BASES: RolId[] = ['pisco', 'gin', 'vodka', 'whisky', 'ron-blanco', 'ron-anejo', 'tequila']

const INTENSIDADES: { valor: 1 | 2 | 3; nombre: string; detalle: string }[] = [
  { valor: 1, nombre: 'Suave', detalle: 'para la tarde' },
  { valor: 2, nombre: 'Medio', detalle: 'el punto justo' },
  { valor: 3, nombre: 'Cargado', detalle: 'se nota el trago' },
]

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor]
}

export function Bartender({ opciones, totalProductos }: { opciones: OpcionesPorRol; totalProductos: number }) {
  const [prefs, setPrefs] = useState<Preferencias>(PREFERENCIAS_INICIALES)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const resultadosRef = useRef<HTMLDivElement>(null)

  const posibles = useMemo(() => contarPosibles(prefs, opciones), [prefs, opciones])
  const sinElegir =
    prefs.perfiles.length === 0 && prefs.bases.length === 0 && !prefs.intensidad && !prefs.sinAlcohol
  const basesConStock = useMemo(() => BASES.filter((b) => (opciones[b]?.length ?? 0) > 0), [opciones])
  const rolesDeclarables = useMemo(
    () => ROLES_DECLARABLES.filter((r) => (opciones[r]?.length ?? 0) > 0),
    [opciones],
  )

  function cambiar(parcial: Partial<Preferencias>) {
    setPrefs((p) => ({ ...p, ...parcial }))
  }

  function armar() {
    const r = sugerir(prefs, opciones)
    setResultado(r)
    window.requestAnimationFrame(() => {
      resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-6 sm:pt-20">
        <h1 className="titular text-titan text-hueso">
          Tú dices el gusto.
          <br />
          Yo pongo las botellas.
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
          <p className="max-w-[52ch] text-lg leading-relaxed text-bruma">
            Cuéntame cómo te gusta tomar o qué tienes dando vueltas en la casa. Armo la receta con lo que hay hoy
            en la bodega de Edrink y te dejo el pack listo para pedir en Santiago.
          </p>

          <div className="border border-noche-borde bg-noche-alto/60 p-6">
            <p className="numero text-[4.5rem] leading-none text-lima">{posibles}</p>
            <p className="mt-1 text-lg text-hueso">
              {sinElegir
                ? posibles === 1
                  ? 'trago posible con el stock de hoy'
                  : 'tragos posibles con el stock de hoy'
                : posibles === 1
                  ? 'trago calza con lo que elegiste'
                  : 'tragos calzan con lo que elegiste'}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-bruma">
              De {RECETAS.length} recetas cruzadas contra {totalProductos} productos del catálogo de Edrink, con
              precio y stock de hoy.
            </p>
            <Boton variante="sol" tamano="grande" onClick={armar} className="mt-6 w-full">
              {posibles === 0 ? 'Ver lo más parecido' : 'Armar mi trago'}
            </Boton>
            {posibles === 0 ? (
              <p className="mt-3 text-sm text-sol">
                Con esa combinación exacta no queda ninguna receta en pie. Quita un sabor o cambia la base, o
                mira lo más cercano que tengo.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-14 grid gap-9 border-t border-noche-borde pt-10 lg:grid-cols-2">
          <Pregunta texto="¿Cómo lo quieres?">
            {PERFILES.map((p) => (
              <Chip
                key={p.id}
                activo={prefs.perfiles.includes(p.id)}
                onClick={() => cambiar({ perfiles: alternar<Perfil>(prefs.perfiles, p.id) })}
                detalle={p.descripcion}
              >
                {p.nombre}
              </Chip>
            ))}
          </Pregunta>

          <Pregunta texto="¿Con qué base?">
            {basesConStock.map((b) => (
              <Chip
                key={b}
                activo={prefs.bases.includes(b)}
                onClick={() => cambiar({ bases: alternar<RolId>(prefs.bases, b), sinAlcohol: false })}
              >
                {POR_ID[b].nombre}
              </Chip>
            ))}
            <Chip
              activo={prefs.sinAlcohol}
              onClick={() => cambiar({ sinAlcohol: !prefs.sinAlcohol, bases: [] })}
            >
              Sin alcohol
            </Chip>
          </Pregunta>

          <Pregunta texto="¿Qué tan cargado?">
            {INTENSIDADES.map((i) => (
              <Chip
                key={i.valor}
                activo={prefs.intensidad === i.valor}
                onClick={() => cambiar({ intensidad: prefs.intensidad === i.valor ? null : i.valor })}
                detalle={i.detalle}
              >
                {i.nombre}
              </Chip>
            ))}
          </Pregunta>

          <div>
            <p className="rotulo mb-3 text-lg text-hueso">¿Para cuántos?</p>
            <div className="flex flex-wrap items-center gap-6">
              <Contador
                valor={prefs.personas}
                min={1}
                max={30}
                etiqueta={prefs.personas === 1 ? 'persona' : 'personas'}
                onCambio={(personas) => cambiar({ personas })}
              />
              <Contador
                valor={prefs.tragosPorPersona}
                min={1}
                max={5}
                etiqueta={prefs.tragosPorPersona === 1 ? 'trago cada uno' : 'tragos cada uno'}
                onCambio={(tragosPorPersona) => cambiar({ tragosPorPersona })}
              />
            </div>
            <p className="mt-4 text-sm text-bruma">
              Con esto calculo cuántas botellas van al carro, no solo la receta para un vaso.
            </p>
          </div>

          <div className="lg:col-span-2">
            <p className="rotulo mb-3 text-lg text-hueso">¿Qué tienes ya en la casa?</p>
            <div className="flex flex-wrap gap-2">
              {CASA_DECLARABLES.map((c) => (
                <Chip
                  key={c}
                  activo={prefs.tengo.includes(c)}
                  onClick={() => cambiar({ tengo: alternar<string>(prefs.tengo, c) })}
                >
                  {DE_CASA[c as CasaId]}
                </Chip>
              ))}
              {rolesDeclarables.map((r) => (
                <Chip
                  key={r}
                  activo={prefs.tengo.includes(r)}
                  onClick={() => cambiar({ tengo: alternar<string>(prefs.tengo, r) })}
                >
                  {POR_ID[r].nombre}
                </Chip>
              ))}
            </div>
            <p className="mt-4 text-sm text-bruma">
              Lo que marques no se cobra: sale del pack y baja el total.
            </p>
          </div>
        </div>
      </section>

      <div ref={resultadosRef} className="scroll-mt-20">
        {resultado ? <Resultados resultado={resultado} prefs={prefs} opciones={opciones} /> : null}
      </div>
    </>
  )
}

function Contador({
  valor,
  min,
  max,
  etiqueta,
  onCambio,
}: {
  valor: number
  min: number
  max: number
  etiqueta: string
  onCambio: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border border-noche-borde bg-noche-alto/60">
        <button
          type="button"
          onClick={() => onCambio(Math.max(min, valor - 1))}
          aria-label={`Quitar uno a ${etiqueta}`}
          className="px-3 py-2 text-xl text-bruma transition-colors hover:text-sol"
        >
          −
        </button>
        <span className="numero min-w-10 text-center text-2xl text-hueso">{valor}</span>
        <button
          type="button"
          onClick={() => onCambio(Math.min(max, valor + 1))}
          aria-label={`Sumar uno a ${etiqueta}`}
          className="px-3 py-2 text-xl text-bruma transition-colors hover:text-sol"
        >
          +
        </button>
      </div>
      <span className="text-base text-bruma">{etiqueta}</span>
    </div>
  )
}

function Resultados({
  resultado,
  prefs,
  opciones,
}: {
  resultado: Resultado
  prefs: Preferencias
  opciones: OpcionesPorRol
}) {
  const { calzan, alternativas } = resultado

  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-noche-borde pb-5">
        <h2 className="titular text-grande text-hueso">
          {calzan.length ? 'Lo que te recomiendo' : 'Con eso exacto no tengo nada'}
        </h2>
        <p className="max-w-[46ch] text-sm text-bruma">
          {calzan.length
            ? 'Todos llevan lo que pediste. Ordenados por lo que más calza.'
            : 'Ninguna receta cumple las tres cosas al mismo tiempo. Suelta un filtro arriba o mira lo más cercano.'}
        </p>
      </div>

      {calzan.length ? (
        <div className="mt-8 space-y-10">
          {calzan.map((s, i) => (
            <TarjetaSugerencia
              key={s.receta.id}
              sugerencia={s}
              destacada={i === 0}
              prefs={prefs}
              opciones={opciones}
            />
          ))}
        </div>
      ) : null}

      {alternativas.length ? (
        <div className="mt-14 border-t border-noche-borde pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h3 className="titular text-2xl text-hueso">Si abres la mano</h3>
            <p className="max-w-[46ch] text-sm text-bruma">
              Estos no calzan con todo lo que pediste. Cada uno dice en qué se corre.
            </p>
          </div>
          <div className="mt-8 space-y-10">
            {alternativas.map((s) => (
              <TarjetaSugerencia
                key={s.receta.id}
                sugerencia={s}
                destacada={false}
                prefs={prefs}
                opciones={opciones}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
