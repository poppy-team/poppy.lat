import { handle } from 'hono/vercel';
import { serverApp } from './index.ts';

/**
 * Every /api/* request lands here. Hono routes it inside the app; nothing
 * about the site's static pages goes through this function. `pnpm build:api`
 * bundles this file into `server-dist/handler.mjs`, which `api/index.js`
 * re-exports.
 */
const handler = handle(serverApp());

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
