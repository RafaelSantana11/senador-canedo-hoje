export const APP_URL = `http://localhost:${process.env.APP_PORT}`;

export const TESTER_EMAIL = 'john.doe@example.com';
export const TESTER_PASSWORD = 'secret';

// Precisa ler as MESMAS envs que o seed (user-seed.service.ts). Desde que o
// admin deixou de ser `admin@example.com` / `secret` hardcoded, fixar os valores
// aqui faria todo teste de admin falhar por credencial em qualquer ambiente com
// .env próprio.
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'secret';

export const MAIL_HOST = process.env.MAIL_HOST;
export const MAIL_PORT = process.env.MAIL_CLIENT_PORT;
