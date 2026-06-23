import fs from 'node:fs';
import path from 'node:path';
import type { ModuleRegisterContext } from '../../../server/src/types.js';
import { UsersController } from '../controllers/UsersController.js';
import { UsersRepository } from '../repositories/UsersRepository.js';
import { UsersService } from '../services/UsersService.js';
import type { UsersSessionConfig } from '../types/UsersTypes.js';

function read_positive_integer(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function read_boolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function build_session_config(): UsersSessionConfig {
  return {
    appName: process.env.APP_NAME || 'Local App',
    cookieName: process.env.USERS_SESSION_COOKIE || 'users_session',
    sessionTtlSeconds: read_positive_integer(process.env.USERS_SESSION_TTL_SECONDS, 604800),
    cookieSecure: read_boolean(process.env.USERS_COOKIE_SECURE, false),
  };
}

async function apply_users_schema(context: ModuleRegisterContext): Promise<void> {
  const migration_file = path.join(context.selectedModule.path, 'db/migrations/001_create_users_and_sessions.sql');
  const seeder_file = path.join(context.selectedModule.path, 'db/seeders/001_seed_local_user.sql');

  if (fs.existsSync(migration_file)) {
    await context.database.query(fs.readFileSync(migration_file, 'utf8'));
  }

  if (fs.existsSync(seeder_file)) {
    await context.database.query(fs.readFileSync(seeder_file, 'utf8'));
  }
}

export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  await apply_users_schema(context);

  const users_repository = new UsersRepository(context.database);
  const session_config = build_session_config();
  const users_service = new UsersService(users_repository, session_config);
  const users_controller = new UsersController(users_service, session_config);

  context.addRoute('GET', '/login', users_controller.login_page.bind(users_controller), {
    description: 'Render the users login page.',
  });

  context.addRoute('POST', '/login', users_controller.login.bind(users_controller), {
    description: 'Log in a user and set a session cookie.',
  });

  context.addRoute('POST', '/logout', users_controller.logout.bind(users_controller), {
    description: 'Log out the current session and clear the session cookie.',
  });

  context.addRoute('GET', '/userstatus', users_controller.user_status_page.bind(users_controller), {
    description: 'Render the logged-in user status page. Redirects to /login when not logged in.',
  });

  context.addRoute('GET', '/internal/auth/status', users_controller.auth_status.bind(users_controller), {
    description: 'Internal method to check whether the current request is logged in.',
  });
}
