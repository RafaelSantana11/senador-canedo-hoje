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

/**
 * Rotas públicas de News — o lado do portal, sem token.
 *
 * Dois riscos concentram este arquivo: vazar rascunho e vazar dado privado de
 * usuário por dentro do autor da notícia.
 */
describe('News Module (rotas públicas)', () => {
  const app = APP_URL;
  const password = 'secret';

  let adminToken: string;
  let authorToken: string;

  // Categoria e tag exclusivas deste arquivo: o banco dos e2e persiste entre
  // execuções, então filtrar por algo criado aqui é o que torna as contagens
  // determinísticas.
  let category: Awaited<ReturnType<typeof createCategory>>;
  let tag: Awaited<ReturnType<typeof createTag>>;

  let published: Awaited<ReturnType<typeof createNews>>;
  let draft: Awaited<ReturnType<typeof createNews>>;
  let archived: Awaited<ReturnType<typeof createNews>>;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();

    const author = await createUser(adminToken, {
      email: `public-news.${Date.now()}@example.com`,
      password,
      name: `Autor Público ${Date.now()}`,
    });
    authorToken = await login(author.email, password);

    category = await createCategory(adminToken);
    tag = await createTag(adminToken);

    published = await createNews(authorToken, {
      categoryId: category.id,
      title: unique('Publicada'),
      summary: 'resumo público',
      status: 'published',
      tags: [{ id: tag.id }],
    });

    draft = await createNews(authorToken, {
      categoryId: category.id,
      title: unique('Rascunho'),
      summary: 'resumo secreto',
    });

    archived = await createNews(authorToken, {
      categoryId: category.id,
      title: unique('Arquivada'),
      status: 'published',
    });

    await request(app)
      .delete(`/api/v1/news/${archived.id}`)
      .auth(authorToken, { type: 'bearer' })
      .expect(204);
  });

  describe('Não vaza rascunho', () => {
    it('should list only published without token: /api/v1/news (GET)', () => {
      return request(app)
        .get(`/api/v1/news?category=${category.slug}&limit=50`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.length).toBeGreaterThan(0);

          for (const item of body.data) {
            expect(item.status).toBe('published');
          }

          const ids = body.data.map((n) => n.id);
          expect(ids).toContain(published.id);
          expect(ids).not.toContain(draft.id);
          expect(ids).not.toContain(archived.id);
        });
    });

    // O ponto exato da decisão: o filtro é ignorado, não obedecido.
    it('should ignore ?status=draft without token: /api/v1/news (GET)', () => {
      return request(app)
        .get(`/api/v1/news?status=draft&category=${category.slug}&limit=50`)
        .expect(200)
        .expect(({ body }) => {
          for (const item of body.data) {
            expect(item.status).toBe('published');
          }
          expect(body.data.map((n) => n.id)).not.toContain(draft.id);
        });
    });

    it('should ignore ?status=archived without token: /api/v1/news (GET)', () => {
      return request(app)
        .get(`/api/v1/news?status=archived&category=${category.slug}&limit=50`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.map((n) => n.id)).not.toContain(archived.id);
        });
    });

    it('should return 404 on a draft detail without token: /api/v1/news/:slug (GET)', () => {
      return request(app).get(`/api/v1/news/${draft.slug}`).expect(404);
    });

    it('should return 404 on an archived detail without token: /api/v1/news/:slug (GET)', () => {
      return request(app).get(`/api/v1/news/${archived.slug}`).expect(404);
    });

    // Token inválido não é sessão: cai na visão pública, não em 401.
    it('should treat an invalid token as a visitor: /api/v1/news (GET)', () => {
      return request(app)
        .get(`/api/v1/news?status=draft&category=${category.slug}&limit=50`)
        .auth('token-invalido', { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.map((n) => n.id)).not.toContain(draft.id);
        });
    });
  });

  describe('Não vaza dado privado do usuário via author', () => {
    const assertAuthorIsClean = (author: Record<string, unknown>) => {
      expect(author.name).toBeDefined();
      expect(author.slug).toBeDefined();

      // nem aninhado...
      expect(author.user).not.toBeDefined();
      // ...nem achatado
      expect(author.email).not.toBeDefined();
      expect(author.password).not.toBeDefined();
      expect(author.provider).not.toBeDefined();
      expect(author.socialId).not.toBeDefined();
      expect(author.trialStartDate).not.toBeDefined();
      expect(author.messageApiKey).not.toBeDefined();
      expect(author.role).not.toBeDefined();
      expect(author.status).not.toBeDefined();
    };

    it('should keep the author clean on the detail: /api/v1/news/:slug (GET)', () => {
      return request(app)
        .get(`/api/v1/news/${published.slug}`)
        .expect(200)
        .expect(({ body }) => {
          assertAuthorIsClean(body.author);
        });
    });

    it('should keep the author clean on the listing: /api/v1/news (GET)', () => {
      return request(app)
        .get('/api/v1/news?limit=50')
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.length).toBeGreaterThan(0);

          for (const item of body.data) {
            assertAuthorIsClean(item.author);
          }
        });
    });

    it('should not expose an e-mail anywhere in the response body', () => {
      return request(app)
        .get('/api/v1/news?limit=50')
        .expect(200)
        .expect(({ text }) => {
          expect(text).not.toContain('@example.com');
        });
    });
  });

  describe('views', () => {
    it('should increment on every read: /api/v1/news/:slug (GET)', async () => {
      const news = await createNews(authorToken, {
        categoryId: category.id,
        status: 'published',
      });

      expect(news.views).toBe(0);

      const first = await request(app)
        .get(`/api/v1/news/${news.slug}`)
        .expect(200);
      expect(first.body.views).toBe(1);

      const second = await request(app)
        .get(`/api/v1/news/${news.slug}`)
        .expect(200);
      expect(second.body.views).toBe(2);
    });

    // Com ler-somar-gravar, requisições simultâneas perderiam contagem.
    it('should not lose counts on concurrent reads: /api/v1/news/:slug (GET)', async () => {
      const news = await createNews(authorToken, {
        categoryId: category.id,
        status: 'published',
      });

      await Promise.all(
        Array.from({ length: 10 }, () =>
          request(app).get(`/api/v1/news/${news.slug}`).expect(200),
        ),
      );

      await request(app)
        .get(`/api/v1/news/${news.slug}`)
        .expect(200)
        .expect(({ body }) => {
          // 10 leituras + a deste expect
          expect(body.views).toBe(11);
        });
    });

    it('should not count reads of a draft: /api/v1/news/:slug (GET)', async () => {
      const news = await createNews(authorToken, { categoryId: category.id });

      await request(app)
        .get(`/api/v1/news/${news.slug}`)
        .auth(authorToken, { type: 'bearer' })
        .expect(200);

      await request(app)
        .get(`/api/v1/news/${news.slug}`)
        .auth(authorToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.views).toBe(0);
        });
    });
  });

  describe('Filtros e paginação', () => {
    it('should filter by category slug: /api/v1/news (GET)', () => {
      return request(app)
        .get(`/api/v1/news?category=${category.slug}&limit=50`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.data.length).toBeGreaterThan(0);
          for (const item of body.data) {
            expect(item.category.slug).toBe(category.slug);
          }
        });
    });

    it('should filter by tag slug and still return every tag of the news: /api/v1/news (GET)', async () => {
      const other = await createTag(adminToken);

      const withTwoTags = await createNews(authorToken, {
        categoryId: category.id,
        status: 'published',
        tags: [{ id: tag.id }, { id: other.id }],
      });

      await request(app)
        .get(`/api/v1/news?tag=${tag.slug}&limit=50`)
        .expect(200)
        .expect(({ body }) => {
          const ids = body.data.map((n) => n.id);
          expect(ids).toContain(withTwoTags.id);
          expect(ids).toContain(published.id);

          const found = body.data.find((n) => n.id === withTwoTags.id);
          // o join de filtro não pode truncar a lista de tags
          expect(found.tags.map((t) => t.id).sort()).toEqual(
            [tag.id, other.id].sort(),
          );
        });
    });

    it('should search the term in title and summary: /api/v1/news (GET)', async () => {
      const term = unique('Termobusca');

      const byTitle = await createNews(authorToken, {
        categoryId: category.id,
        status: 'published',
        title: `Manchete com ${term}`,
      });

      const bySummary = await createNews(authorToken, {
        categoryId: category.id,
        status: 'published',
        title: unique('Sem termo no título'),
        summary: `resumo contendo ${term}`,
      });

      await request(app)
        .get(`/api/v1/news?q=${encodeURIComponent(term)}&limit=50`)
        .expect(200)
        .expect(({ body }) => {
          const ids = body.data.map((n) => n.id);
          expect(ids).toContain(byTitle.id);
          expect(ids).toContain(bySummary.id);
          expect(body.data).toHaveLength(2);
        });
    });

    it('should paginate with limit and hasNextPage: /api/v1/news (GET)', async () => {
      const paged = await createCategory(adminToken);

      for (let i = 0; i < 3; i++) {
        await createNews(authorToken, {
          categoryId: paged.id,
          status: 'published',
        });
      }

      await request(app)
        .get(`/api/v1/news?category=${paged.slug}&limit=2&page=1`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toHaveLength(2);
          expect(body.hasNextPage).toBe(true);
        });

      await request(app)
        .get(`/api/v1/news?category=${paged.slug}&limit=2&page=2`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toHaveLength(1);
          expect(body.hasNextPage).toBe(false);
        });
    });

    it('should order by publishedAt descending: /api/v1/news (GET)', async () => {
      const ordered = await createCategory(adminToken);

      const first = await createNews(authorToken, {
        categoryId: ordered.id,
        status: 'published',
      });
      const second = await createNews(authorToken, {
        categoryId: ordered.id,
        status: 'published',
      });

      await request(app)
        .get(`/api/v1/news?category=${ordered.slug}&limit=50`)
        .expect(200)
        .expect(({ body }) => {
          // a mais recente primeiro
          expect(body.data.map((n) => n.id)).toEqual([second.id, first.id]);
        });
    });

    it('should return 404 for a slug that does not exist: /api/v1/news/:slug (GET)', () => {
      return request(app).get('/api/v1/news/slug-que-nao-existe').expect(404);
    });
  });
});
