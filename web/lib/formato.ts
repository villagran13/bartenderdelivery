const PESOS = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function clp(monto: number): string {
  return PESOS.format(Math.round(monto))
}

export function hora(ms: number): string {
  return new Date(ms).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export function segundosHasta(ms: number, ahora: number): number {
  return Math.max(0, Math.ceil((ms - ahora) / 1000))
}

export function volumen(ml: number): string {
  if (ml >= 1000) {
    const litros = ml / 1000
    return `${Number.isInteger(litros) ? litros : litros.toFixed(1).replace('.', ',')} L`
  }
  return `${ml} cc`
}

export function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}
