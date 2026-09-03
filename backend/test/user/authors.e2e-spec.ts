import request from 'supertest';
import { APP_URL } from '../utils/constants';
import { login, uploadFile } from '../utils/create-content';
import { createUser, loginAsAdmin } from '../utils/create-user';

describe('Authors Module', () => {
  const app = APP_URL;

  let adminToken: string;
  let columnist: Awaited<ReturnType<typeof createUser>>;
  let plainAuthor: Awaited<ReturnType<typeof createUser>>;
  let plainAuthorToken: string;
  const plainAuthorPassword = 'secret';

  beforeAll(async () => {
    adminToken = await loginAsAdmin();

    columnist = await createUser(adminToken, {
      email: `columnist.${Date.now()}@example.com`,
      password: 'secret',
      name: `Colunista ${Date.now()}`,
      author: { bio: 'Escreve sobre política local.', isColumnist: true },
    });

    plainAuthor = await createUser(adminToken, {
      email: `plain.${Date.now()}@example.com`,
      password: plainAuthorPassword,
      name: `Reporter ${Date.now()}`,
    });

    plainAuthorToken = await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: plainAuthor.email, password: plainAuthorPassword })
      .then(({ body }) => body.token);
  });

  describe('Public routes', () => {
    it('should list authors without authentication: /api/v1/authors (GET)', () => {
      return request(app)
        .get('/api/v1/authors')
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.data)).toBe(true);
          expect(body.hasNextPage).toBeDefined();
        });
    });

    // O ponto mais sensível da rota pública: `name`/`photo` vêm do `User`, e o
    // domain `User` tem campos sob @Expose({ groups: ['me','admin'] }). Se
    // alguém aninhar o User na resposta do Author em vez de achatar, isso vaza.
    it('should never leak private user fields: /api/v1/authors (GET)', () => {
      return request(app)
        .get('/api/v1/authors?limit=50')
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.length).toBeGreaterThan(0);

          for (const author of body.data) {
            expect(author.name).toBeDefined();
            expect(author.slug).toBeDefined();

            expect(author.email).not.toBeDefined();
            expect(author.password).not.toBeDefined();
            expect(author.provider).not.toBeDefined();
            expect(author.socialId).not.toBeDefined();
            expect(author.trialStartDate).not.toBeDefined();
            expect(author.messageApiKey).not.toBeDefined();
            expect(author.status).not.toBeDefined();
            expect(author.role).not.toBeDefined();
            // nem achatado, nem aninhado
            expect(author.user).not.toBeDefined();
          }
        });
    });

    it('should filter columnists: /api/v1/authors?columnist=true (GET)', () => {
      return request(app)
        .get('/api/v1/authors?columnist=true&limit=50')
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.length).toBeGreaterThan(0);
          for (const author of body.data) {
            expect(author.isColumnist).toBe(true);
          }
          expect(body.data.some((a) => a.slug === columnist.author.slug)).toBe(
            true,
          );
        });
    });

    it('should get a profile by slug: /api/v1/authors/:slug (GET)', () => {
      return request(app)
        .get(`/api/v1/authors/${columnist.author.slug}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(columnist.author.id);
          expect(body.slug).toBe(columnist.author.slug);
          expect(body.bio).toBe('Escreve sobre política local.');
          expect(body.isColumnist).toBe(true);
          expect(body.name).toBe(columnist.name);
          expect(body.email).not.toBeDefined();
        });
    });

    it('should return 404 for an unknown slug: /api/v1/authors/:slug (GET)', () => {
      return request(app)
        .get(`/api/v1/authors/nao-existe-${Date.now()}`)
        .expect(404);
    });
  });

  describe('Routes that must not exist (they would break the 1:1 with User)', () => {
    it('should not expose POST /api/v1/authors', () => {
      return request(app)
        .post('/api/v1/authors')
        .auth(adminToken, { type: 'bearer' })
        .send({ slug: `orfao-${Date.now()}` })
        .expect(404);
    });

    it('should not expose DELETE /api/v1/authors/:id', () => {
      return request(app)
        .delete(`/api/v1/authors/${columnist.author.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('PATCH /api/v1/authors/:id', () => {
    it('should require authentication', () => {
      return request(app)
        .patch(`/api/v1/authors/${columnist.author.id}`)
        .send({ bio: 'sem token' })
        .expect(401);
    });

    it('should let the owner edit their own profile', () => {
      return request(app)
        .patch(`/api/v1/authors/${plainAuthor.author.id}`)
        .auth(plainAuthorToken, { type: 'bearer' })
        .send({ bio: 'Bio atualizada pelo dono.', isColumnist: true })
        .expect(200)
        .expect(({ body }) => {
          expect(body.bio).toBe('Bio atualizada pelo dono.');
          expect(body.isColumnist).toBe(true);
        });
    });

    it('should forbid editing another author', () => {
      return request(app)
        .patch(`/api/v1/authors/${columnist.author.id}`)
        .auth(plainAuthorToken, { type: 'bearer' })
        .send({ bio: 'invasão' })
        .expect(403);
    });

    it('should let an admin edit any author', () => {
      return request(app)
        .patch(`/api/v1/authors/${columnist.author.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ bio: 'Bio ajustada pelo admin.' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.bio).toBe('Bio ajustada pelo admin.');
        });
    });

    it('should reject a slug already in use', () => {
      return request(app)
        .patch(`/api/v1/authors/${plainAuthor.author.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ slug: columnist.author.slug })
        .expect(422)
        .expect(({ body }) => {
          expect(body.errors.slug).toBe('slugAlreadyExists');
        });
    });

    it('should reject a malformed slug', () => {
      return request(app)
        .patch(`/api/v1/authors/${plainAuthor.author.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ slug: 'Slug Inválido!' })
        .expect(422);
    });

    it('should change the slug and serve the profile on the new one', async () => {
      const newSlug = `slug-novo-${Date.now()}`;

      await request(app)
        .patch(`/api/v1/authors/${plainAuthor.author.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ slug: newSlug })
        .expect(200);

      await request(app).get(`/api/v1/authors/${newSlug}`).expect(200);
    });

    it('should return 404 for an unknown author id', () => {
      return request(app)
        .patch('/api/v1/authors/00000000-0000-4000-8000-000000000000')
        .auth(adminToken, { type: 'bearer' })
        .send({ bio: 'nada' })
        .expect(404);
    });
  });

  /**
   * `name` e `photo` não são colunas de `author` — moram no `User`, que é a
   * fonte única de verdade. Antes da correção, `whitelist: true` descartava os
   * dois campos antes do service e o `PATCH` respondia `200` com o autor
   * inalterado: falha silenciosa, o pior modo de falhar para quem consome.
   */
  describe('PATCH /api/v1/authors/:id — name e photo (gravam no User)', () => {
    let editor: Awaited<ReturnType<typeof createUser>>;
    let editorToken: string;
    let editorSlug: string;
    const editorPassword = 'secret';

    beforeAll(async () => {
      editor = await createUser(adminToken, {
        email: `editor.${Date.now()}@example.com`,
        password: editorPassword,
        name: `Nome Original ${Date.now()}`,
      });

      editorToken = await login(editor.email, editorPassword);
      editorSlug = editor.author.slug;
    });

    it('should actually persist the name, not just echo it back', async () => {
      const newName = `Nome Novo ${Date.now()}`;

      await request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(editorToken, { type: 'bearer' })
        .send({ name: newName })
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe(newName);
        });

      // Regressão do silêncio: só reler pega o campo descartado — a resposta
      // pode estar certa e o banco não.
      await request(app)
        .get(`/api/v1/authors/${editorSlug}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe(newName);
        });
    });

    it('should NOT regenerate the slug when the name changes', async () => {
      await request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(editorToken, { type: 'bearer' })
        .send({ name: `Outro Nome ${Date.now()}` })
        .expect(200)
        .expect(({ body }) => {
          // Trocar o slug junto quebraria links já publicados do perfil.
          expect(body.slug).toBe(editorSlug);
        });

      await request(app).get(`/api/v1/authors/${editorSlug}`).expect(200);
    });

    it('should reflect the new name on /api/v1/auth/me (same User)', async () => {
      const newName = `Nome Em Auth Me ${Date.now()}`;

      await request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(editorToken, { type: 'bearer' })
        .send({ name: newName })
        .expect(200);

      await request(app)
        .get('/api/v1/auth/me')
        .auth(editorToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe(newName);
        });
    });

    it('should update name and bio in the same request', async () => {
      const newName = `Nome E Bio ${Date.now()}`;

      await request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(editorToken, { type: 'bearer' })
        .send({ name: newName, bio: 'Bio e nome juntos.' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe(newName);
          expect(body.bio).toBe('Bio e nome juntos.');
        });
    });

    it('should let an admin rename another author', async () => {
      const newName = `Renomeado Pelo Admin ${Date.now()}`;

      await request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ name: newName })
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe(newName);
        });
    });

    it('should forbid renaming another author', () => {
      return request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(plainAuthorToken, { type: 'bearer' })
        .send({ name: 'Nome de invasor' })
        .expect(403)
        .expect(({ body }) => {
          expect(body.errors.id).toBe('cannotEditAnotherAuthor');
        });
    });

    it('should reject an empty name', () => {
      return request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(editorToken, { type: 'bearer' })
        .send({ name: '' })
        .expect(422);
    });

    it('should set and then clear the photo', async () => {
      const file = await uploadFile(adminToken);

      await request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(editorToken, { type: 'bearer' })
        .send({ photo: { id: file.id } })
        .expect(200)
        .expect(({ body }) => {
          expect(body.photo?.id).toBe(file.id);
        });

      await request(app)
        .get(`/api/v1/authors/${editorSlug}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.photo?.id).toBe(file.id);
        });

      await request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(editorToken, { type: 'bearer' })
        .send({ photo: null })
        .expect(200)
        .expect(({ body }) => {
          expect(body.photo).toBeNull();
        });
    });

    it('should reject a photo that does not exist', () => {
      return request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(editorToken, { type: 'bearer' })
        .send({ photo: { id: '00000000-0000-4000-8000-000000000000' } })
        .expect(422)
        .expect(({ body }) => {
          expect(body.errors.photo).toBe('imageNotExists');
        });
    });

    /**
     * A validação toda acontece antes de qualquer escrita, então uma requisição
     * recusada não pode deixar o nome novo gravado com o resto por aplicar.
     */
    it('should not persist the name when the request is rejected', async () => {
      const nameBefore = await request(app)
        .get(`/api/v1/authors/${editorSlug}`)
        .expect(200)
        .then(({ body }) => body.name);

      await request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(editorToken, { type: 'bearer' })
        .send({
          name: `Nome Que Nao Deve Colar ${Date.now()}`,
          photo: { id: '00000000-0000-4000-8000-000000000000' },
        })
        .expect(422);

      await request(app)
        .patch(`/api/v1/authors/${editor.author.id}`)
        .auth(editorToken, { type: 'bearer' })
        .send({
          name: `Nome Que Tambem Nao Deve Colar ${Date.now()}`,
          slug: columnist.author.slug,
        })
        .expect(422);

      await request(app)
        .get(`/api/v1/authors/${editorSlug}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe(nameBefore);
        });
    });
  });
});
