import request from 'supertest';
import { APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from './constants';

/**
 * Desde que o registro público foi desabilitado, `POST /api/v1/users`
 * (admin-only) é o único caminho de criação de usuário exposto pela API — todo
 * teste que precisava de um usuário novo passa por aqui.
 */

export const loginAsAdmin = async (): Promise<string> =>
  request(APP_URL)
    .post('/api/v1/auth/email/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    .then(({ body }) => body.token);

export type CreatedUser = {
  id: number;
  email: string;
  name: string;
  author: {
    id: string;
    slug: string;
    bio: string | null;
    isColumnist: boolean;
    userId: number;
  };
};

export const createUser = async (
  adminToken: string,
  payload: Record<string, unknown>,
): Promise<CreatedUser> => {
  const { body } = await request(APP_URL)
    .post('/api/v1/users')
    .auth(adminToken, { type: 'bearer' })
    .send(payload)
    .expect(201);

  return body as CreatedUser;
};
