# Users Module

Browser sign-in for one role: `user`.

## Public Pages

| Method | Path | Description |
| --- | --- | --- |
| GET | `/login` | Render the app sign-in page. Accepts `redirect`, default `/`. |
| GET | `/userstatus` | Guarded page. Redirects to `/login?redirect=/userstatus` when the visitor is not signed in. |

## App Name

The page title uses module env:

```txt
APP_NAME=Macyy
```

## Database

```txt
users
user_sessions
```
