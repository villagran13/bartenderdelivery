/** Un producto tal como lo publica el catálogo de www.edrink.cl. */
export type Producto = {
  id: number
  nombre: string
  /** Título original en mayúsculas, que es contra lo que hacen match los roles. */
  busqueda: string
  marca: string | null
  precio: number
  ml: number | null
  formato: string | null
  grados: number | null
  imagen: string | null
  categorias: string[]
  stock: number
  url: string
  descripcion: string
}

/** Lo mínimo que viaja al navegador para armar packs y carrito. */
export type ProductoLigero = Pick<
  Producto,
  'id' | 'nombre' | 'marca' | 'precio' | 'ml' | 'formato' | 'grados' | 'imagen' | 'url'
>

/** Productos ya elegidos para cada rol de receta. Es lo único del catálogo que viaja al cliente. */
export type OpcionesPorRol = Partial<Record<string, ProductoLigero[]>>

export function aligerar(p: Producto): ProductoLigero {
  return {
    id: p.id,
    nombre: p.nombre,
    marca: p.marca,
    precio: p.precio,
    ml: p.ml,
    formato: p.formato,
    grados: p.grados,
    imagen: p.imagen,
    url: p.url,
  }
}
