# Users Module

Login, logout, and internal session status for a single user role: `user`.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/login` | Render the login page. |
| POST | `/login` | Log in with email and credential and set the session cookie. |
| POST | `/logout` | Log out and clear the session cookie. |
| GET | `/internal/auth/status` | Internal method to check whether the current request is logged in. |

## Seeded Local User

| Field | Value |
| --- | --- |
| Email | `user@example.com` |
| Credential | `credential123` |
| Role | `user` |

## POST `/login`

```json
{
  "email": "user@example.com",
  "credential": "credential123"
}
```

The response sets the `users_session` HTTP-only cookie.

## GET `/internal/auth/status`

With a valid cookie:

```json
{
  "authenticated": true,
  "user": {
    "email": "user@example.com",
    "role": "user"
  }
}
```

## Database

Tables:

```txt
users
user_sessions
```
