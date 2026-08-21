import { Injectable, Logger } from '@nestjs/common';
import fs from 'node:fs/promises';
import path from 'node:path';

import { StorageRemover } from '../storage-remover';

/**
 * Driver `local`: o binário está em `./files`, e o `path` gravado no banco é a
 * rota HTTP que o serve (`/api/v1/files/download/<nome>`).
 */
@Injectable()
export class LocalStorageRemover implements StorageRemover {
  private readonly logger = new Logger(LocalStorageRemover.name);

  async remove(storedPath: string): Promise<void> {
    // `basename` cobre tanto o formato atual quanto o anterior à Parte 5
    // (`/api/v1/files/<nome>`, sem o segmento `download`) — e, de quebra,
    // impede que um `path` malformado escape do diretório `./files`.
    const fileName = path.basename(storedPath);

    if (!fileName) {
      return;
    }

    try {
      await fs.unlink(path.join('./files', fileName));
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        // Objeto já não existe: nada a fazer, e não é motivo para falhar.
        return;
      }

      throw error;
    }
  }
}
