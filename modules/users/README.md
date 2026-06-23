# Users Module

The users module provides a browser login page, logout method, and internal session status check.

It has one role only:

```txt
user
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/login` | Browser login page. |
| POST | `/login` | Log in and set the session cookie. |
| POST | `/logout` | Log out and clear the session cookie. |
| GET | `/internal/auth/status` | Internal auth/session check. |

## Environment

Copy:

```bash
cp modules/users/.env.example modules/users/.env
```

## Database Setup

```bash
psql "$DATABASE_URL" -f modules/users/db/migrations/001_create_users_and_sessions.sql
psql "$DATABASE_URL" -f modules/users/db/seeders/001_seed_local_user.sql
```

## Local User

```txt
email: user@example.com
credential: credential123
role: user
```

## Run With Module Runner

```bash
cd server
MODULE=users npm run dev
```

Open:

```txt
http://localhost:3333/login
http://localhost:3333/moduleinfo
http://localhost:3333/app
```
