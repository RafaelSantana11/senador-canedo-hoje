import request from 'supertest';

import { APP_URL } from '../utils/constants';
import {
  createCategory,
  createNews,
  createTag,
  login,
  unique,
} from '../utils/create-content';
import { createUser, loginAsAdmin } from '../utils/create-user';

describe('News Module (painel)', () => {
  const app = APP_URL;
  const password = 'secret';

  let adminToken: string;
  let categoryId: string;

  // Dois colaboradores comuns: o dono da notícia e um terceiro, para provar que
  // um `user` não edita conteúdo de outro.
  let ownerToken: string;
  let owner: Awaited<ReturnType<typeof createUser>>;
  let strangerToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    categoryId = (await createCategory(adminToken)).id;

    owner = await createUser(adminToken, {
      email: `news-owner.${Date.now()}@example.com`,
      password,
      name: `Autor Dono ${Date.now()}`,
    });
    ownerToken = await login(owner.email, password);

    const stranger = await createUser(adminToken, {
      email: `news-stranger.${Date.now()}@example.com`,
      password,
      name: `Autor Terceiro ${Date.now()}`,
    });
    strangerToken = await login(stranger.email, password);
  });

  describe('Criação', () => {
    it('should require authentication: /api/v1/news (POST)', () => {
      return request(app)
        .post('/api/v1/news')
        .send({ title: 'x', body: 'y', category: { id: categoryId } })
        .expect(401);
    });

    // Qualquer usuário do dashboard escreve — não é privilégio de admin.
    it('should let a plain user publish: /api/v1/news (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/news')
        .auth(ownerToken, { type: 'bearer' })
        .send({
          title: unique('Notícia do colaborador'),
          summary: 'linha fina',
          body: '# Conteúdo',
          status: 'published',
          category: { id: categoryId },
        })
        .expect(201);

      expect(body.status).toBe('published');
      expect(body.views).toBe(0);
    });

    it('should sign the news with the logged user Author: /api/v1/news (POST)', async () => {
      const news = await createNews(ownerToken, { categoryId });

      expect(news.author.id).toBe(owner.author.id);
      expect(news.author.slug).toBe(owner.author.slug);
      expect(news.author.userId).toBe(owner.id);
    });

    it('should generate the slug from the title and suffix on collision: /api/v1/news (POST)', async () => {
      const title = unique('Título Repetido');

      const first = await createNews(ownerToken, { categoryId, title });
      const second = await createNews(ownerToken, { categoryId, title });

      expect(second.slug).toBe(`${first.slug}-2`);
    });

    it('should reject an already used slug: /api/v1/news (POST)', async () => {
      const existing = await createNews(ownerToken, { categoryId });

      const { body } = await request(app)
        .post('/api/v1/news')
        .auth(ownerToken, { type: 'bearer' })
        .send({
          title: unique('Outro'),
          body: 'x',
          slug: existing.slug,
          category: { id: categoryId },
        })
        .expect(422);

      expect(body.errors).toEqual({ slug: 'slugAlreadyExists' });
    });

    // `GET /news/views` é declarada antes de `GET /news/:slug`: uma notícia com
    // slug `views` ficaria inalcançável pelo detalhe.
    it('should reject the reserved slug views: /api/v1/news (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/news')
        .auth(ownerToken, { type: 'bearer' })
        .send({
          title: unique('Slug reservado'),
          body: 'x',
          slug: 'views',
          category: { id: categoryId },
        })
        .expect(422);

      expect(body.errors).toEqual({ slug: 'slugAlreadyExists' });
    });

    it('should reject the reserved slug views: /api/v1/news/:id (PATCH)', async () => {
      const news = await createNews(ownerToken, { categoryId });

      const { body } = await request(app)
        .patch(`/api/v1/news/${news.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ slug: 'views' })
        .expect(422);

      expect(body.errors).toEqual({ slug: 'slugAlreadyExists' });
    });

    it('should never generate the reserved slug views: /api/v1/news (POST)', async () => {
      const news = await createNews(ownerToken, { categoryId, title: 'Views' });

      expect(news.slug).not.toBe('views');
      expect(news.slug).toMatch(/^views-\d+$/);
    });

    it('should reject a category that does not exist: /api/v1/news (POST)', () => {
      return request(app)
        .post('/api/v1/news')
        .auth(ownerToken, { type: 'bearer' })
        .send({
          title: unique('Sem categoria'),
          body: 'x',
          category: { id: '1e2c8b3a-0000-4000-8000-000000000000' },
        })
        .expect(404);
    });

    it('should reject a tag that does not exist: /api/v1/news (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/news')
        .auth(ownerToken, { type: 'bearer' })
        .send({
          title: unique('Tag fantasma'),
          body: 'x',
          category: { id: categoryId },
          tags: [{ id: '1e2c8b3a-0000-4000-8000-000000000000' }],
        })
        .expect(422);

      expect(body.errors).toEqual({ tags: 'tagNotExists' });
    });

    it('should reject a cover file that does not exist: /api/v1/news (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/news')
        .auth(ownerToken, { type: 'bearer' })
        .send({
          title: unique('Capa fantasma'),
          body: 'x',
          category: { id: categoryId },
          cover: { id: '1e2c8b3a-0000-4000-8000-000000000000' },
        })
        .expect(422);

      expect(body.errors).toEqual({ cover: 'imageNotExists' });
    });

    it('should require title and body: /api/v1/news (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/news')
        .auth(ownerToken, { type: 'bearer' })
        .send({ category: { id: categoryId } })
        .expect(422);

      expect(body.errors.title).toBeDefined();
      expect(body.errors.body).toBeDefined();
    });
  });

  describe('Campos derivados — recusados no payload', () => {
    // O painel manda `author: "Redação"` hoje; passa a ser derivado do login.
    it('should reject author in the payload: /api/v1/news (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/news')
        .auth(ownerToken, { type: 'bearer' })
        .send({
          title: unique('Com autor'),
          body: 'x',
          author: 'Redação',
          category: { id: categoryId },
        })
        .expect(422);

      expect(body.errors).toEqual({ author: 'readOnlyField' });
    });

    it('should reject views in the payload: /api/v1/news (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/news')
        .auth(ownerToken, { type: 'bearer' })
        .send({
          title: unique('Com views'),
          body: 'x',
          views: 9999,
          category: { id: categoryId },
        })
        .expect(422);

      expect(body.errors).toEqual({ views: 'readOnlyField' });
    });

    it('should reject publishedAt in the payload: /api/v1/news/:id (PATCH)', async () => {
      const news = await createNews(ownerToken, { categoryId });

      const { body } = await request(app)
        .patch(`/api/v1/news/${news.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ publishedAt: '2020-01-01T00:00:00.000Z' })
        .expect(422);

      expect(body.errors).toEqual({ publishedAt: 'readOnlyField' });
    });
  });

  describe('config (jsonb livre)', () => {
    const config = {
      position: 'destaque',
      positionOrder: 0,
      breaking: true,
      nested: { list: [1, 2, { deep: null }], text: 'acentuação ok' },
    };

    it('should round-trip values and nesting faithfully: /api/v1/news (POST)', async () => {
      const news = await createNews(ownerToken, { categoryId, config });

      expect(news.config).toEqual(config);

      // e continua igual quando lido de novo
      await request(app)
        .get(`/api/v1/news/${news.slug}`)
        .auth(ownerToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.config).toEqual(config);
        });
    });

    it('should replace the whole config on PATCH: /api/v1/news/:id (PATCH)', async () => {
      const news = await createNews(ownerToken, { categoryId, config });

      const { body } = await request(app)
        .patch(`/api/v1/news/${news.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ config: { position: 'normal' } })
        .expect(200);

      expect(body.config).toEqual({ position: 'normal' });
    });

    // O backend não impõe unicidade de espaço na vitrine — quem garante é o
    // cliente. Este teste registra a consequência aceita da decisão.
    it('should accept two news in the same showcase slot', async () => {
      const first = await createNews(ownerToken, {
        categoryId,
        status: 'published',
        config: { position: 'destaque' },
      });
      const second = await createNews(ownerToken, {
        categoryId,
        status: 'published',
        config: { position: 'destaque' },
      });

      expect(first.config).toEqual({ position: 'destaque' });
      expect(second.config).toEqual({ position: 'destaque' });
    });

    it('should reject config above 16 KB: /api/v1/news (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/news')
        .auth(ownerToken, { type: 'bearer' })
        .send({
          title: unique('Config gigante'),
          body: 'x',
          category: { id: categoryId },
          config: { blob: 'a'.repeat(17 * 1024) },
        })
        .expect(422);

      expect(body.errors).toEqual({ config: 'configTooLarge' });
    });

    it('should accept config close to the limit: /api/v1/news (POST)', async () => {
      const news = await createNews(ownerToken, {
        categoryId,
        config: { blob: 'a'.repeat(15 * 1024) },
      });

      expect((news.config as { blob: string }).blob).toHaveLength(15 * 1024);
    });
  });

  describe('publishedAt', () => {
    it('should stamp publishedAt on publish and preserve the original stamp', async () => {
      const draft = await createNews(ownerToken, { categoryId });
      expect(draft.publishedAt).toBeNull();

      const published = await request(app)
        .patch(`/api/v1/news/${draft.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ status: 'published' })
        .expect(200);

      const firstStamp = published.body.publishedAt;
      expect(firstStamp).not.toBeNull();

      // volta para rascunho: o carimbo é preservado
      const backToDraft = await request(app)
        .patch(`/api/v1/news/${draft.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ status: 'draft' })
        .expect(200);

      expect(backToDraft.body.publishedAt).toBe(firstStamp);

      // republica: não reescreve a data original
      const republished = await request(app)
        .patch(`/api/v1/news/${draft.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ status: 'published' })
        .expect(200);

      expect(republished.body.publishedAt).toBe(firstStamp);
    });
  });

  describe('Atualização de relações', () => {
    it('should change the category and replace the tags: /api/v1/news/:id (PATCH)', async () => {
      const otherCategory = await createCategory(adminToken);
      const tagA = await createTag(adminToken);
      const tagB = await createTag(adminToken);

      const news = await createNews(ownerToken, {
        categoryId,
        tags: [{ id: tagA.id }],
      });

      const { body } = await request(app)
        .patch(`/api/v1/news/${news.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .send({
          category: { id: otherCategory.id },
          tags: [{ id: tagB.id }],
        })
        .expect(200);

      expect(body.category.id).toBe(otherCategory.id);
      expect(body.tags.map((t) => t.id)).toEqual([tagB.id]);
    });

    it('should remove every tag when tags is an empty array: /api/v1/news/:id (PATCH)', async () => {
      const tag = await createTag(adminToken);
      const news = await createNews(ownerToken, {
        categoryId,
        tags: [{ id: tag.id }],
      });

      const { body } = await request(app)
        .patch(`/api/v1/news/${news.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ tags: [] })
        .expect(200);

      expect(body.tags).toEqual([]);
    });
  });

  describe('Autorização de conteúdo', () => {
    it('should let the author edit their own news: /api/v1/news/:id (PATCH)', async () => {
      const news = await createNews(ownerToken, { categoryId });

      return request(app)
        .patch(`/api/v1/news/${news.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ title: unique('Editado pelo dono') })
        .expect(200);
    });

    it('should answer 403 when another plain user edits: /api/v1/news/:id (PATCH)', async () => {
      const news = await createNews(ownerToken, { categoryId });

      const { body } = await request(app)
        .patch(`/api/v1/news/${news.id}`)
        .auth(strangerToken, { type: 'bearer' })
        .send({ title: unique('Invasão') })
        .expect(403);

      expect(body.errors).toEqual({ id: 'cannotManageAnotherAuthorNews' });
    });

    it('should answer 403 when another plain user deletes: /api/v1/news/:id (DELETE)', async () => {
      const news = await createNews(ownerToken, { categoryId });

      return request(app)
        .delete(`/api/v1/news/${news.id}`)
        .auth(strangerToken, { type: 'bearer' })
        .expect(403);
    });

    it('should let the admin edit news of any author: /api/v1/news/:id (PATCH)', async () => {
      const news = await createNews(ownerToken, { categoryId });

      return request(app)
        .patch(`/api/v1/news/${news.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ summary: 'ajuste editorial do admin' })
        .expect(200);
    });

    it('should let the admin delete news of any author: /api/v1/news/:id (DELETE)', async () => {
      const news = await createNews(ownerToken, { categoryId });

      return request(app)
        .delete(`/api/v1/news/${news.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);
    });
  });

  describe('Exclusão arquiva', () => {
    it('should archive instead of deleting: /api/v1/news/:id (DELETE)', async () => {
      const news = await createNews(ownerToken, {
        categoryId,
        status: 'published',
      });

      await request(app).get(`/api/v1/news/${news.slug}`).expect(200);

      await request(app)
        .delete(`/api/v1/news/${news.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .expect(204);

      // continua existindo para quem está autenticado...
      await request(app)
        .get(`/api/v1/news/${news.slug}`)
        .auth(ownerToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe('archived');
          expect(body.id).toBe(news.id);
        });

      // ...e desaparece do público
      await request(app).get(`/api/v1/news/${news.slug}`).expect(404);
    });

    it('should be idempotent: /api/v1/news/:id (DELETE)', async () => {
      const news = await createNews(ownerToken, { categoryId });

      await request(app)
        .delete(`/api/v1/news/${news.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .expect(204);

      await request(app)
        .delete(`/api/v1/news/${news.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .expect(204);
    });
  });

  describe('Listagem autenticada', () => {
    it('should respect ?status= for whoever has a token: /api/v1/news (GET)', async () => {
      const category = await createCategory(adminToken);

      await createNews(ownerToken, { categoryId: category.id });
      await createNews(ownerToken, {
        categoryId: category.id,
        status: 'published',
      });

      await request(app)
        .get(`/api/v1/news?status=draft&category=${category.slug}`)
        .auth(ownerToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toHaveLength(1);
          expect(body.data[0].status).toBe('draft');
        });

      await request(app)
        .get(`/api/v1/news?category=${category.slug}`)
        .auth(ownerToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          // sem filtro, o painel vê rascunho e publicada
          expect(body.data).toHaveLength(2);
        });
    });
  });
});
