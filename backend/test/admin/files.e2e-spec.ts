import request from 'supertest';

import { APP_URL } from '../utils/constants';
import {
  createBanner,
  createCategory,
  createNews,
  uploadFile,
  unique,
} from '../utils/create-content';
import { createUser, loginAsAdmin } from '../utils/create-user';

describe('Files Module', () => {
  const app = APP_URL;

  let adminToken: string;
  let categoryId: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    categoryId = (await createCategory(adminToken)).id;
  });

  describe('Upload e metadados', () => {
    it('should fill originalName, mimeType, sizeBytes and uploadedBy from the token: /api/v1/files/upload (POST)', async () => {
      const fileName = `${unique('fachada')}.png`;

      const file = await uploadFile(adminToken, { fileName });

      expect(file.originalName).toBe(fileName);
      expect(file.mimeType).toBe('image/png');
      // Número, não string formatada — `"1.4 MB"` é apresentação.
      expect(typeof file.sizeBytes).toBe('number');
      expect(file.sizeBytes).toBeGreaterThan(0);
      // Vem do token, nunca do payload.
      expect(file.uploadedBy).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          slug: expect.any(String),
          name: expect.any(String),
        }),
      );
    });

    it('should derive type from the mimetype: /api/v1/files/upload (POST)', async () => {
      const file = await uploadFile(adminToken);

      expect(file.type).toBe('image');
    });

    it('should accept width/height declared by the client as numbers: /api/v1/files/upload (POST)', async () => {
      const file = await uploadFile(adminToken, { width: 1920, height: 1080 });

      expect(file.width).toBe(1920);
      expect(file.height).toBe(1080);
    });

    it('should leave width/height null when not declared: /api/v1/files/upload (POST)', async () => {
      const file = await uploadFile(adminToken);

      expect(file.width).toBeNull();
      expect(file.height).toBeNull();
    });

    it('should require authentication: /api/v1/files/upload (POST)', () => {
      return request(app).post('/api/v1/files/upload').expect(401);
    });
  });

  describe('Listagem e detalhe', () => {
    it('should require authentication to list: /api/v1/files (GET)', () => {
      return request(app).get('/api/v1/files').expect(401);
    });

    it('should list the acervo paginated: /api/v1/files (GET)', async () => {
      await uploadFile(adminToken);

      const { body } = await request(app)
        .get('/api/v1/files')
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(typeof body.hasNextPage).toBe('boolean');
    });

    it('should filter by derived type: /api/v1/files?type=image (GET)', async () => {
      await uploadFile(adminToken);

      const { body } = await request(app)
        .get('/api/v1/files?type=image&limit=50')
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      expect(body.data.length).toBeGreaterThan(0);
      body.data.forEach((file) => expect(file.type).toBe('image'));
    });

    it('should search by original name: /api/v1/files?q= (GET)', async () => {
      const fileName = `${unique('procurado')}.png`;
      await uploadFile(adminToken, { fileName });

      const { body } = await request(app)
        .get(`/api/v1/files?q=${fileName.replace('.png', '')}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].originalName).toBe(fileName);
    });

    it('should return the detail by id: /api/v1/files/:id (GET)', async () => {
      const file = await uploadFile(adminToken);

      const { body } = await request(app)
        .get(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      expect(body.id).toBe(file.id);
      expect(body.type).toBe('image');
    });

    /**
     * A rota do acervo é `/files/:id` e a do driver `local` é
     * `/files/download/:path` — formatos diferentes, sem sombreamento por ordem
     * de registro. Um id que não é uuid não pode cair no serving de arquivo.
     */
    it('should reject a non-uuid id instead of serving a file: /api/v1/files/:id (GET)', () => {
      return request(app)
        .get('/api/v1/files/qualquer-coisa.png')
        .auth(adminToken, { type: 'bearer' })
        .expect(400);
    });

    it('should return 404 for an unknown id: /api/v1/files/:id (GET)', () => {
      return request(app)
        .get('/api/v1/files/00000000-0000-4000-8000-000000000000')
        .auth(adminToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('Edição de metadado', () => {
    it('should update only title and alt: /api/v1/files/:id (PATCH)', async () => {
      const file = await uploadFile(adminToken);

      const { body } = await request(app)
        .patch(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ title: 'Fachada do Congresso', alt: 'Fachada ao entardecer' })
        .expect(200);

      expect(body.title).toBe('Fachada do Congresso');
      expect(body.alt).toBe('Fachada ao entardecer');
      expect(body.originalName).toBe(file.originalName);
    });

    it.each([
      ['path', '/hackeado.png'],
      ['type', 'document'],
      ['originalName', 'outro.png'],
      ['mimeType', 'image/gif'],
      ['sizeBytes', 10],
      ['width', 10],
      ['height', 10],
      ['uploadedBy', { id: '00000000-0000-4000-8000-000000000000' }],
    ])(
      'should reject the derived field %s with readOnlyField: /api/v1/files/:id (PATCH)',
      async (field, value) => {
        const file = await uploadFile(adminToken);

        const { body } = await request(app)
          .patch(`/api/v1/files/${file.id}`)
          .auth(adminToken, { type: 'bearer' })
          .send({ [field as string]: value })
          .expect(422);

        expect(body.errors[field as string]).toBe('readOnlyField');
      },
    );
  });

  /**
   * ⚠️ O núcleo desta fase: são **três** as referências a `file` — capa de
   * notícia, foto de usuário e item de banner. Checar só uma delas deixaria
   * apagar imagem que está no ar.
   */
  describe('Exclusão — arquivo em uso', () => {
    it('should refuse to delete a file used as a news cover: /api/v1/files/:id (DELETE)', async () => {
      const file = await uploadFile(adminToken);
      await createNews(adminToken, {
        categoryId,
        cover: { id: file.id },
        status: 'published',
      });

      const { body } = await request(app)
        .delete(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(422);

      expect(body.errors.id).toBe('fileInUse');
      expect(body.usedBy.news).toBeGreaterThan(0);
      expect(body.usedBy.users).toBe(0);
      expect(body.usedBy.banners).toBe(0);
    });

    it('should refuse to delete a file used as a user photo: /api/v1/files/:id (DELETE)', async () => {
      const file = await uploadFile(adminToken);
      await createUser(adminToken, {
        email: `${unique('foto')}@example.com`,
        password: 'secret123',
        name: 'Dono da Foto',
        photo: { id: file.id },
      });

      const { body } = await request(app)
        .delete(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(422);

      expect(body.errors.id).toBe('fileInUse');
      expect(body.usedBy.users).toBeGreaterThan(0);
      expect(body.usedBy.news).toBe(0);
      expect(body.usedBy.banners).toBe(0);
    });

    it('should refuse to delete a file used in a banner item: /api/v1/files/:id (DELETE)', async () => {
      const file = await uploadFile(adminToken);
      await createBanner(adminToken, { items: [{ file: { id: file.id } }] });

      const { body } = await request(app)
        .delete(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(422);

      expect(body.errors.id).toBe('fileInUse');
      expect(body.usedBy.banners).toBeGreaterThan(0);
      expect(body.usedBy.news).toBe(0);
      expect(body.usedBy.users).toBe(0);
    });
  });

  describe('Exclusão — arquivo livre', () => {
    it('should delete the record and the stored object: /api/v1/files/:id (DELETE)', async () => {
      const file = await uploadFile(adminToken);

      // O objeto existe antes (driver `local` serve o binário do disco).
      await request(app).get(new URL(file.path).pathname).expect(200);

      await request(app)
        .delete(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);

      await request(app)
        .get(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(404);

      // E deixou de ser servido: o objeto saiu do storage junto do registro.
      await request(app).get(new URL(file.path).pathname).expect(404);
    });

    it('should free the file once the banner stops referencing it: /api/v1/files/:id (DELETE)', async () => {
      const file = await uploadFile(adminToken);
      const banner = await createBanner(adminToken, {
        items: [{ file: { id: file.id } }],
      });

      await request(app)
        .delete(`/api/v1/banners/${banner.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);

      // Apagar a campanha derruba os itens (CASCADE); o arquivo permanece no
      // acervo e volta a ser excluível.
      await request(app)
        .delete(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);
    });

    it('should require authentication to delete: /api/v1/files/:id (DELETE)', async () => {
      const file = await uploadFile(adminToken);

      return request(app).delete(`/api/v1/files/${file.id}`).expect(401);
    });
  });
});
