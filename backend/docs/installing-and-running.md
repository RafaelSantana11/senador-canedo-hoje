# Installation

NestJS Boilerplate supports [TypeORM](https://www.npmjs.com/package/typeorm) and [Mongoose](https://www.npmjs.com/package/mongoose) for working with databases. By default, TypeORM uses [PostgreSQL](https://www.postgresql.org/) as the main database, but you can use any relational database.

Switching between TypeORM and Mongoose is implemented based on the [Hexagonal Architecture](architecture.md#hexagonal-architecture). This makes it easy to choose the right database for your application.

---

## Table of Contents <!-- omit in toc -->

- [Comfortable development (PostgreSQL + TypeORM)](#comfortable-development-postgresql--typeorm)
  - [Video guideline (PostgreSQL + TypeORM)](#video-guideline-postgresql--typeorm)
- [Comfortable development (MongoDB + Mongoose)](#comfortable-development-mongodb--mongoose)
- [Quick run (PostgreSQL + TypeORM)](#quick-run-postgresql--typeorm)
- [Quick run (MongoDB + Mongoose)](#quick-run-mongodb--mongoose)
- [Local Docker environment for this project](#local-docker-environment-for-this-project)
  - [Running the full stack (API inside Docker)](#running-the-full-stack-api-inside-docker)
  - [Running only the dependencies (API on the host)](#running-only-the-dependencies-api-on-the-host)
  - [MinIO web console](#minio-web-console)
  - [Switching `FILE_DRIVER`](#switching-file_driver)
  - [CORS for the `s3-presigned` driver](#cors-for-the-s3-presigned-driver)
  - [Production storage: DigitalOcean Spaces](#production-storage-digitalocean-spaces)
- [Links](#links)

---

## Comfortable development (PostgreSQL + TypeORM)

1. Clone repository

   ```bash
   git clone --depth 1 https://github.com/brocoders/nestjs-boilerplate.git my-app
   ```

1. Go to folder, and copy `env-example-relational` as `.env`.

   ```bash
   cd my-app/
   cp env-example-relational .env
   ```

1. Change `DATABASE_HOST=postgres` to `DATABASE_HOST=localhost`

   Change `MAIL_HOST=maildev` to `MAIL_HOST=localhost`

1. Run additional container:

   ```bash
   docker compose up -d postgres adminer maildev
   ```

1. Install dependency

   ```bash
   npm install
   ```

1. Run app configuration

   > You should run this command only the first time on initialization of your project, all next time skip it.

   > If you want to contribute to the boilerplate, you should NOT run this command.

   ```bash
   npm run app:config
   ```

1. Run migrations

   ```bash
   npm run migration:run
   ```

1. Run seeds

   ```bash
   npm run seed:run:relational
   ```

1. Run app in dev mode

   ```bash
   npm run start:dev
   ```

1. Open <http://localhost:3000>

### Video guideline (PostgreSQL + TypeORM)

<https://github.com/user-attachments/assets/136a16aa-f94a-4b20-8eaf-6b4262964315>

---

## Comfortable development (MongoDB + Mongoose)

1. Clone repository

   ```bash
   git clone --depth 1 https://github.com/brocoders/nestjs-boilerplate.git my-app
   ```

1. Go to folder, and copy `env-example-document` as `.env`.

   ```bash
   cd my-app/
   cp env-example-document .env
   ```

1. Change `DATABASE_URL=mongodb://mongo:27017` to `DATABASE_URL=mongodb://localhost:27017`

1. Run additional container:

   ```bash
   docker compose -f docker-compose.document.yaml up -d mongo mongo-express maildev
   ```

1. Install dependency

   ```bash
   npm install
   ```

1. Run app configuration

   > You should run this command only the first time on initialization of your project, all next time skip it.

   > If you want to contribute to the boilerplate, you should NOT run this command.

   ```bash
   npm run app:config
   ```

1. Run seeds

   ```bash
   npm run seed:run:document
   ```

1. Run app in dev mode

   ```bash
   npm run start:dev
   ```

1. Open <http://localhost:3000>

---

## Quick run (PostgreSQL + TypeORM)

If you want quick run your app, you can use following commands:

1. Clone repository

   ```bash
   git clone --depth 1 https://github.com/brocoders/nestjs-boilerplate.git my-app
   ```

1. Go to folder, and copy `env-example-relational` as `.env`.

   ```bash
   cd my-app/
   cp env-example-relational .env
   ```

1. Run containers

   ```bash
   docker compose up -d
   ```

1. For check status run

   ```bash
   docker compose logs
   ```

1. Open <http://localhost:3000>

---

## Quick run (MongoDB + Mongoose)

If you want quick run your app, you can use following commands:

1. Clone repository

   ```bash
   git clone --depth 1 https://github.com/brocoders/nestjs-boilerplate.git my-app
   ```

1. Go to folder, and copy `env-example-document` as `.env`.

   ```bash
   cd my-app/
   cp env-example-document .env
   ```

1. Run containers

   ```bash
   docker compose -f docker-compose.document.yaml up -d
   ```

1. For check status run

   ```bash
   docker compose -f docker-compose.document.yaml logs
   ```

1. Open <http://localhost:3000>

---

## Local Docker environment for this project

This fork ships two Docker Compose profiles, and both include PostgreSQL, `maildev` and a local MinIO container (S3-compatible storage used by the `s3`/`s3-presigned` file drivers — see [File uploading](file-uploading.md)). Pick the profile that matches how you want to run the API; both start the same way:

1. Clone the repository and go to the `backend` folder.
1. Copy `env-example-relational` as `.env`.

   ```bash
   cp env-example-relational .env
   ```

   The default values already work for local development, in **both** profiles, with no manual editing. `AWS_S3_ENDPOINT` defaults to `http://localhost:9000` (the value the API needs when it runs on the host); in the full-stack profile `docker-compose.yaml` overrides it to `http://minio:9000` for the `api` service, since inside the Docker network `localhost` would be the API's own container. `DATABASE_HOST` is overridden the same way.

### Running the full stack (API inside Docker)

Everything runs in containers: API, Postgres, `maildev` and MinIO (plus a `minio-init` sidecar that creates and configures the bucket on startup).

```bash
docker compose up -d --build
docker compose ps      # all services should be Up; postgres and minio healthy
docker compose logs api
```

Migrations run automatically before the API starts. Confirm it's up:

```bash
curl -i http://localhost:3000/health
# expected: HTTP 200, {"status":"ok"}
```

Swagger is available at <http://localhost:3000/docs>.

To reset everything and confirm the environment is reproducible from scratch:

```bash
docker compose down -v   # ⚠️ removes volumes: drops the database and the local MinIO files
docker compose up -d --build
```

### Running only the dependencies (API on the host)

Runs Postgres, `maildev`, MinIO and Redis in Docker; the API runs on your machine with `start:dev`'s watch mode.

```bash
docker compose -f docker-compose-dev.yaml up -d
npm run start:dev
curl -i http://localhost:3000/health
```

⚠️ In this profile the API is **not** part of the Docker network, so it reaches every dependency via `localhost` rather than by the Docker service name. That is exactly what `env-example-relational` ships as the default (`AWS_S3_ENDPOINT=http://localhost:9000`, `DATABASE_HOST=localhost`), so no edit is needed here — it's the full-stack profile that overrides those two values. `AWS_S3_PUBLIC_URL` is `localhost` in both profiles, because it is resolved by the user's **browser**, never from inside the network.

> Note for the `s3-presigned` driver: the signed upload URL must point at a host the **browser** can resolve, and the host is part of the AWS signature (so it cannot be swapped afterwards). In this profile `AWS_S3_ENDPOINT` is already `localhost`, so nothing extra is needed. In the full-stack profile the API talks to MinIO as `minio:9000`, which does not exist outside the Docker network — that is what `AWS_S3_PUBLIC_ENDPOINT` is for, and `docker-compose.yaml` sets it to `http://localhost:9000` for the `api` service automatically. Both profiles therefore support browser-side direct upload out of the box.

### MinIO web console

MinIO exposes two ports: the S3 API (`MINIO_PORT`, default `9000`) and a web console (`MINIO_CONSOLE_PORT`, default `9001`), reachable at <http://localhost:9001> in either profile. Log in with `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from your `.env`. It's useful to browse the bucket, confirm that an uploaded object actually landed in storage, and check the bucket's public-read policy — see [File uploading](file-uploading.md) for the upload flow itself.

### Switching `FILE_DRIVER`

`FILE_DRIVER` accepts `local`, `s3` and `s3-presigned` (default: `local`, so you don't need MinIO running just to start the API). To switch:

1. Set `FILE_DRIVER=s3` or `FILE_DRIVER=s3-presigned` in `.env`, and make sure `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `AWS_S3_REGION`, `AWS_DEFAULT_S3_BUCKET`, `AWS_S3_ENDPOINT`, `AWS_S3_FORCE_PATH_STYLE` and `AWS_S3_PUBLIC_URL` are filled in (see `env-example-relational` for what each one means).
1. **Restart the API.** The driver is resolved once, when the module graph is built in `src/infra/files/files.module.ts` — it reads `FILE_DRIVER` at module-load time to decide which uploader module to wire in, so it is **not** hot-swappable. Editing `.env` alone does not restart a running process; stop and re-run `npm run start:dev` (or `docker compose up -d --build api` for the full-stack profile) after changing it.

Full configuration details and the request/response flow for each driver are in [File uploading](file-uploading.md).

### CORS for the `s3-presigned` driver

With `FILE_DRIVER=s3-presigned`, the **browser** uploads the file directly to the bucket using a presigned URL — the API only generates the URL, it never receives the binary. This means the bucket itself, not the API, needs to allow the frontend's origin:

- **MinIO** (local): configure CORS on the bucket with the `mc` client (the same client already used by the `minio-init` sidecar to create the bucket).
- **DigitalOcean Spaces** (production): configure CORS from the Spaces panel (bucket → Settings → CORS Configurations).

This isn't a code change, but skipping it will block the frontend the moment it tries to integrate with the `s3-presigned` driver. See [File uploading](file-uploading.md#configuration-for-s3-presigned-driver) for an example CORS policy.

### Production storage: DigitalOcean Spaces

Production does not use AWS S3 — it uses a DigitalOcean Space, which is S3-compatible. Moving from the local MinIO container to Spaces is purely a matter of environment variables (`AWS_S3_ENDPOINT`, `AWS_S3_FORCE_PATH_STYLE`, `AWS_S3_PUBLIC_URL`, `AWS_S3_REGION` and the access keys); no code changes are required. See `.specs/tasks-parte-2.md` ("Anexo — Produção: DigitalOcean Spaces") for the provisioning checklist (creating the Space, generating Spaces access keys, deciding on the CDN, etc.).

---

## Links

- Swagger (API docs): <http://localhost:3000/docs>
- Adminer (client for DB): <http://localhost:8080>
- MongoDB Express (client for DB): <http://localhost:8081/>
- Maildev: <http://localhost:1080>
- MinIO console: <http://localhost:9001>

---

Previous: [Introduction](introduction.md)

Next: [Architecture](architecture.md)
