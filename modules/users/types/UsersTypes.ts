export type UserRole = 'user';

export type LoginRequest = {
  email: string;
  credential: string;
};

export type PublicUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
};

export type UserRecord = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  credentialSalt: string;
  credentialHash: string;
  credentialIterations: number;
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  sessionHash: string;
  expiresAt: string;
  createdAt: string;
};

export type AuthSession = {
  sessionKey: string;
  expiresAt: string;
  user: PublicUser;
};

export type AuthStatusResponse = {
  authenticated: boolean;
  user: PublicUser | null;
};

export type UsersSessionConfig = {
  appName: string;
  cookieName: string;
  sessionTtlSeconds: number;
  cookieSecure: boolean;
};
