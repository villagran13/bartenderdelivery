'use client'

import Link from 'next/link'
import { abrirCarro, useCarrito } from '@/lib/carrito'
import { clp } from '@/lib/formato'

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <Link href="/" className="flex items-baseline gap-2">
      <span className="titular text-2xl text-hueso">edrink</span>
      {compacta ? null : <span className="text-base text-sol">bartender</span>}
    </Link>
  )
}

export function Encabezado() {
  const { unidades, subtotal } = useCarrito()

  return (
    <header className="sticky top-0 z-40 border-b border-noche-borde/70 bg-noche/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Marca />
        <div className="flex items-center gap-3">
          <Link
            href="/botilleria"
            className="hidden text-sm text-bruma transition-colors hover:text-hueso sm:block"
          >
            Panel de botillería
          </Link>
          <button
            type="button"
            onClick={abrirCarro}
            className="rotulo flex items-center gap-2 rounded-sm border border-noche-borde bg-noche-alto px-4 py-2 text-sm transition-colors hover:border-sol"
          >
            <span>Carro</span>
            <span className="numero text-sol">{unidades}</span>
            {subtotal > 0 ? <span className="numero text-bruma">{clp(subtotal)}</span> : null}
          </button>
        </div>
      </div>
    </header>
  )
}
