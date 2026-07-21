---
inject: true
to: src/infra/database/seeds/relational/run-seed.ts
before: close
---
  await app.get(<%= name %>SeedService).run();
