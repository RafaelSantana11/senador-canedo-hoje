/**
 * ACL aplicada aos objetos enviados ao bucket.
 *
 * Necessária porque objetos no DigitalOcean Spaces (alvo de produção) nascem
 * privados: sem ACL, abrir a URL pública do arquivo responde 403. No MinIO local
 * a policy de leitura pública é definida no bootstrap do bucket (compose), mas
 * manter a ACL no upload deixa os dois ambientes com o mesmo comportamento.
 *
 * Centralizada aqui de propósito: é consumida pelos drivers `s3` e
 * `s3-presigned`, e divergir entre eles produziria arquivos com visibilidade
 * diferente conforme o driver ativo.
 */
export const S3_UPLOAD_ACL = 'public-read' as const;
