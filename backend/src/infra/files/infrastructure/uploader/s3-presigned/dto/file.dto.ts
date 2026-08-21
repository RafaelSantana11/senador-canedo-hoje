import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FileUploadDto {
  @ApiProperty({ example: 'image.jpg' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 138723 })
  @IsNumber()
  fileSize: number;

  /**
   * Neste driver o binário vai do navegador direto para o bucket — a API nunca
   * o vê. Dimensão, portanto, só pode vir declarada (contingência 2 da spec da
   * Parte 5). Opcional: sem ela o arquivo fica com `width`/`height` nulos.
   */
  @ApiPropertyOptional({ type: Number, example: 1920 })
  @IsOptional()
  @IsInt({ message: 'widthInvalid' })
  @Min(1, { message: 'widthInvalid' })
  @Max(100000, { message: 'widthInvalid' })
  width?: number;

  @ApiPropertyOptional({ type: Number, example: 1080 })
  @IsOptional()
  @IsInt({ message: 'heightInvalid' })
  @Min(1, { message: 'heightInvalid' })
  @Max(100000, { message: 'heightInvalid' })
  height?: number;
}
