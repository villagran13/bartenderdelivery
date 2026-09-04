import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

// eslint-config-next 16 ya exporta flat config. Pasarlo por FlatCompat revienta
// con "Converting circular structure to JSON" al serializar el plugin de react.
const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ['.next/**', 'node_modules/**', 'data/**', 'next-env.d.ts'] },
]

export default config
