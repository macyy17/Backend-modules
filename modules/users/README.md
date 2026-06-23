# Users Module

Browser sign-in module for one role: `user`.

## Public Pages

```txt
GET /login?redirect=/userstatus
GET /userstatus
```

`/userstatus` is guarded. Visitors without a valid browser state are redirected to `/login?redirect=/userstatus`.

## Methods

```txt
POST /login
POST /logout
GET /internal/auth/status
```

The login page itself only shows the sign-in form. It does not show debug controls.

## App Name

Set the app label in the module env file:

```txt
APP_NAME=Macyy
```

## Local Test User

```txt
email: user@example.com
credential: credential123
role: user
```

## Run

```bash
cd server
MODULE=users npm run dev
```
