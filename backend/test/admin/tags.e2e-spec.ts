import request from 'supertest';

import { APP_URL } from '../utils/constants';
import {
  createCategory,
  createNews,
  createTag,
  unique,
} from '../utils/create-content';
import { loginAsAdmin } from '../utils/create-user';

describe('Tags Module', () => {
  const app = APP_URL;

  let adminToken: string;
  let categoryId: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    categoryId = (await createCategory(adminToken)).id;
  });

  describe('Rotas públicas', () => {
    it('should list tags without authentication: /api/v1/tags (GET)', () => {
      return request(app)
        .get('/api/v1/tags')
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should require authentication to write: /api/v1/tags (POST)', () => {
      return request(app)
        .post('/api/v1/tags')
        .send({ name: unique('Sem Token') })
        .expect(401);
    });
  });

  describe('Criação', () => {
    it('should create with description and color: /api/v1/tags (POST)', async () => {
      const name = unique('Eleições');

      const { body } = await request(app)
        .post('/api/v1/tags')
        .auth(adminToken, { type: 'bearer' })
        .send({ name, description: 'assunto do momento', color: '#10b981' })
        .expect(201);

      expect(body.name).toBe(name);
      expect(body.description).toBe('assunto do momento');
      expect(body.color).toBe('#10b981');
      expect(body.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    });

    it('should reject duplicated name: /api/v1/tags (POST)', async () => {
      const existing = await createTag(adminToken);

      const { body } = await request(app)
        .post('/api/v1/tags')
        .auth(adminToken, { type: 'bearer' })
        .send({ name: existing.name })
        .expect(422);

      expect(body.errors).toEqual({ name: 'nameAlreadyExists' });
    });

    // O protótipo do painel manda `usageCount` no corpo; precisa parar.
    it('should reject usageCount in the payload: /api/v1/tags (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/tags')
        .auth(adminToken, { type: 'bearer' })
        .send({ name: unique('Com Contador'), usageCount: 7 })
        .expect(422);

      expect(body.errors).toEqual({ usageCount: 'readOnlyField' });
    });

    it('should reject usageCount on PATCH: /api/v1/tags/:id (PATCH)', async () => {
      const tag = await createTag(adminToken);

      const { body } = await request(app)
        .patch(`/api/v1/tags/${tag.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ usageCount: 7 })
        .expect(422);

      expect(body.errors).toEqual({ usageCount: 'readOnlyField' });
    });
  });

  describe('usageCount (derivado)', () => {
    it('should count how many news use the tag: /api/v1/tags (GET)', async () => {
      const tag = await createTag(adminToken);

      await request(app)
        .get('/api/v1/tags?limit=100')
        .expect(200)
        .expect(({ body }) => {
          const found = body.data.find((t) => t.id === tag.id);
          expect(found.usageCount).toBe(0);
        });

      await createNews(adminToken, { categoryId, tags: [{ id: tag.id }] });
      await createNews(adminToken, { categoryId, tags: [{ id: tag.id }] });

      await request(app)
        .get(`/api/v1/tags?limit=100&q=${encodeURIComponent(tag.name)}`)
        .expect(200)
        .expect(({ body }) => {
          const found = body.data.find((t) => t.id === tag.id);
          expect(found.usageCount).toBe(2);
        });
    });
  });

  describe('Atualização', () => {
    // PATCH existe porque "apaga e cria" perderia as associações N:N.
    it('should edit without losing the associations with the news: /api/v1/tags/:id (PATCH)', async () => {
      const tag = await createTag(adminToken);
      const news = await createNews(adminToken, {
        categoryId,
        tags: [{ id: tag.id }],
      });

      const newName = unique('Renomeada');

      await request(app)
        .patch(`/api/v1/tags/${tag.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ name: newName, color: '#f59e0b' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe(newName);
          expect(body.color).toBe('#f59e0b');
        });

      await request(app)
        .get(`/api/v1/news/${news.slug}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.tags).toHaveLength(1);
          expect(body.tags[0].id).toBe(tag.id);
          expect(body.tags[0].name).toBe(newName);
        });
    });
  });

  describe('Exclusão', () => {
    it('should delete the tag and its associations, preserving the news: /api/v1/tags/:id (DELETE)', async () => {
      const tag = await createTag(adminToken);
      const other = await createTag(adminToken);

      const news = await createNews(adminToken, {
        categoryId,
        status: 'published',
        tags: [{ id: tag.id }, { id: other.id }],
      });

      expect(news.tags).toHaveLength(2);

      await request(app)
        .delete(`/api/v1/tags/${tag.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);

      await request(app)
        .get(`/api/v1/news/${news.slug}`)
        .expect(200)
        .expect(({ body }) => {
          // a notícia sobrevive e mantém a outra tag
          expect(body.id).toBe(news.id);
          expect(body.tags.map((t) => t.id)).toEqual([other.id]);
        });
    });

    it('should return 404 for a tag that does not exist: /api/v1/tags/:id (DELETE)', () => {
      return request(app)
        .delete('/api/v1/tags/1e2c8b3a-0000-4000-8000-000000000000')
        .auth(adminToken, { type: 'bearer' })
        .expect(404);
    });
  });
});
