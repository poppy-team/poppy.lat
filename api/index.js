// Vercel function entry for every /api/* request. vercel.json rewrites
// /api/:path* to this file and the function still sees the original path, so
// Hono does the routing. (A catch-all file name such as [...route].js only
// matched one path segment, so /api/auth/... answered 404.)
//
// The code lives in server/ and is bundled into server-dist/ by
// `pnpm build:api` (part of `pnpm build`), so nothing here depends on Vercel
// compiling TypeScript.
export { GET, POST, PUT, DELETE } from '../server-dist/handler.mjs';
