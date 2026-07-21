---
inject: true
to: src/infra/database/seeds/relational/seed.module.ts
before: \@Module
---
import { <%= name %>SeedModule } from './<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>/<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>-seed.module';
