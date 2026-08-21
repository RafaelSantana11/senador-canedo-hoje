import request from 'supertest';

import { APP_URL } from '../utils/constants';
import { createBanner, uploadFile, unique } from '../utils/create-content';
import { loginAsAdmin } from '../utils/create-user';

describe('Banners Module', () => {
  const app = APP_URL;

  let adminToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
  });

  describe('CRUD administrativo', () => {
    it('should require authentication: /api/v1/banners (GET)', () => {
      return request(app).get('/api/v1/banners').expect(401);
    });

    it('should create a campaign with nested items: /api/v1/banners (POST)', async () => {
      const first = await uploadFile(adminToken);
      const second = await uploadFile(adminToken);
      const title = unique('Campanha');

      const { body } = await request(app)
        .post('/api/v1/banners')
        .auth(adminToken, { type: 'bearer' })
        .send({
          title,
          advertiser: 'AutoMax',
          position: 'aside',
          items: [
            {
              file: { id: first.id },
              durationMs: 4000,
              linkUrl: 'https://exemplo.com',
              order: 1,
            },
            { file: { id: second.id }, order: 0 },
          ],
        })
        .expect(201);

      expect(body.title).toBe(title);
      expect(body.advertiser).toBe('AutoMax');
      expect(body.position).toBe('aside');
      expect(body.active).toBe(true);
      expect(body.items).toHaveLength(2);
      // Já devolvido em `order ASC`, não na ordem em que veio no payload.
      expect(body.items[0].file.id).toBe(second.id);
      expect(body.items[1].file.id).toBe(first.id);
      expect(body.items[1].durationMs).toBe(4000);
      expect(body.items[1].linkUrl).toBe('https://exemplo.com');
      // Default de duração quando o item não declara.
      expect(body.items[0].durationMs).toBe(5000);
    });

    it('should reject an item pointing at a file that does not exist: /api/v1/banners (POST)', async () => {
      const { body } = await request(app)
        .post('/api/v1/banners')
        .auth(adminToken, { type: 'bearer' })
        .send({
          title: unique('Campanha'),
          position: 'top',
          items: [{ file: { id: '00000000-0000-4000-8000-000000000000' } }],
        })
        .expect(422);

      expect(body.errors.items).toBe('imageNotExists');
    });

    it.each([
      ['image', '/news/x.png'],
      ['link', 'https://x'],
      ['placement', 'Topo (Leaderboard)'],
    ])(
      'should reject the prototype field %s with readOnlyField: /api/v1/banners (POST)',
      async (field, value) => {
        const { body } = await request(app)
          .post('/api/v1/banners')
          .auth(adminToken, { type: 'bearer' })
          .send({
            title: unique('Campanha'),
            position: 'top',
            [field as string]: value,
          })
          .expect(422);

        expect(body.errors[field as string]).toBe('readOnlyField');
      },
    );

    it('should replace the whole item list on PATCH: /api/v1/banners/:id (PATCH)', async () => {
      const original = await uploadFile(adminToken);
      const replacement = await uploadFile(adminToken);
      const banner = await createBanner(adminToken, {
        items: [{ file: { id: original.id } }],
      });

      const { body } = await request(app)
        .patch(`/api/v1/banners/${banner.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ items: [{ file: { id: replacement.id } }] })
        .expect(200);

      expect(body.items).toHaveLength(1);
      expect(body.items[0].file.id).toBe(replacement.id);
    });

    it('should keep the current items when PATCH omits them: /api/v1/banners/:id (PATCH)', async () => {
      const file = await uploadFile(adminToken);
      const banner = await createBanner(adminToken, {
        items: [{ file: { id: file.id } }],
      });

      const { body } = await request(app)
        .patch(`/api/v1/banners/${banner.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ title: 'Outro título' })
        .expect(200);

      expect(body.title).toBe('Outro título');
      expect(body.items).toHaveLength(1);
      expect(body.items[0].file.id).toBe(file.id);
    });

    it('should empty the carousel with items: []: /api/v1/banners/:id (PATCH)', async () => {
      const file = await uploadFile(adminToken);
      const banner = await createBanner(adminToken, {
        items: [{ file: { id: file.id } }],
      });

      const { body } = await request(app)
        .patch(`/api/v1/banners/${banner.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ items: [] })
        .expect(200);

      expect(body.items).toHaveLength(0);
    });

    it('should filter by position and active: /api/v1/banners (GET)', async () => {
      const banner = await createBanner(adminToken, {
        position: 'bottom',
        active: false,
      });

      const { body } = await request(app)
        .get('/api/v1/banners?position=bottom&active=false&limit=50')
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.some((item) => item.id === banner.id)).toBe(true);
      body.data.forEach((item) => {
        expect(item.position).toBe('bottom');
        expect(item.active).toBe(false);
      });
    });

    it('should delete the campaign and keep the files: /api/v1/banners/:id (DELETE)', async () => {
      const file = await uploadFile(adminToken);
      const banner = await createBanner(adminToken, {
        items: [{ file: { id: file.id } }],
      });

      await request(app)
        .delete(`/api/v1/banners/${banner.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);

      await request(app)
        .get(`/api/v1/banners/${banner.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(404);

      // O arquivo permanece no acervo.
      await request(app)
        .get(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(200);
    });
  });

  /**
   * ⚠️ Rota **pública**. Os testes abaixo existem para travar dois riscos: dado
   * administrativo vazando para o portal, e banner desativado continuando no ar.
   */
  describe('Entrega pública', () => {
    it('should flatten every active banner of a position, in order: /api/v1/banners/serve (GET)', async () => {
      const [a, b, c] = await Promise.all([
        uploadFile(adminToken),
        uploadFile(adminToken),
        uploadFile(adminToken),
      ]);

      // Duas campanhas na MESMA posição — a entrega achata as duas numa lista
      // só, ordenada por `order`, intercalando campanhas.
      await createBanner(adminToken, {
        position: 'middle',
        items: [
          { file: { id: a.id }, order: 2, durationMs: 3000 },
          { file: { id: c.id }, order: 0 },
        ],
      });
      await createBanner(adminToken, {
        position: 'middle',
        items: [{ file: { id: b.id }, order: 1 }],
      });

      const { body } = await request(app)
        .get('/api/v1/banners/serve?positions=middle')
        .expect(200);

      const ids = body.middle.map((item) => item.image.id);
      expect(ids.indexOf(c.id)).toBeLessThan(ids.indexOf(b.id));
      expect(ids.indexOf(b.id)).toBeLessThan(ids.indexOf(a.id));
    });

    it('should not leak administrative data: /api/v1/banners/serve (GET)', async () => {
      const file = await uploadFile(adminToken);
      const banner = await createBanner(adminToken, {
        position: 'top',
        advertiser: 'AutoMax',
        items: [{ file: { id: file.id }, linkUrl: 'https://exemplo.com' }],
      });

      const { body } = await request(app)
        .get('/api/v1/banners/serve?positions=top')
        .expect(200);

      const payload = JSON.stringify(body);
      expect(payload).not.toContain('advertiser');
      expect(payload).not.toContain('AutoMax');
      expect(payload).not.toContain('active');
      expect(payload).not.toContain('uploadedBy');
      // Nem o id da campanha, que é referência interna do painel.
      expect(payload).not.toContain(banner.id);

      const item = body.top.find((entry) => entry.image.id === file.id);
      expect(item).toBeDefined();
      expect(Object.keys(item).sort()).toEqual([
        'alt',
        'durationMs',
        'image',
        'linkUrl',
      ]);
      expect(item.linkUrl).toBe('https://exemplo.com');
      expect(item.durationMs).toBe(5000);
      // `path` já vem como URL pronta para o `src` de uma <img>.
      expect(typeof item.image.path).toBe('string');
    });

    it('should hide inactive banners: /api/v1/banners/serve (GET)', async () => {
      const file = await uploadFile(adminToken);
      await createBanner(adminToken, {
        position: 'bottom',
        active: false,
        items: [{ file: { id: file.id } }],
      });

      const { body } = await request(app)
        .get('/api/v1/banners/serve?positions=bottom')
        .expect(200);

      expect(body.bottom.some((item) => item.image.id === file.id)).toBe(false);
    });

    it('should return every position when none is requested: /api/v1/banners/serve (GET)', async () => {
      const { body } = await request(app)
        .get('/api/v1/banners/serve')
        .expect(200);

      expect(Object.keys(body).sort()).toEqual([
        'aside',
        'bottom',
        'middle',
        'top',
      ]);
    });

    it('should return an empty list — not 404 — for a position without banners: /api/v1/banners/serve (GET)', async () => {
      const { body } = await request(app)
        .get('/api/v1/banners/serve?positions=aside,bottom')
        .expect(200);

      expect(Array.isArray(body.aside)).toBe(true);
      expect(Array.isArray(body.bottom)).toBe(true);
    });

    it('should reject an unknown position instead of silently ignoring it: /api/v1/banners/serve (GET)', async () => {
      const { body } = await request(app)
        .get('/api/v1/banners/serve?positions=lateral')
        .expect(422);

      expect(body.errors.positions).toBe('positionsInvalid');
    });
  });
});
