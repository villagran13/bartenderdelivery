// Red de botillerías de Santiago que recibe los pedidos. Son locales de demostración
// para mostrar cómo se reparte un pedido entre varios puntos de venta.

export type Botilleria = {
  id: string
  nombre: string
  sector: string
  direccion: string
  lat: number
  lng: number
  /** Distancia de referencia, medida desde Providencia. La real se calcula por pedido. */
  distanciaKm: number
  /** Grados sobre el radar, medidos desde el norte. */
  angulo: number
  estrellas: number
  pedidosMes: number
  minutosPreparacion: number
  /** Con qué frecuencia acepta cuando el piloto automático responde por ella. */
  tasaAceptacion: number
  cierra: string
}

export const BOTILLERIAS: Botilleria[] = [
  {
    id: 'providencia',
    nombre: 'Edrink Providencia',
    sector: 'Providencia',
    direccion: 'Av. Providencia 1650',
    lat: -33.4262,
    lng: -70.618,
    distanciaKm: 0.7,
    angulo: 24,
    estrellas: 4.8,
    pedidosMes: 2140,
    minutosPreparacion: 6,
    tasaAceptacion: 0.75,
    cierra: '02:00',
  },
  {
    id: 'nunoa',
    nombre: 'Botillería Irarrázaval',
    sector: 'Ñuñoa',
    direccion: 'Av. Irarrázaval 3420',
    lat: -33.456,
    lng: -70.596,
    distanciaKm: 3.6,
    angulo: 112,
    estrellas: 4.5,
    pedidosMes: 1380,
    minutosPreparacion: 9,
    tasaAceptacion: 0.6,
    cierra: '01:00',
  },
  {
    id: 'centro',
    nombre: 'Botillería Santa Isabel',
    sector: 'Santiago Centro',
    direccion: 'Santa Isabel 720',
    lat: -33.452,
    lng: -70.648,
    distanciaKm: 4.5,
    angulo: 236,
    estrellas: 4.3,
    pedidosMes: 1620,
    minutosPreparacion: 8,
    tasaAceptacion: 0.6,
    cierra: '03:00',
  },
  {
    id: 'lascondes',
    nombre: 'Licorería Apoquindo',
    sector: 'Las Condes',
    direccion: 'Av. Apoquindo 4900',
    lat: -33.409,
    lng: -70.57,
    distanciaKm: 4.2,
    angulo: 64,
    estrellas: 4.6,
    pedidosMes: 1750,
    minutosPreparacion: 7,
    tasaAceptacion: 0.5,
    cierra: '02:30',
  },
  {
    id: 'recoleta',
    nombre: 'Botillería Bellavista',
    sector: 'Recoleta',
    direccion: 'Av. Recoleta 340',
    lat: -33.429,
    lng: -70.635,
    distanciaKm: 2.3,
    angulo: 332,
    estrellas: 4.2,
    pedidosMes: 1190,
    minutosPreparacion: 10,
    tasaAceptacion: 0.5,
    cierra: '04:00',
  },
  {
    id: 'sanmiguel',
    nombre: 'Botillería Gran Avenida',
    sector: 'San Miguel',
    direccion: 'Gran Avenida 4180',
    lat: -33.495,
    lng: -70.652,
    distanciaKm: 8.6,
    angulo: 196,
    estrellas: 4.0,
    pedidosMes: 640,
    minutosPreparacion: 12,
    tasaAceptacion: 0.55,
    cierra: '23:30',
  },
  {
    id: 'laflorida',
    nombre: 'Punto Vicuña Mackenna',
    sector: 'La Florida',
    direccion: 'Av. Vicuña Mackenna 8340',
    lat: -33.523,
    lng: -70.598,
    distanciaKm: 10.9,
    angulo: 152,
    estrellas: 4.1,
    pedidosMes: 720,
    minutosPreparacion: 13,
    tasaAceptacion: 0.55,
    cierra: '01:30',
  },
  {
    id: 'maipu',
    nombre: 'Botillería Pajaritos',
    sector: 'Maipú',
    direccion: 'Av. Pajaritos 2960',
    lat: -33.48,
    lng: -70.748,
    distanciaKm: 14.1,
    angulo: 268,
    estrellas: 3.9,
    pedidosMes: 480,
    minutosPreparacion: 15,
    tasaAceptacion: 0.6,
    cierra: '00:30',
  },
]

export const POR_ID: Record<string, Botilleria> = Object.fromEntries(BOTILLERIAS.map((b) => [b.id, b]))

/** Radios de la búsqueda: primero el barrio, después la ciudad entera. */
export const RADIOS_KM = [3, 7, 15]

export type Sector = { nombre: string; lat: number; lng: number }

export const SECTORES: Sector[] = [
  { nombre: 'Providencia', lat: -33.4256, lng: -70.6108 },
  { nombre: 'Ñuñoa', lat: -33.4569, lng: -70.5975 },
  { nombre: 'Santiago Centro', lat: -33.4489, lng: -70.6693 },
  { nombre: 'Las Condes', lat: -33.4085, lng: -70.5665 },
  { nombre: 'Recoleta', lat: -33.418, lng: -70.644 },
  { nombre: 'San Miguel', lat: -33.497, lng: -70.651 },
  { nombre: 'La Florida', lat: -33.522, lng: -70.599 },
  { nombre: 'Maipú', lat: -33.511, lng: -70.758 },
]

const RADIO_TIERRA_KM = 6371
const aRadianes = (grados: number) => (grados * Math.PI) / 180

export function distanciaEntre(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = aRadianes(b.lat - a.lat)
  const dLng = aRadianes(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h)) * 10) / 10
}

/** Distancia real de cada local a la comuna de entrega elegida en el checkout. */
export function distanciasDesde(nombreSector: string): Record<string, number> {
  const sector = SECTORES.find((s) => s.nombre === nombreSector) ?? SECTORES[0]
  return Object.fromEntries(BOTILLERIAS.map((b) => [b.id, distanciaEntre(sector, b)]))
}

export function distanciaDe(id: string, distancias?: Record<string, number>): number {
  return distancias?.[id] ?? POR_ID[id]?.distanciaKm ?? 0
}
