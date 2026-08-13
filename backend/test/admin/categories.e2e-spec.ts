import request from 'supertest';

import { APP_URL } from '../utils/constants';
import { createCategory, createNews, unique } from '../utils/create-content';
import { loginAsAdmin } from '../utils/create-user';

describe('Categories Module', () => {
  const app = APP_URL;

  let adminToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
  });

  describe('Rotas públicas', () => {
    it('should list categories without authentication: /api/v1/categories (GET)', () => {
      return request(app)
        .get('/api/v1/categories')
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.data)).toBe(true);
          expect(body.hasNextPage).toBeDefined();
        });
    });

    it('should return the 8 seeded categories: /api/v1/categories (GET)', () => {
      return request(app)
        .get('/api/v1/categories?limit=100')
        .expect(200)
        .expect(({ body }) => {
          const slugs = body.data.map((c) => c.slug);

          for (const slug of [
            'politica',
            'economia',
            'mundo',
            'tecnologia',
            'esportes',
            'saude',
            'cultura',
            'meio-ambiente',
          ]) {
            expect(slugs).toContain(slug);
          }
        });
    });

    // A categoria "Geral" é um default errado da tela de publicação do front —
    // registrado na spec de integração para o front corrigir, não acomodado
    // aqui com uma categoria inventada.
    it('should not invent a "Geral" category: /api/v1/categories (GET)', () => {
      return request(app)
        .get('/api/v1/categories?limit=100')
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.map((c) => c.name)).not.toContain('Geral');
        });
    });

    it('should require authentication to write: /api/v1/categories (POST)', () => {
      return request(app)
        .post('/api/v1/categories')
        .send({ name: unique('Sem Token') })
        .expect(401);
    });
  });

  describe('Criação', () => {
    it('should create with description, color and active: /api/v1/categories (POST)', async () => {
      const name = unique('Com Campos');

      const { body } = await request(app)
        .post('/api/v1/categories')
        .auth(adminToken, { type: 'bearer' })
        .send({
          name,
          description: 'Cobertura de bairro',
          color: '#3b82f6',
        })
        .expect(201);

      expect(body.name).toBe(name);
      expect(body.description).toBe('Cobertura de bairro');
      expect(body.color).toBe('#3b82f6');
      // default do campo
      expect(body.active).toBe(true);
      // slug derivado do nome
      expect(body.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    });

    it('should reject duplicated name with the error format the front expects: /api/v1/categories (POST)', async () => {
      const existing = await createCategory(adminToken);

      const { body } = await request(app)
        .post('/api/v1/categories')
        .auth(adminToken, { type: 'bearer' })
        .send({ name: existing.name })
        .expect(422);

      expect(body.errors).toEqual({ name: 'nameAlreadyExists' });
    });

    it('should reject duplicated slug: /api/v1/categories (POST)', async () => {
      const existing = await createCategory(adminToken);

      const { body } = await request(app)
        .post('/api/v1/categories')
        .auth(adminToken, { type: 'bearer' })
        .send({ name: unique('Outro Nome'), slug: existing.slug })
        .expect(422);

      expect(body.errors).toEqual({ slug: 'slugAlreadyExists' });
    });

    it('should reject color outside the hex format: /api/v1/categories (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/categories')
        .auth(adminToken, { type: 'bearer' })
        .send({ name: unique('Cor Ruim'), color: 'azul' })
        .expect(422);

      expect(body.errors).toEqual({ color: 'colorInvalidFormat' });
    });

    // Contagem é derivada: o cliente exibe, o servidor calcula.
    it('should reject newsCount in the payload: /api/v1/categories (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/categories')
        .auth(adminToken, { type: 'bearer' })
        .send({ name: unique('Com Contador'), newsCount: 42 })
        .expect(422);

      expect(body.errors).toEqual({ newsCount: 'readOnlyField' });
    });
  });

  describe('Contagem de notícias (derivada)', () => {
    it('should count the news of each category: /api/v1/categories (GET)', async () => {
      const category = await createCategory(adminToken);

      await request(app)
        .get(`/api/v1/categories?limit=100`)
        .expect(200)
        .expect(({ body }) => {
          const found = body.data.find((c) => c.id === category.id);
          expect(found.newsCount).toBe(0);
        });

      await createNews(adminToken, { categoryId: category.id });
      await createNews(adminToken, {
        categoryId: category.id,
        status: 'published',
      });

      await request(app)
        .get(`/api/v1/categories?limit=100`)
        .expect(200)
        .expect(({ body }) => {
          const found = body.data.find((c) => c.id === category.id);
          // rascunho e publicada contam: as duas apontam para a categoria
          expect(found.newsCount).toBe(2);
        });
    });
  });

  describe('active', () => {
    it('should hide inactive from the public and show it to the authenticated', async () => {
      const category = await createCategory(adminToken, { active: false });

      await request(app)
        .get('/api/v1/categories?limit=100')
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.map((c) => c.id)).not.toContain(category.id);
        });

      await request(app)
        .get('/api/v1/categories?limit=100')
        .auth(adminToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          const found = body.data.find((c) => c.id === category.id);
          expect(found).toBeDefined();
          expect(found.active).toBe(false);
        });
    });

    it('should ignore ?active=false without token', async () => {
      const category = await createCategory(adminToken, { active: false });

      await request(app)
        .get('/api/v1/categories?limit=100&active=false')
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.map((c) => c.id)).not.toContain(category.id);
          for (const item of body.data) {
            expect(item.active).toBe(true);
          }
        });
    });
  });

  describe('Atualização', () => {
    it('should update editable fields: /api/v1/categories/:id (PATCH)', async () => {
      const category = await createCategory(adminToken);

      const { body } = await request(app)
        .patch(`/api/v1/categories/${category.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({
          description: 'Nova descrição',
          color: '#ef4444',
          active: false,
        })
        .expect(200);

      expect(body.description).toBe('Nova descrição');
      expect(body.color).toBe('#ef4444');
      expect(body.active).toBe(false);
      // nome e slug intactos
      expect(body.name).toBe(category.name);
      expect(body.slug).toBe(category.slug);
    });

    it('should reject newsCount on PATCH: /api/v1/categories/:id (PATCH)', async () => {
      const category = await createCategory(adminToken);

      const { body } = await request(app)
        .patch(`/api/v1/categories/${category.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ newsCount: 10 })
        .expect(422);

      expect(body.errors).toEqual({ newsCount: 'readOnlyField' });
    });

    it('should return 404 for a category that does not exist: /api/v1/categories/:id (PATCH)', () => {
      return request(app)
        .patch('/api/v1/categories/1e2c8b3a-0000-4000-8000-000000000000')
        .auth(adminToken, { type: 'bearer' })
        .send({ description: 'x' })
        .expect(404);
    });
  });

  describe('Exclusão', () => {
    it('should delete a category with no news: /api/v1/categories/:id (DELETE)', async () => {
      const category = await createCategory(adminToken);

      await request(app)
        .delete(`/api/v1/categories/${category.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);

      await request(app)
        .get('/api/v1/categories?limit=100')
        .auth(adminToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.map((c) => c.id)).not.toContain(category.id);
        });
    });

    // 422 com código, não 500 de violação de FK.
    it('should refuse to delete a category in use: /api/v1/categories/:id (DELETE)', async () => {
      const category = await createCategory(adminToken);
      await createNews(adminToken, { categoryId: category.id });

      const { body } = await request(app)
        .delete(`/api/v1/categories/${category.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(422);

      expect(body.errors).toEqual({ id: 'categoryHasNews' });
    });

    it('should refuse to delete a category with archived news: /api/v1/categories/:id (DELETE)', async () => {
      const category = await createCategory(adminToken);
      const news = await createNews(adminToken, {
        categoryId: category.id,
        status: 'published',
      });

      await request(app)
        .delete(`/api/v1/news/${news.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);

      // Arquivar não desvincula: a notícia continua apontando para a categoria.
      const { body } = await request(app)
        .delete(`/api/v1/categories/${category.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(422);

      expect(body.errors).toEqual({ id: 'categoryHasNews' });
    });
  });
});
