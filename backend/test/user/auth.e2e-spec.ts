import request from 'supertest';
import {
  APP_URL,
  TESTER_EMAIL,
  MAIL_HOST,
  MAIL_PORT,
} from '../utils/constants';
import { createUser, loginAsAdmin } from '../utils/create-user';

describe('Auth Module', () => {
  const app = APP_URL;
  const mail = `http://${MAIL_HOST}:${MAIL_PORT}`;
  const newUserName = `Tester ${Date.now()}`;
  const newUserEmail = `user.${Date.now()}@example.com`;
  const newUserPassword = `secret`;

  let adminToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
  });

  describe('Signup (via POST /users, admin-only)', () => {
    // O registro público foi desabilitado: o painel é administrativo e novos
    // usuários só nascem de dentro dele. A rota foi REMOVIDA, não protegida.
    it('should not expose public registration: /api/v1/auth/email/register (POST)', () => {
      return request(app)
        .post('/api/v1/auth/email/register')
        .send({
          email: `never.${Date.now()}@example.com`,
          password: newUserPassword,
        })
        .expect(404);
    });

    it('should fail with existing email: /api/v1/users (POST)', () => {
      return request(app)
        .post('/api/v1/users')
        .auth(adminToken, { type: 'bearer' })
        .send({
          email: TESTER_EMAIL,
          password: newUserPassword,
          name: 'Duplicado',
        })
        .expect(422)
        .expect(({ body }) => {
          expect(body.errors.email).toBeDefined();
        });
    });

    it('should require authentication: /api/v1/users (POST)', () => {
      return request(app)
        .post('/api/v1/users')
        .send({
          email: `anon.${Date.now()}@example.com`,
          password: newUserPassword,
          name: 'Anônimo',
        })
        .expect(401);
    });

    it('should create the user together with its author: /api/v1/users (POST)', async () => {
      const user = await createUser(adminToken, {
        email: newUserEmail,
        password: newUserPassword,
        name: newUserName,
        author: { bio: 'Bio de teste', isColumnist: true },
      });

      expect(user.author).toBeDefined();
      expect(user.author.userId).toBe(user.id);
      expect(user.author.slug).toBeDefined();
      expect(user.author.bio).toBe('Bio de teste');
      expect(user.author.isColumnist).toBe(true);
    });

    it('should create the author even without the author payload: /api/v1/users (POST)', async () => {
      const user = await createUser(adminToken, {
        email: `no-author-payload.${Date.now()}@example.com`,
        password: newUserPassword,
        name: `Sem Payload ${Date.now()}`,
      });

      expect(user.author).toBeDefined();
      expect(user.author.bio).toBeNull();
      expect(user.author.isColumnist).toBe(false);
    });

    it('should suffix the slug of a homonym: /api/v1/users (POST)', async () => {
      const sharedName = `Homônimo ${Date.now()}`;

      const first = await createUser(adminToken, {
        email: `homonym-a.${Date.now()}@example.com`,
        password: newUserPassword,
        name: sharedName,
      });
      const second = await createUser(adminToken, {
        email: `homonym-b.${Date.now()}@example.com`,
        password: newUserPassword,
        name: sharedName,
      });

      expect(second.author.slug).not.toBe(first.author.slug);
      expect(second.author.slug).toBe(`${first.author.slug}-2`);
    });
  });

  describe('Login', () => {
    it('should successfully for user created by admin: /api/v1/auth/email/login (POST)', () => {
      return request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: newUserEmail, password: newUserPassword })
        .expect(200)
        .expect(({ body }) => {
          expect(body.token).toBeDefined();
          expect(body.refreshToken).toBeDefined();
          expect(body.tokenExpires).toBeDefined();
          expect(body.user.email).toBeDefined();
          expect(body.user.hash).not.toBeDefined();
          expect(body.user.password).not.toBeDefined();
        });
    });

    // Comportamento MANTIDO deliberadamente (decisão de 2026-08-07): usuário
    // `inactive` continua conseguindo logar. Com o registro público desligado,
    // todo usuário nasce ACTIVE, então o cenário é residual.
    it('should successfully with unconfirmed (inactive) user: /api/v1/auth/email/login (POST)', async () => {
      const inactiveEmail = `inactive.${Date.now()}@example.com`;

      await createUser(adminToken, {
        email: inactiveEmail,
        password: newUserPassword,
        name: `Inativo ${Date.now()}`,
        status: 'inactive',
      });

      return request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: inactiveEmail, password: newUserPassword })
        .expect(200)
        .expect(({ body }) => {
          expect(body.token).toBeDefined();
        });
    });
  });

  describe('Logged in user', () => {
    let newUserApiToken;

    beforeAll(async () => {
      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: newUserEmail, password: newUserPassword })
        .then(({ body }) => {
          newUserApiToken = body.token;
        });
    });

    it('should retrieve your own profile, with the author: /api/v1/auth/me (GET)', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .auth(newUserApiToken, {
          type: 'bearer',
        })
        .send()
        .expect(({ body }) => {
          expect(body.provider).toBeDefined();
          expect(body.email).toBeDefined();
          expect(body.hash).not.toBeDefined();
          expect(body.password).not.toBeDefined();
          expect(body.author).toBeDefined();
          expect(body.author.slug).toBeDefined();
          expect(body.author.userId).toBe(body.id);
        });
    });

    it('should get new refresh token: /api/v1/auth/refresh (POST)', async () => {
      let newUserRefreshToken = await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: newUserEmail, password: newUserPassword })
        .then(({ body }) => body.refreshToken);

      newUserRefreshToken = await request(app)
        .post('/api/v1/auth/refresh')
        .auth(newUserRefreshToken, {
          type: 'bearer',
        })
        .send()
        .then(({ body }) => body.refreshToken);

      await request(app)
        .post('/api/v1/auth/refresh')
        .auth(newUserRefreshToken, {
          type: 'bearer',
        })
        .send()
        .expect(({ body }) => {
          expect(body.token).toBeDefined();
          expect(body.refreshToken).toBeDefined();
          expect(body.tokenExpires).toBeDefined();
        });
    });

    it('should fail on the second attempt to refresh token with the same token: /api/v1/auth/refresh (POST)', async () => {
      const newUserRefreshToken = await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: newUserEmail, password: newUserPassword })
        .then(({ body }) => body.refreshToken);

      await request(app)
        .post('/api/v1/auth/refresh')
        .auth(newUserRefreshToken, {
          type: 'bearer',
        })
        .send();

      await request(app)
        .post('/api/v1/auth/refresh')
        .auth(newUserRefreshToken, {
          type: 'bearer',
        })
        .send()
        .expect(401);
    });

    it('should revoke the session on logout: /api/v1/auth/logout (POST)', async () => {
      const { token, refreshToken } = await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: newUserEmail, password: newUserPassword })
        .then(({ body }) => body);

      await request(app)
        .post('/api/v1/auth/logout')
        .auth(token, { type: 'bearer' })
        .send()
        .expect(204);

      await request(app)
        .post('/api/v1/auth/refresh')
        .auth(refreshToken, { type: 'bearer' })
        .send()
        .expect(401);
    });

    it('should update profile successfully: /api/v1/auth/me (PATCH)', async () => {
      const newUserNewName = `Renomeado ${Date.now()}`;
      const newUserNewPassword = 'new-secret';
      const newUserApiToken = await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: newUserEmail, password: newUserPassword })
        .then(({ body }) => body.token);

      await request(app)
        .patch('/api/v1/auth/me')
        .auth(newUserApiToken, {
          type: 'bearer',
        })
        .send({
          name: newUserNewName,
          password: newUserNewPassword,
        })
        .expect(422);

      await request(app)
        .patch('/api/v1/auth/me')
        .auth(newUserApiToken, {
          type: 'bearer',
        })
        .send({
          name: newUserNewName,
          password: newUserNewPassword,
          oldPassword: newUserPassword,
        })
        .expect(200);

      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: newUserEmail, password: newUserNewPassword })
        .expect(200)
        .expect(({ body }) => {
          expect(body.token).toBeDefined();
        });

      await request(app)
        .patch('/api/v1/auth/me')
        .auth(newUserApiToken, {
          type: 'bearer',
        })
        .send({ password: newUserPassword, oldPassword: newUserNewPassword })
        .expect(200);
    });

    it('should update profile email successfully: /api/v1/auth/me (PATCH)', async () => {
      const localEmail = `user.${Date.now()}@example.com`;
      const localPassword = `secret`;
      const localNewEmail = `new.${localEmail}`;

      await createUser(adminToken, {
        email: localEmail,
        password: localPassword,
        name: `Troca Email ${Date.now()}`,
      });

      const localApiToken = await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: localEmail, password: localPassword })
        .then(({ body }) => body.token);

      await request(app)
        .patch('/api/v1/auth/me')
        .auth(localApiToken, {
          type: 'bearer',
        })
        .send({
          email: localNewEmail,
        })
        .expect(200);

      const hash = await request(mail)
        .get('/email')
        .then(({ body }) =>
          body
            .find((letter) => {
              return (
                letter.to[0].address.toLowerCase() ===
                  localNewEmail.toLowerCase() &&
                /.*confirm\-new\-email\?hash\=(\S+).*/g.test(letter.text)
              );
            })
            ?.text.replace(/.*confirm\-new\-email\?hash\=(\S+).*/g, '$1'),
        );

      await request(app)
        .get('/api/v1/auth/me')
        .auth(localApiToken, {
          type: 'bearer',
        })
        .expect(200)
        .expect(({ body }) => {
          expect(body.email).not.toBe(localNewEmail);
        });

      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: localNewEmail, password: localPassword })
        .expect(422);

      await request(app)
        .post('/api/v1/auth/email/confirm/new')
        .send({
          hash,
        })
        .expect(204);

      await request(app)
        .get('/api/v1/auth/me')
        .auth(localApiToken, {
          type: 'bearer',
        })
        .expect(200)
        .expect(({ body }) => {
          expect(body.email).toBe(localNewEmail);
        });

      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: localNewEmail, password: localPassword })
        .expect(200);
    });

    it('should delete profile successfully: /api/v1/auth/me (DELETE)', async () => {
      const localEmail = `to-delete.${Date.now()}@example.com`;
      const localPassword = `secret`;

      const created = await createUser(adminToken, {
        email: localEmail,
        password: localPassword,
        name: `Auto Exclusão ${Date.now()}`,
      });

      const localApiToken = await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: localEmail, password: localPassword })
        .then(({ body }) => body.token);

      await request(app)
        .delete('/api/v1/auth/me')
        .auth(localApiToken, { type: 'bearer' })
        .expect(204);

      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: localEmail, password: localPassword })
        .expect(422);

      // O Author acompanha o soft delete do User — se ficasse de pé, apareceria
      // na listagem pública de autores como um perfil sem dono.
      await request(app)
        .get(`/api/v1/authors/${created.author.slug}`)
        .expect(404);
    });
  });

  describe('Password recovery', () => {
    it('should send the email, reset the password and revoke old sessions', async () => {
      const localEmail = `forgot.${Date.now()}@example.com`;
      const localPassword = `secret`;
      const localNewPassword = `secret-novo-123`;

      await createUser(adminToken, {
        email: localEmail,
        password: localPassword,
        name: `Esqueci Senha ${Date.now()}`,
      });

      const refreshToken = await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: localEmail, password: localPassword })
        .then(({ body }) => body.refreshToken);

      await request(app)
        .post('/api/v1/auth/forgot/password')
        .send({ email: localEmail })
        .expect(204);

      // Se o caminho do template estivesse errado (o bug corrigido nesta fase),
      // o envio falharia antes de chegar aqui e não haveria hash nenhum.
      const hash = await request(mail)
        .get('/email')
        .then(({ body }) =>
          body
            .find(
              (letter) =>
                letter.to[0].address.toLowerCase() ===
                  localEmail.toLowerCase() &&
                /.*password\-change\?hash\=(\S+).*/g.test(letter.text),
            )
            ?.text.replace(/.*password\-change\?hash\=([^&\s]+).*/g, '$1'),
        );

      expect(hash).toBeDefined();

      await request(app)
        .post('/api/v1/auth/reset/password')
        .send({ hash, password: localNewPassword })
        .expect(204);

      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: localEmail, password: localPassword })
        .expect(422);

      await request(app)
        .post('/api/v1/auth/email/login')
        .send({ email: localEmail, password: localNewPassword })
        .expect(200);

      // Sessões anteriores morrem junto com a troca de senha.
      await request(app)
        .post('/api/v1/auth/refresh')
        .auth(refreshToken, { type: 'bearer' })
        .send()
        .expect(401);
    });
  });
});
