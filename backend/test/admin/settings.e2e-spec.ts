import request from 'supertest';

import { RoleEnum } from '../../src/core/roles/roles.enum';
import { APP_URL } from '../utils/constants';
import { login, unique, uploadFile } from '../utils/create-content';
import { createUser, loginAsAdmin } from '../utils/create-user';

/**
 * ⚠️ Parâmetros são estado global e o banco persiste entre execuções. Todo
 * teste parte de um reset (`beforeEach`) e o arquivo termina resetando
 * (`afterAll`). Pelo mesmo motivo, o teste de `fileInUse` do logo fica aqui, e
 * não em `files.e2e-spec.ts`: o Jest roda arquivos em paralelo (sem
 * `--runInBand`), e um reset no meio do teste de lá deixaria o resultado
 * aleatório.
 */
describe('Settings Module', () => {
  const app = APP_URL;
  const password = 'secret123';

  let adminToken: string;
  let plainUserToken: string;

  const getOldestAdminEmail = async (): Promise<string> => {
    const { body } = await request(app)
      .get(
        `/api/v1/users?limit=50&filters=${encodeURIComponent(
          JSON.stringify({ roles: [{ id: RoleEnum.admin }] }),
        )}&sort=${encodeURIComponent(
          JSON.stringify([{ orderBy: 'id', order: 'ASC' }]),
        )}`,
      )
      .auth(adminToken, { type: 'bearer' })
      .expect(200);

    const withEmail = (body.data as { email: string | null }[]).find(
      (user) => user.email,
    );

    if (!withEmail?.email) {
      throw new Error('Nenhum admin com e-mail encontrado para o oráculo.');
    }

    return withEmail.email;
  };

  beforeAll(async () => {
    adminToken = await loginAsAdmin();

    const plainUser = await createUser(adminToken, {
      email: `${unique('settings-plain')}@example.com`,
      password,
      name: 'Colaborador Settings',
    });
    plainUserToken = await login(plainUser.email, password);
  });

  beforeEach(async () => {
    await request(app)
      .post('/api/v1/settings/reset')
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
  });

  afterAll(async () => {
    await request(app)
      .post('/api/v1/settings/reset')
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
  });

  describe('Leitura', () => {
    it('should return the 13 keys at their defaults, with stable types and no updatedBy: /api/v1/settings (GET)', async () => {
      const { body } = await request(app).get('/api/v1/settings').expect(200);

      expect(body.MIN_NEWS_FOR_MIDDLE_BANNER).toBe(8);
      expect(typeof body.MIN_NEWS_FOR_MIDDLE_BANNER).toBe('number');
      expect(body.BANNER_INTERVAL).toBe(8);
      expect(body.HERO_SECONDARY_COUNT).toBe(2);
      expect(body.MOST_READ_COUNT).toBe(5);
      expect(body.LATEST_COUNT).toBe(5);
      expect(body.SAW_THIS_BLOCK_SIZE).toBe(5);
      expect(body.RELATED_NEWS_COUNT).toBe(3);
      expect(body.WHATSAPP_NUMBER).toBe('556200000000');
      expect(body.SITE_NAME).toBe('Senador Canedo Hoje');
      expect(body.LOGO).toBeNull();
      expect(body.LOGO_ALT).toBe('Senador Canedo Hoje');
      expect(body.SHOW_NAME_WITH_LOGO).toBe(false);
      expect(typeof body.SHOW_NAME_WITH_LOGO).toBe('boolean');
      expect(body.contactEmailIsDefault).toBe(true);
      expect(body).not.toHaveProperty('updatedBy');
      expect(Object.keys(body)).toHaveLength(15);
    });

    it('should include updatedBy for an authenticated request after a save: /api/v1/settings (GET)', async () => {
      await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ SITE_NAME: 'Teste de leitura' })
        .expect(200);

      const me = await request(app)
        .get('/api/v1/auth/me')
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      const { body } = await request(app)
        .get('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      expect(body.updatedBy).toEqual({ id: me.body.id, name: me.body.name });
      expect(Object.keys(body)).toHaveLength(16);
    });
  });

  describe('Permissão', () => {
    it('should require authentication to write: /api/v1/settings (PATCH)', () => {
      return request(app).patch('/api/v1/settings').send({}).expect(401);
    });

    it('should require authentication to reset: /api/v1/settings/reset (POST)', () => {
      return request(app).post('/api/v1/settings/reset').expect(401);
    });

    it('should refuse a non-admin write: /api/v1/settings (PATCH)', () => {
      return request(app)
        .patch('/api/v1/settings')
        .auth(plainUserToken, { type: 'bearer' })
        .send({})
        .expect(403);
    });

    it('should refuse a non-admin reset: /api/v1/settings/reset (POST)', () => {
      return request(app)
        .post('/api/v1/settings/reset')
        .auth(plainUserToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('PATCH — persistência parcial', () => {
    it('should persist only the sent keys and echo the full object: /api/v1/settings (PATCH)', async () => {
      const { body } = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ MIN_NEWS_FOR_MIDDLE_BANNER: 10, BANNER_INTERVAL: 6 })
        .expect(200);

      expect(body.MIN_NEWS_FOR_MIDDLE_BANNER).toBe(10);
      expect(body.BANNER_INTERVAL).toBe(6);
      expect(body.SITE_NAME).toBe('Senador Canedo Hoje');

      const anon = await request(app).get('/api/v1/settings').expect(200);
      expect(anon.body.MIN_NEWS_FOR_MIDDLE_BANNER).toBe(10);
      expect(anon.body.BANNER_INTERVAL).toBe(6);
    });

    it('should preserve keys saved in a previous PATCH: /api/v1/settings (PATCH)', async () => {
      await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ MIN_NEWS_FOR_MIDDLE_BANNER: 12 })
        .expect(200);

      const { body } = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ BANNER_INTERVAL: 9 })
        .expect(200);

      expect(body.MIN_NEWS_FOR_MIDDLE_BANNER).toBe(12);
      expect(body.BANNER_INTERVAL).toBe(9);
    });

    it('should advance updatedAt between two saves: /api/v1/settings (PATCH)', async () => {
      const first = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ SITE_NAME: 'Primeiro' })
        .expect(200);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const second = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ SITE_NAME: 'Segundo' })
        .expect(200);

      expect(new Date(second.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(first.body.updatedAt).getTime(),
      );
    });

    it('should reject a non-object body: /api/v1/settings (PATCH)', async () => {
      const { body } = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send([1, 2, 3])
        .expect(422);

      expect(body.errors).toEqual({ settings: 'invalidType' });
    });

    it('should save nothing on an empty body: /api/v1/settings (PATCH)', async () => {
      const { body } = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({})
        .expect(200);

      expect(body.MIN_NEWS_FOR_MIDDLE_BANNER).toBe(8);
    });

    it('should validate atomically: one valid key plus two invalid ones persists nothing', async () => {
      await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({
          MIN_NEWS_FOR_MIDDLE_BANNER: 20,
          BANNER_INTERVAL: 0,
          FOO: 1,
        })
        .expect(422)
        .then(({ body }) => {
          expect(body.errors).toEqual({
            BANNER_INTERVAL: 'valueOutOfRange',
            FOO: 'unknownSetting',
          });
        });

      const { body } = await request(app).get('/api/v1/settings').expect(200);
      expect(body.MIN_NEWS_FOR_MIDDLE_BANNER).toBe(8);
    });

    it.each([
      ['MIN_NEWS_FOR_MIDDLE_BANNER', 0, 'valueOutOfRange'],
      ['MIN_NEWS_FOR_MIDDLE_BANNER', 51, 'valueOutOfRange'],
      ['MIN_NEWS_FOR_MIDDLE_BANNER', '8', 'invalidType'],
      ['MIN_NEWS_FOR_MIDDLE_BANNER', 8.5, 'invalidType'],
      ['MIN_NEWS_FOR_MIDDLE_BANNER', null, 'invalidType'],
      ['BANNER_INTERVAL', 1, 'valueOutOfRange'],
      ['BANNER_INTERVAL', 21, 'valueOutOfRange'],
      ['HERO_SECONDARY_COUNT', 0, 'valueOutOfRange'],
      ['HERO_SECONDARY_COUNT', 5, 'valueOutOfRange'],
      ['MOST_READ_COUNT', 2, 'valueOutOfRange'],
      ['MOST_READ_COUNT', 11, 'valueOutOfRange'],
      ['LATEST_COUNT', 2, 'valueOutOfRange'],
      ['LATEST_COUNT', 11, 'valueOutOfRange'],
      ['SAW_THIS_BLOCK_SIZE', 2, 'valueOutOfRange'],
      ['SAW_THIS_BLOCK_SIZE', 11, 'valueOutOfRange'],
      ['RELATED_NEWS_COUNT', 0, 'valueOutOfRange'],
      ['RELATED_NEWS_COUNT', 7, 'valueOutOfRange'],
      ['WHATSAPP_NUMBER', '+55 62 99999-9999', 'whatsappInvalidFormat'],
      ['WHATSAPP_NUMBER', '123456789', 'whatsappInvalidFormat'],
      ['WHATSAPP_NUMBER', '1234567890123456', 'whatsappInvalidFormat'],
      ['WHATSAPP_NUMBER', 5562999999999, 'invalidType'],
      ['SITE_NAME', '', 'emptyValue'],
      ['SITE_NAME', '   ', 'emptyValue'],
      ['SITE_NAME', 'a'.repeat(121), 'valueTooLong'],
      ['SITE_NAME', 123, 'invalidType'],
      ['LOGO_ALT', 'a'.repeat(256), 'valueTooLong'],
      ['LOGO_ALT', 123, 'invalidType'],
      ['SHOW_NAME_WITH_LOGO', 'true', 'invalidType'],
      ['LOGO', 'https://exemplo.com/logo.png', 'invalidType'],
      ['LOGO', { id: 'nao-e-uuid' }, 'imageNotExists'],
      [
        'LOGO',
        { id: '00000000-0000-4000-8000-000000000000' },
        'imageNotExists',
      ],
      ['LOGO_URL', '/logo.png', 'unknownSetting'],
      ['FOO', 1, 'unknownSetting'],
      ['updatedAt', '2026-01-01T00:00:00.000Z', 'readOnlyField'],
      ['updatedBy', { id: 1, name: 'Alguém' }, 'readOnlyField'],
      ['contactEmailIsDefault', false, 'readOnlyField'],
    ])(
      'should reject %s=%p with %s: /api/v1/settings (PATCH)',
      async (key, value, code) => {
        const { body } = await request(app)
          .patch('/api/v1/settings')
          .auth(adminToken, { type: 'bearer' })
          .send({ [key as string]: value })
          .expect(422);

        expect(body.errors).toEqual({ [key as string]: code });
      },
    );

    it.each([
      ['MIN_NEWS_FOR_MIDDLE_BANNER', 1],
      ['MIN_NEWS_FOR_MIDDLE_BANNER', 50],
      ['BANNER_INTERVAL', 2],
      ['BANNER_INTERVAL', 20],
      ['HERO_SECONDARY_COUNT', 1],
      ['HERO_SECONDARY_COUNT', 4],
      ['MOST_READ_COUNT', 3],
      ['MOST_READ_COUNT', 10],
      ['LATEST_COUNT', 3],
      ['LATEST_COUNT', 10],
      ['SAW_THIS_BLOCK_SIZE', 3],
      ['SAW_THIS_BLOCK_SIZE', 10],
      ['RELATED_NEWS_COUNT', 1],
      ['RELATED_NEWS_COUNT', 6],
      ['WHATSAPP_NUMBER', '1234567890'],
      ['WHATSAPP_NUMBER', '123456789012345'],
      ['LOGO_ALT', ''],
    ])(
      'should accept the boundary %s=%p: /api/v1/settings (PATCH)',
      async (key, value) => {
        const { body } = await request(app)
          .patch('/api/v1/settings')
          .auth(adminToken, { type: 'bearer' })
          .send({ [key as string]: value })
          .expect(200);

        expect(body[key as string]).toEqual(value);
      },
    );
  });

  describe('E-mail de contato', () => {
    it('should default to the oldest admin email: /api/v1/settings (GET)', async () => {
      const expectedEmail = await getOldestAdminEmail();

      const { body } = await request(app).get('/api/v1/settings').expect(200);

      expect(body.CONTACT_EMAIL).toBe(expectedEmail);
      expect(body.contactEmailIsDefault).toBe(true);
    });

    it('should not change the default when a new admin is created: /api/v1/settings (GET)', async () => {
      const expectedEmail = await getOldestAdminEmail();

      const newAdmin = await createUser(adminToken, {
        email: `${unique('novo-admin')}@example.com`,
        password,
        name: 'Novo Admin',
        role: { id: RoleEnum.admin },
      });

      try {
        const { body } = await request(app).get('/api/v1/settings').expect(200);
        expect(body.CONTACT_EMAIL).toBe(expectedEmail);
      } finally {
        // Soft-delete no `finally`: admins acumulados entre execuções
        // estourariam o `limit=50` do `countAdmins` de `users-access.e2e-spec.ts`.
        await request(app)
          .delete(`/api/v1/users/${newAdmin.id}`)
          .auth(adminToken, { type: 'bearer' })
          .expect(204);
      }
    });

    it('should normalize a custom email (trim + lowercase): /api/v1/settings (PATCH)', async () => {
      const { body } = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ CONTACT_EMAIL: '  Contato@Exemplo.com.BR  ' })
        .expect(200);

      expect(body.CONTACT_EMAIL).toBe('contato@exemplo.com.br');
      expect(body.contactEmailIsDefault).toBe(false);

      const anon = await request(app).get('/api/v1/settings').expect(200);
      expect(anon.body.CONTACT_EMAIL).toBe('contato@exemplo.com.br');
    });

    it('should revert to the admin default with null: /api/v1/settings (PATCH)', async () => {
      const expectedEmail = await getOldestAdminEmail();

      await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ CONTACT_EMAIL: 'contato@exemplo.com.br' })
        .expect(200);

      const { body } = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ CONTACT_EMAIL: null })
        .expect(200);

      expect(body.CONTACT_EMAIL).toBe(expectedEmail);
      expect(body.contactEmailIsDefault).toBe(true);
    });

    it('should count the admin own email as customized when sent explicitly: /api/v1/settings (PATCH)', async () => {
      const expectedEmail = await getOldestAdminEmail();

      const { body } = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ CONTACT_EMAIL: expectedEmail })
        .expect(200);

      expect(body.CONTACT_EMAIL).toBe(expectedEmail);
      expect(body.contactEmailIsDefault).toBe(false);
    });

    it.each([
      ['', 'emailInvalidFormat'],
      ['nao-e-email', 'emailInvalidFormat'],
      ['a@b', 'emailInvalidFormat'],
      [
        `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.com`,
        'emailInvalidFormat',
      ],
      [123, 'invalidType'],
    ])(
      'should reject CONTACT_EMAIL=%p with %s: /api/v1/settings (PATCH)',
      async (value, code) => {
        const { body } = await request(app)
          .patch('/api/v1/settings')
          .auth(adminToken, { type: 'bearer' })
          .send({ CONTACT_EMAIL: value })
          .expect(422);

        expect(body.errors).toEqual({ CONTACT_EMAIL: code });
      },
    );
  });

  describe('Logo', () => {
    it('should set LOGO cut to id, path, mimeType and derived type: /api/v1/settings (PATCH)', async () => {
      const file = await uploadFile(adminToken);

      const { body } = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ LOGO: { id: file.id } })
        .expect(200);

      expect(body.LOGO).toEqual({
        id: file.id,
        path: file.path,
        mimeType: file.mimeType,
        type: file.type,
      });
    });

    it('should accept the echo { id, path } and discard path: /api/v1/settings (PATCH)', async () => {
      const file = await uploadFile(adminToken);

      const { body } = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ LOGO: { id: file.id, path: 'https://forjado.com/x.png' } })
        .expect(200);

      expect(body.LOGO.id).toBe(file.id);
      expect(body.LOGO.path).toBe(file.path);
    });

    it('should remove the logo with null: /api/v1/settings (PATCH)', async () => {
      const file = await uploadFile(adminToken);
      await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ LOGO: { id: file.id } })
        .expect(200);

      const { body } = await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ LOGO: null })
        .expect(200);

      expect(body.LOGO).toBeNull();
    });

    it('should block DELETE /files/:id while used as LOGO and free it after removal', async () => {
      const file = await uploadFile(adminToken);
      await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ LOGO: { id: file.id } })
        .expect(200);

      const blocked = await request(app)
        .delete(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(422);

      expect(blocked.body.errors.id).toBe('fileInUse');
      expect(blocked.body.usedBy).toEqual({
        news: 0,
        users: 0,
        banners: 0,
        settings: 1,
      });

      await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({ LOGO: null })
        .expect(200);

      await request(app)
        .delete(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);
    });
  });

  describe('Reset', () => {
    it('should revert every key to default and free the logo file: /api/v1/settings/reset (POST)', async () => {
      const file = await uploadFile(adminToken);
      await request(app)
        .patch('/api/v1/settings')
        .auth(adminToken, { type: 'bearer' })
        .send({
          MIN_NEWS_FOR_MIDDLE_BANNER: 20,
          SITE_NAME: 'Outro nome',
          LOGO: { id: file.id },
          CONTACT_EMAIL: 'contato@exemplo.com.br',
        })
        .expect(200);

      const me = await request(app)
        .get('/api/v1/auth/me')
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      const { body } = await request(app)
        .post('/api/v1/settings/reset')
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      expect(body.MIN_NEWS_FOR_MIDDLE_BANNER).toBe(8);
      expect(body.SITE_NAME).toBe('Senador Canedo Hoje');
      expect(body.LOGO).toBeNull();
      expect(body.contactEmailIsDefault).toBe(true);
      expect(body.updatedBy).toEqual({ id: me.body.id, name: me.body.name });

      await request(app)
        .delete(`/api/v1/files/${file.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);
    });
  });
});
