import type { APIRoute } from 'astro';
import noticesMarkdown from '../../THIRD_PARTY_NOTICES.md?raw';

export const GET: APIRoute = () => new Response(noticesMarkdown, {
  headers: { 'content-type': 'text/markdown; charset=utf-8' },
});
