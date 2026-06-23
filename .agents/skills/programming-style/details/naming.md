# Naming

Names should describe responsibility, not implementation libraries.

## Case Rules

| Symbol     | Case        |
| ---------- | ----------- |
| Classes    | CapitalCase |
| Types      | CapitalCase |
| Interfaces | CapitalCase |
| Functions  | snake_case  |
| Variables  | snake_case  |
| Constants  | UPPER_CASE  |

File name must match the main exported symbol.

## Postfixes

Use postfixes to make purpose obvious:

- `Service`     - long-lived app services
- `Controller`  - request controllers
- `Middleware`  - request middleware
- `Guard`       - access checks
- `Job`         - runnable tasks
- `Queue`       - queue or scheduler
- `Event`       - past-tense events
- `Listener`    - event listeners
- `Type`        - type aliases
- `Interface`   - interfaces
- `Request`     - input payloads
- `Response`    - output payloads
- `Result`      - operation results
- `Config`      - configuration objects
- `Repository`  - persistence access
- `_worker`     - CLI worker file (snake_case)

## Avoid

- Generic names: `manager`, `helper`, `utils`, `data`, `common`, `misc`.
- Vendor-named services: `PgBossService`, `AxiosService`, `RedisService`.
- Single-word file names that don't say purpose: `job.ts`, `init.ts`, `types.ts`.

## Examples

Good:
- `src/services/queues/QueuesService.ts`
- `src/jobs/billing/CreateInvoiceJob.ts`
- `src/workers/queues_worker.ts`
- `src/core/utils/functions/parse_positive_integer.ts`
- `src/types/responses/admin/users/UserListResponse.ts`

Avoid:
- `src/services/PgBossService.ts`
- `src/jobs/job.ts`
- `src/workers/init.ts`
- `src/utils/helpers.ts`
- `src/types/types.ts`
