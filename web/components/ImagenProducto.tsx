import Image from 'next/image'

export function ImagenProducto({
  src,
  alt,
  lado = 72,
  className = '',
}: {
  src: string | null
  alt: string
  lado?: number
  className?: string
}) {
  if (!src) {
    return (
      <div
        style={{ width: lado, height: lado }}
        className={`flex shrink-0 items-center justify-center border border-noche-borde bg-noche text-bruma ${className}`}
        aria-hidden
      >
        <span className="rotulo text-xs">sin foto</span>
      </div>
    )
  }
  // Las miniaturas del carro y del pack se cargan de inmediato: aparecen dentro de paneles
  // que se montan ya visibles y la carga diferida las deja en blanco.
  return (
    <Image
      src={src}
      alt={alt}
      width={lado}
      height={lado}
      loading={lado <= 80 ? 'eager' : 'lazy'}
      className={`shrink-0 bg-hueso object-contain ${className}`}
      style={{ width: lado, height: lado }}
      unoptimized
    />
  )
}
