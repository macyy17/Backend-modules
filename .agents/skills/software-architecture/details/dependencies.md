# Dependency Direction

Code points toward stable, lower-level layers.

## Preferred Direction

```txt
transport     -> services -> core
transport     -> services -> infrastructure
workers       -> services -> core
tests         -> source code
```

Core never points back to app infrastructure.

## Allowed Imports

Controllers may import:
- Request and response types.
- Middlewares and route helpers.
- Services.

Services may import:
- Core classes and functions.
- Repositories.
- Provider clients.
- Queues and event emitters.
- Shared types.

Core may import:
- Core types.
- Core interfaces.
- Utility functions and types.

Types may import:
- Parent types and interfaces.
- Other lightweight contracts.

## Avoid

- Core importing controllers.
- Core importing services.
- Core importing database clients.
- Types importing heavy runtime modules.
- Tests importing build output.
- Workers importing controllers.

## Breaking Cycles

When imports become circular:
- Move shared contracts to a shared type folder.
- Move pure behavior to core.
- Move orchestration to a service.
- Split a large file into smaller responsibilities.
- Replace direct calls with events when reactive flow is needed.

## Review Checklist

Before adding a dependency, ask:
- Is lower-level code importing higher-level code?
- Is this import only needed for a type?
- Can a shared interface remove the coupling?
- Does this dependency make tests harder?
- Would this still work if the package changed?
