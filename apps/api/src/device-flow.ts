import { Elysia, t } from 'elysia';
import { db } from '@codementor/db';
import { deviceCodes, users, sessions } from '@codementor/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';

const DEVICE_CODE_EXPIRY_SECONDS = 900; // 15 minutes
const POLL_INTERVAL_SECONDS = 5;

function generateDeviceCode(): string {
  return randomBytes(32).toString('hex');
}

function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateId(): string {
  return randomBytes(16).toString('hex');
}

export const deviceFlowRoutes = new Elysia({ prefix: '/auth/device' })
  .post(
    '/',
    async ({ body }) => {
      const deviceCode = generateDeviceCode();
      const userCode = generateUserCode();
      const expiresAt = new Date(Date.now() + DEVICE_CODE_EXPIRY_SECONDS * 1000);

      await db.insert(deviceCodes).values({
        id: generateId(),
        deviceCode,
        userCode,
        clientId: body.client_id,
        scope: body.scope,
        interval: POLL_INTERVAL_SECONDS,
        expiresAt,
        status: 'pending',
      });

      const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3000';

      return {
        device_code: deviceCode,
        user_code: userCode,
        verification_uri: `${baseUrl}/device`,
        verification_uri_complete: `${baseUrl}/device?user_code=${userCode}`,
        expires_in: DEVICE_CODE_EXPIRY_SECONDS,
        interval: POLL_INTERVAL_SECONDS,
      };
    },
    {
      body: t.Object({
        client_id: t.Optional(t.String()),
        scope: t.Optional(t.String()),
      }),
    }
  )
  .post(
    '/token',
    async ({ body, set }) => {
      const { device_code } = body;

      const [deviceCodeRecord] = await db
        .select()
        .from(deviceCodes)
        .where(and(eq(deviceCodes.deviceCode, device_code), gt(deviceCodes.expiresAt, new Date())));

      if (!deviceCodeRecord) {
        set.status = 400;
        return { error: 'expired_token', error_description: 'Device code has expired' };
      }

      // Check for slow polling
      if (deviceCodeRecord.lastPolledAt) {
        const timeSinceLastPoll = (Date.now() - deviceCodeRecord.lastPolledAt.getTime()) / 1000;
        if (timeSinceLastPoll < deviceCodeRecord.interval) {
          set.status = 400;
          return { error: 'slow_down', error_description: 'Polling too frequently' };
        }
      }

      // Update last polled time
      await db
        .update(deviceCodes)
        .set({ lastPolledAt: new Date() })
        .where(eq(deviceCodes.id, deviceCodeRecord.id));

      switch (deviceCodeRecord.status) {
        case 'pending':
          set.status = 400;
          return {
            error: 'authorization_pending',
            error_description: 'User has not yet authorized the device',
          };

        case 'denied':
          set.status = 400;
          return { error: 'access_denied', error_description: 'User denied the request' };

        case 'expired':
          set.status = 400;
          return { error: 'expired_token', error_description: 'Device code has expired' };

        case 'authorized':
          if (!deviceCodeRecord.accessToken || !deviceCodeRecord.userId) {
            set.status = 500;
            return { error: 'server_error', error_description: 'Missing token data' };
          }

          // Clean up the device code
          await db.delete(deviceCodes).where(eq(deviceCodes.id, deviceCodeRecord.id));

          return {
            access_token: deviceCodeRecord.accessToken,
            token_type: 'Bearer',
            expires_in: 86400 * 30, // 30 days
            refresh_token: deviceCodeRecord.refreshToken,
          };

        default:
          set.status = 500;
          return { error: 'server_error', error_description: 'Unknown status' };
      }
    },
    {
      body: t.Object({
        device_code: t.String(),
        grant_type: t.Optional(t.Literal('urn:ietf:params:oauth:grant-type:device_code')),
      }),
    }
  )
  .get('/verify', async ({ query, set }) => {
    const { user_code } = query;
    set.headers['Content-Type'] = 'text/html';

    if (!user_code) {
      return `<!DOCTYPE html>
<html>
<head><title>CodeMentor - Device Authorization</title></head>
<body style="font-family: system-ui; max-width: 400px; margin: 100px auto; text-align: center;">
  <h1>CodeMentor</h1>
  <h2>Enter Device Code</h2>
  <form method="GET" action="/auth/device/verify">
    <input type="text" name="user_code" placeholder="XXXX-XXXX"
      style="font-size: 24px; padding: 10px; text-align: center; letter-spacing: 2px; text-transform: uppercase;"
      pattern="[A-Z0-9]{4}-[A-Z0-9]{4}" required />
    <br/><br/>
    <button type="submit" style="padding: 10px 20px; font-size: 16px;">Continue</button>
  </form>
</body>
</html>`;
    }

    const [deviceCodeRecord] = await db
      .select()
      .from(deviceCodes)
      .where(
        and(
          eq(deviceCodes.userCode, user_code.toUpperCase()),
          gt(deviceCodes.expiresAt, new Date()),
          eq(deviceCodes.status, 'pending')
        )
      );

    if (!deviceCodeRecord) {
      return `<!DOCTYPE html>
<html>
<head><title>CodeMentor - Invalid Code</title></head>
<body style="font-family: system-ui; max-width: 400px; margin: 100px auto; text-align: center;">
  <h1>CodeMentor</h1>
  <h2>Invalid or Expired Code</h2>
  <p>The code you entered is invalid or has expired.</p>
  <a href="/auth/device/verify">Try Again</a>
</body>
</html>`;
    }

    // Show authorization page - in production, this would require login first
    return `<!DOCTYPE html>
<html>
<head><title>CodeMentor - Authorize Device</title></head>
<body style="font-family: system-ui; max-width: 400px; margin: 100px auto; text-align: center;">
  <h1>CodeMentor</h1>
  <h2>Authorize CLI Access</h2>
  <p>A device is requesting access to your CodeMentor account.</p>
  <p>Code: <strong>${user_code}</strong></p>
  <form method="POST" action="/auth/device/authorize">
    <input type="hidden" name="user_code" value="${user_code}" />
    <button type="submit" name="action" value="approve"
      style="padding: 10px 20px; font-size: 16px; background: #22c55e; color: white; border: none; margin: 5px;">
      Approve
    </button>
    <button type="submit" name="action" value="deny"
      style="padding: 10px 20px; font-size: 16px; background: #ef4444; color: white; border: none; margin: 5px;">
      Deny
    </button>
  </form>
</body>
</html>`;
  })
  .post(
    '/authorize',
    async ({ body, set }) => {
      const { user_code, action } = body;
      set.headers['Content-Type'] = 'text/html';

      const [deviceCodeRecord] = await db
        .select()
        .from(deviceCodes)
        .where(
          and(
            eq(deviceCodes.userCode, user_code.toUpperCase()),
            gt(deviceCodes.expiresAt, new Date()),
            eq(deviceCodes.status, 'pending')
          )
        );

      if (!deviceCodeRecord) {
        return `<!DOCTYPE html>
<html>
<head><title>CodeMentor - Error</title></head>
<body style="font-family: system-ui; max-width: 400px; margin: 100px auto; text-align: center;">
  <h1>CodeMentor</h1>
  <h2>Error</h2>
  <p>The code has expired or was already used.</p>
</body>
</html>`;
      }

      if (action === 'deny') {
        await db
          .update(deviceCodes)
          .set({ status: 'denied' })
          .where(eq(deviceCodes.id, deviceCodeRecord.id));

        return `<!DOCTYPE html>
<html>
<head><title>CodeMentor - Denied</title></head>
<body style="font-family: system-ui; max-width: 400px; margin: 100px auto; text-align: center;">
  <h1>CodeMentor</h1>
  <h2>Access Denied</h2>
  <p>You have denied access to the CLI. You can close this window.</p>
</body>
</html>`;
      }

      // For demo purposes, create or get a demo user
      // In production, this would use the authenticated user from the session
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, 'demo@codementor.dev'));

      let authorizedUser: { id: string; email: string; name: string };

      if (existingUsers.length === 0) {
        const userId = generateId();
        const insertedUsers = await db
          .insert(users)
          .values({
            id: userId,
            email: 'demo@codementor.dev',
            name: 'Demo User',
          })
          .returning();
        authorizedUser = insertedUsers[0]!;
      } else {
        authorizedUser = existingUsers[0]!;
      }

      // Create a session token
      const refreshToken = generateDeviceCode();
      const sessionId = generateId();
      const sessionToken = generateDeviceCode();

      await db.insert(sessions).values({
        id: sessionId,
        userId: authorizedUser.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 86400 * 30 * 1000), // 30 days
      });

      // Update device code with tokens
      await db
        .update(deviceCodes)
        .set({
          status: 'authorized',
          userId: authorizedUser.id,
          accessToken: sessionId, // Use session ID as access token
          refreshToken,
        })
        .where(eq(deviceCodes.id, deviceCodeRecord.id));

      return `<!DOCTYPE html>
<html>
<head><title>CodeMentor - Success</title></head>
<body style="font-family: system-ui; max-width: 400px; margin: 100px auto; text-align: center;">
  <h1>CodeMentor</h1>
  <h2>Successfully Authorized!</h2>
  <p>You have authorized the CLI. You can close this window and return to your terminal.</p>
</body>
</html>`;
    },
    {
      body: t.Object({
        user_code: t.String(),
        action: t.Union([t.Literal('approve'), t.Literal('deny')]),
      }),
    }
  );

// API route to get current user info
export const userRoutes = new Elysia({ prefix: '/api' })
  .get('/me', async ({ headers, set }) => {
    const authHeader = headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401;
      return {
        error: 'unauthorized',
        error_description: 'Missing or invalid authorization header',
      };
    }

    const sessionId = authHeader.slice(7);

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())));

    if (!session) {
      set.status = 401;
      return { error: 'unauthorized', error_description: 'Invalid or expired session' };
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.userId));

    if (!user) {
      set.status = 401;
      return { error: 'unauthorized', error_description: 'User not found' };
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  })
  .post('/logout', async ({ headers, set }) => {
    const authHeader = headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401;
      return { error: 'unauthorized', error_description: 'Missing authorization header' };
    }

    const sessionId = authHeader.slice(7);

    await db.delete(sessions).where(eq(sessions.id, sessionId));

    return { success: true };
  });
