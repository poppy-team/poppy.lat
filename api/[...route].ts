import { handle } from 'hono/vercel';
import { serverApp } from '../server/index.ts';

/**
 * Every /api/* request lands here. Hono routes it inside the app; nothing
 * about the site's static pages goes through this function.
 */
const handler = handle(serverApp());

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
