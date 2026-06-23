# Backend Modules Documentation

This directory documents how to run backend modules locally and how to create new portable modules.

## Documents

- [Module Runner Server](./module-runner-server.md)
- [Creating a Module](./creating-a-module.md)

## Current Working Example

The current example module is:

```txt
modules/translator
```

It exposes one endpoint path with two methods:

```txt
GET  /translate
POST /translate
```

The module runner can test it through:

```txt
/moduleinfo
/app
/runner/config
/db/health
```
- [Module Database Lifecycle](module-database-lifecycle.md)
