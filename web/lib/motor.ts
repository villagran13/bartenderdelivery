// Motor de reglas del bartender. No usa servicios externos: puntúa las recetas contra
// las preferencias declaradas y arma el pack de botellas con el catálogo real de Edrink.
import type { OpcionesPorRol, ProductoLigero } from './producto'
import { PERFILES, RECETAS, type Perfil, type Receta } from './recetas'
import { DE_CASA, POR_ID, type CasaId, type RolId } from './roles'

export type Preferencias = {
  perfiles: Perfil[]
  intensidad: 1 | 2 | 3 | null
  bases: RolId[]
  /** Roles y elementos de casa que la persona declara tener. */
  tengo: string[]
  personas: number
  tragosPorPersona: number
  sinAlcohol: boolean
}

export const PREFERENCIAS_INICIALES: Preferencias = {
  perfiles: [],
  intensidad: null,
  bases: [],
  tengo: [],
  personas: 4,
  tragosPorPersona: 2,
  sinAlcohol: false,
}

export type LineaPack = {
  rol: RolId
  nombreRol: string
  producto: ProductoLigero
  unidades: number
  subtotal: number
  mlNecesarios: number
  medida: string
  alternativas: ProductoLigero[]
}

export type Sugerencia = {
  receta: Receta
  puntaje: number
  motivos: string[]
  /** En qué se corre de lo pedido. Vacío quiere decir que calza entera. */
  diferencias: string[]
  pack: LineaPack[]
  yaTienes: { nombre: string; medida: string }[]
  deCasa: { id: CasaId; nombre: string; medida: string }[]
  total: number
  tragosTotales: number
  costoPorTrago: number
}

export const DESPACHO_GRATIS_DESDE = 10000
export const COSTO_DESPACHO = 2490
const MAX_UNIDADES = 24

function rolesDeCatalogo(receta: Receta): { rol: RolId; medida: string }[] {
  return receta.ingredientes.flatMap((i) => ('rol' in i ? [{ rol: i.rol, medida: i.medida }] : []))
}

function elementosDeCasa(receta: Receta): { id: CasaId; nombre: string; medida: string }[] {
  return receta.ingredientes.flatMap((i) =>
    'casa' in i ? [{ id: i.casa, nombre: DE_CASA[i.casa], medida: i.medida }] : [],
  )
}

/** Una receta solo se ofrece si Edrink puede vender todos sus ingredientes. */
export function tieneStock(receta: Receta, opciones: OpcionesPorRol): boolean {
  return rolesDeCatalogo(receta).every(({ rol }) => (opciones[rol]?.length ?? 0) > 0)
}

function nombrePerfil(p: Perfil): string {
  return PERFILES.find((x) => x.id === p)?.nombre.toLowerCase() ?? p
}

/** "dulce", "dulce y cítrico", "dulce, cítrico y fuerte". */
function lista(partes: string[], union = 'y'): string {
  if (partes.length <= 1) return partes[0] ?? ''
  return `${partes.slice(0, -1).join(', ')} ${union} ${partes[partes.length - 1]}`
}

/**
 * Lo que la persona pidió con nombre y apellido no se negocia: el destilado, el perfil
 * de sabor y el "sin alcohol". Una receta que falla cualquiera de estos no calza, y si
 * igual se muestra tiene que ir aparte y con el motivo escrito.
 */
export function calzaConLoPedido(receta: Receta, prefs: Preferencias, opciones: OpcionesPorRol): boolean {
  if (!tieneStock(receta, opciones)) return false
  if (prefs.sinAlcohol !== receta.sinAlcohol) return false
  if (!prefs.sinAlcohol && prefs.bases.length) {
    if (!receta.base || !prefs.bases.includes(receta.base)) return false
  }
  if (prefs.perfiles.length && !prefs.perfiles.some((p) => receta.perfiles.includes(p))) return false
  return true
}

/** En qué se corre una receta respecto de lo pedido. Vacío quiere decir que calza entera. */
export function diferenciasCon(receta: Receta, prefs: Preferencias): string[] {
  const dif: string[] = []

  if (prefs.sinAlcohol && !receta.sinAlcohol) dif.push('Lleva alcohol')
  if (!prefs.sinAlcohol && receta.sinAlcohol) dif.push('No lleva alcohol')

  if (!prefs.sinAlcohol && prefs.bases.length && (!receta.base || !prefs.bases.includes(receta.base))) {
    const pedidas = lista(
      prefs.bases.map((b) => POR_ID[b].nombre.toLowerCase()),
      'ni',
    )
    dif.push(receta.base ? `Lleva ${POR_ID[receta.base].nombre.toLowerCase()}, no ${pedidas}` : `No lleva ${pedidas}`)
  }

  if (prefs.perfiles.length && !prefs.perfiles.some((p) => receta.perfiles.includes(p))) {
    dif.push(`Es ${lista(receta.perfiles.map(nombrePerfil))}`)
  }

  if (prefs.intensidad && receta.intensidad !== prefs.intensidad) {
    dif.push(receta.intensidad < prefs.intensidad ? 'Más suave de lo que pediste' : 'Más cargado de lo que pediste')
  }

  return dif
}

/** Recetas que calzan del todo, con la intensidad pedida si alguna la cumple. */
function candidatasExactas(prefs: Preferencias, opciones: OpcionesPorRol): Receta[] {
  const calzan = RECETAS.filter((r) => calzaConLoPedido(r, prefs, opciones))
  if (!prefs.intensidad) return calzan
  const iguales = calzan.filter((r) => r.intensidad === prefs.intensidad)
  if (iguales.length) return iguales
  const cercanas = calzan.filter((r) => Math.abs(r.intensidad - prefs.intensidad!) === 1)
  return cercanas.length ? cercanas : calzan
}

/** Cuántas recetas siguen calzando con lo elegido. Alimenta el contador del formulario. */
export function contarPosibles(prefs: Preferencias, opciones: OpcionesPorRol): number {
  return candidatasExactas(prefs, opciones).length
}

/** Los que pide todo el mundo. Mandan la carta cuando la persona todavía no elige nada. */
const CLASICOS = new Set([
  'pisco-sour',
  'piscola',
  'gin-tonic',
  'mojito',
  'michelada',
  'terremoto',
  'aperol-spritz',
  'margarita',
])

function sinPreferencias(prefs: Preferencias): boolean {
  return prefs.perfiles.length === 0 && prefs.bases.length === 0 && !prefs.intensidad && !prefs.sinAlcohol
}

function puntuar(receta: Receta, prefs: Preferencias): { puntaje: number; motivos: string[] } {
  let puntaje = 0
  const motivos: string[] = []

  if (CLASICOS.has(receta.id)) {
    puntaje += sinPreferencias(prefs) ? 4 : 1.5
    if (sinPreferencias(prefs)) motivos.push('Un clásico que no falla')
  }

  const coincidencias = prefs.perfiles.filter((p) => receta.perfiles.includes(p))
  if (coincidencias.length) {
    puntaje += coincidencias.length * 5
    motivos.push(`Va con lo ${lista(coincidencias.map(nombrePerfil))} que pediste`)
  }

  if (receta.base && prefs.bases.includes(receta.base)) {
    puntaje += 8
    motivos.push(`Usa ${POR_ID[receta.base].nombre.toLowerCase()}, que es lo que querías tomar`)
  }

  if (prefs.intensidad) {
    const distancia = Math.abs(receta.intensidad - prefs.intensidad)
    puntaje += 4 - distancia * 3
    if (distancia === 0) {
      const etiqueta = ['', 'suave', 'de intensidad media', 'cargado'][receta.intensidad]
      motivos.push(`Queda ${etiqueta}, como lo pediste`)
    }
  }

  const rolesUsados = rolesDeCatalogo(receta).map((r) => r.rol)
  const casaUsados = elementosDeCasa(receta).map((c) => c.id)
  const yaTiene = [...rolesUsados, ...casaUsados].filter((id) => prefs.tengo.includes(id))
  if (yaTiene.length) {
    puntaje += yaTiene.length * 2.5
    motivos.push(`Aprovecha ${yaTiene.length} ${yaTiene.length === 1 ? 'cosa' : 'cosas'} que ya tienes`)
  }

  // Castigo suave por pack largo: ordena entre empates sin tapar lo que la persona pidió.
  const porComprar = rolesUsados.filter((r) => !prefs.tengo.includes(r)).length
  puntaje -= porComprar * 0.5

  if (prefs.sinAlcohol && receta.sinAlcohol) {
    puntaje += 6
    motivos.push('Sin alcohol, para tomar toda la tarde')
  }

  return { puntaje, motivos }
}

export function armarPack(receta: Receta, prefs: Preferencias, opciones: OpcionesPorRol): Sugerencia {
  const tragosTotales = Math.max(2, Math.round(prefs.personas * prefs.tragosPorPersona))
  const pack: LineaPack[] = []
  const yaTienes: { nombre: string; medida: string }[] = []

  for (const { rol, medida } of rolesDeCatalogo(receta)) {
    const def = POR_ID[rol]
    if (prefs.tengo.includes(rol)) {
      yaTienes.push({ nombre: def.nombre, medida })
      continue
    }
    const disponibles = opciones[rol] ?? []
    const producto = disponibles[0]
    if (!producto) continue
    const mlNecesarios = def.mlPorTrago * tragosTotales
    const unidades = producto.ml
      ? Math.min(MAX_UNIDADES, Math.max(1, Math.ceil(mlNecesarios / producto.ml)))
      : 1
    pack.push({
      rol,
      nombreRol: def.nombre,
      producto,
      unidades,
      subtotal: unidades * producto.precio,
      mlNecesarios,
      medida,
      alternativas: disponibles.slice(1),
    })
  }

  const deCasa = elementosDeCasa(receta).filter((c) => !prefs.tengo.includes(c.id))
  const total = pack.reduce((s, l) => s + l.subtotal, 0)
  const { puntaje, motivos } = puntuar(receta, prefs)
  const diferencias = diferenciasCon(receta, prefs)

  return {
    receta,
    puntaje,
    motivos,
    diferencias,
    pack,
    yaTienes,
    deCasa,
    total,
    tragosTotales,
    costoPorTrago: tragosTotales ? Math.round(total / tragosTotales) : 0,
  }
}

export type Resultado = {
  /** Calzan con todo lo que se pidió. */
  calzan: Sugerencia[]
  /** No calzan, y cada una dice en qué se corre. Solo para completar la carta. */
  alternativas: Sugerencia[]
}

/** Sin base declarada, las cartas abren puertas distintas en vez de repetir destilado. */
function variar(sugerencias: Sugerencia[], cuantas: number, diversificar: boolean): Sugerencia[] {
  if (!diversificar) return sugerencias.slice(0, cuantas)
  const elegidas: Sugerencia[] = []
  const basesUsadas = new Set<string>()
  for (const s of sugerencias) {
    const clave = s.receta.base ?? 'sin-alcohol'
    if (basesUsadas.has(clave)) continue
    elegidas.push(s)
    basesUsadas.add(clave)
    if (elegidas.length === cuantas) return elegidas
  }
  for (const s of sugerencias) {
    if (elegidas.length === cuantas) break
    if (!elegidas.includes(s)) elegidas.push(s)
  }
  return elegidas
}

export function sugerir(prefs: Preferencias, opciones: OpcionesPorRol, cuantas = 3): Resultado {
  const diversificar = prefs.bases.length === 0
  const exactas = candidatasExactas(prefs, opciones)
  const idsExactas = new Set(exactas.map((r) => r.id))

  const calzan = variar(
    exactas.map((r) => armarPack(r, prefs, opciones)).sort((a, b) => b.puntaje - a.puntaje || a.total - b.total),
    cuantas,
    diversificar,
  )

  // Las alternativas solo aparecen si faltan cartas, van rotuladas con su diferencia
  // y nunca se mezclan con las que sí calzan.
  const faltan = cuantas - calzan.length
  if (faltan <= 0) return { calzan, alternativas: [] }

  const alternativas = variar(
    RECETAS.filter((r) => !idsExactas.has(r.id) && tieneStock(r, opciones))
      .filter((r) => !prefs.sinAlcohol || r.sinAlcohol)
      .map((r) => armarPack(r, prefs, opciones))
      .sort((a, b) => a.diferencias.length - b.diferencias.length || b.puntaje - a.puntaje),
    faltan,
    diversificar,
  )

  return { calzan, alternativas }
}

/** Roles que la persona puede declarar como "ya lo tengo". */
export const ROLES_DECLARABLES: RolId[] = [
  'pisco',
  'gin',
  'vodka',
  'whisky',
  'ron-blanco',
  'ron-anejo',
  'tequila',
  'cola',
  'tonica',
  'lima-limon',
  'energetica',
  'jugo-naranja',
  'jugo-pina',
  'vino-tinto',
  'cerveza',
]

export const CASA_DECLARABLES: CasaId[] = ['hielo', 'limon', 'menta', 'azucar', 'naranja', 'jengibre']
