import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Campos editoriais aceitos no payload do signup (`POST /api/v1/users`). Não
 * existe rota `POST /api/v1/authors`: o `Author` nasce junto do `User`, na mesma
 * transação — criar um autor solto produziria autor sem login, furando o 1:1.
 *
 * `slug` não entra aqui de propósito: é gerado a partir do `User.name`. Para
 * ajustá-lo depois existe o `PATCH /api/v1/authors/:id`.
 */
export class CreateAuthorDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Repórter de política há 12 anos.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Se o autor aparece na seção "Colunistas" do portal.',
  })
  @IsOptional()
  @IsBoolean()
  isColumnist?: boolean;
}
