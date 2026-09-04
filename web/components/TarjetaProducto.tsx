'use client'

import { useState } from 'react'
import { ImagenProducto } from '@/components/ImagenProducto'
import { agregar } from '@/lib/carrito'
import { clp } from '@/lib/formato'
import type { ProductoLigero } from '@/lib/producto'

export function TarjetaProducto({ producto }: { producto: ProductoLigero }) {
  const [sumado, setSumado] = useState(false)

  return (
    <article className="flex w-52 shrink-0 flex-col border border-noche-borde bg-noche-alto/40">
      <div className="flex items-center justify-center bg-hueso p-3">
        <ImagenProducto src={producto.imagen} alt={producto.nombre} lado={110} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm leading-snug text-hueso">{producto.nombre}</p>
        <p className="mt-1 text-xs text-bruma">
          {[producto.formato, producto.grados ? `${producto.grados}°` : null].filter(Boolean).join(' / ') || ' '}
        </p>
        <p className="numero mt-3 text-xl text-lima">{clp(producto.precio)}</p>
        <button
          type="button"
          onClick={() => {
            agregar(producto)
            setSumado(true)
          }}
          className="rotulo mt-3 border border-noche-borde py-2 text-sm text-hueso transition-colors hover:border-sol hover:text-sol"
        >
          {sumado ? 'En el carro' : 'Agregar'}
        </button>
      </div>
    </article>
  )
}
