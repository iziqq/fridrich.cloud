import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/*
 * Sestaví z apps/api balíček, který jde nasadit sám o sobě.
 *
 * Nahrává se jako hotový balíček – Azure u spravovaných funkcí závislosti
 * nedoinstaluje, takže si je musíme přinést s sebou. Esbuild proto spojí
 * do jednoho souboru úplně všechno: vlastní kód, sdílené workspace balíčky
 * i závislosti z registru.
 *
 * Bez toho je balíček 87 MB a přes 13 000 souborů (samotné `@azure/*` jich
 * mají 11 700) a nasazení padá na `An unknown exception has occurred`.
 * Po zabalení zbude ~120 souborů a 3 MB.
 */

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(apiDir, 'deploy');

const pkg = JSON.parse(
  execFileSync('node', ['-p', 'JSON.stringify(require("./package.json"))'], {
    cwd: apiDir,
    encoding: 'utf8',
  }),
);

/*
 * Venku zůstává jen `@azure/functions` – programovací model si runtime
 * načítá sám a je malý. Všechno ostatní jde dovnitř bundlu.
 */
const EXTERNAL = ['@azure/functions'];

const external = Object.entries(pkg.dependencies ?? {}).filter(([name]) =>
  EXTERNAL.includes(name),
);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [join(apiDir, 'src/index.ts')],
  outfile: join(outDir, 'index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: true,
  external: EXTERNAL,
  /*
   * Některé závislosti Azure SDK (`https-proxy-agent`) jsou CommonJS a uvnitř
   * volají `require`. V ESM bundlu ho nic nedefinuje, takže by se worker
   * neodpíchl: „Dynamic require of 'net' is not supported". Tenhle shim ho
   * doplní.
   */
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
});

writeFileSync(
  join(outDir, 'package.json'),
  `${JSON.stringify(
    {
      name: 'fridrich-api',
      version: pkg.version,
      private: true,
      type: 'module',
      main: 'index.js',
      dependencies: Object.fromEntries(external),
    },
    null,
    2,
  )}\n`,
);

copyFileSync(join(apiDir, 'host.json'), join(outDir, 'host.json'));

// Nasazuje se i s node_modules, protože build na Azure přeskakujeme –
// jinak by se instalovaly závislosti, které jsme právě vyloučili.
execFileSync('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], {
  cwd: outDir,
  stdio: 'inherit',
});

console.log(`\nHotovo: ${outDir}`);
