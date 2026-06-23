import type { ModuleHandlerResult, ModuleRequest } from '../../../server/src/types.js';
import { UsersAuthError, UsersService } from '../services/UsersService.js';
import type { LoginRequest, UsersSessionConfig } from '../types/UsersTypes.js';

function as_record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function read_string(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value.trim() : '';
}

function parse_login_request(body: unknown): LoginRequest {
  const source = as_record(body);
  const email = read_string(source, 'email').toLowerCase();
  const credential = read_string(source, 'credential');

  if (!email) throw new Error('Email is required.');
  if (!email.includes('@')) throw new Error('Email must be valid.');
  if (!credential) throw new Error('Credential is required.');

  return { email, credential };
}

function read_cookie(request: ModuleRequest, cookie_name: string): string {
  const value = request.cookies[cookie_name];
  return typeof value === 'string' ? value : '';
}

function build_session_cookie(config: UsersSessionConfig, session_key: string, max_age_seconds: number): string {
  const parts = [`${config.cookieName}=${encodeURIComponent(session_key)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${max_age_seconds}`];
  if (config.cookieSecure) parts.push('Secure');
  return parts.join('; ');
}

function build_login_page(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Users Login</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 36rem; margin: 4rem auto; padding: 0 1rem; color: #111827; }
    form { display: grid; gap: 0.75rem; border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.75rem; }
    label { display: grid; gap: 0.25rem; font-weight: 600; }
    input, button { font: inherit; padding: 0.7rem; border-radius: 0.5rem; border: 1px solid #d1d5db; }
    button { cursor: pointer; background: #111827; color: white; }
    pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>Users Login</h1>
  <p>Seeded local user: <strong>user@example.com</strong></p>
  <form id="login-form">
    <label>Email <input name="email" type="email" value="user@example.com" required></label>
    <label>Credential <input name="credential" type="text" value="credential123" required></label>
    <button type="submit">Login</button>
  </form>
  <p><button id="status-button" type="button">Check session</button> <button id="logout-button" type="button">Logout</button></p>
  <pre id="output">Ready.</pre>
  <script>
    const output = document.querySelector('#output');
    const show = (value) => { output.textContent = JSON.stringify(value, null, 2); };
    document.querySelector('#login-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), credential: form.get('credential') })
      });
      show(await response.json());
    });
    document.querySelector('#status-button').addEventListener('click', async () => {
      const response = await fetch('/internal/auth/status');
      show(await response.json());
    });
    document.querySelector('#logout-button').addEventListener('click', async () => {
      const response = await fetch('/logout', { method: 'POST' });
      show(await response.json());
    });
  </script>
</body>
</html>`;
}

export class UsersController {
  constructor(private readonly users_service: UsersService, private readonly session_config: UsersSessionConfig) {}

  login_page(): ModuleHandlerResult {
    return { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body: build_login_page() };
  }

  async login(request: ModuleRequest): Promise<ModuleHandlerResult> {
    let payload: LoginRequest;
    try {
      payload = parse_login_request(request.body);
    } catch (error) {
      return { status: 422, body: { error: { code: 'VALIDATION_FAILED', message: error instanceof Error ? error.message : 'Invalid login request.', details: { fields: ['email', 'credential'] } } } };
    }
    try {
      const session = await this.users_service.login(payload);
      return { status: 200, headers: { 'set-cookie': build_session_cookie(this.session_config, session.sessionKey, this.session_config.sessionTtlSeconds) }, body: { authenticated: true, user: session.user, expiresAt: session.expiresAt } };
    } catch (error) {
      const message = error instanceof UsersAuthError ? error.message : 'Login failed.';
      const code = error instanceof UsersAuthError ? error.code : 'LOGIN_FAILED';
      return { status: 401, body: { error: { code, message, details: {} } } };
    }
  }

  async logout(request: ModuleRequest): Promise<ModuleHandlerResult> {
    const session_key = read_cookie(request, this.session_config.cookieName);
    await this.users_service.logout(session_key);
    return { status: 200, headers: { 'set-cookie': build_session_cookie(this.session_config, '', 0) }, body: { loggedOut: true } };
  }

  async auth_status(request: ModuleRequest): Promise<ModuleHandlerResult> {
    const session_key = read_cookie(request, this.session_config.cookieName);
    const status = await this.users_service.check_session(session_key);
    return { status: 200, body: status };
  }
}
