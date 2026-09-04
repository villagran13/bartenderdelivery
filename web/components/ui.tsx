'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ChipProps = {
  activo: boolean
  onClick: () => void
  children: ReactNode
  detalle?: string
}

export function Chip({ activo, onClick, children, detalle }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={[
        'group rounded-full border px-4 py-2 text-left text-[0.95rem] transition-colors duration-150',
        activo
          ? 'border-sol bg-sol text-noche'
          : 'border-noche-borde bg-noche-alto/60 text-hueso hover:border-bruma/60 hover:bg-noche-alto',
      ].join(' ')}
    >
      <span className="font-medium">{children}</span>
      {detalle ? (
        <span className={activo ? 'ml-2 text-noche/70' : 'ml-2 text-bruma'}>{detalle}</span>
      ) : null}
    </button>
  )
}

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'sol' | 'lima' | 'contorno' | 'discreto'
  tamano?: 'normal' | 'grande'
}

export function Boton({ variante = 'sol', tamano = 'normal', className = '', ...props }: BotonProps) {
  const estilos = {
    sol: 'bg-sol text-noche hover:bg-sol-hondo disabled:bg-noche-borde disabled:text-bruma',
    lima: 'bg-lima text-noche hover:bg-lima/85 disabled:bg-noche-borde disabled:text-bruma',
    contorno: 'border border-bruma/40 text-hueso hover:border-hueso hover:bg-noche-alto',
    discreto: 'text-bruma hover:text-hueso',
  }[variante]
  const medida = tamano === 'grande' ? 'px-7 py-4 text-lg' : 'px-5 py-2.5 text-base'
  return (
    <button
      {...props}
      className={`rotulo rounded-sm transition-colors duration-150 disabled:cursor-not-allowed ${estilos} ${medida} ${className}`}
    />
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-noche-borde bg-noche-alto/50 ${className}`}>{children}</div>
  )
}

export function Etiqueta({ children, tono = 'bruma' }: { children: ReactNode; tono?: 'bruma' | 'lima' | 'sol' }) {
  const color = {
    bruma: 'border-noche-borde text-bruma',
    lima: 'border-lima/50 text-lima',
    sol: 'border-sol/50 text-sol',
  }[tono]
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs ${color}`}>{children}</span>
}

export function Pregunta({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="rotulo mb-3 text-lg text-hueso">{texto}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}
