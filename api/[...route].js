// Vercel function entry. The code lives in server/ and is bundled into
// server-dist/ by `pnpm build:api` (part of `pnpm build`), so nothing here
// depends on Vercel compiling TypeScript.
export { GET, POST, PUT, DELETE } from '../server-dist/handler.mjs';
