import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/*
 * Sestaví z apps/api balíček, který jde nasadit sám o sobě.
 *
 * Azure Static Web Apps spouští u spravovaných funkcí `npm install` jen
 * v adresáři API. Workspace závislosti (`@fridrich/shared`) na npm nejsou,
 * takže by instalace selhala – proto se zdrojový kód i se sdílenými balíčky
 * spojí esbuildem do jednoho souboru a do package.json jdou jen závislosti,
 * které se opravdu dají stáhnout z registru.
 */

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(apiDir, 'deploy');

const pkg = JSON.parse(
  execFileSync('node', ['-p', 'JSON.stringify(require("./package.json"))'], {
    cwd: apiDir,
    encoding: 'utf8',
  }),
);

// Balíky z registru zůstanou venku a doinstalují se; workspace balíčky se
// zabalí dovnitř, protože je odjinud než z tohohle repozitáře nevytáhneme.
const external = Object.entries(pkg.dependencies ?? {}).filter(
  ([name]) => !name.startsWith('@fridrich/'),
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
  external: external.map(([name]) => name),
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
