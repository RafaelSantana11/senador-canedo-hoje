import { ApiProperty } from '@nestjs/swagger';

/** Quem gravou por último — só aparece no `GET` autenticado e nas respostas de `PATCH`/reset. */
export class SettingsUpdater {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: String, example: 'Super Admin' })
  name: string;
}
