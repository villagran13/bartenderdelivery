import Link from 'next/link'
import { BOTILLERIAS, RADIOS_KM } from '@/lib/botillerias'

const PASOS = [
  {
    titulo: 'Pides el pack',
    texto:
      'El pedido no se envía a un local específico. Entra a la red de Edrink con tu dirección y el detalle de las botellas.',
  },
  {
    titulo: 'Suena en el barrio',
    texto: `Las botillerías a menos de ${RADIOS_KM[0]} km lo ven al mismo tiempo en su panel y tienen 22 segundos para tomarlo. La primera que acepta se lo queda.`,
  },
  {
    titulo: 'Si nadie contesta, se abre el radio',
    texto: `La búsqueda pasa a ${RADIOS_KM[1]} km y después a toda la ciudad. Tú ves el radar moverse mientras tanto.`,
  },
]

export function ComoFunciona() {
  return (
    <section id="red" className="border-t border-noche-borde py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <h2 className="titular text-grande text-hueso">Cómo llega a tu casa</h2>
            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-bruma">
              Funciona como pedir un auto: tú pides, la red avisa a los que están cerca y disponibles, y el
              primero que acepta sale con tu pedido.
            </p>

            <ol className="mt-10 space-y-8">
              {PASOS.map((paso, i) => (
                <li key={paso.titulo} className="flex gap-5">
                  <span className="numero text-3xl leading-none text-sol">{i + 1}</span>
                  <div>
                    <h3 className="rotulo text-lg text-hueso">{paso.titulo}</h3>
                    <p className="mt-2 max-w-[46ch] text-base leading-relaxed text-bruma">{paso.texto}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 border border-noche-borde bg-noche-alto/50 p-5">
              <p className="text-base text-hueso">¿Quieres ver el otro lado del mostrador?</p>
              <p className="mt-2 text-sm leading-relaxed text-bruma">
                Abre el panel de botillería en otra pestaña del mismo navegador y toma tú mismo el pedido que
                acabas de hacer. Es la pantalla que vería el local.
              </p>
              <Link
                href="/botilleria"
                className="rotulo mt-4 inline-block border border-lima px-5 py-2.5 text-sm text-lima transition-colors hover:bg-lima hover:text-noche"
              >
                Abrir el panel de botillería
              </Link>
            </div>
          </div>

          <div className="border border-noche-borde bg-noche-alto/40 p-6">
            <h3 className="rotulo text-lg text-hueso">Las botillerías de la red</h3>
            <p className="mt-2 text-sm text-bruma">
              Ocho locales de Santiago, con su distancia hasta Providencia. Al hacer el pedido se recalcula
              contra la comuna que elijas.
            </p>
            <ul className="mt-5 divide-y divide-noche-borde border-t border-noche-borde">
              {BOTILLERIAS.map((b) => (
                <li key={b.id} className="flex items-baseline justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-hueso">{b.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-bruma">
                      {b.sector}, cierra {b.cierra}
                    </p>
                  </div>
                  <p className="numero shrink-0 text-sm text-lima">
                    {b.distanciaKm.toString().replace('.', ',')} km
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
