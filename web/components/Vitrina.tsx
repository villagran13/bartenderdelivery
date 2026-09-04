import { TarjetaProducto } from '@/components/TarjetaProducto'
import type { ProductoLigero } from '@/lib/producto'

export type Estante = { titulo: string; nota: string; productos: ProductoLigero[] }

export function Vitrina({ estantes, extraidoEl }: { estantes: Estante[]; extraidoEl: string }) {
  const fecha = new Date(extraidoEl).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <section id="bodega" className="border-t border-noche-borde bg-tinta/60 py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="titular text-grande text-hueso">Lo que hay hoy en la bodega</h2>
          <p className="max-w-[42ch] text-sm text-bruma">
            Precios y stock tomados del catálogo de edrink.cl el {fecha}. El bartender solo recomienda lo que la
            botillería puede despachar.
          </p>
        </div>

        <div className="mt-10 space-y-12">
          {estantes.map((estante) => (
            <div key={estante.titulo}>
              <div className="flex items-baseline gap-4">
                <h3 className="rotulo text-xl text-hueso">{estante.titulo}</h3>
                <p className="text-sm text-bruma">{estante.nota}</p>
              </div>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-3">
                {estante.productos.map((p) => (
                  <TarjetaProducto key={p.id} producto={p} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
