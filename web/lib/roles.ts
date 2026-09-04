// Un rol es "lo que la receta necesita" (un pisco, una tónica, un jugo de piña).
// El catálogo de Edrink se resuelve contra estos roles en lib/catalogo.ts.
// Este archivo no importa el catálogo: lo usan también los componentes de cliente.

export type RolId =
  | 'pisco'
  | 'gin'
  | 'vodka'
  | 'whisky'
  | 'ron-blanco'
  | 'ron-anejo'
  | 'tequila'
  | 'aperol'
  | 'campari'
  | 'vermut-rojo'
  | 'triple-sec'
  | 'amaretto'
  | 'licor-cafe'
  | 'licor-coco'
  | 'crema-irlandesa'
  | 'fernet'
  | 'jagermeister'
  | 'jarabe-goma'
  | 'soju'
  | 'sour-listo'
  | 'tonica'
  | 'ginger-ale'
  | 'ginger-beer'
  | 'cola'
  | 'lima-limon'
  | 'pomelo'
  | 'agua-con-gas'
  | 'energetica'
  | 'jugo-naranja'
  | 'jugo-pina'
  | 'jugo-durazno'
  | 'jugo-frutilla'
  | 'jugo-mango'
  | 'vino-tinto'
  | 'vino-blanco'
  | 'vino-dulce'
  | 'espumante'
  | 'cerveza'
  | 'snack'

export type TipoRol = 'destilado' | 'licor' | 'mixer' | 'jugo' | 'vino' | 'cerveza' | 'acompanamiento'

export type DefinicionRol = {
  id: RolId
  nombre: string
  tipo: TipoRol
  /** Mililitros que consume un trago. Con esto se calcula cuántas botellas van al carrito. */
  mlPorTrago: number
  /** Colecciones del catálogo que califican para el rol. */
  categorias?: string[]
  /** Filtro adicional sobre el título del producto en mayúsculas. */
  incluye?: RegExp
  excluye?: RegExp
  /** Formato mínimo razonable, para no sugerir petacas de 200 cc como base de un pack. */
  mlMinimo?: number
}

export const DEFINICIONES: DefinicionRol[] = [
  { id: 'pisco', nombre: 'Pisco', tipo: 'destilado', mlPorTrago: 60, categorias: ['pisco'], excluye: /SOUR|MANGO|CALAFATE|SECRETO PERUANO/, mlMinimo: 700 },
  { id: 'gin', nombre: 'Gin', tipo: 'destilado', mlPorTrago: 50, categorias: ['gin'], mlMinimo: 700 },
  { id: 'vodka', nombre: 'Vodka', tipo: 'destilado', mlPorTrago: 50, categorias: ['vodka'], mlMinimo: 700 },
  { id: 'whisky', nombre: 'Whisky', tipo: 'destilado', mlPorTrago: 50, categorias: ['whisky'], mlMinimo: 700 },
  { id: 'ron-blanco', nombre: 'Ron blanco', tipo: 'destilado', mlPorTrago: 50, categorias: ['ron-blanco'], incluye: /RON/, mlMinimo: 700 },
  { id: 'ron-anejo', nombre: 'Ron añejo', tipo: 'destilado', mlPorTrago: 50, categorias: ['ron-dorado-y-anejo'], mlMinimo: 700 },
  { id: 'tequila', nombre: 'Tequila', tipo: 'destilado', mlPorTrago: 50, categorias: ['tequila'], mlMinimo: 700 },

  { id: 'aperol', nombre: 'Aperol', tipo: 'licor', mlPorTrago: 60, incluye: /APEROL/ },
  { id: 'campari', nombre: 'Campari', tipo: 'licor', mlPorTrago: 30, incluye: /CAMPARI/ },
  { id: 'vermut-rojo', nombre: 'Vermut rojo', tipo: 'licor', mlPorTrago: 30, incluye: /MARTINI ROSSO|VERMOUTH|VERMUT/ },
  { id: 'triple-sec', nombre: 'Triple sec', tipo: 'licor', mlPorTrago: 25, incluye: /TRIPLE SEC|CURACAO/ },
  { id: 'amaretto', nombre: 'Amaretto', tipo: 'licor', mlPorTrago: 25, incluye: /AMARETTO|DISARONNO/ },
  { id: 'licor-cafe', nombre: 'Licor de café', tipo: 'licor', mlPorTrago: 30, incluye: /KAHLUA|LICOR DE CAFE|COLD BREW COFFEE/ },
  { id: 'licor-coco', nombre: 'Licor de coco', tipo: 'licor', mlPorTrago: 30, incluye: /MALIBU/ },
  { id: 'crema-irlandesa', nombre: 'Crema de whisky', tipo: 'licor', mlPorTrago: 50, incluye: /BAILEYS|SHERIDANS|AMARULA/ },
  { id: 'fernet', nombre: 'Fernet', tipo: 'licor', mlPorTrago: 50, incluye: /FERNET/ },
  { id: 'jagermeister', nombre: 'Jägermeister', tipo: 'licor', mlPorTrago: 40, incluye: /JAGERMEISTER/, excluye: /COLD BREW/ },
  { id: 'jarabe-goma', nombre: 'Jarabe de goma', tipo: 'licor', mlPorTrago: 20, incluye: /JARABE GOMA/ },
  { id: 'soju', nombre: 'Soju', tipo: 'licor', mlPorTrago: 60, incluye: /SOJU/ },
  { id: 'sour-listo', nombre: 'Sour listo para servir', tipo: 'licor', mlPorTrago: 120, categorias: ['sour'] },

  { id: 'tonica', nombre: 'Agua tónica', tipo: 'mixer', mlPorTrago: 150, incluye: /TONICA|TONIC/, excluye: /GIN KANTAL|COCTEL|PROMO/ },
  { id: 'ginger-ale', nombre: 'Ginger ale', tipo: 'mixer', mlPorTrago: 120, incluye: /GINGER ALE/ },
  { id: 'ginger-beer', nombre: 'Ginger beer', tipo: 'mixer', mlPorTrago: 150, incluye: /GINGER BEER/ },
  { id: 'cola', nombre: 'Bebida cola', tipo: 'mixer', mlPorTrago: 150, incluye: /COCA COLA|PEPSI/, excluye: /JACK DANIELS|PROMO/ },
  { id: 'lima-limon', nombre: 'Bebida lima limón', tipo: 'mixer', mlPorTrago: 150, incluye: /SPRITE|SEVEN UP|LIMON SODA/, excluye: /ABSOLUT|PROMO/ },
  { id: 'pomelo', nombre: 'Bebida de pomelo', tipo: 'mixer', mlPorTrago: 150, incluye: /POMELO/ },
  { id: 'agua-con-gas', nombre: 'Agua con gas', tipo: 'mixer', mlPorTrago: 100, incluye: /AGUA.*(C\/GAS|CON GAS)|STRONG/ },
  { id: 'energetica', nombre: 'Bebida energética', tipo: 'mixer', mlPorTrago: 120, categorias: ['bebidas-energeticas'] },

  { id: 'jugo-naranja', nombre: 'Jugo de naranja', tipo: 'jugo', mlPorTrago: 120, categorias: ['aguas-y-jugos'], incluye: /NARANJA/ },
  { id: 'jugo-pina', nombre: 'Jugo de piña', tipo: 'jugo', mlPorTrago: 120, categorias: ['aguas-y-jugos'], incluye: /PIÑA/ },
  { id: 'jugo-durazno', nombre: 'Néctar de durazno', tipo: 'jugo', mlPorTrago: 90, categorias: ['aguas-y-jugos'], incluye: /DURAZNO/ },
  { id: 'jugo-frutilla', nombre: 'Néctar de frutilla', tipo: 'jugo', mlPorTrago: 60, categorias: ['aguas-y-jugos'], incluye: /FRUTILLA/ },
  { id: 'jugo-mango', nombre: 'Jugo de mango', tipo: 'jugo', mlPorTrago: 90, categorias: ['aguas-y-jugos'], incluye: /MANGO|MARACUYA/ },

  { id: 'vino-tinto', nombre: 'Vino tinto', tipo: 'vino', mlPorTrago: 150, categorias: ['carmenere', 'cabernet-sauvignon', 'merlot'] },
  { id: 'vino-blanco', nombre: 'Vino blanco', tipo: 'vino', mlPorTrago: 150, categorias: ['vino-blanco'] },
  { id: 'vino-dulce', nombre: 'Vino dulce de botellón', tipo: 'vino', mlPorTrago: 200, categorias: ['botellon'], incluye: /DULCE|TERREMOTO|SELECTO/ },
  { id: 'espumante', nombre: 'Espumante', tipo: 'vino', mlPorTrago: 120, categorias: ['espumantes'] },

  { id: 'cerveza', nombre: 'Cerveza', tipo: 'cerveza', mlPorTrago: 350, categorias: ['cervezas-en-lata', 'cervezas-en-botella'] },
  { id: 'snack', nombre: 'Algo para picar', tipo: 'acompanamiento', mlPorTrago: 0, categorias: ['snack'] },
]

export const POR_ID: Record<RolId, DefinicionRol> = Object.fromEntries(
  DEFINICIONES.map((d) => [d.id, d]),
) as Record<RolId, DefinicionRol>

/** Ingredientes que Edrink no vende y pone el cliente en su cocina. */
export const DE_CASA = {
  hielo: 'Hielo',
  limon: 'Limón',
  menta: 'Menta fresca',
  azucar: 'Azúcar',
  naranja: 'Naranja fresca',
  sal: 'Sal',
  merken: 'Merkén',
  helado: 'Helado de piña',
  cafe: 'Café recién hecho',
  jengibre: 'Jengibre fresco',
  pepino: 'Pepino',
  canela: 'Canela',
} as const

export type CasaId = keyof typeof DE_CASA
