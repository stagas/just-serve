import { defaultReporter } from '@web/test-runner'
import { esbuildPlugin } from '@web/dev-server-esbuild'

export default {
  nodeResolve: true,
  files: ['src/**/*.spec.ts'],
  plugins: [esbuildPlugin({ ts: true })],
  coverageConfig: {
    include: ['src/**/*.ts']
  }
}
