import { ApiProperty } from '@nestjs/swagger';

/**
 * Quem subiu o arquivo, achatado ao mínimo (`id`, `slug`, `name`).
 *
 * ⚠️ Deliberadamente **não** é o domain `Author`: aninhar o `Author` completo
 * traria a foto (que é um `File`, que teria um `uploadedBy`, que teria uma
 * foto...) e criaria import circular entre `FileMapper` e `AuthorMapper`.
 * Três campos é tudo que o painel exibe na coluna "enviado por".
 */
export class FileUploader {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({ type: String, example: 'mariana-costa' })
  slug: string;

  @ApiProperty({ type: String, example: 'Mariana Costa' })
  name: string;
}
