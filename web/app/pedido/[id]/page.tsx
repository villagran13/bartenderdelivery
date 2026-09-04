import { Encabezado } from '@/components/Encabezado'
import { SeguimientoPedido } from '@/components/SeguimientoPedido'

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <Encabezado />
      <SeguimientoPedido id={id} />
    </>
  )
}
