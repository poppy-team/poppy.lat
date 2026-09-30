import { createDb, migrate } from '../server/db/client.ts';
import { readEnv } from '../server/env.ts';

/** Applies pending migrations to the database in the environment (`pnpm db:migrate`). */
const env = readEnv();
const { client } = createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
const applied = await migrate(client);

console.log(applied.length ? `Aplicadas: ${applied.join(', ')}` : 'Nada a aplicar: o banco já está em dia.');
client.close();
