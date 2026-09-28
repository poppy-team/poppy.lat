import type { APIRoute } from 'astro';
import sourceManifest from '../../../docs/sources.json';

export const GET: APIRoute = () => new Response(JSON.stringify(sourceManifest, null, 2), {
  headers: { 'content-type': 'application/json; charset=utf-8' },
});
