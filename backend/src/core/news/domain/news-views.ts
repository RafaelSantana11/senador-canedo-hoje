import { ApiProperty } from '@nestjs/swagger';

/**
 * Contagem de leituras de uma notícia, sem o resto do payload.
 *
 * Existe separada de `News` porque o cliente cacheia as listagens: o `views`
 * que chega dentro delas é o retrato do momento em que foram lidas. Quem precisa
 * do número atual (para exibir ou ordenar) consulta só isto, em lote.
 */
export class NewsViews {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({ type: Number, example: 42 })
  views: number;
}

export class NewsViewsResponse {
  @ApiProperty({
    type: () => [NewsViews],
    description:
      'Só notícias publicadas, ordenadas por `views` decrescente. Id ' +
      'inexistente, rascunho ou arquivada é omitido.',
  })
  data: NewsViews[];
}
