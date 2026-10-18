import { build } from 'vite';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

async function main() {
  await build({
    configFile: false,
    build: {
      outDir: 'dist-tests',
      emptyOutDir: true,
      lib: {
        entry: resolve('scripts/runDirectTests.mjs'),
        formats: ['es'],
        fileName: 'run',
      },
      rollupOptions: {
        external: [/^node:/],
      },
    },
    logLevel: 'error',
  });

  const output = execFileSync('node', ['dist-tests/run.js'], { encoding: 'utf-8' });
  console.log(output);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
