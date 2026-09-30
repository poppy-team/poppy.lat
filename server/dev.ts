import { serve } from '@hono/node-server';
import { createDb, migrate } from './db/client.ts';
import { readEnv } from './env.ts';
import { buildApp } from './index.ts';

/** Local API on port 8787 with a `local.db` file. VitePress proxies /api to it. */
const env = readEnv();
const { db, client } = createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
const applied = await migrate(client);

if (applied.length > 0) {
  console.log(`[db] migrações aplicadas: ${applied.join(', ')}`);
}

const app = buildApp({ db, client, env });
const port = Number(process.env.API_PORT ?? 8787);

serve({ fetch: app.fetch, port, hostname: '127.0.0.1' }, () => {
  console.log(`[api] http://127.0.0.1:${port}/api (o site em ${env.SITE_URL})`);
});
