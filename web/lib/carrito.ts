'use client'

// Carrito como store externo, igual que los pedidos: el estado vive fuera de React,
// se persiste en localStorage y se lee con useSyncExternalStore. Así el servidor
// renderiza un carro vacío sin desalinear la hidratación.
import { useSyncExternalStore } from 'react'
import { COSTO_DESPACHO, DESPACHO_GRATIS_DESDE, type LineaPack } from './motor'
import type { ProductoLigero } from './producto'

export type ItemCarrito = { producto: ProductoLigero; cantidad: number }

export type EstadoCarrito = {
  items: ItemCarrito[]
  receta: { id: string; nombre: string } | null
  abierto: boolean
}

const CLAVE = 'edrink.carrito.v1'
const VACIO: EstadoCarrito = { items: [], receta: null, abierto: false }

let estado: EstadoCarrito = VACIO
let iniciado = false
const oyentes = new Set<() => void>()

function leerDisco(): EstadoCarrito {
  try {
    const bruto = window.localStorage.getItem(CLAVE)
    if (!bruto) return VACIO
    const datos = JSON.parse(bruto) as EstadoCarrito
    if (!Array.isArray(datos.items)) return VACIO
    return { items: datos.items, receta: datos.receta ?? null, abierto: false }
  } catch {
    return VACIO
  }
}

function escribir(nuevo: EstadoCarrito) {
  estado = nuevo
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify({ items: nuevo.items, receta: nuevo.receta }))
  } catch {
    // Modo privado: el carro vive solo en memoria.
  }
  for (const fn of oyentes) fn()
}

function suscribir(fn: () => void): () => void {
  if (!iniciado && typeof window !== 'undefined') {
    iniciado = true
    estado = leerDisco()
  }
  oyentes.add(fn)
  return () => {
    oyentes.delete(fn)
  }
}

export function agregar(producto: ProductoLigero, cantidad = 1) {
  const i = estado.items.findIndex((x) => x.producto.id === producto.id)
  if (i === -1) {
    escribir({ ...estado, items: [...estado.items, { producto, cantidad }] })
    return
  }
  const items = [...estado.items]
  items[i] = { ...items[i], cantidad: items[i].cantidad + cantidad }
  escribir({ ...estado, items })
}

export function agregarPack(lineas: LineaPack[], receta: { id: string; nombre: string }) {
  const items = [...estado.items]
  for (const linea of lineas) {
    const i = items.findIndex((x) => x.producto.id === linea.producto.id)
    if (i === -1) items.push({ producto: linea.producto, cantidad: linea.unidades })
    else items[i] = { ...items[i], cantidad: items[i].cantidad + linea.unidades }
  }
  escribir({ ...estado, items, receta })
}

export function cambiarCantidad(productoId: number, cantidad: number) {
  escribir({
    ...estado,
    items:
      cantidad <= 0
        ? estado.items.filter((x) => x.producto.id !== productoId)
        : estado.items.map((x) => (x.producto.id === productoId ? { ...x, cantidad } : x)),
  })
}

export function quitar(productoId: number) {
  escribir({ ...estado, items: estado.items.filter((x) => x.producto.id !== productoId) })
}

export function vaciar() {
  escribir({ ...estado, items: [], receta: null })
}

export function abrirCarro() {
  escribir({ ...estado, abierto: true })
}

export function cerrarCarro() {
  escribir({ ...estado, abierto: false })
}

const snapshot = () => estado
const snapshotServidor = () => VACIO

export type Carrito = EstadoCarrito & {
  unidades: number
  subtotal: number
  despacho: number
  total: number
}

export function useCarrito(): Carrito {
  const actual = useSyncExternalStore(suscribir, snapshot, snapshotServidor)
  const subtotal = actual.items.reduce((s, x) => s + x.producto.precio * x.cantidad, 0)
  const despacho = subtotal === 0 || subtotal >= DESPACHO_GRATIS_DESDE ? 0 : COSTO_DESPACHO
  return {
    ...actual,
    unidades: actual.items.reduce((s, x) => s + x.cantidad, 0),
    subtotal,
    despacho,
    total: subtotal + despacho,
  }
}
