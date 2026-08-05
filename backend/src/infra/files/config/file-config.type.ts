export enum FileDriver {
  LOCAL = 'local',
  S3 = 's3',
  S3_PRESIGNED = 's3-presigned',
}

export type FileConfig = {
  driver: FileDriver;
  accessKeyId?: string;
  secretAccessKey?: string;
  awsDefaultS3Bucket?: string;
  awsS3Region?: string;
  /**
   * Endpoint do serviço S3-compatible que o **backend** usa para falar com o
   * storage. `undefined` faz o SDK resolver o endpoint real da AWS.
   * Ex.: `http://minio:9000` (MinIO) ou
   * `https://nyc3.digitaloceanspaces.com` (DigitalOcean Spaces).
   */
  awsS3Endpoint?: string;
  /** `true` para MinIO (path-style); `false` para Spaces (virtual-hosted). */
  awsS3ForcePathStyle: boolean;
  /**
   * Endpoint usado apenas para **assinar URLs entregues ao navegador** (driver
   * `s3-presigned`). Existe porque o host que o backend usa internamente pode
   * não ser resolvível pelo cliente: rodando a API dentro do Docker,
   * `awsS3Endpoint` é `http://minio:9000`, que só existe na rede Docker.
   * Vazio => cai em `awsS3Endpoint` (correto quando a API roda no host e em
   * produção, onde o endpoint do Spaces já é público).
   */
  awsS3PublicEndpoint?: string;
  /**
   * Base pública da URL que o **navegador** usa para abrir o arquivo — não é o
   * mesmo que `awsS3Endpoint`. Introduzida nesta fase; passa a ser consumida na
   * serialização do `File` na Parte 4 (ver `context.md` 4.6, key vs. URL).
   */
  awsS3PublicUrl?: string;
  maxFileSize: number;
};
