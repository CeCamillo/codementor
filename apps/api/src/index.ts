import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { deviceFlowRoutes, userRoutes } from './device-flow';
import { projectRoutes } from './projects';

const app = new Elysia()
  .use(
    cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    })
  )
  .get('/', () => ({ message: 'CodeMentor API' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .get('/device', ({ redirect, query }) => {
    // Redirect /device to /auth/device/verify for user-friendly URL
    const userCode = query['user_code'];
    return redirect(userCode ? `/auth/device/verify?user_code=${userCode}` : '/auth/device/verify');
  })
  .use(deviceFlowRoutes)
  .use(userRoutes)
  .use(projectRoutes)
  .listen(3000);

console.log(`CodeMentor API running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
