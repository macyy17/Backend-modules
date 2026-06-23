# Code Splitting

Place code where its purpose is obvious.

## Split By Responsibility First

Top-level folders are by responsibility:
- Controllers handle requests.
- Routes register endpoints.
- Middlewares process the request flow.
- Services coordinate behavior.
- Core models domain behavior.
- Jobs define tasks.
- Queues schedule or dispatch work.
- Events describe what happened.
- Listeners react to events.
- Workers run CLI entrypoints.
- Repositories persist data.

## Then By Category

Inside a responsibility folder, group by category or domain:

- `auth`, `admin`, `client`, `guest`, `system`, `billing`, `notifications`,
  `runtime`, or any project-specific domain.

Use category folders only when they help navigation.

## Avoid Flat Growth

Avoid one folder with many unrelated files at the same level. Introduce
categories as soon as the folder grows.

Bad:

```txt
src/services/
- AuthService.ts
- UserService.ts
- BillingService.ts
- RuntimeService.ts
- QueueService.ts
- NotificationService.ts
```

Better:

```txt
src/services/
- auth/AuthService.ts
- users/UserService.ts
- billing/BillingService.ts
- runtime/RuntimeService.ts
- system/QueuesService.ts
- notifications/NotificationsService.ts
```

## Split A File When

- It has multiple responsibilities.
- It mixes transport, business rules, and persistence.
- It has many unrelated private helpers.
- A clear subdomain emerges.

## Core vs Utils

- `core/utils/` — portable across projects, no domain names, copyable as a
  package.
- `core/` (non-utils) — project-specific, infrastructure-free.

## Anti-Patterns

- `src/utils/`, `src/helpers/`, `src/common/`, `src/misc/` as global dumps.
- A single `services/` flat folder with 20+ unrelated services.
- `index.ts` files that re-export an entire app tree.
- One controller file containing several unrelated controllers.
