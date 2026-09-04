import { Bartender } from '@/components/Bartender'
import { CajonCarrito } from '@/components/CajonCarrito'
import { ComoFunciona } from '@/components/ComoFunciona'
import { Encabezado } from '@/components/Encabezado'
import { Pie } from '@/components/Pie'
import { Vitrina, type Estante } from '@/components/Vitrina'
import { EXTRAIDO_EL, opcionesPorRol, porCategoria, resumenCatalogo } from '@/lib/catalogo'
import { aligerar } from '@/lib/producto'

export default function Pagina() {
  const opciones = opcionesPorRol()
  const resumen = resumenCatalogo()

  const estantes: Estante[] = [
    {
      titulo: 'Para la base',
      nota: 'destilados que aguantan una noche entera',
      productos: [
        ...porCategoria('pisco', 4),
        ...porCategoria('gin', 3),
        ...porCategoria('whisky', 3),
        ...porCategoria('ron', 2),
      ].map(aligerar),
    },
    {
      titulo: 'Para mezclar',
      nota: 'bebidas y jugos, con el precio por litro que conviene',
      productos: [...porCategoria('bebidas', 7), ...porCategoria('aguas-y-jugos', 5)].map(aligerar),
    },
    {
      titulo: 'Para picar',
      nota: 'lo que se termina antes que el trago',
      productos: porCategoria('snack', 10).map(aligerar),
    },
  ]

  return (
    <>
      <Encabezado />
      <main>
        <Bartender opciones={opciones} totalProductos={resumen.total} />
        <Vitrina estantes={estantes} extraidoEl={EXTRAIDO_EL} />
        <ComoFunciona />
      </main>
      <Pie totalProductos={resumen.total} />
      <CajonCarrito />
    </>
  )
}
