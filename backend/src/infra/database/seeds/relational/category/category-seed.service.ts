import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CategoryEntity } from '../../../../../core/categories/infrastructure/persistence/relational/entities/category.entity';
import { slugify } from '../../../../../utils/slug';

/**
 * As categorias que o portal já exibe hoje (`frontend/src/lib/news-data.ts`).
 *
 * ⚠️ "Geral" **não** está aqui de propósito: a tela de publicação do painel
 * inicializa a categoria com esse literal, que não existe na lista do próprio
 * front. Criar a categoria para acomodar o default esconderia o defeito em vez
 * de corrigi-lo — está registrado na spec de integração para o front ajustar.
 */
const CATEGORIES = [
  'Política',
  'Economia',
  'Mundo',
  'Tecnologia',
  'Esportes',
  'Saúde',
  'Cultura',
  'Meio Ambiente',
];

@Injectable()
export class CategorySeedService {
  private readonly logger = new Logger(CategorySeedService.name);

  constructor(
    @InjectRepository(CategoryEntity)
    private repository: Repository<CategoryEntity>,
  ) {}

  /**
   * Idempotente por nome: rodar o seed de novo não duplica nem sobrescreve
   * `description`/`color`/`active` de categoria que alguém já editou no painel.
   */
  async run() {
    for (const name of CATEGORIES) {
      const exists = await this.repository.count({ where: { name } });

      if (exists) {
        continue;
      }

      await this.repository.save(
        this.repository.create({
          name,
          slug: slugify(name),
          description: null,
          color: null,
          active: true,
        }),
      );

      this.logger.log(`Categoria criada: ${name}`);
    }
  }
}
