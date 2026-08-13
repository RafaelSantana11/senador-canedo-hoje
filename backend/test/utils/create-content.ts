import request from 'supertest';
import { APP_URL } from './constants';

/**
 * Helpers de conteúdo para os e2e. Como os testes rodam black-box contra um
 * servidor de verdade e o banco **persiste** entre execuções, todo nome/slug
 * criado aqui precisa ser único — daí o `unique()` em vez de literais fixos.
 */
export const unique = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

export type CreatedCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  active: boolean;
  newsCount?: number;
};

export type CreatedTag = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  usageCount?: number;
};

export type CreatedNews = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  views: number;
  config: Record<string, unknown> | null;
  author: { id: string; slug: string; userId: number };
  category: CreatedCategory;
  tags: CreatedTag[];
  cover: { id: string; path: string } | null;
};

export const login = (email: string, password: string): Promise<string> =>
  request(APP_URL)
    .post('/api/v1/auth/email/login')
    .send({ email, password })
    .then(({ body }) => body.token);

export const createCategory = async (
  token: string,
  payload: Record<string, unknown> = {},
): Promise<CreatedCategory> => {
  const { body } = await request(APP_URL)
    .post('/api/v1/categories')
    .auth(token, { type: 'bearer' })
    .send({ name: unique('Categoria'), ...payload })
    .expect(201);

  return body as CreatedCategory;
};

export const createTag = async (
  token: string,
  payload: Record<string, unknown> = {},
): Promise<CreatedTag> => {
  const { body } = await request(APP_URL)
    .post('/api/v1/tags')
    .auth(token, { type: 'bearer' })
    .send({ name: unique('Tag'), ...payload })
    .expect(201);

  return body as CreatedTag;
};

export const createNews = async (
  token: string,
  { categoryId, ...payload }: { categoryId: string } & Record<string, unknown>,
): Promise<CreatedNews> => {
  const { body } = await request(APP_URL)
    .post('/api/v1/news')
    .auth(token, { type: 'bearer' })
    .send({
      title: unique('Notícia'),
      body: '## Título\n\nCorpo em **markdown**.',
      category: { id: categoryId },
      ...payload,
    })
    .expect(201);

  return body as CreatedNews;
};
