import type { Metadata, Viewport } from 'next'
import { Archivo, Instrument_Sans } from 'next/font/google'
import './globals.css'

const display = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--fuente-display',
  display: 'swap',
})

const texto = Instrument_Sans({
  subsets: ['latin'],
  variable: '--fuente-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bartender Edrink | Dime qué te gusta y te armo el trago',
  description:
    'Elige un sabor o cuenta qué tienes en la casa y el bartender de Edrink arma la receta con el catálogo real de la botillería. El pedido lo toma la botillería más cercana de Santiago.',
  metadataBase: new URL('https://bartender.edrink.cl'),
  openGraph: {
    title: 'Bartender Edrink',
    description: 'Recetas armadas con el catálogo real de Edrink y despacho de la botillería más cercana.',
    locale: 'es_CL',
    type: 'website',
  },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#0b1233',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={`${display.variable} ${texto.variable}`}>
      <body className="min-h-screen bg-noche text-hueso">
        {children}
      </body>
    </html>
  )
}
