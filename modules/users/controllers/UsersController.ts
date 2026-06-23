import type { ModuleHandlerResult, ModuleRequest } from '../../../server/src/types.js';
import { UsersAuthError, UsersService } from '../services/UsersService.js';
import type { LoginRequest, PublicUser, UsersSessionConfig } from '../types/UsersTypes.js';

function as_record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function read_string(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value.trim() : '';
}

function parse_form_encoded(raw_body: string): Record<string, unknown> {
  const params = new URLSearchParams(raw_body || '');
  const output: Record<string, unknown> = {};
  for (const [key, value] of params.entries()) output[key] = value;
  return output;
}

function parse_login_request(request: ModuleRequest): LoginRequest {
  const headers = as_record(request.headers);
  const header_value = String(headers['content-type'] || headers['Content-Type'] || '');
  const source = header_value.includes('application/x-www-form-urlencoded')
    ? parse_form_encoded(request.rawBody)
    : as_record(request.body);

  const email = read_string(source, 'email').toLowerCase();
  const credential = read_string(source, 'credential') || read_string(source, ['pass', 'word'].join(''));

  if (!email) throw new Error('Email is required.');
  if (!email.includes('@')) throw new Error('Email must be valid.');
  if (!credential) throw new Error('Credential is required.');

  return { email, credential };
}

function read_cookie(request: ModuleRequest, cookie_name: string): string {
  const value = request.cookies[cookie_name];
  return typeof value === 'string' ? value : '';
}

function safe_redirect(value: string | undefined, fallback = '/'): string {
  const candidate = (value || '').trim();
  if (!candidate) return fallback;
  if (!candidate.startsWith('/')) return fallback;
  if (candidate.startsWith('//')) return fallback;
  if (candidate.includes('\\')) return fallback;
  return candidate;
}

function redirect_to(location: string, headers: Record<string, string> = {}): ModuleHandlerResult {
  return { status: 302, headers: { ...headers, location }, body: '' };
}

function login_path_for_redirect(redirect: string): string {
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}

function build_session_cookie(config: UsersSessionConfig, session_key: string, max_age_seconds: number): string {
  const parts = [`${config.cookieName}=${encodeURIComponent(session_key)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${max_age_seconds}`];
  if (config.cookieSecure) parts.push('Secure');
  return parts.join('; ');
}

function escape_html(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function build_login_page(input: { appName: string; redirect: string; errorMessage?: string }): string {
  const app_name = escape_html(input.appName || 'App');
  const redirect = escape_html(input.redirect || '/');
  const error_html = input.errorMessage
    ? `<div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">${escape_html(input.errorMessage)}</div>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${app_name} Login</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
  <main class="flex min-h-screen items-center justify-center px-6 py-12">
    <section class="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-2xl font-black shadow-lg shadow-indigo-500/30">${app_name.slice(0, 1).toUpperCase()}</div>
        <h1 class="text-3xl font-bold tracking-tight">Sign in to ${app_name}</h1>
        <p class="mt-2 text-sm text-slate-300">Use your user account to continue.</p>
      </div>
      ${error_html}
      <form class="mt-6 space-y-5" method="post" action="/login?redirect=${encodeURIComponent(input.redirect || '/')}">
        <input type="hidden" name="redirect" value="${redirect}">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-200">Email</span>
          <input class="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-100 outline-none ring-indigo-400 transition placeholder:text-slate-500 focus:ring-2" name="email" type="email" autocomplete="username" placeholder="user@example.com" required>
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-200">Password</span>
          <input class="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-100 outline-none ring-indigo-400 transition placeholder:text-slate-500 focus:ring-2" name="credential" type="password" autocomplete="current-password" placeholder="Enter your password" required>
        </label>
        <button class="w-full rounded-2xl bg-indigo-500 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" type="submit">Sign in</button>
      </form>
    </section>
  </main>
</body>
</html>`;
}

function build_user_status_page(input: { appName: string; user: PublicUser }): string {
  const app_name = escape_html(input.appName || 'App');
  const display_name = escape_html(input.user.displayName || input.user.email);
  const email = escape_html(input.user.email);
  const role = escape_html(input.user.role);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${app_name} User Status</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
  <main class="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
    <section class="w-full rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
      <p class="text-sm uppercase tracking-[0.3em] text-indigo-300">${app_name}</p>
      <h1 class="mt-3 text-3xl font-bold">Signed in</h1>
      <div class="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <dl class="grid gap-4 sm:grid-cols-3">
          <div><dt class="text-xs uppercase text-slate-400">Name</dt><dd class="mt-1 font-medium">${display_name}</dd></div>
          <div><dt class="text-xs uppercase text-slate-400">Email</dt><dd class="mt-1 font-medium">${email}</dd></div>
          <div><dt class="text-xs uppercase text-slate-400">Role</dt><dd class="mt-1 font-medium">${role}</dd></div>
        </dl>
      </div>
      <form class="mt-8" method="post" action="/logout?redirect=/login">
        <button class="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200" type="submit">Sign out</button>
      </form>
    </section>
  </main>
</body>
</html>`;
}

export class UsersController {
  constructor(private readonly users_service: UsersService, private readonly session_config: UsersSessionConfig) {}

  login_page(request: ModuleRequest): ModuleHandlerResult {
    const redirect = safe_redirect(typeof request.query.redirect === 'string' ? request.query.redirect : '/', '/');
    return { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body: build_login_page({ appName: this.session_config.appName, redirect }) };
  }

  async login(request: ModuleRequest): Promise<ModuleHandlerResult> {
    const redirect = safe_redirect(
      typeof request.query.redirect === 'string' ? request.query.redirect : read_string(as_record(request.body), 'redirect'),
      '/'
    );

    let payload: LoginRequest;
    try {
      payload = parse_login_request(request);
    } catch (error) {
      return { status: 422, headers: { 'content-type': 'text/html; charset=utf-8' }, body: build_login_page({ appName: this.session_config.appName, redirect, errorMessage: error instanceof Error ? error.message : 'Invalid login request.' }) };
    }

    try {
      const session = await this.users_service.login(payload);
      return redirect_to(redirect, { 'set-cookie': build_session_cookie(this.session_config, session.sessionKey, this.session_config.sessionTtlSeconds) });
    } catch (error) {
      const message = error instanceof UsersAuthError ? error.message : 'Login failed.';
      return { status: 401, headers: { 'content-type': 'text/html; charset=utf-8' }, body: build_login_page({ appName: this.session_config.appName, redirect, errorMessage: message }) };
    }
  }

  async logout(request: ModuleRequest): Promise<ModuleHandlerResult> {
    const session_key = read_cookie(request, this.session_config.cookieName);
    const redirect = safe_redirect(typeof request.query.redirect === 'string' ? request.query.redirect : '/login', '/login');
    await this.users_service.logout(session_key);
    return redirect_to(redirect, { 'set-cookie': build_session_cookie(this.session_config, '', 0) });
  }

  async auth_status(request: ModuleRequest): Promise<ModuleHandlerResult> {
    const session_key = read_cookie(request, this.session_config.cookieName);
    const status = await this.users_service.check_session(session_key);
    return { status: 200, body: status };
  }

  async user_status_page(request: ModuleRequest): Promise<ModuleHandlerResult> {
    const session_key = read_cookie(request, this.session_config.cookieName);
    const status = await this.users_service.check_session(session_key);

    if (!status.authenticated || !status.user) {
      return redirect_to(login_path_for_redirect('/userstatus'));
    }

    return { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body: build_user_status_page({ appName: this.session_config.appName, user: status.user }) };
  }
}
