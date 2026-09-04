// Resolución del catálogo real contra los roles de receta. Solo se ejecuta en el servidor:
// el navegador recibe únicamente los productos ya elegidos para cada rol.
import { COLECCIONES, EXTRAIDO_EL, FUENTE, PRODUCTOS } from '../data/catalogo'
import { aligerar, type OpcionesPorRol, type Producto } from './producto'
import { DEFINICIONES, type DefinicionRol } from './roles'

export { COLECCIONES, EXTRAIDO_EL, FUENTE, PRODUCTOS }
export type { OpcionesPorRol }

function califica(p: Producto, def: DefinicionRol): boolean {
  if (def.categorias && !def.categorias.some((c) => p.categorias.includes(c))) return false
  if (def.incluye && !def.incluye.test(p.busqueda)) return false
  if (def.excluye && def.excluye.test(p.busqueda)) return false
  return true
}

/**
 * Los mixers y jugos se ordenan por precio por mililitro: para ocho personas conviene
 * el desechable de 3 L antes que seis latas. Los destilados se ordenan por precio,
 * descartando primero los formatos que no sirven para un pack.
 */
function ordenar(def: DefinicionRol, a: Producto, b: Producto): number {
  const formatoOk = (p: Producto) => (def.mlMinimo ? ((p.ml ?? 0) >= def.mlMinimo ? 0 : 1) : 0)
  const dif = formatoOk(a) - formatoOk(b)
  if (dif !== 0) return dif
  const porValor = def.tipo === 'mixer' || def.tipo === 'jugo'
  if (porValor) {
    const valor = (p: Producto) => (p.ml ? p.precio / p.ml : Number.MAX_SAFE_INTEGER)
    const v = valor(a) - valor(b)
    if (Math.abs(v) > 0.0001) return v
  }
  return a.precio - b.precio
}

export function opcionesDeRol(def: DefinicionRol, max = 5): Producto[] {
  const candidatos = PRODUCTOS.filter((p) => califica(p, def))
  const conStock = candidatos.filter((p) => p.stock > 0)
  const base = conStock.length >= 2 ? conStock : candidatos
  return [...base].sort((a, b) => ordenar(def, a, b)).slice(0, max)
}

/** Tabla rol -> productos que el motor de recetas usa en el navegador. */
export function opcionesPorRol(): OpcionesPorRol {
  const tabla: OpcionesPorRol = {}
  for (const def of DEFINICIONES) {
    const opciones = opcionesDeRol(def)
    if (opciones.length) tabla[def.id] = opciones.map(aligerar)
  }
  return tabla
}

export function porCategoria(slug: string, max = 12): Producto[] {
  return PRODUCTOS.filter((p) => p.categorias.includes(slug)).slice(0, max)
}

export function buscar(texto: string, max = 24): Producto[] {
  const t = texto.trim().toUpperCase()
  if (!t) return []
  return PRODUCTOS.filter((p) => p.busqueda.includes(t)).slice(0, max)
}

export function resumenCatalogo() {
  const conStock = PRODUCTOS.filter((p) => p.stock > 0).length
  const precios = PRODUCTOS.map((p) => p.precio)
  return {
    total: PRODUCTOS.length,
    conStock,
    colecciones: COLECCIONES.length,
    precioMinimo: Math.min(...precios),
    precioMaximo: Math.max(...precios),
    extraidoEl: EXTRAIDO_EL,
  }
}
