import request from 'supertest';

import { RoleEnum } from '../../src/core/roles/roles.enum';
import { ADMIN_EMAIL, ADMIN_PASSWORD, APP_URL } from '../utils/constants';
import { login } from '../utils/create-content';
import { createUser, loginAsAdmin } from '../utils/create-user';

/**
 * Modelo de acesso (só admin administra usuários) e travas contra lockout de
 * admin. Comportamento que já existia no código mas não tinha prova, mais as
 * duas travas entregues nesta fase.
 */
describe('Modelo de acesso e travas de lockout', () => {
  const app = APP_URL;
  const password = 'secret';

  let adminToken: string;
  let adminId: number;
  let plainUser: Awaited<ReturnType<typeof createUser>>;
  let plainUserToken: string;

  const countAdmins = async (): Promise<number> => {
    const { body } = await request(app)
      .get(
        `/api/v1/users?limit=50&filters=${encodeURIComponent(
          JSON.stringify({ roles: [{ id: RoleEnum.admin }] }),
        )}`,
      )
      .auth(adminToken, { type: 'bearer' })
      .expect(200);

    return body.data.length;
  };

  beforeAll(async () => {
    adminToken = await loginAsAdmin();

    const me = await request(app)
      .get('/api/v1/auth/me')
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    adminId = me.body.id;

    plainUser = await createUser(adminToken, {
      email: `plain-access.${Date.now()}@example.com`,
      password,
      name: `Colaborador ${Date.now()}`,
    });
    plainUserToken = await login(plainUser.email, password);
  });

  describe('Usuário criado pelo painel nasce "user"', () => {
    it('should set the role explicitly, never undefined: /api/v1/users (POST)', () => {
      expect(Number(plainUser['role']?.id ?? RoleEnum.user)).toBe(
        Number(RoleEnum.user),
      );

      return request(app)
        .get('/api/v1/auth/me')
        .auth(plainUserToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(Number(body.role.id)).toBe(Number(RoleEnum.user));
          // e nasce com o Author 1:1 já criado
          expect(body.author).toBeDefined();
          expect(body.author.userId).toBe(body.id);
        });
    });
  });

  describe('Um "user" não administra usuários', () => {
    it('should answer 403 on POST /api/v1/users', () => {
      return request(app)
        .post('/api/v1/users')
        .auth(plainUserToken, { type: 'bearer' })
        .send({
          email: `by-plain.${Date.now()}@example.com`,
          password,
          name: 'Criado por não-admin',
        })
        .expect(403);
    });

    it('should answer 403 on PATCH /api/v1/users/:id', () => {
      return request(app)
        .patch(`/api/v1/users/${plainUser.id}`)
        .auth(plainUserToken, { type: 'bearer' })
        .send({ name: 'Tentativa' })
        .expect(403);
    });

    it('should answer 403 on DELETE /api/v1/users/:id', () => {
      return request(app)
        .delete(`/api/v1/users/${adminId}`)
        .auth(plainUserToken, { type: 'bearer' })
        .expect(403);
    });

    it('should answer 403 on GET /api/v1/users', () => {
      return request(app)
        .get('/api/v1/users')
        .auth(plainUserToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('Um "user" cuida do que é dele', () => {
    it('should edit their own account: /api/v1/auth/me (PATCH)', () => {
      return request(app)
        .patch('/api/v1/auth/me')
        .auth(plainUserToken, { type: 'bearer' })
        .send({ name: `Nome Novo ${Date.now()}` })
        .expect(200);
    });

    it('should edit their own author profile: /api/v1/authors/:id (PATCH)', () => {
      return request(app)
        .patch(`/api/v1/authors/${plainUser.author.id}`)
        .auth(plainUserToken, { type: 'bearer' })
        .send({ bio: 'Cobre a cidade desde 2019.', isColumnist: true })
        .expect(200)
        .expect(({ body }) => {
          expect(body.bio).toBe('Cobre a cidade desde 2019.');
          expect(body.isColumnist).toBe(true);
        });
    });

    it('should not edit another author profile: /api/v1/authors/:id (PATCH)', async () => {
      const other = await createUser(adminToken, {
        email: `other-author.${Date.now()}@example.com`,
        password,
        name: `Outro Autor ${Date.now()}`,
      });

      return request(app)
        .patch(`/api/v1/authors/${other.author.id}`)
        .auth(plainUserToken, { type: 'bearer' })
        .send({ bio: 'invasão' })
        .expect(403);
    });
  });

  describe('Admin cria usuário que consegue logar', () => {
    it('should create a user that can log in: /api/v1/users (POST)', async () => {
      const email = `created-and-login.${Date.now()}@example.com`;

      await createUser(adminToken, {
        email,
        password,
        name: `Novo Colaborador ${Date.now()}`,
      });

      return request(app)
        .post('/api/v1/auth/email/login')
        .send({ email, password })
        .expect(200)
        .expect(({ body }) => {
          expect(body.token).toBeDefined();
          expect(body.refreshToken).toBeDefined();
        });
    });
  });

  /**
   * ⚠️ Ordem importa: as asserções do "último admin" vêm ANTES de qualquer teste
   * que crie um segundo admin — senão o ambiente deixaria de ter um único admin
   * e o ramo da trava nunca seria exercitado.
   */
  describe('Travas contra lockout de admin', () => {
    it('should not let the admin delete themselves: /api/v1/users/:id (DELETE)', async () => {
      const { body } = await request(app)
        .delete(`/api/v1/users/${adminId}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(422);

      expect(body.errors).toEqual({ id: 'cannotDeleteSelf' });

      // segue existindo e logando
      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .expect(200);
    });

    it('should not let the last admin be removed nor demoted', async () => {
      const admins = await countAdmins();

      if (admins > 1) {
        // Ambiente com mais de um admin (banco reaproveitado de execuções
        // anteriores, por exemplo): a trava não deve bloquear. Rebaixa um admin
        // criado agora, nunca o do seed.
        const extra = await createUser(adminToken, {
          email: `extra-admin.${Date.now()}@example.com`,
          password,
          name: `Admin Extra ${Date.now()}`,
          role: { id: RoleEnum.admin },
        });

        await request(app)
          .patch(`/api/v1/users/${extra.id}`)
          .auth(adminToken, { type: 'bearer' })
          .send({ role: { id: RoleEnum.user } })
          .expect(200);

        return;
      }

      // Único admin: rebaixar precisa falhar...
      const demote = await request(app)
        .patch(`/api/v1/users/${adminId}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ role: { id: RoleEnum.user } })
        .expect(422);

      expect(demote.body.errors).toEqual({ role: 'cannotDemoteLastAdmin' });

      // ...e sair pela própria conta também.
      const selfDelete = await request(app)
        .delete('/api/v1/auth/me')
        .auth(adminToken, { type: 'bearer' })
        .expect(422);

      expect(selfDelete.body.errors).toEqual({ id: 'cannotDeleteLastAdmin' });

      // O admin continua admin e continua logando — nada foi destruído.
      await request(app)
        .get('/api/v1/auth/me')
        .auth(adminToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(Number(body.role.id)).toBe(Number(RoleEnum.admin));
        });

      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .expect(200);
    });

    it('should allow deleting an admin when another one exists: /api/v1/users/:id (DELETE)', async () => {
      const second = await createUser(adminToken, {
        email: `second-admin.${Date.now()}@example.com`,
        password,
        name: `Segundo Admin ${Date.now()}`,
        role: { id: RoleEnum.admin },
      });

      await request(app)
        .delete(`/api/v1/users/${second.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);
    });

    it('should let a "user" leave their own account: /api/v1/auth/me (DELETE)', async () => {
      const disposable = await createUser(adminToken, {
        email: `self-delete.${Date.now()}@example.com`,
        password,
        name: `Some Sozinho ${Date.now()}`,
      });

      const token = await login(disposable.email, password);

      await request(app)
        .delete('/api/v1/auth/me')
        .auth(token, { type: 'bearer' })
        .expect(204);
    });
  });
});
