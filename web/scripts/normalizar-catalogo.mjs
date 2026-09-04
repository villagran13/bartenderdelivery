// Convierte data/catalogo-crudo.json en el catálogo que consume la app.
// Limpia títulos en mayúsculas, separa formato y graduación, y decodifica descripciones.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const crudo = JSON.parse(readFileSync(resolve(RAIZ, 'data/catalogo-crudo.json'), 'utf8'))

const MINUSCULAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'con', 'sin', 'en', 'al', 'a'])
const SIGLAS = new Set(['sos', 'jw', 'ipa', 'xl', 'tv', 'rtd', 'vsop', 'xo'])

const ENTIDADES = {
  '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
  '&ntilde;': 'ñ', '&Ntilde;': 'Ñ', '&uuml;': 'ü', '&Aacute;': 'Á', '&Eacute;': 'É',
  '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú', '&nbsp;': ' ', '&amp;': '&',
  '&quot;': '"', '&#39;': "'", '&rsquo;': "'", '&lsquo;': "'", '&ordm;': '°', '&deg;': '°',
  '&hellip;': '...', '&mdash;': '-', '&ndash;': '-', '&lt;': '<', '&gt;': '>',
}

function limpiarTexto(html) {
  let t = String(html || '').replace(/<[^>]*>/g, ' ')
  for (const [k, v] of Object.entries(ENTIDADES)) t = t.split(k).join(v)
  t = t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  t = t.replace(/\s+/g, ' ').trim()
  return t
}

// "750CC" / "1 LT" / "1.5LT" / "473cc" / "200 ML" -> mililitros
const RE_VOLUMEN = /(\d+(?:[.,]\d+)?)\s*(ML|CC|C|LTS?|LITROS?|L)\b/i
// Formatos escritos sin unidad al final del título, del tipo "FANTA POMELO LATA 350".
const RE_VOLUMEN_SUELTO = /\s(\d{3})\s*$/

function volumen(titulo) {
  const m = titulo.match(RE_VOLUMEN)
  if (m) {
    const n = Number(m[1].replace(',', '.'))
    const u = m[2].toUpperCase()
    const ml = u.startsWith('L') ? n * 1000 : n
    return { ml: Math.round(ml) }
  }
  const suelto = titulo.match(RE_VOLUMEN_SUELTO)
  if (suelto) {
    const n = Number(suelto[1])
    if (n >= 150 && n <= 999) return { ml: n }
  }
  return null
}

function graduacion(titulo) {
  const m = titulo.match(/(\d{2})\s*°/)
  return m ? Number(m[1]) : null
}

function formatoLegible(ml) {
  if (ml == null) return null
  if (ml >= 1000) {
    const l = ml / 1000
    return `${Number.isInteger(l) ? l : l.toFixed(1).replace('.', ',')} L`
  }
  return `${ml} cc`
}

function titulo(bruto) {
  const sinVolumen = bruto
    .replace(new RegExp(RE_VOLUMEN.source, 'gi'), ' ')
    .replace(RE_VOLUMEN_SUELTO, ' ')
    .replace(/\d{2}\s*°/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return sinVolumen
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((p, i) => {
      const limpio = p.replace(/[´`]/g, "'")
      if (SIGLAS.has(limpio)) return limpio.toUpperCase()
      if (i > 0 && MINUSCULAS.has(limpio)) return limpio
      if (/^\d/.test(limpio)) return limpio
      return limpio.charAt(0).toUpperCase() + limpio.slice(1)
    })
    .join(' ')
}

const productos = crudo.productos
  .filter((p) => p.price != null && p.price > 0 && p.title)
  .map((p) => {
    const vol = volumen(p.title)
    return {
      id: p.id,
      nombre: titulo(p.title),
      busqueda: p.title.toUpperCase(),
      marca: p.brand ? titulo(p.brand) : null,
      precio: Math.round(p.price),
      ml: vol?.ml ?? null,
      formato: formatoLegible(vol?.ml ?? null),
      grados: graduacion(p.title),
      imagen: p.image,
      categorias: p.collections,
      stock: p.stock ?? 0,
      url: `https://www.edrink.cl${p.link}`,
      descripcion: limpiarTexto(p.descriptionHtml).slice(0, 220),
    }
  })
  .sort((a, b) => a.precio - b.precio)

const colecciones = crudo.colecciones.filter((c) => c.cantidad > 0)

// Se emite como módulo TypeScript con tipo explícito: importar un JSON de 300 KB
// obliga a tsc a inferir el tipo literal de cada producto y la revisión se vuelve lentísima.
const modulo = `// Generado por scripts/normalizar-catalogo.mjs. No editar a mano.
// Fuente: ${crudo.fuente} — extraído el ${crudo.extraidoEl}
import type { Producto } from '../lib/producto'

export const EXTRAIDO_EL = ${JSON.stringify(crudo.extraidoEl)}
export const FUENTE = ${JSON.stringify(crudo.fuente)}

export const COLECCIONES: { slug: string; nombre: string; cantidad: number }[] = ${JSON.stringify(colecciones)}

export const PRODUCTOS: Producto[] = ${JSON.stringify(productos)}
`

const destino = resolve(RAIZ, 'data/catalogo.ts')
writeFileSync(destino, modulo)
console.log(`${productos.length} productos normalizados -> ${destino} (${Math.round(Buffer.byteLength(modulo) / 1024)} KB)`)
