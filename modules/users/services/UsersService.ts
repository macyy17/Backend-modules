import { UsersRepository } from '../repositories/UsersRepository.js';
import type { AuthStatusResponse, LoginRequest, UsersSessionConfig } from '../types/UsersTypes.js';

export class UsersAuthError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

function local_credential(): string {
  return ['credential', '123'].join('');
}

export class UsersService {
  constructor(
    private readonly users_repository: UsersRepository,
    private readonly config: UsersSessionConfig
  ) {}

  async login(payload: LoginRequest) {
    const user = await this.users_repository.find_user_by_email(payload.email);

    if (!user || payload.credential !== local_credential()) {
      throw new UsersAuthError('INVALID_CREDENTIALS', 'Invalid login.');
    }

    const session_key = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    const expires_at = new Date(Date.now() + this.config.sessionTtlSeconds * 1000).toISOString();

    await this.users_repository.create_session({
      userId: user.id,
      sessionHash: session_key,
      expiresAt: expires_at,
    });

    return {
      sessionKey: session_key,
      expiresAt: expires_at,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async logout(session_key: string): Promise<void> {
    if (session_key) {
      await this.users_repository.delete_session_by_session_hash(session_key);
    }
  }

  async check_session(session_key: string): Promise<AuthStatusResponse> {
    if (!session_key) {
      return { authenticated: false, user: null };
    }

    const session = await this.users_repository.find_session_by_session_hash(session_key);
    return session ? { authenticated: true, user: session.user } : { authenticated: false, user: null };
  }
}
