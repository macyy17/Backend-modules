# Layers and Boundaries

Layers protect code from accidental coupling.

## Layers

| Layer          | Purpose                                                       |
| -------------- | ------------------------------------------------------------- |
| Transport      | HTTP, CLI, queue input, external events.                      |
| Application    | Services and orchestration.                                   |
| Domain (core)  | Core classes and pure functions; no infrastructure.           |
| Infrastructure | Database, queues, providers, filesystem, network.             |
| Contract       | Types and interfaces shared across layers.                    |

## Boundary Rules

- Transport may call services.
- Services may call core and infrastructure.
- Core must not call controllers, services, queues, or database code.
- Infrastructure hides package-specific details.
- Shared contracts do not import runtime-heavy modules.

## Core Boundary

Good core code:
- Accepts typed input.
- Returns typed output.
- Does not read env variables.
- Does not open network connections.
- Does not depend on HTTP or database packages.

## Application Boundary

Services:
- Validate app-level assumptions.
- Call core classes or functions.
- Call repositories or providers.
- Dispatch jobs or events.
- Keep business algorithms outside infrastructure wrappers.

## Transport Boundary

Controllers and workers:
- Parse input.
- Call services or core entrypoints.
- Format output.
- Handle status or exit codes.
- Do not own deep business rules.

## Dependency Smells

Watch for:
- Core importing services.
- Types importing controllers.
- Repositories importing controllers.
- Workers duplicating service logic.
- Controllers writing complex persistence code directly.
