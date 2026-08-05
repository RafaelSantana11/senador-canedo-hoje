# NestJS REST API boilerplate 🇺🇦

[![image](https://github.com/brocoders/nestjs-boilerplate/assets/72293912/197da43e-02f4-4895-8d3e-b7a42a591c26)](https://github.com/new?template_name=nestjs-boilerplate&template_owner=brocoders)

![github action status](https://github.com/brocoders/nestjs-boilerplate/actions/workflows/docker-e2e.yml/badge.svg)
[![renovate](https://img.shields.io/badge/renovate-enabled-%231A1F6C?logo=renovatebot)](https://app.renovatebot.com/dashboard)
[![Static Badge](https://img.shields.io/badge/supported_by-brocoders-d91965?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTMwIiBoZWlnaHQ9IjE4NyIgdmlld0JveD0iMCAwIDEzMCAxODciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI%2BCjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF83NzExXzQ4OTEpIj4KPHBhdGggZD0iTTc1Ljk5NjcgNDUuNzUwNkM2NS4xMDg5IDQ2Ljg2MSA1Ny45MjMgNTguNDA5NyA2Mi4yNzgxIDY4Ljg0OEwxMDguNDQyIDE4N0w3My42MDEzIDE1NS4wMTlIMzQuODQwOUMyMC42ODY4IDE1NS4wMTkgOS4zNjM0OSAxNDMuNDcgOS4zNjM0OSAxMjkuMDM0Vjk0LjYxMDVDOS4zNjM0OSA5Mi4xNjc1IDguNDkyNDYgODkuNzI0NSA2Ljc1MDQyIDg3Ljk0NzdMMCA4MS4wNjNMNi43NTA0MiA3NC4xNzgxQzguNDkyNDYgNzIuNDAxNCA5LjM2MzQ5IDY5Ljk1ODQgOS4zNjM0OSA2Ny41MTU0VjMxLjA5MjZDOS4zNjM0OSAxMy43Njk2IDIzLjA4MjEgMCAzOS44NDkyIDBINTguMTQwN0w3NS45OTY3IDQ1Ljc1MDZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTI1LjY0NiAxMTIuMzc4Vjk0LjgzMjdDMTI1LjY0NiA5My43MjIyIDEyNi4wODEgOTIuNjExOCAxMjYuOTUyIDkxLjcyMzRMMTMwLjAwMSA4OC4zOTIxTDEyNi45NTIgODUuMDYwN0MxMjYuMDgxIDg0LjE3MjQgMTI1LjY0NiA4My4wNjE5IDEyNS42NDYgODEuOTUxNFY2OS43MzY1QzEyNS42NDYgNTYuNDExMSAxMTQuOTc2IDQ1Ljc1MDcgMTAyLjEyOCA0NS43NTA3SDc1Ljk5NzNMMTA1LjYxMiAxMzAuODExQzEwNS42MTIgMTMwLjgxMSAxMTAuNjIgMTMwLjgxMSAxMTAuODM4IDEzMC44MTFDMTE5LjExMyAxMjkuMDM1IDEyNS42NDYgMTIxLjQ4NCAxMjUuNjQ2IDExMi4zNzhaIiBmaWxsPSJ3aGl0ZSIvPgo8L2c%2BCjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzc3MTFfNDg5MSI%2BCjxyZWN0IHdpZHRoPSIxMzAiIGhlaWdodD0iMTg3IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM%2BCjwvc3ZnPgo%3D&logoColor=d91965)](https://brocoders.com/)
[![Discord Badge](https://img.shields.io/badge/discord-NodeJS_boilerplate-d91965?style=flat&labelColor=5866f2&logo=discord&logoColor=white&link=https://discord.com/channels/520622812742811698/1197293125434093701)](https://discord.com/channels/520622812742811698/1197293125434093701)

<br />
<p align="center"><a href="https://discord.com/channels/520622812742811698/1197293125434093701"><img src="https://github.com/brocoders/nestjs-boilerplate/assets/72293912/c9d5fbf0-b56d-46b5-bb30-f96f44764bae" width="300"/></a></p>
<br />

## Description <!-- omit in toc -->

NestJS REST API boilerplate for a typical project

[Full documentation here](/docs/readme.md)

Demo: <https://nestjs-boilerplate-test.herokuapp.com/docs>

A fully compatible frontend boilerplate: <https://github.com/brocoders/extensive-react-boilerplate>

Belongs to the [bc boilerplates](https://bcboilerplates.com/) ecosystem

<https://github.com/user-attachments/assets/a66f114a-c714-4036-8eeb-20cbf04ae985>

## Table of Contents <!-- omit in toc -->

- [Ambiente local (Senador Canedo Hoje)](#ambiente-local-senador-canedo-hoje)
- [Features](#features)
- [Contributors](#contributors)
- [Support](#support)

## Ambiente local (Senador Canedo Hoje)

Sobe a API, o Postgres e um bucket S3-compatible (MinIO) em containers, prontos para
desenvolver e testar. Documentação detalhada em [docs/installing-and-running.md](docs/installing-and-running.md)
e [docs/file-uploading.md](docs/file-uploading.md).

### Pré-requisito

Docker e Docker Compose funcionando:

```bash
docker --version && docker compose version && docker ps
```

No WSL2, se o comando não for encontrado, ative a integração no Docker Desktop
(*Settings → Resources → WSL Integration*) e reabra o terminal.

### Passo a passo

```bash
cd backend

# 1. Criar o .env (OBRIGATÓRIO — sem ele o compose falha)
cp env-example-relational .env

# 2. Subir tudo
docker compose up -d --build

# 3. Conferir (aguarde os serviços ficarem healthy)
docker compose ps
curl -i http://localhost:3000/health     # HTTP 200 {"status":"ok"}

# 4. Criar os usuários de exemplo (necessário para logar)
npm install
npm run seed:run:relational
```

As migrations rodam sozinhas no boot da API, e o bucket é criado e configurado
automaticamente pelo serviço `minio-init`. Depois do passo 4 já dá para logar:

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/email/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"secret"}'
```

Usuários do seed: `admin@example.com` (admin) e `john.doe@example.com`, senha `secret`.

### O que sobe

| Serviço | URL | Para quê |
| --- | --- | --- |
| API | <http://localhost:3000> | A aplicação |
| Swagger | <http://localhost:3000/docs> | Documentação da API |
| Postgres | `localhost:5432` | Banco |
| MinIO (API S3) | <http://localhost:9000> | Bucket dos arquivos |
| MinIO (console) | <http://localhost:9001> | UI para inspecionar o bucket |
| Adminer | <http://localhost:8080> | UI do banco |
| Maildev | <http://localhost:1080> | Caixa de e-mail de teste |

Login do console do MinIO: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` do `.env`.

### Configurações manuais que você precisa saber

1. **`cp env-example-relational .env` é obrigatório.** O `.env` é versionado no
   `.gitignore` e o compose o lê via `env_file`; sem ele o `docker compose up` falha.
   Os defaults do exemplo já funcionam nos dois perfis, sem edição.

2. **O seed não roda sozinho.** O entrypoint aplica migrations, mas não semeia. Sem o
   passo 4 não existe usuário e o login falha — e o cadastro público
   (`POST /auth/email/register`) também não resolve, porque tenta enviar e-mail de
   ativação pelo Gmail (ver item 4). O seed roda **a partir do host** (precisa do
   `npm install`); rodá-lo dentro do container não funciona, porque a imagem de
   produção não carrega o `src/` completo de que ele depende.

3. **Para gravar no bucket, troque o `FILE_DRIVER`.** O padrão é `local` (grava em
   `./files`), então o MinIO sobe mas fica ocioso. Para usar o bucket:

   ```bash
   # no .env: FILE_DRIVER=s3   (ou s3-presigned)
   docker compose up -d --force-recreate api
   ```

   O driver é resolvido na carga do módulo — **reiniciar a API é obrigatório**, não é
   hot-swappable. O `path` retornado pela API já vem como URL pública pronta para uso
   direto em `<img src>`, funcionando nos dois drivers.

4. **O `maildev` não recebe e-mail.** O transporte está fixo em `smtp.gmail.com`
   ([mailer.service.ts](src/infra/mailer/mailer.service.ts)), então qualquer fluxo que
   dispare e-mail (cadastro público, recuperação de senha) falha localmente sem
   credenciais reais de Gmail. Tornar o transporte configurável é escopo da fase de
   Auth — o container sobe, mas hoje não é usado.

5. **Produção usa DigitalOcean Spaces**, não AWS S3. A troca é só por variáveis de
   ambiente (`AWS_S3_ENDPOINT`, `AWS_S3_FORCE_PATH_STYLE`, `AWS_S3_PUBLIC_URL`), sem
   mudança de código. Os valores estão comentados no `env-example-relational`.

### Comandos úteis

```bash
docker compose logs -f api            # acompanhar a API
docker compose down                   # parar (preserva banco e arquivos)
docker compose down -v                # zerar tudo (apaga banco e bucket)
```

### Perfil alternativo: API no host

Para rodar a API fora do Docker com hot-reload, subindo só as dependências:

```bash
docker compose -f docker-compose-dev.yaml up -d
npm install
npm run migration:run
npm run seed:run:relational
npm run start:dev
```

Não é preciso editar o `.env`: os defaults (`localhost`) são justamente os deste
perfil, e é o `docker-compose.yaml` que sobrescreve os hosts para os nomes de serviço
quando a API roda dentro da rede Docker.

## Features

- [x] Database. Support [TypeORM](https://www.npmjs.com/package/typeorm) and [Mongoose](https://www.npmjs.com/package/mongoose).
- [x] Seeding.
- [x] Config Service ([@nestjs/config](https://www.npmjs.com/package/@nestjs/config)).
- [x] Mailing ([nodemailer](https://www.npmjs.com/package/nodemailer)).
- [x] Sign in and sign up via email.
- [x] Social sign in (Apple, Facebook, Google).
- [x] Admin and User roles.
- [x] Internationalization/Translations (I18N) ([nestjs-i18n](https://www.npmjs.com/package/nestjs-i18n)).
- [x] File uploads. Support local and Amazon S3 drivers.
- [x] Swagger.
- [x] E2E and units tests.
- [x] Docker.
- [x] CI (Github Actions).

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Shchepotin"><img src="https://avatars.githubusercontent.com/u/6001723?v=4?s=100" width="100px;" alt="Vladyslav Shchepotin"/><br /><sub><b>Vladyslav Shchepotin</b></sub></a><br /><a href="#maintenance-Shchepotin" title="Maintenance">🚧</a> <a href="#doc-Shchepotin" title="Documentation">📖</a> <a href="#code-Shchepotin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/SergeiLomako"><img src="https://avatars.githubusercontent.com/u/31205374?v=4?s=100" width="100px;" alt="SergeiLomako"/><br /><sub><b>SergeiLomako</b></sub></a><br /><a href="#code-SergeiLomako" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ElenVlass"><img src="https://avatars.githubusercontent.com/u/72293912?v=4?s=100" width="100px;" alt="Elena Vlasenko"/><br /><sub><b>Elena Vlasenko</b></sub></a><br /><a href="#doc-ElenVlass" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://brocoders.com"><img src="https://avatars.githubusercontent.com/u/226194?v=4?s=100" width="100px;" alt="Rodion"/><br /><sub><b>Rodion</b></sub></a><br /><a href="#business-sars" title="Business development">💼</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## Support

If you seek consulting, support, or wish to collaborate, please contact us via [boilerplates@brocoders.com](mailto:boilerplates@brocoders.com). For any inquiries regarding boilerplates, feel free to ask on [GitHub Discussions](https://github.com/brocoders/nestjs-boilerplate/discussions) or [Discord](https://discord.com/channels/520622812742811698/1197293125434093701).

## Test Render Deploy
```
chmod +x test-render-deploy.sh && ./test-render-deploy.sh
```