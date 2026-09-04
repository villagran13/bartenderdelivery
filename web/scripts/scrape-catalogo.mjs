// Extrae el catálogo público de www.edrink.cl (tienda Bsale).
// Las páginas de colección traen los productos embebidos en window.INIT.collections.push({...}).
// Salida: data/catalogo-crudo.json
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'https://www.edrink.cl'
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
const BACKSLASH = 92

async function texto(url) {
  const r = await fetch(url, { headers: UA })
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`)
  return r.text()
}

// Recorre el objeto JSON que sigue al marcador contando llaves fuera de string.
function extraerColecciones(html) {
  const marcador = 'window.INIT.collections.push('
  const bloques = []
  let desde = 0
  for (;;) {
    const i = html.indexOf(marcador, desde)
    if (i === -1) break
    let j = i + marcador.length
    while (html[j] !== '{' && j < html.length) j++
    const inicio = j
    let nivel = 0
    let enTexto = false
    let escapado = false
    for (; j < html.length; j++) {
      const c = html[j]
      if (enTexto) {
        if (escapado) escapado = false
        else if (c.charCodeAt(0) === BACKSLASH) escapado = true
        else if (c === '"') enTexto = false
        continue
      }
      if (c === '"') enTexto = true
      else if (c === '{') nivel++
      else if (c === '}') {
        nivel--
        if (nivel === 0) {
          j++
          break
        }
      }
    }
    try {
      bloques.push(JSON.parse(html.slice(inicio, j)))
    } catch (e) {
      console.error('  no se pudo parsear un bloque:', e.message)
    }
    desde = j
  }
  return bloques
}

const sitemap = await texto(`${BASE}/sitemap.xml`)
const home = await texto(BASE)
const slugs = [...new Set([...(sitemap + home).matchAll(/collection\/([a-z0-9-]+)/g)].map((m) => m[1]))]
console.log(`colecciones detectadas: ${slugs.length}`)

const productos = new Map()
const colecciones = []

for (const slug of slugs) {
  let html
  try {
    html = await texto(`${BASE}/collection/${slug}?limit=300&with_stock=0`)
  } catch (e) {
    console.error(`${slug}: ${e.message}`)
    continue
  }
  const bloques = extraerColecciones(html)
  const items = bloques.flatMap((b) => b.items || [])
  if (!items.length) continue
  colecciones.push({ slug, nombre: bloques[0]?.name || slug, cantidad: items.length })
  console.log(`  ${slug}: ${items.length}`)
  for (const it of items) {
    if (!productos.has(it.productId)) {
      productos.set(it.productId, {
        id: it.productId,
        title: it.title,
        link: it.link,
        price: it.finalPrice ?? it.variantMinFinalPrice ?? null,
        image: it.defaultImage || null,
        brand: it.brand?.name || null,
        stock: it.totalStock ?? null,
        descriptionHtml: it.description || '',
        collections: [],
      })
    }
    const p = productos.get(it.productId)
    if (!p.collections.includes(slug)) p.collections.push(slug)
  }
}

const salida = resolve(RAIZ, 'data/catalogo-crudo.json')
mkdirSync(dirname(salida), { recursive: true })
writeFileSync(
  salida,
  JSON.stringify(
    { extraidoEl: new Date().toISOString(), fuente: BASE, colecciones, productos: [...productos.values()] },
    null,
    2,
  ),
)
console.log(`productos únicos: ${productos.size} -> ${salida}`)
