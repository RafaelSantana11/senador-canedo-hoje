import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from 'src/infra/files/domain/file';

/**
 * O que o **portal** recebe em `GET /banners/serve`.
 *
 * ⚠️ Classe separada do domain administrativo de propósito. A rota é pública, e
 * a forma administrativa carrega `advertiser`, `active` e o id da campanha —
 * dado de negócio que não interessa (nem deve chegar) ao visitante. Aqui não há
 * o que esquecer de remover: o que não está declarado nesta classe não é
 * serializado.
 *
 * O `image` é um `FileType` com **apenas** `id`, `path`, `alt`, `width` e
 * `height` preenchidos — as demais propriedades ficam ausentes da instância e
 * portanto fora do JSON. Em especial `uploadedBy`, que nem é carregado do banco
 * (a relação não é eager).
 */
export class PublicBannerItem {
  @ApiProperty({
    type: () => FileType,
    description:
      'Arquivo já serializado: `path` vem como URL pública pronta para o `src`.',
  })
  image: FileType;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'O `alt` do arquivo, para o `<img alt>` do carrossel.',
  })
  alt: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'https://exemplo.com' })
  linkUrl: string | null;

  @ApiProperty({ type: Number, example: 5000 })
  durationMs: number;
}

/**
 * Mapa posição → itens. Toda posição consultada aparece na resposta, com lista
 * **vazia** quando não há banner ativo — vitrine vazia não é erro, e o portal
 * não deve precisar tratar `404` para renderizar um espaço sem anúncio.
 */
export class PublicBannersResponse {
  @ApiPropertyOptional({ type: () => [PublicBannerItem] })
  top?: PublicBannerItem[];

  @ApiPropertyOptional({ type: () => [PublicBannerItem] })
  middle?: PublicBannerItem[];

  @ApiPropertyOptional({ type: () => [PublicBannerItem] })
  aside?: PublicBannerItem[];

  @ApiPropertyOptional({ type: () => [PublicBannerItem] })
  bottom?: PublicBannerItem[];
}
