import type { DatabaseService } from '../../../server/src/types.js';
import type { PublicUser, SessionRecord, UserRecord } from '../types/UsersTypes.js';

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: 'user';
  credential_salt: string;
  credential_hash: string;
  credential_iterations: number;
  created_at: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  session_hash: string;
  expires_at: string;
  created_at: string;
};

type SessionWithUserRow = SessionRow & {
  user_email: string;
  user_display_name: string | null;
  user_role: 'user';
};

function map_user(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    credentialSalt: row.credential_salt,
    credentialHash: row.credential_hash,
    credentialIterations: row.credential_iterations,
    createdAt: row.created_at,
  };
}

function map_session(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    sessionHash: row.session_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}

  async find_user_by_email(email: string): Promise<UserRecord | null> {
    const result = await this.database.query<UserRow>(
      `
      SELECT
        id::text,
        email,
        display_name,
        role,
        credential_salt,
        credential_hash,
        credential_iterations,
        created_at::text
      FROM users
      WHERE lower(email) = lower($1)
      LIMIT 1
      `,
      [email]
    );

    return result.rows[0] ? map_user(result.rows[0]) : null;
  }

  async create_session(input: {
    userId: string;
    sessionHash: string;
    expiresAt: string;
  }): Promise<SessionRecord> {
    const result = await this.database.query<SessionRow>(
      `
      INSERT INTO user_sessions (user_id, session_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id::text, user_id::text, session_hash, expires_at::text, created_at::text
      `,
      [input.userId, input.sessionHash, input.expiresAt]
    );

    return map_session(result.rows[0]);
  }

  async find_session_by_session_hash(session_hash: string): Promise<{ session: SessionRecord; user: PublicUser } | null> {
    const result = await this.database.query<SessionWithUserRow>(
      `
      SELECT
        user_sessions.id::text,
        user_sessions.user_id::text,
        user_sessions.session_hash,
        user_sessions.expires_at::text,
        user_sessions.created_at::text,
        users.email AS user_email,
        users.display_name AS user_display_name,
        users.role AS user_role
      FROM user_sessions
      INNER JOIN users ON users.id = user_sessions.user_id
      WHERE user_sessions.session_hash = $1
        AND user_sessions.expires_at > NOW()
      LIMIT 1
      `,
      [session_hash]
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      session: map_session(row),
      user: {
        id: row.user_id,
        email: row.user_email,
        displayName: row.user_display_name,
        role: row.user_role,
      },
    };
  }

  async delete_session_by_session_hash(session_hash: string): Promise<void> {
    await this.database.query('DELETE FROM user_sessions WHERE session_hash = $1', [session_hash]);
  }

  async delete_expired_sessions(): Promise<void> {
    await this.database.query('DELETE FROM user_sessions WHERE expires_at <= NOW()');
  }
}
