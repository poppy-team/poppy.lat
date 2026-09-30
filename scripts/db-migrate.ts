import { createDb, migrate } from '../server/db/client.ts';
import { describeTarget } from '../server/db/target.ts';
import { readEnv } from '../server/env.ts';

/**
 * Applies pending migrations to the database in the environment (`pnpm db:migrate`).
 * Without TURSO_DATABASE_URL the environment falls back to a local file, which is
 * what the local server uses and never what a release needs, so that case stops
 * unless `--local` says it is on purpose.
 */
const env = readEnv();
const target = describeTarget(env.TURSO_DATABASE_URL);

if (!target.remote && !process.argv.includes('--local')) {
  console.error(
    `Nada foi feito: TURSO_DATABASE_URL não está definida, então o alvo seria ${target.label}.\n` +
      'Para a produção: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... pnpm db:migrate\n' +
      'Para o arquivo local de propósito: pnpm db:migrate --local',
  );
  process.exit(1);
}

console.log(`Banco: ${target.label}`);

const { client } = createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
const applied = await migrate(client);

console.log(applied.length ? `Aplicadas agora: ${applied.join(', ')}` : 'Nada a aplicar: o banco já está em dia.');

const all = (await client.execute('SELECT name FROM _migrations ORDER BY name')).rows.map((row) => String(row.name));

console.log(`Migrações no banco (${all.length}): ${all.join(', ')}`);
client.close();
