import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(dirname, '../..')

const nextConfig: NextConfig = {
  // `@repo/shared` jest publikowany jako źródło TypeScript (Just-in-Time
  // Package), więc Next musi go przepuścić przez własny transpiler.
  transpilePackages: ['@repo/shared'],

  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },

  // Oba korzenie MUSZĄ być identyczne (Next to weryfikuje) i MUSZĄ być ustawione
  // jawnie: bez tego Next wnioskuje korzeń po lockfile'ach i przy sąsiednich
  // projektach w tym samym katalogu nadrzędnym traceuje pół dysku, a build wisi.
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },

  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false });
