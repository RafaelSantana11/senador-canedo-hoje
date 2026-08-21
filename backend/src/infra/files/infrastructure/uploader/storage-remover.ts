/**
 * A **única** parte da exclusão de arquivo que é específica de driver: tirar o
 * objeto do storage. Toda a regra de negócio (checagem das três referências,
 * ordem das operações, resposta) mora em `FilesService`, num lugar só.
 *
 * Usado como token de injeção (mesmo padrão de `FileRepository`): cada módulo de
 * uploader provê a sua implementação, e `FilesModule` recebe a do driver ativo.
 *
 * Contrato: **não lançar** quando o objeto já não existe. O registro no banco é
 * a fonte de verdade; um objeto ausente no bucket é lixo a menos, não erro.
 */
export abstract class StorageRemover {
  abstract remove(path: string): Promise<void>;
}
