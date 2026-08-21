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

/**
 * PNG 1x1 válido, embutido em base64.
 *
 * Precisa ser um arquivo de verdade (e com extensão permitida): o `fileFilter`
 * do multer recusa qualquer coisa fora de jpg/jpeg/png/gif, e no driver `local`
 * o binário é gravado em disco e servido de volta.
 */
export const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export type UploadedFile = {
  id: string;
  path: string;
  type: 'image' | 'video' | 'document' | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  title: string | null;
  alt: string | null;
  uploadedBy?: { id: string; slug: string; name: string } | null;
};

export const uploadFile = async (
  token: string,
  {
    fileName = unique('imagem') + '.png',
    width,
    height,
  }: { fileName?: string; width?: number; height?: number } = {},
): Promise<UploadedFile> => {
  const req = request(APP_URL)
    .post('/api/v1/files/upload')
    .auth(token, { type: 'bearer' })
    .attach('file', PNG_1X1, fileName);

  if (width !== undefined) req.field('width', String(width));
  if (height !== undefined) req.field('height', String(height));

  const { body } = await req.expect(201);

  return body.file as UploadedFile;
};

export type CreatedBannerItem = {
  id: string;
  file: UploadedFile;
  durationMs: number;
  linkUrl: string | null;
  order: number;
};

export type CreatedBanner = {
  id: string;
  title: string;
  advertiser: string | null;
  position: 'top' | 'middle' | 'aside' | 'bottom';
  active: boolean;
  items: CreatedBannerItem[];
};

export const createBanner = async (
  token: string,
  payload: Record<string, unknown> = {},
): Promise<CreatedBanner> => {
  const { body } = await request(APP_URL)
    .post('/api/v1/banners')
    .auth(token, { type: 'bearer' })
    .send({ title: unique('Campanha'), position: 'top', ...payload })
    .expect(201);

  return body as CreatedBanner;
};
