import { PartialType } from '@nestjs/swagger';

import { CreateBannerDto } from './create-banner.dto';

/**
 * Todo campo é opcional; o que não vier não é tocado.
 *
 * Ponto de contrato que vale lembrar: **`items` substitui a lista inteira**.
 * `items: []` esvazia o carrossel; omitir `items` mantém o que está lá. É a
 * mesma semântica de `tags` em News, que o front já conhece.
 */
export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
