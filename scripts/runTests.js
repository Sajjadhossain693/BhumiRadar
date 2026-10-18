import { build } from 'vite';
import { resolve } from 'node:path';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

async function main() {
  console.log('📦 Bundling governance module test suite with Vite...');
  await build({
    configFile: false,
    build: {
      outDir: 'dist-tests',
      emptyOutDir: true,
      lib: {
        entry: resolve('tests/governanceModules.test.ts'),
        formats: ['es'],
        fileName: 'test.bundle',
      },
      rollupOptions: {
        external: [/^node:/],
      },
    },
    logLevel: 'error',
  });

  console.log('🧪 Executing Unit Tests with node:test & TAP/Spec Reporter...\n');
  const stream = run({ files: [resolve('dist-tests/test.bundle.js')] });
  stream.compose(new spec()).pipe(process.stdout);

  stream.on('test:fail', () => {
    process.exitCode = 1;
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
