import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/', () => ({ message: 'CodeMentor API' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(3000);

console.log(`CodeMentor API running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
